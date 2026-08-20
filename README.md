

<div align="center">

# 🐻 huahua 出品 · DSH Record & Replay

**DSH 录制回放插件 · 由 huahua 打造并持续维护**

| 品牌 | 项目 |
| --- | --- |
| 🐻 huahua | 本插件（录制回放） |
| 🐻 huahua | [huahua-dsh-plugin-orchestra](https://github.com/azure5100/huahua-dsh-plugin-orchestra) · 插件管理系统 |

*huahua 系列：为 DeepSeek Harness 打造实用、完整、可维护的插件。*

</div>

---


DSH Web GUI 的「录制回放」插件，两套能力：

1. **会话回放**：DSH 自动录制每一场会话（`~/.dsh/sessions/session.jsonl.zstd`），本插件把它变成可用资产——时间线回放、导出/导入可分享的回放包、一键复刻到全新会话重新执行。
2. **录屏 → 生成技能**（Codex Record & Replay 同款）：在浏览器里录下你的屏幕操作（computer use，`getDisplayMedia` → webm 视频 + 采样帧），回放查看，并让 agent 逐帧分析（`describe_image`）自动生成 `SKILL.md`，安装进 `~/.dsh/skills` 立即可用。

> 类似 Codex 的 record & replay：录制是自动的，本插件补齐「回放 / 分享 / 复刻」这一半。


> **衍生声明（Derivative notice）**：本仓库是 [kangshifu1/dsh-record-replay](https://github.com/kangshifu1/dsh-record-replay)（Apache-2.0）的适配衍生版。原项目作者：kangshifu1。本项目在此基础上做了 Windows / DSH rc.5 适配修复（见下方「Windows 适配」一节），其余功能与架构源自原项目。按 Apache-2.0 §4 注明来源与本项目改动。

---

## Windows 适配（Windows adaptation）

本项目在 Windows + DeepSeek Harness 0.1.0-rc.5 上实测通过，并为此做了 **4 处客户端源码适配**（原版按更新一代 DSH 外壳的 DOM 约定编写，在 rc.5 上不可用）：

| 文件 | 适配内容 |
| --- | --- |
| `src/client/mount.tsx` | 面板挂载选择器双匹配：`[data-pane="conversation"], [class*="centerCol"]`——适配 rc.5 外壳（无 data-pane，中央列为 CSS Module 类名 centerCol） |
| `src/client/styles.ts` | 定位上下文同步双选择器——修复「进入面板后左侧主界面被整个盖住」的问题（rc.5 无 data-pane 定位上下文，绝对定位会锚定到外层 frame） |
| `src/client/locales.ts` | 新增「关闭面板」文案（中英双语） |
| `src/client/panel/ReplayPanel.tsx` | 面板头部加「关闭面板」按钮——原版无关闭入口，界面被盖住时无法返回对话 |

**适配目标 DSH 版本**：DeepSeek Harness 0.1.0-rc.5（Windows 桌面版）。在带 `data-pane`/taskboard/ssh 面板的新版外壳上，双选择器保持向后兼容（老规则对不存在的元素是空操作）。

> 完整适配过程与踩坑记录见：`docs/适配修复报告.md`（Windows 环境构建：NTFS 目录联接、pnpm 11、Node ≥ 20）。

---

## 能力

| 功能 | 说明 |
| --- | --- |
| 会话库 | 侧边栏「录制回放」入口，列出本机全部已录制会话（标题 / 项目 / 时间 / 消息数） |
| 时间线回放 | 以可读时间线查看任意会话：用户消息、助手回复（推理过程可折叠）、工具调用与参数、工具结果（长文可展开），支持搜索过滤 |
| 导出回放包 | 把任意会话导出为单个 `dsh-replay-pack` JSON（`*.replay.json`），git 友好、体积小，可直接放到 GitHub 仓库分享 |
| 导入回放包 | 导入队友 / GitHub 上分享的 `.replay.json`，存到 `~/.dsh/replay-packs`，可查看、删除、复刻 |
| 复刻执行 | 把录制会话的**用户消息**按原顺序逐条发送到全新会话，让 agent 真实重新执行一遍（可用于复现、回归、教学、模板化流程） |
| 录屏 | 浏览器 `getDisplayMedia` 录制屏幕/窗口（webm + 每 2s 采样帧，存 `~/.dsh/recordings`），支持回放与删除 |
| 生成技能 | 一键让 agent 会话逐帧分析录屏（`describe_image`），输出 SKILL.md 并安装到 `~/.dsh/skills`——新技能被 skill 目录热监听发现，直接进入每个会话的技能目录 |

## 安装

```bash
# 本地路径安装（开发 / 自用，推荐）
dsh plugin --profile web add link:/path/to/dsh-record-replay

# 或从 npm 安装（发布后）
dsh plugin --profile web add dsh-record-replay
```

安装后**重启 dsh web GUI**（插件集会变更需要重启生效）。侧边栏出现「录制回放」入口即成功。

> 原理：`dsh plugin` 是 pnpm 转发器——把包装进 profile 的 `node_modules`，检测到 `dsh.bundle` 声明后把 `cordis.patch.yml` 并入 bundle 层，插件行进入 roster；浏览器半区按 `dsh.client` 声明以 `/plugins/dsh-record-replay/client.js` 加载。

## 使用

1. 点侧边栏「录制回放」打开面板。
2. **会话** tab：任一会话可「回放」（时间线）、「导出」（下载回放包）、「复刻」（开新会话重新执行）。
3. **回放包** tab：导入 `.replay.json`，管理已导入的包。
4. **录屏** tab：点「开始录屏」选择屏幕/窗口录制操作；停止后自动上传视频与采样帧。对任意录屏可「回放」，或点「生成技能」——插件开一个 agent 会话，让它逐帧调用 `describe_image` 提炼工作流并产出 SKILL.md，写入 `~/.dsh/skills/<name>/SKILL.md` 后即成为可用技能。

## 回放包格式

```json
{
  "format": "dsh-replay-pack",
  "version": 1,
  "meta": { "title": "...", "cwd": "...", "createdAt": 0, "agentPreset": "code", "exportedAt": 0, "sourceSessionId": "session-..." },
  "items": [
    { "kind": "user", "turn": 1, "step": 1, "text": "...", "time": 0 },
    { "kind": "assistant", "turn": 1, "step": 1, "text": "...", "reasoning": "...", "time": 0 },
    { "kind": "tool", "turn": 1, "step": 1, "name": "run_code", "callId": "...", "argsText": "{...}", "time": 0 },
    { "kind": "result", "turn": 1, "step": 1, "callId": "...", "text": "...", "time": 0 }
  ]
}
```

## 数据与隐私

- **读取**：`~/.dsh/sessions/**/session.jsonl(.zstd)`（DSH 自动录制，本插件只读）。
- **写入**：`~/.dsh/replay-packs/`（导入的回放包）、`~/.dsh/recordings/`（录屏）、`~/.dsh/skills/`（生成的技能）。
- **录屏隐私**：录屏会捕获屏幕上的一切（含密码输入等），生成技能前请留意；录制全程仅在浏览器本地，上传存于本机 `~/.dsh/recordings`。
- **注意**：回放包含完整对话与工具输出，可能含密钥 / 敏感信息——分享前请自行脱敏。API 路由仅限 loopback（本机浏览器同源），LAN 暴露的 dsh web 部署不会提供服务。

## 开发

```bash
pnpm install
pnpm build        # tsc 编译宿主半区到 lib/，tsdown 打包浏览器半区到 lib/client.js
pnpm smoke        # 对本机真实会话跑一遍 扫描→解析→建包→解析→存库 冒烟测试
```

## 架构

双面插件（dsh-web-ui 家族约定）：

- **宿主半区**（`src/index.ts`，node）：`SessionStore` 扫描解码会话、`timeline.ts` 蒸馏时间线、`replay-pack.ts` / `pack-store.ts` 回放包、`recording-store.ts` 录屏存储（webm + 帧，视频带 Range 支持）、`skill-installer.ts` 技能安装（校验 frontmatter 与 skill 命名、写入 `~/.dsh/skills`）、`routes.ts` 提供 `/api/dsh-record-replay/*`，并向 agent 宣告插件存在（system-prompt section）。zstd 解码使用 vendored [fzstd](https://github.com/101arrowz/fzstd)（MIT，支持多帧流），无运行时第三方依赖。
- **浏览器半区**（`src/client/`）：侧边栏入口（DOM 级注入、自愈）+ 中央列面板（React，单占用者接管，与 task-board / ssh 面板互斥）。会话/回放包/录屏三个 tab；复刻执行与技能生成都复用官方 `sessions` / `workspaces` / `connection` 服务——技能生成会话用 `describe_image` 逐帧看录屏帧（宿主以 HTTP URL 提供），最后把 agent 输出的 SKILL.md 交给宿主安装。

## License

Apache-2.0。Vendored fzstd © 101arrowz, MIT（见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)）。


---

## 🐻 huahua 出品

**huahua**（花花的团队/个人）致力于为 DeepSeek Harness 打造高质量插件：

- **[huahua-dsh-plugin-orchestra](https://github.com/azure5100/huahua-dsh-plugin-orchestra)** — DSH 插件管理系统：清单 / 更新检测 / 一键升级 / 备份回滚
- **本插件（record-replay）** — DSH 录制回放：会话时间线 / 回放包 / 复刻 / 录屏生成技能

功能完整、Windows 实测可用、持续维护。有问题欢迎提 Issue / PR。

