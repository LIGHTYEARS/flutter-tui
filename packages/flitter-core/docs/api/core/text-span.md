# TextSpan

`来源: src/core/text-span.ts`

富文本的树形结构。每个节点可包含可选的文本内容、样式和子节点。支持样式继承机制，子节点的样式会与父节点合并。

## 构造函数

```typescript
new TextSpan(opts?: {
  text?: string;
  style?: TextStyle;
  children?: TextSpan[];
})
```

::: tip
`children` 数组会被冻结（`Object.freeze`），确保不可变性。
:::

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| text | `string \| undefined` | 当前节点的文本内容 |
| style | `TextStyle \| undefined` | 当前节点的样式 |
| children | `readonly TextSpan[] \| undefined` | 子节点数组（冻结） |

## 方法

### `visitChildren(visitor, parentStyle?): void`

```typescript
visitChildren(
  visitor: (text: string, style: TextStyle) => void,
  parentStyle?: TextStyle
): void
```

按树的顺序遍历每个文本段。回调接收文本和有效（合并后的）样式。样式继承规则：

1. 如果父级和当前节点都没有样式，使用空 TextStyle
2. 如果只有父级有样式，使用父级样式
3. 如果只有当前节点有样式，使用当前样式
4. 两者都有样式时，使用 `parentStyle.merge(this.style)` 合并

### `toPlainText(): string`

提取所有纯文本内容（不含样式），按树的顺序拼接。

### `computeWidth(): number`

计算在终端中的显示宽度（列数）。正确处理 CJK 字符（宽度 2）、控制字符（宽度 0）和常规字符（宽度 1）。

## 示例

```typescript
import { TextSpan } from './core/text-span';
import { TextStyle } from './core/text-style';
import { Color } from './core/color';

// 简单文本
const plain = new TextSpan({ text: 'Hello, World!' });
plain.toPlainText(); // "Hello, World!"

// 带样式的文本
const styled = new TextSpan({
  text: 'Error: ',
  style: new TextStyle({ foreground: Color.red, bold: true }),
});

// 树形结构（样式继承）
const rich = new TextSpan({
  style: new TextStyle({ foreground: Color.white }),
  children: [
    new TextSpan({ text: 'Status: ' }),
    new TextSpan({
      text: 'OK',
      style: new TextStyle({ foreground: Color.green, bold: true }),
    }),
  ],
});

// 遍历文本段
rich.visitChildren((text, style) => {
  console.log(`"${text}" -> ${style}`);
});
// "Status: " -> TextStyle(fg: Color(named:7))
// "OK" -> TextStyle(fg: Color(named:2), bold: true)

// 计算 CJK 文本宽度
const cjk = new TextSpan({ text: '你好世界' });
cjk.computeWidth(); // 8（每个中文字符宽度为 2）
```

::: tip 样式继承
TextSpan 树中的样式采用「向下合并」策略。子节点的样式覆盖父节点的同名属性，未定义的属性从父节点继承。这与 Flutter 的 TextSpan 行为一致。
:::
