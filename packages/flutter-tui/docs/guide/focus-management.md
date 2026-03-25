# 焦点管理

焦点系统决定了键盘事件被路由到哪个 Widget。Flutter-TUI 实现了完整的焦点树，支持 Tab/Shift+Tab 遍历、事件冒泡和焦点作用域。

## 核心概念

```
                FocusManager (全局单例)
                     │
                     │ 管理焦点树和 primaryFocus
                     │
              FocusScopeNode (作用域)
              ┌──────┼──────┐
              │      │      │
         FocusNode  FocusNode  FocusNode
         (Button)   (Input)    (List)
                       ↑
                  primaryFocus
```

| 概念 | 说明 |
|------|------|
| `FocusNode` | 焦点树中的一个节点，可以接收键盘事件 |
| `FocusScopeNode` | 焦点作用域，管理其子节点中的焦点 |
| `FocusManager` | 全局单例，追踪 primaryFocus 和焦点遍历 |
| `primaryFocus` | 当前持有焦点的唯一节点 |

## FocusNode

`FocusNode` 是焦点树的基本单元。

### 创建

```typescript
import { FocusNode } from '../src/input/focus';
import type { KeyEvent, KeyEventResult } from '../src/input/events';

const focusNode = new FocusNode({
  canRequestFocus: true,   // 是否允许获取焦点
  skipTraversal: false,    // 是否跳过 Tab 遍历
  debugLabel: 'MyInput',   // 调试标签
  onKey: (event: KeyEvent): KeyEventResult => {
    // 处理键盘事件
    return 'ignored';
  },
  onPaste: (text: string) => {
    // 处理粘贴文本
  },
});
```

### 构造选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|-------|------|
| `canRequestFocus` | `boolean` | `true` | 是否可获取焦点 |
| `skipTraversal` | `boolean` | `false` | Tab 遍历时是否跳过 |
| `onKey` | `function` | `null` | 键盘事件处理器 |
| `onPaste` | `function` | `null` | 粘贴事件处理器 |
| `debugLabel` | `string` | `undefined` | 调试标签 |

### 焦点状态

```typescript
// 仅当此节点本身是 primaryFocus
focusNode.hasPrimaryFocus  // boolean

// 此节点或其任意后代是 primaryFocus
focusNode.hasFocus         // boolean

// 是否可以请求焦点
focusNode.canRequestFocus  // boolean

// 是否已销毁
focusNode.disposed         // boolean
```

::: info hasFocus vs hasPrimaryFocus
`hasFocus` 在祖先节点上也返回 `true`（只要后代有焦点）。`hasPrimaryFocus` 只在唯一的焦点持有者上返回 `true`。
:::

## 焦点树管理

### 挂载和分离

```typescript
const parent = new FocusNode({ debugLabel: 'Parent' });
const child = new FocusNode({ debugLabel: 'Child' });

// 挂载：child 成为 parent 的子节点
child.attach(parent);

// 分离：从父节点移除
child.detach();
```

### 请求焦点

```typescript
// 请求焦点（会自动取消之前的 primaryFocus）
focusNode.requestFocus();

// 取消焦点
focusNode.unfocus();
```

### 监听焦点变化

```typescript
const focusNode = new FocusNode();

// 当焦点状态变化时触发
focusNode.addListener(() => {
  if (focusNode.hasPrimaryFocus) {
    // 获得焦点
    highlightWidget();
  } else {
    // 失去焦点
    unhighlightWidget();
  }
});

// 移除监听
focusNode.removeListener(listener);
```

## FocusScopeNode

`FocusScopeNode` 是 `FocusNode` 的扩展，管理一组子节点的焦点行为。

```typescript
import { FocusScopeNode } from '../src/input/focus';

const scope = new FocusScopeNode({
  debugLabel: 'FormScope',
});

// 子节点挂载到作用域
inputNode1.attach(scope);
inputNode2.attach(scope);
inputNode3.attach(scope);
```

### 作用域焦点跟踪

`FocusScopeNode` 记录其子树中最近获得焦点的节点：

```typescript
// 获取作用域内最近的焦点节点
scope.focusedChild  // FocusNode | null
```

当焦点从作用域外返回时，可以恢复到之前的焦点位置。

## FocusManager

`FocusManager` 是全局单例，管理整个焦点树。

