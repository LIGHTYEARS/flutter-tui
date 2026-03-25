# BoxConstraints

`来源: src/core/box-constraints.ts`

不可变的盒模型布局约束。用于 RenderBox 布局系统，定义子元素的最小和最大尺寸。所有数值为整数，但 `Infinity` 会被保留。

## 构造函数

```typescript
new BoxConstraints(opts?: {
  minWidth?: number;   // 默认 0
  minHeight?: number;  // 默认 0
  maxWidth?: number;   // 默认 Infinity
  maxHeight?: number;  // 默认 Infinity
})
```

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| minWidth | `number` | 最小宽度 |
| minHeight | `number` | 最小高度 |
| maxWidth | `number` | 最大宽度 |
| maxHeight | `number` | 最大高度 |

### 查询属性

| 属性 | 类型 | 说明 |
|------|------|------|
| isTight | `boolean` | min 与 max 在两个轴上都相等 |
| hasBoundedWidth | `boolean` | maxWidth 是有限值 |
| hasBoundedHeight | `boolean` | maxHeight 是有限值 |
| isNormalized | `boolean` | min <= max 在两个轴上都成立 |
| biggest | `Size` | 满足约束的最大尺寸 |
| smallest | `Size` | 满足约束的最小尺寸 |

## 静态工厂方法

### `BoxConstraints.tight(size: Size): BoxConstraints`

创建严格约束，min 和 max 在两个轴上都等于给定尺寸。只允许一种尺寸。

```typescript
const c = BoxConstraints.tight(new Size(80, 24));
c.isTight; // true
```

### `BoxConstraints.tightFor(opts?): BoxConstraints`

仅在指定轴上创建严格约束。未指定的轴保持默认（min=0, max=Infinity）。

```typescript
BoxConstraints.tightFor({ width: 40 });
// minWidth=40, maxWidth=40, minHeight=0, maxHeight=Infinity
```

### `BoxConstraints.loose(size: Size): BoxConstraints`

创建松散约束：min=0, max=给定尺寸。允许从 0 到 size 的任意尺寸。

## 方法

### `loosen(): BoxConstraints`

返回新约束，保留 max 值但将 min 设为 0。

### `constrain(size: Size): Size`

将尺寸 clamp 到此约束范围内。

```typescript
const c = new BoxConstraints({ minWidth: 10, maxWidth: 50 });
c.constrain(new Size(100, 5)); // Size(50, 5)
c.constrain(new Size(3, 5));   // Size(10, 5)
```

### `enforce(constraints: BoxConstraints): BoxConstraints`

通过交集生成更严格的约束。结果的 min 被提高，max 被降低，以同时满足两组约束。

### `deflate(edges): BoxConstraints`

按边距缩小约束（例如用于 Padding 布局）。

```typescript
deflate(edges: { left: number; top: number; right: number; bottom: number }): BoxConstraints
```

### `equals(other: BoxConstraints): boolean`

比较两组约束是否相等。

## 示例

```typescript
import { BoxConstraints } from './core/box-constraints';
import { Size } from './core/types';

// 终端大小的严格约束
const terminalConstraints = BoxConstraints.tight(new Size(80, 24));

// 允许子元素自由确定高度
const flexHeight = new BoxConstraints({
  minWidth: 80,
  maxWidth: 80,
  minHeight: 0,
  maxHeight: Infinity,
});

// Padding 场景：缩小约束
const padded = terminalConstraints.deflate({
  left: 2, top: 1, right: 2, bottom: 1,
});
// minWidth=76, maxWidth=76, minHeight=22, maxHeight=22
```

::: tip
`Infinity` 值会被保留而不会被取整。其他数值通过 `Math.round` 取整为整数。
:::
