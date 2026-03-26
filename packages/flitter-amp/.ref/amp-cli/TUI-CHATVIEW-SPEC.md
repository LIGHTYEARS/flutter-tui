# TUI ChatView 完整规格分析

> 基于 flitter-core / flitter-amp 源码的全面分析文档。
> 覆盖 Widget 树、渲染管线、主题系统、工具分发、输入系统、动画系统。

---

## 1. 三层架构总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                        flitter-amp (应用层) 🔵                       │
│  App, ChatView, InputArea, BottomGrid, ToolCallWidget, themes/     │
├─────────────────────────────────────────────────────────────────────┤
│                  flitter-core 增强层 🟡 (Phase 7+)                    │
│  StickyHeader, Autocomplete, BrailleSpinner, DiffView, Markdown    │
├─────────────────────────────────────────────────────────────────────┤
│                   flitter-core 基础层 🟢 (已完成)                      │
│  Widget/Element/RenderObject, Flex, Text, Container, ScrollView,   │
│  Stack, FocusScope, TextField, SelectionList, ScreenBuffer, ANSI   │
└─────────────────────────────────────────────────────────────────────┘
```

### 状态标记

| 标记 | 含义 | 示例 |
|------|------|------|
| 🟢 | flitter-core 已完成的基础 Widget | `Column`, `Row`, `Text`, `Container`, `Stack`, `ScrollView` |
| 🟡 | flitter-core 为 Amp 新增/增强的 Widget | `StickyHeader`, `Autocomplete`, `BrailleSpinner`, `DiffView` |
| 🔵 | flitter-amp 应用层 Widget | `ChatView`, `InputArea`, `BottomGrid`, `ToolCallWidget` |

### 各层职责

| 层 | 包 | 职责 |
|----|-----|------|
| 🟢 基础层 | `flitter-core` | Flutter 三棵树架构、布局引擎、渲染管线、输入系统、ANSI 输出 |
| 🟡 增强层 | `flitter-core` | Amp 特有的通用 Widget（StickyHeader 粘性头、Autocomplete 补全、BrailleSpinner 动画） |
| 🔵 应用层 | `flitter-amp` | Amp CLI 特有的 UI 组件、主题系统、ACP 协议对接、工具渲染分发 |

---

## 2. Amp 混淆名 ↔ flitter 类名映射表

### 2.1 flitter-core 基础 Widget

| Amp 混淆名 | Amp 概念 | flitter-core 类 | 文件路径 |
|------------|---------|----------------|---------|
| `j9` | RenderBox 基类 | `RenderBox` | `flitter-core/src/framework/render-object.ts` |
| `n_` | RenderObject 基类 | `RenderObject` | `flitter-core/src/framework/render-object.ts` |
| `J3` | WidgetsBinding 主循环 | `WidgetsBinding` | `flitter-core/src/framework/binding.ts` |
| `UB0` | PipelineOwner | `PipelineOwner` | `flitter-core/src/framework/pipeline-owner.ts` |
| `c9` | FrameScheduler | `FrameScheduler` | `flitter-core/src/scheduler/frame-scheduler.ts` |
| `VG8` | initSchedulers() | `initSchedulers()` | `flitter-core/src/framework/binding.ts` |
| `wB0` | TerminalManager | `TerminalManager` | `flitter-core/src/terminal/terminal-manager.ts` |
| `RU0` | RenderPadding | `RenderPadding` | `flitter-core/src/layout/render-padded.ts` |
| `fE` | RenderDecoratedBox | `RenderDecoratedBox` | `flitter-core/src/layout/render-decorated.ts` |
| `H$` | EdgeInsets | `EdgeInsets` | `flitter-core/src/layout/edge-insets.ts` |
| `a$` | Padding widget | `Padding` | `flitter-core/src/widgets/padding.ts` |
| `gH` | Color | `Color` | `flitter-core/src/core/color.ts` |

### 2.2 flitter-core 增强 Widget

| Amp 混淆名 | Amp 概念 | flitter-core 类 | 文件路径 |
|------------|---------|----------------|---------|
| (无对应) | 粘性头布局 | `StickyHeader` | `flitter-core/src/widgets/sticky-header.ts` |
| (无对应) | 粘性头 RenderObject | `RenderStickyHeader` | `flitter-core/src/layout/render-sticky-header.ts` |
| (无对应) | 自动补全 | `Autocomplete` | `flitter-core/src/widgets/autocomplete.ts` |
| `Af` | Braille 旋转动画 | `BrailleSpinner` | `flitter-core/src/utilities/braille-spinner.ts` |
| (无对应) | Diff 显示 | `DiffView` | `flitter-core/src/widgets/diff-view.ts` |
| (无对应) | Markdown 渲染 | `Markdown` | `flitter-core/src/widgets/markdown.ts` |

### 2.3 flitter-amp 应用层 Widget

| Amp 混淆名 | Amp 概念 | flitter-amp 类 | 文件路径 |
|------------|---------|---------------|---------|
| `$uH` | Thread View (会话视图) | `ChatView` | `flitter-amp/src/widgets/chat-view.ts` |
| `Sa` | User Message 渲染 | `ChatView.buildUserStickyHeader()` | `flitter-amp/src/widgets/chat-view.ts` |
| `XkL` | Assistant Message 渲染 | `ChatView.buildAssistantStickyHeader()` | `flitter-amp/src/widgets/chat-view.ts` |
| `xD` | Tool Call 分发 | `ToolCallWidget` | `flitter-amp/src/widgets/tool-call/tool-call-widget.ts` |
| `wQ` | Tool Header 行 | `ToolHeader` | `flitter-amp/src/widgets/tool-call/tool-header.ts` |
| `zk` | Thinking Block | `ThinkingBlock` | `flitter-amp/src/widgets/thinking-block.ts` |
| `F0H` | Prompt Bar (输入区) | `InputArea` | `flitter-amp/src/widgets/input-area.ts` |
| (无对应) | 四角覆盖布局 | `BottomGrid` | `flitter-amp/src/widgets/bottom-grid.ts` |
| (无对应) | 权限对话框 | `PermissionDialog` | `flitter-amp/src/widgets/permission-dialog.ts` |
| (无对应) | 命令面板 | `CommandPalette` | `flitter-amp/src/widgets/command-palette.ts` |
| (无对应) | 文件选择器 | `FilePicker` | `flitter-amp/src/widgets/file-picker.ts` |
| (无对应) | 主题提供者 | `AmpThemeProvider` | `flitter-amp/src/themes/index.ts` |

---

## 3. Chat View 完整组件树

### 3.1 App 根节点到叶子的完整树

```
App (StatefulWidget) ──────────────────────────── flitter-amp/src/app.ts
└── AmpThemeProvider (InheritedWidget) ─────────── flitter-amp/src/themes/index.ts
    └── Stack? (仅当 overlay 激活时) ────────────── flitter-core
        ├── FocusScope (autofocus, onKey) ──────── flitter-core
        │   └── Column (mainAxisSize: max, crossAxisAlignment: stretch)
        │       ├── Expanded ────────────────────── 主内容区
        │       │   ├── [items=0] Center
        │       │   │   └── Padding (left:2, right:2, bottom:1)
        │       │   │       └── ChatView → WelcomeScreen
        │       │   └── [items>0] Row (crossAxisAlignment: stretch)
        │       │       ├── Expanded
        │       │       │   └── SingleChildScrollView (position:bottom, followMode)
        │       │       │       └── Padding (left:2, right:2, bottom:1)
        │       │       │           └── ChatView ──── 见 §3.2
        │       │       └── Scrollbar (1-col wide, thumbColor, trackColor)
        │       └── BottomGrid ──────────────────── 见 §3.4
        │           ├── Stack [top-left + top-right]
        │           ├── InputArea ───────────────── 见 §3.3
        │           └── Stack [bottom-left + bottom-right]
        │
        └── Positioned? (overlay 层) ────────────── 模态覆盖
            ├── [priority 1] PermissionDialog
            ├── [priority 2] CommandPalette
            └── [priority 3] FilePicker
