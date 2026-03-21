# TextStyle

`来源: src/core/text-style.ts`

不可变的文本样式描述符，用于终端文本渲染。支持前景色、背景色以及各种文本装饰属性。

## 构造函数

```typescript
new TextStyle(opts?: {
  foreground?: Color;
  background?: Color;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  inverse?: boolean;
  hidden?: boolean;
})
```

所有属性均为可选。`undefined` 表示「未设置」，与 `false`（显式关闭）不同。

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| foreground | `Color \| undefined` | 前景色 |
| background | `Color \| undefined` | 背景色 |
| bold | `boolean \| undefined` | 粗体 |
| dim | `boolean \| undefined` | 暗淡 |
| italic | `boolean \| undefined` | 斜体 |
| underline | `boolean \| undefined` | 下划线 |
| strikethrough | `boolean \| undefined` | 删除线 |
| inverse | `boolean \| undefined` | 反色 |
| hidden | `boolean \| undefined` | 隐藏 |
| isEmpty | `boolean` | 所有属性是否都为 `undefined` |

## 方法

### `merge(other: TextStyle): TextStyle`

合并两个样式，`other` 中已定义的字段覆盖 `this` 中的对应字段。`other` 中为 `undefined` 的字段保留 `this` 的值。

```typescript
const base = new TextStyle({ bold: true, foreground: Color.red });
const overlay = new TextStyle({ foreground: Color.blue, italic: true });
const merged = base.merge(overlay);
// 结果: { bold: true, foreground: Color.blue, italic: true }
```

### `toSgr(): string`

生成 SGR 参数字符串。仅包含已显式设置（非 `undefined`）的属性。

```typescript
const style = new TextStyle({ bold: true, foreground: Color.red });
style.toSgr(); // "1;31"
```

::: tip SGR 编码对照
| 属性 | SGR 码 |
|------|--------|
| bold | 1 |
| dim | 2 |
| italic | 3 |
| underline | 4 |
| inverse | 7 |
| hidden | 8 |
| strikethrough | 9 |
:::

### `equals(other: TextStyle): boolean`

深度比较两个样式是否完全相等。布尔属性直接比较，颜色属性使用 `Color.equals()`。

## 示例

```typescript
import { TextStyle } from './core/text-style';
import { Color } from './core/color';

// 创建带颜色和装饰的样式
const errorStyle = new TextStyle({
  foreground: Color.red,
  bold: true,
});

// 样式合并（用于 TextSpan 树的样式继承）
const parentStyle = new TextStyle({ foreground: Color.white, dim: true });
const childStyle = new TextStyle({ bold: true });
const effective = parentStyle.merge(childStyle);
// effective: { foreground: Color.white, dim: true, bold: true }

// 检查是否为空样式
new TextStyle().isEmpty; // true
errorStyle.isEmpty;       // false
```
