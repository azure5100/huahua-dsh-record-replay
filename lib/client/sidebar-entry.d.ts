/**
 * Sidebar entry injection. dsh's sidebar shell exposes no slot an external
 * plugin can register into, so — following the task-board/ssh precedent of
 * DOM-level extension — the entry row is injected between the shell's New
 * Session button and the workspace browser, self-healing through a
 * MutationObserver. The row is plain DOM (no React tree).
 */
import type { PanelController } from './controller.ts';
/** Stable data attribute identifying the injected entry row. */
export declare const ENTRY_SELECTOR = "[data-dsh-record-replay-entry]";
/**
 * Mount the sidebar entry, waiting for the shell to render and self-healing
 * on later React re-renders.
 * @param controller - the panel controller the entry toggles.
 * @returns disposer removing the entry and its observers.
 */
export declare function mountSidebarEntry(controller: PanelController): () => void;
//# sourceMappingURL=sidebar-entry.d.ts.map