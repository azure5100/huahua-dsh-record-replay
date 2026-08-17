import type { RawEvent, SessionSummary } from './types.ts';
/** Result of decoding one session log. */
export interface SessionLog {
    summary: SessionSummary;
    events: RawEvent[];
}
/** Decode one JSONL artifact (zstd or plain) into parsed records. */
export declare function decodeSessionFile(file: string, raw: Uint8Array): RawEvent[];
/** Read a session log artifact (resolving .zstd vs plain .jsonl). */
export declare function readSessionFile(sessionDir: string): Promise<{
    file: string;
    events: RawEvent[];
} | undefined>;
/**
 * Scan the whole sessions tree. The list fast path decodes only the leading
 * zstd frames (header + early title) per artifact, so large transcripts cost
 * milliseconds each; the viewer re-reads full events on demand.
 */
export declare class SessionStore {
    private readonly root;
    /** @param root - sessions root (defaults to the DSH home layout). */
    constructor(root?: string);
    /** List every recorded session, newest first. Never throws. */
    list(): Promise<SessionSummary[]>;
    /** Read one session by id (matching the header id). */
    read(id: string): Promise<SessionLog | undefined>;
}
//# sourceMappingURL=session-store.d.ts.map