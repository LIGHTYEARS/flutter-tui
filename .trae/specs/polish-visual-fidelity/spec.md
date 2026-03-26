# 界面视觉精修 Spec — 从"廉价复制品"到 Pixel-Perfect

## Why

当前 flitter-amp 复刻的 Amp CLI 界面在结构上已经到位，但在视觉细节上与原版有显著差距——
ASCII art orb 简陋、欢迎屏幕颜色不对、输入框样式不匹配、状态图标不一致、Agent 模式标签样式差异大、
主题色映射存在多处错误、底部状态栏排版不对。总体观感像"廉价复制品"。

此外，**日志输出直接到终端会破坏 TUI 界面**——flitter-core 的 `frame-scheduler.ts` 中有 3 处 `console.error` 直接输出，
混入 TUI 的 ANSI 渲染流中，导致界面被破坏。

本轮工作目标是 **视觉精修 + 日志隔离**，不涉及协议/功能逻辑变更。

## What Changes

- **日志隔离** — flitter-core 的 `console.error` 输出到文件而非终端，避免破坏 TUI 界面
- **Orb 重构** — 从 14 行纯 ASCII art 升级为 Perlin 噪声驱动的 Braille 点阵动画球体 (对齐原版 `$XH` widget)
- **Welcome Screen 颜色修正** — 使用主题色替代硬编码 ANSI 色
- **状态图标统一** — 从 `●` 改为原版的 `✓` / `✗` / `⋯` (rR 函数)
- **输入框样式对齐** — border overlay text 位置、间距、模式标签格式
- **底部状态栏修正** — 4 角 overlay 对齐原版布局和颜色
- **主题色映射修正** — 修复 `deriveAppColors()` 中 11 处映射错误/偏差
- **AmpAppColors 扩充** — 补充缺失的关键语义色 (smartModeColor, userMessage, diffAdded/Removed 等)
- **旧组件主题迁移** — thinking-block, header-bar, diff-card 等 7 个组件迁移到 AmpTheme

## Impact
- Affected code: `packages/flitter-core/src/scheduler/frame-scheduler.ts` (console.error → logger 注入)
- Affected code: `packages/flitter-core/src/framework/binding.ts` (logger 配置)
- Affected code: `packages/flitter-amp/src/widgets/` (chat-view, tool-header, bottom-grid, input-area, thinking-block, diff-card, plan-view, header-bar, permission-dialog, file-picker, command-palette)
- Affected code: `packages/flitter-amp/src/themes/` (amp-theme-data, index, dark, light, catppuccin-mocha, solarized-dark, solarized-light, gruvbox-dark, nord)

---

## MODIFIED Requirements

### Requirement: 日志隔离 — 阻止 console 输出破坏 TUI

**问题根因**: `flitter-core/src/scheduler/frame-scheduler.ts` 有 3 处 `console.error` 调用：
1. L320: `console.error('Frame execution error:', message)` — drawFrame catch
2. L376: `console.error('Frame callback error in ${phase}...')` — executePhase catch  
3. L416: `console.error('Post-frame callback error...')` — executePostFrameCallbacks catch

`console.error` 在 Node.js/Bun 中输出到 stderr，但终端默认会将 stderr 和 stdout 混合显示。
当 TUI 正在渲染 ANSI 序列时，错误信息插入会破坏屏幕布局。

**解决方案**: 为 FrameScheduler 注入可配置的 `errorLogger` 回调，默认静默（生产 TUI 模式）
或重定向到 flitter-amp 的 `log.error()` (写入 stderr，但格式化不破坏渲染)。

具体改动：
1. `FrameScheduler` 构造/配置增加 `errorLogger?: (msg: string) => void` 参数
2. 将 3 处 `console.error(...)` 替换为 `this.errorLogger(...)` 
3. `runApp()` 的 options 新增 `errorLogger` 配置项
4. flitter-amp 的 `startTUI()` 传入 `log.error` 作为 errorLogger

#### Scenario: TUI 运行时帧回调抛出异常
- **WHEN** FrameScheduler 的某个阶段回调抛出错误
- **THEN** 错误信息通过 `errorLogger` 回调处理，**不** 直接 console.error 到终端
- **THEN** TUI 界面不受影响

#### Scenario: 非 TUI 模式 (测试/调试)
- **WHEN** 未配置 errorLogger
- **THEN** 默认行为为 `console.error` (向后兼容)

### Requirement: Orb 渲染

当前使用 14 行 `.` `:` `-` `=` `+` `*` 字符组成的静态 ASCII art。

修改为：使用 Perlin 噪声 + Braille Unicode 点阵 (U+2800 范围) 渲染的动画球体。
球体逐像素设置颜色强度，smart 模式使用绿色渐变 (rgb(0,255,136) ↔ rgb(0,140,70))。
动画帧率约 100ms。当动画被禁用时退化为静态渲染。

#### Scenario: 用户首次打开空对话
- **WHEN** conversation items 为空
- **THEN** 在屏幕中央显示动画 Braille Orb + "Welcome to Amp" + "Ctrl+O for help" + 每日名言
- **THEN** Orb 使用主题色渐变 (非硬编码 Color.green)

### Requirement: 状态图标

