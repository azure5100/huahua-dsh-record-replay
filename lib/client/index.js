import { ReplayApi } from "./api.js";
import { en, zh } from "./locales.js";
import { PanelController } from "./controller.js";
import { mountPanel } from "./mount.js";
import { mountSidebarEntry } from "./sidebar-entry.js";
import { STYLES_CSS } from "./styles.js";
/** Locale namespace this plugin owns. */
const NS = 'record-replay';
/** Required services (fiber inject waiting — the runtime must be up first). */
export const inject = ['slots', 'sessions', 'workspaces', 'connection', 'locale'];
/**
 * Mount the replay panel.
 * @param ctx - client root context (services: sessions, workspaces, connection).
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'record-replay: dictionaries');
    // Inject the stylesheet once (idempotent; the sidebar entry also guards).
    if (document.querySelector('style[data-plugin-css="dsh-record-replay"]') === null) {
        const tag = document.createElement('style');
        tag.dataset.plugin = 'dsh-record-replay';
        tag.dataset.pluginCss = 'dsh-record-replay';
        tag.textContent = STYLES_CSS;
        document.head.appendChild(tag);
    }
    const controller = new PanelController();
    const api = new ReplayApi();
    const disposers = [];
    try {
        disposers.push(mountSidebarEntry(controller));
        disposers.push(mountPanel(controller, api, {
            sessions: ctx.sessions,
            workspaces: ctx.workspaces,
            connection: ctx.get('connection'),
        }));
    }
    catch (error) {
        // DOM failures degrade the panel, never the GUI.
        console.warn('[dsh-record-replay] mount failed:', error);
    }
    ctx.effect(() => () => {
        for (const dispose of disposers.splice(0))
            dispose();
    }, 'record-replay: ui mounts');
}
//# sourceMappingURL=index.js.map