```

### 3.2 ChatView 内部树 (items > 0)

```
ChatView (StatelessWidget) ──────────────────────── flitter-amp/src/widgets/chat-view.ts
└── Column (mainAxisSize: min, crossAxisAlignment: stretch)
    ├── [error?] Padding → Text (red, bold)
    │
    ├── [user_message] StickyHeader ─────────────── 用户消息块
    │   ├── header: Text "You" (success, bold)
    │   └── body: Container (left border 2px success)
    │       └── Padding (left:1)
    │           └── Text (italic, foreground)
    │
    ├── SizedBox (height: 1) ────────────────────── 间距
    │
    ├── [assistant turn] StickyHeader ───────────── 助手回合块 (分组)
    │   ├── header: SizedBox.shrink()
    │   └── body: Column (min, stretch)
    │       ├── ThinkingBlock ───────────────────── 思维块
    │       │   └── Column
    │       │       ├── Text "Thinking..." (accent/success + spinner/✓)
    │       │       └── [expanded] Padding → Text (dim, italic)
    │       ├── Markdown (assistant text) ───────── 正文
    │       └── ToolCallWidget → dispatch ───────── 工具调用 (见 §6)
    │           └── GenericToolCard
    │               └── StickyHeader
    │                   ├── header: ToolHeader ──── [● status] [Name bold] [details dim] [spinner?]
    │                   └── body: Column
    │                       ├── Padding → Text (input, dim)
    │                       ├── Padding → DiffView | Markdown (output)
    │                       └── [extra children]
    │
    ├── SizedBox (height: 1) ────────────────────── 间距
    │
    └── [plan] PlanView ─────────────────────────── 计划视图
```

### 3.3 InputArea 内部树

```
InputArea (StatefulWidget) ──────────────────────── flitter-amp/src/widgets/input-area.ts
└── Column? (仅当 topWidget 存在)
    ├── [topWidget?]
    └── Stack (仅当 overlays > 0)
        ├── Container (rounded border, padding h:1, minHeight:3)
        │   └── Autocomplete ────────────────────── flitter-core
        │       ├── [visible] Column (min, start)
        │       │   ├── SelectionList (补全列表)
        │       │   └── TextField (child)
        │       └── [hidden] TextField
        │           └── (autofocus, placeholder, onSubmitted)
        ├── Positioned (bottom:0, right:1)
        │   └── Text (mode label / shell label)
        └── Positioned (bottom:0, left:1)
            └── Text "[N images]" (当 imageAttachments > 0)
