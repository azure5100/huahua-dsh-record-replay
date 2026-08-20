/**
 * Timeline distillation: turns the raw session event stream into a readable
 * replay timeline (user messages, assistant replies, tool calls, tool
 * results) plus a compact metadata summary. System-injected user/message
 * records (source.kind === "plugin", e.g. runtime-context snapshots and
 * skill reminders) are skipped — they are noise, not conversation.
 */
import type { RawEvent, SessionMeta, TimelineItem, UserItem } from './types.ts';
/**
 * Distill raw session events into meta + timeline items.
 * @param events - parsed JSONL records (see session-store).
 * @returns metadata summary and the ordered timeline.
 */
export declare function parseTimeline(events: readonly RawEvent[]): {
    meta: SessionMeta;
    items: TimelineItem[];
};
/** Extract the user messages of a timeline (the re-run seed). */
export declare function extractUserMessages(items: readonly TimelineItem[]): UserItem[];
//# sourceMappingURL=timeline.d.ts.map