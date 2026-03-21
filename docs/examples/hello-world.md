# Hello World 示例

最简单的 flutter-tui 应用，在终端中居中显示一行彩色文本。

## 运行方式

```bash
bun run examples/hello-world.ts
```

## 功能说明

- 使用 `runApp()` 启动应用
- 使用 `Center` 组件将内容居中在终端视口中
- 使用 `Text` + `TextSpan` 显示带样式的文本
- 使用 `Color` 和 `TextStyle` 设置颜色和粗体

## 完整代码

```typescript
import { runApp, WidgetsBinding } from '../src/framework/binding';
import { Center } from '../src/widgets/center';
import { Text } from '../src/widgets/text';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';

// 构建组件树：
// Center 将子组件居中在终端视口中
const app = new Center({
  child: new Text({
    text: new TextSpan({
      text: 'Hello, Flutter-TUI!',
      style: new TextStyle({
        bold: true,
        foreground: Color.rgb(100, 200, 255),
      }),
    }),
  }),
});

export { app };

// 仅在直接执行时运行（非测试导入）
if (typeof process !== 'undefined' && !process.env.BUN_TEST) {
  const binding = runApp(app);
  binding.setOutput(process.stdout);
}
```

## 代码解析

### 导入模块

```typescript
import { runApp, WidgetsBinding } from '../src/framework/binding';
import { Center } from '../src/widgets/center';
import { Text } from '../src/widgets/text';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';
```

- `runApp` - 启动应用的入口函数，接收根组件并创建 WidgetsBinding
- `Center` - 居中布局组件
- `Text` - 文本显示组件
- `TextSpan` - 富文本内容载体
- `TextStyle` - 文本样式（粗体、颜色等）
- `Color` - 颜色定义

### 构建组件树

```typescript
const app = new Center({
  child: new Text({
    text: new TextSpan({
      text: 'Hello, Flutter-TUI!',
      style: new TextStyle({
        bold: true,
        foreground: Color.rgb(100, 200, 255),
      }),
    }),
  }),
});
```

组件树结构：

```
Center
  └─ Text
       └─ TextSpan("Hello, Flutter-TUI!")
            └─ TextStyle(bold, rgb(100,200,255))
```

- **Center**: 占满整个终端，将子组件居中
- **Text**: 叶子组件，负责文本渲染
- **TextSpan**: 携带文本内容和样式
- **TextStyle**: 设置粗体和自定义 RGB 前景色
- **Color.rgb()**: 创建 24 位真彩色

### 启动应用

```typescript
if (typeof process !== 'undefined' && !process.env.BUN_TEST) {
  const binding = runApp(app);
  binding.setOutput(process.stdout);
}
```

- 通过环境变量判断是否为测试环境，避免测试时产生副作用
- `runApp(app)` 创建 WidgetsBinding 并挂载根组件
- `binding.setOutput(process.stdout)` 将渲染输出连接到标准输出

::: tip
这个示例展示了 flutter-tui 的核心模式：**声明式组件树**。你通过嵌套组件来描述界面，框架负责布局计算和终端渲染。
:::
