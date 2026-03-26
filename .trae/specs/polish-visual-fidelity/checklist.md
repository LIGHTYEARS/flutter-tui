# Checklist — 界面视觉精修验证

## 日志隔离 (Task 0)

- [x] `FrameScheduler` 有 `errorLogger` 可配置属性
- [x] `frame-scheduler.ts` 中无直接 `console.error` 调用（全部改为 `this.errorLogger`）
- [x] `runApp()` options 支持传入 `errorLogger`
- [x] `startTUI()` 传入 `log.error` 作为 errorLogger
- [x] TUI 运行时帧错误不会直接输出到终端破坏界面

## 主题色映射 (Task 1)

- [x] `AmpAppColors` 接口包含新增的 8 个字段 (toolRunning, userMessage, smartModeColor, rushModeColor, diffAdded, diffRemoved, diffContext, waiting)
- [x] `deriveAppColors()` 中 `toolName` 映射到 `base.foreground` (非 accent)
- [x] `deriveAppColors()` 中 `toolCancelled` 映射到 `base.warning` (非 mutedForeground)
- [x] `deriveAppColors()` 中 `command` 映射到 `base.warning` (非 accent)
- [x] `deriveAppColors()` 中 `recommendation` 映射到 `base.info` (非 warning)
- [x] `deriveAppColors()` 中 `handoffMode` 映射到 `base.secondary` (非 accent)
- [x] `deriveAppColors()` 中 `shellMode` 映射到 `base.info` (非 accent)
- [x] `deriveAppColors()` 中 `scrollbarThumb` 映射到 `base.foreground` (非 border)
- [x] `deriveAppColors()` 中 `scrollbarTrack` 映射到 `Color.ansi256(8)` (非 background)
- [x] `agentModeColor('smart', darkTheme)` 返回 `rgb(0,255,136)`
- [x] `agentModeColor('rush', darkTheme)` 返回 `rgb(255,215,0)`
- [x] 7 个主题文件全部通过 TypeScript 类型检查

## 状态图标 (Task 2)

- [x] `tool-header.ts` 中 completed 状态显示 `✓` (U+2713) 非 `●`
- [x] `tool-header.ts` 中 failed 状态显示 `✗` (U+2715) 非 `●`
- [x] `tool-header.ts` 中 in_progress 状态显示 `⋯` (U+22EF) 非 `●`
- [x] in_progress 状态颜色使用 `app.toolRunning` (蓝色系)
- [x] completed 状态颜色使用 `app.toolSuccess` (绿色系)

## Orb 动画组件 (Task 3)

- [x] `orb-widget.ts` 文件存在且导出 `OrbWidget` StatefulWidget
- [x] OrbWidget 使用自包含 2D 噪声函数（无外部库依赖）
- [x] OrbWidget 输出 Braille Unicode 字符 (U+2800 范围)
- [x] OrbWidget 使用椭圆遮罩限制球形区域
- [x] OrbWidget 颜色来自主题 (smartModeColor 渐变)
- [x] OrbWidget 有 100ms setInterval 动画驱动
- [x] `chat-view.ts` 的 welcome screen 使用 OrbWidget 替代静态 ASCII art
- [x] Welcome screen 的 "Welcome to Amp" 使用 `theme.base.success` 颜色
- [x] Welcome screen 的 "Ctrl+O" 使用 `theme.app.keybind` 颜色

## 输入框样式 (Task 4)

- [x] InputArea mode label 显示为 border-overlay 风格 (嵌入边框线上)
- [x] InputArea border 颜色使用 `theme.base.border`
- [x] Agent mode label 使用 `agentModeColor()` 函数着色

## 底部状态栏 (Task 5)

- [x] BottomGrid overlay text 嵌入 InputArea border 而非独立 Stack
- [x] top-right agent mode 使用 `agentModeColor()` (smart = rgb(0,255,136))
- [x] bottom-right cwd+branch 格式与原版一致

## 旧组件迁移 (Task 6)

- [x] `thinking-block.ts` 使用 AmpTheme 取色
- [x] `plan-view.ts` 使用 AmpTheme 取色
- [x] `diff-card.ts` 使用 `app.diffAdded`/`app.diffRemoved` 取色
- [x] `permission-dialog.ts` 使用 AmpTheme 取色
- [x] `file-picker.ts` 使用 AmpTheme 取色
- [x] `command-palette.ts` 使用 AmpTheme 取色
- [x] `chat-view.ts` welcome screen 区域无硬编码 ANSI 色

## 编译验证 (Task 7)

- [x] `tsc --noEmit` 在 flitter-amp 包下零错误通过
- [x] `tsc --noEmit` 在 flitter-core 包下无新增错误
- [x] 所有主题文件与新 AmpAppColors 接口兼容
