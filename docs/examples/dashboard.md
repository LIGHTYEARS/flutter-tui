# 仪表板示例

一个多面板仪表板布局，演示复杂的三栏布局、Expanded 弹性分配、Container 装饰和面板组件化。

## 运行方式

```bash
bun run examples/dashboard.ts
```

## 功能说明

- 顶部标题栏（蓝色背景，左右分散对齐）
- 三栏主内容区：系统信息(1x)、活动日志(2x)、快速统计(1x)
- 底部状态栏
- 每个面板都有独立的边框颜色和标题栏

## 完整代码

```typescript
import { runApp, WidgetsBinding } from '../src/framework/binding';
import { Column, Row } from '../src/widgets/flex';
import { Expanded } from '../src/widgets/flexible';
import { Text } from '../src/widgets/text';
import { SizedBox } from '../src/widgets/sized-box';
import { Padding } from '../src/widgets/padding';
import { Container } from '../src/widgets/container';
import { Divider } from '../src/widgets/divider';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';
import { EdgeInsets } from '../src/layout/edge-insets';
import { BoxDecoration, Border, BorderSide } from '../src/layout/render-decorated';
import type { Widget } from '../src/framework/widget';

function label(content: string, style?: TextStyle): Text {
  return new Text({
    text: new TextSpan({ text: content, style: style ?? new TextStyle() }),
  });
}

// 面板构建器
function dashboardPanel(
  title: string, borderColor: Color, children: Widget[],
): Widget {
  return new Container({
    decoration: new BoxDecoration({
      border: Border.all(new BorderSide({ color: borderColor, style: 'rounded' })),
    }),
    child: new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'stretch',
      children: [
        new Container({
          decoration: new BoxDecoration({ color: borderColor }),
          child: label(` ${title} `, new TextStyle({ bold: true })),
        }),
        new Padding({
          padding: EdgeInsets.all(1),
          child: new Column({
            mainAxisSize: 'min',
            crossAxisAlignment: 'start',
            children,
          }),
        }),
      ],
    }),
  });
}

export function buildDashboard() {
  return new Column({
    mainAxisAlignment: 'start',
    crossAxisAlignment: 'stretch',
    children: [
      // 标题栏
      buildHeader(),
      // 三栏主内容区
      new Expanded({
        child: new Padding({
          padding: EdgeInsets.symmetric({ horizontal: 1, vertical: 1 }),
          child: new Row({
            crossAxisAlignment: 'start',
            children: [
              new Expanded({ flex: 1, child: buildSystemPanel() }),
              new SizedBox({ width: 1 }),
              new Expanded({ flex: 2, child: buildActivityPanel() }),
              new SizedBox({ width: 1 }),
              new Expanded({ flex: 1, child: buildStatsPanel() }),
            ],
          }),
        }),
      }),
      // 底部状态栏
      buildFooter(),
    ],
  });
}

export const app = buildDashboard();

if (typeof process !== 'undefined' && !process.env.BUN_TEST) {
  const binding = runApp(app);
  binding.setOutput(process.stdout);
}
```

## 代码解析

### 整体布局结构

```
Column (全屏, crossAxisAlignment: 'stretch')
  ├─ Header (固定高度)
  ├─ Expanded (填充剩余空间)
  │   └─ Padding (四周留白)
  │       └─ Row (三栏)
  │           ├─ Expanded(flex:1) → System Info
  │           ├─ SizedBox(width:1) → 间距
  │           ├─ Expanded(flex:2) → Activity Log
  │           ├─ SizedBox(width:1) → 间距
  │           └─ Expanded(flex:1) → Quick Stats
  └─ Footer (固定高度)
```

### 面板组件化

```typescript
function dashboardPanel(
  title: string, borderColor: Color, children: Widget[],
): Widget {
  return new Container({
    decoration: new BoxDecoration({
      border: Border.all(new BorderSide({ color: borderColor, style: 'rounded' })),
    }),
    child: new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'stretch',
      children: [
        // 彩色标题栏
        new Container({
          decoration: new BoxDecoration({ color: borderColor }),
          child: label(` ${title} `, new TextStyle({ bold: true })),
        }),
        // 内容区
        new Padding({
          padding: EdgeInsets.all(1),
          child: new Column({ mainAxisSize: 'min', children }),
        }),
      ],
    }),
  });
}
```

`dashboardPanel` 是一个可复用的面板工厂函数，每个面板包含：
- 圆角边框（颜色由参数指定）
- 彩色标题栏（使用边框颜色作为背景）
- 带内边距的内容区

### 三栏弹性布局

```typescript
new Row({
  crossAxisAlignment: 'start',
  children: [
    new Expanded({ flex: 1, child: leftPanel }),
    new SizedBox({ width: 1 }),
    new Expanded({ flex: 2, child: centerPanel }),
    new SizedBox({ width: 1 }),
    new Expanded({ flex: 1, child: rightPanel }),
  ],
})
```

- 左右面板各占 1 份空间
- 中间面板占 2 份空间
- `SizedBox({ width: 1 })` 作为列间距
- `crossAxisAlignment: 'start'` 让面板顶部对齐

### 标题栏的 spaceBetween

```typescript
Row.spaceBetween([
  label('Dashboard', new TextStyle({ bold: true })),
  label('flutter-tui v1.0', new TextStyle({ dim: true })),
])
```

使用 `Row.spaceBetween` 静态工厂方法，让标题和版本号分别靠左和靠右对齐。

::: tip
仪表板示例展示了构建复杂多面板布局的最佳实践：使用工厂函数创建可复用的面板组件，用 Expanded + flex 比例控制栏宽，用 Container + BoxDecoration 添加视觉结构。
:::
