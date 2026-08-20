import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { fill, tt } from "../helpers.js";
/** Shared row action cluster for both tabs. */
function RowActions(props) {
    const { onView, onExport, onRun, onDelete } = props;
    return (_jsxs("div", { className: "rrp-rowActions", children: [_jsx("button", { className: "rrp-btn", onClick: onView, children: tt('viewer.title') }), onExport !== undefined && _jsx("button", { className: "rrp-btn", onClick: onExport, children: tt('session.export') }), _jsx("button", { className: "rrp-btn", "data-primary": "", onClick: onRun, children: tt('session.rerun') }), onDelete !== undefined && _jsx("button", { className: "rrp-btn", "data-danger": "", onClick: onDelete, children: tt('packs.delete') })] }));
}
/** Format a millisecond timestamp as a local date-time. */
function formatTime(value) {
    if (typeof value !== 'number' || value <= 0)
        return '-';
    const date = new Date(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
/** Project folder name from a session cwd (basename), else fallback. */
function projectOf(cwd) {
    if (cwd === undefined || cwd === '')
        return tt('session.unknownProject');
    const parts = cwd.split('/').filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : cwd;
}
export function SessionsTab({ api, onView, onRun }) {
    const [sessions, setSessions] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setSessions(await api.listSessions());
        }
        catch (reason) {
            setError(String(reason));
        }
        finally {
            setLoading(false);
        }
    }, [api]);
    useEffect(() => { void load(); }, [load]);
    const run = async (entry) => {
        try {
            const timeline = await api.getSession(entry.id);
            onRun(timeline.meta.title ?? entry.id, timeline.items);
        }
        catch (reason) {
            window.alert(String(reason));
        }
    };
    const view = async (entry) => {
        try {
            const timeline = await api.getSession(entry.id);
            onView({ kind: 'session', title: timeline.meta.title ?? entry.id, meta: timeline.meta, items: timeline.items, sessionId: entry.id });
        }
        catch (reason) {
            window.alert(String(reason));
        }
    };
    if (error !== null)
        return _jsxs("div", { className: "rrp-error", children: [tt('sessions.error'), ": ", error] });
    if (sessions === null || loading)
        return _jsx("div", { className: "rrp-note", children: tt('sessions.loading') });
    if (sessions.length === 0)
        return _jsx("div", { className: "rrp-empty", children: tt('sessions.empty') });
    return (_jsxs("div", { className: "rrp-list", children: [_jsx("div", { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }, children: _jsx("button", { className: "rrp-btn", onClick: () => void load(), children: tt('sessions.reload') }) }), sessions.map(entry => (_jsxs("div", { className: "rrp-row", children: [_jsxs("div", { className: "rrp-rowMain", children: [_jsx("div", { className: "rrp-rowTitle", children: entry.title ?? tt('session.noTitle') }), _jsxs("div", { className: "rrp-rowMeta", children: [projectOf(entry.cwd), " \u00B7 ", formatTime(entry.createdAt), " \u00B7 ", entry.messageCount, " \u884C"] })] }), _jsx(RowActions, { onView: () => void view(entry), onExport: () => api.exportPack(entry.id), onRun: () => void run(entry) })] }, entry.id)))] }));
}
export function PacksTab({ api, onView, onRun }) {
    const [packs, setPacks] = useState(null);
    const [error, setError] = useState(null);
    const [importing, setImporting] = useState(false);
    const load = useCallback(async () => {
        setError(null);
        try {
            setPacks(await api.listPacks());
        }
        catch (reason) {
            setError(String(reason));
        }
    }, [api]);
    useEffect(() => { void load(); }, [load]);
    const onPickFile = async (file) => {
        if (file === undefined)
            return;
        setImporting(true);
        setError(null);
        try {
            const text = await file.text();
            const pack = JSON.parse(text);
            await api.importPack(pack);
            await load();
            window.alert(`导入成功：${pack.meta.title ?? file.name}`);
        }
        catch (reason) {
            setError(String(reason));
        }
        finally {
            setImporting(false);
        }
    };
    const run = async (entry) => {
        try {
            const pack = await api.getPack(entry.id);
            onRun(pack.meta.title ?? entry.id, pack.items);
        }
        catch (reason) {
            window.alert(String(reason));
        }
    };
    const view = async (entry) => {
        try {
            const pack = await api.getPack(entry.id);
            onView({ kind: 'pack', title: pack.meta.title ?? entry.id, meta: {
                    id: entry.id, createdAt: pack.meta.createdAt ?? 0, turns: 0, steps: 0,
                    userMessages: pack.items.filter(item => item.kind === 'user').length,
                    assistantMessages: 0, toolCalls: pack.items.filter(item => item.kind === 'tool').length,
                    title: pack.meta.title, cwd: pack.meta.cwd, agentPreset: pack.meta.agentPreset,
                }, items: pack.items, packId: entry.id });
        }
        catch (reason) {
            window.alert(String(reason));
        }
    };
    const remove = async (entry) => {
        if (!window.confirm(`删除回放包「${entry.meta.title ?? entry.id}」？`))
            return;
        try {
            await api.deletePack(entry.id);
            await load();
        }
        catch (reason) {
            setError(String(reason));
        }
    };
    if (error !== null)
        return _jsx("div", { className: "rrp-error", children: error });
    if (packs === null)
        return _jsx("div", { className: "rrp-note", children: tt('packs.importing') });
    return (_jsxs("div", { className: "rrp-list", children: [_jsx("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 4 }, children: _jsxs("label", { className: "rrp-btn", "data-primary": "", style: { cursor: importing ? 'default' : 'pointer' }, children: [_jsx("input", { type: 'file', accept: '.json,.replay.json,application/json', style: { display: 'none' }, disabled: importing, onChange: event => void onPickFile(event.target.files?.[0]) }), importing ? tt('packs.importing') : tt('packs.import')] }) }), packs.length === 0 && _jsx("div", { className: "rrp-empty", children: tt('packs.empty') }), packs.map(entry => (_jsxs("div", { className: "rrp-row", children: [_jsxs("div", { className: "rrp-rowMain", children: [_jsx("div", { className: "rrp-rowTitle", children: entry.meta.title ?? tt('session.noTitle') }), _jsxs("div", { className: "rrp-rowMeta", children: [formatTime(entry.modifiedAt), " \u00B7 ", entry.itemCount, " \u6761 \u00B7 ", entry.userMessages, " \u6761\u7528\u6237\u6D88\u606F", entry.meta.sourceSessionId !== undefined ? ` · ${entry.meta.sourceSessionId}` : ''] })] }), _jsx(RowActions, { onView: () => void view(entry), onRun: () => void run(entry), onDelete: () => void remove(entry) })] }, entry.id)))] }));
}
//# sourceMappingURL=Tabs.js.map