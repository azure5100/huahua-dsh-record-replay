import type { ReplayPack, SessionMeta, TimelineItem } from './types.ts';
export declare const REPLAY_PACK_FORMAT = "dsh-replay-pack";
export declare const REPLAY_PACK_VERSION = 1;
/**
 * Build a shareable pack from a session's meta + timeline.
 * @param meta - distilled session metadata.
 * @param items - full timeline (turn/step markers are stripped).
 * @param notes - optional sharer note.
 * @returns the pack.
 */
export declare function buildReplayPack(meta: SessionMeta, items: readonly TimelineItem[], notes?: string): ReplayPack;
/** Serialize a pack to pretty JSON (git-friendly). */
export declare function serializeReplayPack(pack: ReplayPack): string;
/**
 * Parse + validate a pack from text. Throws on malformed input.
 * @param text - the pack JSON.
 * @returns the validated pack.
 */
export declare function parseReplayPack(text: string): ReplayPack;
/** Stable id for one pack (content-addressed by exportedAt + source id). */
export declare function packIdOf(pack: ReplayPack): string;
/** Sanitized file name for a pack download. */
export declare function packFileName(pack: ReplayPack): string;
/** File name used inside the pack store (id-addressed). */
export declare function packStoreFileName(pack: ReplayPack): string;
//# sourceMappingURL=replay-pack.d.ts.map