import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { fill, tt } from "../helpers.js";
export function RunModal({ title, userMessages, runtime, onClose }) {
    const [status, setStatus] = useState('idle');
    const [sessionId, setSessionId] = useState(undefined);
    const [sent, setSent] = useState(0);
    const [error, setError] = useState(undefined);
    const timerRef = useRef(undefined);
    useEffect(() => () => {
        if (timerRef.current !== undefined)
            clearTimeout(timerRef.current);
    }, []);
    const start = useCallback(async () => {
        if (userMessages.length === 0)
            return;
        setStatus('connecting');
        setError(undefined);
        try {
            const list = runtime.workspaces.list.getSnapshot();
            const workspaceId = list.recentWorkspaceId ?? list.items[0]?.workspaceId;
            if (workspaceId === undefined) {
                setError('no workspace available');
                setStatus('error');
                return;
            }
            const newSessionId = await runtime.workspaces.connectWorkspace(workspaceId);
            setSessionId(newSessionId);
            const binding = runtime.sessions.binding(newSessionId);
            const driver = binding?.session;
            if (driver === undefined) {
                setError('session is not ready');
                setStatus('error');
                return;
            }
            await driver.rename(`回放：${title}`).catch(() => { });
            const baseline = driver.getSnapshot().turnEnds.size;
            setStatus('sending');
            for (let index = 0; index < userMessages.length; index += 1) {
                const message = userMessages[index];
                const accepted = await driver.prompt([{ type: 'text', text: message.text }], 'queue');
                if (!accepted.ok) {
                    setError(accepted.error !== undefined ? String(accepted.error) : 'prompt rejected');
                    setStatus('error');
                    return;
                }
                setSent(index + 1);
            }
            setStatus('running');
            const startedAt = Date.now();
            const poll = () => {
                const snapshot = driver.getSnapshot();
                if (!snapshot.running && snapshot.turnEnds.size >= baseline + userMessages.length) {
                    setStatus('done');
                    return;
                }
                if (snapshot.lastAgentError !== null) {
                    setError(snapshot.lastAgentError);
                    setStatus('error');
                    return;
                }
                if (Date.now() - startedAt > 30 * 60 * 1000) {
                    setStatus('done');
                    return;
                }
                timerRef.current = setTimeout(poll, 1500);
            };
            poll();
        }
        catch (reason) {
            setError(reason instanceof Error ? reason.message : String(reason));
            setStatus('error');
        }
    }, [runtime, title, userMessages]);
    const openSession = () => {
        if (sessionId !== undefined)
            runtime.sessions.open(sessionId);
    };
    const progress = fill(tt('run.progress'), { sent, total: userMessages.length });
    return (_jsx("div", { className: "rrp-modalBackdrop", onClick: onClose, children: _jsxs("div", { className: "rrp-modal", onClick: event => event.stopPropagation(), children: [_jsxs("div", { className: "rrp-modalTitle", children: [tt('run.title'), " \u00B7 ", title] }), _jsxs("div", { className: "rrp-modalBody", children: [_jsx("div", { children: fill(tt('run.msgCount'), { count: userMessages.length }) }), _jsxs("div", { style: { marginTop: 8, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }, children: [status === 'connecting' && tt('run.status.connecting'), status === 'sending' && `${tt('run.status.sending')} ${progress}`, status === 'running' && tt('run.status.running'), status === 'done' && tt('run.status.done'), status === 'error' && tt('run.status.error')] }), error !== undefined && _jsx("div", { className: "rrp-error", children: error }), sessionId !== undefined && _jsxs("div", { className: "rrp-note", style: { marginTop: 4 }, children: ["session: ", sessionId] })] }), _jsxs("div", { className: "rrp-modalActions", children: [status === 'done' && sessionId !== undefined && (_jsx("button", { className: "rrp-btn", "data-primary": "", onClick: openSession, children: tt('run.openSession') })), status === 'idle' && _jsx("button", { className: "rrp-btn", "data-primary": "", onClick: () => void start(), children: tt('run.start') }), (status === 'idle' || status === 'error' || status === 'done') && _jsx("button", { className: "rrp-btn", onClick: onClose, children: tt('run.close') })] })] }) }));
}
//# sourceMappingURL=RunModal.js.map