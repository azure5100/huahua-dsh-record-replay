import type { PackSummary, ReplayPack } from './types.ts';
export declare class PackStore {
    private readonly root;
    /** @param root - packs directory (defaults to the DSH home layout). */
    constructor(root?: string);
    private ensureDir;
    /** Save (or overwrite) one pack; returns its summary. */
    save(pack: ReplayPack): Promise<PackSummary>;
    /** List every stored pack, newest first. Never throws. */
    list(): Promise<PackSummary[]>;
    /** Read one pack by id. */
    read(id: string): Promise<ReplayPack | undefined>;
    private readId;
    /** Delete one pack by id. */
    remove(id: string): Promise<boolean>;
}
//# sourceMappingURL=pack-store.d.ts.map