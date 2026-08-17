import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tt } from "../helpers.js";
/** Full-screen video playback for one recording. */
export function VideoModal({ api, recording, onClose }) {
    return (_jsx("div", { className: "rrp-modalBackdrop", onClick: onClose, children: _jsxs("div", { className: "rrp-modal", onClick: event => event.stopPropagation(), style: { width: 'min(760px, 94%)' }, children: [_jsx("div", { className: "rrp-modalTitle", children: recording.title }), _jsx("video", { className: "rrp-recordVideo", controls: true, autoPlay: true, src: api.videoUrl(recording.id), style: { maxHeight: '62vh' } }), _jsx("div", { className: "rrp-modalActions", children: _jsx("button", { className: "rrp-btn", onClick: onClose, children: tt('run.close') }) })] }) }));
}
//# sourceMappingURL=VideoModal.js.map