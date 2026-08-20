import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Panel view mounting. The center column is single-occupant (ui-conversation)
 * and external plugins cannot declare slots, so the panel takes over the
 * center column at the DOM level: a container is appended inside the
 * [data-pane="conversation"] grid item and a stylesheet rule hides the
 * conversation content while the panel is active (see styles.ts). The
 * selector also matches the rc.5 center column ([class*="centerCol"]) so the
 * panel mounts on both the new and the legacy shell DOM.
 */
import { createRoot } from 'react-dom/client';
import { ReplayPanel } from "./panel/ReplayPanel.js";
/** The injected panel container (kept in the DOM, hidden when inactive). */
export const PANEL_VIEW_SELECTOR = '[data-dsh-record-replay-view]';
const CONVERSATION_COLUMN_SELECTOR = '[data-pane="conversation"], [class*="centerCol"]';
const ACTIVE_ATTR = 'data-dsh-record-replay-active';
/** Sibling panels' activation attributes (evicted when this panel opens). */
const OTHER_ACTIVE_ATTRS = ['data-dsh-taskboard-active', 'data-dsh-ssh-active'];
/** Cross-plugin activation event; detail is the activating panel name. */
const ACTIVATE_EVENT = 'dsh-panel-activate';
const PANEL_NAME = 'record-replay';
/** Find the center column, or undefined while the frame is not mounted. */
function conversationColumn() {
    return document.querySelector(CONVERSATION_COLUMN_SELECTOR) ?? undefined;
}
/**
 * Mount the panel React tree into the center column and bind its visibility
 * to the controller's panelOpen state.
 */
export function mountPanel(controller, api, runtime) {
    let root;
    let container;
    const ensure = () => {
        if (container !== undefined) {
            if (container.isConnected)
                return;
            root?.unmount();
            root = undefined;
            container.remove();
            container = undefined;
        }
        const column = conversationColumn();
        if (column === undefined)
            return;
        container = document.createElement('div');
        container.dataset.dshRecordReplayView = '';
        container.className = 'rrp-view';
        column.appendChild(container);
        root = createRoot(container);
        root.render(_jsx(ReplayPanel, { controller: controller, api: api, runtime: runtime }));
    };
    // The frame mounts after boot settlement; watch for the column's arrival.
    const waitObserver = new MutationObserver(() => { ensure(); });
    waitObserver.observe(document.body, { childList: true, subtree: true });
    const applyActive = () => {
        if (controller.getSnapshot().panelOpen) {
            // Single-occupant center column: evict sibling panels (task board, ssh)
            // both their html attributes and their controller state (they listen
            // for the activate event below and close themselves).
            for (const attr of OTHER_ACTIVE_ATTRS)
                document.documentElement.removeAttribute(attr);
            document.documentElement.setAttribute(ACTIVE_ATTR, '');
            document.dispatchEvent(new CustomEvent(ACTIVATE_EVENT, { detail: PANEL_NAME }));
        }
        else {
            document.documentElement.removeAttribute(ACTIVE_ATTR);
        }
    };
    const onOtherActivate = (event) => {
        const detail = event.detail;
        if ((detail === 'taskboard' || detail === 'ssh') && controller.getSnapshot().panelOpen) {
            controller.close();
        }
    };
    // Jump out on sidebar context clicks (hand the center column back to chat).
    const SIDEBAR_ROW_SELECTOR = '[class*="sessionRow"], [class*="projectRow"], [class*="searchResultRow"], [class*="searchResultWorkspace"], [class*="newSession"]';
    const onClickSidebarRow = (event) => {
        if (!controller.getSnapshot().panelOpen)
            return;
        const target = event.target;
        if (target === null)
            return;
        if (target.closest(SIDEBAR_ROW_SELECTOR) !== null)
            controller.close();
    };
    document.addEventListener('click', onClickSidebarRow, true);
    document.addEventListener(ACTIVATE_EVENT, onOtherActivate);
    const unsubscribe = controller.subscribe(applyActive);
    applyActive();
    ensure();
    return () => {
        document.removeEventListener('click', onClickSidebarRow, true);
        document.removeEventListener(ACTIVATE_EVENT, onOtherActivate);
        waitObserver.disconnect();
        unsubscribe();
        document.documentElement.removeAttribute(ACTIVE_ATTR);
        root?.unmount();
        root = undefined;
        container?.remove();
        container = undefined;
    };
}
//# sourceMappingURL=mount.js.map