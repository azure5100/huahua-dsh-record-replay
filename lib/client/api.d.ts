/**
 * Browser-side API client for the /api/huahua-dsh-record-replay route family.
 * Plain fetch, same origin. Types are shared from src/types.ts (pure types
 * only - safe for the client bundle).
 */
import type { InstalledSkill, PackSummary, RecordingMeta, RecordingSummary, ReplayPack, SessionMeta, SessionSummary, TimelineItem } from '../types.ts';
/** Error carrying the route JSON error message. */
export declare class ReplayApiError extends Error {
    constructor(message: string);
}
/** Timeline payload for one session (GET /session). */
export interface SessionTimeline {
    summary: SessionSummary;
    meta: SessionMeta;
    items: TimelineItem[];
}
/** The browser half data entry point. */
export declare class ReplayApi {
    createRecording(title: string): Promise<RecordingMeta>;
    uploadRecordingVideo(id: string, blob: Blob): Promise<void>;
    uploadRecordingFrame(id: string, name: string, blob: Blob): Promise<number>;
    listRecordings(): Promise<RecordingSummary[]>;
    getRecording(id: string): Promise<RecordingMeta>;
    deleteRecording(id: string): Promise<void>;
    /** URL of a recording's video (Range-enabled, for <video> playback). */
    videoUrl(id: string): string;
    /** URL of one sampled frame (usable by the describe_image tool). */
    frameUrl(id: string, name: string): string;
    installSkill(content: string): Promise<InstalledSkill>;
    listSkills(): Promise<InstalledSkill[]>;
    listSessions(): Promise<SessionSummary[]>;
    getSession(id: string): Promise<SessionTimeline>;
    /** Trigger a replay-pack download for one session (browser download). */
    exportPack(sessionId: string, notes?: string): void;
    listPacks(): Promise<PackSummary[]>;
    importPack(pack: ReplayPack): Promise<PackSummary>;
    getPack(id: string): Promise<ReplayPack>;
    deletePack(id: string): Promise<void>;
}
//# sourceMappingURL=api.d.ts.map