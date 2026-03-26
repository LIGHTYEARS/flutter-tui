# Amp CLI TUI Chat View 完整复刻 Spec

## Why

为了**完整复刻 Amp CLI Chat View 的视觉效果和交互体验**，需要代码级深入分析其每一个实现细节，并明确三层架构归属：哪些已在 flitter-core 实现、哪些需要在 flitter-core 完善、哪些是 flitter-amp 独有的应用层组件。

## What Changes

- 输出 `packages/flitter-amp/.ref/amp-cli/TUI-CHATVIEW-SPEC.md` — 代码级深度分析文档
- 每个组件/系统标注**三层归属**：
  - 🟢 **flitter-core 已实现** — 无需改动
  - 🟡 **flitter-core 需完善** — 缺失功能需补充
  - 🔵 **flitter-amp 应用层** — Chat View 专有组件，需在 flitter-amp 中实现

## Impact

- Affected code:
  - `packages/flitter-core/` — 框架层补充
  - `packages/flitter-amp/` — 应用层实现

---

## 三层架构总览

```
┌───────────────────────────────────────────────────────┐
│ flitter-amp (应用层)                                   │
│  ├── 主题色板定义 (8 个 Amp 内置主题的 RGB 色值)       │
│  ├── Chat View 组件树 (消息列表 + 消息组件)            │
│  ├── ToolCallWidget (35+ 工具类型分发)                 │
│  ├── PromptBar (输入栏 + Shell 模式 + Autocomplete)    │
│  ├── StickyHeader (消息标题置顶)                       │
│  ├── BottomGrid (底部多区域布局 + overlay)             │
│  ├── CommandPalette / PermissionDialog / FilePicker    │
│  ├── Spinner / Blink 动画                             │
│  └── GenericToolCard (通用工具卡片 + 递归嵌套)         │
├───────────────────────────────────────────────────────┤
│ flitter-core 需完善 (框架层缺失)                       │
│  ├── StickyHeader RenderObject (自定义 paint 置顶)     │
│  ├── BottomGrid RenderObject (多区域 + overlay 布局)   │
│  ├── Animation 框架 (AnimationController / Tween)     │
│  ├── Autocomplete Widget (触发器 + 弹出层)             │
│  └── ContainerWithOverlays 增强 (位置化 overlay text) │
├───────────────────────────────────────────────────────┤
│ flitter-core 已实现 (无需改动)                         │
│  ├── Widget/Element/RenderObject 三树 ✅               │
│  ├── BoxConstraints + 6-step Flex 布局 ✅              │
│  ├── 4 阶段帧调度 (BUILD/LAYOUT/PAINT/RENDER) ✅      │
│  ├── 双缓冲 ScreenBuffer + SGR 差量渲染 ✅            │
│  ├── Focus 树 + 键盘冒泡 ✅                           │
│  ├── ScrollView + ScrollController (followMode) ✅    │
│  ├── TextStyle/TextSpan/RichText (选区+高亮) ✅       │
│  ├── MouseRegion + HitTest + Cursor ✅                │
│  ├── Theme/AppTheme InheritedWidget ✅                │
│  ├── Markdown Widget (AST→Widget) ✅                  │
│  ├── Container/Padding/SizedBox/Expanded/Row/Column ✅│
│  ├── Stack/Positioned ✅                              │
│  ├── DiffView ✅                                      │
│  ├── SelectionList ✅                                 │
│  ├── TextField + TextEditingController ✅             │
│  ├── BrailleSpinner ✅                                │
│  ├── DataTable + GridBorder ✅                        │
│  ├── ClipRect + IntrinsicHeight ✅                    │
│  ├── Hyperlink (OSC 8) ✅                             │
│  ├── Image (Kitty Graphics Protocol) ✅               │
│  ├── Scrollbar ✅                                     │
│  ├── PerformanceOverlay + DebugInspector ✅           │
│  └── 终端协议扩展 (Kitty keyboard, etc.) ✅           │
└───────────────────────────────────────────────────────┘
```

