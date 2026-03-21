# 计算器示例

一个功能完整的键盘驱动计算器，演示复杂状态管理、表达式求值、边框装饰和动态颜色反馈。

## 运行方式

```bash
bun run examples/calculator.ts
```

## 功能说明

- 按 `0-9` 输入数字
- 按 `+`、`-`、`*`、`/` 输入运算符
- 按 `=` 或 `Enter` 计算结果
- 按 `c` 清空
- 按 `Backspace` 删除末位
- 按 `q` 或 `Ctrl+C` 退出
- 计算错误时边框变为红色，结果正确时显示绿色

## 完整代码

```typescript
import { runApp, WidgetsBinding } from '../src/framework/binding';
import {
  StatefulWidget, State, Widget, type BuildContext,
} from '../src/framework/widget';
import { Center } from '../src/widgets/center';
import { Column, Row } from '../src/widgets/flex';
import { Text } from '../src/widgets/text';
import { SizedBox } from '../src/widgets/sized-box';
import { Padding } from '../src/widgets/padding';
import { Container } from '../src/widgets/container';
import { Divider } from '../src/widgets/divider';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';
import { EdgeInsets } from '../src/layout/edge-insets';
import { BoxDecoration, Border, BorderSide } from '../src/layout/render-decorated';
import { FocusNode, FocusManager } from '../src/input/focus';
import type { KeyEvent, KeyEventResult } from '../src/input/events';

function label(content: string, style?: TextStyle): Text {
  return new Text({
    text: new TextSpan({
      text: content,
      style: style ?? new TextStyle(),
    }),
  });
}

export class CalculatorApp extends StatefulWidget {
  createState(): CalculatorState {
    return new CalculatorState();
  }
}

export class CalculatorState extends State<CalculatorApp> {
  expression = '';
  result = '';
  hasError = false;
  private _focusNode: FocusNode | null = null;

  initState(): void {
    this._focusNode = new FocusNode({
      debugLabel: 'CalculatorFocus',
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
    if (event.key === 'q' || (event.key === 'c' && event.ctrlKey)) {
      process.exit(0);
    }
    if (event.key === 'c') {
      this.setState(() => {
        this.expression = '';
        this.result = '';
        this.hasError = false;
      });
      return 'handled';
    }
    if (event.key === 'Backspace') {
      this.setState(() => {
        this.expression = this.expression.slice(0, -1);
        this.hasError = false;
      });
      return 'handled';
    }
    if (event.key === '=' || event.key === 'Enter') {
      this.setState(() => { this._evaluate(); });
      return 'handled';
    }
    if (event.key >= '0' && event.key <= '9') {
      this.setState(() => {
        this.expression += event.key;
        this.hasError = false;
      });
      return 'handled';
    }
    if (event.key === '.') {
      this.setState(() => { this.expression += '.'; });
      return 'handled';
    }
    if (['+', '-', '*', '/'].includes(event.key)) {
      this.setState(() => {
        this.expression += ` ${event.key} `;
        this.hasError = false;
      });
      return 'handled';
    }
    return 'ignored';
  }

  private _evaluate(): void {
    if (this.expression.trim().length === 0) return;
    try {
      const sanitized = this.expression.replace(/[^0-9+\-*/.() ]/g, '');
      if (sanitized.length === 0) {
        this.result = 'Error';
        this.hasError = true;
        return;
      }
      const fn = new Function(`return (${sanitized});`);
      const value = fn();
      if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        this.result = String(Math.round(value * 100000000) / 100000000);
        this.hasError = false;
      } else {
        this.result = 'Error';
        this.hasError = true;
      }
    } catch {
      this.result = 'Error';
      this.hasError = true;
    }
  }

  build(_context: BuildContext): Widget {
    const borderColor = this.hasError ? Color.red : Color.cyan;
    const resultColor = this.hasError
      ? Color.red
      : this.result.length > 0 ? Color.green : Color.white;
    const displayExpr = this.expression.length > 0 ? this.expression : '0';
    const displayResult = this.result.length > 0 ? `= ${this.result}` : '';

    const buttonRow = (keys: string[]): Widget => {
      return new Row({
        mainAxisAlignment: 'center',
        children: keys.map(k => {
          const isOp = ['+', '-', '*', '/', '=', 'C'].includes(k);
          return new Padding({
            padding: EdgeInsets.symmetric({ horizontal: 1 }),
            child: new Container({
              width: 5, height: 1,
              decoration: new BoxDecoration({
                color: isOp ? Color.blue : Color.brightBlack,
              }),
              child: new Center({
                child: label(k, new TextStyle({
                  bold: true,
                  foreground: isOp ? Color.yellow : Color.white,
                })),
              }),
            }),
          });
        }),
      });
    };

    return new Center({
      child: new Container({
        width: 42,
        decoration: new BoxDecoration({
          border: Border.all(new BorderSide({ color: borderColor, style: 'rounded' })),
        }),
        child: new Column({
          mainAxisSize: 'min',
          crossAxisAlignment: 'stretch',
          children: [
            new Container({
              decoration: new BoxDecoration({ color: borderColor }),
              child: label(' Calculator ', new TextStyle({ bold: true })),
            }),
            new SizedBox({ height: 1 }),
            new Padding({
              padding: EdgeInsets.symmetric({ horizontal: 2 }),
              child: new Container({
                decoration: new BoxDecoration({
                  border: Border.all(new BorderSide({ color: Color.brightBlack, style: 'solid' })),
                }),
                child: new Padding({
                  padding: EdgeInsets.symmetric({ horizontal: 1 }),
                  child: new Column({
                    mainAxisSize: 'min',
                    crossAxisAlignment: 'end',
                    children: [
                      label(displayExpr, new TextStyle({ foreground: Color.white })),
                      label(displayResult, new TextStyle({ bold: true, foreground: resultColor })),
                    ],
                  }),
                }),
              }),
            }),
            new SizedBox({ height: 1 }),
            buttonRow(['7', '8', '9', '/', 'C']),
            buttonRow(['4', '5', '6', '*', ' ']),
            buttonRow(['1', '2', '3', '-', ' ']),
            buttonRow(['0', '.', ' ', '+', '=']),
            new SizedBox({ height: 1 }),
            new Padding({
              padding: EdgeInsets.symmetric({ horizontal: 1 }),
              child: label('Type digits/ops  Enter/=: eval  c: clear  q: quit',
                new TextStyle({ dim: true })),
            }),
          ],
        }),
      }),
    });
  }
}

if (typeof process !== 'undefined' && !process.env.BUN_TEST) {
  const binding = runApp(new CalculatorApp());
  binding.setOutput(process.stdout);
}
```

