# Table

`来源: src/widgets/table.ts`

Table 是一个响应式数据表格组件。接收数据数组和渲染函数，为每个数据项生成一对 `[左, 右]` Widget，支持宽模式（并排）和窄模式（堆叠）两种布局。

## 构造函数

```typescript
new Table<T>({
  items: T[],
  renderRow: (item: T) => [Widget, Widget],
  breakpoint?: number,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| items | `T[]` | -- | 数据项数组（必填） |
| renderRow | `(item: T) => [Widget, Widget]` | -- | 渲染函数，返回每行的左右两个 Widget（必填） |
| breakpoint | `number` | `50` | 宽窄模式切换的断点宽度 |

## 布局行为

Table 是一个泛型组件 `Table<T>`，根据可用宽度自动选择布局模式：

| 模式 | 条件 | 布局 |
|------|------|------|
| 宽模式 | `width >= breakpoint` | 左右两列并排显示 |
| 窄模式 | `width < breakpoint` | 上下堆叠，右侧内容缩进显示 |

## 基本用法

```typescript
import { Table } from 'flitter-core/widgets/table';

interface UserInfo {
  label: string;
  value: string;
}

const data: UserInfo[] = [
  { label: 'Name', value: 'Alice' },
  { label: 'Email', value: 'alice@example.com' },
  { label: 'Role', value: 'Admin' },
];

new Table<UserInfo>({
  items: data,
  renderRow: (item) => [
    new Text({
      text: new TextSpan({
        text: item.label,
        style: new TextStyle({ bold: true }),
      }),
    }),
    new Text({
      text: new TextSpan({ text: item.value }),
    }),
  ],
})
```

## 进阶用法

### 自定义断点

```typescript
// 在宽度 >= 80 时使用并排模式
new Table({
  items: data,
  renderRow: (item) => [
    label(item.key, new TextStyle({ dim: true })),
    label(item.value),
  ],
  breakpoint: 80,
})
```

### 带样式的数据表

```typescript
interface ServiceStatus {
  name: string;
  status: string;
  healthy: boolean;
}

const services: ServiceStatus[] = [
  { name: 'API Server', status: 'Running', healthy: true },
  { name: 'Database', status: 'Running', healthy: true },
  { name: 'Cache', status: 'Warning', healthy: false },
];

new Table<ServiceStatus>({
  items: services,
  renderRow: (svc) => [
    label(svc.name, new TextStyle({ bold: true })),
    label(svc.status, new TextStyle({
      foreground: svc.healthy ? Color.green : Color.yellow,
    })),
  ],
})
```

::: info
Table 是一个 `StatelessWidget`，其 `build()` 方法会调用 `renderRow` 为每个数据项生成 Widget 对。
:::

## 相关组件

- [Row / Column](/widgets/layout/row-column) - 基础布局
- [Expanded](/widgets/layout/expanded-flexible) - 弹性分配列宽
- [Text](/widgets/display/text) - 文本显示
