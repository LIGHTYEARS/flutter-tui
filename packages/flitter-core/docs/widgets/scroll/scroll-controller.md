# ScrollController

`来源: src/widgets/scroll-controller.ts`

ScrollController 管理滚动视图的滚动状态，包括当前偏移量、最大滚动范围和自动跟随模式。通过监听器模式通知状态变更。

## 构造函数

```typescript
new ScrollController()
```

ScrollController 无构造参数，初始偏移量为 0。

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| offset | `number` | 当前滚动偏移量（只读） |
| maxScrollExtent | `number` | 最大可滚动范围（只读） |
| atBottom | `boolean` | 是否在底部（offset >= maxScrollExtent - 1） |
| followMode | `boolean` | 是否开启自动跟随模式（只读） |

## 方法

### 滚动控制

```typescript
// 跳转到指定偏移量（自动 clamp 到 [0, maxScrollExtent]）
controller.jumpTo(offset: number): void

// 相对当前位置滚动（正值向下/向右，负值向上/向左）
controller.scrollBy(delta: number): void
```

### 跟随模式

```typescript
// 禁用跟随模式（用户手动向上滚动时调用）
controller.disableFollowMode(): void

// 重新启用跟随模式
controller.enableFollowMode(): void
```

### 内部方法

```typescript
// 更新最大滚动范围（由 RenderScrollViewport 在布局时调用）
controller.updateMaxScrollExtent(extent: number): void
```

::: info
`updateMaxScrollExtent` 是由 RenderScrollViewport 在布局过程中调用的内部方法。当 followMode 开启且当前在底部时，更新范围后会自动滚动到新的底部。
:::

### 监听器

```typescript
controller.addListener(fn: () => void): void
controller.removeListener(fn: () => void): void
controller.dispose(): void    // 移除所有监听器
```

## 跟随模式（followMode）

followMode 是 ScrollController 的核心功能之一，适用于需要自动滚动到底部的场景（如日志输出、聊天消息）。

**行为规则：**

1. followMode 默认**开启**
2. 当 `updateMaxScrollExtent` 被调用时：
   - 如果 followMode 开启 **且** 之前在底部 → 自动滚动到新的底部
   - 否则仅 clamp 当前偏移量
3. 用户向上滚动时，应调用 `disableFollowMode()` 停止自动跟随
4. 需要重新跟随时，调用 `enableFollowMode()`

## 基本用法

### 程序式滚动

```typescript
import { ScrollController } from 'flitter-core/widgets/scroll-controller';

const controller = new ScrollController();

// 滚动到顶部
controller.jumpTo(0);

// 向下滚动 10 行
controller.scrollBy(10);

// 滚动到底部
controller.jumpTo(controller.maxScrollExtent);
```

### 监听滚动变化

```typescript
const controller = new ScrollController();

controller.addListener(() => {
  console.log(`偏移量: ${controller.offset}`);
  console.log(`在底部: ${controller.atBottom}`);
});
```

## 进阶用法

### 日志自动滚动

```typescript
const logController = new ScrollController();
// followMode 默认开启

// 每次添加日志后，如果用户在底部，会自动滚动到新日志
new SingleChildScrollView({
  controller: logController,
  position: 'bottom',
  child: logContent,
})

// 用户手动向上查看历史时，停止自动跟随
function onUserScrollUp() {
  logController.disableFollowMode();
}

// 用户点击"回到底部"时，重新跟随
function onScrollToBottom() {
  logController.enableFollowMode();
  logController.jumpTo(logController.maxScrollExtent);
}
```

### 键盘驱动滚动

```typescript
function handleKeyEvent(key: string): 'handled' | 'ignored' {
  switch (key) {
    case 'ArrowUp':
      controller.scrollBy(-1);
      return 'handled';
    case 'ArrowDown':
      controller.scrollBy(1);
      return 'handled';
    case 'PageUp':
      controller.scrollBy(-10);
      return 'handled';
    case 'PageDown':
      controller.scrollBy(10);
      return 'handled';
    case 'Home':
      controller.jumpTo(0);
      return 'handled';
    case 'End':
      controller.jumpTo(controller.maxScrollExtent);
      return 'handled';
    default:
      return 'ignored';
  }
}
```

::: warning
使用完毕后需要调用 `dispose()` 释放所有监听器，避免内存泄漏。如果 ScrollController 由 Scrollable 自动创建，则会在 Scrollable 的 `dispose` 中自动释放。
:::

## 相关组件

- [SingleChildScrollView](/widgets/scroll/scroll-view) - 可滚动容器
