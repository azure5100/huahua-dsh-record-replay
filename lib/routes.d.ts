import type { WebRoute } from '@deepseek-ai/dsh-host-webserver';
import type { InstalledSkill, ReplayPack, RecordingMeta, RecordingSummary, SessionMeta, SessionSummary, TimelineItem } from './types.ts';
import type { SessionStore } from './session-store.ts';
import type { PackStore } from './pack-store.ts';
import type { RecordingStore } from './recording-store.ts';
import type { SkillInstaller } from './skill-installer.ts';
/** API base path (the browser half fetches these same-origin). */
export declare const API_BASE = "/api/huahua-dsh-record-replay";
/** Route family dependencies. */
export interface RecordReplayRoutesDeps {
    sessions: SessionStore;
    packs: PackStore;
    recordings: RecordingStore;
    skills: SkillInstaller;
}
/** Build every /api/huahua-dsh-record-replay route (exact paths, one handler per path). */
export declare function makeRoutes(deps: RecordReplayRoutesDeps): WebRoute[];
export type { InstalledSkill, ReplayPack, RecordingMeta, RecordingSummary, SessionMeta, SessionSummary, TimelineItem };
//# sourceMappingURL=routes.d.ts.map