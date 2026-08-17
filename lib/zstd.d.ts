/**
 * Decompress a (possibly multi-frame) Zstandard buffer to UTF-8 text.
 * Frames are located structurally and decoded sequentially; a torn trailing
 * frame (crash during write) is skipped, matching the JSONL backend's own
 * recovery semantics.
 */
export declare function decompressZstdToText(input: Uint8Array): string;
/**
 * Decode only the leading frames — enough to reach the session header and the
 * early events (title etc.). Used by the session list so a large transcript
 * costs milliseconds instead of seconds. Decodes frames until maxBytes of
 * output is produced or the stream ends (no early stop at the first line).
 */
export declare function decodeZstdPrefix(input: Uint8Array, maxBytes?: number): string;
//# sourceMappingURL=zstd.d.ts.map