/**
 * Skill installer: turns an agent-generated SKILL.md into a discoverable DSH
 * skill by writing it into the user skill root (~/.dsh/skills/<name>/SKILL.md).
 * The skill-filesystem provider scans that root and hot-refreshes the catalog
 * (chokidar watch), so a generated skill becomes available to every session.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SKILLS_ROOT } from "./paths.js";
/** Public skill-name grammar (mirrors the harness isSkillName). */
export const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/**
 * Parse a SKILL.md text: YAML frontmatter (name/description) + markdown body.
 * Tolerates a surrounding ``` fence (agents often wrap output). Throws with a
 * human-readable reason when the shape is not a valid skill.
 */
export function parseSkillText(input) {
    let text = input.replace(/^\uFEFF/, '').trim();
    // Strip one surrounding code fence if present.
    const fence = /^```[a-zA-Z0-9]*\n([\s\S]*?)\n```$/.exec(text);
    if (fence !== null)
        text = fence[1].trim();
    if (!text.startsWith('---'))
        throw new Error('skill must start with a --- frontmatter block');
    const end = text.indexOf('\n---', 3);
    if (end < 0)
        throw new Error('skill frontmatter is not closed');
    const frontmatter = text.slice(3, end).trim();
    const body = text.slice(end + 4).trimStart();
    const name = frontmatterValue(frontmatter, 'name');
    const description = frontmatterValue(frontmatter, 'description');
    if (name === undefined)
        throw new Error('skill frontmatter is missing a name');
    if (!SKILL_NAME_PATTERN.test(name))
        throw new Error(`invalid skill name "${name}" (lowercase letters, digits, hyphens)`);
    if (description === undefined || description === '')
        throw new Error('skill frontmatter is missing a description');
    if (body === '')
        throw new Error('skill body is empty');
    return { name, description, body, text: `---\nname: ${name}\ndescription: ${description}\n---\n\n${body}\n` };
}
/** Pull one `key: value` line out of a tiny frontmatter block. */
function frontmatterValue(frontmatter, key) {
    const pattern = new RegExp(`^${key}:\\s*(.+)$`, 'm');
    const match = pattern.exec(frontmatter);
    if (match === null)
        return undefined;
    let value = match[1].trim();
    // Unquote single- or double-quoted values.
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
        value = value.slice(1, -1);
    }
    return value;
}
export class SkillInstaller {
    root;
    /** @param root - user skill root (defaults to ~/.dsh/skills). */
    constructor(root = SKILLS_ROOT) {
        this.root = root;
    }
    /**
     * Parse + install one skill text into the root.
     * @returns the installed skill record.
     */
    async install(text) {
        const parsed = parseSkillText(text);
        const dir = join(this.root, parsed.name);
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, 'SKILL.md'), parsed.text, 'utf8');
        return { name: parsed.name, description: parsed.description, path: join(dir, 'SKILL.md') };
    }
    /** List installed skills (directories with a SKILL.md). Never throws. */
    async list() {
        let entries;
        try {
            entries = await readdir(this.root);
        }
        catch {
            return [];
        }
        const out = [];
        for (const entry of entries) {
            if (entry.startsWith('.'))
                continue;
            try {
                const text = await readFile(join(this.root, entry, 'SKILL.md'), 'utf8');
                const parsed = parseSkillText(text);
                out.push({ name: parsed.name, description: parsed.description, path: join(this.root, entry, 'SKILL.md') });
            }
            catch { /* not a skill */ }
        }
        out.sort((a, b) => a.name.localeCompare(b.name));
        return out;
    }
}
//# sourceMappingURL=skill-installer.js.map