---

## 🟢 flitter-core 已实现 — 无需改动

### R1: Widget 框架层基类

flitter-core 已完整实现 Amp CLI 的全部框架基类：

| Amp 混淆名 | flitter-core 类 | 文件 | 状态 |
|---|---|---|---|
| `T9` | `StatelessWidget` | `framework/widget.ts` | ✅ |
| `zT` | `StatefulWidget` | `framework/widget.ts` | ✅ |
| `UT` | `State` | `framework/widget.ts` | ✅ |
| `Cl` | `LeafRenderObjectWidget` | `framework/widget.ts` | ✅ |
| `Je` | `SingleChildRenderObjectWidget` | `framework/widget.ts` | ✅ |
| `eu` | `MultiChildRenderObjectWidget` | `framework/widget.ts` | ✅ |
| `q9` | `RenderBox` | `framework/render-object.ts` | ✅ |
| `Ea` | `InheritedWidget` | `framework/widget.ts` | ✅ |
| `x0` | `BoxConstraints` | `core/box-constraints.ts` | ✅ |
| `$m` | `SingleChildRenderObjectElement` | `framework/element.ts` | ✅ |

Amp 的简化决策（无 RelayoutBoundary、无 RepaintBoundary、无 deactivate）在 flitter-core 中已对齐。

### R2: 渲染管线

| Amp 类 | flitter-core 类 | 文件 | 状态 |
|---|---|---|---|
| `z9` FrameScheduler | `FrameScheduler` | `scheduler/frame-scheduler.ts` | ✅ 4 阶段 + 60fps 帧节流 |
| `fKR` BuildOwner | `BuildOwner` | `framework/build-owner.ts` | ✅ dirty element 调度 |
| `UB0` PipelineOwner | `PipelineOwner` | `framework/pipeline-owner.ts` | ✅ flushLayout/flushPaint |
| `J3` WidgetsBinding | `WidgetsBinding` | `framework/binding.ts` | ✅ runApp/drawFrameSync |
| ScreenBuffer | `ScreenBuffer` | `terminal/screen-buffer.ts` | ✅ 双缓冲 + getDiff |
| ClippedScreenBuffer | `PaintContext.withClip()` | `scheduler/paint-context.ts` | ✅ 矩形裁剪 |
| ANSI Renderer | `Renderer` | `terminal/renderer.ts` | ✅ 最小 SGR delta |

### R3: 文本样式系统

| Amp 类 | flitter-core 类 | 文件 | 状态 |
|---|---|---|---|
| `cR` TextStyle | `TextStyle` | `core/text-style.ts` | ✅ 9 属性 + merge/copyWith + 6 静态工厂 |
| `V` TextSpan | `TextSpan` | `core/text-span.ts` | ✅ tree + hyperlink + onClick |
| `xR` RichText | `Text` (RenderText) | `widgets/text.ts` | ✅ maxLines/overflow/selectable/选区高亮 |

### R4: 输入系统

| Amp 类 | flitter-core 类 | 文件 | 状态 |
|---|---|---|---|
| `c8` FocusNode | `FocusNode` | `input/focus.ts` | ✅ 树 + onKey + Tab 遍历 |
| `Xh` FocusManager | `FocusManager` | `input/focus.ts` | ✅ dispatchKeyEvent/冒泡 |
| `f8` FocusScope | `FocusScope` | `widgets/focus-scope.ts` | ✅ autofocus + onKey/onPaste |
| `F0` MouseRegion | `MouseRegion` | `widgets/mouse-region.ts` | ✅ onClick/onDrag/cursor |
| InputParser | `InputParser` | `input/input-parser.ts` | ✅ CSI/SS3/SGR mouse/paste |
| HitTest | `hitTest` | `input/hit-test.ts` | ✅ DFS + 坐标转换 |
| MouseManager | `MouseManager` | `input/mouse-manager.ts` | ✅ hover + cursor |

