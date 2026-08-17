/**
 * Session store: scans the DSH home sessions tree and decodes the JSONL
 * transcripts the persistence backend writes automatically. Every session
 * is already recorded — this plugin only reads.
 *
 * Layout: <DSH_HOME>/sessions/<project-slug>/session-<uuid>/session.jsonl.zstd
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { decompressZstdToText, decodeZstdPrefix } from "./zstd.js";
import { SESSIONS_ROOT } from "./paths.js";
/** Parse newline-delimited JSON records, skipping empty and torn lines. */
function parseLines(text) {
    const events = [];
    for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed === '')
            continue;
        try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed.type === 'string')
                events.push(parsed);
        }
        catch {
            // A torn tail line (truncated write) is expected on crash; skip it.
        }
    }
    return events;
}
/** Decode one JSONL artifact (zstd or plain) into parsed records. */
export function decodeSessionFile(file, raw) {
    const text = file.endsWith('.zstd') ? decompressZstdToText(raw) : new TextDecoder().decode(raw);
    return parseLines(text);
}
/** Decode only the leading frames — enough for the list summary (header + title). */
function decodeSessionPrefix(file, raw) {
    const text = file.endsWith('.zstd') ? decodeZstdPrefix(raw) : new TextDecoder().decode(raw);
    return parseLines(text);
}
/** Read a session log artifact (resolving .zstd vs plain .jsonl). */
export async function readSessionFile(sessionDir) {
    const candidates = [join(sessionDir, 'session.jsonl.zstd'), join(sessionDir, 'session.jsonl')];
    for (const file of candidates) {
        let raw;
        try {
            raw = new Uint8Array(await readFile(file));
        }
        catch {
            continue;
        }
        return { file, events: decodeSessionFile(file, raw) };
    }
    return undefined;
}
/** Read only the session header prefix of a log artifact (list fast path). */
async function readSessionPrefix(sessionDir) {
    const candidates = [join(sessionDir, 'session.jsonl.zstd'), join(sessionDir, 'session.jsonl')];
    for (const file of candidates) {
        let raw;
        try {
            raw = new Uint8Array(await readFile(file));
        }
        catch {
            continue;
        }
        return { file, events: decodeSessionPrefix(file, raw) };
    }
    return undefined;
}
/** Parse the header line into the summary shape. The header record carries its
 * fields at the top level ({type:'session', version, id, createdAt, cwd, ...}). */
function summarize(events, file, sizeBytes, modifiedAt) {
    const header = events.find(event => event.type === 'session');
    const top = header ?? {};
    const data = header?.data ?? {};
    const titleEvent = events.find(event => event.type === 'session/title');
    const titleData = titleEvent?.data;
    const id = typeof top.id === 'string' ? top.id : (typeof data.id === 'string' ? data.id : '');
    return {
        id,
        cwd: typeof top.cwd === 'string' ? top.cwd : (typeof data.cwd === 'string' ? data.cwd : undefined),
        createdAt: typeof top.createdAt === 'number' ? top.createdAt : (typeof data.createdAt === 'number' ? data.createdAt : 0),
        agentPreset: typeof top.agentPreset === 'string' ? top.agentPreset : (typeof data.agentPreset === 'string' ? data.agentPreset : undefined),
        title: typeof titleData?.title === 'string' && titleData.title !== '' ? titleData.title : undefined,
        path: file,
        sizeBytes,
        modifiedAt,
        messageCount: events.length,
    };
}
/**
 * Scan the whole sessions tree. The list fast path decodes only the leading
 * zstd frames (header + early title) per artifact, so large transcripts cost
 * milliseconds each; the viewer re-reads full events on demand.
 */
export class SessionStore {
    root;
    /** @param root - sessions root (defaults to the DSH home layout). */
    constructor(root = SESSIONS_ROOT) {
        this.root = root;
    }
    /** List every recorded session, newest first. Never throws. */
    async list() {
        const out = [];
        let projects;
        try {
            projects = await readdir(this.root);
        }
        catch {
            return out;
        }
        for (const project of projects) {
            if (project.startsWith('.'))
                continue;
            const projectDir = join(this.root, project);
            let sessions;
            try {
                sessions = await readdir(projectDir);
            }
            catch {
                continue;
            }
            for (const dir of sessions) {
                if (!dir.startsWith('session-'))
                    continue;
                const sessionDir = join(projectDir, dir);
                const read = await readSessionPrefix(sessionDir);
                if (read === undefined)
                    continue;
                const info = await stat(read.file).catch(() => undefined);
                out.push(summarize(read.events, read.file, info?.size ?? 0, info?.mtimeMs ?? 0));
            }
        }
        out.sort((a, b) => b.createdAt - a.createdAt);
        return out;
    }
    /** Read one session by id (matching the header id). */
    async read(id) {
        if (id === '' || /[^a-zA-Z0-9-]/.test(id))
            return undefined;
        const summaries = await this.list();
        const summary = summaries.find(entry => entry.id === id);
        if (summary === undefined || summary.path === undefined)
            return undefined;
        const raw = new Uint8Array(await readFile(summary.path));
        return { summary, events: decodeSessionFile(summary.path, raw) };
    }
}
//# sourceMappingURL=session-store.js.map