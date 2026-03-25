# FrameStats

`来源: src/diagnostics/frame-stats.ts`

帧性能统计收集器。使用滚动环形缓冲区存储逐帧计时数据，提供百分位统计（P50、P95、P99）和逐阶段时间分解。

## 构造函数

```typescript
new FrameStats(capacity?: number)
// 默认容量: 1024
```

`capacity` 为环形缓冲区的大小。当记录超过容量时，旧数据被覆盖。

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| capacity | `number` | 缓冲区容量 |
| frameCount | `number` | 总记录帧数（可超过 capacity） |
| lastFrameMs | `number` | 最近一帧的耗时（毫秒） |
| p50 | `number` | 中位数帧时间 |
| p95 | `number` | P95 帧时间 |
| p99 | `number` | P99 帧时间 |
| averageMs | `number` | 平均帧时间 |

## 方法

### `recordFrame(totalMs: number): void`

记录一帧的总耗时。推入环形缓冲区，满时循环覆盖。

### `recordPhase(phase: string, ms: number): void`

记录单个阶段的耗时（如 `'build'`、`'layout'`、`'paint'`、`'render'`）。每个阶段有独立的环形缓冲区。

### `getPercentile(p: number): number`

获取总帧时间的第 p 百分位值。`p` 在 [0, 100] 范围内。无数据返回 0。

```typescript
stats.getPercentile(50);  // 等同于 stats.p50
stats.getPercentile(95);  // 等同于 stats.p95
stats.getPercentile(99);  // 等同于 stats.p99
```

### `getPhasePercentile(phase: string, p: number): number`

获取指定阶段的第 p 百分位值。

```typescript
stats.getPhasePercentile('build', 50);  // build 阶段的中位数
stats.getPhasePercentile('paint', 95);  // paint 阶段的 P95
```

### `reset(): void`

重置所有数据（帧缓冲区和所有阶段缓冲区）。

## 内部实现

使用 `Float64Array` 环形缓冲区存储，百分位计算通过排序后按索引取值：

```
index = min(floor(N * p / 100), N - 1)
```

## 示例

```typescript
import { FrameStats } from './diagnostics/frame-stats';

const stats = new FrameStats(512);

// 记录帧数据
stats.recordFrame(12.5);
stats.recordPhase('build', 3.2);
stats.recordPhase('layout', 2.1);
stats.recordPhase('paint', 4.8);
stats.recordPhase('render', 2.4);

// 批量记录后查询
console.log(`帧数: ${stats.frameCount}`);
console.log(`P50: ${stats.p50.toFixed(1)}ms`);
console.log(`P95: ${stats.p95.toFixed(1)}ms`);
console.log(`P99: ${stats.p99.toFixed(1)}ms`);
console.log(`平均: ${stats.averageMs.toFixed(1)}ms`);

// 阶段分解
console.log(`Build P50: ${stats.getPhasePercentile('build', 50).toFixed(1)}ms`);
console.log(`Paint P95: ${stats.getPhasePercentile('paint', 95).toFixed(1)}ms`);

// 重置
stats.reset();
```

::: tip
环形缓冲区设计使得内存占用固定，适合长时间运行的应用。默认 1024 帧在 60fps 下约 17 秒的历史数据。
:::
