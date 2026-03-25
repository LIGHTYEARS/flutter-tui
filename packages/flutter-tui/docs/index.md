---
layout: home

hero:
  name: "Flutter-TUI"
  text: "Flutter 风格的终端 UI 框架"
  tagline: 基于 TypeScript/Bun 的声明式 TUI 框架 — 三棵树架构 + 盒约束布局 + 60fps 渲染
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: API 参考
      link: /api/core/types
    - theme: alt
      text: GitHub
      link: https://github.com/LIGHTYEARS/flutter-tui

features:
  - icon: "\U0001F333"
    title: 三棵树架构
    details: 完整实现 Flutter 的 Widget → Element → RenderObject 三棵树体系，声明式 UI 开发体验
  - icon: "\U0001F4D0"
    title: 盒约束布局
    details: Flutter 标准的 BoxConstraints 布局协议，支持 Flex、Padding、Stack 等常用布局模式
  - icon: "\u26A1"
    title: 60fps 渲染
    details: 按需调度帧渲染，双缓冲 + 最小差异更新算法，仅在状态变化时渲染
  - icon: "\U0001F9E9"
    title: 丰富的组件库
    details: 17+ 内置 Widget — Text、Container、Row/Column、ScrollView、TextField、Button 等
  - icon: "\u2328\uFE0F"
    title: 完善的输入系统
    details: 键盘/鼠标事件解析、焦点管理树、快捷键绑定、事件冒泡分发
  - icon: "\U0001F527"
    title: 零依赖
    details: 无第三方运行时依赖，基于 Bun 运行时，开箱即用
---

## 快速体验

```bash
# 克隆项目
git clone https://github.com/LIGHTYEARS/flutter-tui.git
cd flutter-tui

# 安装依赖
bun install

# 运行 Hello World
bun run examples/hello-world.ts

# 运行计数器示例
bun run examples/counter.ts

# 运行全部测试
bun test
```

## 最简示例

```typescript
import { runApp } from './src/framework/binding';
import { Center } from './src/widgets/center';
import { Text } from './src/widgets/text';
import { TextSpan } from './src/core/text-span';
import { TextStyle } from './src/core/text-style';
import { Color } from './src/core/color';

const app = new Center({
  child: new Text({
    text: new TextSpan({
      text: 'Hello, Flutter-TUI!',
      style: new TextStyle({
        bold: true,
        foreground: Color.cyan,
      }),
    }),
  }),
});

runApp(app);
```
