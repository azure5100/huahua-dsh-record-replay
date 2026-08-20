import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { fill, tt } from "../helpers.js";
/** Pretty-print tool-call JSON arguments (fall back to raw). */
function prettyArgs(argsText) {
    if (argsText === '')
        return '';
    try {
        const parsed = JSON.parse(argsText);
        return JSON.stringify(parsed, null, 2);
    }
    catch {
        return argsText;
    }
}
/** Truncate long text for the collapsed preview. */
function preview(text, max) {
    return text.length <= max ? text : text.slice(0, max) + '…（已截断，点击展开查看全文）';
}
/** Searchable flat text of one item. */
function searchText(item) {
    switch (item.kind) {
        case 'user': return item.text;
        case 'assistant': return item.text + '\n' + (item.reasoning ?? '');
        case 'tool': return item.name + '\n' + item.argsText;
        case 'result': return item.text;
        default: return '';
    }
}
function ItemView({ item }) {
    const [expanded, setExpanded] = useState(false);
    switch (item.kind) {
        case 'turn':
            return _jsxs("div", { className: "rrp-turnDivider", children: ["\u7B2C ", item.turn, " \u8F6E"] });
        case 'step':
            return null;
        case 'user':
            return _jsx("div", { className: "rrp-item rrp-item-user", children: item.text });
        case 'assistant':
            return (_jsxs("div", { className: "rrp-item rrp-item-assistant", children: [item.reasoning !== undefined && item.reasoning !== '' && (_jsxs("details", { className: "rrp-details", children: [_jsx("summary", { children: tt('viewer.reasoning') }), _jsx("pre", { className: "rrp-pre rrp-muted", children: item.reasoning })] })), item.text !== '' && _jsx("div", { children: item.text })] }));
        case 'tool':
            return (_jsxs("div", { className: "rrp-item rrp-item-tool", children: [_jsxs("div", { className: "rrp-itemTag", children: [tt('viewer.tool'), " ", _jsx("code", { children: item.name })] }), item.argsText !== '' && (_jsxs("details", { className: "rrp-details", children: [_jsx("summary", { children: tt('viewer.args') }), _jsx("pre", { className: "rrp-pre", children: prettyArgs(item.argsText) })] }))] }));
        case 'result':
            return (_jsxs("div", { className: "rrp-item rrp-item-result", children: [_jsxs("div", { className: "rrp-itemTag", children: [tt('viewer.result'), item.ok === false ? ' · 失败' : ''] }), item.text === '' ? (_jsx("div", { className: "rrp-muted", children: "\uFF08\u65E0\u6587\u672C\u8F93\u51FA\uFF09" })) : expanded ? (_jsxs(_Fragment, { children: [_jsx("pre", { className: "rrp-pre", children: item.text }), _jsx("button", { className: "rrp-btn", onClick: () => setExpanded(false), children: tt('viewer.collapse') })] })) : (_jsxs(_Fragment, { children: [_jsx("pre", { className: "rrp-pre", children: preview(item.text, 2000) }), item.text.length > 2000 && _jsx("button", { className: "rrp-btn", onClick: () => setExpanded(true), children: tt('viewer.expand') })] }))] }));
    }
}
export function Viewer({ source, api, onRun }) {
    const [query, setQuery] = useState('');
    const [copied, setCopied] = useState(false);
    const q = query.trim().toLowerCase();
    const visible = useMemo(() => {
        if (q === '')
            return source.items;
        return source.items.filter(item => searchText(item).toLowerCase().includes(q));
    }, [source.items, q]);
    const copyTimeline = async () => {
        const text = source.items.map(item => {
            switch (item.kind) {
                case 'user': return '[用户] ' + item.text;
                case 'assistant': return '[助手] ' + item.text;
                case 'tool': return '[工具] ' + item.name + ' ' + item.argsText;
                case 'result': return '[结果] ' + preview(item.text, 400);
                default: return '';
            }
        }).filter(Boolean).join('\n\n');
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
        catch { /* clipboard unavailable */ }
    };
    const stats = fill(tt('viewer.stats'), {
        turns: source.meta.turns,
        steps: source.meta.steps,
        user: source.meta.userMessages,
        tools: source.meta.toolCalls,
    });
    return (_jsxs("div", { className: "rrp-viewer", children: [_jsxs("div", { className: "rrp-viewerToolbar", children: [_jsxs("span", { className: "rrp-viewerStats", children: [source.title, " \u00B7 ", stats] }), _jsx("input", { className: "rrp-viewerSearch", placeholder: tt('viewer.searchPlaceholder'), value: query, onChange: event => setQuery(event.target.value) }), _jsx("button", { className: "rrp-btn", onClick: () => void copyTimeline(), children: copied ? tt('viewer.copied') : tt('viewer.copy') }), source.kind === 'session' && _jsx("button", { className: "rrp-btn", onClick: () => api.exportPack(source.sessionId), children: tt('session.export') }), _jsx("button", { className: "rrp-btn", "data-primary": "", onClick: () => onRun(source.title, source.items), children: tt('session.rerun') })] }), _jsxs("div", { className: "rrp-timeline", children: [visible.length === 0 && _jsx("div", { className: "rrp-empty", children: tt('viewer.empty') }), visible.map((item, index) => _jsx(ItemView, { item: item }, index))] })] }));
}
//# sourceMappingURL=Viewer.js.map