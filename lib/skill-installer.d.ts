import type { InstalledSkill } from './types.ts';
/** Public skill-name grammar (mirrors the harness isSkillName). */
export declare const SKILL_NAME_PATTERN: RegExp;
/** A parsed SKILL.md. */
export interface ParsedSkill {
    name: string;
    description: string;
    body: string;
    /** The normalized full text (frontmatter + body) written to disk. */
    text: string;
}
/**
 * Parse a SKILL.md text: YAML frontmatter (name/description) + markdown body.
 * Tolerates a surrounding ``` fence (agents often wrap output). Throws with a
 * human-readable reason when the shape is not a valid skill.
 */
export declare function parseSkillText(input: string): ParsedSkill;
export declare class SkillInstaller {
    private readonly root;
    /** @param root - user skill root (defaults to ~/.dsh/skills). */
    constructor(root?: string);
    /**
     * Parse + install one skill text into the root.
     * @returns the installed skill record.
     */
    install(text: string): Promise<InstalledSkill>;
    /** List installed skills (directories with a SKILL.md). Never throws. */
    list(): Promise<InstalledSkill[]>;
}
//# sourceMappingURL=skill-installer.d.ts.map