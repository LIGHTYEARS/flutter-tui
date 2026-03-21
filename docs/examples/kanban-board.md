# 看板示例

一个三列看板(Kanban Board)布局，演示复杂的嵌套组件组合、数据驱动渲染和卡片式 UI 设计。

## 运行方式

```bash
bun run examples/kanban-board.ts
```

## 功能说明

- 三列布局：TODO、IN PROGRESS、DONE
- 每列包含多张卡片，带优先级标签和负责人
- 顶部标题栏显示卡片总数
- 底部图例栏说明优先级颜色
- 不同列使用不同的边框/标题颜色（红、黄、绿）
- 卡片内嵌套圆角边框和优先级徽章

## 完整代码

```typescript
import { runApp, WidgetsBinding } from '../src/framework/binding';
import { Column, Row } from '../src/widgets/flex';
import { Expanded } from '../src/widgets/flexible';
import { Text } from '../src/widgets/text';
import { SizedBox } from '../src/widgets/sized-box';
import { Padding } from '../src/widgets/padding';
import { Container } from '../src/widgets/container';
import { Center } from '../src/widgets/center';
import { Divider } from '../src/widgets/divider';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';
import { EdgeInsets } from '../src/layout/edge-insets';
import { BoxDecoration, Border, BorderSide } from '../src/layout/render-decorated';
import type { Widget } from '../src/framework/widget';

type Priority = 'high' | 'medium' | 'low';

interface KanbanCard {
  title: string;
  description: string;
  priority: Priority;
  assignee?: string;
}

interface KanbanColumn {
  title: string;
  color: Color;
  cards: KanbanCard[];
}

const BOARD: KanbanColumn[] = [
  {
    title: 'TODO', color: Color.red,
    cards: [
      { title: 'Add authentication', description: 'Implement JWT-based auth flow',
        priority: 'high', assignee: 'Alice' },
      { title: 'Write API docs', description: 'Document all REST endpoints',
        priority: 'medium', assignee: 'Bob' },
      // ...更多卡片
    ],
  },
  {
    title: 'IN PROGRESS', color: Color.yellow,
    cards: [
      { title: 'Refactor database layer', description: 'Migrate to connection pooling',
        priority: 'high', assignee: 'Dave' },
      // ...更多卡片
    ],
  },
  {
    title: 'DONE', color: Color.green,
    cards: [
      { title: 'Initial project setup', description: 'Scaffolded project structure',
        priority: 'low', assignee: 'Dave' },
      // ...更多卡片
    ],
  },
];

function label(content: string, style?: TextStyle): Text {
  return new Text({
    text: new TextSpan({ text: content, style: style ?? new TextStyle() }),
  });
}

function buildCard(card: KanbanCard, columnColor: Color): Widget {
  const pColor = priorityColor(card.priority);
  return new Container({
    decoration: new BoxDecoration({
      border: Border.all(new BorderSide({ color: columnColor, style: 'rounded' })),
    }),
    child: new Padding({
      padding: EdgeInsets.symmetric({ horizontal: 1 }),
      child: new Column({
        mainAxisSize: 'min',
        crossAxisAlignment: 'start',
        children: [
          new Row({
            children: [
              new Expanded({
                child: label(card.title, new TextStyle({ bold: true, foreground: Color.white })),
              }),
              new Container({
                decoration: new BoxDecoration({ color: pColor }),
                child: label(priorityLabel(card.priority), new TextStyle({ bold: true })),
              }),
            ],
          }),
          label(card.description, new TextStyle({ dim: true })),
          ...(card.assignee ? [
            new Text({
              text: new TextSpan({
                children: [
                  new TextSpan({ text: '@', style: new TextStyle({ foreground: Color.cyan }) }),
                  new TextSpan({ text: card.assignee,
                    style: new TextStyle({ foreground: Color.cyan, dim: true }) }),
                ],
              }),
            }),
          ] : []),
        ],
      }),
    }),
  });
}

export function buildKanbanBoard() {
  return new Column({
    crossAxisAlignment: 'stretch',
    children: [
      /* 标题栏 */,
      new Expanded({
        child: new Padding({
          padding: EdgeInsets.all(1),
          child: new Row({
            crossAxisAlignment: 'start',
            children: [
              new Expanded({ flex: 1, child: buildKanbanColumn(BOARD[0]!) }),
              new SizedBox({ width: 1 }),
              new Expanded({ flex: 1, child: buildKanbanColumn(BOARD[1]!) }),
              new SizedBox({ width: 1 }),
              new Expanded({ flex: 1, child: buildKanbanColumn(BOARD[2]!) }),
            ],
          }),
        }),
      }),
      /* 底部图例 */,
    ],
  });
}

if (typeof process !== 'undefined' && !process.env.BUN_TEST) {
  const binding = runApp(buildKanbanBoard());
  binding.setOutput(process.stdout);
}
```

## 代码解析

### 数据模型

```typescript
type Priority = 'high' | 'medium' | 'low';

interface KanbanCard {
  title: string;
  description: string;
  priority: Priority;
  assignee?: string;
}

interface KanbanColumn {
  title: string;
  color: Color;
  cards: KanbanCard[];
}
```

使用 TypeScript 接口定义数据结构，每个看板列有颜色主题，每张卡片有优先级和可选负责人。

### 优先级样式映射

```typescript
function priorityColor(priority: Priority): Color {
  switch (priority) {
    case 'high': return Color.red;
    case 'medium': return Color.yellow;
    case 'low': return Color.green;
  }
}
```

通过函数将优先级映射到对应颜色，用于卡片上的优先级徽章背景色。

### 卡片组件结构

```
Container (圆角边框)
  └─ Padding (水平内边距)
       └─ Column
            ├─ Row (标题 + 优先级徽章)
            │   ├─ Expanded > 标题文本
            │   └─ Container (彩色背景) > 优先级标签
            ├─ 描述文本 (dim)
            └─ @负责人 (条件渲染)
```

### 条件渲染技巧

```typescript
...(card.assignee ? [
  new Text({
    text: new TextSpan({
      children: [
        new TextSpan({ text: '@', style: ... }),
        new TextSpan({ text: card.assignee, style: ... }),
      ],
    }),
  }),
] : []),
```

使用展开运算符 `...` 配合三元表达式实现条件性添加子组件。有负责人时添加 `@username` 行，否则不添加。

### 富文本图例

```typescript
new Text({
  text: new TextSpan({
    children: [
      new TextSpan({ text: 'Priority: ', style: new TextStyle({ dim: true }) }),
      new TextSpan({ text: 'HIGH', style: new TextStyle({ foreground: Color.red, bold: true }) }),
      new TextSpan({ text: '  ' }),
      new TextSpan({ text: 'MED', style: new TextStyle({ foreground: Color.yellow, bold: true }) }),
      new TextSpan({ text: '  ' }),
      new TextSpan({ text: 'LOW', style: new TextStyle({ foreground: Color.green, bold: true }) }),
    ],
  }),
})
```

使用 TextSpan 的 `children` 数组在单个 Text 组件中混合不同颜色的文本段。

::: tip
看板示例是 flutter-tui 中最复杂的静态布局示例，展示了多层嵌套组件的组合技巧。掌握了这种面板+卡片+弹性布局的模式，可以构建任意复杂的仪表板类应用。
:::
