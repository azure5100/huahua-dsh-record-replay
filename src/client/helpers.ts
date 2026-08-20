/** Tiny dictionary accessor: picks zh/en from the browser language. */
import { en, zh, type ReplayKey } from './locales.ts'

const LANG = typeof navigator !== 'undefined' && navigator.language !== undefined && navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
const dicts: Record<'zh' | 'en', Record<ReplayKey, string>> = { zh, en }

/** Translate one key (falls back to the key itself). */
export function tt<K extends ReplayKey>(key: K): string {
  return dicts[LANG][key] ?? key
}

/** Replace {placeholders} in a template string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (match, name: string) => {
    const value = values[name]
    return value === undefined ? match : String(value)
  })
}