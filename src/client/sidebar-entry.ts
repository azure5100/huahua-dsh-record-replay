/**
 * Sidebar entry injection. dsh's sidebar shell exposes no slot an external
 * plugin can register into, so — following the task-board/ssh precedent of
 * DOM-level extension — the entry row is injected between the shell's New
 * Session button and the workspace browser, self-healing through a
 * MutationObserver. The row is plain DOM (no React tree).
 */
import type { PanelController } from './controller.ts'
import { tt } from './helpers.ts'
import { STYLES_CSS } from './styles.ts'

/** Stable data attribute identifying the injected entry row. */
export const ENTRY_SELECTOR = '[data-dsh-record-replay-entry]'

/** Inline icon (matches the shell 16px nav-icon look): a film/play glyph. */
const ICON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.8" y="3.2" width="9.4" height="9.6" rx="1.5"/><path d="M11.6 6.2l2.6 1.8-2.6 1.8z"/></svg>'

/** Find the sidebar shell root element, or undefined while not yet mounted. */
function sidebarRoot(): HTMLElement | undefined {
  const column = document.querySelector<HTMLElement>('[data-pane="sidebar"], [class*="sidebarCol"]')
  if (column === null) return undefined
  const logoOwner = column.querySelector<HTMLElement>('[class*="logoRow"]')?.parentElement
  return logoOwner ?? (column.firstElementChild as HTMLElement | undefined)
}

/** The New Session button: nested in the logo row on current shells. */
function newSessionButton(root: HTMLElement): HTMLButtonElement | undefined {
  const nested = root.querySelector<HTMLButtonElement>('button[class*="newSession"]')
  if (nested !== null) return nested
  for (const child of root.children) {
    if (child.tagName === 'BUTTON') return child as HTMLButtonElement
  }
  return undefined
}

/** Build the entry row (a detached button; inserted once the shell is up). */
function createEntry(controller: PanelController): HTMLButtonElement {
  const entry = document.createElement('button')
  entry.type = 'button'
  entry.dataset.dshRecordReplayEntry = ''
  entry.className = 'rrp-entry'
  entry.setAttribute('aria-label', tt('entry.label'))
  entry.setAttribute('title', tt('entry.tooltip'))
  entry.innerHTML = '<span class="rrp-entryIcon">' + ICON + '</span><span class="rrp-entryLabel">' + tt('entry.label') + '</span>'
  entry.addEventListener('click', () => { controller.toggle() })
  return entry
}

/**
 * Re-insert the entry after the New Session row (before the browser region),
 * anchored relative to the family block of sibling plugins so the entries
 * cannot swap positions regardless of observer callback order.
 */
function placeEntry(root: HTMLElement, entry: HTMLButtonElement): boolean {
  const button = newSessionButton(root)
  if (button === undefined) return false
  if (entry.parentElement !== root) {
    const row = button.closest('[class*="logoRow"]')
    const base = (row !== null && row.parentElement === root) ? row : button
    const family = Array.from(root.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.matches('[data-dsh-taskboard-entry], [data-dsh-ssh-entry], [data-dsh-record-replay-entry]'),
    )
    // This plugin sits after the whole family block.
    const anchor = family.length > 0 ? family[family.length - 1].nextElementSibling : base.nextElementSibling
    root.insertBefore(entry, anchor)
  }
  return true
}

/**
 * Mount the sidebar entry, waiting for the shell to render and self-healing
 * on later React re-renders.
 * @param controller - the panel controller the entry toggles.
 * @returns disposer removing the entry and its observers.
 */
export function mountSidebarEntry(controller: PanelController): () => void {
  // Ensure the stylesheet is present (idempotent; index.ts injects it too).
  if (document.querySelector('style[data-plugin-css="dsh-record-replay"]') === null) {
    const tag = document.createElement('style')
    tag.dataset.plugin = 'dsh-record-replay'
    tag.dataset.pluginCss = 'dsh-record-replay'
    tag.textContent = STYLES_CSS
    document.head.appendChild(tag)
  }

  const entry = createEntry(controller)
  let root: HTMLElement | undefined
  let placed = false

  const tryPlace = (): void => {
    if (root !== undefined && !root.isConnected) {
      rootObserver.disconnect()
      root = undefined
      placed = false
    }
    if (placed) {
      if (document.body.contains(entry)) return
      rootObserver.disconnect()
      root = undefined
      placed = false
    }
    root ??= sidebarRoot()
    if (root === undefined) return
    placed = placeEntry(root, entry)
    if (placed) {
      rootObserver.observe(root, { childList: true, subtree: true })
    }
  }

  const waitObserver = new MutationObserver(() => { tryPlace() })
  waitObserver.observe(document.body, { childList: true, subtree: true })

  const rootObserver = new MutationObserver(() => {
    if (root === undefined || !root.isConnected) {
      placed = false
      tryPlace()
      return
    }
    if (!root.contains(entry)) {
      placed = placeEntry(root, entry)
    }
  })

  const syncActive = () => {
    if (controller.getSnapshot().panelOpen) entry.dataset.active = 'true'
    else delete entry.dataset.active
  }
  const unsubscribe = controller.subscribe(syncActive)
  syncActive()

  tryPlace()

  return () => {
    waitObserver.disconnect()
    rootObserver.disconnect()
    unsubscribe()
    entry.remove()
  }
}
