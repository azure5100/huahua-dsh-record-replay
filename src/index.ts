/**
 * huahua-dsh-record-replay — host half. Scans the DSH session library (the JSONL
 * transcripts the persistence backend records automatically), serves the
 * /api/huahua-dsh-record-replay route family (library, timeline, replay-pack
 * export/import), keeps the imported-pack store under ~/.dsh/replay-packs,
 * and announces the capability to agents via a system-prompt section.
 * The browser half (./client) renders the replay panel. Everything rides
 * official SDK packages plus vendored fzstd — no dsh source changes.
 */
import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from 'schemastery'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { makeRoutes } from './routes.ts'
import { RecordingStore } from './recording-store.ts'
import { SkillInstaller } from './skill-installer.ts'
import { SessionStore } from './session-store.ts'
import { PackStore } from './pack-store.ts'

/** Stable cordis plugin name. */
export const name = 'record-replay'

/** Services required before the surfaces can mount. */
export const inject = ['webServer', 'systemPrompt']

/**
 * Settings namespace of the record-replay capability. Spelled here rather
 * than imported: the browser half spells the same value and must not depend
 * on a Host package.
 */
export const RECORD_REPLAY_SETTINGS_NAMESPACE = settingsNamespace('huahua-dsh-record-replay')

/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
  /**
   * When true (default), a system-prompt section announces the plugin to
   * every agent. Set false to keep it silent.
   */
  announceToAgent?: boolean
  /** Master switch for the plugin (routes + prompt section). */
  enabled?: boolean
}

export const Config: z<Config> = z.object({
  announceToAgent: z.boolean().default(true),
  enabled: z.boolean().default(true),
})

/** Schema default, re-read for hand-built test contexts. */
const DEFAULT_ANNOUNCE = true

/** Order of the announcement section within the tool-guidance band. */
const SECTION_ORDER = 155

/** Model-facing announcement: plugin presence, capabilities, and limits. */
  export const RECORD_REPLAY_GUIDANCE = '本机已安装 huahua-dsh-record-replay 插件（DSH 录制回放）：侧边栏「录制回放」入口。能力一（会话）：读取 ~/.dsh/sessions 下自动录制的全部会话，时间线回放、导出/导入可分享的回放包（dsh-replay-pack JSON）、复刻到全新会话重新执行。能力二（录屏 → 生成技能）：在浏览器录制屏幕操作（getDisplayMedia，存 ~/.dsh/recordings，含 webm 视频与采样帧），可回放，并可启动一个 agent 会话逐帧分析（用 describe_image 工具）生成 SKILL.md，写入 ~/.dsh/skills 使之成为可用技能。限制：仅本机数据；回放包含完整对话与工具输出、录屏含屏幕内容，分享/生成前注意敏感信息。用户提到「录制回放 / record replay / 会话回放 / 复刻会话 / 录屏 / 生成技能 / 录屏生成 skill」时即指本插件，请据此协作。'

/**
 * Mount the session store, routes, and announcement.
 * @param ctx - host plugin context carrying webServer/systemPrompt.
 * @param config - resolved plugin config (schema defaults applied by the loader).
 */
export function apply(ctx: Context, config?: Config): void {
  // The live source the surfaces read: the settings section once the web
  // settings surface is served, the composition entry otherwise.
  let current: () => Config = () => config ?? {}
  const resolve = (): Config => {
    const value = current()
    return {
      announceToAgent: value.announceToAgent ?? DEFAULT_ANNOUNCE,
      enabled: value.enabled ?? true,
    }
  }

  const sessions = new SessionStore()
  const packs = new PackStore()
  const recordings = new RecordingStore()
  const skills = new SkillInstaller()

  const routes = makeRoutes({ sessions, packs, recordings, skills })
  let disposeRoutes: (() => void) | undefined
  let disposeSection: (() => void) | undefined

  // Register (or drop) every surface to match the current source. Each group
  // is kept under one disposer: re-registering first tears the old one down.
  const sync = (): void => {
    if (disposeSection !== undefined) { disposeSection(); disposeSection = undefined }
    if (disposeRoutes !== undefined) { disposeRoutes(); disposeRoutes = undefined }
    const value = resolve()
    if (!value.enabled) return
    if (value.announceToAgent) {
      disposeSection = ctx.systemPrompt.section({
        name: 'plugin:huahua-dsh-record-replay',
        order: SECTION_ORDER,
        text: RECORD_REPLAY_GUIDANCE,
      })
    }
    disposeRoutes = ctx.effect(() => {
      const disposers = routes.map(route => ctx.webServer.register(route))
      return () => { for (const dispose of disposers) dispose() }
    }, 'huahua-dsh-record-replay: routes')
  }

  installSettingsSection(ctx, RECORD_REPLAY_SETTINGS_NAMESPACE, Config, config ?? {}, {
    setSource: (source) => { current = source; sync() },
    onChange: sync,
  })

  // Initial registration from the composition entry (covers deployments with
  // no settings service, whose installSettingsSection never fires its hooks).
  sync()
}