import type { ReplayApi } from '../api.ts';
import type { TimelineItem } from '../../types.ts';
import type { ViewerSource } from './ReplayPanel.tsx';
export declare function Viewer({ source, api, onRun }: {
    source: ViewerSource;
    api: ReplayApi;
    onRun(title: string, items: TimelineItem[]): void;
}): import("react").JSX.Element;
//# sourceMappingURL=Viewer.d.ts.map