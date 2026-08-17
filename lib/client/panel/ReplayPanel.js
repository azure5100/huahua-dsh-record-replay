import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { tt } from "../helpers.js";
import { SessionsTab, PacksTab } from "./Tabs.js";
import { RecordTab } from "./RecordTab.js";
import { Viewer } from "./Viewer.js";
import { RunModal } from "./RunModal.js";
export function ReplayPanel({ controller, api, runtime }) {
    const [tab, setTab] = useState('sessions');
    const [viewer, setViewer] = useState(null);
    const [run, setRun] = useState(null);
    const openRun = useCallback((title, items) => {
        const userMessages = items.filter((item) => item.kind === 'user');
        if (userMessages.length === 0) {
            window.alert('该回放没有可复刻的用户消息');
            return;
        }
        setRun({ title, userMessages });
    }, []);
    return (_jsxs("div", { className: "rrp-root", children: [_jsxs("div", { className: "rrp-header", children: [_jsx("span", { className: "rrp-headerTitle", children: viewer === null ? tt('viewer.title') : viewer.title }), viewer !== null && _jsx("button", { className: "rrp-btn", onClick: () => setViewer(null), children: tt('viewer.back') }), _jsx("button", { className: "rrp-btn", onClick: () => controller.close(), title: tt('entry.tooltip'), children: tt('panel.close') })] }), viewer === null ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "rrp-tabs", children: [_jsx("button", { className: "rrp-tab", "data-active": tab === 'sessions' ? '' : undefined, onClick: () => setTab('sessions'), children: tt('tab.sessions') }), _jsx("button", { className: "rrp-tab", "data-active": tab === 'packs' ? '' : undefined, onClick: () => setTab('packs'), children: tt('tab.packs') }), _jsx("button", { className: "rrp-tab", "data-active": tab === 'record' ? '' : undefined, onClick: () => setTab('record'), children: tt('tab.record') })] }), _jsxs("div", { className: "rrp-body", children: [tab === 'sessions' && _jsx(SessionsTab, { api: api, onView: setViewer, onRun: openRun }), tab === 'packs' && _jsx(PacksTab, { api: api, onView: setViewer, onRun: openRun }), tab === 'record' && _jsx(RecordTab, { api: api, runtime: runtime })] })] })) : (_jsx(Viewer, { source: viewer, api: api, onRun: openRun })), run !== null && _jsx(RunModal, { title: run.title, userMessages: run.userMessages, runtime: runtime, onClose: () => setRun(null) })] }));
}
//# sourceMappingURL=ReplayPanel.js.map