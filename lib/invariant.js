/**
 * Invariant helper (family convention): throw with the plugin tag on failure.
 */
export function invariant(condition, message) {
    if (!condition)
        throw new Error(`[dsh-record-replay] ${message}`);
}
//# sourceMappingURL=invariant.js.map