当前 ToolHeader 全部使用 `●` (实心圆) 作为状态图标。

修改为对齐原版 `rR` 函数：
- `done` → `✓` (U+2713)
- `error` / `cancelled` → `✗` (U+2715)
- `in_progress` / `pending` → `⋯` (U+22EF)

#### Scenario: 工具调用完成
- **WHEN** 工具状态为 `completed`
- **THEN** 显示 `✓` 图标，颜色为 `app.toolSuccess`

#### Scenario: 工具调用失败
- **WHEN** 工具状态为 `failed`
- **THEN** 显示 `✗` 图标，颜色为 `base.destructive`

#### Scenario: 工具调用进行中
- **WHEN** 工具状态为 `in_progress`
- **THEN** 显示 `⋯` 图标，颜色为 `app.toolRunning`，后跟 BrailleSpinner

### Requirement: 主题色映射

`deriveAppColors()` 当前有 11 处映射错误/偏差，需修正为对齐原版 `x1.default()`：

| 字段 | 当前错误映射 | 正确映射 (对齐 x1.default) |
|------|------------|--------------------------|
| `toolName` | `base.accent` | `base.foreground` |
| `toolCancelled` | `base.mutedForeground` | `base.warning` |
| `command` | `base.accent` | `base.warning` |
| `recommendation` | `base.warning` | `base.info` |
| `handoffMode` | `base.accent` | `base.secondary` |
| `shellMode` | `base.accent` | `base.info` |
| `queueMode` | `base.info` | 新增 queueModeGray rgb(160,160,160) |
| `scrollbarThumb` | `base.border` | `base.foreground` |
| `scrollbarTrack` | `base.background` | ANSI 256 index(8) |

### Requirement: AmpAppColors 接口扩充

补充以下关键缺失字段（从 x1 的 45 字段中挑选实际已被使用的）：

```
toolRunning: Color         // 工具运行中颜色 (原版 blue)
userMessage: Color         // 用户消息文本/边框颜色 (原版 success)  
smartModeColor: Color      // smart 模式标签颜色 (dark: rgb(0,255,136))
diffAdded: Color           // diff 新增行
diffRemoved: Color         // diff 删除行
diffContext: Color          // diff 上下文行
selectedMessage: Color     // 被选中消息边框色
waiting: Color             // 等待/排队状态色 (原版 yellow)
```

### Requirement: 输入框样式对齐

当前 InputArea 与原版 PromptBar (F0H) 的差异：
1. 原版 border 使用 `borderColor: A.border` (theme.colors.border)，失焦时无边框
2. 原版 overlayText 是 ContainerWithOverlays 的 border-overlay 定位（文字嵌入边框线上）
3. 原版 mode label 格式: `─smart─` `─▲─` `─6-skills─` (嵌入边框)
4. 原版 bottom-left overlay: `? for shortcuts` 在边框底边

修改为：InputArea 的 mode label 和 hint text 改为 border-overlay 风格。

### Requirement: 底部状态栏对齐

当前 BottomGrid 的 4 角 overlay 与原版的关键差异：
1. top-right agent mode label: 原版使用 `smartModeColor` (绿色 rgb(0,255,136))，当前用通用 modeColor
2. bottom-right: 原版格式 `~/.oh-my-coco/studio/flitter (master)` 带 `─` 包围嵌入边框
3. bottom-left: 原版 `? for shortcuts` 同样嵌入边框底边

### Requirement: 旧组件主题迁移

7 个旧组件仍使用硬编码 ANSI 色，需迁移到 `AmpThemeProvider.maybeOf(context)`：
- `thinking-block.ts` — 折叠/展开图标颜色、标题颜色
- `plan-view.ts` — plan 标签颜色 (blue → theme)
- `header-bar.ts` — 已 deprecated，仍需迁移以保持一致性
- `diff-card.ts` — diff 颜色
- `permission-dialog.ts` — 对话框边框/按钮颜色
- `file-picker.ts` — 列表高亮颜色
- `command-palette.ts` — 列表高亮颜色

## ADDED Requirements

### Requirement: Perlin Noise Orb Widget

新增 `OrbWidget` (StatefulWidget) 在 `packages/flitter-amp/src/widgets/orb-widget.ts`。

使用自包含的 2D 噪声函数（不引入外部库），配合 Braille 点阵逐像素渲染：
- 尺寸: ~40 cols × ~20 rows (braille 每 cell = 2×4 dots)
- 颜色: 模式相关渐变 (smart=绿, rush=金)
- 帧率: 100ms interval + setState

#### Scenario: Orb 动画正常运行
- **WHEN** 终端支持 Unicode
- **THEN** Orb 每 100ms 更新一帧，显示流畅的噪声纹理动画

### Requirement: Agent Mode 颜色函数

新增 `agentModeColor(mode: string, theme: AmpTheme): Color` 函数，
对齐原版 `Ym` 函数的颜色分配：
- `smart` → `theme.app.smartModeColor` (dark: rgb(0,255,136), light: rgb(0,140,70))
- `rush` → `theme.app.rushModeColor` (dark: rgb(255,215,0), light: rgb(180,100,0))
- 其他 → 从 agent uiHints 或默认 foreground

---

## REMOVED Requirements

无。
