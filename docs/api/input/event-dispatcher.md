# EventDispatcher

`来源: src/input/event-dispatcher.ts`

单例事件分发管线。将解析后的 InputEvent 路由到适当的处理器。支持键盘拦截器（全局快捷键）、焦点系统集成和鼠标全局释放回调。

## 构造函数

EventDispatcher 是单例，不能直接构造。

```typescript
const dispatcher = EventDispatcher.instance;
```

## 处理器类型

```typescript
type KeyHandler = (event: KeyEvent) => KeyEventResult;
type MouseHandler = (event: MouseEvent) => void;
type ResizeHandler = (width: number, height: number) => void;
```

## 事件分发流程

### 键盘事件 (`'key'`)

```
1. 键盘拦截器（全局快捷键，如 Ctrl+C）
   -> 任一返回 "handled" 则停止
2. FocusManager 分发（焦点系统路由 + 冒泡）
   -> 返回 "handled" 则停止
3. 注册的键盘处理器
   -> 任一返回 "handled" 则停止
```

### 鼠标事件 (`'mouse'`)

```
1. 释放事件 -> 触发全局释放回调（用于拖拽操作）
2. 注册的鼠标处理器
```

### 其他事件

- `'resize'`: 调用注册的 resize 处理器
- `'paste'`: 先尝试 FocusManager 分发，再调用注册的粘贴处理器
- `'focus'`: 调用注册的焦点处理器

## 方法

### 主分发方法

#### `dispatch(event: InputEvent): void`

根据事件类型路由到对应的分发方法。

#### `dispatchKeyEvent(event: KeyEvent): KeyEventResult`

完整的键盘事件分发管线（拦截器 -> 焦点 -> 处理器）。

#### `dispatchMouseEvent(event: MouseEvent): void`

鼠标事件分发（释放回调 -> 处理器）。

#### `dispatchResizeEvent(event: ResizeEvent): void`

调用所有 resize 处理器。

#### `dispatchPasteEvent(event: PasteEvent): void`

粘贴事件分发（焦点系统 -> 后备处理器）。

#### `dispatchFocusEvent(event: FocusEvent): void`

终端焦点/失焦事件分发。

### 处理器注册

| 注册 | 移除 | 说明 |
|------|------|------|
| `addKeyHandler(h)` | `removeKeyHandler(h)` | 键盘处理器 |
| `addKeyInterceptor(h)` | `removeKeyInterceptor(h)` | 键盘拦截器（优先于焦点） |
| `addMouseHandler(h)` | `removeMouseHandler(h)` | 鼠标处理器 |
| `addResizeHandler(h)` | `removeResizeHandler(h)` | Resize 处理器 |
| `addGlobalReleaseCallback(h)` | `removeGlobalReleaseCallback(h)` | 全局鼠标释放回调 |
| `addFocusHandler(h)` | `removeFocusHandler(h)` | 终端焦点处理器 |
| `addPasteHandler(h)` | `removePasteHandler(h)` | 粘贴处理器（后备） |

### 静态方法

#### `EventDispatcher.reset(): void`

重置单例（用于测试）。清除所有处理器。

## 示例

```typescript
import { EventDispatcher } from './input/event-dispatcher';
import { createKeyEvent, createMouseEvent } from './input/events';

const dispatcher = EventDispatcher.instance;

// 注册全局快捷键拦截器
dispatcher.addKeyInterceptor((event) => {
  if (event.ctrlKey && event.key === 'c') {
    process.exit(0);
    return 'handled';
  }
  return 'ignored';
});

// 注册鼠标处理器
dispatcher.addMouseHandler((event) => {
  if (event.action === 'press') {
    console.log(`点击: (${event.x}, ${event.y})`);
  }
});

// 注册 resize 处理器
dispatcher.addResizeHandler((width, height) => {
  binding.handleResize(width, height);
});

// 分发事件
dispatcher.dispatch(createKeyEvent('Enter'));
dispatcher.dispatch(createMouseEvent('press', 0, 10, 5));
```

::: tip 拦截器 vs 处理器
键盘拦截器在焦点系统之前运行，适合全局快捷键（如 Ctrl+C 退出）。普通键盘处理器在焦点系统之后运行，作为后备。
:::
