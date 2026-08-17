/**
 * Timeline distillation: turns the raw session event stream into a readable
 * replay timeline (user messages, assistant replies, tool calls, tool
 * results) plus a compact metadata summary. System-injected user/message
 * records (source.kind === "plugin", e.g. runtime-context snapshots and
 * skill reminders) are skipped — they are noise, not conversation.
 */
import type { AssistantItem, RawEvent, SessionMeta, TimelineItem, ToolItem, UserItem } from './types.ts'

interface ContentPart { type?: string; text?: unknown; content?: unknown }

/** Concatenate the text parts of a Vercel-style content array. */
function textOfContent(content: unknown): string {
  if (!Array.isArray(content)) return ''
  const parts: string[] = []
  for (const part of content) {
    if (typeof part !== 'object' || part === null) continue
    const item = part as ContentPart
    if (item.type === 'text' && typeof item.text === 'string' && item.text !== '') parts.push(item.text)
  }
  return parts.join('\n')
}

/** First reasoning part of a content array (collapsed in the viewer). */
function reasoningOfContent(content: unknown): string | undefined {
  if (!Array.isArray(content)) return undefined
  for (const part of content) {
    if (typeof part !== 'object' || part === null) continue
    const item = part as ContentPart
    if (item.type === 'reasoning' && typeof item.text === 'string' && item.text !== '') return item.text
  }
  return undefined
}

/** Text of a tool/result message (tool-result parts + any text parts). */
function resultTextOfMessage(message: unknown): { text: string; ok: boolean | undefined } {
  if (typeof message !== 'object' || message === null) return { text: '', ok: undefined }
  const content = (message as { content?: unknown }).content
  if (!Array.isArray(content)) return { text: '', ok: undefined }
  const parts: string[] = []
  let ok: boolean | undefined
  for (const part of content) {
    if (typeof part !== 'object' || part === null) continue
    const item = part as ContentPart
    if (item.type === 'tool-result') {
      const inner = Array.isArray(item.content) ? textOfContent(item.content) : ''
      if (inner !== '') parts.push(inner)
    } else if (item.type === 'text' && typeof item.text === 'string' && item.text !== '') {
      parts.push(item.text)
    }
  }
  return { text: parts.join('\n'), ok }
}

/**
 * Distill raw session events into meta + timeline items.
 * @param events - parsed JSONL records (see session-store).
 * @returns metadata summary and the ordered timeline.
 */
export function parseTimeline(events: readonly RawEvent[]): { meta: SessionMeta; items: TimelineItem[] } {
  const meta: SessionMeta = {
    id: '',
    createdAt: 0,
    turns: 0,
    steps: 0,
    userMessages: 0,
    assistantMessages: 0,
    toolCalls: 0,
  }
  const items: TimelineItem[] = []
  let turn = 0
  let step = 0
  let title: string | undefined
  for (const event of events) {
    const data = event.data ?? {}
    const time = event.time ?? 0
    switch (event.type) {
      case 'session': {
        // The header record carries its fields at the top level, not in data.
        const top = event as { id?: unknown; createdAt?: unknown; cwd?: unknown; agentPreset?: unknown }
        meta.id = typeof top.id === 'string' ? top.id : (typeof data.id === 'string' ? data.id : '')
        meta.createdAt = typeof top.createdAt === 'number' ? top.createdAt : (typeof data.createdAt === 'number' ? data.createdAt : 0)
        meta.cwd = typeof top.cwd === 'string' ? top.cwd : (typeof data.cwd === 'string' ? data.cwd : undefined)
        meta.agentPreset = typeof top.agentPreset === 'string' ? top.agentPreset : (typeof data.agentPreset === 'string' ? data.agentPreset : undefined)
        break
      }
      case 'session/title': {
        const value = (data as { title?: unknown }).title
        if (typeof value === 'string' && value !== '') title = value
        break
      }
      case 'turn/start': {
        const value = (data as { turn?: unknown }).turn
        if (typeof value === 'number') {
          turn = value
          meta.turns = Math.max(meta.turns, value)
          items.push({ kind: 'turn', turn: value, time })
        }
        break
      }
      case 'step/start': {
        const turnValue = (data as { turn?: unknown }).turn
        const stepValue = (data as { step?: unknown }).step
        if (typeof turnValue === 'number' && typeof stepValue === 'number') {
          step = stepValue
          meta.steps = Math.max(meta.steps, stepValue)
          items.push({ kind: 'step', turn: turnValue, step: stepValue, time })
        }
        break
      }
      case 'user/message': {
        const source = (data as { source?: unknown }).source
        const sourceKind = typeof source === 'object' && source !== null ? (source as { kind?: unknown }).kind : undefined
        if (sourceKind !== 'user') break // skip runtime-context / skill-reminder injections
        const text = textOfContent((data as { content?: unknown }).content)
        if (text === '') break
        const id = (data as { id?: unknown }).id
        meta.userMessages += 1
        const user: UserItem = { kind: 'user', turn, step, text, time }
        if (typeof id === 'string') user.id = id
        items.push(user)
        break
      }
      case 'assistant/message': {
        const message = (data as { message?: unknown }).message
        if (typeof message !== 'object' || message === null) break
        const content = (message as { content?: unknown }).content
        const text = textOfContent(content)
        const reasoning = reasoningOfContent(content)
        if (text === '' && reasoning === undefined) break
        meta.assistantMessages += 1
        const assistant: AssistantItem = { kind: 'assistant', turn, step, text, time }
        if (reasoning !== undefined) assistant.reasoning = reasoning
        items.push(assistant)
        break
      }
      case 'tool/call': {
        const name = (data as { name?: unknown }).name
        if (typeof name !== 'string') break
        const callId = (data as { callId?: unknown }).callId
        const argsText = (data as { arguments?: unknown }).arguments
        meta.toolCalls += 1
        const tool: ToolItem = {
          kind: 'tool',
          turn,
          step,
          name,
          callId: typeof callId === 'string' ? callId : '',
          argsText: typeof argsText === 'string' ? argsText : '',
          time,
        }
        items.push(tool)
        break
      }
      case 'tool/result': {
        const message = (data as { message?: unknown }).message
        const source = typeof message === 'object' && message !== null ? (message as { source?: unknown }).source : undefined
        const callId = typeof source === 'object' && source !== null ? (source as { callId?: unknown }).callId : undefined
        const { text, ok } = resultTextOfMessage(message)
        items.push({
          kind: 'result',
          turn,
          step,
          callId: typeof callId === 'string' ? callId : '',
          text,
          ok,
          time,
        })
        break
      }
    }
  }
  meta.title = title
  return { meta, items }
}

/** Extract the user messages of a timeline (the re-run seed). */
export function extractUserMessages(items: readonly TimelineItem[]): UserItem[] {
  return items.filter((item): item is UserItem => item.kind === 'user')
}