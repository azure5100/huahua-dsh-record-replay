/**
 * Browser-half entry for the huahua-dsh-record-replay plugin — runs inside the dsh
 * web GUI. Registers the locale dictionaries, injects the stylesheet, and
 * mounts the two DOM surfaces: the sidebar entry row and the replay panel in
 * the center column. Failure policy: DOM mounting problems are logged, never
 * thrown — an external plugin must not take the GUI down.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { ReplayApi } from './api.ts'
import { en, zh, type ReplayKey } from './locales.ts'
import { PanelController } from './controller.ts'
import { mountPanel } from './mount.tsx'
import { mountSidebarEntry } from './sidebar-entry.ts'
import { STYLES_CSS } from './styles.ts'

/** Locale namespace this plugin owns. */
const NS = 'record-replay'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Record-replay surface copy. */
    'record-replay': ReplayKey
  }
}

/** Required services (fiber inject waiting — the runtime must be up first). */
export const inject = ['slots', 'sessions', 'workspaces', 'connection', 'locale']

/** Type-only surface (export discipline: no value exports beyond the plugin contract). */
export type { ViewerSource } from './panel/ReplayPanel.tsx'
export type { ReplayRuntimeFaces, ReplaySessionDriver } from './mount.tsx'

/**
 * Mount the replay panel.
 * @param ctx - client root context (services: sessions, workspaces, connection).
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'record-replay: dictionaries')

  // Inject the stylesheet once (idempotent; the sidebar entry also guards).
  if (document.querySelector('style[data-plugin-css="huahua-dsh-record-replay"]') === null) {
    const tag = document.createElement('style')
    tag.dataset.plugin = 'huahua-dsh-record-replay'
    tag.dataset.pluginCss = 'huahua-dsh-record-replay'
    tag.textContent = STYLES_CSS
    document.head.appendChild(tag)
  }

  const controller = new PanelController()
  const api = new ReplayApi()
  const disposers: Array<() => void> = []
  try {
    disposers.push(mountSidebarEntry(controller))
    disposers.push(mountPanel(controller, api, {
      sessions: ctx.sessions,
      workspaces: ctx.workspaces,
      connection: ctx.get('connection') as ConnectionHandle,
    }))
  } catch (error) {
    // DOM failures degrade the panel, never the GUI.
    console.warn('[huahua-dsh-record-replay] mount failed:', error)
  }
  ctx.effect(() => () => {
    for (const dispose of disposers.splice(0)) dispose()
  }, 'record-replay: ui mounts')
}
