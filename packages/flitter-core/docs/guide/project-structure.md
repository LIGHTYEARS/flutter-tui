# 项目结构

Flitter 的源码按功能模块组织，每个目录对应架构中的一个层级。

## 顶层目录

```
flitter-core/
  src/           # 框架源码
  examples/      # 28 个示例应用
  test/          # 集成测试
  docs/          # VitePress 文档站点
  package.json   # 项目配置与脚本
  tsconfig.json  # TypeScript 配置
```

## 源码结构

```
src/
  index.ts                # 框架统一导出入口
  core/                   # 核心类型与基础设施
  framework/              # 三棵树框架核心
  layout/                 # 布局系统 (RenderObject 实现)
  widgets/                # 组件库 (17+ Widget)
  input/                  # 输入系统 (键盘/鼠标/焦点)
  scheduler/              # 帧调度与绘制
  terminal/               # 终端渲染层
  diagnostics/            # 诊断与性能工具
```

## 模块详解

### `src/core/` — 核心类型

基础数据类型，被所有其他模块依赖。

| 文件 | 导出 | 说明 |
|------|------|------|
| `types.ts` | `Offset`, `Size`, `Rect` | 坐标、尺寸、矩形 |
| `color.ts` | `Color` | 24 位真彩色，预定义常量（`Color.red`, `Color.green` 等） |
| `text-style.ts` | `TextStyle` | 文本样式（粗体、斜体、颜色等） |
| `text-span.ts` | `TextSpan` | 富文本片段，支持嵌套子 span |
| `box-constraints.ts` | `BoxConstraints` | 盒约束（min/max 宽高），tight/loose 工厂方法 |
| `key.ts` | `Key`, `ValueKey`, `GlobalKey` | Widget 标识键，用于 Element 复用匹配 |
| `wcwidth.ts` | `wcwidth` | Unicode 字符宽度计算（CJK 双宽字符） |

### `src/framework/` — 三棵树框架

Flutter 架构的核心实现，详见 [三棵树架构](/guide/three-tree)。

| 文件 | 导出 | 说明 |
|------|------|------|
| `widget.ts` | `Widget`, `StatelessWidget`, `StatefulWidget`, `State`, `InheritedWidget` | 所有 Widget 基类和状态管理 |
| `element.ts` | `Element`, `StatelessElement`, `StatefulElement`, `InheritedElement`, `RenderObjectElement` | 元素树，负责生命周期和 Widget 协调 |
| `render-object.ts` | `RenderObject`, `RenderBox`, `ContainerRenderBox`, `SingleChildRenderObjectWidget`, `MultiChildRenderObjectWidget` | 渲染对象树，负责布局和绘制 |
| `build-owner.ts` | `BuildOwner`, `GlobalKeyRegistry` | 构建阶段调度器，管理脏元素集合 |
| `pipeline-owner.ts` | `PipelineOwner` | 布局/绘制管线所有者 |
| `binding.ts` | `WidgetsBinding`, `runApp()` | 顶层绑定，连接所有子系统 |
| `listenable.ts` | `Listenable`, `ChangeNotifier`, `ValueNotifier` | 响应式监听器基础设施 |
| `error-widget.ts` | `ErrorWidget` | 构建错误时的降级显示组件 |

::: tip 三棵树的关系
`Widget` 是不可变描述 → 创建 `Element` 管理生命周期 → Element 创建/更新 `RenderObject` 执行布局绘制。详见 [三棵树架构](/guide/three-tree)。
:::

### `src/layout/` — 布局系统

基于盒约束的布局 RenderObject 实现。

| 文件 | 导出 | 说明 |
|------|------|------|
| `render-flex.ts` | `RenderFlex`, `Axis`, `MainAxisAlignment`, `CrossAxisAlignment`, `MainAxisSize` | Flex 布局引擎，Row/Column 的底层实现 |
| `render-padded.ts` | `RenderPadding` | 内边距布局 |
| `render-constrained.ts` | `RenderConstrained` | 约束盒布局（SizedBox 的底层） |
| `render-decorated.ts` | `RenderDecoratedBox` | 装饰盒（背景色、边框） |
| `edge-insets.ts` | `EdgeInsets` | 边距值 |
| `parent-data.ts` | `FlexParentData` | Flex 子项的布局数据（flex 系数、fit 模式） |

### `src/widgets/` — 组件库

开箱即用的 Widget 组件，全部基于三棵树架构实现。

