import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { fill, tt } from "../helpers.js";
import { VideoModal } from "./VideoModal.js";
import { SkillGenModal } from "./SkillGenModal.js";
const MAX_FRAMES = 240;
const FRAME_INTERVAL_MS = 2000;
function formatElapsed(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function formatTime(value) {
    const date = new Date(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
export function RecordTab({ api, runtime }) {
    const [recordings, setRecordings] = useState(null);
    const [error, setError] = useState(null);
    const [active, setActive] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [skillFor, setSkillFor] = useState(null);
    const activeRef = useRef(null);
    const load = useCallback(async () => {
        setError(null);
        try {
            setRecordings(await api.listRecordings());
        }
        catch (reason) {
            setError(String(reason));
        }
    }, [api]);
    useEffect(() => { void load(); }, [load]);
    const stopRecording = useCallback(async () => {
        const rec = activeRef.current;
        if (rec === null)
            return;
        activeRef.current = null;
        setActive(null);
        setUploading(true);
        clearInterval(rec.timer);
        clearInterval(rec.clock);
        rec.stream.getTracks().forEach(track => { track.stop(); });
        // Let the recorder flush its final chunk, then upload everything.
        const stopPromise = new Promise(resolve => {
            if (rec.recorder.state === 'inactive') {
                resolve();
                return;
            }
            rec.recorder.onstop = () => resolve();
            rec.recorder.stop();
        });
        await stopPromise;
        const videoBlob = new Blob(rec.chunks, { type: 'video/webm' });
        try {
            const meta = await api.createRecording(rec.title);
            if (videoBlob.size > 0)
                await api.uploadRecordingVideo(meta.id, videoBlob);
            for (let index = 0; index < rec.frames.length; index += 1) {
                const name = 'frame-' + String(index + 1).padStart(4, '0') + '.png';
                await api.uploadRecordingFrame(meta.id, name, rec.frames[index]);
            }
            await load();
        }
        catch (reason) {
            setError(String(reason));
        }
        setUploading(false);
    }, [api, load]);
    const startRecording = useCallback(async () => {
        try {
            const title = window.prompt(tt('record.titlePrompt'), '') ?? '';
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false });
            // A detached <video> feeds the frame sampler (never shown on screen).
            const videoEl = document.createElement('video');
            videoEl.muted = true;
            videoEl.playsInline = true;
            videoEl.srcObject = stream;
            await videoEl.play();
            let mimeType = 'video/webm;codecs=vp9';
            if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType))
                mimeType = 'video/webm';
            const recorder = new MediaRecorder(stream, { mimeType });
            const chunks = [];
            recorder.ondataavailable = event => { if (event.data.size > 0)
                chunks.push(event.data); };
            recorder.start(500);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx === null)
                throw new Error('canvas 2d context unavailable');
            const frames = [];
            const timer = setInterval(() => {
                if (frames.length >= MAX_FRAMES || videoEl.videoWidth === 0)
                    return;
                const width = 960;
                const height = Math.max(1, Math.round(videoEl.videoHeight * width / videoEl.videoWidth));
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(videoEl, 0, 0, width, height);
                canvas.toBlob(blob => { if (blob !== null)
                    frames.push(blob); }, 'image/png');
            }, FRAME_INTERVAL_MS);
            const clock = setInterval(() => {
                setActive(prev => prev === null ? null : { ...prev, elapsed: Math.floor((Date.now() - prev.startedAt) / 1000) });
            }, 1000);
            const rec = { title, stream, recorder, videoEl, canvas, ctx, chunks, frames, timer, clock, startedAt: Date.now(), elapsed: 0 };
            activeRef.current = rec;
            setActive(rec);
            // The browser's own "Stop sharing" button also ends the recording.
            stream.getVideoTracks()[0]?.addEventListener('ended', () => { void stopRecording(); });
        }
        catch (reason) {
            // User cancelled the picker or capture failed.
            setError(reason instanceof Error ? reason.message : String(reason));
        }
    }, [stopRecording]);
    const remove = useCallback(async (recording) => {
        if (!window.confirm(tt('record.deleteConfirm')))
            return;
        try {
            await api.deleteRecording(recording.id);
            await load();
        }
        catch (reason) {
            setError(String(reason));
        }
    }, [api, load]);
    return (_jsxs("div", { children: [error !== null && _jsx("div", { className: "rrp-error", children: error }), _jsxs("div", { className: "rrp-recordBar", children: [active === null ? (_jsx("button", { className: "rrp-recordBtn", "data-primary": "", onClick: () => void startRecording(), disabled: uploading, children: tt('record.start') })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "rrp-recordLive", children: tt('record.recording') }), _jsx("span", { className: "rrp-recordTimer", children: formatElapsed(active.elapsed) }), _jsx("span", { className: "rrp-recordFrames", children: fill(tt('record.frames'), { frames: active.frames.length }) }), _jsx("button", { className: "rrp-recordBtn", onClick: () => void stopRecording(), children: tt('record.stop') })] })), uploading && _jsx("span", { className: "rrp-note", children: tt('record.uploading') })] }), recordings === null ? _jsx("div", { className: "rrp-note", children: tt('sessions.loading') })
                : recordings.length === 0 ? _jsx("div", { className: "rrp-empty", children: tt('record.empty') })
                    : (_jsx("div", { className: "rrp-list", children: recordings.map(rec => (_jsxs("div", { className: "rrp-row", children: [_jsxs("div", { className: "rrp-rowMain", children: [_jsx("div", { className: "rrp-rowTitle", children: rec.title }), _jsxs("div", { className: "rrp-rowMeta", children: [formatTime(rec.createdAt), " \u00B7 ", fill(tt('record.frames'), { frames: rec.frames }), " \u00B7 ", rec.videoBytes !== undefined ? fill(tt('record.video'), { size: formatBytes(rec.videoBytes) }) : tt('record.noVideo')] })] }), _jsxs("div", { className: "rrp-rowActions", children: [rec.videoBytes !== undefined && _jsx("button", { className: "rrp-btn", onClick: () => setViewing(rec), children: tt('record.replay') }), _jsx("button", { className: "rrp-btn", "data-primary": "", onClick: () => setSkillFor(rec), disabled: rec.frames === 0, children: tt('record.genSkill') }), _jsx("button", { className: "rrp-btn", "data-danger": "", onClick: () => void remove(rec), children: tt('record.delete') })] })] }, rec.id))) })), viewing !== null && _jsx(VideoModal, { api: api, recording: viewing, onClose: () => setViewing(null) }), skillFor !== null && _jsx(SkillGenModal, { api: api, runtime: runtime, recording: skillFor, onClose: () => setSkillFor(null) })] }));
}
//# sourceMappingURL=RecordTab.js.map