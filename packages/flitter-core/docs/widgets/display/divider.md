# Divider

`来源: src/widgets/divider.ts`

Divider 是一个水平分割线组件，占据整行宽度、高度为 1 行。使用 Unicode box-drawing 字符（`─`, U+2500）绘制。

## 构造函数

```typescript
new Divider({
  color?: Color,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| color | `Color` | -- | 分割线颜色（不设置则使用默认颜色） |

## 布局行为

- 宽度：占满父约束的 maxWidth（如果无界则默认 80）
- 高度：固定为 1 行

## 基本用法

```typescript
import { Divider } from 'flitter-core/widgets/divider';

// 默认颜色的分割线
new Column({
  children: [
    headerWidget,
    new Divider(),
    contentWidget,
  ],
})
```

## 进阶用法

### 带颜色的分割线

```typescript
import { Color } from 'flitter-core/core/color';

// 青色分割线
new Divider({ color: Color.cyan })

// 绿色分割线
new Divider({ color: Color.green })
```

### 在面板中使用

```typescript
// 面板内分隔不同区域
new Container({
  decoration: new BoxDecoration({
    border: Border.all(new BorderSide({ color: Color.magenta })),
  }),
  child: new Column({
    mainAxisSize: 'min',
    crossAxisAlignment: 'stretch',
    children: [
      label('服务状态', new TextStyle({ bold: true })),
      new Divider({ color: Color.magenta }),
      label('API: OK'),
      label('DB: OK'),
      new Divider({ color: Color.magenta }),
      label('指标数据', new TextStyle({ bold: true })),
      label('Req/s: 1,247'),
    ],
  }),
})
```

::: info
Divider 是 `LeafRenderObjectWidget`（叶子组件），不能包含子组件。
:::

## 相关组件

- [Text](/widgets/display/text) - 文本显示
- [DecoratedBox](/widgets/display/decorated-box) - 装饰（含边框）
- [SizedBox](/widgets/layout/sized-box) - 空白间距
