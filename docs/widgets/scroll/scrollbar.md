# Scrollbar

`来源: src/widgets/scrollbar.ts`

Scrollbar 是一个垂直滚动条组件，通过 Unicode 方块字符绘制滑块和轨道。支持亚字符精度（使用 8 个 Unicode 方块元素 U+2581-U+2588），可自定义颜色、字符和粗细。

## 构造函数

```typescript
new Scrollbar({
  controller?: ScrollController,
  getScrollInfo?: () => ScrollInfo,
  thickness?: number,
  trackChar?: string,
  thumbChar?: string,
  showTrack?: boolean,
  thumbColor?: Color,
  trackColor?: Color,
  subCharacterPrecision?: boolean,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| controller | `ScrollController` | -- | 滚动控制器（与 getScrollInfo 二选一） |
| getScrollInfo | `() => ScrollInfo` | -- | 滚动信息获取函数（与 controller 二选一） |
| thickness | `number` | `1` | 滚动条宽度（字符数） |
| trackChar | `string` | `'░'` | 轨道字符 |
| thumbChar | `string` | `'█'` | 滑块字符 |
| showTrack | `boolean` | `true` | 是否显示轨道背景 |
| thumbColor | `Color` | -- | 滑块颜色 |
| trackColor | `Color` | -- | 轨道颜色 |
| subCharacterPrecision | `boolean` | `true` | 是否启用亚字符精度 |

## 接口

```typescript
interface ScrollInfo {
  totalContentHeight: number;  // 内容总高度
  viewportHeight: number;      // 视口高度
  scrollOffset: number;        // 当前滚动偏移量
}
```

## 导出的渲染对象

```typescript
class RenderScrollbar extends RenderBox {
  // 计算滑块位置和高度，返回 null 表示不需要滑块
  computeThumbMetrics(viewportHeight: number): { thumbTop: number; thumbHeight: number } | null;
}
```

## 亚字符精度

启用 `subCharacterPrecision` 后，滑块的起始和结束位置使用 8 个 Unicode 方块元素实现亚字符级别的精确定位：

| 字符 | Unicode | 高度 |
|------|---------|------|
| ▁ | U+2581 | 1/8 |
| ▂ | U+2582 | 2/8 |
| ▃ | U+2583 | 3/8 |
| ▄ | U+2584 | 4/8 |
| ▅ | U+2585 | 5/8 |
| ▆ | U+2586 | 6/8 |
| ▇ | U+2587 | 7/8 |
| █ | U+2588 | 8/8 |

这使得滚动条在短内容时也能平滑地反映滚动位置，避免滑块跳跃。

## 布局行为

- 宽度：固定为 `thickness` 字符
- 高度：占满父约束的 maxHeight

## 基本用法

### 配合 ScrollController

```typescript
import { Scrollbar } from 'flutter-tui/widgets/scrollbar';
import { ScrollController } from 'flutter-tui/widgets/scroll-controller';
import { SingleChildScrollView } from 'flutter-tui/widgets/scroll-view';

const controller = new ScrollController();

new Row({
  children: [
    new Expanded({
      child: new SingleChildScrollView({
        controller: controller,
        child: longContent,
      }),
    }),
    new Scrollbar({
      controller: controller,
    }),
  ],
})
```

### 配合 getScrollInfo

```typescript
new Scrollbar({
  getScrollInfo: () => ({
    totalContentHeight: 200,
    viewportHeight: 40,
    scrollOffset: currentOffset,
  }),
})
```

## 进阶用法

### 自定义颜色

```typescript
import { Color } from 'flutter-tui/core/color';

new Scrollbar({
  controller: controller,
  thumbColor: Color.cyan,
  trackColor: Color.brightBlack,
})
```

### 自定义字符

```typescript
// 使用自定义字符绘制滚动条
new Scrollbar({
  controller: controller,
  trackChar: '·',
  thumbChar: '▓',
})
```

### 隐藏轨道

```typescript
// 仅显示滑块，不显示轨道背景
new Scrollbar({
  controller: controller,
  showTrack: false,
})
```

### 禁用亚字符精度

```typescript
// 使用整字符精度（兼容不支持 Unicode 方块字符的终端）
new Scrollbar({
  controller: controller,
  subCharacterPrecision: false,
})
```

### 加宽滚动条

```typescript
// 2 字符宽的滚动条
new Scrollbar({
  controller: controller,
  thickness: 2,
})
```

### 完整布局示例

```typescript
import { Container } from 'flutter-tui/widgets/container';

new Container({
  child: new Row({
    children: [
      new Expanded({
        child: new SingleChildScrollView({
          controller: controller,
          child: new Column({
            mainAxisSize: 'min',
            children: items.map(item => label(item.text)),
          }),
        }),
      }),
      new Scrollbar({
        controller: controller,
        thumbColor: Color.cyan,
        trackColor: Color.brightBlack,
        showTrack: true,
      }),
    ],
  }),
})
```

::: info
Scrollbar 是一个 `StatefulWidget`，会监听 ScrollController 的变化自动重绘。当内容不需要滚动时（内容高度 <= 视口高度），滑块不会绘制。
:::

::: tip
亚字符精度在大多数现代终端中都能正常工作。如果遇到字符显示异常，可以设置 `subCharacterPrecision: false` 回退到整字符模式。
:::

## 相关组件

- [SingleChildScrollView](/widgets/scroll/scroll-view) - 可滚动容器
- [ScrollController](/widgets/scroll/scroll-controller) - 滚动控制器
