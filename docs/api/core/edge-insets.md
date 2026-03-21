# EdgeInsets

`来源: src/layout/edge-insets.ts`

不可变的边距值集合，用于 Padding、Margin 等布局场景。所有值通过 `Math.round` 取整为整数。

## 构造函数

```typescript
new EdgeInsets(left: number, top: number, right: number, bottom: number)
```

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| left | `number` | 左边距 |
| top | `number` | 上边距 |
| right | `number` | 右边距 |
| bottom | `number` | 下边距 |

### 计算属性

| 属性 | 类型 | 说明 |
|------|------|------|
| totalHorizontal | `number` | `left + right` |
| horizontal | `number` | `left + right`（别名） |
| totalVertical | `number` | `top + bottom` |
| vertical | `number` | `top + bottom`（别名） |

## 静态工厂方法

### `EdgeInsets.zero`

零边距常量 `EdgeInsets(0, 0, 0, 0)`。

### `EdgeInsets.all(value: number): EdgeInsets`

四个方向设置相同的值。

```typescript
EdgeInsets.all(2); // EdgeInsets(2, 2, 2, 2)
```

### `EdgeInsets.symmetric(opts?): EdgeInsets`

对称边距。`horizontal` 应用于左右，`vertical` 应用于上下。

```typescript
EdgeInsets.symmetric({ horizontal: 4, vertical: 1 });
// EdgeInsets(4, 1, 4, 1)
```

### `EdgeInsets.horizontal(value: number): EdgeInsets`

仅设置水平方向（左右），上下为 0。

```typescript
EdgeInsets.horizontal(3); // EdgeInsets(3, 0, 3, 0)
```

### `EdgeInsets.vertical(value: number): EdgeInsets`

仅设置垂直方向（上下），左右为 0。

```typescript
EdgeInsets.vertical(1); // EdgeInsets(0, 1, 0, 1)
```

### `EdgeInsets.only(opts?): EdgeInsets`

单独设置各边，省略的边默认为 0。

```typescript
EdgeInsets.only({ left: 2, bottom: 1 });
// EdgeInsets(2, 0, 0, 1)
```

## 方法

### `equals(other: EdgeInsets): boolean`

比较两个边距是否完全相等。

### `toString(): string`

格式化输出。如果所有边相同输出 `EdgeInsets.all(N)`，对称时输出 `EdgeInsets.symmetric(...)`，否则输出完整值。

## 示例

```typescript
import { EdgeInsets } from './layout/edge-insets';

// Padding 场景
const padding = EdgeInsets.symmetric({ horizontal: 2, vertical: 1 });
padding.totalHorizontal; // 4
padding.totalVertical;   // 2

// 仅底部边距
const bottomMargin = EdgeInsets.only({ bottom: 2 });

// 搭配 BoxConstraints.deflate 使用
const innerConstraints = constraints.deflate({
  left: padding.left,
  top: padding.top,
  right: padding.right,
  bottom: padding.bottom,
});
```
