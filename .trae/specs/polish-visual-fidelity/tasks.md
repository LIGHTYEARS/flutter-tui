# Tasks

## Task 0: 日志隔离 — 阻止 console 输出破坏 TUI ✅
- [x] SubTask 0.1: 在 `flitter-core/src/scheduler/frame-scheduler.ts` 中为 `FrameScheduler` 添加可配置的 `errorLogger` 回调属性，默认值为 `console.error` (向后兼容)
- [x] SubTask 0.2: 将 `frame-scheduler.ts` 中 3 处 `console.error(...)` 替换为 `this.errorLogger(...)` 调用
- [x] SubTask 0.3: 在 `flitter-core/src/framework/binding.ts` 的 `runApp()` options 中暴露 `errorLogger` 配置项，传递给 FrameScheduler
- [x] SubTask 0.4: 在 `flitter-amp/src/app.ts` 的 `startTUI()` 中传入 `log.error` 作为 errorLogger，使错误日志走 flitter-amp 的 `log` 系统 (写到 stderr，带时间戳格式化)

## Task 1: 修复主题色映射 + 扩充 AmpAppColors 接口 ✅
- [x] SubTask 1.1: 在 `amp-theme-data.ts` 的 `AmpAppColors` 接口中新增 8 个字段: `toolRunning`, `userMessage`, `smartModeColor`, `rushModeColor`, `diffAdded`, `diffRemoved`, `diffContext`, `waiting`
- [x] SubTask 1.2: 修正 `themes/index.ts` 的 `deriveAppColors()` — 修复 9 处错误映射 (toolName→foreground, toolCancelled→warning, command→warning, recommendation→info, handoffMode→secondary, shellMode→info, scrollbarThumb→foreground, scrollbarTrack→ansi256(8)), 并为新增字段提供派生逻辑
- [x] SubTask 1.3: 在 7 个主题文件中确认 base 字段完整，确保 `deriveAppColors` 的新映射覆盖所有主题
- [x] SubTask 1.4: 新增 `agentModeColor(mode, theme)` 函数到 `themes/index.ts`，对齐原版 `Ym` 的颜色分配

## Task 2: 状态图标对齐原版 (rR/j0) ✅
- [x] SubTask 2.1: 修改 `tool-header.ts` — 状态图标从 `●` 改为 `✓`/`✗`/`⋯`，并使用正确的 status→color 映射 (in_progress→toolRunning, pending→waiting, completed→toolSuccess, failed→destructive, cancelled→toolCancelled)
- [x] SubTask 2.2: 确认 `toolRunning` 颜色正确传递到 ToolHeader

## Task 3: Perlin Noise Orb 动画组件 ✅
- [x] SubTask 3.1: 新增 `src/widgets/orb-widget.ts` — 实现自包含 2D 噪声 + Braille 点阵渲染
  - 噪声: Value Noise 或 Simplex Noise (自实现，不引入外部库)
  - 椭圆遮罩: 只在球形区域内渲染，外部透明
  - 颜色: 噪声值映射到主题色渐变 (smart 模式: rgb(0,140,70) ↔ rgb(0,255,136))
  - 尺寸: ~40 cols × ~20 rows (对应 braille 的 80×80 dot grid)
  - 帧率: 100ms setInterval + setState
- [x] SubTask 3.2: 修改 `chat-view.ts` — 用 `OrbWidget` 替换静态 `AMP_ORB` 渲染
- [x] SubTask 3.3: Welcome screen 使用主题色: "Welcome to Amp" 使用 `theme.base.success`，"Ctrl+O" 使用 `theme.app.keybind`，"help" 使用 `theme.base.warning`

## Task 4: 输入框样式对齐 — border overlay 风格 ✅
- [x] SubTask 4.1: 修改 `input-area.ts` — mode label 改为 border-overlay 风格 (文字嵌入 border 线上)
  - 原版: overlayTexts position "bottom-right" → 文字会覆盖在 border 线条上
  - 效果: `──────────────────── smart ─` 底边右侧有模式标签嵌入
- [x] SubTask 4.2: InputArea border 颜色使用 `theme.base.border`，对齐原版 `borderColor: A.border`
- [x] SubTask 4.3: Agent mode label 使用 `agentModeColor()` 函数的颜色

## Task 5: 底部状态栏布局修正 ✅
- [x] SubTask 5.1: 修改 `bottom-grid.ts` — 移除独立的 top/bottom Stack，改为将 overlay text 嵌入 InputArea 的 border 上
  - top-right (mode label) 和 bottom-left (? for shortcuts), bottom-right (cwd+branch) 都应嵌入到 InputArea 的边框线上
  - 参考原版 F0H 的 `overlayTexts` → `ContainerWithOverlays` → `_toBorderTextOverlays` 的实现
- [x] SubTask 5.2: top-right agent mode 使用 `agentModeColor()` (smart→rgb(0,255,136)) 替代当前的 `modeColor()`
- [x] SubTask 5.3: bottom-right cwd+branch 格式对齐原版

## Task 6: 旧组件主题迁移 ✅
- [x] SubTask 6.1: `thinking-block.ts` — 迁移硬编码色到 AmpTheme
- [x] SubTask 6.2: `plan-view.ts` — plan 标签色迁移
- [x] SubTask 6.3: `diff-card.ts` — diff 颜色使用 `app.diffAdded`/`app.diffRemoved`/`app.diffContext`
- [x] SubTask 6.4: `permission-dialog.ts`, `file-picker.ts`, `command-palette.ts` — 对话框/列表色迁移
- [x] SubTask 6.5: `chat-view.ts` welcome screen 区域 — 迁移硬编码 ANSI 色

## Task 7: TypeScript 编译验证 ✅
- [x] SubTask 7.1: 运行 `tsc --noEmit` 确认零编译错误
- [x] SubTask 7.2: 确认所有主题文件与新 `AmpAppColors` 接口兼容

# Task Dependencies
- [Task 0] 无依赖，最高优先级 (日志破坏 TUI 是阻塞性问题)
- [Task 1] 无依赖，与 Task 0 可并行 (所有视觉任务依赖正确的主题色)
- [Task 2] 依赖 [Task 1] (需要 toolRunning, waiting 新字段)
- [Task 3] 依赖 [Task 1] (Orb 颜色来自主题 smartModeColor)
- [Task 4] 依赖 [Task 1] (border 颜色、mode label 颜色)
- [Task 5] 依赖 [Task 1, Task 4] (底部布局使用 agentModeColor)
- [Task 6] 依赖 [Task 1] (需要新 app 字段 diffAdded 等)
- [Task 7] 依赖 [Task 0-6] (最后验证)
- [Task 0, Task 1] 可完全并行
- [Task 2, Task 3, Task 4, Task 6] 在 Task 1 完成后可并行
