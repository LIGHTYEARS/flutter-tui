# Expanded / Flexible

`来源: src/widgets/flexible.ts`

Flexible 和 Expanded 用于控制 Row、Column 或 Flex 中子组件的弹性伸缩行为。Expanded 是 Flexible 的一个便捷子类，等价于 `fit: 'tight'` 的 Flexible。

## Flexible 构造函数

```typescript
new Flexible({
  child: Widget,
  flex?: number,
  fit?: FlexFit,
  key?: Key,
})
```

## Expanded 构造函数

```typescript
new Expanded({
  child: Widget,
  flex?: number,
  key?: Key,
})
```

## 属性

### Flexible

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| child | `Widget` | -- | 子组件（必填） |
| flex | `number` | `1` | 弹性因子，决定分配剩余空间的比例 |
| fit | `FlexFit` | `'loose'` | 弹性适配方式 |

### Expanded

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| child | `Widget` | -- | 子组件（必填） |
| flex | `number` | `1` | 弹性因子，决定分配剩余空间的比例 |

::: info
Expanded 的 `fit` 固定为 `'tight'`，无法修改。
:::

## FlexFit 取值

| 值 | 说明 |
|----|------|
| `'tight'` | 子组件**必须**填满分配到的空间 |
| `'loose'` | 子组件**最多**占用分配到的空间，但允许更小 |

## 基本用法

### 使用 Expanded 平均分配空间

```typescript
import { Row } from 'flutter-tui/widgets/flex';
import { Expanded } from 'flutter-tui/widgets/flexible';

// 两个面板平均分配水平空间
new Row({
  children: [
    new Expanded({
      child: leftPanel,
    }),
    new Expanded({
      child: rightPanel,
    }),
  ],
})
```

### 使用 flex 比例分配空间

```typescript
// 左 1/4，右 3/4
new Row({
  children: [
    new Expanded({
      flex: 1,
      child: sidebar,
    }),
    new Expanded({
      flex: 3,
      child: mainContent,
    }),
  ],
})
```

## 进阶用法

### Flexible 松弛适配

```typescript
// 子组件可以小于分配空间
new Row({
  children: [
    new Flexible({
      fit: 'loose',
      child: new Text({ text: new TextSpan({ text: '短文本' }) }),
    }),
    new Expanded({
      child: remainingContent,
    }),
  ],
})
```

### 三栏仪表板布局

```typescript
new Row({
  crossAxisAlignment: 'start',
  children: [
    // 左侧面板 (flex: 1)
    new Expanded({
      flex: 1,
      child: buildSystemPanel(),
    }),
    new SizedBox({ width: 1 }),
    // 中间面板 (flex: 2)
    new Expanded({
      flex: 2,
      child: buildActivityPanel(),
    }),
    new SizedBox({ width: 1 }),
    // 右侧面板 (flex: 1)
    new Expanded({
      flex: 1,
      child: buildStatsPanel(),
    }),
  ],
})
```

::: tip
Expanded 等价于 `new Flexible({ fit: 'tight', ... })`。当你需要子组件完全填满分配空间时使用 Expanded，当允许子组件自行决定大小时使用 Flexible。
:::

::: warning
Flexible 和 Expanded 只能作为 Row、Column 或 Flex 的**直接子组件**使用。它们通过 `ParentDataWidget` 机制设置 `FlexParentData`。
:::

## 相关组件

- [Row / Column](/widgets/layout/row-column) - 弹性布局容器
- [Spacer](/widgets/layout/spacer) - 弹性空白组件
- [SizedBox](/widgets/layout/sized-box) - 固定尺寸
