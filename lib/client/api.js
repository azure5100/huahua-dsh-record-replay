import { API_BASE } from "../routes.js";
/** Error carrying the route JSON error message. */
export class ReplayApiError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ReplayApiError';
    }
}
async function readJson(response) {
    let body;
    try {
        body = await response.json();
    }
    catch {
        throw new ReplayApiError("HTTP " + response.status + ": invalid JSON response");
    }
    if (!response.ok) {
        const message = typeof body === 'object' && body !== null && typeof body.error === 'string'
            ? body.error
            : "HTTP " + response.status;
        throw new ReplayApiError(message);
    }
    return body;
}
function query(params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '')
            search.set(key, String(value));
    }
    const text = search.toString();
    return text === '' ? '' : '?' + text;
}
/** The browser half data entry point. */
export class ReplayApi {
    // --------------------------------------------------- recordings
    async createRecording(title) {
        const response = await fetch(API_BASE + '/recordings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ title }),
        });
        const body = await readJson(response);
        return body.recording;
    }
    async uploadRecordingVideo(id, blob) {
        const response = await fetch(API_BASE + '/recording' + query({ id, part: 'video' }), {
            method: 'POST',
            body: blob,
        });
        await readJson(response);
    }
    async uploadRecordingFrame(id, name, blob) {
        const response = await fetch(API_BASE + '/recording' + query({ id, name }), {
            method: 'POST',
            body: blob,
        });
        const body = await readJson(response);
        return body.frames;
    }
    async listRecordings() {
        const response = await fetch(API_BASE + '/recordings');
        const body = await readJson(response);
        return body.recordings;
    }
    async getRecording(id) {
        const response = await fetch(API_BASE + '/recording' + query({ id }));
        const body = await readJson(response);
        return body.recording;
    }
    async deleteRecording(id) {
        const response = await fetch(API_BASE + '/recording' + query({ id }), { method: 'DELETE' });
        await readJson(response);
    }
    /** URL of a recording's video (Range-enabled, for <video> playback). */
    videoUrl(id) {
        return API_BASE + '/video' + query({ id });
    }
    /** URL of one sampled frame (usable by the describe_image tool). */
    frameUrl(id, name) {
        return window.location.origin + API_BASE + '/frame' + query({ id, name });
    }
    // ------------------------------------------------------ skills
    async installSkill(content) {
        const response = await fetch(API_BASE + '/skills', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ content }),
        });
        const body = await readJson(response);
        return body.skill;
    }
    async listSkills() {
        const response = await fetch(API_BASE + '/skills');
        const body = await readJson(response);
        return body.skills;
    }
    async listSessions() {
        const response = await fetch(API_BASE + '/sessions');
        const body = await readJson(response);
        return body.sessions;
    }
    async getSession(id) {
        const response = await fetch(API_BASE + '/session' + query({ id }));
        const body = await readJson(response);
        return body;
    }
    /** Trigger a replay-pack download for one session (browser download). */
    exportPack(sessionId, notes) {
        const url = API_BASE + '/export' + query({ sessionId, notes });
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = '';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }
    async listPacks() {
        const response = await fetch(API_BASE + '/packs');
        const body = await readJson(response);
        return body.packs;
    }
    async importPack(pack) {
        const response = await fetch(API_BASE + '/packs', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(pack),
        });
        const body = await readJson(response);
        return body.pack;
    }
    async getPack(id) {
        const response = await fetch(API_BASE + '/pack' + query({ id }));
        const body = await readJson(response);
        return body.pack;
    }
    async deletePack(id) {
        const response = await fetch(API_BASE + '/pack' + query({ id }), { method: 'DELETE' });
        await readJson(response);
    }
}
//# sourceMappingURL=api.js.map