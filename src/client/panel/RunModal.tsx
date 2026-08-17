import { useCallback, useEffect, useRef, useState } from 'react'
import type { UserItem } from '../../types.ts'
import type { ReplayRuntimeFaces, ReplaySessionDriver } from '../mount.tsx'
import { fill, tt } from '../helpers.ts'

export type RunStatus = 'idle' | 'connecting' | 'sending' | 'running' | 'done' | 'error'

export function RunModal({ title, userMessages, runtime, onClose }: {
  title: string
  userMessages: UserItem[]
  runtime: ReplayRuntimeFaces
  onClose(): void
}) {
  const [status, setStatus] = useState<RunStatus>('idle')
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [sent, setSent] = useState(0)
  const [error, setError] = useState<string | undefined>(undefined)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => {
    if (timerRef.current !== undefined) clearTimeout(timerRef.current)
  }, [])

  const start = useCallback(async () => {
    if (userMessages.length === 0) return
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
      const newSessionId = await runtime.workspaces.connectWorkspace(workspaceId)
      setSessionId(newSessionId)
      const binding = runtime.sessions.binding(newSessionId)
      const driver = binding?.session
      if (driver === undefined) {
        setError('session is not ready')
        setStatus('error')
        return
      }
      await driver.rename(`回放：${title}`).catch(() => { /* cosmetic */ })
      const baseline = driver.getSnapshot().turnEnds.size
      setStatus('sending')
      for (let index = 0; index < userMessages.length; index += 1) {
        const message = userMessages[index]
        const accepted = await driver.prompt([{ type: 'text', text: message.text }], 'queue')
        if (!accepted.ok) {
          setError(accepted.error !== undefined ? String(accepted.error) : 'prompt rejected')
          setStatus('error')
          return
        }
        setSent(index + 1)
      }
      setStatus('running')
      const startedAt = Date.now()
      const poll = (): void => {
        const snapshot = driver.getSnapshot()
        if (!snapshot.running && snapshot.turnEnds.size >= baseline + userMessages.length) {
          setStatus('done')
          return
        }
        if (snapshot.lastAgentError !== null) {
          setError(snapshot.lastAgentError)
          setStatus('error')
          return
        }
        if (Date.now() - startedAt > 30 * 60 * 1000) {
          setStatus('done')
          return
        }
        timerRef.current = setTimeout(poll, 1500)
      }
      poll()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setStatus('error')
    }
  }, [runtime, title, userMessages])

  const openSession = (): void => {
    if (sessionId !== undefined) runtime.sessions.open(sessionId)
  }

  const progress = fill(tt('run.progress'), { sent, total: userMessages.length })

  return (
    <div className="rrp-modalBackdrop" onClick={onClose}>
      <div className="rrp-modal" onClick={event => event.stopPropagation()}>
        <div className="rrp-modalTitle">{tt('run.title')} · {title}</div>
        <div className="rrp-modalBody">
          <div>{fill(tt('run.msgCount'), { count: userMessages.length })}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>
            {status === 'connecting' && tt('run.status.connecting')}
            {status === 'sending' && `${tt('run.status.sending')} ${progress}`}
            {status === 'running' && tt('run.status.running')}
            {status === 'done' && tt('run.status.done')}
            {status === 'error' && tt('run.status.error')}
          </div>
          {error !== undefined && <div className="rrp-error">{error}</div>}
          {sessionId !== undefined && <div className="rrp-note" style={{ marginTop: 4 }}>session: {sessionId}</div>}
        </div>
        <div className="rrp-modalActions">
          {status === 'done' && sessionId !== undefined && (
            <button className="rrp-btn" data-primary="" onClick={openSession}>{tt('run.openSession')}</button>
          )}
          {status === 'idle' && <button className="rrp-btn" data-primary="" onClick={() => void start()}>{tt('run.start')}</button>}
          {(status === 'idle' || status === 'error' || status === 'done') && <button className="rrp-btn" onClick={onClose}>{tt('run.close')}</button>}
        </div>
      </div>
    </div>
  )
}