```

### 3.4 BottomGrid 内部树

```
BottomGrid (StatefulWidget) ─────────────────────── flitter-amp/src/widgets/bottom-grid.ts
└── Column (min, stretch)
    ├── Stack [上方行]
    │   ├── Padding (h:1) → Text (top-left: token usage / "Streaming...")
    │   └── Positioned (right:1, top:0) → Text (top-right: agent mode badge)
    ├── InputArea (中间, 穿透传入)
    └── Stack [下方行]
        ├── Padding (h:1) → Text (bottom-left: "? for shortcuts" / "Esc to cancel")
        └── Positioned (right:1, bottom:0) → Text (bottom-right: ~/cwd (branch))
```

### 3.5 WelcomeScreen 内部树

```
ChatView (items=0) → buildWelcomeScreen()
└── Column (center, center)
    └── Row (min, center)
        ├── Column (min, center) ────────────────── AMP_ORB (14行 ASCII art)
        │   └── Text × 14 (green)
        ├── SizedBox (width: 2)
        └── Column (min, start)
            ├── Text "Welcome to Amp" (green, bold)
            ├── SizedBox (height: 1)
            ├── Text [Ctrl+O (blue) + " for " (dim) + help (yellow)]
            ├── SizedBox (height: 1)
            └── Text (quote, dim italic) ────────── 每日名言轮换
```

---

## 4. 渲染管线 (4 阶段)

flitter-core 复刻了 Flutter 的 4 阶段渲染管线，在 `WidgetsBinding.drawFrameSync()` 中同步执行：

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  BUILD   │ →  │  LAYOUT  │ →  │  PAINT   │ →  │  RENDER  │
│ (构建)    │    │ (布局)    │    │ (绘制)    │    │ (输出)    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 4.1 BUILD 阶段

```
入口: WidgetsBinding.drawFrameSync()
  ├── beginFrame()                     // 判断本帧是否需要 paint
  │   └── _shouldPaintCurrentFrame =
  │       forcePaint || hasDirtyElements || hasNodesNeedingLayout || hasNodesNeedingPaint
  ├── processResizeIfPending()         // 终端尺寸变化 → resize ScreenBuffer
  └── BuildOwner.buildScopes()         // 重建脏 Element
      └── 遍历 _dirtyElements[]
          └── Element.rebuild()
              └── StatefulElement._state.build(context)
                  └── 返回新 Widget 树 → Element.updateChild() diff
```

| 关键类 | flitter-core 路径 | 职责 |
|--------|------------------|------|
| `WidgetsBinding` | `framework/binding.ts` | 主循环入口，协调 4 阶段 |
| `BuildOwner` | `framework/build-owner.ts` | 管理脏 Element 队列 |
| `StatefulElement` | `framework/element.ts` | 调用 `State.build()` |
| `StatelessElement` | `framework/element.ts` | 调用 `StatelessWidget.build()` |

### 4.2 LAYOUT 阶段

```
入口: WidgetsBinding.drawFrameSync()
  ├── updateRootConstraints(renderViewSize)  // Size(cols, rows) 如 80×24
  └── PipelineOwner.flushLayout()
      └── rootNode.layout(BoxConstraints.tight(rootSize))
          └── RenderBox.performLayout()      // 递归子节点
              ├── RenderFlex.performLayout()           // Row/Column
              │   ├── 测量非弹性子节点
              │   ├── 分配弹性空间 (flex factor)
              │   └── 按 MainAxisAlignment 定位
              ├── RenderPadding.performLayout()        // Padding
              │   ├── deflate constraints by padding
              │   └── child.layout(deflated)
              ├── RenderDecoratedBox.performLayout()   // Container border
              │   ├── deflate constraints by border width
              │   └── child.layout(deflated)
              ├── RenderStickyHeader.performLayout()   // StickyHeader
              │   ├── header.layout(childConstraints)
              │   ├── body.layout(childConstraints)
              │   └── size = (maxWidth, headerH + bodyH)
              └── RenderConstrainedBox.performLayout() // BoxConstraints
```

| 关键类 | flitter-core 路径 | 布局行为 |
|--------|------------------|---------|
| `RenderFlex` | `layout/render-flex.ts` | Column/Row 弹性布局 |
| `RenderPadding` | `layout/render-padded.ts` | 内边距收缩约束 |
| `RenderDecoratedBox` | `layout/render-decorated.ts` | 边框收缩约束 |
| `RenderStickyHeader` | `layout/render-sticky-header.ts` | header + body 垂直堆叠 |
| `BoxConstraints` | `core/box-constraints.ts` | 最小/最大宽高约束 |

### 4.3 PAINT 阶段

```
入口: WidgetsBinding.paint()
  ├── PipelineOwner.flushPaint()       // 清除脏标志
  ├── screenBuffer.clear()             // 清空后缓冲
  └── paintRenderTree(rootRO, screen)  // DFS 绘制
      └── RenderBox.paint(context, offset)
          ├── RenderFlex.paint()                // 递归子节点 + offset
          ├── RenderDecoratedBox.paint()        // 先绘制边框 → 再递归子节点
          │   ├── ctx.fillRect(col, row, w, h, ' ', {bg})
          │   └── ctx.drawBorder(col, row, w, h, style, color)
          ├── RenderStickyHeader.paint()        // 粘性头特殊逻辑 (见 §9)
          │   ├── body.paint(ctx, offset + body.offset)
          │   └── header.paint(ctx, pinnedOffset | normalOffset)
          └── RenderText.paint()                // 绘制文本 cell
              └── ctx.drawText(col, row, text, style)
