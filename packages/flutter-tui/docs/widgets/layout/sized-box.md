# SizedBox

`来源: src/widgets/sized-box.ts`

SizedBox 用于强制子组件具有特定的宽度和/或高度。底层使用 `RenderConstrainedBox` 通过紧约束（tight constraints）实现尺寸控制。

## 构造函数

```typescript
new SizedBox({
  width?: number,
  height?: number,
  child?: Widget,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| width | `number` | -- | 固定宽度（不设置则不约束宽度） |
| height | `number` | -- | 固定高度（不设置则不约束高度） |
| child | `Widget` | -- | 子组件 |

## 静态工厂方法

| 方法 | 说明 |
|------|------|
| `SizedBox.shrink()` | 零尺寸的 SizedBox（width: 0, height: 0） |
| `SizedBox.expand()` | 扩展到最大可用空间（width: Infinity, height: Infinity） |
| `SizedBox.fromSize(w, h)` | 指定宽高的 SizedBox |
| `SizedBox.fixedHeight(h)` | 仅约束高度 |
| `SizedBox.fixedWidth(w)` | 仅约束宽度 |

```typescript
// 各静态方法签名
SizedBox.shrink(opts?: { key?: Key; child?: Widget }): SizedBox
SizedBox.expand(opts?: { key?: Key; child?: Widget }): SizedBox
SizedBox.fromSize(width: number, height: number, opts?: { key?: Key; child?: Widget }): SizedBox
SizedBox.fixedHeight(height: number, opts?: { key?: Key; child?: Widget }): SizedBox
SizedBox.fixedWidth(width: number, opts?: { key?: Key; child?: Widget }): SizedBox
```

## 基本用法

### 作为间距使用

SizedBox 最常见的用途是在子组件之间添加固定间距：

```typescript
import { SizedBox } from 'flutter-tui/widgets/sized-box';

// 垂直间距（在 Column 中）
new Column({
  children: [
    titleText,
    new SizedBox({ height: 1 }),  // 1 行间距
    bodyText,
    new SizedBox({ height: 2 }),  // 2 行间距
    footerText,
  ],
})

// 水平间距（在 Row 中）
new Row({
  children: [
    leftPanel,
    new SizedBox({ width: 2 }),  // 2 列间距
    rightPanel,
  ],
})
```

### 强制子组件尺寸

```typescript
// 固定宽高的文本区域
new SizedBox({
  width: 30,
  height: 5,
  child: new Text({
    text: new TextSpan({ text: '固定区域内容' }),
  }),
})
```

## 进阶用法

### 零尺寸占位

```typescript
// 当没有内容时不占用空间
const placeholder = SizedBox.shrink();
```

### 填满可用空间

```typescript
// 让子组件扩展到父组件允许的最大尺寸
SizedBox.expand({
  child: backgroundWidget,
})
```

### 仅约束单一维度

```typescript
// 仅约束高度，宽度由父组件决定
SizedBox.fixedHeight(3, {
  child: new Text({
    text: new TextSpan({ text: '固定 3 行高' }),
  }),
})
```

::: tip
不带 child 的 SizedBox 可以用作固定尺寸的空白区域，这是创建间距的推荐方式。
:::

## 相关组件

- [Container](/widgets/layout/container) - 组合式容器（内部使用 SizedBox）
- [Expanded](/widgets/layout/expanded-flexible) - 弹性尺寸
- [Spacer](/widgets/layout/spacer) - 弹性空白
