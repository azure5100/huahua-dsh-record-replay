/**
 * Invariant helper (family convention): throw with the plugin tag on failure.
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[huahua-dsh-record-replay] ${message}`)
}