## 代码解析

### 状态管理

计算器维护三个状态变量：

```typescript
expression = '';    // 当前输入的表达式
result = '';        // 计算结果
hasError = false;   // 是否有错误
```

所有键盘输入通过 `setState()` 更新状态，触发界面重建。

### 表达式求值

```typescript
private _evaluate(): void {
  const sanitized = this.expression.replace(/[^0-9+\-*/.() ]/g, '');
  const fn = new Function(`return (${sanitized});`);
  const value = fn();
  // ...
}
```

求值流程：
1. 清理输入，只保留数字和运算符
2. 使用 `Function` 构造器安全地计算表达式
3. 验证结果的有效性（数字、非 NaN、有限值）
4. 结果保留 8 位精度

### 动态视觉反馈

```typescript
const borderColor = this.hasError ? Color.red : Color.cyan;
```

边框颜色随错误状态变化：正常为青色，出错为红色。结果文本同样根据状态使用不同颜色。

### 按钮网格布局

```typescript
const buttonRow = (keys: string[]): Widget => {
  return new Row({
    mainAxisAlignment: 'center',
    children: keys.map(k => {
      const isOp = ['+', '-', '*', '/', '=', 'C'].includes(k);
      return new Padding({
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: new Container({
          width: 5, height: 1,
          decoration: new BoxDecoration({
            color: isOp ? Color.blue : Color.brightBlack,
          }),
          child: new Center({ child: label(k, ...) }),
        }),
      });
    }),
  });
};
```

使用工厂函数创建按钮行，每个按钮是一个带背景色的固定尺寸 Container。运算符按钮使用蓝色背景+黄色文字，数字按钮使用灰色背景+白色文字。

::: tip
这个示例展示了如何在 flutter-tui 中构建复杂的交互式界面。关键技术点包括：复杂键盘事件路由、多状态协调、Container 嵌套装饰、以及工厂函数模式简化重复组件创建。
:::
