# PerformanceOverlay

`来源: src/diagnostics/perf-overlay.ts`

性能叠加层 Widget，显示帧时间统计信息。以颜色编码的方式展示 P50/P95/P99 百分位值，可选显示逐阶段时间分解。

## 严重级别阈值

| 耗时 | 颜色 | 含义 |
|------|------|------|
| < 16ms | 绿色 | 正常（60fps） |
| 16-33ms | 黄色 | 警告（30fps） |
| > 33ms | 红色 | 问题 |

## 构造函数

```typescript
new PerformanceOverlay(opts: {
  key?: Key;
  frameStats: FrameStats;
  showPerPhase?: boolean;  // 默认 false
})
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| key | `Key` | 可选的 Widget Key |
| frameStats | `FrameStats` | 帧统计数据源 |
| showPerPhase | `boolean` | 是否显示逐阶段分解 |

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| frameStats | `FrameStats` | 帧统计数据源 |
| showPerPhase | `boolean` | 是否显示逐阶段分解 |

## 渲染输出

### 默认模式

```
Frame: P50=12.5ms P95=15.2ms P99=18.7ms (1024 frames)
```

### 逐阶段模式 (`showPerPhase: true`)

```
Frame:   P50=12.5ms P95=15.2ms P99=18.7ms (1024 frames)
Build:   P50=3.2ms P95=4.1ms
Layout:  P50=2.1ms P95=3.0ms
Paint:   P50=4.8ms P95=5.5ms
Render:  P50=2.4ms P95=3.1ms
```

每个数值根据严重级别以不同颜色显示。标签和辅助文本使用暗淡样式。

## 辅助函数

### `severityStyle(ms: number): TextStyle`

```typescript
export function severityStyle(ms: number): TextStyle
```

根据帧时间返回对应的颜色样式。可在自定义性能 Widget 中复用。

## 示例

```typescript
import { PerformanceOverlay } from './diagnostics/perf-overlay';
import { FrameStats } from './diagnostics/frame-stats';

const stats = new FrameStats();

// 创建性能叠加层
const overlay = new PerformanceOverlay({
  frameStats: stats,
  showPerPhase: true,
});

// 在应用中使用
class MyApp extends StatelessWidget {
  build(context: BuildContext): Widget {
    return new Column({
      children: [
        new MyContent(),
        new PerformanceOverlay({
          frameStats: stats,
          showPerPhase: false,
        }),
      ],
    });
  }
}
```

::: tip
PerformanceOverlay 本身是一个 StatelessWidget，不会触发额外的状态管理。但由于它在每帧重建时读取最新的 FrameStats 数据，显示内容始终是最新的。
:::

::: warning
在生产环境中应仅在调试模式下显示性能叠加层，因为它本身会增加渲染开销。
:::
