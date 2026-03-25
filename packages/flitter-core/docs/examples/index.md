# 示例总览

flitter-core 提供了 28 个示例，覆盖从基础到复杂的各类 TUI 应用场景。

## 运行方式

```bash
bun run examples/<示例名>.ts
```

## 入门示例

| 示例 | 文件 | 说明 |
|------|------|------|
| [Hello World](/examples/hello-world) | `hello-world.ts` | 最简单的 flitter-core 应用，居中显示彩色文本 |
| [Counter](/examples/counter) | `counter.ts` | 计数器应用，演示 StatefulWidget 和键盘交互 |

## 布局示例

| 示例 | 文件 | 说明 |
|------|------|------|
| Flex Layout | `flex-layout.ts` | 演示弹性布局系统（Row/Column + Expanded） |
| Alignment Demo | `alignment-demo.ts` | MainAxisAlignment 和 CrossAxisAlignment 对齐效果展示 |
| Nested Layout | `nested-layout.ts` | 复杂的深层嵌套布局 |
| Stack Layers | `stack-layers.ts` | Stack + Positioned 叠加层演示 |

## 文本与样式示例

| 示例 | 文件 | 说明 |
|------|------|------|
| Text Styles | `text-styles.ts` | 展示所有 TextStyle 属性效果 |
| Rich Text | `rich-text.ts` | 复杂的 TextSpan 富文本树 |
| Color Palette | `color-palette.ts` | 展示全部 16 种命名颜色和 24 色 RGB 渐变 |
| Border Showcase | `border-showcase.ts` | 所有边框样式和装饰效果 |

## 交互示例

| 示例 | 文件 | 说明 |
|------|------|------|
| [Calculator](/examples/calculator) | `calculator.ts` | 键盘驱动的计算器，复杂状态管理 |
| [Todo App](/examples/todo-app) | `todo-app.ts` | 完整的 CRUD Todo 应用 |
| Menu Selector | `menu-selector.ts` | 键盘导航菜单 |
| Input Form | `input-form.ts` | TextField 组件和焦点导航 |
| Login Form | `login-form.ts` | 登录表单 UI（文本输入 + 验证） |
| Tabs Demo | `tabs-demo.ts` | 标签页导航和键盘切换 |

## 数据展示示例

| 示例 | 文件 | 说明 |
|------|------|------|
| [Dashboard](/examples/dashboard) | `dashboard.ts` | 多面板仪表板布局 |
| [Kanban Board](/examples/kanban-board) | `kanban-board.ts` | 三列看板布局 |
| Table Demo | `table-demo.ts` | Table 组件和响应式布局 |
| Notification List | `notification-list.ts` | 可滚动的通知/消息列表 |
| File Browser | `file-browser.ts` | 模拟文件浏览器（树形显示） |
| System Monitor | `system-monitor.ts` | 系统指标多面板展示 |
| Help Screen | `help-screen.ts` | 快捷键帮助界面 |

## 滚动示例

| 示例 | 文件 | 说明 |
|------|------|------|
| Scroll Demo | `scroll-demo.ts` | SingleChildScrollView 滚动内容演示 |

## 动画与高级示例

| 示例 | 文件 | 说明 |
|------|------|------|
| Clock | `clock.ts` | 实时更新的时钟 + 日期显示 |
| Spinner | `spinner.ts` | 多种样式的加载动画 |
| Progress Bar | `progress-bar.ts` | 带动画的进度条（StatefulWidget） |

## 性能测试

| 示例 | 文件 | 说明 |
|------|------|------|
| Perf Stress | `perf-stress.ts` | 创建 1000 个组件并测量帧性能 |

## 推荐学习路径

::: tip 建议按以下顺序学习
1. **Hello World** - 了解基本应用结构
2. **Counter** - 学习 StatefulWidget 和状态管理
3. **Flex Layout / Alignment Demo** - 掌握布局系统
4. **Text Styles / Rich Text** - 掌握文本和样式
5. **Calculator** - 学习复杂键盘交互
6. **Todo App** - 学习完整 CRUD 应用
7. **Dashboard / Kanban Board** - 学习复杂布局组合
:::
