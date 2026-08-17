/** Tiny dictionary accessor: picks zh/en from the browser language. */
import { type ReplayKey } from './locales.ts';
/** Translate one key (falls back to the key itself). */
export declare function tt<K extends ReplayKey>(key: K): string;
/** Replace {placeholders} in a template string. */
export declare function fill(template: string, values: Record<string, string | number>): string;
//# sourceMappingURL=helpers.d.ts.map