### R5: 滚动系统

| Amp 类 | flitter-core 类 | 状态 |
|---|---|---|
| `U8` ScrollView | `SingleChildScrollView` | ✅ + Scrollable + j/k/g/G/PageUp/PageDown |
| `cr` ScrollController | `ScrollController` | ✅ followMode + animateTo |
| Scrollbar | `Scrollbar` | ✅ thumb/track 渲染 |

### R6: 布局组件

全部 ✅：Container, Padding, SizedBox, Expanded, Flexible, Row, Column, Flex, Stack, Positioned, Center, Spacer, Divider, Builder, ClipRect, IntrinsicHeight, DecoratedBox

### R7: 主题 InheritedWidget

| Amp 类 | flitter-core 类 | 状态 |
|---|---|---|
| `Y0` BaseThemeData | `Theme` (ThemeData) | ✅ 15 颜色字段 + of/maybeOf |
| `$T` AppTheme | `AppTheme` (AppThemeData) | ✅ syntaxHighlight 12 token + 5 app 色 |

### R8: 高级组件

全部 ✅：Markdown (AST→Widget 映射 + 语法高亮)、DiffView (行号 + 加/减色)、SelectionList、TextField + TextEditingController、BrailleSpinner、DataTable、GridBorder、Image (Kitty Graphics)、Hyperlink (OSC 8)、Dialog、CollapsibleDrawer、ContainerWithOverlays、PerformanceOverlay、DebugInspector

---

## 🟡 flitter-core 需完善

### R9: StickyHeader 自定义 RenderObject

**当前状态**: flitter-core **没有** StickyHeader 组件。
**Amp 实现**: `bTT` (StickyHeaderWidget) + `PTT` (RenderStickyHeader)

需要在 flitter-core 中新增：

```typescript
/**
 * StickyHeader — 当消息滚出视口顶部时，将 header 子节点固定在视口顶部显示。
 * 当下一条消息的 header 推上来时，当前 header 被推走。
 *
 * Amp 原始类: bTT (Widget) → PTT (RenderObject)
 */
class StickyHeader extends MultiChildRenderObjectWidget {
  header: Widget;    // 需要置顶的标题部分
  body: Widget;      // 消息内容部分
}

class RenderStickyHeader extends ContainerRenderBox {
  // performLayout: header 和 body 垂直排列
  performLayout() {
    let header = this.children[0];
    let body = this.children[1];
    header.layout(constraints.loosen());
    body.layout(new BoxConstraints({
      minWidth: constraints.minWidth,
      maxWidth: constraints.maxWidth,
      minHeight: 0,
      maxHeight: Infinity
    }));
    header.offset = { x: 0, y: 0 };
    body.offset = { x: 0, y: header.size.height };
    this.setSize(
      constraints.maxWidth,
      header.size.height + body.size.height
    );
  }

  // paint: 关键逻辑 — 检测视口并置顶 header
  paint(ctx: PaintContext, ox: number, oy: number) {
    let header = this.children[0];
    let body = this.children[1];
    let clip = ctx.currentClip; // 视口矩形

    // 先正常绘制 body
    body.paint(ctx, ox + body.offset.x, oy + body.offset.y);

    let headerY = oy + header.offset.y;
    let headerH = header.size.height;
    let viewTop = clip.y;
    let totalH = this.size.height;

    let isHeaderAboveViewport = headerY < viewTop;
    let isContentInViewport = (oy + totalH) > viewTop && oy < (viewTop + clip.height);

    if (isContentInViewport && isHeaderAboveViewport) {
      // Header 应置顶
      let pinnedY = viewTop;
      // 如果当前消息快滚出视口，header 被下一条消息推走
      if ((oy + totalH) - viewTop < headerH) {
        pinnedY = (oy + totalH) - headerH;
      }
      // 清除旧内容后绘制置顶 header
      ctx.fillRect(clip.x, pinnedY, clip.width, headerH, " ");
      header.paint(ctx, ox + header.offset.x, pinnedY);
    } else {
      // 正常位置绘制 header
      header.paint(ctx, ox + header.offset.x, headerY);
    }
  }
}
```

