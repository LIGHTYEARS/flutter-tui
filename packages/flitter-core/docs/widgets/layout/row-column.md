# Row / Column

`来源: src/widgets/flex.ts`

Row 和 Column 是最常用的布局组件，分别将子组件按**水平方向**和**垂直方向**排列。它们都继承自 `Flex` 基类，通过 `direction` 属性区分方向。

## 基类 Flex

Row 和 Column 的公共基类，一般不直接使用。

```typescript
new Flex({
  direction: Axis,            // 'horizontal' | 'vertical'
  children?: Widget[],
  mainAxisAlignment?: MainAxisAlignment,
  crossAxisAlignment?: CrossAxisAlignment,
  mainAxisSize?: MainAxisSize,
})
```

## Row 构造函数

```typescript
new Row({
  children?: Widget[],
  mainAxisAlignment?: MainAxisAlignment,
  crossAxisAlignment?: CrossAxisAlignment,
  mainAxisSize?: MainAxisSize,
  key?: Key,
})
```

## Column 构造函数

```typescript
new Column({
  children?: Widget[],
  mainAxisAlignment?: MainAxisAlignment,
  crossAxisAlignment?: CrossAxisAlignment,
  mainAxisSize?: MainAxisSize,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| children | `Widget[]` | `[]` | 子组件列表 |
| mainAxisAlignment | `MainAxisAlignment` | `'start'` | 主轴对齐方式 |
| crossAxisAlignment | `CrossAxisAlignment` | `'center'` | 交叉轴对齐方式 |
| mainAxisSize | `MainAxisSize` | `'max'` | 主轴方向占用空间策略 |

### MainAxisAlignment 取值

| 值 | 说明 |
|----|------|
| `'start'` | 子组件紧靠主轴起始端 |
| `'center'` | 子组件居中排列 |
| `'end'` | 子组件紧靠主轴末端 |
| `'spaceBetween'` | 子组件之间均匀分配空间，首尾无间距 |
| `'spaceAround'` | 子组件之间均匀分配空间，首尾有半间距 |
| `'spaceEvenly'` | 子组件及首尾之间均匀分配空间 |

### CrossAxisAlignment 取值

| 值 | 说明 |
|----|------|
| `'start'` | 子组件对齐到交叉轴起始端 |
| `'center'` | 子组件在交叉轴居中 |
| `'end'` | 子组件对齐到交叉轴末端 |
| `'stretch'` | 子组件在交叉轴方向拉伸填满 |

### MainAxisSize 取值

| 值 | 说明 |
|----|------|
| `'max'` | 占满主轴方向的可用空间 |
| `'min'` | 仅占用子组件所需的最小空间 |

## 静态工厂方法

Row 和 Column 都提供了便捷的静态工厂方法，用于快速创建常见对齐方式的布局：

```typescript
// Row 静态方法
Row.start(children)        // mainAxisAlignment: 'start'
Row.center(children)       // mainAxisAlignment: 'center'
Row.end(children)          // mainAxisAlignment: 'end'
Row.spaceBetween(children) // mainAxisAlignment: 'spaceBetween'
Row.spaceAround(children)  // mainAxisAlignment: 'spaceAround'
Row.spaceEvenly(children)  // mainAxisAlignment: 'spaceEvenly'

// Column 静态方法（同上）
Column.start(children)
Column.center(children)
Column.end(children)
Column.spaceBetween(children)
Column.spaceAround(children)
Column.spaceEvenly(children)
```

## 基本用法

### 水平排列

```typescript
import { Row } from 'flitter-core/widgets/flex';
import { Text } from 'flitter-core/widgets/text';

// 三个文本水平排列
new Row({
  children: [
    new Text({ text: new TextSpan({ text: '左' }) }),
    new Text({ text: new TextSpan({ text: '中' }) }),
    new Text({ text: new TextSpan({ text: '右' }) }),
  ],
})
```

### 垂直排列

```typescript
import { Column } from 'flitter-core/widgets/flex';

// 三个文本垂直排列
new Column({
  mainAxisSize: 'min',
  children: [
    new Text({ text: new TextSpan({ text: '第一行' }) }),
    new Text({ text: new TextSpan({ text: '第二行' }) }),
    new Text({ text: new TextSpan({ text: '第三行' }) }),
  ],
})
```

## 进阶用法

### 使用静态工厂方法快速创建布局

```typescript
// 左右分散对齐的标题栏
Row.spaceBetween([
  label('Dashboard', new TextStyle({ bold: true })),
  label('v1.0', new TextStyle({ dim: true })),
])
```

### 嵌套布局

```typescript
// 表单布局：垂直排列的多行，每行是水平排列
new Column({
  mainAxisSize: 'min',
  crossAxisAlignment: 'stretch',
  children: [
    new Row({
      children: [
        label('用户名: '),
        new Expanded({ child: new TextField() }),
      ],
    }),
    new SizedBox({ height: 1 }),
    new Row({
      children: [
        label('密码:   '),
        new Expanded({ child: new TextField() }),
      ],
    }),
  ],
})
```

### 配合 Expanded 使用弹性布局

```typescript
// 三栏布局，中间栏占双倍空间
new Row({
  children: [
    new Expanded({ flex: 1, child: leftPanel }),
    new SizedBox({ width: 1 }),
    new Expanded({ flex: 2, child: centerPanel }),
    new SizedBox({ width: 1 }),
    new Expanded({ flex: 1, child: rightPanel }),
  ],
})
```

::: tip
Row 的 `direction` 固定为 `'horizontal'`，Column 的 `direction` 固定为 `'vertical'`。如果需要动态切换方向，可以直接使用 `Flex` 基类。
:::

::: warning
当 `mainAxisSize` 为 `'max'`（默认值）时，Row/Column 会占满主轴方向的所有可用空间。如果只想占用子组件所需的最小空间，请设置 `mainAxisSize: 'min'`。
:::

## 相关组件

- [Expanded / Flexible](/widgets/layout/expanded-flexible) - 弹性子组件
- [Spacer](/widgets/layout/spacer) - 弹性空白
- [SizedBox](/widgets/layout/sized-box) - 固定尺寸间距
- [Center](/widgets/layout/center) - 居中布局
