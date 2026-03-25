# 计数器示例

一个键盘驱动的计数器应用，演示 StatefulWidget、State 生命周期和键盘事件处理。

## 运行方式

```bash
bun run examples/counter.ts
```

## 功能说明

- 按 `Up`/`+`/`=` 增加计数
- 按 `Down`/`-` 减少计数
- 按 `r` 重置为 0
- 按 `q` 或 `Ctrl+C` 退出
- 计数值颜色随状态变化：正数绿色、负数红色、零白色

## 完整代码

```typescript
import { runApp, WidgetsBinding } from '../src/framework/binding';
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

// CounterApp — StatefulWidget
export class CounterApp extends StatefulWidget {
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
        return this._handleKey(event);
      },
    });
    FocusManager.instance.registerNode(this._focusNode, null);
    this._focusNode.requestFocus();
  }

  dispose(): void {
    if (this._focusNode) {
      this._focusNode.dispose();
      this._focusNode = null;
    }
    super.dispose();
  }

  private _handleKey(event: KeyEvent): KeyEventResult {
    if (['ArrowUp', '+', '='].includes(event.key)) {
      this.setState(() => { this.count++; });
      return 'handled';
    }
    if (['ArrowDown', '-'].includes(event.key)) {
      this.setState(() => { this.count--; });
      return 'handled';
    }
    if (event.key === 'r') {
      this.setState(() => { this.count = 0; });
      return 'handled';
    }
    if (event.key === 'q' || (event.key === 'c' && event.ctrlKey)) {
      process.exit(0);
    }
    return 'ignored';
  }

  build(_context: BuildContext): Widget {
    const countColor = this.count > 0
      ? Color.green
      : this.count < 0
        ? Color.red
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
              style: new TextStyle({ foreground: countColor, bold: true }),
            }),
          }),
          new SizedBox({ height: 1 }),
          new Text({
            text: new TextSpan({
              text: 'Up/+ increment  Down/- decrement  r reset  q quit',
              style: new TextStyle({ dim: true }),
            }),
          }),
        ],
      }),
    });
  }
}

if (typeof process !== 'undefined' && !process.env.BUN_TEST) {
  const binding = runApp(new CounterApp());
  binding.setOutput(process.stdout);
}
```

## 代码解析

### StatefulWidget 模式

```typescript
export class CounterApp extends StatefulWidget {
  createState(): CounterState {
    return new CounterState();
  }
}
```

`StatefulWidget` 是有状态组件的基类。它不直接持有状态，而是通过 `createState()` 创建一个 `State` 对象来管理可变状态。

### State 生命周期

```typescript
class CounterState extends State<CounterApp> {
  count = 0;

  initState(): void {
    // 初始化：创建 FocusNode，注册键盘监听
  }

  dispose(): void {
    // 清理：释放 FocusNode
  }

  build(_context: BuildContext): Widget {
    // 根据当前状态构建组件树
  }
}
```

State 的生命周期：
1. `initState()` - 创建时调用一次，用于初始化
2. `build()` - 每次状态变化后调用，返回新的组件树
3. `dispose()` - 销毁时调用，用于释放资源

### setState 触发重建

```typescript
this.setState(() => { this.count++; });
```

`setState()` 接收一个回调函数，在回调中修改状态属性，然后框架会自动调用 `build()` 重建组件树。

::: warning
不要在 `setState()` 外部直接修改状态属性，否则界面不会更新。
:::

### FocusNode 键盘处理

```typescript
this._focusNode = new FocusNode({
  debugLabel: 'CounterFocus',
  onKey: (event: KeyEvent): KeyEventResult => {
    return this._handleKey(event);
  },
});
FocusManager.instance.registerNode(this._focusNode, null);
this._focusNode.requestFocus();
```

焦点系统的使用步骤：
1. 创建 `FocusNode` 并绑定 `onKey` 回调
2. 注册到 `FocusManager`
3. 调用 `requestFocus()` 获取焦点
4. 在 `dispose()` 中释放 FocusNode

### 动态样式

```typescript
const countColor = this.count > 0
  ? Color.green
  : this.count < 0
    ? Color.red
    : Color.white;
```

通过在 `build()` 方法中根据状态值选择不同的颜色，实现动态的视觉反馈。每次 `setState()` 后 `build()` 重新执行，颜色会自动更新。

::: tip
这个示例是学习 flutter-tui 状态管理的最佳起点。掌握了 StatefulWidget + State + setState 的模式后，就可以构建任意复杂的交互式应用。
:::
