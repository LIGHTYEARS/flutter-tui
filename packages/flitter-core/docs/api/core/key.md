# Key / ValueKey / UniqueKey / GlobalKey

`来源: src/core/key.ts`

Widget 的身份标识系统，用于控制 Element 树的协调（reconciliation）过程。Key 决定了在重建时 Element 是否可以被复用。

## Key（抽象基类）

所有 Widget Key 的抽象基类。

```typescript
abstract class Key {
  abstract equals(other: Key): boolean;
  abstract toString(): string;
}
```

## ValueKey\<T\>

基于值相等性的 Key。两个 `ValueKey` 如果持有相同的值，则被视为相等。

### 构造函数

```typescript
new ValueKey<T>(value: T)
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| value | `T` | Key 持有的值 |

### 方法

#### `equals(other: Key): boolean`

当 `other` 也是 `ValueKey` 且 `value === other.value` 时返回 `true`。

```typescript
new ValueKey('a').equals(new ValueKey('a')); // true
new ValueKey(1).equals(new ValueKey(2));     // false
```

## UniqueKey

基于引用标识的 Key。每个 `UniqueKey` 实例都与其他所有 Key 不同。

### 构造函数

```typescript
new UniqueKey()
```

内部使用自增 ID，但相等性完全基于对象引用 (`this === other`)。

```typescript
const k1 = new UniqueKey();
const k2 = new UniqueKey();
k1.equals(k2); // false
k1.equals(k1); // true
```

## GlobalKey

全局 Key，为 Phase 3 的占位实现。将来会提供对 `currentState` 和 `currentContext` 的访问。当前行为类似 `UniqueKey`，但使用独立的 ID 序列。

### 构造函数

```typescript
new GlobalKey()
```

## Widget.canUpdate 与 Key 的关系

```typescript
static canUpdate(oldWidget: Widget, newWidget: Widget): boolean
```

协调规则：
1. 两个 Widget 的构造函数必须相同
2. Key 必须匹配：都为 `undefined`，或都存在且 `equals()` 返回 `true`

::: tip 使用场景
- **ValueKey**: 当列表项有稳定的业务标识时使用（如 ID）
- **UniqueKey**: 强制创建新 Element，不复用旧的
- **GlobalKey**: 需要跨子树访问 State（预留）
:::

## 示例

```typescript
import { ValueKey, UniqueKey, GlobalKey } from './core/key';

// ValueKey: 基于值的标识
const items = data.map(item =>
  new ListItem({ key: new ValueKey(item.id), ...item })
);

// UniqueKey: 保证每次都是新元素
const separator = new Divider({ key: new UniqueKey() });

// GlobalKey: 全局引用（预留功能）
const formKey = new GlobalKey();
```