| Widget | 文件 | 类型 | 说明 |
|--------|------|------|------|
| `Text` | `text.ts` | Leaf | 文本显示，支持 TextSpan 富文本 |
| `Container` | `container.ts` | SingleChild | 容器组件，组合 padding/decoration/constraints |
| `Center` | `center.ts` | SingleChild | 居中布局 |
| `Row` | `flex.ts` | MultiChild | 水平 Flex 布局 |
| `Column` | `flex.ts` | MultiChild | 垂直 Flex 布局 |
| `Expanded` | `flexible.ts` | ParentData | Flex 子项扩展填充 |
| `Flexible` | `flexible.ts` | ParentData | Flex 子项弹性占比 |
| `Spacer` | `spacer.ts` | Leaf | Flex 间距占位 |
| `SizedBox` | `sized-box.ts` | SingleChild | 固定尺寸盒 |
| `Padding` | `padding.ts` | SingleChild | 内边距 |
| `DecoratedBox` | `decorated-box.ts` | SingleChild | 装饰盒（背景、边框） |
| `Stack` | `stack.ts` | MultiChild | 层叠布局 |
| `Divider` | `divider.ts` | Leaf | 分割线 |
| `Table` | `table.ts` | MultiChild | 表格布局 |
| `SingleChildScrollView` | `scroll-view.ts` | SingleChild | 滚动视图 |
| `TextField` | `text-field.ts` | Stateful | 文本输入框 |
| `Button` | `button.ts` | Stateful | 可点击按钮 |
| `MouseRegion` | `mouse-region.ts` | SingleChild | 鼠标事件区域 |
| `Builder` | `builder.ts` | Stateless | 函数式构建 Widget |
| `DefaultTextStyle` | `default-text-style.ts` | Inherited | 文本样式继承 |

### `src/input/` — 输入系统

终端输入解析和事件分发，详见 [键盘事件](/guide/keyboard-input)、[鼠标事件](/guide/mouse-input)、[焦点管理](/guide/focus-management)。

| 文件 | 导出 | 说明 |
|------|------|------|
| `events.ts` | `KeyEvent`, `MouseEvent`, `ResizeEvent`, `InputEvent` | 输入事件类型定义（判别联合类型） |
| `input-parser.ts` | `InputParser` | 转义序列状态机，raw bytes → 结构化事件 |
| `keyboard.ts` | `LogicalKey` | 逻辑按键映射表 |
| `mouse.ts` | `MouseButton`, `MouseModifier` | SGR 鼠标协议解析工具 |
| `focus.ts` | `FocusNode`, `FocusScopeNode`, `FocusManager` | 焦点树管理 |
| `hit-test.ts` | `hitTest`, `HitTestResult` | 鼠标坐标命中测试 |
| `event-dispatcher.ts` | `EventDispatcher` | 事件分发到焦点节点 |
| `shortcuts.ts` | `ShortcutManager` | 全局快捷键绑定 |
| `input-bridge.ts` | `InputBridge` | stdin 到 InputParser 的桥接 |

### `src/scheduler/` — 帧调度

4 阶段帧管线的核心实现，详见 [渲染管线](/guide/rendering-pipeline)。

| 文件 | 导出 | 说明 |
|------|------|------|
| `frame-scheduler.ts` | `FrameScheduler`, `Phase` | 帧调度器单例，BUILD→LAYOUT→PAINT→RENDER |
| `paint-context.ts` | `PaintContext` | 绘制 API，RenderObject 绘制到 ScreenBuffer |
| `paint.ts` | `paintRenderTree` | 渲染树 DFS 绘制入口 |

### `src/terminal/` — 终端层

直接与终端交互的底层渲染实现。

| 文件 | 导出 | 说明 |
|------|------|------|
| `cell.ts` | `Cell`, `CellStyle`, `EMPTY_CELL`, `cellsEqual` | 终端单元格数据结构 |
| `screen-buffer.ts` | `ScreenBuffer`, `Buffer` | 双缓冲帧管理，前后缓冲 + 差异计算 |
| `renderer.ts` | `Renderer` | ANSI 转义序列生成器，差异补丁 → 最小输出 |
| `platform.ts` | `TerminalCapabilities` | 终端能力检测（颜色、鼠标、Unicode） |
| `terminal-manager.ts` | `TerminalManager` | 终端模式管理（raw mode、备用屏幕等） |
| `ansi-parser.ts` | `AnsiParser` | ANSI 转义序列解析 |

### `src/diagnostics/` — 诊断工具

开发和调试辅助功能。

| 文件 | 导出 | 说明 |
|------|------|------|
| `frame-stats.ts` | `FrameStats` | 帧性能统计（FPS、每阶段耗时） |
| `perf-overlay.ts` | `PerformanceOverlay` | 性能叠加层 Widget |
| `debug-flags.ts` | `debugPaintSizeEnabled` 等 | 调试标志开关 |

### `examples/` — 示例应用

28 个示例涵盖了框架的各种用法：

| 分类 | 示例 |
|------|------|
| 基础 | `hello-world`, `text-styles`, `color-palette` |
| 布局 | `flex-layout`, `nested-layout`, `alignment-demo` |
| 交互 | `counter`, `input-form`, `login-form`, `todo-app` |
| 高级 | `calculator`, `dashboard`, `file-browser`, `kanban-board` |
| 视觉 | `border-showcase`, `rich-text`, `spinner`, `progress-bar` |
| 滚动 | `scroll-demo` |
| 性能 | `perf-stress`, `system-monitor` |

::: details 运行任意示例
```bash
bun run examples/<示例名>.ts
```
:::

## 下一步

- [三棵树架构](/guide/three-tree) — 深入理解框架核心
- [布局系统](/guide/layout-system) — 学习盒约束和 Flex 布局
