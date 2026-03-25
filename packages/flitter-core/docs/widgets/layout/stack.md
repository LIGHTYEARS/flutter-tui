# Stack / Positioned

`来源: src/widgets/stack.ts`

Stack 将子组件**堆叠**在一起，后添加的子组件绘制在先添加的子组件之上。配合 Positioned 可以精确控制子组件的位置。

## Stack 构造函数

```typescript
new Stack({
  children?: Widget[],
  fit?: StackFit,
  key?: Key,
})
```

## Positioned 构造函数

```typescript
new Positioned({
  child: Widget,
  left?: number,
  top?: number,
  right?: number,
  bottom?: number,
  width?: number,
  height?: number,
  key?: Key,
})
```

## Stack 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| children | `Widget[]` | `[]` | 子组件列表 |
| fit | `StackFit` | `'loose'` | 非定位子组件的约束模式 |

### StackFit 取值

| 值 | 说明 |
|----|------|
| `'loose'` | 放松约束：min=0, max=父约束 max |
| `'expand'` | 紧约束：子组件必须占满 Stack 大小 |
| `'passthrough'` | 直接传递父约束给子组件 |

## Positioned 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| child | `Widget` | -- | 子组件（必填） |
| left | `number` | -- | 距 Stack 左边缘的距离 |
| top | `number` | -- | 距 Stack 上边缘的距离 |
| right | `number` | -- | 距 Stack 右边缘的距离 |
| bottom | `number` | -- | 距 Stack 下边缘的距离 |
| width | `number` | -- | 子组件的固定宽度 |
| height | `number` | -- | 子组件的固定高度 |

## 布局算法

1. 根据 `fit` 计算非定位子组件的约束
2. 第一轮：布局所有非定位子组件，取最大宽/高作为 Stack 尺寸
3. Stack 自身尺寸受父约束限制
4. 第二轮：布局所有定位子组件
   - 若同时设置 left 和 right，宽度自动确定
   - 若设置了 width，使用固定宽度
   - 否则使用 Stack 宽度的松弛约束
   - 高度逻辑同上
5. 非定位子组件放置在 (0, 0)

## 基本用法

### 简单叠加

```typescript
import { Stack, Positioned } from 'flitter-core/widgets/stack';

// 文字叠加在背景上
new Stack({
  children: [
    backgroundWidget,            // 底层
    new Positioned({             // 右上角标签
      top: 0,
      right: 0,
      child: label('NEW'),
    }),
  ],
})
```

### 绝对定位布局

```typescript
new Stack({
  children: [
    // 背景面板
    SizedBox.expand(),
    // 左上角标题
    new Positioned({
      left: 1,
      top: 0,
      child: label('Title', new TextStyle({ bold: true })),
    }),
    // 右下角状态
    new Positioned({
      right: 1,
      bottom: 0,
      child: label('OK', new TextStyle({ foreground: Color.green })),
    }),
  ],
})
```

## 进阶用法

### 覆盖层效果

```typescript
new Stack({
  fit: 'expand',
  children: [
    // 主内容
    mainContent,
    // 通知弹窗（定位在右上角）
    new Positioned({
      top: 1,
      right: 2,
      width: 30,
      height: 5,
      child: new Container({
        decoration: new BoxDecoration({
          color: Color.red,
          border: Border.all(new BorderSide({
            color: Color.brightRed,
            style: 'rounded',
          })),
        }),
        child: label('Alert!'),
      }),
    }),
  ],
})
```

### 状态指示器

```typescript
// 在面板右下角添加状态标签
new Stack({
  children: [
    panelContent,
    new Positioned({
      right: 0,
      bottom: 0,
      child: new Container({
        decoration: new BoxDecoration({ color: Color.green }),
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: label('ONLINE'),
      }),
    }),
  ],
})
```

::: warning
Positioned 中同时设置 left+right 或 top+bottom 会强制子组件的尺寸。例如 `left: 2, right: 2` 在宽度为 40 的 Stack 中会让子组件宽度为 36。
:::

::: tip
Stack 的尺寸由非定位子组件中最大的那个决定。如果所有子组件都是 Positioned，Stack 的尺寸将为零。可以使用 `SizedBox.expand()` 作为第一个子组件来让 Stack 填满可用空间。
:::

## 相关组件

- [Container](/widgets/layout/container) - 组合式容器
- [SizedBox](/widgets/layout/sized-box) - 尺寸控制
- [Center](/widgets/layout/center) - 居中布局
