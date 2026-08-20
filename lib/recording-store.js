/**
 * Recording store: persists computer-use screen recordings (video.webm plus
 * sampled PNG frames) under ~/.dsh/recordings/<id>/. The browser half records
 * via getDisplayMedia and uploads the artifacts here; the replay viewer and
 * the skill generator read them back.
 */
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { RECORDINGS_ROOT } from "./paths.js";
/** Frame file name grammar the store accepts. */
export const FRAME_NAME_PATTERN = /^frame-\d+\.png$/;
/** Fresh recording id (time-based + random, collision-safe enough). */
export function newRecordingId() {
    return Date.now().toString(36) + '-' + randomBytes(4).toString('hex');
}
export class RecordingStore {
    root;
    /** @param root - recordings root (defaults to the DSH home layout). */
    constructor(root = RECORDINGS_ROOT) {
        this.root = root;
    }
    dir(id) {
        return join(this.root, id);
    }
    async readMeta(id) {
        try {
            const text = await readFile(join(this.dir(id), 'metadata.json'), 'utf8');
            const parsed = JSON.parse(text);
            if (typeof parsed.id === 'string' && parsed.id !== '')
                return parsed;
        }
        catch { /* not found or corrupt */ }
        return undefined;
    }
    async writeMeta(meta) {
        await writeFile(join(this.dir(meta.id), 'metadata.json'), JSON.stringify(meta, null, 2), 'utf8');
    }
    /** Create a new recording entry (empty; artifacts uploaded next). */
    async create(title) {
        await mkdir(this.root, { recursive: true });
        const id = newRecordingId();
        await mkdir(this.dir(id), { recursive: true });
        await mkdir(join(this.dir(id), 'frames'), { recursive: true });
        const meta = { id, title, createdAt: Date.now(), frames: 0 };
        await this.writeMeta(meta);
        return meta;
    }
    /** Store the final webm video and stamp endedAt. */
    async saveVideo(id, body) {
        const meta = await this.readMeta(id);
        if (meta === undefined)
            throw new Error('recording not found');
        await writeFile(join(this.dir(id), 'video.webm'), body);
        await this.writeMeta({ ...meta, videoBytes: body.length, endedAt: Date.now() });
    }
    /** Store one sampled PNG frame (name must match the frame grammar). */
    async addFrame(id, name, body) {
        if (!FRAME_NAME_PATTERN.test(name))
            throw new Error('invalid frame name');
        const meta = await this.readMeta(id);
        if (meta === undefined)
            throw new Error('recording not found');
        await mkdir(join(this.dir(id), 'frames'), { recursive: true });
        await writeFile(join(this.dir(id), 'frames', name), body);
        const frames = meta.frames + 1;
        await this.writeMeta({ ...meta, frames });
        return frames;
    }
    /** Read one recording meta by id. */
    async meta(id) {
        if (id === '' || /[^a-zA-Z0-9-]/.test(id))
            return undefined;
        return this.readMeta(id);
    }
    /** List every recording, newest first. Never throws. */
    async list() {
        let entries;
        try {
            entries = await readdir(this.root);
        }
        catch {
            return [];
        }
        const out = [];
        for (const entry of entries) {
            if (entry.startsWith('.'))
                continue;
            const meta = await this.readMeta(entry);
            if (meta === undefined)
                continue;
            out.push({ ...meta, path: this.dir(entry) });
        }
        out.sort((a, b) => b.createdAt - a.createdAt);
        return out;
    }
    /** Absolute path of the stored video (may not exist yet). */
    videoPath(id) {
        return join(this.dir(id), 'video.webm');
    }
    /** Size of the stored video, or 0. */
    async videoSize(id) {
        try {
            const info = await stat(this.videoPath(id));
            return info.size;
        }
        catch {
            return 0;
        }
    }
    /** Absolute path of one frame (undefined for an invalid name). */
    framePath(id, name) {
        if (!FRAME_NAME_PATTERN.test(name))
            return undefined;
        return join(this.dir(id), 'frames', name);
    }
    /** Delete one recording and all its artifacts. */
    async remove(id) {
        if (id === '' || /[^a-zA-Z0-9-]/.test(id))
            return false;
        try {
            await rm(this.dir(id), { recursive: true, force: true });
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=recording-store.js.map