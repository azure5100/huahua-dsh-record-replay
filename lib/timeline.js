/** Concatenate the text parts of a Vercel-style content array. */
function textOfContent(content) {
    if (!Array.isArray(content))
        return '';
    const parts = [];
    for (const part of content) {
        if (typeof part !== 'object' || part === null)
            continue;
        const item = part;
        if (item.type === 'text' && typeof item.text === 'string' && item.text !== '')
            parts.push(item.text);
    }
    return parts.join('\n');
}
/** First reasoning part of a content array (collapsed in the viewer). */
function reasoningOfContent(content) {
    if (!Array.isArray(content))
        return undefined;
    for (const part of content) {
        if (typeof part !== 'object' || part === null)
            continue;
        const item = part;
        if (item.type === 'reasoning' && typeof item.text === 'string' && item.text !== '')
            return item.text;
    }
    return undefined;
}
/** Text of a tool/result message (tool-result parts + any text parts). */
function resultTextOfMessage(message) {
    if (typeof message !== 'object' || message === null)
        return { text: '', ok: undefined };
    const content = message.content;
    if (!Array.isArray(content))
        return { text: '', ok: undefined };
    const parts = [];
    let ok;
    for (const part of content) {
        if (typeof part !== 'object' || part === null)
            continue;
        const item = part;
        if (item.type === 'tool-result') {
            const inner = Array.isArray(item.content) ? textOfContent(item.content) : '';
            if (inner !== '')
                parts.push(inner);
        }
        else if (item.type === 'text' && typeof item.text === 'string' && item.text !== '') {
            parts.push(item.text);
        }
    }
    return { text: parts.join('\n'), ok };
}
/**
 * Distill raw session events into meta + timeline items.
 * @param events - parsed JSONL records (see session-store).
 * @returns metadata summary and the ordered timeline.
 */
export function parseTimeline(events) {
    const meta = {
        id: '',
        createdAt: 0,
        turns: 0,
        steps: 0,
        userMessages: 0,
        assistantMessages: 0,
        toolCalls: 0,
    };
    const items = [];
    let turn = 0;
    let step = 0;
    let title;
    for (const event of events) {
        const data = event.data ?? {};
        const time = event.time ?? 0;
        switch (event.type) {
            case 'session': {
                // The header record carries its fields at the top level, not in data.
                const top = event;
                meta.id = typeof top.id === 'string' ? top.id : (typeof data.id === 'string' ? data.id : '');
                meta.createdAt = typeof top.createdAt === 'number' ? top.createdAt : (typeof data.createdAt === 'number' ? data.createdAt : 0);
                meta.cwd = typeof top.cwd === 'string' ? top.cwd : (typeof data.cwd === 'string' ? data.cwd : undefined);
                meta.agentPreset = typeof top.agentPreset === 'string' ? top.agentPreset : (typeof data.agentPreset === 'string' ? data.agentPreset : undefined);
                break;
            }
            case 'session/title': {
                const value = data.title;
                if (typeof value === 'string' && value !== '')
                    title = value;
                break;
            }
            case 'turn/start': {
                const value = data.turn;
                if (typeof value === 'number') {
                    turn = value;
                    meta.turns = Math.max(meta.turns, value);
                    items.push({ kind: 'turn', turn: value, time });
                }
                break;
            }
            case 'step/start': {
                const turnValue = data.turn;
                const stepValue = data.step;
                if (typeof turnValue === 'number' && typeof stepValue === 'number') {
                    step = stepValue;
                    meta.steps = Math.max(meta.steps, stepValue);
                    items.push({ kind: 'step', turn: turnValue, step: stepValue, time });
                }
                break;
            }
            case 'user/message': {
                const source = data.source;
                const sourceKind = typeof source === 'object' && source !== null ? source.kind : undefined;
                if (sourceKind !== 'user')
                    break; // skip runtime-context / skill-reminder injections
                const text = textOfContent(data.content);
                if (text === '')
                    break;
                const id = data.id;
                meta.userMessages += 1;
                const user = { kind: 'user', turn, step, text, time };
                if (typeof id === 'string')
                    user.id = id;
                items.push(user);
                break;
            }
            case 'assistant/message': {
                const message = data.message;
                if (typeof message !== 'object' || message === null)
                    break;
                const content = message.content;
                const text = textOfContent(content);
                const reasoning = reasoningOfContent(content);
                if (text === '' && reasoning === undefined)
                    break;
                meta.assistantMessages += 1;
                const assistant = { kind: 'assistant', turn, step, text, time };
                if (reasoning !== undefined)
                    assistant.reasoning = reasoning;
                items.push(assistant);
                break;
            }
            case 'tool/call': {
                const name = data.name;
                if (typeof name !== 'string')
                    break;
                const callId = data.callId;
                const argsText = data.arguments;
                meta.toolCalls += 1;
                const tool = {
                    kind: 'tool',
                    turn,
                    step,
                    name,
                    callId: typeof callId === 'string' ? callId : '',
                    argsText: typeof argsText === 'string' ? argsText : '',
                    time,
                };
                items.push(tool);
                break;
            }
            case 'tool/result': {
                const message = data.message;
                const source = typeof message === 'object' && message !== null ? message.source : undefined;
                const callId = typeof source === 'object' && source !== null ? source.callId : undefined;
                const { text, ok } = resultTextOfMessage(message);
                items.push({
                    kind: 'result',
                    turn,
                    step,
                    callId: typeof callId === 'string' ? callId : '',
                    text,
                    ok,
                    time,
                });
                break;
            }
        }
    }
    meta.title = title;
    return { meta, items };
}
/** Extract the user messages of a timeline (the re-run seed). */
export function extractUserMessages(items) {
    return items.filter((item) => item.kind === 'user');
}
//# sourceMappingURL=timeline.js.map