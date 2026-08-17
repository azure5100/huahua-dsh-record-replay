/**
 * On-disk locations this plugin reads/writes. Everything lives under the DSH
 * home directory so the plugin needs no extra configuration.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
/** DSH home root (mirrors the harness DSH_HOME convention). */
export const DSH_HOME = process.env.DSH_HOME ?? join(homedir(), '.dsh');
/** Where the JSONL persistence backend keeps per-project session logs. */
export const SESSIONS_ROOT = join(DSH_HOME, 'sessions');
/** Where imported replay packs live (this plugin owns this directory). */
export const PACKS_ROOT = join(DSH_HOME, 'replay-packs');
/** Where screen recordings live (this plugin owns this directory). */
export const RECORDINGS_ROOT = join(DSH_HOME, 'recordings');
/** Where generated skills are installed (the user skill root, skill-filesystem scans it). */
export const SKILLS_ROOT = join(DSH_HOME, 'skills');
//# sourceMappingURL=paths.js.map