# Checklist

## 🟡 flitter-core 框架层补充

### StickyHeader (R9)
- [x] `StickyHeader` Widget 类存在于 `flitter-core/src/widgets/sticky-header.ts`
- [x] `RenderStickyHeader` RenderBox 实现 performLayout (header + body 垂直排列)
- [x] `RenderStickyHeader` paint 实现视口检测 + header 置顶
- [x] paint 实现被下一条消息推走算法 (`(oy + totalH) - viewTop < headerH`)
- [x] 已导出到 `flitter-core/src/index.ts` (StickyHeader + RenderStickyHeader)
- [ ] 单元测试覆盖置顶/推走/正常位置三种场景 ⚠️ 暂无专用测试文件

### Autocomplete (R12)
- [x] `AutocompleteTrigger` 接口定义存在 (`autocomplete.ts:19-22`)
- [x] `AutocompleteOption` 接口定义存在 (`autocomplete.ts:13-17`)
- [x] `Autocomplete` Widget 能检测触发字符并显示弹出层 (Column: optionsView + child)
- [x] `fuzzyMatch()` 支持子序列匹配 (`autocomplete.ts:290-299`)
- [x] 弹出层正确定位（输入区上方，Column children 顺序：optionsView → child）
- [x] 异步选项支持 + stale-result 防护 (`_pendingAsync` counter)
- [x] 已导出到 `flitter-core/src/index.ts`

## 🔵 flitter-amp 应用层实现

### Amp 主题系统 (R13)
- [x] `AmpBaseTheme` 接口定义包含 15 基础色 + 8 语法高亮色 + isLight
- [x] `AmpAppColors` 接口定义包含 14 语义色
- [x] `AmpTheme` 接口 = base + app 组合
- [x] Dark 主题 RGB 色板完整 (background: rgb(11,13,11) ✓)
- [x] Light 主题 RGB 色板完整 (background: rgb(250,250,248) ✓)
- [x] Catppuccin Mocha 主题 RGB 色板完整 (background: rgb(30,30,46) ✓)
- [x] Solarized Dark 主题 RGB 色板完整 (background: rgb(0,43,54) ✓)
- [x] Solarized Light 主题 RGB 色板完整 (background: rgb(253,246,227) ✓)
- [x] Gruvbox Dark Hard 主题 RGB 色板完整 (background: rgb(29,32,33) ✓)
- [x] Nord 主题 RGB 色板完整 (background: rgb(46,52,64) ✓)
- [x] `AmpThemeProvider` InheritedWidget 正确传递主题 (of/maybeOf/updateShouldNotify)
- [x] `ampThemes` 主题注册表包含 7 个内建主题
- [x] `deriveAppColors()` 从 base 派生 app 语义色
- [x] `createAmpTheme()` 创建完整 AmpTheme
- [x] 新创建的组件已使用 `AmpThemeProvider.maybeOf(context)` (13个文件)
- [ ] 未完全迁移：`thinking-block.ts`, `plan-view.ts`, `header-bar.ts`, `diff-card.ts`, `permission-dialog.ts`, `file-picker.ts`, `command-palette.ts` 仍使用 ANSI 标准色 ⚠️ SubTask 3.6 待完成
- [ ] `chat-view.ts` welcome screen 区域仍使用硬编码 ANSI 色 ⚠️ 仅影响 welcome 画面

### ToolCallWidget 分发系统 (R15)
- [x] 顶层 `ToolCallWidget` 实现 35+ 工具类型 switch-case 分发
- [x] `GenericToolCard` 实现通用卡片布局 (StickyHeader header + Column body + 递归嵌套)
- [x] `ToolHeader` 实现 ● 状态指示器 (in-progress: BrailleSpinner, completed: toolSuccess, failed: destructive, pending: mutedForeground)
- [x] `ReadTool` — 文件路径 + 行号范围
- [x] `EditFileTool` — DiffView 嵌入 (old_str/new_str → unified diff)
- [x] `BashTool` — $ prefix + spinner + 输出 + 退出码 (颜色区分 0/非0)
- [x] `GrepTool` — pattern + path + 结果计数
- [x] `TaskTool` — 子 Agent 递归嵌套渲染 (委托 GenericToolCard)
- [x] `CreateFileTool` — 文件创建卡片 + 内容预览
- [x] `WebSearchTool` — 搜索查询 + 结果链接 (→ prefix)
- [x] `HandoffTool` — 线程链接 + 700ms blink 动画 (颜色交替 toolSuccess ↔ mutedForeground)
- [x] `TodoListTool` — 4 种状态图标 (○ pending / ◐ in-progress / ● completed / ∅ cancelled)
- [x] default 回退到 GenericToolCard
- [x] sa__* / tb__* 前缀路由到 TaskTool
- [ ] P2 渲染器: MermaidTool, PainterTool, ReplTool 暂未实现 (回退 GenericToolCard) ⚠️ SubTask 4.6

