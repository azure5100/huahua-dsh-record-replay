import type { ReplayApi } from '../api.ts';
import type { TimelineItem } from '../../types.ts';
import type { ViewerSource } from './ReplayPanel.tsx';
export interface SessionsTabProps {
    api: ReplayApi;
    onView(viewer: ViewerSource): void;
    onRun(title: string, items: TimelineItem[]): void;
}
export declare function SessionsTab({ api, onView, onRun }: SessionsTabProps): import("react").JSX.Element;
export interface PacksTabProps {
    api: ReplayApi;
    onView(viewer: ViewerSource): void;
    onRun(title: string, items: TimelineItem[]): void;
}
export declare function PacksTab({ api, onView, onRun }: PacksTabProps): import("react").JSX.Element;
//# sourceMappingURL=Tabs.d.ts.map