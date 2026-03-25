# ScreenBuffer

`来源: src/terminal/screen-buffer.ts`

双缓冲屏幕抽象。Widget 绘制到后缓冲区（back buffer），diff 计算后交换缓冲区。

## Buffer（内部类）

单个单元格网格，使用行优先的扁平数组：`index = y * width + x`。

### 构造函数

```typescript
new Buffer(width: number, height: number)
```

### 方法

| 方法 | 说明 |
|------|------|
| `getCell(x, y)` | 获取 (x, y) 处的单元格。越界返回 EMPTY_CELL |
| `setCell(x, y, cell)` | 设置单元格。处理宽字符（CJK）的后续列标记 |
| `clear()` | 用 EMPTY_CELL 填充所有单元格 |
| `resize(w, h)` | 调整大小，保留已有内容 |
| `getCells()` | 获取底层单元格数组（用于 diff） |

---

## ScreenBuffer

### 构造函数

```typescript
new ScreenBuffer(width?: number, height?: number)
// 默认: 80 x 24
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| width | `number` | 宽度 |
| height | `number` | 高度 |
| needsFullRefresh | `boolean` | 是否需要全量刷新 |
| cursorPosition | `{x, y} \| null` | 光标位置 |
| cursorVisible | `boolean` | 光标是否可见 |
| cursorShape | `number` | 光标形状 (DECSCUSR 0-6) |
| requiresFullRefresh | `boolean` | 只读的全量刷新标记 |

### 缓冲区访问

| 方法 | 说明 |
|------|------|
| `getBuffer()` | 获取后缓冲区（可写表面） |
| `getFrontBuffer()` | 获取前缓冲区（已提交的帧） |
| `getBackBuffer()` | 获取后缓冲区（别名） |
| `getCell(x, y)` | 从后缓冲区读取单元格 |
| `getSize()` | 返回 `{ width, height }` |

### 写入方法

#### `setCell(x: number, y: number, cell: Cell): void`

在后缓冲区设置单元格。

#### `setChar(x, y, char, style?, width?): void`

便捷方法：设置字符、样式和宽度。

#### `clear(): void`

清空后缓冲区。

#### `fill(x, y, w, h, char?, style?): void`

用指定字符和样式填充矩形区域。

#### `resize(width, height): void`

调整两个缓冲区的大小，标记全量刷新。

### 光标方法

| 方法 | 说明 |
|------|------|
| `setCursor(x, y)` | 设置光标位置并显示 |
| `setCursorPositionHint(x, y)` | 设置位置但不改变可见性 |
| `clearCursor()` | 隐藏并清除光标位置 |
| `setCursorShape(shape)` | 设置光标形状 (0-6) |

### 缓冲区交换

#### `present(): void`

交换前后缓冲区（经典双缓冲交换）。旧的前缓冲区变为新的后缓冲区并被清空，为下一帧做准备。

### Diff 计算

#### `getDiff(): RowPatch[]`

计算前后缓冲区之间的差异。返回仅包含变化行的 `RowPatch[]`，每行包含连续变化单元格的区段。

```typescript
interface RowPatch {
  row: number;
  patches: CellPatch[];
}

interface CellPatch {
  col: number;
  cells: Cell[];
}
```

**两种路径：**
- **全量刷新**: `needsFullRefresh` 为 true 时，输出所有后缓冲区单元格
- **增量 diff**: 逐单元格比较，使用 `===` 对 EMPTY_CELL 做快速路径跳过

#### `markForRefresh(): void`

强制下次 `getDiff()` 执行全量刷新。

## 示例

```typescript
import { ScreenBuffer } from './terminal/screen-buffer';

const screen = new ScreenBuffer(80, 24);

// 绘制到后缓冲区
screen.setChar(0, 0, 'H');
screen.setChar(1, 0, 'i');
screen.fill(0, 1, 80, 1, '-');

// 计算 diff
const patches = screen.getDiff();

// 交换缓冲区（提交帧）
screen.present();

// Resize
screen.resize(120, 40);
```
