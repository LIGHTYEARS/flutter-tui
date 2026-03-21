# Color

`来源: src/core/color.ts`

终端颜色类型，支持三种颜色模式：Named（16色）、Ansi256（256色）和 TrueColor（RGB）。不可变值类型，能生成 SGR 转义序列参数。

## 颜色模式

```typescript
type ColorMode = 'named' | 'ansi256' | 'rgb';
```

| 模式 | 说明 | 值范围 |
|------|------|--------|
| `named` | 标准 16 色 | 0-15（-1 表示默认） |
| `ansi256` | 256 色调色板 | 0-255 |
| `rgb` | 真彩色 | `(r << 16 \| g << 8 \| b)` |

## 构造函数

Color 使用私有构造函数，必须通过工厂方法或静态常量创建实例。

## 静态颜色常量

### 标准色（0-7）

| 常量 | 索引 |
|------|------|
| `Color.black` | 0 |
| `Color.red` | 1 |
| `Color.green` | 2 |
| `Color.yellow` | 3 |
| `Color.blue` | 4 |
| `Color.magenta` | 5 |
| `Color.cyan` | 6 |
| `Color.white` | 7 |

### 亮色（8-15）

| 常量 | 索引 |
|------|------|
| `Color.brightBlack` | 8 |
| `Color.brightRed` | 9 |
| `Color.brightGreen` | 10 |
| `Color.brightYellow` | 11 |
| `Color.brightBlue` | 12 |
| `Color.brightMagenta` | 13 |
| `Color.brightCyan` | 14 |
| `Color.brightWhite` | 15 |

### 特殊值

| 常量 | 说明 |
|------|------|
| `Color.defaultColor` | 未设置颜色，使用终端默认色 |

## 工厂方法

### `Color.named(index: number): Color`

通过索引（0-15）创建命名色。超出范围抛出 `RangeError`。

### `Color.ansi256(index: number): Color`

通过索引（0-255）创建 256 色。超出范围抛出 `RangeError`。

### `Color.rgb(r: number, g: number, b: number): Color`

创建真彩色 RGB 颜色。值自动 clamp 到 0-255 并取整。

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| mode | `ColorMode` | 颜色模式 |
| value | `number` | 编码后的颜色值 |
| r | `number` | 红色分量（仅 RGB 模式可用） |
| g | `number` | 绿色分量（仅 RGB 模式可用） |
| b | `number` | 蓝色分量（仅 RGB 模式可用） |

::: warning
在非 RGB 模式下访问 `r`、`g`、`b` 属性会抛出错误。
:::

## 方法

### `toSgrFg(): string`

返回前景色的 SGR 参数字符串。

### `toSgrBg(): string`

返回背景色的 SGR 参数字符串。

### `toAnsi256(): Color`

转换为最近的 256 色。RGB 颜色通过最近邻匹配查找。

### `toRgb(): Color`

转换为 RGB 颜色。使用标准 256 色查找表。

### `equals(other: Color): boolean`

比较两个颜色是否相等。

## 示例

```typescript
import { Color } from './core/color';

// 使用静态常量
const red = Color.red;
const brightCyan = Color.brightCyan;

// 使用工厂方法
const ansi = Color.ansi256(196);
const rgb = Color.rgb(255, 128, 0);

// 生成 SGR 序列
red.toSgrFg();    // "31"
rgb.toSgrFg();    // "38;2;255;128;0"
ansi.toSgrBg();   // "48;5;196"

// 颜色转换
rgb.toAnsi256();  // 最近的 256 色
Color.red.toRgb(); // Color(rgb:128,0,0)
```