```typescript
import { FocusManager } from '../src/input/focus';

const manager = FocusManager.instance;

// 当前持有焦点的节点
manager.primaryFocus  // FocusNode | null

// 注册节点到焦点树
manager.registerNode(node, parentNode);

// 获取可遍历的节点列表
manager.getTraversableNodes();  // FocusNode[]
```

### 注册焦点节点

```typescript
initState(): void {
  this._focusNode = new FocusNode({ debugLabel: 'MyWidget' });

  // 注册到焦点管理器（parentNode 为 null 表示挂在根下）
  FocusManager.instance.registerNode(this._focusNode, null);

  // 请求焦点
  this._focusNode.requestFocus();
}
```

## 焦点遍历

Tab / Shift+Tab 在可焦点节点之间循环遍历。

### 遍历规则

1. 收集所有 `canRequestFocus === true` 且 `skipTraversal === false` 的节点
2. 按注册/挂载顺序排列
3. Tab 键移到下一个，Shift+Tab 移到上一个
4. 到达末尾/开头时循环

```typescript
// 移到下一个焦点节点
focusNode.nextFocus();      // Tab

// 移到上一个焦点节点
focusNode.previousFocus();  // Shift+Tab
```

### 跳过遍历

某些节点不需要参与 Tab 遍历（如容器、装饰性元素）：

```typescript
const decorativeNode = new FocusNode({
  skipTraversal: true,   // Tab 遍历时跳过
  debugLabel: 'Decorator',
});
```

### 禁用焦点

```typescript
const disabledNode = new FocusNode({
  canRequestFocus: false,  // 无法获取焦点
});

// 运行时动态禁用
focusNode.canRequestFocus = false;
// 如果当前持有焦点，自动 unfocus
```

## 事件冒泡

当拥有焦点的节点收到键盘事件时，事件按以下路径分发：

```
KeyEvent 到达
     │
     ▼
primaryFocus.handleKeyEvent(event)
     │
     ├── onKey() → 'handled' → 停止
     ├── keyHandlers → 'handled' → 停止
     │
     └── 'ignored' → 冒泡到 parent
              │
              ▼
         parent.handleKeyEvent(event)
              │
              ├── 'handled' → 停止
              └── 'ignored' → 继续冒泡到更上层
                    ...
                    直到根节点
```

### 冒泡示例

```typescript [bubble-example.ts]
// 表单作用域处理 Escape 退出
const formScope = new FocusScopeNode({
  debugLabel: 'Form',
  onKey: (event: KeyEvent): KeyEventResult => {
    if (event.key === 'Escape') {
      closeForm();
      return 'handled';  // 阻止冒泡
    }
    return 'ignored';     // 让子节点的事件继续冒泡
  },
});

// 输入框处理字符输入
const inputNode = new FocusNode({
  debugLabel: 'NameInput',
  onKey: (event: KeyEvent): KeyEventResult => {
    if (event.key.length === 1 && !event.ctrlKey) {
      appendChar(event.key);
      return 'handled';  // 字符输入不冒泡
    }
    return 'ignored';     // 其他按键冒泡到 formScope
  },
});

inputNode.attach(formScope);
```

::: tip 事件冒泡的典型用法
- 子组件处理自身关心的按键，返回 `'handled'`
- 子组件不关心的按键返回 `'ignored'`，冒泡到父作用域
- 父作用域处理全局快捷键（如 Escape 关闭、Ctrl+S 保存）
:::

## 在 Widget 中使用焦点

### 焦点节点生命周期

| 阶段 | 操作 |
|------|------|
| `initState()` | 创建 FocusNode，注册到 FocusManager，可选 requestFocus |
| `build()` | 读取 `hasPrimaryFocus` 状态决定外观 |
| `dispose()` | 移除监听器，调用 `focusNode.dispose()` |

::: warning 必须在 dispose 中清理
忘记调用 `focusNode.dispose()` 会导致焦点树中出现悬挂引用，可能引发事件分发异常。
:::

## 下一步

- [键盘事件](/guide/keyboard-input) — 键盘事件详解
- [鼠标事件](/guide/mouse-input) — 鼠标交互和命中测试
- [Widget 生命周期](/guide/widget-lifecycle) — 管理焦点节点的完整生命周期
