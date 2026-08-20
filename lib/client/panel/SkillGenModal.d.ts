import type { ReplayApi } from '../api.ts';
import type { ReplayRuntimeFaces } from '../mount.tsx';
import type { RecordingSummary } from '../../types.ts';
/**
 * Skill generation: spawns a fresh agent session, points it at the recorded
 * frames via the describe_image tool, and installs the SKILL.md it produces
 * into the user skill root (~/.dsh/skills) so it becomes a live skill.
 */
export declare function SkillGenModal({ api, runtime, recording, onClose }: {
    api: ReplayApi;
    runtime: ReplayRuntimeFaces;
    recording: RecordingSummary;
    onClose(): void;
}): import("react").JSX.Element;
//# sourceMappingURL=SkillGenModal.d.ts.map