### R10: BottomGrid 自定义 RenderObject

**当前状态**: flitter-core 的 `ContainerWithOverlays` 不支持 **位置化 overlay text**（4 角定位）。
**Amp 实现**: `TtR` (BottomGrid) — 左右分栏 + 4 角 overlay text + overlay 动画层 + 可拖拽分隔线

需要在 flitter-core 或 flitter-amp 中实现：

```typescript
/**
 * BottomGrid — 底部多区域布局
 *
 * ┌──────────────────────────────────────┐
 * │ [top-left overlay]  [top-right overlay] │
 * │ ┌────────────┬───────┬─────────┐     │
 * │ │            │       │         │     │
 * │ │ leftChild  │ right1│ right2  │     │
 * │ │ (PromptBar)│(Queue)│(Todos)  │     │
 * │ │            │       │         │     │
 * │ └────────────┴───────┴─────────┘     │
 * │ [btm-left overlay]  [btm-right overlay] │
 * └──────────────────────────────────────┘
 *
 * Amp 原始类: TtR (Widget) → RenderBottomGrid (RenderBox)
 */
class BottomGrid extends MultiChildRenderObjectWidget {
  leftChild: Widget;
  rightChild1?: Widget;
  rightChild2?: Widget;
  overlayTexts: Array<{child: Widget, position: 'top-left'|'top-right'|'bottom-left'|'bottom-right'}>;
  overlayLayer?: Widget;   // 动画层
  dividerDraggable?: boolean;
}
```

### R11: Animation 框架

**当前状态**: flitter-core **没有** AnimationController/Tween/Curve。ScrollController.animateTo 用 setInterval 线性插值。
**Amp 使用场景**:
1. BrailleSpinner 200ms 帧动画 → flitter-core 已有 `BrailleSpinner` ✅
2. Handoff blink 700ms → 可用简单 `setInterval` + `setState()` 代替
3. AgentModePulse 扫描动画 → 可用 `setInterval` + `setState()` 代替
4. Copy highlight 300ms → RenderText 已支持 `highlightMode: 'copy'` ✅

**结论**: Amp CLI 的动画不需要完整的 Animation 框架，用 `setInterval` + `setState()` 即可满足。**此项不需要在 flitter-core 完善**。

### R12: Autocomplete Widget

**当前状态**: flitter-core **没有** Autocomplete 组件。
**Amp 实现**: `ptR` (PromptBar) 内嵌了 Autocomplete 触发器系统（@ 文件引用、@@ 线程引用）。

需要在 flitter-core 中新增（或直接在 flitter-amp 中实现）：
- `AutocompleteTrigger` — 检测触发字符（`@`, `@@`, `$`）
- `AutocompleteOverlay` — 弹出补全列表（使用 Stack + Positioned）
- `FuzzyMatcher` — 模糊匹配算法

**评估**: 这是一个通用的 UI 组件，建议在 flitter-core 实现。

---

## 🔵 flitter-amp 应用层 — 需要实现/完善

### R13: Amp 主题色板系统

**当前状态**: flitter-amp 使用 ANSI 标准色（`Color.green`, `Color.blue`），**未使用 RGB 真彩色主题**。
**目标**: 实现 Amp 的 8 个内置主题，全部使用 RGB 真彩色。

需要在 flitter-amp 中新增 `src/themes/` 目录：

