import { useCallback, useEffect, useState } from 'react'
import type { ReplayApi } from '../api.ts'
import type { PackSummary, SessionSummary, TimelineItem } from '../../types.ts'
import { fill, tt } from '../helpers.ts'
import type { ViewerSource } from './ReplayPanel.tsx'

/** Shared row action cluster for both tabs. */
function RowActions(props: {
  onView: () => void
  onExport?: () => void
  onRun: () => void
  onDelete?: () => void
}) {
  const { onView, onExport, onRun, onDelete } = props
  return (
    <div className="rrp-rowActions">
      <button className="rrp-btn" onClick={onView}>{tt('viewer.title')}</button>
      {onExport !== undefined && <button className="rrp-btn" onClick={onExport}>{tt('session.export')}</button>}
      <button className="rrp-btn" data-primary="" onClick={onRun}>{tt('session.rerun')}</button>
      {onDelete !== undefined && <button className="rrp-btn" data-danger="" onClick={onDelete}>{tt('packs.delete')}</button>}
    </div>
  )
}

/** Format a millisecond timestamp as a local date-time. */
function formatTime(value: number | undefined): string {
  if (typeof value !== 'number' || value <= 0) return '-'
  const date = new Date(value)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Project folder name from a session cwd (basename), else fallback. */
function projectOf(cwd: string | undefined): string {
  if (cwd === undefined || cwd === '') return tt('session.unknownProject')
  const parts = cwd.split('/').filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : cwd
}

export interface SessionsTabProps {
  api: ReplayApi
  onView(viewer: ViewerSource): void
  onRun(title: string, items: TimelineItem[]): void
}

export function SessionsTab({ api, onView, onRun }: SessionsTabProps) {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setSessions(await api.listSessions()) }
    catch (reason) { setError(String(reason)) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => { void load() }, [load])

  const run = async (entry: SessionSummary) => {
    try {
      const timeline = await api.getSession(entry.id)
      onRun(timeline.meta.title ?? entry.id, timeline.items)
    } catch (reason) { window.alert(String(reason)) }
  }

  const view = async (entry: SessionSummary) => {
    try {
      const timeline = await api.getSession(entry.id)
      onView({ kind: 'session', title: timeline.meta.title ?? entry.id, meta: timeline.meta, items: timeline.items, sessionId: entry.id })
    } catch (reason) { window.alert(String(reason)) }
  }

  if (error !== null) return <div className="rrp-error">{tt('sessions.error')}: {error}</div>
  if (sessions === null || loading) return <div className="rrp-note">{tt('sessions.loading')}</div>
  if (sessions.length === 0) return <div className="rrp-empty">{tt('sessions.empty')}</div>

  return (
    <div className="rrp-list">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <button className="rrp-btn" onClick={() => void load()}>{tt('sessions.reload')}</button>
      </div>
      {sessions.map(entry => (
        <div className="rrp-row" key={entry.id}>
          <div className="rrp-rowMain">
            <div className="rrp-rowTitle">{entry.title ?? tt('session.noTitle')}</div>
            <div className="rrp-rowMeta">{projectOf(entry.cwd)} · {formatTime(entry.createdAt)} · {entry.messageCount} 行</div>
          </div>
          <RowActions onView={() => void view(entry)} onExport={() => api.exportPack(entry.id)} onRun={() => void run(entry)} />
        </div>
      ))}
    </div>
  )
}

export interface PacksTabProps {
  api: ReplayApi
  onView(viewer: ViewerSource): void
  onRun(title: string, items: TimelineItem[]): void
}

export function PacksTab({ api, onView, onRun }: PacksTabProps) {
  const [packs, setPacks] = useState<PackSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try { setPacks(await api.listPacks()) }
    catch (reason) { setError(String(reason)) }
  }, [api])

  useEffect(() => { void load() }, [load])

  const onPickFile = async (file: File | undefined) => {
    if (file === undefined) return
    setImporting(true)
    setError(null)
    try {
      const text = await file.text()
      const pack = JSON.parse(text) as import('../../types.ts').ReplayPack
      await api.importPack(pack)
      await load()
      window.alert(`导入成功：${pack.meta.title ?? file.name}`)
    } catch (reason) { setError(String(reason)) }
    finally { setImporting(false) }
  }

  const run = async (entry: PackSummary) => {
    try {
      const pack = await api.getPack(entry.id)
      onRun(pack.meta.title ?? entry.id, pack.items)
    } catch (reason) { window.alert(String(reason)) }
  }

  const view = async (entry: PackSummary) => {
    try {
      const pack = await api.getPack(entry.id)
      onView({ kind: 'pack', title: pack.meta.title ?? entry.id, meta: {
        id: entry.id, createdAt: pack.meta.createdAt ?? 0, turns: 0, steps: 0,
        userMessages: pack.items.filter(item => item.kind === 'user').length,
        assistantMessages: 0, toolCalls: pack.items.filter(item => item.kind === 'tool').length,
        title: pack.meta.title, cwd: pack.meta.cwd, agentPreset: pack.meta.agentPreset,
      }, items: pack.items, packId: entry.id })
    } catch (reason) { window.alert(String(reason)) }
  }

  const remove = async (entry: PackSummary) => {
    if (!window.confirm(`删除回放包「${entry.meta.title ?? entry.id}」？`)) return
    try { await api.deletePack(entry.id); await load() }
    catch (reason) { setError(String(reason)) }
  }

  if (error !== null) return <div className="rrp-error">{error}</div>
  if (packs === null) return <div className="rrp-note">{tt('packs.importing')}</div>

  return (
    <div className="rrp-list">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 4 }}>
        <label className="rrp-btn" data-primary="" style={{ cursor: importing ? 'default' : 'pointer' }}>
          <input
            type='file'
            accept='.json,.replay.json,application/json'
            style={{ display: 'none' }}
            disabled={importing}
            onChange={event => void onPickFile(event.target.files?.[0])}
          />
          {importing ? tt('packs.importing') : tt('packs.import')}
        </label>
      </div>
      {packs.length === 0 && <div className="rrp-empty">{tt('packs.empty')}</div>}
      {packs.map(entry => (
        <div className="rrp-row" key={entry.id}>
          <div className="rrp-rowMain">
            <div className="rrp-rowTitle">{entry.meta.title ?? tt('session.noTitle')}</div>
            <div className="rrp-rowMeta">{formatTime(entry.modifiedAt)} · {entry.itemCount} 条 · {entry.userMessages} 条用户消息{entry.meta.sourceSessionId !== undefined ? ` · ${entry.meta.sourceSessionId}` : ''}</div>
          </div>
          <RowActions onView={() => void view(entry)} onRun={() => void run(entry)} onDelete={() => void remove(entry)} />
        </div>
      ))}
    </div>
  )
}