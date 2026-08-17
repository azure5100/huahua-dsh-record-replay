/** Tiny dictionary accessor: picks zh/en from the browser language. */
import { en, zh } from "./locales.js";
const LANG = typeof navigator !== 'undefined' && navigator.language !== undefined && navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
const dicts = { zh, en };
/** Translate one key (falls back to the key itself). */
export function tt(key) {
    return dicts[LANG][key] ?? key;
}
/** Replace {placeholders} in a template string. */
export function fill(template, values) {
    return template.replace(/\{([a-zA-Z]+)\}/g, (match, name) => {
        const value = values[name];
        return value === undefined ? match : String(value);
    });
}
//# sourceMappingURL=helpers.js.map