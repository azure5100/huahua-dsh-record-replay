/**
 * Shared data types, used by both the host half (scanning/parsing) and the
 * browser half (viewing). Pure types only — no node imports, so the client
 * bundle can import this module safely.
 */

/** One raw record from a session JSONL log. */
export interface RawEvent {
  type: string
  seq?: number
  time?: number
  data?: Record<string, unknown>
}

/** Session summary for the library list. */
export interface SessionSummary {
  id: string
  cwd?: string
  createdAt: number
  agentPreset?: string
  title?: string
  /** Absolute path of the log artifact (kept host-side). */
  path?: string
  /** Compressed size in bytes. */
  sizeBytes: number
  modifiedAt: number
  /** Number of raw JSONL lines. */
  messageCount: number
}

/** Distilled session metadata (from the header + session/title records). */
export interface SessionMeta {
  id: string
  cwd?: string
  createdAt: number
  agentPreset?: string
  title?: string
  turns: number
  steps: number
  userMessages: number
  assistantMessages: number
  toolCalls: number
}

export interface TurnMarker { kind: 'turn'; turn: number; time: number }
export interface StepMarker { kind: 'step'; turn: number; step: number; time: number }
export interface UserItem { kind: 'user'; turn: number; step: number; text: string; time: number; id?: string }
export interface AssistantItem {
  kind: 'assistant'
  turn: number
  step: number
  text: string
  reasoning?: string
  time: number
}
export interface ToolItem {
  kind: 'tool'
  turn: number
  step: number
  name: string
  callId: string
  /** Raw JSON arguments string (pretty-printed for display by the viewer). */
  argsText: string
  time: number
}
export interface ResultItem {
  kind: 'result'
  turn: number
  step: number
  callId: string
  text: string
  ok?: boolean
  time: number
}

/** A distilled replay-timeline entry. */
export type TimelineItem = TurnMarker | StepMarker | UserItem | AssistantItem | ToolItem | ResultItem

/** Portable, shareable replay pack (JSON). */
export interface ReplayPack {
  format: 'dsh-replay-pack'
  version: 1
  meta: {
    title?: string
    cwd?: string
    createdAt?: number
    agentPreset?: string
    exportedAt: number
    sourceSessionId?: string
    notes?: string
  }
  /** Distilled timeline (turn/step markers stripped). */
  items: TimelineItem[]
}

/** Pack summary for the packs tab. */
export interface PackSummary {
  id: string
  file: string
  meta: ReplayPack['meta']
  itemCount: number
  userMessages: number
  modifiedAt: number
}
/** One screen recording (computer-use capture). */
export interface RecordingMeta {
  id: string
  title: string
  createdAt: number
  endedAt?: number
  frames: number
  videoBytes?: number
}

export interface RecordingSummary extends RecordingMeta {
  /** Recording directory (host-side). */
  path: string
}

/** A skill installed by the plugin (written into a watched skills root). */
export interface InstalledSkill {
  name: string
  description: string
  path: string
}
