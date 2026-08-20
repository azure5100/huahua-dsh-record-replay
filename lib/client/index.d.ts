/**
 * Browser-half entry for the dsh-record-replay plugin — runs inside the dsh
 * web GUI. Registers the locale dictionaries, injects the stylesheet, and
 * mounts the two DOM surfaces: the sidebar entry row and the replay panel in
 * the center column. Failure policy: DOM mounting problems are logged, never
 * thrown — an external plugin must not take the GUI down.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type ReplayKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Record-replay surface copy. */
        'record-replay': ReplayKey;
    }
}
/** Required services (fiber inject waiting — the runtime must be up first). */
export declare const inject: string[];
/** Type-only surface (export discipline: no value exports beyond the plugin contract). */
export type { ViewerSource } from './panel/ReplayPanel.tsx';
export type { ReplayRuntimeFaces, ReplaySessionDriver } from './mount.tsx';
/**
 * Mount the replay panel.
 * @param ctx - client root context (services: sessions, workspaces, connection).
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map