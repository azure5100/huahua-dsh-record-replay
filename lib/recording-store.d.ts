import type { RecordingMeta, RecordingSummary } from './types.ts';
/** Frame file name grammar the store accepts. */
export declare const FRAME_NAME_PATTERN: RegExp;
/** Fresh recording id (time-based + random, collision-safe enough). */
export declare function newRecordingId(): string;
export declare class RecordingStore {
    private readonly root;
    /** @param root - recordings root (defaults to the DSH home layout). */
    constructor(root?: string);
    private dir;
    private readMeta;
    private writeMeta;
    /** Create a new recording entry (empty; artifacts uploaded next). */
    create(title: string): Promise<RecordingMeta>;
    /** Store the final webm video and stamp endedAt. */
    saveVideo(id: string, body: Buffer): Promise<void>;
    /** Store one sampled PNG frame (name must match the frame grammar). */
    addFrame(id: string, name: string, body: Buffer): Promise<number>;
    /** Read one recording meta by id. */
    meta(id: string): Promise<RecordingMeta | undefined>;
    /** List every recording, newest first. Never throws. */
    list(): Promise<RecordingSummary[]>;
    /** Absolute path of the stored video (may not exist yet). */
    videoPath(id: string): string;
    /** Size of the stored video, or 0. */
    videoSize(id: string): Promise<number>;
    /** Absolute path of one frame (undefined for an invalid name). */
    framePath(id: string, name: string): string | undefined;
    /** Delete one recording and all its artifacts. */
    remove(id: string): Promise<boolean>;
}
//# sourceMappingURL=recording-store.d.ts.map