# 鼠标事件

Flitter 通过 SGR 鼠标协议支持鼠标点击、移动、滚轮等交互。鼠标事件经过命中测试（hit-test）定位到具体的渲染对象，并通过 `MouseRegion` widget 分发到用户代码。

## MouseEvent 结构

```typescript
interface MouseEvent {
  readonly type: 'mouse';
  readonly action: 'press' | 'release' | 'move' | 'scroll';
  readonly button: number;     // 按钮编码
  readonly x: number;          // 列坐标，0 起始
  readonly y: number;          // 行坐标，0 起始
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
}
```

### 按钮编码

| 常量 | 值 | 说明 |
|------|-----|------|
| `MouseButton.Left` | 0 | 左键 |
| `MouseButton.Middle` | 1 | 中键 |
| `MouseButton.Right` | 2 | 右键 |
| `MouseButton.ScrollUp` | 64 | 向上滚动 |
| `MouseButton.ScrollDown` | 65 | 向下滚动 |
| `MouseButton.ScrollLeft` | 66 | 向左滚动 |
| `MouseButton.ScrollRight` | 67 | 向右滚动 |

### 修饰键位掩码

SGR 协议中，按钮编码同时包含了修饰键信息：

| 修饰键 | 位掩码 | 说明 |
|--------|-------|------|
| Shift | +4 | 第 2 位 |
| Alt/Meta | +8 | 第 3 位 |
| Ctrl | +16 | 第 4 位 |
| Motion | +32 | 第 5 位（拖拽时设置） |

```typescript
import { extractMouseModifiers, extractBaseButton } from '../src/input/mouse';

// 从原始编码中分离按钮和修饰键
const buttonCode = 20; // = 4(Shift) + 16(Ctrl) + 0(Left)
const base = extractBaseButton(buttonCode);     // 0 (Left)
const mods = extractMouseModifiers(buttonCode);
// { shift: true, alt: false, ctrl: true, motion: false }
```

## SGR 鼠标协议

Flitter 使用 SGR（Select Graphic Rendition）扩展鼠标协议，通过以下转义序列启用：

```
启用: \x1b[?1003h\x1b[?1006h
禁用: \x1b[?1003l\x1b[?1006l
```

- `?1003h`：启用全鼠标追踪（所有移动事件）
- `?1006h`：启用 SGR 编码格式

### SGR 编码格式

```
按下: \x1b[<button;col;rowM
释放: \x1b[<button;col;rowm
```

- 终止字符 `M` 表示按下/移动，`m` 表示释放
- col 和 row 为 1 起始坐标（解析器会转为 0 起始）

```typescript
// InputParser 内部使用正则解析 SGR 鼠标序列
const SGR_MOUSE_RE = /^<(\d+);(\d+);(\d+)$/;
// 匹配: <0;10;5  (左键，第10列，第5行)
```

### 动作判定

```typescript
function determineMouseAction(
  buttonCode: number,
  final: string,        // 'M' 或 'm'
): 'press' | 'release' | 'move' | 'scroll' {
  if (final === 'm') return 'release';

  const base = extractBaseButton(buttonCode);
  if (base >= 64) return 'scroll';

  const { motion } = extractMouseModifiers(buttonCode);
  if (motion) return 'move';

  return 'press';
}
```

## MouseRegion Widget

`MouseRegion` 是在 Widget 层处理鼠标事件的标准方式。它包装一个子组件，检测鼠标在该区域内的各种操作。

### 基本用法

```typescript [mouse-region-example.ts]
import { MouseRegion } from '../src/widgets/mouse-region';
import { Container } from '../src/widgets/container';
import { Text } from '../src/widgets/text';
import { TextSpan } from '../src/core/text-span';
import { Color } from '../src/core/color';

new MouseRegion({
  onClick: (event) => {
    console.log(`Clicked at (${event.x}, ${event.y})`);
  },
  onEnter: (event) => {
    // 鼠标进入区域
  },
  onExit: (event) => {
    // 鼠标离开区域
  },
  onHover: (event) => {
    // 鼠标在区域内移动
  },
  onScroll: (event) => {
    // 滚轮事件
  },
  child: new Container({
    color: Color.blue,
    child: new Text({
      text: new TextSpan({ text: 'Click me!' }),
    }),
  }),
});
```

