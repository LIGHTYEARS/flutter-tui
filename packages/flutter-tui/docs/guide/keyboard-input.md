# 键盘事件

Flutter-TUI 的输入系统将终端原始字节流解析为结构化的键盘事件，并通过焦点树分发到对应的 Widget。

## InputEvent 类型

所有终端输入事件使用判别联合（Discriminated Union）类型表示：

```typescript
type InputEvent =
  | KeyEvent      // 键盘事件
  | MouseEvent    // 鼠标事件
  | ResizeEvent   // 终端窗口大小变化
  | FocusEvent    // 终端窗口焦点变化
  | PasteEvent;   // 粘贴事件（Bracketed Paste）
```

通过 `type` 字段区分事件类型：

```typescript
function handleEvent(event: InputEvent) {
  switch (event.type) {
    case 'key':    handleKey(event);    break;
    case 'mouse':  handleMouse(event);  break;
    case 'resize': handleResize(event); break;
    case 'focus':  handleFocus(event);  break;
    case 'paste':  handlePaste(event);  break;
  }
}
```

## KeyEvent 结构

```typescript
interface KeyEvent {
  readonly type: 'key';
  readonly key: string;       // 逻辑按键名
  readonly ctrlKey: boolean;  // Ctrl 修饰键
  readonly altKey: boolean;   // Alt 修饰键
  readonly shiftKey: boolean; // Shift 修饰键
  readonly metaKey: boolean;  // Meta 修饰键
  readonly sequence?: string; // 原始转义序列
}
```

### 常见 key 值

| 分类 | key 值 |
|------|--------|
| 字母 | `'a'`, `'b'`, ..., `'z'` |
| 数字 | `'0'`, `'1'`, ..., `'9'` |
| 方向键 | `'ArrowUp'`, `'ArrowDown'`, `'ArrowLeft'`, `'ArrowRight'` |
| 功能键 | `'f1'`, `'f2'`, ..., `'f12'` |
| 编辑键 | `'Backspace'`, `'Delete'`, `'Insert'` |
| 导航键 | `'Home'`, `'End'`, `'PageUp'`, `'PageDown'` |
| 控制键 | `'Enter'`, `'Tab'`, `'Escape'`, `'Space'` |

### 修饰键组合

```typescript
// Ctrl+C
event.key === 'c' && event.ctrlKey

// Alt+F4
event.key === 'f4' && event.altKey

// Shift+Tab (反向 Tab 遍历)
event.key === 'Tab' && event.shiftKey

// Ctrl+Shift+Z (Redo)
event.key === 'z' && event.ctrlKey && event.shiftKey
```

## InputParser 状态机

`InputParser` 是将终端原始输入转换为结构化事件的核心组件。它实现了一个推送式（push-based）状态机。

### 解析流程

```
stdin 原始字节
     │
     ▼
InputParser.feed(data)
     │
     ▼
状态机解析
  ┌─ Idle     → 普通字符 / ESC 开始
  ├─ Escape   → CSI / SS3 / Alt+key
  ├─ CSI      → 方向键 / 功能键 / 鼠标 SGR
  ├─ SS3      → F1-F4 旧格式
  └─ Paste    → Bracketed paste 文本
     │
     ▼
callback(InputEvent)
```

### 状态转换

```
         字符输入
Idle ──────────────→ 发射 KeyEvent
  │
  │  ESC ('\x1b')
  │
  ▼
Escape
  │
  ├── '[' ──→ CSI（解析参数序列）
  │              │
  │              ├── 字母终止符 → 方向键/功能键
  │              ├── '~' 终止符 → 扩展功能键
  │              └── '<' 前缀   → SGR 鼠标事件
  │
  ├── 'O' ──→ SS3（F1-F4 旧格式）
  │
  └── 其他字符 → Alt+字符（Meta 键）
  │
  └── 超时(500ms) → 发射 Escape 键
```

### 使用方式

```typescript [parser-usage.ts]
import { InputParser } from '../src/input/input-parser';

const parser = new InputParser((event) => {
  if (event.type === 'key') {
    console.log(`Key: ${event.key}, Ctrl: ${event.ctrlKey}`);
  }
});

// 接入 stdin
process.stdin.setRawMode(true);
process.stdin.on('data', (data) => parser.feed(data));

// 清理
parser.dispose();
```

::: info ESC 超时机制
当收到单独的 ESC 字符时，解析器等待 500ms。如果后续没有更多字符到达，发射一个 Escape 键事件；如果有后续字符，作为转义序列的一部分继续解析。
:::

## 在 Widget 中处理键盘事件

键盘事件通过焦点系统路由到拥有焦点的 Widget。使用 `FocusNode.onKey` 注册处理器。

### 基本用法

```typescript [key-handler.ts]
import { FocusNode, FocusManager } from '../src/input/focus';
import type { KeyEvent, KeyEventResult } from '../src/input/events';

class MyWidgetState extends State<MyWidget> {
  private _focusNode: FocusNode | null = null;

  initState(): void {
    this._focusNode = new FocusNode({
      debugLabel: 'MyWidget',
      onKey: (event: KeyEvent): KeyEventResult => {
        // 处理按键
        if (event.key === 'Enter') {
          this.onSubmit();
          return 'handled';    // 停止冒泡
        }
        if (event.key === 'Escape') {
          this.onCancel();
          return 'handled';
        }
        return 'ignored';      // 继续冒泡到父节点
      },
    });
    FocusManager.instance.registerNode(this._focusNode, null);
    this._focusNode.requestFocus();
  }

  dispose(): void {
    this._focusNode?.dispose();
    super.dispose();
  }

  // ...
}
```

### KeyEventResult

| 值 | 含义 |
|----|------|
| `'handled'` | 事件已处理，停止冒泡 |
| `'ignored'` | 事件未处理，继续向父焦点节点冒泡 |

### 多处理器注册

一个 `FocusNode` 可以注册多个键盘处理器：

```typescript
const focusNode = new FocusNode();

// 添加多个处理器（按注册顺序执行）
focusNode.addKeyHandler((event) => {
  if (event.key === 'Escape') return 'handled';
  return 'ignored';
});

focusNode.addKeyHandler((event) => {
  if (event.ctrlKey && event.key === 's') {
    save();
    return 'handled';
  }
  return 'ignored';
});

// 移除特定处理器
focusNode.removeKeyHandler(handler);
```

### 事件处理优先级

```
KeyEvent 到达 FocusNode
     │
     ├── 1. onKey 回调（如果设置）
     │       └── 'handled' → 停止
     │
     ├── 2. keyHandlers 列表（按注册顺序）
     │       └── 某个返回 'handled' → 停止
     │
     └── 3. 全部 'ignored' → 冒泡到父节点
```

## 粘贴事件

`FocusNode` 也支持粘贴事件处理（Bracketed Paste 模式）：

```typescript
const focusNode = new FocusNode({
  onPaste: (text: string) => {
    // 处理粘贴的文本
    controller.insertText(text);
  },
});
```

::: tip Bracketed Paste
终端通过 `\x1b[?2004h` 启用 Bracketed Paste 模式。粘贴的文本被 `\x1b[200~` 和 `\x1b[201~` 包围，InputParser 会将其解析为 `PasteEvent` 而不是逐字符 KeyEvent。
:::

## 下一步

- [鼠标事件](/guide/mouse-input) — 鼠标点击、移动、滚轮处理
- [焦点管理](/guide/focus-management) — 焦点树和 Tab 遍历
- [状态管理](/guide/state-management) — 事件驱动状态更新
