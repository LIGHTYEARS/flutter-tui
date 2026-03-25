# CollapsibleDrawer

`来源: src/widgets/collapsible-drawer.ts`

CollapsibleDrawer 是一个可折叠/展开的抽屉组件。支持键盘（Enter/Space）和鼠标点击交互，提供折叠指示器（▶/▼）、内容截断与"查看全部"、加载动画等功能，并可嵌套使用。

## 构造函数

```typescript
new CollapsibleDrawer({
  title: Widget,
  child: Widget,
  expanded?: boolean,
  onChanged?: (expanded: boolean) => void,
  maxContentLines?: number,
  showViewAll?: boolean,
  spinner?: boolean,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | `Widget` | -- | 标题组件（必填） |
| child | `Widget` | -- | 折叠内容组件（必填） |
| expanded | `boolean` | `false` | 初始展开状态 |
| onChanged | `(expanded: boolean) => void` | -- | 展开/折叠状态变更回调 |
| maxContentLines | `number` | -- | 内容最大显示行数（超出时截断） |
| showViewAll | `boolean` | `true` | 超出 maxContentLines 时是否显示"查看全部"提示 |
| spinner | `boolean` | `false` | 是否在标题旁显示加载动画 |

## State 方法

```typescript
class CollapsibleDrawerState extends State<CollapsibleDrawer> {
  // 当前展开状态（只读）
  get expanded(): boolean;

  // 切换展开/折叠状态
  toggle(): void;
}
```

## 交互行为

### 折叠指示器

| 状态 | 指示器 |
|------|--------|
| 折叠 | ▶ |
| 展开 | ▼ |

### 键盘操作

| 按键 | 行为 |
|------|------|
| Enter | 切换展开/折叠 |
| Space | 切换展开/折叠 |

### 鼠标操作

| 操作 | 行为 |
|------|------|
| 点击标题区域 | 切换展开/折叠 |

### 加载动画

启用 `spinner` 后，标题旁会显示 Braille 字符动画（⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏），用于指示内容正在加载中。

## 基本用法

```typescript
import { CollapsibleDrawer } from 'flutter-tui/widgets/collapsible-drawer';

new CollapsibleDrawer({
  title: label('详细信息'),
  child: new Column({
    mainAxisSize: 'min',
    children: [
      label('名称: Alice'),
      label('邮箱: alice@example.com'),
      label('角色: 管理员'),
    ],
  }),
})
```

### 默认展开

```typescript
new CollapsibleDrawer({
  title: label('日志输出'),
  expanded: true,
  child: logContent,
})
```

## 进阶用法

### 监听状态变化

```typescript
new CollapsibleDrawer({
  title: label('配置项'),
  onChanged: (expanded) => {
    console.log(`抽屉${expanded ? '展开' : '折叠'}了`);
  },
  child: configContent,
})
```

### 限制内容行数

```typescript
// 最多显示 5 行，超出部分截断并显示"查看全部"
new CollapsibleDrawer({
  title: label('错误日志'),
  expanded: true,
  maxContentLines: 5,
  showViewAll: true,
  child: new Column({
    mainAxisSize: 'min',
    children: errorLogs.map(log => label(log)),
  }),
})
```

### 隐藏"查看全部"

```typescript
// 截断但不显示"查看全部"提示
new CollapsibleDrawer({
  title: label('摘要'),
  expanded: true,
  maxContentLines: 3,
  showViewAll: false,
  child: summaryContent,
})
```

### 显示加载动画

```typescript
// 内容加载中时显示 spinner
new CollapsibleDrawer({
  title: label('正在分析...'),
  expanded: true,
  spinner: true,
  child: partialResult,
})
```

### 嵌套抽屉

```typescript
new CollapsibleDrawer({
  title: label('项目结构'),
  expanded: true,
  child: new Column({
    mainAxisSize: 'min',
    children: [
      new CollapsibleDrawer({
        title: label('src/'),
        child: new Column({
          mainAxisSize: 'min',
          children: [
            label('  index.ts'),
            label('  utils.ts'),
          ],
        }),
      }),
      new CollapsibleDrawer({
        title: label('tests/'),
        child: new Column({
          mainAxisSize: 'min',
          children: [
            label('  index.test.ts'),
          ],
        }),
      }),
    ],
  }),
})
```

### 程序式控制

```typescript
// 通过 GlobalKey 获取 State 并调用 toggle
import { GlobalKey } from 'flutter-tui/core/key';

const drawerKey = new GlobalKey<CollapsibleDrawerState>();

new CollapsibleDrawer({
  key: drawerKey,
  title: label('可控抽屉'),
  child: content,
})

// 在外部切换状态
drawerKey.currentState?.toggle();
```

::: info
CollapsibleDrawer 是一个 `StatefulWidget`，内部管理展开/折叠状态。外部传入的 `expanded` 仅作为初始值，运行时状态由 CollapsibleDrawerState 管理。
:::

::: warning
嵌套 CollapsibleDrawer 时，每一层都会独立管理自己的展开状态。父级折叠时子级内容不可见，但子级状态不会被重置。
:::

## 相关组件

- [Text](/widgets/display/text) - 文本显示（常用于标题）
- [Column](/widgets/layout/row-column) - 垂直排列（常作为折叠内容）
- [SingleChildScrollView](/widgets/scroll/scroll-view) - 滚动容器（长内容场景）
