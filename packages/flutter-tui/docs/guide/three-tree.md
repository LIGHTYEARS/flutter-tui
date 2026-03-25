# 三棵树架构

Flutter-TUI 的核心是忠实复现 Flutter 的三棵树（Three Trees）架构。理解这个架构是掌握整个框架的关键。

## 架构概览

```
用户代码                  框架内部                    终端输出
  │                        │                          │
  ▼                        ▼                          ▼
┌─────────┐  createElement  ┌─────────┐  createRenderObject  ┌──────────────┐
│ Widget  │ ──────────────→ │ Element │ ──────────────────→  │ RenderObject │
│  Tree   │                 │  Tree   │                      │    Tree      │
└─────────┘                 └─────────┘                      └──────────────┘
  声明式描述                  生命周期管理                      布局 + 绘制
  不可变                      可变，长寿命                      可变，长寿命
  轻量                        管理子树协调                      执行实际渲染
```

## Widget 树

Widget 是 UI 的不可变声明式描述。每次状态变化时，框架会创建新的 Widget 实例（而非修改旧的）。

### 核心特点

- **不可变**：所有属性都是 `readonly`
- **轻量**：仅描述配置，不持有状态
- **临时**：每次重建都会创建新实例

### canUpdate 判断

当父 Widget 重建时，框架通过 `canUpdate()` 判断是否可以复用现有 Element：

```typescript
static canUpdate(oldWidget: Widget, newWidget: Widget): boolean {
  // 条件 1：构造函数相同（类型相同）
  if (oldWidget.constructor !== newWidget.constructor) return false;
  // 条件 2：Key 匹配（都无 Key，或 Key 相等）
  if (oldWidget.key === undefined && newWidget.key === undefined) return true;
  if (oldWidget.key === undefined || newWidget.key === undefined) return false;
  return oldWidget.key.equals(newWidget.key);
}
```

::: tip 何时需要 Key
当列表中的 Widget 可能重排、新增或删除时，必须使用 Key 确保 Element 正确复用。参见 `ValueKey` 和 `GlobalKey`。
:::

### 三种 Widget 类型

| 类型 | 基类 | 用途 | 对应 Element |
|------|------|------|-------------|
| 无状态 | `StatelessWidget` | 纯渲染，输出只取决于输入 | `StatelessElement` |
| 有状态 | `StatefulWidget` | 拥有可变的 `State` 对象 | `StatefulElement` |
| 继承型 | `InheritedWidget` | 向子树传递共享数据 | `InheritedElement` |

## Element 树

Element 是 Widget 在树中的实例化。它是三棵树的枢纽，负责管理生命周期和协调 Widget 与 RenderObject 之间的关系。

### 生命周期

```
创建 → mount() → [rebuild()] → unmount()
         │          ↑
         │          │
         └── markNeedsBuild()
```

- `mount()`：挂载到树中，设置父子关系
- `markNeedsBuild()`：标记为脏，加入 BuildOwner 的脏集合
- `performRebuild()`：由 BuildOwner 调度，调用 Widget 的 `build()` 方法
- `unmount()`：从树中移除，释放资源

::: warning 无 deactivate 阶段
与标准 Flutter 不同，Flutter-TUI 没有 `deactivate()` 阶段。Element 直接从 `mounted` 状态进入 `unmounted` 状态。
:::

### updateChild 四种情况

`updateChild()` 是 Element 协调的核心方法，处理四种情况：

```
                    newWidget
                 null        非 null
old   ┌─────────────────┬─────────────────┐
Child │                 │                 │
null  │  什么都不做      │  创建新 Element  │
      │  return null    │  inflateWidget() │
      ├─────────────────┼─────────────────┤
非    │  移除旧 Element  │  canUpdate?     │
null  │  unmount()      │  是 → update()  │
      │  return null    │  否 → 移除+创建  │
      └─────────────────┴─────────────────┘
```

```typescript
// 伪代码展示四种情况
updateChild(child: Element | null, newWidget: Widget | null): Element | null {
  if (newWidget === null) {
    if (child !== null) child.unmount();    // 情况 3：移除
    return null;                             // 情况 1：无操作
  }
  if (child !== null) {
    if (Widget.canUpdate(child.widget, newWidget)) {
      child.update(newWidget);               // 情况 4a：更新
      return child;
    }
    child.unmount();                         // 情况 4b：替换
  }
  return inflateWidget(newWidget);           // 情况 2：创建
}
```

### Key 匹配

在多子组件场景中，`updateChildren()` 使用 Key 优化协调：

1. 从头部开始匹配（`canUpdate` 为 true 的连续子项）
2. 从尾部开始匹配
3. 中间部分通过 Key 建立映射表匹配
4. 未匹配的旧 Element 被移除，未匹配的新 Widget 创建新 Element

## RenderObject 树

RenderObject 负责实际的布局计算和绘制操作。它是与终端屏幕缓冲区交互的层。

### 核心接口

```typescript
abstract class RenderObject {
  parent: RenderObject | null;
  parentData: ParentData | null;

  // 布局
  abstract performLayout(): void;
  layout(constraints: BoxConstraints): void;

  // 绘制
  abstract paint(context: PaintContext, offset: Offset): void;

  // 脏标记
  markNeedsLayout(): void;
  markNeedsPaint(): void;
}
```

### RenderBox

`RenderBox` 是最常用的 RenderObject 子类，使用盒模型（Box Model）：

```typescript
abstract class RenderBox extends RenderObject {
  size: Size;          // 布局后的尺寸
  offset: Offset;      // 父组件设置的位置偏移
  constraints: BoxConstraints | null;  // 父组件传递的约束
}
```

### layout 与 performLayout

```
父组件调用 child.layout(constraints)
         │
         ▼
   保存 constraints
         │
         ▼
   调用 performLayout()  ← 子类实现此方法
         │
         ▼
   设置 this.size (必须满足 constraints)
         │
         ▼
   如果有子组件，对每个子组件：
     child.layout(子约束)
     child.offset = 计算的位置
```

::: info 与 Flutter 的差异
Flutter-TUI 没有 `sizedByParent`、`performResize()` 和 `RelayoutBoundary`。所有尺寸计算都在 `performLayout()` 中完成，且布局从根节点开始。
:::

## 三棵树的协作流程

当用户调用 `setState()` 时，完整的更新流程如下：

```
1. setState() 执行回调函数修改状态
       │
2. Element.markNeedsBuild() 标记脏
       │
3. BuildOwner.scheduleBuildFor(element) 加入脏集合
       │
4. FrameScheduler 在下一帧调度 BUILD 阶段
       │
5. BuildOwner.buildScopes() 深度排序脏元素，依次重建
       │
6. Element.performRebuild() → Widget.build() 生成新 Widget 子树
       │
7. Element.updateChild() 协调子树差异
       │
8. RenderObject 更新属性 → markNeedsLayout()
       │
9. LAYOUT 阶段: PipelineOwner 从根节点布局
       │
10. PAINT 阶段: PaintContext 遍历渲染树绘制到 ScreenBuffer
       │
11. RENDER 阶段: Renderer 计算差异输出 ANSI 到终端
```

::: details 深度优先重建
BuildOwner 按元素深度排序脏元素集合（父组件先于子组件重建），这样父组件的重建可能使子组件的脏标记失效（因为子组件被整体替换了），从而避免不必要的重建。
:::

## 下一步

- [Widget 生命周期](/guide/widget-lifecycle) — 详解每种 Widget 的生命周期
- [布局系统](/guide/layout-system) — 深入盒约束和 Flex 布局
- [渲染管线](/guide/rendering-pipeline) — 了解 4 阶段帧管线
