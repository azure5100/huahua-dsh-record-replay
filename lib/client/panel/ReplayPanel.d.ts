import type { ReplayApi } from '../api.ts';
import type { PanelController } from '../controller.ts';
import type { ReplayRuntimeFaces } from '../mount.tsx';
import type { SessionMeta, TimelineItem } from '../../types.ts';
/** What the viewer shows: a recorded session or an imported pack. */
export type ViewerSource = {
    kind: 'session';
    title: string;
    meta: SessionMeta;
    items: TimelineItem[];
    sessionId: string;
} | {
    kind: 'pack';
    title: string;
    meta: SessionMeta;
    items: TimelineItem[];
    packId?: string;
};
export interface ReplayPanelProps {
    controller: PanelController;
    api: ReplayApi;
    runtime: ReplayRuntimeFaces;
}
export declare function ReplayPanel({ controller, api, runtime }: ReplayPanelProps): import("react").JSX.Element;
//# sourceMappingURL=ReplayPanel.d.ts.map