# Offset / Size / Rect

`来源: src/core/types.ts`

核心值类型，用于终端单元格坐标系统。所有坐标均为整数（通过 `Math.round` 取整）。这些类型是不可变的值类型。

## Offset

表示终端单元格坐标系中的二维位置（列, 行）。

### 构造函数

```typescript
new Offset(col: number, row: number)
```

参数会自动通过 `Math.round` 取整为整数。

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| col | `number` | 列坐标（只读） |
| row | `number` | 行坐标（只读） |

### 静态属性

| 属性 | 类型 | 说明 |
|------|------|------|
| zero | `Offset` | 原点 `Offset(0, 0)` |

### 方法

#### `add(other: Offset): Offset`

返回两个偏移量的加法结果。

#### `subtract(other: Offset): Offset`

返回两个偏移量的减法结果。

#### `equals(other: Offset): boolean`

比较两个偏移量是否相等。

#### `toString(): string`

返回格式化字符串，例如 `Offset(3, 5)`。

---

## Size

表示终端单元格尺寸（宽度, 高度）。

### 构造函数

```typescript
new Size(width: number, height: number)
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| width | `number` | 宽度（只读） |
| height | `number` | 高度（只读） |

### 静态属性

| 属性 | 类型 | 说明 |
|------|------|------|
| zero | `Size` | 零尺寸 `Size(0, 0)` |

### 方法

#### `contains(offset: Offset): boolean`

判断给定的偏移量是否在此尺寸的范围内。条件：`0 <= col < width && 0 <= row < height`。

#### `equals(other: Size): boolean`

比较两个尺寸是否相等。

---

## Rect

表示终端单元格坐标系中的矩形区域，由 `(left, top, width, height)` 定义。

### 构造函数

```typescript
new Rect(left: number, top: number, width: number, height: number)
```

### 静态方法

#### `Rect.fromLTRB(left, top, right, bottom): Rect`

通过左、上、右、下坐标创建矩形。

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| left | `number` | 左边界（只读） |
| top | `number` | 上边界（只读） |
| width | `number` | 宽度（只读） |
| height | `number` | 高度（只读） |
| right | `number` | 右边界（计算属性） |
| bottom | `number` | 下边界（计算属性） |
| size | `Size` | 矩形的尺寸 |
| topLeft | `Offset` | 左上角坐标 |
| bottomRight | `Offset` | 右下角坐标 |

### 静态属性

| 属性 | 类型 | 说明 |
|------|------|------|
| zero | `Rect` | 零矩形 `Rect(0, 0, 0, 0)` |

### 方法

#### `contains(offset: Offset): boolean`

判断给定偏移量是否在矩形内部。

#### `intersect(other: Rect): Rect`

计算两个矩形的交集。如果不重叠，返回零面积矩形。

#### `equals(other: Rect): boolean`

比较两个矩形是否相等。

## 示例

```typescript
import { Offset, Size, Rect } from './core/types';

const pos = new Offset(10, 5);
const moved = pos.add(new Offset(3, 2)); // Offset(13, 7)

const size = new Size(80, 24);
size.contains(new Offset(79, 23)); // true
size.contains(new Offset(80, 24)); // false

const rect = Rect.fromLTRB(5, 5, 20, 15);
rect.width;  // 15
rect.height; // 10
rect.contains(new Offset(10, 10)); // true
```

::: tip
所有值会自动取整为整数，确保终端单元格对齐。传入浮点数会被 `Math.round` 处理。
:::
