import { useCallback, useEffect, useRef, useState } from 'react'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type { ReplayApi } from '../api.ts'
import type { ReplayRuntimeFaces, ReplaySessionDriver } from '../mount.tsx'
import type { InstalledSkill, RecordingSummary } from '../../types.ts'
import { tt } from '../helpers.ts'

type GenStatus = 'idle' | 'connecting' | 'running' | 'done' | 'error'

/**
 * Read the final assistant text of a session (the SKILL.md the agent emitted).
 * Walks the history backwards to the last assistant/message event and joins
 * its text parts (reasoning excluded).
 */
async function readFinalAssistantText(runtime: ReplayRuntimeFaces, sessionId: string): Promise<string | undefined> {
  const response = await runtime.connection.api.sessions.history({ sessionId: sessionId as SessionId, maxMessages: 30 })
  if (!response.result.ok) return undefined
  const events = response.result.value.events as Array<{ event?: { type?: string; data?: Record<string, unknown> } }>
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]?.event
    if (event === undefined || event.type !== 'assistant/message') continue
    const message = event.data?.message as { content?: unknown } | undefined
    const content = message?.content
    if (!Array.isArray(content)) continue
    const parts: string[] = []
    for (const part of content) {
      if (typeof part !== 'object' || part === null) continue
      const item = part as { type?: string; text?: unknown }
      if (item.type === 'text' && typeof item.text === 'string' && item.text !== '') parts.push(item.text)
    }
    if (parts.length > 0) return parts.join('\n\n')
  }
  return undefined
}

/**
 * Skill generation: spawns a fresh agent session, points it at the recorded
 * frames via the describe_image tool, and installs the SKILL.md it produces
 * into the user skill root (~/.dsh/skills) so it becomes a live skill.
 */
export function SkillGenModal({ api, runtime, recording, onClose }: {
  api: ReplayApi
  runtime: ReplayRuntimeFaces
  recording: RecordingSummary
  onClose(): void
}) {
  const [status, setStatus] = useState<GenStatus>('idle')
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [result, setResult] = useState<InstalledSkill | null>(null)
  const [error, setError] = useState<string | undefined>(undefined)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => {
    if (timerRef.current !== undefined) clearTimeout(timerRef.current)
  }, [])

  const settle = useCallback(async (sid: string) => {
    try {
      const text = await readFinalAssistantText(runtime, sid)
      if (text === undefined || text.trim() === '') {
        setError('agent 没有输出 SKILL.md 内容')
        setStatus('error')
        return
      }
      const skill = await api.installSkill(text)
      setResult(skill)
      setStatus('done')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setStatus('error')
    }
  }, [api, runtime])

  const start = useCallback(async () => {
    if (recording.frames === 0) {
      setError('no frames')
      setStatus('error')
      return
    }
    setStatus('connecting')
    setError(undefined)
    try {
      const list = runtime.workspaces.list.getSnapshot()
      const workspaceId = list.recentWorkspaceId ?? list.items[0]?.workspaceId
      if (workspaceId === undefined) {
        setError('no workspace available')
        setStatus('error')
        return
      }
      const sid = await runtime.workspaces.connectWorkspace(workspaceId)
      setSessionId(sid)
      const binding = runtime.sessions.binding(sid)
      const driver = binding?.session
      if (driver === undefined) {
        setError('session is not ready')
        setStatus('error')
        return
      }
      await driver.rename('技能生成：' + recording.title).catch(() => { /* cosmetic */ })
      const frameLines: string[] = []
      for (let index = 0; index < recording.frames; index += 1) {
        const name = 'frame-' + String(index + 1).padStart(4, '0') + '.png'
        frameLines.push(`${index + 1}. ${api.frameUrl(recording.id, name)}`)
      }
      const prompt = [
        '请观看这段录屏的操作帧，把其中展示的操作流程提炼成一个可复用的 DSH skill。',
        '',
        `录屏标题（背景说明）：${recording.title}`,
        `帧列表（共 ${recording.frames} 帧，请依次用 describe_image 工具查看，可抽样概括）：`,
        ...frameLines,
        '',
        '要求：',
        '1. 逐帧（或合理抽样）调用 describe_image 分析画面内容与操作动作。',
        '2. 总结完整工作流：目标、操作步骤、关键细节、常见边界与注意事项、需要的输入。',
        '3. 输出一个标准 SKILL.md：YAML frontmatter（name 与 description）+ Markdown 正文；name 只能用小写字母、数字与连字符（如 demo-workflow）。',
        '4. 最终回复只输出 SKILL.md 的完整文本（以 --- 开头，不要任何其他文字、解释或代码围栏）。',
      ].join('\n')
      const accepted = await driver.prompt([{ type: 'text', text: prompt }], 'queue')
      if (!accepted.ok) {
        setError(accepted.error !== undefined ? String(accepted.error) : 'prompt rejected')
        setStatus('error')
        return
      }
      setStatus('running')
      const baseline = driver.getSnapshot().turnEnds.size
      const startedAt = Date.now()
      const poll = (): void => {
        const snapshot = driver.getSnapshot()
        if (!snapshot.running && snapshot.turnEnds.size > baseline) {
          void settle(sid)
          return
        }
        if (snapshot.lastAgentError !== null) {
          setError(snapshot.lastAgentError)
          setStatus('error')
          return
        }
        if (Date.now() - startedAt > 30 * 60 * 1000) {
          setError('timeout')
          setStatus('error')
          return
        }
        timerRef.current = setTimeout(poll, 1500)
      }
      poll()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setStatus('error')
    }
  }, [api, runtime, recording, settle])

  const openSession = (): void => {
    if (sessionId !== undefined) runtime.sessions.open(sessionId)
  }

  return (
    <div className="rrp-modalBackdrop" onClick={onClose}>
      <div className="rrp-modal" onClick={event => event.stopPropagation()}>
        <div className="rrp-modalTitle">{tt('record.genSkill')} · {recording.title}</div>
        <div className="rrp-modalBody">
          <div>{tt('skill.framesHint')}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>
            {status === 'connecting' && tt('skill.status.connecting')}
            {status === 'running' && tt('skill.status.running')}
            {status === 'done' && tt('skill.done')}
            {status === 'error' && tt('skill.error')}
          </div>
          {error !== undefined && <div className="rrp-error">{error}</div>}
          {result !== null && (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <strong>{result.name}</strong> — {result.description}
              <div className="rrp-note">{tt('skill.installedAt')}</div>
            </div>
          )}
          {sessionId !== undefined && <div className="rrp-note" style={{ marginTop: 4 }}>session: {sessionId}</div>}
        </div>
        <div className="rrp-modalActions">
          {status === 'done' && sessionId !== undefined && (
            <button className="rrp-btn" onClick={openSession}>{tt('skill.openSession')}</button>
          )}
          {status === 'idle' && <button className="rrp-btn" data-primary="" onClick={() => void start()}>{tt('skill.gen')}</button>}
          {(status === 'idle' || status === 'error' || status === 'done') && <button className="rrp-btn" onClick={onClose}>{tt('run.close')}</button>}
        </div>
      </div>
    </div>
  )
}