```typescript
// src/themes/amp-theme.ts
interface AmpThemeColors {
  // BaseTheme — 21 个基础色 + 8 个语法高亮色
  background: Color;
  foreground: Color;
  mutedForeground: Color;
  border: Color;
  selection: Color;       // 带 alpha
  primary: Color;
  secondary: Color;
  accent: Color;
  success: Color;
  warning: Color;
  info: Color;
  destructive: Color;
  copyHighlight: Color;
  tableBorder: Color;     // 带 alpha
  cursor: Color;
  isLight: boolean;
  syntaxHighlight: {
    keyword: Color; string: Color; number: Color; comment: Color;
    function: Color; variable: Color; type: Color; operator: Color;
  };
}

// AppTheme — 40+ 语义色（从 BaseTheme 派生）
interface AmpAppTheme {
  base: AmpThemeColors;
  toolName: Color;
  toolSuccess: Color;
  toolError: Color;
  toolCancelled: Color;
  fileReference: Color;
  command: Color;
  keybind: Color;
  link: Color;
  recommendation: Color;
  shellMode: Color;
  handoffMode: Color;
  queueMode: Color;
  scrollbarThumb: Color;
  scrollbarTrack: Color;
  // ...
}
```

8 个内置主题的完整 RGB 色板见 spec.md 的 §8.4（已提取）。

### R14: Chat View 组件树重构

**当前状态**: flitter-amp 有 `ChatView` 但结构简化。
**目标**: 对齐 Amp CLI 的完整组件树。

Amp 的 Chat View 组件树：
```
App (StatefulWidget)
  └── FocusScope (全局快捷键)
      └── ThemeProvider (AmpTheme InheritedWidget)
          └── Stack
              ├── Column (主布局)
              │   ├── Expanded → SingleChildScrollView (followMode)
              │   │   └── Column (消息列表)
              │   │       ├── WelcomeScreen (首次显示)
              │   │       │   └── ASCII orb + "Welcome to Amp" + daily quote
              │   │       ├── StickyHeader[0] (用户消息)
              │   │       │   ├── header: "You" 标签 (绿色)
              │   │       │   └── body: 用户文本 (绿色左边框 + italic)
              │   │       ├── StickyHeader[1] (助手消息)
              │   │       │   ├── header: 空（助手消息无标题）
              │   │       │   └── body: Column
              │   │       │       ├── ThinkingBlock × N (可折叠)
              │   │       │       ├── Markdown (流式渲染)
              │   │       │       └── ToolCallWidget × N (递归嵌套)
              │   │       └── ...更多消息
              │   ├── BottomGrid (底部区域)
              │   │   ├── PromptBar (输入栏)
              │   │   ├── Overlay texts (4 角状态)
              │   │   └── StatusBar
              │   └── Scrollbar
              ├── Positioned (CommandPalette)   // Ctrl+O
              ├── Positioned (PermissionDialog) // 模态
              └── Positioned (FilePicker)       // @ 触发
```

**当前 flitter-amp 与 Amp 的差距**:

| 组件 | flitter-amp 当前 | Amp CLI 目标 | 差距 |
|---|---|---|---|
| 消息标题置顶 | ❌ 无 StickyHeader | ✅ header 固定在视口顶部 | **需实现** |
| 主题色 | ANSI 标准色 | RGB 真彩色 8 主题 | **需重构** |
| 工具调用 | 简单文本 + 状态图标 | 35+ 类型分发 + 递归嵌套 | **需大量扩展** |
| 底部区域 | InputArea + StatusBar | BottomGrid (多区域 + overlay) | **需重构** |
| Spinner 动画 | 静态 ≈ | BrailleSpinner 200ms | **需接入** (core 已有) |
| 欢迎屏 | ASCII orb + 名言 | 同 | ✅ 基本实现 |
| 思考块 | 折叠/展开 + streaming | 同 + 折叠计数器 | **需完善** |
| PromptBar | TextField 基础 | Autocomplete + Shell 模式 + 图片附件 | **需大量扩展** |
| Markdown | 使用 core Markdown | 同 | ✅ |
| Diff | 使用 core DiffView | 同 | ✅ |
| 选区/复制 | core RenderText.selectable | 同 | ✅ |

### R15: ToolCallWidget 分发系统

**当前状态**: flitter-amp 的 `ToolCallBlock` 是简单的单一渲染组件。
**目标**: 实现 Amp 的 35+ 工具类型分发。

