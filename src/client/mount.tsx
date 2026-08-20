/**
 * Panel view mounting. The center column is single-occupant (ui-conversation)
 * and external plugins cannot declare slots, so the panel takes over the
 * center column at the DOM level: a container is appended inside the
 * [data-pane="conversation"] grid item and a stylesheet rule hides the
 * conversation content while the panel is active (see styles.ts). The
 * selector also matches the rc.5 center column ([class*="centerCol"]) so the
 * panel mounts on both the new and the legacy shell DOM.
 */
import { createRoot, type Root } from 'react-dom/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { ReplayApi } from './api.ts'
import type { PanelController } from './controller.ts'
import { ReplayPanel } from './panel/ReplayPanel.tsx'

/** The injected panel container (kept in the DOM, hidden when inactive). */
export const PANEL_VIEW_SELECTOR = '[data-dsh-record-replay-view]'

const CONVERSATION_COLUMN_SELECTOR = '[data-pane="conversation"], [class*="centerCol"]'
const ACTIVE_ATTR = 'data-dsh-record-replay-active'
/** Sibling panels' activation attributes (evicted when this panel opens). */
const OTHER_ACTIVE_ATTRS = ['data-dsh-taskboard-active', 'data-dsh-ssh-active']
/** Cross-plugin activation event; detail is the activating panel name. */
const ACTIVATE_EVENT = 'dsh-panel-activate'
const PANEL_NAME = 'record-replay'

/** The runtime faces the re-run feature needs. */
export interface ReplayRuntimeFaces {
  sessions: {
    list: { getSnapshot(): { phase: string; byId: Record<string, { running: boolean }> }; subscribe(fn: () => void): () => void }
    binding(id: string): { session: ReplaySessionDriver } | undefined
    open(id: string): void
  }
  workspaces: {
    list: { getSnapshot(): { items: readonly { workspaceId: string }[]; recentWorkspaceId: string | undefined } }
    connectWorkspace(workspaceId: string): Promise<string>
  }
  connection: ConnectionHandle
}

/** The narrow session-driver face the re-run needs. */
export interface ReplaySessionDriver {
  rename(title: string): Promise<unknown>
  prompt(content: readonly unknown[], mode: 'queue'): Promise<{ ok: true } | { ok: false; error: unknown }>
  getSnapshot(): { running: boolean; lastAgentError: string | null; turnEnds: ReadonlyMap<number, number> }
  subscribe(fn: () => void): () => void
}

/** Find the center column, or undefined while the frame is not mounted. */
function conversationColumn(): HTMLElement | undefined {
  return document.querySelector<HTMLElement>(CONVERSATION_COLUMN_SELECTOR) ?? undefined
}

/**
 * Mount the panel React tree into the center column and bind its visibility
 * to the controller's panelOpen state.
 */
export function mountPanel(
  controller: PanelController,
  api: ReplayApi,
  runtime: ReplayRuntimeFaces,
): () => void {
  let root: Root | undefined
  let container: HTMLDivElement | undefined

  const ensure = (): void => {
    if (container !== undefined) {
      if (container.isConnected) return
      root?.unmount()
      root = undefined
      container.remove()
      container = undefined
    }
    const column = conversationColumn()
    if (column === undefined) return
    container = document.createElement('div')
    container.dataset.dshRecordReplayView = ''
    container.className = 'rrp-view'
    column.appendChild(container)
    root = createRoot(container)
    root.render(<ReplayPanel controller={controller} api={api} runtime={runtime} />)
  }

  // The frame mounts after boot settlement; watch for the column's arrival.
  const waitObserver = new MutationObserver(() => { ensure() })
  waitObserver.observe(document.body, { childList: true, subtree: true })

  const applyActive = (): void => {
    if (controller.getSnapshot().panelOpen) {
      // Single-occupant center column: evict sibling panels (task board, ssh)
      // both their html attributes and their controller state (they listen
      // for the activate event below and close themselves).
      for (const attr of OTHER_ACTIVE_ATTRS) document.documentElement.removeAttribute(attr)
      document.documentElement.setAttribute(ACTIVE_ATTR, '')
      document.dispatchEvent(new CustomEvent(ACTIVATE_EVENT, { detail: PANEL_NAME }))
    } else {
      document.documentElement.removeAttribute(ACTIVE_ATTR)
    }
  }
  const onOtherActivate = (event: Event): void => {
    const detail = (event as CustomEvent).detail
    if ((detail === 'taskboard' || detail === 'ssh') && controller.getSnapshot().panelOpen) {
      controller.close()
    }
  }
  // Jump out on sidebar context clicks (hand the center column back to chat).
  const SIDEBAR_ROW_SELECTOR = '[class*="sessionRow"], [class*="projectRow"], [class*="searchResultRow"], [class*="searchResultWorkspace"], [class*="newSession"]'
  const onClickSidebarRow = (event: MouseEvent): void => {
    if (!controller.getSnapshot().panelOpen) return
    const target = event.target as HTMLElement | null
    if (target === null) return
    if (target.closest(SIDEBAR_ROW_SELECTOR) !== null) controller.close()
  }
  document.addEventListener('click', onClickSidebarRow, true)
  document.addEventListener(ACTIVATE_EVENT, onOtherActivate)
  const unsubscribe = controller.subscribe(applyActive)
  applyActive()
  ensure()

  return () => {
    document.removeEventListener('click', onClickSidebarRow, true)
    document.removeEventListener(ACTIVATE_EVENT, onOtherActivate)
    waitObserver.disconnect()
    unsubscribe()
    document.documentElement.removeAttribute(ACTIVE_ATTR)
    root?.unmount()
    root = undefined
    container?.remove()
    container = undefined
  }
}
