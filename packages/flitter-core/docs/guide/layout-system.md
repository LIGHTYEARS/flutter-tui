# 布局系统

Flitter 的布局系统基于 Flutter 的盒约束（Box Constraints）协议。父组件向子组件传递约束，子组件在约束范围内决定自身尺寸。

## 约束协议

布局遵循一个核心原则：**约束向下传递，尺寸向上报告，父组件决定位置**。

```
       父组件
         │
    传递 BoxConstraints（向下）
         │
         ▼
       子组件
    在约束内选择 size
         │
    报告 size（向上）
         │
         ▼
       父组件
    设置 child.offset（位置）
```

## BoxConstraints

`BoxConstraints` 定义了一个组件允许的最小和最大宽高范围：

```typescript
class BoxConstraints {
  readonly minWidth: number;   // 最小宽度
  readonly minHeight: number;  // 最小高度
  readonly maxWidth: number;   // 最大宽度（可以为 Infinity）
  readonly maxHeight: number;  // 最大高度（可以为 Infinity）
}
```

### 工厂方法

| 方法 | 说明 | 结果 |
|------|------|------|
| `BoxConstraints.tight(size)` | 紧约束 | min = max = size |
| `BoxConstraints.tightFor({width?, height?})` | 指定轴紧约束 | 指定轴 min=max，未指定轴 0..Infinity |
| `BoxConstraints.loose(size)` | 松约束 | min=0, max=size |
| `bc.loosen()` | 放松约束 | min 置 0，保留 max |
| `bc.constrain(size)` | 将 size 限制在约束内 | clamp 每个维度 |
| `bc.enforce(outer)` | 收紧约束到 outer 范围 | 取两者更严格的一方 |

### 紧约束 vs 松约束

```
紧约束 (Tight)           松约束 (Loose)
minWidth = maxWidth      minWidth = 0
minHeight = maxHeight    minHeight = 0

子组件没有选择余地，         子组件可在 0..max 之间
尺寸被完全确定               自由选择尺寸
```

```typescript
// 紧约束示例：SizedBox 强制子组件为 20x5
const tight = BoxConstraints.tight(new Size(20, 5));
// minWidth=20, maxWidth=20, minHeight=5, maxHeight=5

// 松约束示例：Center 放松约束让子组件自行决定尺寸
const loose = BoxConstraints.loose(new Size(80, 24));
// minWidth=0, maxWidth=80, minHeight=0, maxHeight=24
```

::: tip 约束值均为整数
终端单元格是离散的，因此所有约束值（除 Infinity 外）都自动取整为整数。
:::

## 布局流程

每个 `RenderBox` 的布局按以下步骤执行：

```typescript
// 父组件调用
child.layout(constraints);

// RenderBox.layout() 内部：
layout(constraints: BoxConstraints): void {
  this._constraints = constraints;
  this.performLayout();      // 子类实现
  this._needsLayout = false;
}
```

`performLayout()` 的职责：
1. 对每个子组件调用 `child.layout(子约束)`
2. 设置每个子组件的 `child.offset`
3. 设置自身的 `this.size`（必须满足收到的约束）

## RenderFlex 六步算法

`RenderFlex` 是 `Row` 和 `Column` 的底层布局引擎。它实现了完整的 6 步 Flex 布局算法。

### 概念

| 术语 | 在 Row 中 | 在 Column 中 |
|------|----------|-------------|
| 主轴 (Main Axis) | 水平方向 | 垂直方向 |
| 交叉轴 (Cross Axis) | 垂直方向 | 水平方向 |
| flex 系数 | 子项占主轴剩余空间的权重 | 同左 |
| fit (tight/loose) | tight=必须填满分配空间，loose=可以更小 | 同左 |

### 六步详解

**步骤 1：分离 flex 和非 flex 子项**

```typescript
for (const child of this.children) {
  const pd = child.parentData as FlexParentData;
  if (pd.flex > 0) {
    totalFlex += pd.flex;
    flexChildren.push(child);
  } else {
    nonFlexChildren.push(child);
  }
}
```

**步骤 2：布局非 flex 子项（主轴不受限）**

非 flex 子项使用无界主轴约束进行布局，让它们自行决定主轴尺寸。

```
非 flex 子项约束：
  主轴: 0..Infinity（不限制）
  交叉轴: 0..maxCross（或 stretch 时 maxCross..maxCross）
```

累计已分配的主轴空间 `allocatedSize` 和最大交叉轴尺寸 `maxCrossSize`。

**步骤 3：将剩余空间分配给 flex 子项**

```
freeSpace = maxMain - allocatedSize
spacePerFlex = freeSpace / totalFlex

每个 flex 子项分配: spacePerFlex * child.flex
```

