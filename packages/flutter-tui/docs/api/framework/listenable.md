# Listenable / ChangeNotifier / ValueNotifier

`来源: src/framework/listenable.ts`

核心响应式原语。提供观察者模式的实现，用于数据变化通知。

## Listenable（接口）

维护监听器列表的对象的基础接口。

```typescript
interface Listenable {
  addListener(callback: () => void): void;
  removeListener(callback: () => void): void;
}
```

---

## ChangeNotifier

可被继承或混入以提供变更通知的类。内部使用 `Set<>` 存储监听器，确保 O(1) 的添加/移除性能。

### 构造函数

```typescript
new ChangeNotifier()
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| hasListeners | `boolean` | 是否有注册的监听器 |

### 方法

#### `addListener(callback: () => void): void`

注册变更回调。在已 dispose 后调用会抛出错误。

#### `removeListener(callback: () => void): void`

移除已注册的回调。已 dispose 后静默忽略（与 Flutter 行为一致）。

#### `protected notifyListeners(): void`

通知所有注册的监听器。在通知过程中移除自身是安全的（通过快照机制）。

::: tip 安全迭代
`notifyListeners()` 先对监听器集合做快照，再迭代通知。因此即使某个监听器在回调中移除自身或其他监听器，也不会影响当前轮次。
:::

#### `dispose(): void`

释放所有资源。清空监听器列表，之后 `notifyListeners()` 变为空操作，`addListener()` 抛出错误。

---

## ValueNotifier\<T\>

持有单个值并在值变化时通知监听器的 ChangeNotifier。使用严格不等式 (`!==`) 检测变化。

### 构造函数

```typescript
new ValueNotifier<T>(value: T)
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| value | `T` | 当前值（可读写） |

设置新值时，如果与当前值不同（`!==`），自动通知所有监听器。

```typescript
const counter = new ValueNotifier(0);

counter.addListener(() => {
  console.log(`值变为: ${counter.value}`);
});

counter.value = 1;  // 触发通知: "值变为: 1"
counter.value = 1;  // 不触发（值未变）
counter.value = 2;  // 触发通知: "值变为: 2"
```

## 示例

```typescript
import { ChangeNotifier, ValueNotifier } from './framework/listenable';

// 自定义 ChangeNotifier
class TodoList extends ChangeNotifier {
  private _items: string[] = [];

  get items(): readonly string[] { return this._items; }

  add(item: string) {
    this._items.push(item);
    this.notifyListeners();
  }

  remove(index: number) {
    this._items.splice(index, 1);
    this.notifyListeners();
  }
}

// ValueNotifier 用于简单状态
const theme = new ValueNotifier<'light' | 'dark'>('dark');
theme.addListener(() => {
  // 主题切换时重新渲染
  binding.requestForcedPaintFrame();
});
theme.value = 'light'; // 触发通知

// 清理
theme.dispose();
```

::: warning
`dispose()` 后：
- `addListener()` 抛出错误
- `removeListener()` 静默忽略
- `notifyListeners()` 空操作
- `value` 的 setter 仍可用但不会通知
:::
