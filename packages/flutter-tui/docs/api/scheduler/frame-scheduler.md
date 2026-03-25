# FrameScheduler

`来源: src/scheduler/frame-scheduler.ts`

单例帧调度器，编排按需帧执行。实现 4 阶段管线（BUILD -> LAYOUT -> PAINT -> RENDER），支持帧合并和 60fps 节奏控制。

## 常量

| 常量 | 值 | 说明 |
|------|------|------|
| `TARGET_FPS` | 60 | 目标帧率 |
| `FRAME_BUDGET_MS` | ~16.67 | 帧预算（毫秒） |

## Phase 枚举

```typescript
const Phase = {
  BUILD: 'build',
  LAYOUT: 'layout',
  PAINT: 'paint',
  RENDER: 'render',
} as const;

type Phase = 'build' | 'layout' | 'paint' | 'render';
```

管线执行顺序：`BUILD -> LAYOUT -> PAINT -> RENDER`

## FrameScheduler

### 获取实例

```typescript
const scheduler = FrameScheduler.instance;
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| isFrameScheduled | `boolean` | 帧已调度或正在执行 |
| isFrameInProgress | `boolean` | 帧正在执行中 |
| frameStats | `FrameStats` | 最后完成帧的统计（深拷贝） |
| useFramePacing | `boolean` | 是否启用帧节奏 |
| frameCallbackCount | `number` | 注册的帧回调数 |
| postFrameCallbackCount | `number` | 待执行的后帧回调数 |

### 核心方法

#### `requestFrame(): void`

请求新帧。关键行为：
- **合并**: 如果已调度，直接返回
- **帧内请求**: 如果帧正在执行，标记在当前帧后重新调度
- **测试模式**: 无节奏，通过 `setImmediate` 立即执行
- **生产模式**: 尊重 60fps 预算，必要时延迟

::: tip 完全按需驱动
没有 `setInterval` 或持续循环。帧仅在脏状态触发 `requestFrame()` 时调度。
:::

### 回调注册

#### `addFrameCallback(id, callback, phase, priority?, name?): void`

注册每阶段帧回调。

```typescript
scheduler.addFrameCallback(
  'my-build',           // 唯一 ID
  () => { /* ... */ },  // 回调函数
  'build',              // 阶段
  0,                    // 优先级（数值越小越先执行）
  'my build callback'   // 调试名称
);
```

#### `removeFrameCallback(id: string): void`

移除已注册的帧回调。

#### `addPostFrameCallback(callback, name?): void`

添加一次性后帧回调。在所有 4 个阶段完成后执行，然后被移除。如果没有帧已调度，会自动请求新帧。

### 帧执行流程

```
requestFrame()
  -> scheduleFrameExecution(delay)
    -> runScheduledFrame()
      -> executeFrame()
        -> executePhase('build')
        -> executePhase('layout')
        -> executePhase('paint')
        -> executePhase('render')
        -> executePostFrameCallbacks()
        -> recordFrameStats()
        -> 如果期间有新请求，重新调度
```

每个阶段内，回调按 priority 升序执行。单个回调出错不影响其他回调。

### 帧节奏控制

#### `disableFramePacing(): void`

禁用帧节奏（测试用）。帧立即通过 `setImmediate` 执行。

#### `enableFramePacing(): void`

启用帧节奏（生产模式）。帧按 60fps 预算调度。

### 统计

#### `resetStats(): void`

重置所有统计数据。

```typescript
interface FrameStats {
  lastFrameTime: number;
  phaseStats: Record<Phase, { lastTime: number }>;
}
```

### 静态方法

#### `FrameScheduler.reset(): void`

重置单例（用于测试）。清除所有回调、计时器和状态。

## 示例

```typescript
import { FrameScheduler, Phase } from './scheduler/frame-scheduler';

const scheduler = FrameScheduler.instance;
scheduler.disableFramePacing(); // 测试时

// 注册构建回调
scheduler.addFrameCallback('app-build', () => {
  buildOwner.buildScopes();
}, Phase.BUILD, 0, 'app build');

// 注册布局回调
scheduler.addFrameCallback('app-layout', () => {
  pipelineOwner.flushLayout();
}, Phase.LAYOUT, 0, 'app layout');

// 请求帧
scheduler.requestFrame();

// 一次性后帧回调
scheduler.addPostFrameCallback(() => {
  console.log('帧完成');
}, 'frame-done');

// 查看统计
const stats = scheduler.frameStats;
console.log(`上帧耗时: ${stats.lastFrameTime.toFixed(2)}ms`);
```
