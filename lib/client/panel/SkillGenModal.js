import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { tt } from "../helpers.js";
/**
 * Read the final assistant text of a session (the SKILL.md the agent emitted).
 * Walks the history backwards to the last assistant/message event and joins
 * its text parts (reasoning excluded).
 */
async function readFinalAssistantText(runtime, sessionId) {
    const response = await runtime.connection.api.sessions.history({ sessionId: sessionId, maxMessages: 30 });
    if (!response.result.ok)
        return undefined;
    const events = response.result.value.events;
    for (let index = events.length - 1; index >= 0; index -= 1) {
        const event = events[index]?.event;
        if (event === undefined || event.type !== 'assistant/message')
            continue;
        const message = event.data?.message;
        const content = message?.content;
        if (!Array.isArray(content))
            continue;
        const parts = [];
        for (const part of content) {
            if (typeof part !== 'object' || part === null)
                continue;
            const item = part;
            if (item.type === 'text' && typeof item.text === 'string' && item.text !== '')
                parts.push(item.text);
        }
        if (parts.length > 0)
            return parts.join('\n\n');
    }
    return undefined;
}
/**
 * Skill generation: spawns a fresh agent session, points it at the recorded
 * frames via the describe_image tool, and installs the SKILL.md it produces
 * into the user skill root (~/.dsh/skills) so it becomes a live skill.
 */
export function SkillGenModal({ api, runtime, recording, onClose }) {
    const [status, setStatus] = useState('idle');
    const [sessionId, setSessionId] = useState(undefined);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(undefined);
    const timerRef = useRef(undefined);
    useEffect(() => () => {
        if (timerRef.current !== undefined)
            clearTimeout(timerRef.current);
    }, []);
    const settle = useCallback(async (sid) => {
        try {
            const text = await readFinalAssistantText(runtime, sid);
            if (text === undefined || text.trim() === '') {
                setError('agent 没有输出 SKILL.md 内容');
                setStatus('error');
                return;
            }
            const skill = await api.installSkill(text);
            setResult(skill);
            setStatus('done');
        }
        catch (reason) {
            setError(reason instanceof Error ? reason.message : String(reason));
            setStatus('error');
        }
    }, [api, runtime]);
    const start = useCallback(async () => {
        if (recording.frames === 0) {
            setError('no frames');
            setStatus('error');
            return;
        }
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
            const sid = await runtime.workspaces.connectWorkspace(workspaceId);
            setSessionId(sid);
            const binding = runtime.sessions.binding(sid);
            const driver = binding?.session;
            if (driver === undefined) {
                setError('session is not ready');
                setStatus('error');
                return;
            }
            await driver.rename('技能生成：' + recording.title).catch(() => { });
            const frameLines = [];
            for (let index = 0; index < recording.frames; index += 1) {
                const name = 'frame-' + String(index + 1).padStart(4, '0') + '.png';
                frameLines.push(`${index + 1}. ${api.frameUrl(recording.id, name)}`);
            }
            const prompt = [
                '请观看这段录屏的操作帧，把其中展示的操作流程提炼成一个可复用的 DSH skill。',
                '',
                `录屏标题（背景说明）：${recording.title}`,
                `帧列表（共 ${recording.frames} 帧，请依次用 describe_image 工具查看，可抽样概括）：`,
                ...frameLines,
                '',
                '要求：',
                '1. 逐帧（或合理抽样）调用 describe_image 分析画面内容与操作动作。',
                '2. 总结完整工作流：目标、操作步骤、关键细节、常见边界与注意事项、需要的输入。',
                '3. 输出一个标准 SKILL.md：YAML frontmatter（name 与 description）+ Markdown 正文；name 只能用小写字母、数字与连字符（如 demo-workflow）。',
                '4. 最终回复只输出 SKILL.md 的完整文本（以 --- 开头，不要任何其他文字、解释或代码围栏）。',
            ].join('\n');
            const accepted = await driver.prompt([{ type: 'text', text: prompt }], 'queue');
            if (!accepted.ok) {
                setError(accepted.error !== undefined ? String(accepted.error) : 'prompt rejected');
                setStatus('error');
                return;
            }
            setStatus('running');
            const baseline = driver.getSnapshot().turnEnds.size;
            const startedAt = Date.now();
            const poll = () => {
                const snapshot = driver.getSnapshot();
                if (!snapshot.running && snapshot.turnEnds.size > baseline) {
                    void settle(sid);
                    return;
                }
                if (snapshot.lastAgentError !== null) {
                    setError(snapshot.lastAgentError);
                    setStatus('error');
                    return;
                }
                if (Date.now() - startedAt > 30 * 60 * 1000) {
                    setError('timeout');
                    setStatus('error');
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
    }, [api, runtime, recording, settle]);
    const openSession = () => {
        if (sessionId !== undefined)
            runtime.sessions.open(sessionId);
    };
    return (_jsx("div", { className: "rrp-modalBackdrop", onClick: onClose, children: _jsxs("div", { className: "rrp-modal", onClick: event => event.stopPropagation(), children: [_jsxs("div", { className: "rrp-modalTitle", children: [tt('record.genSkill'), " \u00B7 ", recording.title] }), _jsxs("div", { className: "rrp-modalBody", children: [_jsx("div", { children: tt('skill.framesHint') }), _jsxs("div", { style: { marginTop: 8, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }, children: [status === 'connecting' && tt('skill.status.connecting'), status === 'running' && tt('skill.status.running'), status === 'done' && tt('skill.done'), status === 'error' && tt('skill.error')] }), error !== undefined && _jsx("div", { className: "rrp-error", children: error }), result !== null && (_jsxs("div", { style: { marginTop: 8, fontSize: 13 }, children: [_jsx("strong", { children: result.name }), " \u2014 ", result.description, _jsx("div", { className: "rrp-note", children: tt('skill.installedAt') })] })), sessionId !== undefined && _jsxs("div", { className: "rrp-note", style: { marginTop: 4 }, children: ["session: ", sessionId] })] }), _jsxs("div", { className: "rrp-modalActions", children: [status === 'done' && sessionId !== undefined && (_jsx("button", { className: "rrp-btn", onClick: openSession, children: tt('skill.openSession') })), status === 'idle' && _jsx("button", { className: "rrp-btn", "data-primary": "", onClick: () => void start(), children: tt('skill.gen') }), (status === 'idle' || status === 'error' || status === 'done') && _jsx("button", { className: "rrp-btn", onClick: onClose, children: tt('run.close') })] })] }) }));
}
//# sourceMappingURL=SkillGenModal.js.map