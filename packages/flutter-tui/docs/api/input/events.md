# InputEvent

`来源: src/input/events.ts`

终端输入事件的类型定义。使用可辨识联合（discriminated union），通过 `type` 字段区分事件类型。

## InputEvent 联合类型

```typescript
type InputEvent = KeyEvent | MouseEvent | ResizeEvent | FocusEvent | PasteEvent;
```

---

## KeyEvent

键盘事件，来自转义序列解析器。

```typescript
interface KeyEvent {
  readonly type: 'key';
  readonly key: string;          // 逻辑键名: "ArrowUp", "Enter", "a", "Escape", "f1" 等
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
  readonly metaKey: boolean;
  readonly sequence?: string;    // 产生此事件的原始转义序列
}
```

### 工厂函数

```typescript
createKeyEvent(key: string, options?: {
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  sequence?: string;
}): KeyEvent
```

---

## MouseEvent

SGR 鼠标协议事件。

```typescript
interface MouseEvent {
  readonly type: 'mouse';
  readonly action: 'press' | 'release' | 'move' | 'scroll';
  readonly button: number;   // 0=左, 1=中, 2=右, 64=上滚, 65=下滚
  readonly x: number;        // 列（0-based）
  readonly y: number;        // 行（0-based）
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
}
```

### 工厂函数

```typescript
createMouseEvent(
  action: 'press' | 'release' | 'move' | 'scroll',
  button: number,
  x: number,
  y: number,
  options?: { ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean }
): MouseEvent
```

---

## ResizeEvent

终端窗口大小变化事件 (SIGWINCH)。

```typescript
interface ResizeEvent {
  readonly type: 'resize';
  readonly width: number;
  readonly height: number;
}
```

### 工厂函数

```typescript
createResizeEvent(width: number, height: number): ResizeEvent
```

---

## FocusEvent

终端焦点追踪事件。

```typescript
interface FocusEvent {
  readonly type: 'focus';
  readonly focused: boolean;
}
```

### 工厂函数

```typescript
createFocusEvent(focused: boolean): FocusEvent
```

---

## PasteEvent

括号粘贴事件。

```typescript
interface PasteEvent {
  readonly type: 'paste';
  readonly text: string;
}
```

### 工厂函数

```typescript
createPasteEvent(text: string): PasteEvent
```

---

## KeyEventResult

```typescript
type KeyEventResult = 'handled' | 'ignored';
```

键盘事件处理结果。`handled` 停止冒泡，`ignored` 继续向上传播。

## 示例

```typescript
import {
  createKeyEvent,
  createMouseEvent,
  type InputEvent,
} from './input/events';

// 创建键盘事件
const enterKey = createKeyEvent('Enter');
const ctrlC = createKeyEvent('c', { ctrlKey: true });
const arrowUp = createKeyEvent('ArrowUp', { shiftKey: true });

// 创建鼠标事件
const click = createMouseEvent('press', 0, 10, 5);
const scroll = createMouseEvent('scroll', 64, 10, 5);

// 使用可辨识联合进行类型收窄
function handleEvent(event: InputEvent) {
  switch (event.type) {
    case 'key':
      console.log(`按键: ${event.key}, Ctrl: ${event.ctrlKey}`);
      break;
    case 'mouse':
      console.log(`鼠标: ${event.action} at (${event.x}, ${event.y})`);
      break;
    case 'resize':
      console.log(`窗口大小: ${event.width}x${event.height}`);
      break;
  }
}
```
