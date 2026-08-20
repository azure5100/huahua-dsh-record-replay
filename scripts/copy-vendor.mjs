/** Copy vendored runtime assets (fzstd.mjs + its declaration) into lib so the
 * tsc-emitted host half can import them at runtime and consumers get types. */
import { cpSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const source = join(root, 'src', 'vendor')
const target = join(root, 'lib', 'vendor')
mkdirSync(target, { recursive: true })
cpSync(source, target, { recursive: true })
console.log('[copy-vendor] src/vendor -> lib/vendor')
