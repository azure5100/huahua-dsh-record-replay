/**
 * Zstandard decompression for session logs. The JSONL backend writes zstd
 * frames (often one small frame per packed chunk), so a whole file is a
 * concatenated multi-frame stream.
 *
 * Node >= 22 ships native zstd (node:zlib) which is orders of magnitude
 * faster than the JS fallback (fzstd): a 8.5 MB / 20k-frame session decodes
 * in ~1 s natively vs ~31 s with fzstd. Frames are located by parsing the
 * frame structure (the same scan the DSH backend itself uses), then decoded
 * individually with node:zlib; fzstd remains the fallback where native zstd
 * is unavailable.
 */
import { zstdDecompressSync } from 'node:zlib';
import { decompress as fzstdDecompress } from './vendor/fzstd.mjs';
const ZSTD_MAGIC = 0xfd2fb528;
function nativeSupported() {
    return typeof zstdDecompressSync === 'function';
}
/**
 * Locate complete frames without decompressing their blocks — the same
 * structural scan the DSH persistence backend uses. Invalid complete
 * structure throws; EOF inside the final frame returns it as torn.
 */
function scanZstdFrames(buffer) {
    const frames = [];
    let offset = 0;
    while (offset < buffer.length) {
        const start = offset;
        if (buffer.length - offset < 4)
            break;
        if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC)
            break;
        offset += 4;
        if (offset === buffer.length)
            break;
        const descriptor = buffer.readUInt8(offset);
        offset += 1;
        if ((descriptor & 0x18) !== 0)
            break;
        const contentSizeFlag = descriptor >>> 6;
        const singleSegment = (descriptor & 0x20) !== 0;
        const checksum = (descriptor & 0x04) !== 0;
        const dictionaryFlag = descriptor & 0x03;
        const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag;
        const contentSizeBytes = contentSizeFlag === 0
            ? (singleSegment ? 1 : 0)
            : 1 << contentSizeFlag;
        const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes;
        if (buffer.length - offset < remainingHeaderBytes)
            break;
        offset += remainingHeaderBytes;
        for (;;) {
            if (buffer.length - offset < 3)
                return { frames };
            const blockHeader = buffer.readUIntLE(offset, 3);
            offset += 3;
            const lastBlock = (blockHeader & 1) !== 0;
            const blockType = (blockHeader >>> 1) & 0x03;
            const blockSize = blockHeader >>> 3;
            if (blockType === 0x03)
                break;
            const payloadBytes = blockType === 0x01 ? 1 : blockSize;
            if (buffer.length - offset < payloadBytes)
                return { frames };
            offset += payloadBytes;
            if (lastBlock)
                break;
        }
        if (checksum) {
            if (buffer.length - offset < 4)
                return { frames };
            offset += 4;
        }
        frames.push({ start, end: offset });
    }
    return { frames };
}
/** Decompress one complete frame. */
function decompressFrame(frame) {
    if (nativeSupported())
        return zstdDecompressSync(frame);
    return Buffer.from(fzstdDecompress(frame));
}
/**
 * Decompress a (possibly multi-frame) Zstandard buffer to UTF-8 text.
 * Frames are located structurally and decoded sequentially; a torn trailing
 * frame (crash during write) is skipped, matching the JSONL backend's own
 * recovery semantics.
 */
export function decompressZstdToText(input) {
    if (!nativeSupported()) {
        return new TextDecoder().decode(fzstdDecompress(input));
    }
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
    const { frames } = scanZstdFrames(buf);
    const chunks = [];
    for (const frame of frames) {
        try {
            chunks.push(decompressFrame(buf.subarray(frame.start, frame.end)));
        }
        catch {
            break; // torn frame
        }
    }
    return Buffer.concat(chunks).toString('utf8');
}
/**
 * Decode only the leading frames — enough to reach the session header and the
 * early events (title etc.). Used by the session list so a large transcript
 * costs milliseconds instead of seconds. Decodes frames until maxBytes of
 * output is produced or the stream ends (no early stop at the first line).
 */
export function decodeZstdPrefix(input, maxBytes = 128 * 1024) {
    if (!nativeSupported()) {
        return new TextDecoder().decode(fzstdDecompress(input));
    }
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
    const { frames } = scanZstdFrames(buf);
    const chunks = [];
    let total = 0;
    for (const frame of frames) {
        if (total >= maxBytes)
            break;
        try {
            const out = decompressFrame(buf.subarray(frame.start, frame.end));
            chunks.push(out);
            total += out.length;
        }
        catch {
            break;
        }
    }
    return Buffer.concat(chunks).toString('utf8');
}
//# sourceMappingURL=zstd.js.map