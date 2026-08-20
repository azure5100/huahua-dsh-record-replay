/**
 * Pack store: persists imported replay packs under ~/.dsh/replay-packs so
 * they survive reloads and can be viewed/re-run later without the original
 * session files.
 */
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { packIdOf, packStoreFileName, parseReplayPack } from "./replay-pack.js";
import { PACKS_ROOT } from "./paths.js";
export class PackStore {
    root;
    /** @param root - packs directory (defaults to the DSH home layout). */
    constructor(root = PACKS_ROOT) {
        this.root = root;
    }
    async ensureDir() {
        await mkdir(this.root, { recursive: true });
    }
    /** Save (or overwrite) one pack; returns its summary. */
    async save(pack) {
        await this.ensureDir();
        const id = packIdOf(pack);
        const file = join(this.root, packStoreFileName(pack));
        await writeFile(file, JSON.stringify(pack, null, 2), 'utf8');
        const info = await stat(file);
        return {
            id,
            file,
            meta: pack.meta,
            itemCount: pack.items.length,
            userMessages: pack.items.filter(item => item.kind === 'user').length,
            modifiedAt: info.mtimeMs,
        };
    }
    /** List every stored pack, newest first. Never throws. */
    async list() {
        let files;
        try {
            files = await readdir(this.root);
        }
        catch {
            return [];
        }
        const out = [];
        for (const file of files) {
            if (!file.endsWith('.json'))
                continue;
            try {
                const pack = await this.readId(file.slice(0, -5));
                if (pack === undefined)
                    continue;
                const info = await stat(join(this.root, file));
                out.push({
                    id: packIdOf(pack),
                    file: join(this.root, file),
                    meta: pack.meta,
                    itemCount: pack.items.length,
                    userMessages: pack.items.filter(item => item.kind === 'user').length,
                    modifiedAt: info.mtimeMs,
                });
            }
            catch { /* skip corrupt files */ }
        }
        out.sort((a, b) => b.modifiedAt - a.modifiedAt);
        return out;
    }
    /** Read one pack by id. */
    async read(id) {
        if (id === '' || /[^a-zA-Z0-9-]/.test(id))
            return undefined;
        return this.readId(id);
    }
    async readId(id) {
        try {
            const text = await readFile(join(this.root, `${id}.json`), 'utf8');
            return parseReplayPack(text);
        }
        catch {
            return undefined;
        }
    }
    /** Delete one pack by id. */
    async remove(id) {
        if (id === '' || /[^a-zA-Z0-9-]/.test(id))
            return false;
        try {
            await rm(join(this.root, `${id}.json`));
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=pack-store.js.map