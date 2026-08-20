/**
 * Replay pack: the portable, shareable artifact of a recorded session.
 *
 * A pack is a single JSON file (format "dsh-replay-pack") with the distilled
 * timeline plus metadata — small enough to diff in git, easy to share via a
 * GitHub repo, and self-describing enough that the viewer can render it
 * without the original session files.
 */
import { createHash } from 'node:crypto';
import { invariant } from "./invariant.js";
export const REPLAY_PACK_FORMAT = 'dsh-replay-pack';
export const REPLAY_PACK_VERSION = 1;
/**
 * Build a shareable pack from a session's meta + timeline.
 * @param meta - distilled session metadata.
 * @param items - full timeline (turn/step markers are stripped).
 * @param notes - optional sharer note.
 * @returns the pack.
 */
export function buildReplayPack(meta, items, notes) {
    return {
        format: REPLAY_PACK_FORMAT,
        version: REPLAY_PACK_VERSION,
        meta: {
            title: meta.title,
            cwd: meta.cwd,
            createdAt: meta.createdAt,
            agentPreset: meta.agentPreset,
            exportedAt: Date.now(),
            sourceSessionId: meta.id,
            ...(notes !== undefined && notes !== '' ? { notes } : {}),
        },
        items: items.filter(item => item.kind !== 'turn' && item.kind !== 'step'),
    };
}
/** Serialize a pack to pretty JSON (git-friendly). */
export function serializeReplayPack(pack) {
    return JSON.stringify(pack, null, 2);
}
/**
 * Parse + validate a pack from text. Throws on malformed input.
 * @param text - the pack JSON.
 * @returns the validated pack.
 */
export function parseReplayPack(text) {
    let raw;
    try {
        raw = JSON.parse(text);
    }
    catch {
        throw new Error('replay pack: invalid JSON');
    }
    invariant(typeof raw === 'object' && raw !== null, 'replay pack: not an object');
    const pack = raw;
    invariant(pack.format === REPLAY_PACK_FORMAT, `replay pack: unsupported format ${String(pack.format)}`);
    invariant(pack.version === REPLAY_PACK_VERSION, `replay pack: unsupported version ${String(pack.version)}`);
    invariant(typeof pack.meta === 'object' && pack.meta !== null, 'replay pack: missing meta');
    invariant(Array.isArray(pack.items), 'replay pack: missing items');
    return pack;
}
/** Stable id for one pack (content-addressed by exportedAt + source id). */
export function packIdOf(pack) {
    const seed = [pack.meta.sourceSessionId ?? '', String(pack.meta.exportedAt), pack.meta.title ?? ''].join('|');
    return createHash('sha1').update(seed).digest('hex').slice(0, 12);
}
/** Sanitized file name for a pack download. */
export function packFileName(pack) {
    const baseName = pack.meta.title ?? pack.meta.sourceSessionId ?? 'session';
    const slug = baseName
        .replace(/[\\/:*?"<>|\s]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'replay';
    return `${slug}.replay.json`;
}
/** File name used inside the pack store (id-addressed). */
export function packStoreFileName(pack) {
    return `${packIdOf(pack)}.json`;
}
//# sourceMappingURL=replay-pack.js.map