/**
 * Replay panel controller: single owner of the panel open/closed state.
 * Framework-free so the DOM mounts and the React panel share one tiny
 * subscription surface.
 */
export interface PanelControllerSnapshot {
    panelOpen: boolean;
}
export declare class PanelController {
    private panelOpen;
    private listeners;
    getSnapshot(): PanelControllerSnapshot;
    subscribe(fn: () => void): () => void;
    open(): void;
    close(): void;
    toggle(): void;
    private notify;
}
//# sourceMappingURL=controller.d.ts.map