# RenderObject

`来源: src/framework/render-object.ts`

渲染树的核心类。RenderObject 负责布局和绘制，是三棵树（Widget 树、Element 树、RenderObject 树）中直接与屏幕交互的部分。

## RenderObject（抽象基类）

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| parent | `RenderObject \| null` | 父渲染对象 |
| parentData | `ParentData \| null` | 父元素附加的数据 |
| needsLayout | `boolean` | 是否需要重新布局 |
| needsPaint | `boolean` | 是否需要重新绘制 |
| owner | `PipelineOwner \| null` | 管道所有者 |
| attached | `boolean` | 是否已附加到渲染树 |

::: tip 与 Flutter 的区别
- **没有 RelayoutBoundary**: `markNeedsLayout()` 始终向根传播
- **没有 RepaintBoundary**: 没有合成层
- **没有 sizedByParent / performResize()**: 所有尺寸计算在 `performLayout()` 中完成
- **没有 parentUsesSize**: `layout()` 仅接受 constraints
:::

### 树管理方法

#### `adoptChild(child: RenderObject): void`

收养子节点。设置 parent，设置 parentData，如果已 attached 则 attach 子节点，标记需要布局。

#### `dropChild(child: RenderObject): void`

移除子节点。如果已 attached 则 detach 子节点，清除 parent，标记需要布局。

#### `attach(owner: PipelineOwner): void`

附加到渲染管道。

#### `detach(): void`

从渲染管道分离。

### 布局与绘制

#### `markNeedsLayout(): void`

标记需要重新布局。向父节点传播，直到根节点通知 PipelineOwner。

#### `markNeedsPaint(): void`

标记需要重新绘制。向父节点传播并通知 PipelineOwner。

#### `abstract performLayout(): void`

执行布局计算。子类必须实现。

#### `abstract paint(context: PaintContext, offset: Offset): void`

执行绘制。子类必须实现。

---

## RenderBox

使用盒约束的渲染对象，具有二维尺寸。

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| size | `Size` | 当前尺寸（可读写） |
| offset | `Offset` | 相对于父级的偏移（可读写） |
| constraints | `BoxConstraints \| null` | 上次布局的约束 |
| hasSize | `boolean` | 是否有非零尺寸 |

::: warning
在此框架中，`offset` 存储在 RenderBox 自身上，而不是 BoxParentData 中。
:::

### 方法

#### `layout(constraints: BoxConstraints): void`

使用给定约束进行布局。如果约束未变且不是 dirty 状态则跳过。

```
layout(constraints) {
  constraintsChanged = !lastConstraints || !constraints.equals(lastConstraints)
  if (!needsLayout && !constraintsChanged) return  // 跳过
  lastConstraints = constraints
  needsLayout = false   // 在 performLayout 之前清除
  performLayout()
}
```

---

## ContainerRenderBox

管理子 RenderBox 列表的基类。使用数组（而非链表）存储子元素。

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| children | `ReadonlyArray<RenderBox>` | 子元素列表 |
| childCount | `number` | 子元素数量 |
| firstChild | `RenderBox \| null` | 第一个子元素 |
| lastChild | `RenderBox \| null` | 最后一个子元素 |

### 方法

#### `insert(child, after?): void`

插入子元素。可指定在某个子元素之后插入。

#### `remove(child): void`

移除指定子元素。

#### `removeAll(): void`

移除所有子元素。

#### `move(child, after?): void`

移动子元素位置。

---

## RenderObjectWidget（抽象基类）

有关联 RenderObject 的 Widget 基类。

#### `abstract createRenderObject(): RenderObject`

创建 RenderObject。

#### `updateRenderObject(renderObject): void`

更新 RenderObject 的配置。默认空操作。

---

## SingleChildRenderObjectWidget

拥有单个可选子 Widget 的 RenderObjectWidget。

```typescript
abstract class SingleChildRenderObjectWidget extends RenderObjectWidget {
  readonly child?: Widget;
  constructor(opts?: { key?: Key; child?: Widget })
}
```

---

## MultiChildRenderObjectWidget

拥有多个子 Widget 的 RenderObjectWidget。

```typescript
abstract class MultiChildRenderObjectWidget extends RenderObjectWidget {
  readonly children: Widget[];
  constructor(opts?: { key?: Key; children?: Widget[] })
}
```

---

## LeafRenderObjectWidget

没有子 Widget 的 RenderObjectWidget，用于叶节点。

---

## ParentData / BoxParentData

```typescript
class ParentData {
  detach(): void {}
}

class BoxParentData extends ParentData {
  // offset 存储在 RenderBox 上，不在这里
}
```

## 示例

```typescript
import { RenderBox, SingleChildRenderObjectWidget } from './framework/render-object';
import { BoxConstraints } from './core/box-constraints';

class MyRenderBox extends RenderBox {
  performLayout() {
    // 使用约束确定尺寸
    this.size = this.constraints!.constrain(new Size(20, 5));
  }

  paint(context: PaintContext, offset: Offset) {
    context.drawText(offset.col, offset.row, 'Hello!');
  }
}
```