- `fit: 'tight'`：子约束的 min = max = 分配的空间
- `fit: 'loose'`：子约束的 min = 0, max = 分配的空间

**步骤 4：计算自身尺寸**

```
mainAxisSize = 'max' → 使用约束的最大主轴
mainAxisSize = 'min' → 使用子项总长度
crossAxisSize = maxCrossSize（受约束裁剪）
```

**步骤 5：按 MainAxisAlignment 定位子项**

根据主轴对齐方式计算起始位置和间距：

```
start       [A][B][C]
end                    [A][B][C]
center           [A][B][C]
spaceBetween [A]     [B]     [C]
spaceAround   [A]   [B]   [C]
spaceEvenly    [A]   [B]   [C]
```

| 对齐方式 | 起始偏移 | 子项间距 |
|---------|---------|---------|
| `start` | 0 | 0 |
| `end` | 剩余空间 | 0 |
| `center` | 剩余空间 / 2 | 0 |
| `spaceBetween` | 0 | 剩余空间 / (n-1) |
| `spaceAround` | 间距/2 | 剩余空间 / n |
| `spaceEvenly` | 间距 | 剩余空间 / (n+1) |

**步骤 6：按 CrossAxisAlignment 设置交叉轴偏移**

| 对齐方式 | 交叉轴偏移 |
|---------|----------|
| `start` | 0 |
| `end` | 自身交叉轴尺寸 - 子项交叉轴尺寸 |
| `center` | (自身交叉轴尺寸 - 子项交叉轴尺寸) / 2 |
| `stretch` | 子项已被拉伸（步骤 2/3 中约束了交叉轴） |

### 使用示例

```typescript [flex-example.ts]
import { Column, Row } from '../src/widgets/flex';
import { Expanded, Flexible } from '../src/widgets/flexible';
import { Text } from '../src/widgets/text';
import { TextSpan } from '../src/core/text-span';
import { Container } from '../src/widgets/container';
import { Color } from '../src/core/color';

// 垂直布局，子项平均分配空间
new Column({
  mainAxisAlignment: 'spaceEvenly',
  crossAxisAlignment: 'stretch',
  children: [
    // flex=1 的子项占 1/3 空间
    new Expanded({
      flex: 1,
      child: new Container({
        color: Color.blue,
        child: new Text({
          text: new TextSpan({ text: 'Top (1/3)' }),
        }),
      }),
    }),
    // flex=2 的子项占 2/3 空间
    new Expanded({
      flex: 2,
      child: new Container({
        color: Color.green,
        child: new Text({
          text: new TextSpan({ text: 'Bottom (2/3)' }),
        }),
      }),
    }),
  ],
});
```

## 嵌套布局

复杂界面通过嵌套 Row 和 Column 实现：

```typescript [nested-layout.ts]
// 经典三栏布局
new Row({
  children: [
    // 左侧栏：固定 20 列宽
    new SizedBox({
      width: 20,
      child: new Column({
        children: [/* 导航项 */],
      }),
    }),
    // 主内容区：占剩余空间
    new Expanded({
      child: new Column({
        children: [
          // 顶部标题栏：固定 3 行高
          new SizedBox({
            height: 3,
            child: new Text({
              text: new TextSpan({ text: 'Header' }),
            }),
          }),
          // 内容区：占剩余高度
          new Expanded({
            child: new Text({
              text: new TextSpan({ text: 'Content' }),
            }),
          }),
        ],
      }),
    }),
  ],
});
```

::: warning 无界约束
当一个不受限主轴的 Flex（如 Column 放在 ScrollView 中）包含 Expanded 子项时，Expanded 无法正确计算尺寸。此时应避免使用 Expanded，改用固定尺寸或 mainAxisSize: 'min'。
:::

## 常见布局模式

| 需求 | 方案 |
|------|------|
| 固定尺寸 | `SizedBox({ width: N, height: N })` |
| 居中 | `Center({ child: ... })` |
| 内边距 | `Padding({ padding: EdgeInsets.all(2), child: ... })` |
| 等分空间 | 多个 `Expanded({ flex: 1 })` |
| 按比例分配 | `Expanded({ flex: 2 })` + `Expanded({ flex: 1 })` |
| 固定 + 弹性 | `SizedBox` + `Expanded` |
| 间距 | `SizedBox({ width: N })` 或 `Spacer()` |
| 背景/边框 | `Container({ color, border, child })` |

## 下一步

- [渲染管线](/guide/rendering-pipeline) — 布局完成后如何绘制到终端
- [三棵树架构](/guide/three-tree) — 理解布局在整体架构中的位置
