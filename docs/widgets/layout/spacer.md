# Spacer

`来源: src/widgets/spacer.ts`

Spacer 创建可伸缩或固定大小的空白空间。在 Row/Column 中使用时，默认会使用 Expanded 占满剩余空间；也可以指定固定的宽/高。

## 构造函数

```typescript
new Spacer({
  flex?: number,
  width?: number,
  height?: number,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| flex | `number` | `1` | 弹性因子（仅在未设置 width/height 时生效） |
| width | `number` | -- | 固定宽度（设置后使用 SizedBox 而非 Expanded） |
| height | `number` | -- | 固定高度（设置后使用 SizedBox 而非 Expanded） |

## 静态工厂方法

```typescript
// 固定宽度的水平间距
Spacer.horizontal(width: number): Spacer

// 固定高度的垂直间距
Spacer.vertical(height: number): Spacer

// 弹性间距（可指定 flex 因子）
Spacer.flexible(flex?: number): Spacer
```

## 内部实现

Spacer 的 `build()` 方法根据配置返回不同的组件：

- 设置了 `width` 或 `height`：返回 `new SizedBox({ width, height })`
- 未设置固定尺寸：返回 `new Expanded({ flex, child: SizedBox.shrink() })`

## 基本用法

### 弹性空白

```typescript
import { Spacer } from 'flutter-tui/widgets/spacer';

// 将两个元素推到行的两端
new Row({
  children: [
    label('左侧'),
    new Spacer(),        // 占满中间空间
    label('右侧'),
  ],
})
```

### 固定间距

```typescript
// 在 Column 中添加固定间距
new Column({
  children: [
    titleWidget,
    Spacer.vertical(2),       // 2 行间距
    bodyWidget,
    Spacer.vertical(1),       // 1 行间距
    footerWidget,
  ],
})
```

## 进阶用法

### 按比例分配空白

```typescript
// 用不同 flex 的 Spacer 分配空间
new Row({
  children: [
    Spacer.flexible(1),    // 1/3 空间
    centerContent,
    Spacer.flexible(2),    // 2/3 空间
  ],
})
```

### 在水平方向添加固定间距

```typescript
new Row({
  children: [
    panel1,
    Spacer.horizontal(2),    // 2 列宽间距
    panel2,
    Spacer.horizontal(2),
    panel3,
  ],
})
```

::: tip
`Spacer.horizontal(n)` 等价于 `new SizedBox({ width: n, height: 0 })`，`Spacer.vertical(n)` 等价于 `new SizedBox({ width: 0, height: n })`。对于简单的固定间距，直接使用 SizedBox 也是可以的。
:::

## 相关组件

- [SizedBox](/widgets/layout/sized-box) - 固定尺寸空白
- [Expanded / Flexible](/widgets/layout/expanded-flexible) - 弹性布局
- [Row / Column](/widgets/layout/row-column) - 弹性布局容器
