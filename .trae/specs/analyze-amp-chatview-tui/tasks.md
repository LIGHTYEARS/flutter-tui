# Tasks

## 🟡 flitter-core 框架层补充

- [x] Task 1: [flitter-core] 实现 StickyHeader 组件 (R9)
  - [x] SubTask 1.1: 新增 `StickyHeader` MultiChildRenderObjectWidget (`widgets/sticky-header.ts`)
  - [x] SubTask 1.2: 新增 `RenderStickyHeader` ContainerRenderBox (`layout/render-sticky-header.ts`)
  - [x] SubTask 1.3: 实现 performLayout — header + body 垂直排列
  - [x] SubTask 1.4: 实现 paint — 检测视口 clip rect，置顶 header，被推走算法
  - [x] SubTask 1.5: 编写单元测试验证置顶/推走行为

- [x] Task 2: [flitter-core] 实现 Autocomplete 组件 (R12)
  - [x] SubTask 2.1: 新增 `AutocompleteTrigger` 接口 — 定义触发字符、匹配模式、数据源
  - [x] SubTask 2.2: 新增 `Autocomplete` StatefulWidget — 检测触发、显示弹出层
  - [x] SubTask 2.3: 实现补全列表弹出（使用 Stack + Positioned 或 ContainerWithOverlays）
  - [x] SubTask 2.4: 实现模糊匹配 (`FuzzyMatcher`) — 支持前缀匹配和子序列匹配
  - [x] SubTask 2.5: 编写单元测试

## 🔵 flitter-amp 应用层实现

- [x] Task 3: [flitter-amp] 实现 Amp RGB 真彩色主题系统 (R13)
  - [x] SubTask 3.1: 新增 `src/themes/amp-theme-data.ts` — AmpThemeColors + AmpAppTheme 接口定义
  - [x] SubTask 3.2: 新增 `src/themes/dark.ts` — Dark 主题完整 RGB 色板 (见 spec.md §8.4)
  - [x] SubTask 3.3: 新增 `src/themes/light.ts` — Light 主题完整 RGB 色板
  - [x] SubTask 3.4: 新增 `src/themes/catppuccin-mocha.ts` + `solarized-dark.ts` + `solarized-light.ts` + `gruvbox-dark-hard.ts` + `nord.ts` + `terminal.ts`
  - [x] SubTask 3.5: 新增 `AmpThemeProvider` InheritedWidget — 使用 flitter-core Theme/AppTheme 机制
  - [ ] SubTask 3.6: 迁移所有组件从 ANSI 标准色到 `AmpTheme.of(context)` 取色

- [x] Task 4: [flitter-amp] 重构 ToolCallWidget 为 35+ 工具类型分发系统 (R15)
  - [x] SubTask 4.1: 新增 `src/widgets/tool-call/tool-call-widget.ts` — 顶层分发 switch-case
  - [x] SubTask 4.2: 新增 `src/widgets/tool-call/generic-tool-card.ts` — 通用卡片布局（header + body + 递归嵌套）
  - [x] SubTask 4.3: 新增 `src/widgets/tool-call/tool-header.ts` — ToolHeader (● 状态 + 名称 + spinner)
  - [x] SubTask 4.4: 实现 P0 工具渲染器: `ReadTool`, `EditFileTool`, `BashTool`, `GrepTool`, `TaskTool`
  - [x] SubTask 4.5: 实现 P1 工具渲染器: `CreateFileTool`, `WebSearchTool`, `HandoffTool`, `TodoListTool`
  - [ ] SubTask 4.6: 实现 P2 工具渲染器: `MermaidTool`, `PainterTool`, `ReplTool`
  - [x] SubTask 4.7: 实现 default GenericToolCard 回退

- [x] Task 5: [flitter-amp] 增强 PromptBar 输入系统 (R16)
  - [x] SubTask 5.1: 实现 Shell 模式 — `$`/`$$` 前缀检测 + UI 切换（背景色变化 + 提示文字）
  - [x] SubTask 5.2: 集成 Autocomplete — `@` 文件补全 + `@@` 线程引用
  - [x] SubTask 5.3: 实现 Submit 键配置 — Enter 或 Cmd+Enter
  - [x] SubTask 5.4: 实现 Shift+Enter 换行
  - [x] SubTask 5.5: 实现 Placeholder 和 Top widget (快捷键帮助面板)

- [x] Task 6: [flitter-amp] 实现 BottomGrid 底部区域布局 (R17)
  - [x] SubTask 6.1: 新增 `src/widgets/bottom-grid.ts` — BottomGrid StatefulWidget
  - [x] SubTask 6.2: 实现 4 角 overlay text 定位（top-left/top-right/bottom-left/bottom-right）
  - [x] SubTask 6.3: 实现 top-left 模式指示器 (shell/handoff/queue/deep/usage)
  - [x] SubTask 6.4: 实现 top-right Agent 模式标签 (smart/code/deep/ask + fast)
  - [x] SubTask 6.5: 实现 bottom-left/right 提示文字和工作目录
  - [x] SubTask 6.6: 替换当前 StatusBar + InputArea 为 BottomGrid

- [x] Task 7: [flitter-amp] 完善 Chat View 组件树 (R14)
  - [x] SubTask 7.1: 集成 StickyHeader — 每条消息包裹 StickyHeader (header: 角色标签, body: 内容)
  - [x] SubTask 7.2: 完善助手消息渲染 — ThinkingBlock + Markdown + ToolCallWidget 嵌套
  - [x] SubTask 7.3: 完善用户消息渲染 — 绿色左边框 + italic (对齐 Amp 视觉)
  - [x] SubTask 7.4: 集成 BottomGrid 替换当前底部区域
  - [x] SubTask 7.5: 确保全局快捷键 (Ctrl+O/C/L, Alt+T/D) 正确工作

- [x] Task 8: [flitter-amp] 接入动画效果 (R18)
  - [x] SubTask 8.1: 接入 BrailleSpinner — 工具进行中 spinner (使用 core BrailleSpinner + setInterval)
  - [x] SubTask 8.2: 实现 Handoff blink — 700ms setInterval + setState 切换 ● 颜色
  - [x] SubTask 8.3: 确保 Copy Highlight 正常工作 (core RenderText 已支持)

- [x] Task 9: 编写完整的 TUI-CHATVIEW-SPEC.md 分析文档
  - [x] SubTask 9.1: 汇总所有三层架构分析到 `packages/flitter-amp/.ref/amp-cli/TUI-CHATVIEW-SPEC.md`
  - [x] SubTask 9.2: 包含 Amp 混淆名 ↔ flitter 类名的完整映射表
  - [x] SubTask 9.3: 包含每个组件的 build() Widget 树结构

# Task Dependencies
- [Task 1] 无依赖，可立即开始 (flitter-core StickyHeader)
- [Task 2] 无依赖，可立即开始 (flitter-core Autocomplete)
- [Task 3] 无依赖，可立即开始 (flitter-amp 主题)
- [Task 4] 依赖 [Task 3] (工具卡片需要主题色)
- [Task 5] 依赖 [Task 2, Task 3] (PromptBar 需要 Autocomplete + 主题色)
- [Task 6] 依赖 [Task 3] (BottomGrid 需要主题色)
- [Task 7] 依赖 [Task 1, Task 3, Task 4, Task 6] (Chat View 集成所有组件)
- [Task 8] 依赖 [Task 4] (动画用在工具卡片中)
- [Task 9] 依赖 [Task 1-8] (汇总文档)
- [Task 1, Task 2, Task 3] 可完全并行
- [Task 4, Task 5, Task 6] 在 Task 3 完成后可并行
