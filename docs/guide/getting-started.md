# 快速开始

本指南将帮助你搭建开发环境并运行第一个 Flutter-TUI 应用。

## 环境要求

| 工具 | 最低版本 | 说明 |
|------|---------|------|
| Bun | 1.3+ | JavaScript/TypeScript 运行时 |
| TypeScript | 5.7+ | 类型系统 |
| 终端 | 支持 256 色 | 推荐 iTerm2 / WezTerm / Windows Terminal |

## 安装 Bun

如果你还没有安装 Bun，可以通过以下命令安装：

```bash [Linux / macOS]
curl -fsSL https://bun.sh/install | bash
```

```bash [Windows]
powershell -c "irm bun.sh/install.ps1 | iex"
```

安装完成后验证版本：

```bash
bun --version
# 应输出 1.3.x 或更高版本
```

## 获取项目

```bash
git clone <repo-url> flutter-tui
cd flutter-tui
bun install
```

## 运行示例

项目包含 28 个示例应用，可以直接运行体验：

```bash
# Hello World -- 最简单的示例
bun run example:hello

# 计数器 -- StatefulWidget + 键盘事件
bun run example:counter

# Flex 布局 -- Row/Column 布局演示
bun run example:flex

# 滚动视图 -- ScrollView 演示
bun run example:scroll

# 表格 -- Table widget 演示
bun run example:table

# 输入表单 -- TextField 交互
bun run example:input

# Todo 应用 -- 完整的交互式应用
bun run example:todo
```

::: tip 退出应用
大多数示例使用 `q` 或 `Ctrl+C` 退出。
:::

## 第一个应用

下面创建一个最简单的 Flutter-TUI 应用，在终端中央显示一行彩色文字：

```typescript [hello.ts]
import { runApp } from '../src/framework/binding';
import { Center } from '../src/widgets/center';
import { Text } from '../src/widgets/text';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';

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

const binding = runApp(app);
binding.setOutput(process.stdout);
```

运行：

```bash
bun run hello.ts
```

::: details 代码解析
1. `runApp()` 是应用入口，接受一个 Widget 作为根组件
2. `Center` 会将子组件居中显示在可用空间内
3. `Text` 接受一个 `TextSpan` 来描述富文本内容
4. `TextStyle` 可设置粗体、颜色、斜体等样式
5. `Color.rgb()` 创建 24 位真彩色
:::

## 创建 StatefulWidget

下面创建一个有状态的计数器应用，演示 `StatefulWidget` 和键盘事件处理：

```typescript [counter.ts]
import { runApp } from '../src/framework/binding';
import {
  StatefulWidget,
  State,
  Widget,
  type BuildContext,
} from '../src/framework/widget';
import { Center } from '../src/widgets/center';
import { Column } from '../src/widgets/flex';
import { Text } from '../src/widgets/text';
import { SizedBox } from '../src/widgets/sized-box';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';
import { FocusNode, FocusManager } from '../src/input/focus';
import type { KeyEvent, KeyEventResult } from '../src/input/events';

class CounterApp extends StatefulWidget {
  createState(): CounterState {
    return new CounterState();
  }
}

class CounterState extends State<CounterApp> {
  count = 0;
  private _focusNode: FocusNode | null = null;

  initState(): void {
    this._focusNode = new FocusNode({
      debugLabel: 'CounterFocus',
      onKey: (event: KeyEvent): KeyEventResult => {
        if (event.key === 'ArrowUp') {
          this.setState(() => { this.count++; });
          return 'handled';
        }
        if (event.key === 'ArrowDown') {
          this.setState(() => { this.count--; });
          return 'handled';
        }
        return 'ignored';
      },
    });
    FocusManager.instance.registerNode(this._focusNode, null);
    this._focusNode.requestFocus();
  }

  dispose(): void {
    this._focusNode?.dispose();
    super.dispose();
  }

  build(_context: BuildContext): Widget {
    const color = this.count > 0 ? Color.green
                : this.count < 0 ? Color.red
                : Color.white;

    return new Center({
      child: new Column({
        mainAxisSize: 'min',
        mainAxisAlignment: 'center',
        children: [
          new Text({
            text: new TextSpan({
              text: 'Counter',
              style: new TextStyle({ bold: true, foreground: Color.cyan }),
            }),
          }),
          new SizedBox({ height: 1 }),
          new Text({
            text: new TextSpan({
              text: String(this.count),
              style: new TextStyle({ foreground: color, bold: true }),
            }),
          }),
        ],
      }),
    });
  }
}

const binding = runApp(new CounterApp());
binding.setOutput(process.stdout);
```

::: warning 关于 setState
`setState()` 必须在 State 挂载期间调用。在 `dispose()` 之后调用将抛出异常。详见 [Widget 生命周期](/guide/widget-lifecycle)。
:::

## 运行测试

项目使用 Bun 内置的测试框架：

```bash
# 运行全部测试
bun test

# 运行带覆盖率的测试
bun test --coverage

# 运行特定模块的测试
bun test src/core
bun test src/framework
bun test src/layout
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `bun test` | 运行全部测试 |
| `bun test --coverage` | 运行测试并输出覆盖率 |
| `bun run build` | 构建到 dist/ 目录 |
| `bun run typecheck` | TypeScript 类型检查（不生成文件） |
| `bun run docs:dev` | 启动文档开发服务器 |
| `bun run docs:build` | 构建文档静态站点 |

## 下一步

- [项目结构](/guide/project-structure) — 了解源码组织方式
- [三棵树架构](/guide/three-tree) — 理解核心架构原理
- [Widget 生命周期](/guide/widget-lifecycle) — 掌握组件生命周期
