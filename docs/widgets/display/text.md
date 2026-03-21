# Text

`来源: src/widgets/text.ts`

Text 是显示文本内容的叶子组件。支持富文本（通过 TextSpan 树）、文本对齐、行数限制和溢出处理。底层使用 `RenderText` 渲染对象。

## 构造函数

```typescript
new Text({
  text: TextSpan,
  textAlign?: 'left' | 'center' | 'right',
  maxLines?: number,
  overflow?: 'clip' | 'ellipsis',
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | `TextSpan` | -- | 文本内容（必填） |
| textAlign | `'left' \| 'center' \| 'right'` | `'left'` | 文本对齐方式 |
| maxLines | `number` | -- | 最大显示行数 |
| overflow | `'clip' \| 'ellipsis'` | `'clip'` | 溢出处理方式 |

## TextSpan

TextSpan 是构建富文本树的核心类。每个 TextSpan 可以有自己的文本和样式，也可以包含子 TextSpan。

```typescript
import { TextSpan } from 'flutter-tui/core/text-span';
import { TextStyle } from 'flutter-tui/core/text-style';

// 简单文本
new TextSpan({
  text: 'Hello',
  style: new TextStyle({ bold: true }),
})

// 富文本（多段不同样式）
new TextSpan({
  children: [
    new TextSpan({
      text: 'Priority: ',
      style: new TextStyle({ dim: true }),
    }),
    new TextSpan({
      text: 'HIGH',
      style: new TextStyle({ foreground: Color.red, bold: true }),
    }),
  ],
})
```

## TextStyle 常用属性

```typescript
new TextStyle({
  foreground?: Color,      // 前景色
  background?: Color,      // 背景色
  bold?: boolean,          // 粗体
  dim?: boolean,           // 暗色
  italic?: boolean,        // 斜体
  underline?: boolean,     // 下划线
  strikethrough?: boolean, // 删除线
})
```

## 基本用法

### 简单文本

```typescript
import { Text } from 'flutter-tui/widgets/text';
import { TextSpan } from 'flutter-tui/core/text-span';
import { TextStyle } from 'flutter-tui/core/text-style';
import { Color } from 'flutter-tui/core/color';

new Text({
  text: new TextSpan({
    text: 'Hello, Flutter-TUI!',
    style: new TextStyle({
      bold: true,
      foreground: Color.rgb(100, 200, 255),
    }),
  }),
})
```

### 居中对齐

```typescript
new Text({
  text: new TextSpan({ text: '居中标题' }),
  textAlign: 'center',
})
```

### 限制行数并添加省略号

```typescript
new Text({
  text: new TextSpan({ text: longContent }),
  maxLines: 3,
  overflow: 'ellipsis',
})
```

## 进阶用法

### 富文本组合

```typescript
// 多种样式组合
new Text({
  text: new TextSpan({
    children: [
      new TextSpan({
        text: '@',
        style: new TextStyle({ foreground: Color.cyan }),
      }),
      new TextSpan({
        text: 'username',
        style: new TextStyle({
          foreground: Color.cyan,
          dim: true,
        }),
      }),
    ],
  }),
})
```

### 动态颜色

```typescript
// 根据状态选择颜色
const countColor = count > 0
  ? Color.green
  : count < 0
    ? Color.red
    : Color.white;

new Text({
  text: new TextSpan({
    text: String(count),
    style: new TextStyle({
      foreground: countColor,
      bold: true,
    }),
  }),
})
```

### 辅助函数模式

在实际项目中，通常会创建辅助函数简化 Text 的创建：

```typescript
function label(content: string, style?: TextStyle): Text {
  return new Text({
    text: new TextSpan({
      text: content,
      style: style ?? new TextStyle(),
    }),
  });
}

// 使用
label('CPU: 45%', new TextStyle({ foreground: Color.green }))
```

::: info
Text 的尺寸由文本内容决定：宽度为所有行中最长行的显示宽度，高度为显示行数。中文和全角字符会正确计算为 2 个字符宽度。
:::

::: warning
Text 是 `LeafRenderObjectWidget`（叶子组件），不能包含子组件。富文本效果通过 TextSpan 的嵌套实现，而非组件嵌套。
:::

## 相关组件

- [DefaultTextStyle](/widgets/display/default-text-style) - 默认文本样式继承
- [Divider](/widgets/display/divider) - 水平分割线
- [Container](/widgets/layout/container) - 带装饰的文本容器