### MouseRegion 事件回调

| 回调 | 触发时机 | 参数 |
|------|---------|------|
| `onClick` | 在区域内按下鼠标 | `{ x, y, button }` |
| `onEnter` | 鼠标从区域外进入 | `{ x, y }` |
| `onExit` | 鼠标从区域内移出 | `{ x, y }` |
| `onHover` | 鼠标在区域内移动 | `{ x, y }` |
| `onScroll` | 在区域内滚动 | `{ x, y, button }` |

### RenderMouseRegion

`MouseRegion` 的底层实现是 `RenderMouseRegion`，一个 `RenderBox` 子类：

```typescript
class RenderMouseRegion extends RenderBox {
  onClick?: (event: MouseRegionEvent) => void;
  onEnter?: (event: MouseRegionEvent) => void;
  onExit?: (event: MouseRegionEvent) => void;
  onHover?: (event: MouseRegionEvent) => void;
  onScroll?: (event: MouseRegionEvent) => void;
  cursor?: string;

  // 布局完全委托给子组件
  performLayout(): void {
    if (this.child) {
      this.child.layout(this.constraints!);
      this.size = this.child.size;
    }
  }

  // 检测是否有注册的监听器
  get hasListeners(): boolean { /* ... */ }
}
```

## Hit-Test 命中测试

鼠标事件通过命中测试（hit-test）机制定位到渲染树中具体的目标节点。

### 测试流程

```
鼠标点击 (screenX, screenY)
         │
         ▼
hitTest(root, screenX, screenY)
         │
    从根节点递归向下
    检查每个 RenderBox 的边界
         │
         ▼
HitTestResult {
  path: [
    { renderObject: deepestChild, localX, localY },
    { renderObject: parent, localX, localY },
    // ... 从最深到最浅
    { renderObject: root, localX, localY },
  ]
}
```

### 边界检测

```typescript
function hitTestSelf(
  renderObject: RenderBox,
  localX: number,
  localY: number,
): boolean {
  const size = renderObject.size;
  return localX >= 0
    && localX < size.width
    && localY >= 0
    && localY < size.height;
}
```

### 命中路径

命中测试返回从最深节点到根节点的路径。事件分发时，从路径的最深处开始查找 `RenderMouseRegion`，找到的第一个带有对应事件监听器的节点处理该事件。

```
HitTest Path (深 → 浅):
  ┌───────────────────────┐
  │ RenderMouseRegion     │ ← 目标：有 onClick
  │ RenderDecoratedBox    │
  │ RenderPadding         │
  │ RenderFlex (Column)   │
  │ RenderConstrained     │
  │ Root RenderBox        │
  └───────────────────────┘
```

::: tip 前层优先
当多个子组件在同一位置重叠时（如 Stack 布局），命中测试按绘制顺序反向遍历——最后绘制（前景）的子组件先被测试。
:::

## 鼠标交互示例

```typescript [interactive-button.ts]
class InteractiveButtonState extends State<InteractiveButton> {
  isHovered = false;
  isPressed = false;

  build(_context: BuildContext): Widget {
    const bgColor = this.isPressed ? Color.rgb(60, 60, 120)
                  : this.isHovered ? Color.rgb(80, 80, 160)
                  : Color.rgb(40, 40, 80);

    return new MouseRegion({
      onEnter: () => this.setState(() => { this.isHovered = true; }),
      onExit: () => this.setState(() => { this.isHovered = false; }),
      onClick: () => this.setState(() => { this.isPressed = true; }),
      child: new Container({
        color: bgColor,
        child: new Text({
          text: new TextSpan({ text: 'Button' }),
        }),
      }),
    });
  }
}
```

## 下一步

- [键盘事件](/guide/keyboard-input) — 键盘输入处理
- [焦点管理](/guide/focus-management) — 焦点树和事件路由
- [Widget 生命周期](/guide/widget-lifecycle) — 在生命周期中管理事件监听