```

| 关键类 | flitter-core 路径 | 绘制行为 |
|--------|------------------|---------|
| `PaintContext` | `scheduler/paint-context.ts` | drawText, fillRect, drawBorder API |
| `ScreenBuffer` | `terminal/screen-buffer.ts` | 双缓冲 Cell 矩阵 |
| `ClipCanvas` | (PaintContext 子类) | 裁剪区域管理 |

### 4.4 RENDER 阶段

```
入口: WidgetsBinding.render()
  ├── screen.getDiff()                 // 前后缓冲差异
  │   └── patches: Array<{col, row, char, style}>
  ├── renderer.render(patches, cursor) // 生成 ANSI 序列
  │   ├── cursor position: \e[row;colH
  │   ├── SGR styles: \e[38;2;r;g;bm (RGB 前景)
  │   ├── SGR styles: \e[48;2;r;g;bm (RGB 背景)
  │   ├── bold/dim/italic: \e[1m \e[2m \e[3m
  │   └── cursor shape/visibility
  ├── output.write(ansiString)         // 写入 stdout
  └── screen.present()                 // swap front ↔ back buffer
```

| 关键类 | flitter-core 路径 | 输出行为 |
|--------|------------------|---------|
| `DiffRenderer` | `terminal/diff-renderer.ts` | 差量 ANSI 生成 |
| `ScreenBuffer` | `terminal/screen-buffer.ts` | getDiff() 前后对比 |
| `OutputWriter` | `framework/binding.ts` | process.stdout.write() |

---

## 5. 主题系统

### 5.1 架构总览

```
AmpBaseTheme (15 colors + isLight + 8 syntax)
     │
     ├── deriveAppColors() ──→ AmpAppColors (14 semantic)
     │
     └── createAmpTheme() ──→ AmpTheme { base, app }
                                   │
                           AmpThemeProvider (InheritedWidget)
                                   │
                           context.dependOnInheritedWidgetOfExactType()
                                   │
                           AmpThemeProvider.of(context) → AmpTheme
```

### 5.2 AmpBaseTheme — 15 颜色 + 1 布尔 + 8 语法色

| # | 字段 | 类型 | Dark 默认 RGB | 用途 |
|---|------|------|--------------|------|
| 1 | `background` | Color | `(11, 13, 11)` | 全局背景 |
| 2 | `foreground` | Color | `(246, 255, 245)` | 默认前景文本 |
| 3 | `mutedForeground` | Color | `(156, 156, 156)` | 次要文本、dim |
| 4 | `border` | Color | `(135, 139, 134)` | 边框线条 |
| 5 | `selection` | Color | `(135, 139, 134) α0.35` | 选中高亮 |
| 6 | `primary` | Color | `(27, 135, 243)` | 主色调（链接、文件引用） |
| 7 | `secondary` | Color | `(24, 144, 154)` | 次色调 |
| 8 | `accent` | Color | `(234, 123, 188)` | 强调色（工具名、shell mode） |
| 9 | `success` | Color | `(43, 161, 43)` | 成功状态 |
| 10 | `warning` | Color | `(255, 183, 27)` | 警告状态 |
| 11 | `info` | Color | `(66, 161, 255)` | 信息状态 |
| 12 | `destructive` | Color | `(189, 43, 43)` | 错误/危险 |
| 13 | `copyHighlight` | Color | `(238, 170, 43)` | 复制高亮闪烁 |
| 14 | `tableBorder` | Color | `(135, 139, 134)` | 表格边框 |
| 15 | `cursor` | Color | `(246, 255, 245)` | 光标颜色 |
| — | `isLight` | boolean | `false` | 明暗模式标记 |

### 5.3 AmpSyntaxHighlight — 8 语法色

| # | 字段 | Dark 默认 RGB | 对应 Token |
|---|------|--------------|-----------|
| 1 | `keyword` | `(255, 122, 198)` | 关键字 (if, return, class) |
| 2 | `string` | `(241, 250, 137)` | 字符串字面量 |
| 3 | `number` | `(191, 149, 249)` | 数字字面量 |
| 4 | `comment` | `(98, 109, 167)` | 注释 |
| 5 | `function` | `(117, 219, 240)` | 函数名 |
| 6 | `variable` | `(246, 255, 245)` | 变量名 |
| 7 | `type` | `(82, 250, 124)` | 类型名 |
| 8 | `operator` | `(246, 255, 245)` | 运算符 |

### 5.4 AmpAppColors — 14 语义色

| # | 字段 | 派生自 | 用途 |
|---|------|-------|------|
| 1 | `toolName` | `accent` | 工具名称文本 |
| 2 | `toolSuccess` | `success` | 工具完成状态图标 |
| 3 | `toolError` | `destructive` | 工具失败状态图标 |
| 4 | `toolCancelled` | `mutedForeground` | 工具取消状态 |
| 5 | `fileReference` | `primary` | 文件路径引用 |
| 6 | `command` | `accent` | 命令文本 |
| 7 | `keybind` | `info` | 快捷键文本 |
| 8 | `link` | `primary` | 链接文本 |
| 9 | `recommendation` | `warning` | 推荐提示 |
| 10 | `shellMode` | `accent` | Shell 模式边框/标签 |
| 11 | `handoffMode` | `accent` | Handoff 模式文本 |
| 12 | `queueMode` | `info` | 队列模式标签 |
| 13 | `scrollbarThumb` | `border` | 滚动条滑块 |
| 14 | `scrollbarTrack` | `background` | 滚动条轨道 |

### 5.5 7 个内置主题

| # | 名称 | `isLight` | 文件 | 背景 RGB |
|---|------|-----------|------|---------|
| 1 | `dark` | `false` | `themes/dark.ts` | `(11, 13, 11)` |
| 2 | `light` | `true` | `themes/light.ts` | `(250, 250, 248)` |
| 3 | `catppuccin-mocha` | `false` | `themes/catppuccin-mocha.ts` | `(30, 30, 46)` |
| 4 | `solarized-dark` | `false` | `themes/solarized-dark.ts` | `(0, 43, 54)` |
| 5 | `solarized-light` | `true` | `themes/solarized-light.ts` | `(253, 246, 227)` |
| 6 | `gruvbox-dark` | `false` | `themes/gruvbox-dark.ts` | `(29, 32, 33)` |
| 7 | `nord` | `false` | `themes/nord.ts` | `(46, 52, 64)` |

### 5.6 AmpThemeProvider — InheritedWidget 机制

```typescript
// 注入 (App.build 最外层)
new AmpThemeProvider({
  theme: createAmpTheme(darkBaseTheme),
  child: result,  // 整个应用树
})

// 消费 (任意子 Widget 的 build(context) 中)
const theme = AmpThemeProvider.of(context);      // 必定存在，否则 throw
const theme = AmpThemeProvider.maybeOf(context);  // 可选，返回 undefined

// 更新通知
updateShouldNotify(old): boolean {
  return !ampThemeEquals(this.theme, old.theme);  // 深度比较所有颜色字段
}
```

`createAmpTheme()` 调用链：
```
AmpBaseTheme → deriveAppColors(base) → AmpAppColors → { base, app: AmpAppColors } = AmpTheme
```

---

## 6. ToolCallWidget 分发表

### 6.1 分发入口

`ToolCallWidget.build()` 根据 `toolCall.kind` 字符串进行 switch 分发。
前缀匹配优先于精确匹配 (`sa__*`, `tb__*` → TaskTool)。

### 6.2 完整分发表 (35+ 工具)

| # | Amp tool name | 类别 | flitter-amp 类 | 渲染描述 |
|---|-------------|------|---------------|---------|
| **文件 I/O** | | | | |
| 1 | `Read` | 文件读取 | `ReadTool` | 文件路径 + 行范围 → 内容预览 |
| 2 | `edit_file` | 文件编辑 | `EditFileTool` | 文件路径 + DiffView 差异显示 |
| 3 | `apply_patch` | 补丁应用 | `EditFileTool` | 同 edit_file，DiffView |
| 4 | `undo_edit` | 撤销编辑 | `EditFileTool` | 同 edit_file，DiffView |
| 5 | `create_file` | 创建文件 | `CreateFileTool` | 文件路径 + 内容预览 |
| **Shell** | | | | |
| 6 | `Bash` | Shell 命令 | `BashTool` | `$ command` header + stdout/stderr + exit code |
| 7 | `shell_command` | Shell 命令 | `BashTool` | 同 Bash |
| 8 | `REPL` | 交互式 | `BashTool` | 同 Bash |
| **搜索** | | | | |
| 9 | `Grep` | 内容搜索 | `GrepTool` | pattern + path + 匹配数 |
| 10 | `glob` | 文件搜索 | `GrepTool` | pattern + 匹配结果 |
| 11 | `Glob` | 文件搜索 | `GrepTool` | 同 glob |
| 12 | `Search` | 通用搜索 | `GrepTool` | 搜索结果摘要 |
| **Web** | | | | |
| 13 | `WebSearch` | 网页搜索 | `WebSearchTool` | 搜索查询 + 结果 URL |
| 14 | `read_web_page` | 网页读取 | `WebSearchTool` | URL + 页面内容 |
| **子代理** | | | | |
| 15 | `Task` | 子任务 | `TaskTool` | → GenericToolCard (支持嵌套) |
| 16 | `oracle` | 知识查询 | `TaskTool` | → GenericToolCard |
| 17 | `code_review` | 代码审查 | `TaskTool` | → GenericToolCard |
| 18 | `librarian` | 知识库 | `TaskTool` | → GenericToolCard |
| 19 | `sa__*` | 子代理前缀 | `TaskTool` | 所有 `sa__` 前缀工具 |
| 20 | `tb__*` | 工具箱前缀 | `TaskTool` | 所有 `tb__` 前缀工具 |
| **Handoff** | | | | |
| 21 | `handoff` | 线程移交 | `HandoffTool` | thread link + 700ms 闪烁 (见 §10) |
| **Todo** | | | | |
| 22 | `todo_list` | 待办显示 | `TodoListTool` | 状态图标列表 (○◐●∅) |
| 23 | `todo_write` | 待办写入 | `TodoListTool` | 同 todo_list |
| 24 | `todo_read` | 待办读取 | `TodoListTool` | 同 todo_list |
| **视觉** | | | | |
| 25 | `painter` | 绘图 | `GenericToolCard` | 通用卡片 |
| 26 | `mermaid` | 流程图 | `GenericToolCard` | 通用卡片 |
| 27 | `chart` | 图表 | `GenericToolCard` | 通用卡片 |
| 28 | `look_at` | 截图查看 | `GenericToolCard` | 通用卡片 |
| **工具** | | | | |
| 29 | `format_file` | 格式化 | `GenericToolCard` | 通用卡片 |
| 30 | `skill` | 技能调用 | `GenericToolCard` | 通用卡片 |
| 31 | `get_diagnostics` | 诊断 | `GenericToolCard` | 通用卡片 |
| **兜底** | | | | |
| 32+ | `*` (default) | 未知工具 | `GenericToolCard` | StickyHeader + ToolHeader + input/output |

### 6.3 GenericToolCard 结构

```
GenericToolCard (StatelessWidget) ─── 通用工具卡片，所有未匹配工具的默认渲染
├── [collapsed] ToolHeader only ──── 只显示一行 header
└── [expanded] StickyHeader
    ├── header: ToolHeader
    │   └── Row: [● status] [Name bold accent] [detail dim] [BrailleSpinner?]
    └── body: Column
        ├── Padding → Text (rawInput key:value, dim)
        ├── Padding → DiffView (如果输出含 @@/---/+++) | Markdown (otherwise)
        └── [extra children]
```

### 6.4 ToolHeader 状态颜色

| 状态 | `toolCall.status` | 图标 | 颜色来源 |
|------|------------------|------|---------|
| 进行中 | `in_progress` | `●` | `base.mutedForeground` + BrailleSpinner |
| 已完成 | `completed` | `●` | `app.toolSuccess` |
| 失败 | `failed` | `●` | `base.destructive` |
| 待处理 | `pending` | `●` | `base.mutedForeground` (dim) |

### 6.5 TodoListTool 状态图标

| 状态 | 图标 |
|------|------|
| pending | `○` |
| in-progress | `◐` |
| completed | `●` |
| cancelled | `∅` |

---

## 7. PromptBar 输入系统

### 7.1 架构

```
InputArea (StatefulWidget)
├── TextEditingController ──── 文本状态 + cursor 位置
├── Autocomplete ──────────── 触发字符检测 + 补全弹窗
├── Shell 模式检测 ─────────── $ / $$ 前缀实时检测
├── Submit 键配置 ─────────── Enter 提交 or Cmd/Ctrl+Enter 提交
└── 图片附件指示器 ─────────── [N images] badge
```

### 7.2 Shell 模式检测

```typescript
function detectShellMode(text: string): ShellMode {
  if (text.startsWith('$$')) return 'background';  // 后台 shell
  if (text.startsWith('$'))  return 'shell';        // 前台 shell
  return null;                                       // 普通对话
}
```

| 前缀 | ShellMode | 边框颜色 | 标签文本 |
|------|-----------|---------|---------|
| `$$` | `background` | `app.shellMode` | `"Background shell"` |
| `$` | `shell` | `app.shellMode` | `"Shell mode"` |
| 无 | `null` | `base.border` | mode name / 空 |

### 7.3 Autocomplete 系统

```
Autocomplete (StatefulWidget, flitter-core)
├── triggers: AutocompleteTrigger[]
│   ├── { triggerCharacter: '@', optionsBuilder: () => [] }  // 默认文件触发
│   └── ...外部传入的触发器
├── controller: TextEditingController (与 TextField 共享)
├── 检测算法:
│   └── 光标前 100 字符内查找最后一个 triggerCharacter
│       → 提取 query → optionsBuilder(query) → fuzzyMatch 过滤
│       → 最多显示 maxOptionsVisible (默认 10) 个选项
├── 选中替换:
│   └── text[triggerStart..cursorPos] → triggerChar + option.value
└── UI:
    ├── [visible] Column { SelectionList (above), TextField (below) }
    └── [hidden] TextField only
```

### 7.4 Submit 键配置

| 配置 | `submitWithMeta` | Enter 行为 | Cmd/Ctrl+Enter 行为 |
|------|-----------------|-----------|-------------------|
| 默认 | `false` | 提交 | (无特殊处理) |
| 多行 | `true` | 换行 | 提交 |

### 7.5 图片附件

当 `imageAttachments > 0` 时，在输入框左下角显示 badge：
```
[1 image]   或   [3 images]
```
颜色: `base.info` (蓝色)

### 7.6 模式标签

输入框右下角 `Positioned(bottom:0, right:1)` 显示:

| 条件 | 显示内容 | 颜色 |
|------|---------|------|
| shell mode active | `"Shell mode"` / `"Background shell"` | `app.shellMode` |
| processing + no shell | `"⏳ {mode} "` (dim) | `base.warning` |
| idle + mode exists | `"{mode} "` | `base.success` |

---

## 8. BottomGrid 底部区域

### 8.1 4 角布局

```
┌─────────────────────────────────────────────────────────────┐
│ [top-left]                                    [top-right]   │
│  token usage / "Streaming..."                  agent mode   │
├─────────────────────────────────────────────────────────────┤
│ │ InputArea (PromptBar)                                   │ │
├─────────────────────────────────────────────────────────────┤
│ [bottom-left]                                [bottom-right] │
│  "? for shortcuts" / "Esc to cancel"          ~/cwd (git)  │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 各角内容详解

| 位置 | 空闲状态 | 处理中状态 |
|------|---------|-----------|
| **top-left** | `SizedBox.shrink()` (空) | `"12.5k in / 3.2k out"` 或 `"Streaming..."` (dim) |
| **top-right** | `" {mode} "` (彩色 bold) | `" {mode} "` (彩色 bold) |
| **bottom-left** | `"? for shortcuts"` (? blue + dim) | `"Esc to cancel"` (Esc blue + dim) |
| **bottom-right** | `"~/path (branch)"` (dim) | `"~/path (branch)"` (dim) |

### 8.3 Agent 模式颜色

| 模式 | 颜色来源 |
|------|---------|
| `smart` | `base.info` (蓝) |
| `code` | `base.success` (绿) |
| `deep` | `base.accent` (粉) |
| `ask` | `base.warning` (黄) |
| 其他 | `base.foreground` |

### 8.4 Token 格式化

```typescript
formatTokenCount(count):
  ≥ 1,000,000 → "1.2M"
  ≥ 1,000     → "12.5k"
  < 1,000     → "999"
```

### 8.5 路径缩短

```typescript
shortenPath(fullPath):
  fullPath.startsWith($HOME) → "~" + rest
  otherwise → fullPath
```

---

## 9. StickyHeader 算法

### 9.1 Widget 层

```typescript
class StickyHeader extends MultiChildRenderObjectWidget {
  children = [header, body]
  createRenderObject() → new RenderStickyHeader()
}
```

### 9.2 Layout 算法

```
performLayout():
  childConstraints = {
    minWidth: constraints.minWidth,
    maxWidth: constraints.maxWidth,
    minHeight: 0,
    maxHeight: Infinity,    // 不限制子节点高度
  }
  header.layout(childConstraints)
  header.offset = (0, 0)
  headerHeight = header.size.height

  body.layout(childConstraints)
  body.offset = (0, headerHeight)     // body 紧跟 header 下方
  bodyHeight = body.size.height

  self.size = constrain(max(headerW, bodyW), headerH + bodyH)
```

### 9.3 Paint 算法（核心粘性逻辑）

```
paint(context, offset):
  // Step 1: 先绘制 body (body 在下方，header 后绘制会覆盖)
  body.paint(context, offset + body.offset)

  // Step 2: 获取当前视口裁剪区域
  clip = _getCurrentClip(context)      // Rect { top, left, width, height }
  if (!clip) → 正常绘制 header → return

  // Step 3: 计算位置参数
  headerY = offset.row + header.offset.row       // header 的自然 Y 坐标
  headerH = header.size.height                    // header 高度
  totalH  = self.size.height                      // 整个 StickyHeader 高度

  viewTop = clip.top                              // 视口顶部 Y 坐标

  // Step 4: 判断条件
  isHeaderAboveViewport = (headerY < viewTop)
  isContentInViewport   = (offset.row + totalH) > viewTop
                       && offset.row < (viewTop + clip.height)

  // Step 5: 粘性定位
  if (isContentInViewport && isHeaderAboveViewport):
    // 情况 A: header 已滚出视口上方，但内容仍在视口内 → 钉住
    pinnedY = viewTop

    // 情况 B: 整个 StickyHeader 快要滚出 → push-away
    if (offset.row + totalH) - viewTop < headerH:
      pinnedY = (offset.row + totalH) - headerH   // 被下一个 header 推走

    // 清除 header 行的残留内容
    fillRect(clip.left, pinnedY, clip.width, headerH, ' ')

    // 在钉住位置绘制 header
    header.paint(context, (offset.col + header.offset.col, pinnedY))

  else:
    // 正常位置绘制
    header.paint(context, (offset.col + header.offset.col, headerY))
```

### 9.4 视觉示意

```
滚动前 (header 在视口内):
┌────────────────────┐ ← viewport top
│ You               │ ← header (正常位置)
│ │ how are you?     │ ← body
│                    │
│ (assistant turn)   │
└────────────────────┘

滚动中 (header 被钉住):
┌────────────────────┐ ← viewport top
│ You               │ ← header (钉在顶部, pinnedY = viewTop)
│ ...more text...    │ ← body 内容滚动
│ ...long message... │
│ (next header)      │
└────────────────────┘

Push-away (下一个 StickyHeader 推开):
┌────────────────────┐ ← viewport top
│ (next header)      │ ← 新的 StickyHeader header
│  ...               │
│  You              │ ← 被推到正好在自己 body 底部上方
│  │ last line       │ ← 即将滚出视口
└────────────────────┘
```

### 9.5 剪裁区域获取

```typescript
_getCurrentClip(context):
  // 方式 1: ClipCanvas 的 .clip getter
  if (ctx.clip instanceof Rect) return ctx.clip

  // 方式 2: PaintContext 的内部字段
  if (ctx.clipX/Y/W/H exist) return new Rect(clipX, clipY, clipW, clipH)

  // 无裁剪信息 → 正常绘制
  return null
```

---

## 10. 动画系统

### 10.1 BrailleSpinner (100ms / 帧)

**所在文件**: `flitter-core/src/utilities/braille-spinner.ts`
**使用者**: `ToolHeader` (tool 执行中)

| 属性 | 值 |
|------|-----|
| 帧率 | `setInterval(100ms)` → `spinner.step()` → `setState()` |
| 网格 | 2 列 × 4 行 boolean 矩阵 |
| 输出 | 单个 Unicode Braille 字符 (U+2800 ~ U+28FF) |
| 算法 | Game of Life 变体: 存活(1-3 邻居), 诞生(2-3 邻居) |
| 自动重置 | 静态(连续 2 帧相同)、周期(≤4)、枯竭(<2 活细胞) → 重新随机种子(60% 密度) |

```
Braille 点位布局 (2×4):
  dot1(0,0)  dot4(1,0)     权重: 0x01  0x08
  dot2(0,1)  dot5(1,1)           0x02  0x10
  dot3(0,2)  dot6(1,2)           0x04  0x20
  dot7(0,3)  dot8(1,3)           0x40  0x80

codepoint = 0x2800 + Σ(active_dot_weight)
```

**渲染效果**: 工具执行中时 ToolHeader 末尾显示不断变化的 braille 字符:
```
● Read file.ts ⣿    →    ● Read file.ts ⡷    →    ● Read file.ts ⢞
```

### 10.2 Handoff Blink (700ms / 帧)

**所在文件**: `flitter-amp/src/widgets/tool-call/handoff-tool.ts`
**触发条件**: `toolCall.status === 'in_progress'`

| 属性 | 值 |
|------|-----|
| 帧率 | `setInterval(700ms)` → `blinkVisible = !blinkVisible` → `setState()` |
| 可见时 | `●` 颜色 = `app.toolSuccess` (绿色) |
| 不可见时 | `●` 颜色 = `base.mutedForeground` (灰色) |
| 停止条件 | `status !== 'in_progress'` → `clearInterval()` |

**渲染效果**:
```
Waiting for handoff ●    (绿色 700ms)
Waiting for handoff ●    (灰色 700ms)
Waiting for handoff ●    (绿色 700ms)
...
```

### 10.3 Copy Highlight (300ms, 规划中)

**所在文件**: 定义于 `AmpBaseTheme.copyHighlight` 颜色
**当前状态**: 颜色已定义 (`(238, 170, 43)` dark theme)，动画逻辑待实现

| 属性 | 规划值 |
|------|-------|
| 持续时间 | ~300ms 单次闪烁 |
| 颜色 | `base.copyHighlight` (金黄色) |
| 触发 | 用户复制操作 (Ctrl+C on selected text) |
| 效果 | 选中区域短暂高亮后恢复 |

### 10.4 动画机制总结

| 动画 | 组件 | 周期 | 机制 | 重建范围 |
|------|------|------|------|---------|
| BrailleSpinner | `ToolHeader` | 100ms | `setInterval` → `setState` | ToolHeader 子树 |
| Handoff Blink | `HandoffTool` | 700ms | `setInterval` → `setState` | HandoffTool 子树 |
| Copy Highlight | (待实现) | 300ms | `setTimeout` → `setState` | 选中区域 Widget |

所有动画使用 `setInterval`/`setTimeout` + `setState()` 的模式:
1. `initState()` 中启动定时器 (条件: `status === 'in_progress'`)
2. `didUpdateWidget()` 中动态启停
3. `dispose()` 中清理定时器
4. 定时器回调调用 `setState(() => { /* 更新状态 */ })` 触发重建

---

## 附录 A: Overlay 优先级栈

```
App.build() overlay 选择 (互斥, 按优先级):

1. PermissionDialog (最高优先级)
   条件: appState.hasPendingPermission
   位置: Stack → Positioned(top:0, left:0, right:0, bottom:0) — 全屏覆盖

2. CommandPalette
   条件: showCommandPalette === true (Ctrl+O 触发)
   位置: Stack → Positioned(top:0, left:0, right:0, bottom:0) — 全屏覆盖

3. FilePicker (最低优先级)
   条件: showFilePicker === true && fileList.length > 0
   位置: Stack → Positioned(left:1, bottom:3) — 输入框上方左侧浮动
```

## 附录 B: 键盘快捷键 → AppState 映射

| 快捷键 | 处理位置 | 行为 |
|--------|---------|------|
| `Escape` | `FocusScope.onKey` | 逐层关闭: FilePicker → CommandPalette → PermissionDialog |
| `Ctrl+O` | `FocusScope.onKey` | `showCommandPalette = true` |
| `Ctrl+C` | `FocusScope.onKey` | `onCancel()` → 取消当前操作 |
| `Ctrl+L` | `FocusScope.onKey` | `conversation.clear()` → 清空会话 |
| `Alt+T` | `FocusScope.onKey` | `conversation.toggleToolCalls()` → 折叠/展开工具 |
| `Ctrl+G` | `FocusScope.onKey` | (TODO) 外部编辑器打开 |
| `Ctrl+R` | `FocusScope.onKey` | `promptHistory.previous()` → 历史浏览 |
| `Enter` | `InputArea` | 提交 (submitWithMeta=false) |
| `$` 前缀 | `InputArea` | Shell 模式检测 → 边框变色 |
| `$$` 前缀 | `InputArea` | 后台 Shell 模式 |
| `@` | `Autocomplete` | 文件引用触发补全 |

## 附录 C: ConversationItem 类型 → Widget 映射

| `item.type` | 分组归属 | Widget | StickyHeader header |
|-------------|---------|--------|-------------------|
| `user_message` | 独立块 | Text (italic, left border) | `"You"` (success, bold) |
| `thinking` | assistant turn | `ThinkingBlock` | SizedBox.shrink() |
| `assistant_message` | assistant turn | `Markdown` / Text "..." | SizedBox.shrink() |
| `tool_call` | assistant turn | `ToolCallWidget` → dispatch | SizedBox.shrink() |
| `plan` | 独立块 | `PlanView` | (无 StickyHeader) |
