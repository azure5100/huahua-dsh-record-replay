/**
 * Locale dictionaries for the record-replay surface. zh is the key source;
 * en mirrors every key (values are the key names, ready to be translated).
 * The ReplayKey union is derived from zh, matching the locale service's
 * LocaleDictOf contract (keys, not an interface, must name the namespace).
 */
export declare const zh: {
    'entry.label': string;
    'entry.tooltip': string;
    'panel.close': string;
    'tab.sessions': string;
    'tab.packs': string;
    'sessions.empty': string;
    'sessions.reload': string;
    'sessions.loading': string;
    'sessions.error': string;
    'session.view': string;
    'session.export': string;
    'session.rerun': string;
    'session.noTitle': string;
    'session.unknownProject': string;
    'packs.empty': string;
    'packs.import': string;
    'packs.importing': string;
    'packs.delete': string;
    'packs.view': string;
    'packs.rerun': string;
    'viewer.back': string;
    'viewer.title': string;
    'viewer.search': string;
    'viewer.searchPlaceholder': string;
    'viewer.user': string;
    'viewer.assistant': string;
    'viewer.tool': string;
    'viewer.result': string;
    'viewer.reasoning': string;
    'viewer.args': string;
    'viewer.expand': string;
    'viewer.collapse': string;
    'viewer.empty': string;
    'viewer.stats': string;
    'viewer.copy': string;
    'viewer.copied': string;
    'run.title': string;
    'run.cancel': string;
    'run.close': string;
    'run.start': string;
    'run.status.connecting': string;
    'run.status.sending': string;
    'run.status.running': string;
    'run.status.done': string;
    'run.status.error': string;
    'run.openSession': string;
    'run.msgCount': string;
    'run.progress': string;
    'tab.record': string;
    'record.title': string;
    'record.start': string;
    'record.stop': string;
    'record.recording': string;
    'record.uploading': string;
    'record.frames': string;
    'record.video': string;
    'record.empty': string;
    'record.titlePrompt': string;
    'record.replay': string;
    'record.genSkill': string;
    'record.delete': string;
    'record.deleteConfirm': string;
    'record.noVideo': string;
    'skill.gen': string;
    'skill.generating': string;
    'skill.framesHint': string;
    'skill.status.connecting': string;
    'skill.status.running': string;
    'skill.done': string;
    'skill.error': string;
    'skill.installedAt': string;
    'skill.openSession': string;
};
/** English copy (mirror of zh; translate the values before publishing). */
export declare const en: Record<ReplayKey, string>;
/** Locale key union. */
export type ReplayKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map