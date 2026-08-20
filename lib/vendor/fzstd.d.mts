/**
 * Vendored fzstd 0.1.1 (MIT, 101arrowz) — minimal type surface this plugin uses.
 * Full source in fzstd.mjs; license text in THIRD_PARTY_NOTICES.md.
 */
export function decompress(dat: Uint8Array, buf?: Uint8Array): Uint8Array
export class Decompress {
  constructor(ondata?: (err: number, data: Uint8Array, final: boolean) => void)
  push(chunk: Uint8Array, final?: boolean): void
}
