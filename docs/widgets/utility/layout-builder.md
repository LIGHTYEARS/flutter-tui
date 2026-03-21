# LayoutBuilder

`来源: src/widgets/builder.ts`

LayoutBuilder 在构建组件树时提供父组件的布局约束信息，允许根据可用空间动态选择不同的布局方案。

## 构造函数

```typescript
new LayoutBuilder({
  builder: (context: BuildContext, constraints: BoxConstraints) => Widget,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| builder | `(context: BuildContext, constraints: BoxConstraints) => Widget` | -- | 约束感知的构建回调（必填） |

## BoxConstraints 常用属性

```typescript
interface BoxConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  hasBoundedWidth: boolean;
  hasBoundedHeight: boolean;
  isTight: boolean;
}
```

## 内部实现

LayoutBuilder 的实现包含三个层次：

1. **LayoutBuilder** (StatefulWidget) - 管理约束状态
2. **LayoutBuilderState** - 存储最新约束，触发重建
3. **RenderLayoutBuilder** (RenderBox) - 在 `performLayout` 时通知约束变化

```
LayoutBuilder (StatefulWidget)
  └─ LayoutBuilderState
       └─ _LayoutBuilderDelegate (SingleChildRenderObjectWidget)
            └─ RenderLayoutBuilder (RenderBox)
```

## 基本用法

### 响应式布局

```typescript
import { LayoutBuilder } from 'flutter-tui/widgets/builder';

new LayoutBuilder({
  builder: (context, constraints) => {
    if (constraints.maxWidth >= 80) {
      // 宽屏：两栏布局
      return new Row({
        children: [
          new Expanded({ child: sidebar }),
          new Expanded({ flex: 2, child: mainContent }),
        ],
      });
    } else {
      // 窄屏：单栏布局
      return new Column({
        children: [sidebar, mainContent],
      });
    }
  },
})
```

### 根据高度调整内容

```typescript
new LayoutBuilder({
  builder: (context, constraints) => {
    const showFooter = constraints.maxHeight > 20;
    return new Column({
      children: [
        header,
        new Expanded({ child: content }),
        ...(showFooter ? [footer] : []),
      ],
    });
  },
})
```

## 进阶用法

### 自适应卡片网格

```typescript
new LayoutBuilder({
  builder: (context, constraints) => {
    const cardWidth = 30;
    const columns = Math.floor(constraints.maxWidth / cardWidth);

    // 根据可用列数动态调整布局
    return new Row({
      children: Array.from({ length: columns }, (_, i) =>
        new Expanded({
          child: buildCard(cards[i]),
        }),
      ),
    });
  },
})
```

### 调试约束信息

```typescript
new LayoutBuilder({
  builder: (context, constraints) => {
    return new Column({
      mainAxisSize: 'min',
      children: [
        label(`宽度: ${constraints.minWidth} - ${constraints.maxWidth}`),
        label(`高度: ${constraints.minHeight} - ${constraints.maxHeight}`),
        label(`有界宽度: ${constraints.hasBoundedWidth}`),
        label(`有界高度: ${constraints.hasBoundedHeight}`),
      ],
    });
  },
})
```

::: warning
LayoutBuilder 的 builder 回调会在布局阶段（performLayout）触发，因此在回调中不应执行耗时操作或产生副作用。
:::

::: tip
LayoutBuilder 特别适合创建响应式 TUI 应用。终端窗口大小改变时，约束会更新，builder 会被重新调用以适应新的尺寸。
:::

## 相关组件

- [Builder](/widgets/utility/builder) - 简单构建器（无约束信息）
- [Row / Column](/widgets/layout/row-column) - 弹性布局
