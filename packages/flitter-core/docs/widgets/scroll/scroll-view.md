# SingleChildScrollView

`来源: src/widgets/scroll-view.ts`

SingleChildScrollView 是一个可滚动的容器，包裹单个子组件。当子组件的内容超出视口大小时，可以通过滚动查看隐藏部分。内部通过 Scrollable + ScrollViewport 实现。

## 构造函数

```typescript
new SingleChildScrollView({
  child: Widget,
  controller?: ScrollController,
  scrollDirection?: 'vertical' | 'horizontal',
  position?: 'top' | 'bottom',
  enableKeyboardScroll?: boolean,
  enableMouseScroll?: boolean,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| child | `Widget` | -- | 子组件（必填） |
| controller | `ScrollController` | -- | 滚动控制器（不提供则自动创建） |
| scrollDirection | `'vertical' \| 'horizontal'` | `'vertical'` | 滚动方向 |
| position | `'top' \| 'bottom'` | `'top'` | 内容锚定位置 |
| enableKeyboardScroll | `boolean` | `false` | 是否启用 vim 风格键盘导航滚动 |
| enableMouseScroll | `boolean` | `true` | 是否启用鼠标滚轮滚动 |

## 内部组件层级

```
SingleChildScrollView (StatelessWidget)
  └─ Scrollable (StatefulWidget, 管理滚动状态)
       └─ ScrollViewport (SingleChildRenderObjectWidget)
            └─ RenderScrollViewport (RenderBox, 裁剪 + 偏移绘制)
                 └─ child
```

## 布局算法

1. 在主轴方向使用**无界约束**布局子组件（允许子组件超出视口）
2. 自身尺寸受父约束限制
3. 计算 maxScrollExtent = max(0, 子组件主轴尺寸 - 视口主轴尺寸)
4. 更新 ScrollController 的 maxScrollExtent
5. 当 `position='bottom'` 且子组件小于视口时，将内容锚定到视口底部

## 绘制算法

1. 使用裁剪上下文限制绘制范围
2. 子组件偏移量 = 原始偏移量 - 滚动偏移量

## 基本用法

### 垂直滚动

```typescript
import { SingleChildScrollView } from 'flitter-core/widgets/scroll-view';

new SingleChildScrollView({
  child: new Column({
    mainAxisSize: 'min',
    children: [
      // 很多子组件，可能超出屏幕
      ...items.map(item => label(item.text)),
    ],
  }),
})
```

### 水平滚动

```typescript
new SingleChildScrollView({
  scrollDirection: 'horizontal',
  child: new Row({
    children: wideContent,
  }),
})
```

## 进阶用法

### 使用外部控制器

```typescript
import { ScrollController } from 'flitter-core/widgets/scroll-controller';

const controller = new ScrollController();

new SingleChildScrollView({
  controller: controller,
  child: longContent,
})

// 程序式滚动
controller.jumpTo(0);             // 跳到顶部
controller.scrollBy(5);           // 向下滚动 5 行
controller.jumpTo(controller.maxScrollExtent);  // 跳到底部
```

### 底部锚定（聊天/日志场景）

```typescript
// 内容不足时锚定到底部，适合聊天或日志界面
new SingleChildScrollView({
  position: 'bottom',
  controller: controller,
  child: new Column({
    mainAxisSize: 'min',
    children: logEntries.map(entry => label(entry)),
  }),
})
```

### 配合 followMode 自动滚动

```typescript
const controller = new ScrollController();
// followMode 默认开启，当新内容添加且用户在底部时自动滚动

new SingleChildScrollView({
  controller: controller,
  child: dynamicContent,
})

// 手动禁用 followMode（用户向上滚动时）
controller.disableFollowMode();

// 重新启用
controller.enableFollowMode();
```

### 键盘滚动

启用 `enableKeyboardScroll` 后，支持 vim 风格的键盘导航：

| 按键 | 行为 |
|------|------|
| `j` / `ArrowDown` | 向下滚动 1 行 |
| `k` / `ArrowUp` | 向上滚动 1 行 |
| `g` | 跳到顶部 |
| `G` | 跳到底部 |
| PageUp | 向上滚动一页 |
| PageDown | 向下滚动一页 |
| Ctrl+D | 向下滚动半页 |
| Ctrl+U | 向上滚动半页 |

```typescript
new SingleChildScrollView({
  enableKeyboardScroll: true,
  child: new Column({
    mainAxisSize: 'min',
    children: items.map(item => label(item.text)),
  }),
})
```

::: info
键盘滚动默认关闭（`enableKeyboardScroll: false`），需要显式开启。开启后组件会拦截上述按键事件，确保该组件拥有焦点时才能生效。
:::

### 鼠标滚轮滚动

`enableMouseScroll` 默认开启，支持鼠标滚轮滚动：

| 操作 | 鼠标按钮 | 行为 |
|------|---------|------|
| 滚轮向上 | button 64 | 向上滚动 3 行 |
| 滚轮向下 | button 65 | 向下滚动 3 行 |

```typescript
// 默认已启用鼠标滚轮
new SingleChildScrollView({
  child: longContent,
})

// 显式禁用鼠标滚轮
new SingleChildScrollView({
  enableMouseScroll: false,
  child: longContent,
})
```

### 同时启用键盘和鼠标滚动

```typescript
const controller = new ScrollController();

new SingleChildScrollView({
  controller: controller,
  enableKeyboardScroll: true,
  enableMouseScroll: true,
  child: new Column({
    mainAxisSize: 'min',
    children: documents.map(doc => label(doc.content)),
  }),
})
```

::: tip
如果不需要外部控制滚动，可以省略 `controller`，Scrollable 会自动创建并管理一个内部的 ScrollController。
:::

::: warning
SingleChildScrollView 在主轴方向使用无界约束布局子组件。如果子组件也是无界的（如另一个 SingleChildScrollView），可能会导致无限尺寸错误。
:::

## 相关组件

- [ScrollController](/widgets/scroll/scroll-controller) - 滚动控制器
- [Scrollbar](/widgets/scroll/scrollbar) - 滚动条组件
- [Column](/widgets/layout/row-column) - 垂直排列（常作为滚动内容）
