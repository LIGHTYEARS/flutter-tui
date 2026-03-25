# Padding

`来源: src/widgets/padding.ts`

Padding 用于在子组件四周添加空白区域（内边距）。底层使用 `RenderPadding` 渲染对象。

## 构造函数

```typescript
new Padding({
  padding: EdgeInsets,
  child?: Widget,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| padding | `EdgeInsets` | -- | 内边距（必填） |
| child | `Widget` | -- | 子组件 |

## EdgeInsets 用法

`EdgeInsets` 类提供了多种便捷的工厂方法来创建内边距：

```typescript
import { EdgeInsets } from 'flutter-tui/layout/edge-insets';

// 四边相同
EdgeInsets.all(2)                   // 四边各 2

// 对称设置
EdgeInsets.symmetric({
  horizontal: 2,                    // 左右各 2
  vertical: 1,                      // 上下各 1
})

// 仅水平或垂直
EdgeInsets.horizontal(3)            // 左右各 3，上下为 0
EdgeInsets.vertical(1)              // 上下各 1，左右为 0

// 单独设置每一边
EdgeInsets.only({
  left: 2,
  top: 1,
  right: 0,
  bottom: 1,
})

// 零边距
EdgeInsets.zero
```

### EdgeInsets 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| left | `number` | 左侧边距 |
| top | `number` | 顶部边距 |
| right | `number` | 右侧边距 |
| bottom | `number` | 底部边距 |
| horizontal | `number` | 左右边距之和 (left + right) |
| vertical | `number` | 上下边距之和 (top + bottom) |

::: info
EdgeInsets 的所有值都会自动通过 `Math.round()` 取整，因为终端坐标系是整数坐标。
:::

## 基本用法

```typescript
import { Padding } from 'flutter-tui/widgets/padding';
import { EdgeInsets } from 'flutter-tui/layout/edge-insets';

// 四周留白
new Padding({
  padding: EdgeInsets.all(2),
  child: new Text({
    text: new TextSpan({ text: '留白内容' }),
  }),
})
```

## 进阶用法

### 标题栏内边距

```typescript
// 水平留白的标题栏
new Padding({
  padding: EdgeInsets.symmetric({ horizontal: 1 }),
  child: Row.spaceBetween([
    label('标题', new TextStyle({ bold: true })),
    label('副标题', new TextStyle({ dim: true })),
  ]),
})
```

### 面板内容区边距

```typescript
// 面板内部统一留白
new Padding({
  padding: EdgeInsets.all(1),
  child: new Column({
    mainAxisSize: 'min',
    crossAxisAlignment: 'start',
    children: contentWidgets,
  }),
})
```

::: tip
Container 组件同时支持 `padding`（内边距）和 `margin`（外边距）属性。Container 的 margin 也是通过 Padding 实现的。
:::

## 相关组件

- [Container](/widgets/layout/container) - 组合式容器（含 padding 和 margin）
- [SizedBox](/widgets/layout/sized-box) - 固定尺寸间距
- [Spacer](/widgets/layout/spacer) - 弹性空白
