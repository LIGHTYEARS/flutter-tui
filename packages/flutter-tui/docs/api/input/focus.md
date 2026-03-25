# FocusNode / FocusScopeNode / FocusManager

`来源: src/input/focus.ts`

焦点管理系统。FocusNode 构成焦点树，FocusManager 单例管理全局焦点状态，支持 Tab/Shift+Tab 遍历和键盘事件冒泡分发。

## FocusNode

焦点树中的节点。每个节点可接收键盘事件并参与焦点遍历。

### 构造函数

```typescript
new FocusNode(options?: {
  canRequestFocus?: boolean;   // 默认 true
  skipTraversal?: boolean;     // 默认 false
  onKey?: (event: KeyEvent) => KeyEventResult;
  onPaste?: (text: string) => void;
  debugLabel?: string;
})
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| parent | `FocusNode \| null` | 父节点 |
| children | `readonly FocusNode[]` | 子节点列表 |
| hasPrimaryFocus | `boolean` | 此节点是否为主焦点 |
| hasFocus | `boolean` | 此节点或任何后代是否有焦点 |
| canRequestFocus | `boolean` | 是否可请求焦点（可读写） |
| skipTraversal | `boolean` | Tab 遍历是否跳过此节点 |
| disposed | `boolean` | 是否已释放 |
| debugLabel | `string \| undefined` | 调试标签 |

### 事件处理器

| 属性 | 类型 | 说明 |
|------|------|------|
| onKey | `((event: KeyEvent) => KeyEventResult) \| null` | 键盘事件处理器 |
| onPaste | `((text: string) => void) \| null` | 粘贴事件处理器 |

### 树管理

#### `attach(parent: FocusNode): void`

将此节点作为给定父节点的子节点挂载。如果已有父节点，先 detach。

#### `detach(): void`

从父节点移除。如果持有焦点，会清除。

### 焦点管理

#### `requestFocus(): void`

请求此节点成为主焦点。清除当前焦点节点，设置新焦点，通知监听器。

#### `unfocus(): void`

取消此节点的焦点。

#### `nextFocus(): boolean`

将焦点移至遍历顺序中的下一个可聚焦节点（循环）。返回是否成功。

#### `previousFocus(): boolean`

将焦点移至上一个可聚焦节点（循环）。

### 键盘处理器注册

#### `addKeyHandler(handler): void`
#### `removeKeyHandler(handler): void`

注册/移除键盘事件处理器。

#### `handleKeyEvent(event: KeyEvent): KeyEventResult`

分发键盘事件。先调用 `onKey`，再调用注册的处理器。任一返回 `handled` 即停止。

### 监听器

#### `addListener(callback: () => void): void`
#### `removeListener(callback: () => void): void`

焦点状态变化时通知。监听器会沿树向上传播通知。

#### `dispose(): void`

释放资源。取消焦点，从树中分离，清除所有处理器和监听器。

---

## FocusScopeNode

管理其子树焦点的特殊 FocusNode。追踪作用域内当前聚焦的子节点。

```typescript
class FocusScopeNode extends FocusNode
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| focusedChild | `FocusNode \| null` | 作用域内当前聚焦的子节点 |

### 方法

#### `autofocus(node: FocusNode): void`

请求给定节点（必须是后代）获得自动焦点。

---

## FocusManager（单例）

全局焦点树管理器。

### 获取实例

```typescript
const manager = FocusManager.instance;
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| rootScope | `FocusScopeNode` | 焦点树根作用域 |
| primaryFocus | `FocusNode \| null` | 当前主焦点节点 |

### 方法

#### `registerNode(node, parent?): void`

注册节点到焦点树。`parent` 为 null 时挂载到根作用域。

#### `unregisterNode(node): void`

从焦点树移除节点。

#### `dispatchKeyEvent(event: KeyEvent): KeyEventResult`

通过焦点树分发键盘事件。从主焦点节点开始，向上冒泡直到处理或到达根节点。

#### `dispatchPasteEvent(text: string): void`

向聚焦节点分发粘贴事件。从主焦点向上查找有 `onPaste` 处理器的节点。

#### `getTraversableNodes(): FocusNode[]`

收集所有可遍历节点（DFS 顺序）。条件：`canRequestFocus && !skipTraversal`。

#### `FocusManager.reset(): void`

重置单例（用于测试）。

## 示例

```typescript
import { FocusNode, FocusScopeNode, FocusManager } from './input/focus';

// 创建焦点节点
const inputFocus = new FocusNode({
  debugLabel: 'text-input',
  onKey: (event) => {
    if (event.key === 'Enter') {
      // 处理回车
      return 'handled';
    }
    return 'ignored';
  },
});

// 注册到焦点树
FocusManager.instance.registerNode(inputFocus, null);

// 请求焦点
inputFocus.requestFocus();

// Tab 导航
inputFocus.nextFocus();     // 下一个
inputFocus.previousFocus(); // 上一个

// 清理
inputFocus.dispose();
```
