# Button

`来源: src/widgets/button.ts`

Button 是一个可按压的按钮组件，显示文本并响应按压事件。支持颜色、反色显示和自定义内边距。通过焦点系统接收键盘事件（Enter/Space 触发）。

## 构造函数

```typescript
new Button({
  text: string,
  onPressed: () => void,
  padding?: EdgeInsets,
  color?: Color,
  reverse?: boolean,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | `string` | -- | 按钮文本（必填） |
| onPressed | `() => void` | -- | 按下时的回调（必填） |
| padding | `EdgeInsets` | `EdgeInsets.symmetric({ horizontal: 2, vertical: 1 })` | 内边距 |
| color | `Color` | -- | 按钮颜色 |
| reverse | `boolean` | `false` | 是否反色显示 |

## 键盘事件处理

Button 的 `handleKeyEvent` 方法处理以下按键：

| 按键 | 操作 |
|------|------|
| `Enter` | 触发 onPressed |
| `Space` (空格) | 触发 onPressed |
| 其他 | 返回 `'ignored'` |

## 基本用法

```typescript
import { Button } from 'flutter-tui/widgets/button';
import { Color } from 'flutter-tui/core/color';

new Button({
  text: '提交',
  onPressed: () => {
    console.log('按钮被点击');
  },
})
```

### 带颜色的按钮

```typescript
new Button({
  text: '确认',
  color: Color.green,
  onPressed: () => handleConfirm(),
})
```

### 反色按钮

```typescript
new Button({
  text: '取消',
  color: Color.red,
  reverse: true,
  onPressed: () => handleCancel(),
})
```

## 进阶用法

### 按钮行

```typescript
new Row({
  mainAxisAlignment: 'center',
  children: [
    new Button({
      text: '保存',
      color: Color.green,
      onPressed: () => save(),
    }),
    new SizedBox({ width: 2 }),
    new Button({
      text: '取消',
      color: Color.red,
      onPressed: () => cancel(),
    }),
  ],
})
```

### 自定义内边距

```typescript
import { EdgeInsets } from 'flutter-tui/layout/edge-insets';

new Button({
  text: 'OK',
  padding: EdgeInsets.symmetric({ horizontal: 4, vertical: 0 }),
  onPressed: () => {},
})
```

::: info
Button 是一个 `StatelessWidget`。完整的渲染树（Container + DecoratedBox + Padding + Text）将在所有依赖组件完成后完整接入。
:::

## 相关组件

- [TextField](/widgets/input/text-field) - 文本输入
- [MouseRegion](/widgets/input/mouse-region) - 鼠标事件检测
- [Container](/widgets/layout/container) - 带装饰的容器
