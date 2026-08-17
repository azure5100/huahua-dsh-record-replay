/**
 * huahua-dsh-record-replay — host half. Scans the DSH session library (the JSONL
 * transcripts the persistence backend records automatically), serves the
 * /api/huahua-dsh-record-replay route family (library, timeline, replay-pack
 * export/import), keeps the imported-pack store under ~/.dsh/replay-packs,
 * and announces the capability to agents via a system-prompt section.
 * The browser half (./client) renders the replay panel. Everything rides
 * official SDK packages plus vendored fzstd — no dsh source changes.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from 'schemastery';
/** Stable cordis plugin name. */
export declare const name = "record-replay";
/** Services required before the surfaces can mount. */
export declare const inject: string[];
/**
 * Settings namespace of the record-replay capability. Spelled here rather
 * than imported: the browser half spells the same value and must not depend
 * on a Host package.
 */
export declare const RECORD_REPLAY_SETTINGS_NAMESPACE: import("@deepseek-ai/dsh-settings").SettingsNamespace;
/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
    /**
     * When true (default), a system-prompt section announces the plugin to
     * every agent. Set false to keep it silent.
     */
    announceToAgent?: boolean;
    /** Master switch for the plugin (routes + prompt section). */
    enabled?: boolean;
}
export declare const Config: z<Config>;
/** Model-facing announcement: plugin presence, capabilities, and limits. */
export declare const RECORD_REPLAY_GUIDANCE = "\u672C\u673A\u5DF2\u5B89\u88C5 huahua-dsh-record-replay \u63D2\u4EF6\uFF08DSH \u5F55\u5236\u56DE\u653E\uFF09\uFF1A\u4FA7\u8FB9\u680F\u300C\u5F55\u5236\u56DE\u653E\u300D\u5165\u53E3\u3002\u80FD\u529B\u4E00\uFF08\u4F1A\u8BDD\uFF09\uFF1A\u8BFB\u53D6 ~/.dsh/sessions \u4E0B\u81EA\u52A8\u5F55\u5236\u7684\u5168\u90E8\u4F1A\u8BDD\uFF0C\u65F6\u95F4\u7EBF\u56DE\u653E\u3001\u5BFC\u51FA/\u5BFC\u5165\u53EF\u5206\u4EAB\u7684\u56DE\u653E\u5305\uFF08dsh-replay-pack JSON\uFF09\u3001\u590D\u523B\u5230\u5168\u65B0\u4F1A\u8BDD\u91CD\u65B0\u6267\u884C\u3002\u80FD\u529B\u4E8C\uFF08\u5F55\u5C4F \u2192 \u751F\u6210\u6280\u80FD\uFF09\uFF1A\u5728\u6D4F\u89C8\u5668\u5F55\u5236\u5C4F\u5E55\u64CD\u4F5C\uFF08getDisplayMedia\uFF0C\u5B58 ~/.dsh/recordings\uFF0C\u542B webm \u89C6\u9891\u4E0E\u91C7\u6837\u5E27\uFF09\uFF0C\u53EF\u56DE\u653E\uFF0C\u5E76\u53EF\u542F\u52A8\u4E00\u4E2A agent \u4F1A\u8BDD\u9010\u5E27\u5206\u6790\uFF08\u7528 describe_image \u5DE5\u5177\uFF09\u751F\u6210 SKILL.md\uFF0C\u5199\u5165 ~/.dsh/skills \u4F7F\u4E4B\u6210\u4E3A\u53EF\u7528\u6280\u80FD\u3002\u9650\u5236\uFF1A\u4EC5\u672C\u673A\u6570\u636E\uFF1B\u56DE\u653E\u5305\u542B\u5B8C\u6574\u5BF9\u8BDD\u4E0E\u5DE5\u5177\u8F93\u51FA\u3001\u5F55\u5C4F\u542B\u5C4F\u5E55\u5185\u5BB9\uFF0C\u5206\u4EAB/\u751F\u6210\u524D\u6CE8\u610F\u654F\u611F\u4FE1\u606F\u3002\u7528\u6237\u63D0\u5230\u300C\u5F55\u5236\u56DE\u653E / record replay / \u4F1A\u8BDD\u56DE\u653E / \u590D\u523B\u4F1A\u8BDD / \u5F55\u5C4F / \u751F\u6210\u6280\u80FD / \u5F55\u5C4F\u751F\u6210 skill\u300D\u65F6\u5373\u6307\u672C\u63D2\u4EF6\uFF0C\u8BF7\u636E\u6B64\u534F\u4F5C\u3002";
/**
 * Mount the session store, routes, and announcement.
 * @param ctx - host plugin context carrying webServer/systemPrompt.
 * @param config - resolved plugin config (schema defaults applied by the loader).
 */
export declare function apply(ctx: Context, config?: Config): void;
//# sourceMappingURL=index.d.ts.map