#### 通用工具卡片 `GenericToolCard` 布局
```
GenericToolCard (StatefulWidget)
  └── StickyHeader (如果 !hideHeader)
      ├── header: ToolHeader
      │   └── Row
      │       ├── StatusIcon (● 颜色 = status → color)
      │       ├── ToolName (bold + toolName 色)
      │       ├── ...details (dim)
      │       └── Spinner (in-progress 时)
      └── body: Padding (left: 2)
          └── Column
              ├── inputSection → Markdown
              ├── thinkingBlocks → ThinkingBlock × N
              ├── nested toolCalls → ToolCallWidget × N (递归!)
              └── outputSection → Markdown
```

#### 状态指示器颜色（`wt` 函数）
```
in-progress → spinner + mutedForeground
done        → toolSuccess (绿色 ●)
error       → destructive (红色 ●)
cancelled   → dim (灰色 ●)
```

#### 需要实现的核心工具渲染器

| 优先级 | 工具类型 | 渲染需求 |
|---|---|---|
| P0 | `Read` (vTT) | 文件路径 + 行号范围 |
| P0 | `edit_file` (uTT) | DiffView 嵌入 |
| P0 | `Bash` / `shell_command` (_TT/ETT) | $ prefix + spinner + 输出 + 退出码 |
| P0 | `Task` / `sa__*` (ytR/AtR) | 子 Agent 递归嵌套 |
| P0 | `Grep` (jTT) | pattern + path + 结果计数 |
| P1 | `create_file` (kTT) | 文件创建卡片 |
| P1 | `WebSearch` (GTT) | 搜索查询 + 结果链接 |
| P1 | `handoff` (mTT) | 线程链接 + 700ms blink |
| P1 | `todo_list` (gTT) | 4 种状态图标 (○/◐/●/∅) |
| P2 | `mermaid` | ASCII 渲染 + mermaid.live 链接 |
| P2 | `painter` ($TT) | Kitty Graphics 图片 |
| P2 | `REPL` (DTT) | REPL 工具 |
| P2 | 其他 | GenericToolCard 通用回退 |

### R16: PromptBar 增强

**当前状态**: InputArea 基于 TextField，功能简单。
**目标**: 对齐 Amp 的 PromptBar 全部功能。

需要增强的功能清单：
1. **Shell 模式**: `$` 前缀 → 普通命令，`$$` → 后台命令，UI 切换（背景色/提示文字变化）
2. **Autocomplete**: `@` 触发文件补全，`@@` 触发线程引用
3. **图片附件**: `Ctrl+V` 粘贴图片，预览缩略图
4. **Submit 键**: 可配置 Enter 或 Cmd+Enter
5. **多行编辑**: Shift+Enter 换行
6. **Placeholder**: 空状态提示文字
7. **Top widget**: 快捷键帮助面板

### R17: BottomGrid 底部区域

**当前状态**: StatusBar 简单文本。
**目标**: 4 角 overlay text + 可拖拽分隔线。

需要显示的 4 角信息：
- **top-left**: 模式指示 (shell/handoff/queue/deep timer/token usage)
- **top-right**: Agent 模式标签 (smart/code/deep/ask + fast 标记)
- **bottom-left**: 提示文字 ("Esc to abort", "Shift+Enter for newline", etc.)
- **bottom-right**: 工作目录 (缩短 ~ 替代) + git branch

### R18: 动画效果

需要在 flitter-amp 中用 `setInterval` + `setState()` 实现：
1. **BrailleSpinner**: 工具进行中显示旋转 spinner (已有 core BrailleSpinner, 需接入)
2. **Handoff Blink**: 700ms 间隔 `toolSuccess`↔`mutedForeground` 切换标题 `●` 颜色
3. **AgentModePulse**: 右到左扫描高亮效果 (FPS=30, speed/trail 可配)
4. **Copy Highlight**: 选区复制后 300ms 高亮 (core RenderText 已支持)
