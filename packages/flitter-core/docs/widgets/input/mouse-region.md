# MouseRegion

`来源: src/widgets/mouse-region.ts`

MouseRegion 用于检测子组件范围内的鼠标事件，包括点击、进入、离开、悬停和滚动。它不改变子组件的布局和绘制行为。

## 构造函数

```typescript
new MouseRegion({
  child?: Widget,
  onClick?: (event: MouseRegionEvent) => void,
  onEnter?: (event: MouseRegionEvent) => void,
  onExit?: (event: MouseRegionEvent) => void,
  onHover?: (event: MouseRegionEvent) => void,
  onScroll?: (event: MouseRegionEvent) => void,
  cursor?: string,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| child | `Widget` | -- | 子组件 |
| onClick | `(event: MouseRegionEvent) => void` | -- | 鼠标点击回调 |
| onEnter | `(event: MouseRegionEvent) => void` | -- | 鼠标进入区域回调 |
| onExit | `(event: MouseRegionEvent) => void` | -- | 鼠标离开区域回调 |
| onHover | `(event: MouseRegionEvent) => void` | -- | 鼠标在区域内移动回调 |
| onScroll | `(event: MouseRegionEvent) => void` | -- | 鼠标滚轮回调 |
| cursor | `string` | -- | 光标样式 |

## MouseRegionEvent

```typescript
interface MouseRegionEvent {
  readonly x: number;       // 鼠标 X 坐标（列）
  readonly y: number;       // 鼠标 Y 坐标（行）
  readonly button?: number; // 鼠标按钮编号
}
```

## 事件类型

| 类型 | 触发时机 |
|------|----------|
| `click` | 在区域内点击鼠标 |
| `enter` | 鼠标从区域外进入区域内 |
| `exit` | 鼠标从区域内离开 |
| `hover` | 鼠标在区域内移动 |
| `scroll` | 在区域内滚动鼠标滚轮 |

## 基本用法

### 检测点击

```typescript
import { MouseRegion } from 'flitter-core/widgets/mouse-region';

new MouseRegion({
  onClick: (e) => {
    console.log(`点击坐标: (${e.x}, ${e.y})`);
  },
  child: label('点击这里'),
})
```

### 悬停效果

```typescript
new MouseRegion({
  onEnter: (e) => {
    // 鼠标进入，可以改变样式
    setHighlighted(true);
  },
  onExit: (e) => {
    // 鼠标离开，恢复样式
    setHighlighted(false);
  },
  child: menuItem,
})
```

## 进阶用法

### 可交互卡片

```typescript
new MouseRegion({
  onClick: (e) => selectCard(cardId),
  onEnter: () => setHover(true),
  onExit: () => setHover(false),
  child: new Container({
    decoration: new BoxDecoration({
      border: Border.all(new BorderSide({
        color: isHovered ? Color.cyan : Color.brightBlack,
        style: 'rounded',
      })),
    }),
    child: cardContent,
  }),
})
```

### 滚动区域

```typescript
new MouseRegion({
  onScroll: (e) => {
    scrollController.scrollBy(e.y > 0 ? 3 : -3);
  },
  child: scrollableContent,
})
```

::: info
MouseRegion 的布局和绘制完全委托给子组件。如果没有子组件，MouseRegion 的尺寸为零（不会接收到任何事件）。
:::

::: tip
`RenderMouseRegion` 提供了 `hasMouseListeners` 属性，用于检查是否注册了任何鼠标监听器。`handleMouseEvent(eventType, event)` 方法可以从外部派发事件。
:::

## 相关组件

- [Button](/widgets/input/button) - 按钮（内置点击处理）
- [TextField](/widgets/input/text-field) - 文本输入
