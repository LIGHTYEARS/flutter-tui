# TextField

`来源: src/widgets/text-field.ts`

TextField 是一个文本输入组件（StatefulWidget），配合 TextEditingController 管理文本状态、光标位置和选区。支持占位文本、提交回调和变更回调。

## TextField 构造函数

```typescript
new TextField({
  controller?: TextEditingController,
  placeholder?: string,
  style?: TextStyle,
  onSubmit?: (text: string) => void,
  onChanged?: (text: string) => void,
  autofocus?: boolean,
  key?: Key,
})
```

## TextField 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| controller | `TextEditingController` | -- | 文本控制器（不提供则自动创建） |
| placeholder | `string` | -- | 空输入时的占位文本 |
| style | `TextStyle` | -- | 文本样式 |
| onSubmit | `(text: string) => void` | -- | 按 Enter 时的回调 |
| onChanged | `(text: string) => void` | -- | 文本变更时的回调 |
| autofocus | `boolean` | -- | 是否自动获取焦点 |

## TextEditingController

TextEditingController 继承自 `ChangeNotifier`，管理文本编辑状态。

### 构造函数

```typescript
new TextEditingController({
  text?: string,
})
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| text | `string` | 当前文本内容（可读写） |
| cursorPosition | `number` | 光标位置（可读写，自动 clamp 到有效范围） |
| selectionStart | `number` | 选区起始位置 |
| selectionEnd | `number` | 选区结束位置 |

### 编辑方法

```typescript
// 在光标位置插入文本（有选区时替换选区）
controller.insertText(text: string): void

// 删除光标前一个字符（Backspace）
controller.deleteBackward(): void

// 删除光标处的字符（Delete）
controller.deleteForward(): void
```

### 光标移动方法

```typescript
controller.moveCursorLeft(): void    // 左移一位
controller.moveCursorRight(): void   // 右移一位
controller.moveCursorHome(): void    // 移到行首
controller.moveCursorEnd(): void     // 移到行尾
```

### 其他方法

```typescript
controller.selectAll(): void   // 全选
controller.clear(): void       // 清空文本、光标和选区
controller.dispose(): void     // 释放资源
```

## 键盘事件处理

TextField 内部的 `TextFieldState` 处理以下按键：

| 按键 | 操作 |
|------|------|
| 可打印字符 | 插入到光标位置 |
| `Backspace` | 删除光标前字符 |
| `Delete` | 删除光标处字符 |
| `ArrowLeft` | 光标左移 |
| `ArrowRight` | 光标右移 |
| `Home` | 光标移到行首 |
| `End` | 光标移到行尾 |
| `Enter` | 触发 onSubmit 回调 |

## 基本用法

### 简单文本输入

```typescript
import { TextField } from 'flitter-core/widgets/text-field';

new TextField({
  placeholder: '请输入内容...',
  onSubmit: (text) => {
    console.log('提交:', text);
  },
})
```

### 使用控制器

```typescript
import { TextField, TextEditingController } from 'flitter-core/widgets/text-field';

const controller = new TextEditingController({ text: '初始值' });

new TextField({
  controller: controller,
  onChanged: (text) => {
    console.log('当前输入:', text);
  },
})
```

## 进阶用法

### Todo 应用中的输入模式

```typescript
// Todo App 中的添加输入
const inputController = new TextEditingController();

// 输入模式界面
new Row({
  children: [
    txt('> '),
    new Expanded({
      child: new TextField({
        controller: inputController,
      }),
    }),
  ],
})

// 确认输入
function confirmInput() {
  const title = inputController.text;
  addTodo(title);
  inputController.clear();
}
```

### 登录表单

```typescript
const usernameController = new TextEditingController();
const passwordController = new TextEditingController();

new Column({
  mainAxisSize: 'min',
  children: [
    new Row({
      children: [
        label('用户名: '),
        new Expanded({
          child: new TextField({
            controller: usernameController,
            placeholder: '请输入用户名',
          }),
        }),
      ],
    }),
    new SizedBox({ height: 1 }),
    new Row({
      children: [
        label('密码:   '),
        new Expanded({
          child: new TextField({
            controller: passwordController,
            placeholder: '请输入密码',
            onSubmit: () => handleLogin(),
          }),
        }),
      ],
    }),
  ],
})
```

::: tip
如果不提供 controller，TextField 会自动创建一个内部的 TextEditingController，并在组件销毁时自动释放。如果外部传入 controller，则调用方负责 dispose。
:::

::: warning
TextEditingController 是 `ChangeNotifier`，使用完毕后需要调用 `dispose()` 释放监听器，避免内存泄漏。
:::

## 相关组件

- [Button](/widgets/input/button) - 按钮组件
- [MouseRegion](/widgets/input/mouse-region) - 鼠标事件检测
- [Text](/widgets/display/text) - 只读文本显示
