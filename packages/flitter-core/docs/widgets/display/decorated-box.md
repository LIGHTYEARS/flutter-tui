# DecoratedBox

`来源: src/widgets/decorated-box.ts`, `src/layout/render-decorated.ts`

DecoratedBox 在子组件周围绘制装饰效果（背景色、边框）。它是 Container 内部使用的底层装饰组件。

## 构造函数

```typescript
new DecoratedBox({
  decoration: BoxDecoration,
  child?: Widget,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| decoration | `BoxDecoration` | -- | 装饰配置（必填） |
| child | `Widget` | -- | 子组件 |

## BoxDecoration

```typescript
new BoxDecoration({
  color?: Color,        // 背景色
  border?: Border,      // 边框
})
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| color | `Color` | -- | 背景填充色 |
| border | `Border` | -- | 四边边框配置 |

## Border

```typescript
// 四边分别设置
new Border({
  top?: BorderSide,
  right?: BorderSide,
  bottom?: BorderSide,
  left?: BorderSide,
})

// 四边相同
Border.all(side: BorderSide): Border
```

| 属性 | 类型 | 说明 |
|------|------|------|
| top | `BorderSide` | 上边框 |
| right | `BorderSide` | 右边框 |
| bottom | `BorderSide` | 下边框 |
| left | `BorderSide` | 左边框 |
| horizontal | `number` | 左右边框宽度之和 |
| vertical | `number` | 上下边框宽度之和 |

## BorderSide

```typescript
new BorderSide({
  color?: Color,
  width?: number,
  style?: BorderStyle,
})
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| color | `Color` | `Color.defaultColor` | 边框颜色 |
| width | `number` | `1` | 边框宽度（自动取整） |
| style | `BorderStyle` | `'solid'` | 边框样式 |

### BorderStyle 取值

| 值 | 说明 | 角字符 |
|----|------|--------|
| `'solid'` | 实线边框 | `┌ ┐ └ ┘` |
| `'rounded'` | 圆角边框 | `╭ ╮ ╰ ╯` |

::: details Unicode 边框字符对照表
```
solid (实线):
  ┌──────┐
  │      │
  └──────┘

rounded (圆角):
  ╭──────╮
  │      │
  ╰──────╯

公共字符: ─ (水平线), │ (垂直线)
```
:::

## 布局算法

1. 计算边框宽度
2. 用边框宽度缩减父约束，传给子组件
3. 子组件偏移到边框内部
4. 自身尺寸 = 子组件尺寸 + 边框宽度

## 绘制算法

1. 填充背景色（在边框内部区域）
2. 绘制边框（使用 Unicode box-drawing 字符）
3. 递归绘制子组件

## 基本用法

### 简单边框

```typescript
import { DecoratedBox } from 'flitter-core/widgets/decorated-box';
import { BoxDecoration, Border, BorderSide } from 'flitter-core/layout/render-decorated';

new DecoratedBox({
  decoration: new BoxDecoration({
    border: Border.all(new BorderSide({
      color: Color.cyan,
      style: 'rounded',
    })),
  }),
  child: contentWidget,
})
```

### 背景色

```typescript
new DecoratedBox({
  decoration: new BoxDecoration({
    color: Color.blue,
  }),
  child: label('蓝色背景'),
})
```

## 进阶用法

### 带圆角边框和背景色的面板

```typescript
new DecoratedBox({
  decoration: new BoxDecoration({
    color: Color.brightBlack,
    border: Border.all(new BorderSide({
      color: Color.green,
      style: 'rounded',
    })),
  }),
  child: new Padding({
    padding: EdgeInsets.all(1),
    child: new Column({
      mainAxisSize: 'min',
      children: [
        label('面板标题', new TextStyle({ bold: true })),
        label('面板内容'),
      ],
    }),
  }),
})
```

### 无边框仅使用 BorderSide.none

```typescript
// 无边框
BorderSide.none  // 静态属性，width: 0
```

::: tip
大多数情况下推荐使用 [Container](/widgets/layout/container) 组件，它同时提供 decoration、padding、margin 等属性，比直接使用 DecoratedBox 更方便。
:::

## 相关组件

- [Container](/widgets/layout/container) - 组合式容器（内部使用 DecoratedBox）
- [Divider](/widgets/display/divider) - 水平分割线
