# 简介

## 什么是 Flitter？

Flitter 是一个基于 TypeScript 和 Bun 运行时的终端 UI 框架。它完整实现了 Flutter 的三棵树架构（Widget → Element → RenderObject），将 Flutter 的声明式 UI 开发体验带到终端应用中。

### 设计目标

- **Flutter 100% 还原** — 忠实复现 Flutter 的三棵树架构、盒约束布局、按需帧调度
- **声明式 UI** — 通过组合 Widget 构建界面，状态驱动渲染
- **高性能** — 双缓冲差异更新，仅在脏数据时重绘，60fps 帧调度
- **零依赖** — 无第三方运行时依赖，基于 Bun 原生能力

### 核心特性

| 特性 | 说明 |
|------|------|
| 三棵树架构 | Widget（声明式描述）→ Element（生命周期管理）→ RenderObject（布局/绘制） |
| 盒约束布局 | 父组件传递约束给子组件，子组件在约束范围内自行决定尺寸 |
| Flex 布局 | Row/Column 实现完整的 6 步 Flex 算法 |
| 帧调度器 | 4 阶段管线（BUILD→LAYOUT→PAINT→RENDER），按需调度 |
| 输入系统 | 键盘/鼠标事件解析、焦点树、快捷键绑定、事件冒泡 |
| 17+ Widget | Text、Container、Row/Column、ScrollView、TextField、Button 等 |
| 1500+ 测试 | 完整的单元测试和集成测试覆盖 |

### 与 Flutter 的关系

Flitter 的 API 设计高度参照 Flutter：

- `StatelessWidget` / `StatefulWidget` / `InheritedWidget` — 三种核心 Widget 类型
- `Element` 的 `updateChild()` 四种情况完全一致
- `BoxConstraints` 的 tight/loose/constrain 算法一致
- `RenderFlex` 实现了完整的 6 步 Flex 布局算法
- `BuildOwner` 深度优先脏元素重建
- `FocusNode` / `FocusManager` 焦点管理树

::: info 适用场景
Flitter 适合构建富交互的终端应用，如：
- CLI 工具的交互式界面
- 终端仪表板和监控面板
- 终端文件管理器
- 终端文本编辑器
:::

### 技术栈

- **语言**: TypeScript 5.7+
- **运行时**: Bun 1.3+
- **测试框架**: bun:test
- **构建**: Bun 原生构建