### PromptBar 增强 (R16)
- [x] Shell 模式 `$`/`$$` 前缀检测 + UI 切换 (border 色变, 标签显示)
- [x] `@` 文件补全功能集成 (Autocomplete + defaultFileTrigger)
- [x] Submit 键可配置 (submitWithMeta prop: Enter vs Cmd+Enter)
- [x] Shift+Enter 换行支持 (maxLines: undefined when submitWithMeta)
- [x] 空状态 Placeholder 显示 ('Ask a question or $ for shell...')
- [x] TopWidget 支持 (快捷键帮助面板)
- [x] Image attachments badge ([N image(s)] 左下角)
- [x] 使用 AmpThemeProvider 取色

### BottomGrid 底部区域 (R17)
- [x] BottomGrid Widget 存在于 `flitter-amp/src/widgets/bottom-grid.ts`
- [x] top-left overlay: token usage 显示 (Streaming... / NNk in / NNk out)
- [x] top-right overlay: Agent 模式标签正确显示 (smart/code/deep/ask + 颜色)
- [x] bottom-left overlay: 提示文字正确显示 (? for shortcuts / Esc to cancel)
- [x] bottom-right overlay: 工作目录 + git branch 正确显示 (~/ 简写)
- [x] 已替换旧的 StatusBar + InputArea (app.ts 使用 BottomGrid)
- [x] StatusBar 已标记 @deprecated

### Chat View 集成 (R14)
- [x] 每条消息包裹 StickyHeader (user: header="You", assistant: header=SizedBox.shrink)
- [x] 消息分组：连续 thinking/assistant_message/tool_call 合并为一个 assistant turn
- [x] 助手消息正确渲染 ThinkingBlock + Markdown + ToolCallWidget
- [x] 用户消息绿色左边框 + italic
- [x] AmpThemeProvider 包裹整个 widget tree (app.ts)
- [x] 全局快捷键 Ctrl+O (CommandPalette) 工作
- [x] 全局快捷键 Alt+T (Toggle tool calls) 工作
- [x] 全局快捷键 Ctrl+C (Cancel) 工作
- [x] 全局快捷键 Ctrl+L (Clear) 工作
- [x] 全局快捷键 Ctrl+G ($EDITOR) 已绑定 (TODO: 需要 TUI suspend/resume)
- [x] 全局快捷键 Ctrl+R (History) 已绑定

### 动画效果 (R18)
- [x] BrailleSpinner 在工具进行中显示旋转 spinner (100ms interval, ToolHeader StatefulWidget)
- [x] Handoff blink 700ms 间隔切换 ● 颜色 (toolSuccess ↔ mutedForeground, 不是符号切换)
- [x] Copy Highlight 依赖 flitter-core RenderText (已内建支持)

### 分析文档
- [x] `TUI-CHATVIEW-SPEC.md` 已输出到 `packages/flitter-amp/.ref/amp-cli/`
- [x] 文档包含 Amp 混淆名 ↔ flitter 类名映射表 (§2 三张映射表)
- [x] 文档包含三层架构归属标注 (🟢/🟡/🔵)

### TypeScript 编译验证
- [x] `flitter-amp` typecheck: ✅ 零错误通过
- [x] `flitter-core` typecheck: 仅预先存在的错误 (TS6133 未使用导入等)，新增文件无错误
- [x] `flitter-core` 测试: 2808 tests pass, 0 fail

---

## 遗留项目 (Known Remaining Items)

| 项目 | 来源 | 优先级 | 状态 |
|------|------|--------|------|
| 7 个旧组件未迁移 AmpThemeProvider | SubTask 3.6 | P2 | thinking-block, plan-view, header-bar, diff-card, permission-dialog, file-picker, command-palette |
| MermaidTool / PainterTool / ReplTool | SubTask 4.6 | P3 | 当前回退到 GenericToolCard |
| StickyHeader 单元测试 | SubTask 1.5 | P2 | 集成测试中覆盖但无专用测试文件 |
| chat-view welcome screen 使用 ANSI 色 | SubTask 3.6 | P3 | 仅影响空状态欢迎画面 |
