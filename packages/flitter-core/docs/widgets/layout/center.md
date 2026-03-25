# Center

`来源: src/widgets/center.ts`

Center 将子组件居中放置在可用空间内。底层使用 `RenderCenter` 渲染对象。

## 构造函数

```typescript
new Center({
  child?: Widget,
  widthFactor?: number,
  heightFactor?: number,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| child | `Widget` | -- | 子组件 |
| widthFactor | `number` | -- | 宽度因子，自身宽度 = 子组件宽度 * widthFactor |
| heightFactor | `number` | -- | 高度因子，自身高度 = 子组件高度 * heightFactor |

## 布局算法

1. 使用松弛约束（min=0, max=父约束 max）布局子组件
2. 确定自身尺寸：
   - 若设置了 `widthFactor`：宽度 = 子组件宽度 * widthFactor
   - 若父约束有界：使用约束的 maxWidth
   - 否则：使用子组件宽度
   - 高度逻辑同上
3. 将子组件偏移到居中位置：`offset = floor((自身尺寸 - 子组件尺寸) / 2)`

## 基本用法

```typescript
import { Center } from 'flitter-core/widgets/center';

// 在终端中居中显示文本
new Center({
  child: new Text({
    text: new TextSpan({
      text: 'Hello, Flitter!',
      style: new TextStyle({ bold: true }),
    }),
  }),
})
```

## 进阶用法

### 作为根组件居中整个应用

```typescript
// 将计数器界面居中在终端中
const app = new Center({
  child: new Column({
    mainAxisSize: 'min',
    mainAxisAlignment: 'center',
    children: [
      titleWidget,
      new SizedBox({ height: 1 }),
      countDisplay,
      new SizedBox({ height: 1 }),
      helpText,
    ],
  }),
});

runApp(app);
```

### 使用尺寸因子

```typescript
// 自身尺寸为子组件的 2 倍
new Center({
  widthFactor: 2,
  heightFactor: 2,
  child: smallWidget,
})
```

::: info
当父约束无界时（例如在 ScrollView 内部），如果没有设置 widthFactor/heightFactor，Center 会收缩到子组件的尺寸。
:::

## 相关组件

- [Row / Column](/widgets/layout/row-column) - 使用 `mainAxisAlignment: 'center'` 居中子组件
- [Container](/widgets/layout/container) - 组合式容器
