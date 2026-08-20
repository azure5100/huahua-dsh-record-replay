/**
 * Replay panel controller: single owner of the panel open/closed state.
 * Framework-free so the DOM mounts and the React panel share one tiny
 * subscription surface.
 */
export class PanelController {
    panelOpen = false;
    listeners = new Set();
    getSnapshot() {
        return { panelOpen: this.panelOpen };
    }
    subscribe(fn) {
        this.listeners.add(fn);
        return () => { this.listeners.delete(fn); };
    }
    open() {
        if (this.panelOpen)
            return;
        this.panelOpen = true;
        this.notify();
    }
    close() {
        if (!this.panelOpen)
            return;
        this.panelOpen = false;
        this.notify();
    }
    toggle() {
        if (this.panelOpen)
            this.close();
        else
            this.open();
    }
    notify() {
        for (const fn of [...this.listeners])
            fn();
    }
}
//# sourceMappingURL=controller.js.map