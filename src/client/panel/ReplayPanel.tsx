import { useCallback, useState } from 'react'
import type { ReplayApi } from '../api.ts'
import type { PanelController } from '../controller.ts'
import type { ReplayRuntimeFaces } from '../mount.tsx'
import type { SessionMeta, TimelineItem, UserItem } from '../../types.ts'
import { tt } from '../helpers.ts'
import { SessionsTab, PacksTab } from './Tabs.tsx'
import { RecordTab } from './RecordTab.tsx'
import { Viewer } from './Viewer.tsx'
import { RunModal } from './RunModal.tsx'

/** What the viewer shows: a recorded session or an imported pack. */
export type ViewerSource =
  | { kind: 'session'; title: string; meta: SessionMeta; items: TimelineItem[]; sessionId: string }
  | { kind: 'pack'; title: string; meta: SessionMeta; items: TimelineItem[]; packId?: string }

export interface ReplayPanelProps {
  controller: PanelController
  api: ReplayApi
  runtime: ReplayRuntimeFaces
}

export function ReplayPanel({ controller, api, runtime }: ReplayPanelProps) {
  const [tab, setTab] = useState<'sessions' | 'packs' | 'record'>('sessions')
  const [viewer, setViewer] = useState<ViewerSource | null>(null)
  const [run, setRun] = useState<{ title: string; userMessages: UserItem[] } | null>(null)

  const openRun = useCallback((title: string, items: TimelineItem[]) => {
    const userMessages = items.filter((item): item is UserItem => item.kind === 'user')
    if (userMessages.length === 0) {
      window.alert('该回放没有可复刻的用户消息')
      return
    }
    setRun({ title, userMessages })
  }, [])

  return (
    <div className="rrp-root">
      <div className="rrp-header">
        <span className="rrp-headerTitle">{viewer === null ? tt('viewer.title') : viewer.title}</span>
        {viewer !== null && <button className="rrp-btn" onClick={() => setViewer(null)}>{tt('viewer.back')}</button>}
        <button className="rrp-btn" onClick={() => controller.close()} title={tt('entry.tooltip')}>{tt('panel.close')}</button>
      </div>
      {viewer === null ? (
        <>
          <div className="rrp-tabs">
            <button className="rrp-tab" data-active={tab === 'sessions' ? '' : undefined} onClick={() => setTab('sessions')}>{tt('tab.sessions')}</button>
            <button className="rrp-tab" data-active={tab === 'packs' ? '' : undefined} onClick={() => setTab('packs')}>{tt('tab.packs')}</button>
            <button className="rrp-tab" data-active={tab === 'record' ? '' : undefined} onClick={() => setTab('record')}>{tt('tab.record')}</button>
          </div>
          <div className="rrp-body">
            {tab === 'sessions' && <SessionsTab api={api} onView={setViewer} onRun={openRun} />}
            {tab === 'packs' && <PacksTab api={api} onView={setViewer} onRun={openRun} />}
            {tab === 'record' && <RecordTab api={api} runtime={runtime} />}
          </div>
        </>
      ) : (
        <Viewer source={viewer} api={api} onRun={openRun} />
      )}
      {run !== null && <RunModal title={run.title} userMessages={run.userMessages} runtime={runtime} onClose={() => setRun(null)} />}
    </div>
  )
}