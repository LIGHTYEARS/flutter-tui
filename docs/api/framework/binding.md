# WidgetsBinding / runApp

`来源: src/framework/binding.ts`

顶层编排器，将 BuildOwner、PipelineOwner、ScreenBuffer 和 Renderer 组合在一起。单例模式，协调完整的 4 阶段帧管线：BUILD -> LAYOUT -> PAINT -> RENDER。

## runApp

```typescript
function runApp(widget: Widget): WidgetsBinding
```

顶层入口函数。创建/获取 WidgetsBinding 单例，附加根 Widget，调度首帧。

```typescript
import { runApp } from './framework/binding';
runApp(new MyApp());
```

## WidgetsBinding

### 获取实例

```typescript
// 单例访问
const binding = WidgetsBinding.instance;
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| buildOwner | `BuildOwner` | 构建所有者 |
| pipelineOwner | `PipelineOwner` | 管道所有者 |
| rootElement | `Element \| null` | 根 Element |
| isRunning | `boolean` | 是否运行中 |

### 脏状态追踪

| 属性 | 类型 | 说明 |
|------|------|------|
| forcePaintOnNextFrame | `boolean` | 下一帧强制绘制 |
| shouldPaintCurrentFrame | `boolean` | 当前帧是否应绘制 |
| didPaintCurrentFrame | `boolean` | 当前帧是否已完成绘制 |
| pendingResizeEvent | `object \| null` | 待处理的 resize 事件 |

### 屏幕缓冲区方法

#### `getScreen(): ScreenBuffer`

获取屏幕缓冲区（惰性创建）。

#### `getRenderer(): Renderer`

获取渲染器（惰性创建）。

#### `setOutput(output: OutputWriter | null): void`

设置输出写入器。测试时传 `null`，生产环境传 `process.stdout`。

```typescript
interface OutputWriter {
  write(data: string): void;
}
```

### 生命周期方法

#### `attachRootWidget(widget: Widget): void`

附加根 Widget，创建三棵树（Widget/Element/RenderObject），设置初始约束。

#### `scheduleFrame(): void`

调度一帧。多次调用会被合并（coalesce）。

#### `drawFrame(): void`

执行完整的一帧：

```
beginFrame() -> processResizeIfPending() -> BUILD -> LAYOUT -> PAINT -> RENDER
```

#### `drawFrameSync(): void`

同步版本，用于测试。跳过 microtask 调度，立即执行。

### 帧阶段方法

#### `beginFrame(): void`

帧开始。根据脏状态决定是否需要绘制。

#### `processResizeIfPending(): void`

处理待定的 resize 事件。更新缓冲区大小和约束。

#### `paint(): void`

绘制阶段。将渲染树绘制到屏幕缓冲区。如果 `shouldPaintCurrentFrame` 为 false 则跳过。

#### `render(): void`

渲染阶段。计算 diff 并写出 ANSI 输出。仅在 paint 阶段执行后才运行。

### Resize 处理

#### `handleResize(width: number, height: number): void`

处理终端窗口大小变化。设置待处理事件并调度新帧。

#### `requestForcedPaintFrame(): void`

请求下一帧强制绘制。

### 静态方法

#### `WidgetsBinding.reset(): void`

重置单例（用于测试）。清理 BuildOwner、PipelineOwner、屏幕缓冲区和渲染器。

#### `stop(): void`

停止运行。卸载根 Element，dispose 所有资源。

## 示例

```typescript
import { runApp, WidgetsBinding } from './framework/binding';

// 启动应用
const binding = runApp(new MyApp());

// 设置终端输出
binding.setOutput(process.stdout);

// 处理终端 resize
process.stdout.on('resize', () => {
  binding.handleResize(
    process.stdout.columns,
    process.stdout.rows
  );
});

// 停止应用
binding.stop();
WidgetsBinding.reset();
```

::: tip 帧管线
WidgetsBinding 会尝试注册到 FrameScheduler。如果 FrameScheduler 不可用，自动回退到 `queueMicrotask` 调度。
:::
