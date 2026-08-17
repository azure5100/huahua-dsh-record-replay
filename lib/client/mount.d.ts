import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client';
import type { ReplayApi } from './api.ts';
import type { PanelController } from './controller.ts';
/** The injected panel container (kept in the DOM, hidden when inactive). */
export declare const PANEL_VIEW_SELECTOR = "[data-huahua-dsh-record-replay-view]";
/** The runtime faces the re-run feature needs. */
export interface ReplayRuntimeFaces {
    sessions: {
        list: {
            getSnapshot(): {
                phase: string;
                byId: Record<string, {
                    running: boolean;
                }>;
            };
            subscribe(fn: () => void): () => void;
        };
        binding(id: string): {
            session: ReplaySessionDriver;
        } | undefined;
        open(id: string): void;
    };
    workspaces: {
        list: {
            getSnapshot(): {
                items: readonly {
                    workspaceId: string;
                }[];
                recentWorkspaceId: string | undefined;
            };
        };
        connectWorkspace(workspaceId: string): Promise<string>;
    };
    connection: ConnectionHandle;
}
/** The narrow session-driver face the re-run needs. */
export interface ReplaySessionDriver {
    rename(title: string): Promise<unknown>;
    prompt(content: readonly unknown[], mode: 'queue'): Promise<{
        ok: true;
    } | {
        ok: false;
        error: unknown;
    }>;
    getSnapshot(): {
        running: boolean;
        lastAgentError: string | null;
        turnEnds: ReadonlyMap<number, number>;
    };
    subscribe(fn: () => void): () => void;
}
/**
 * Mount the panel React tree into the center column and bind its visibility
 * to the controller's panelOpen state.
 */
export declare function mountPanel(controller: PanelController, api: ReplayApi, runtime: ReplayRuntimeFaces): () => void;
//# sourceMappingURL=mount.d.ts.map