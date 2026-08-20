import type { UserItem } from '../../types.ts';
import type { ReplayRuntimeFaces } from '../mount.tsx';
export type RunStatus = 'idle' | 'connecting' | 'sending' | 'running' | 'done' | 'error';
export declare function RunModal({ title, userMessages, runtime, onClose }: {
    title: string;
    userMessages: UserItem[];
    runtime: ReplayRuntimeFaces;
    onClose(): void;
}): import("react").JSX.Element;
//# sourceMappingURL=RunModal.d.ts.map