# Todo 应用示例

一个完整的 CRUD Todo 应用，演示列表渲染、键盘导航、输入模式切换和容器样式。

## 运行方式

```bash
bun run examples/todo-app.ts
```

## 功能说明

- 按 `a` 进入添加模式，输入标题后按 `Enter` 确认
- 按 `d` 删除选中的待办项
- 按 `Space` 切换完成/未完成状态
- 按 `j`/`ArrowDown` 向下移动选择
- 按 `k`/`ArrowUp` 向上移动选择
- 按 `Escape` 取消输入模式
- 按 `q` 退出

## 完整代码

```typescript
import {
  StatefulWidget, State, Widget, type BuildContext,
} from '../src/framework/widget';
import { Text } from '../src/widgets/text';
import { Column, Row } from '../src/widgets/flex';
import { SizedBox } from '../src/widgets/sized-box';
import { Container } from '../src/widgets/container';
import { Divider } from '../src/widgets/divider';
import { Expanded } from '../src/widgets/flexible';
import { TextField, TextEditingController } from '../src/widgets/text-field';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';
import { EdgeInsets } from '../src/layout/edge-insets';
import { BoxDecoration, Border, BorderSide } from '../src/layout/render-decorated';

// 数据模型
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

// 样式常量
const titleStyle = new TextStyle({ bold: true, foreground: Color.cyan });
const completedStyle = new TextStyle({ dim: true, strikethrough: true });
const normalStyle = new TextStyle();
const dimStyle = new TextStyle({ dim: true });
const selectedBg = Color.blue;

function txt(content: string, style?: TextStyle): Text {
  return new Text({
    text: new TextSpan({ text: content, style: style ?? normalStyle }),
  });
}

export class TodoApp extends StatefulWidget {
  readonly initialTodos: Todo[];
  readonly onQuit?: () => void;

  constructor(opts?: { initialTodos?: Todo[]; onQuit?: () => void }) {
    super();
    this.initialTodos = opts?.initialTodos ?? [];
    this.onQuit = opts?.onQuit;
  }

  createState(): State<TodoApp> {
    return new TodoAppState();
  }
}

export class TodoAppState extends State<TodoApp> {
  private _todos: Todo[] = [];
  private _selectedIndex: number = 0;
  private _inputMode: boolean = false;
  private _inputController!: TextEditingController;
  private _nextId: number = 1;

  initState(): void {
    super.initState();
    this._inputController = new TextEditingController();
    for (const todo of this.widget.initialTodos) {
      this._todos.push({ ...todo });
      if (todo.id >= this._nextId) {
        this._nextId = todo.id + 1;
      }
    }
  }

  dispose(): void {
    this._inputController.dispose();
    super.dispose();
  }

  // CRUD 操作
  addTodo(title: string): void { /* ... */ }
  deleteSelected(): void { /* ... */ }
  toggleSelected(): void { /* ... */ }
  moveDown(): void { /* ... */ }
  moveUp(): void { /* ... */ }
  enterInputMode(): void { /* ... */ }
  cancelInputMode(): void { /* ... */ }
  confirmInput(): void { /* ... */ }

  build(_context: BuildContext): Widget {
    const headerBorder = Border.all(
      new BorderSide({ color: Color.cyan, style: 'rounded' }),
    );

    const todoWidgets: Widget[] = this._todos.map((todo, i) => {
      const isSelected = i === this._selectedIndex;
      const checkbox = todo.completed ? '[x]' : '[ ]';
      const textStyle = todo.completed ? completedStyle : normalStyle;
      const itemDecoration = isSelected
        ? new BoxDecoration({ color: selectedBg })
        : new BoxDecoration();

      return new Container({
        decoration: itemDecoration,
        child: new Row({
          children: [
            txt(checkbox),
            new SizedBox({ width: 1 }),
            new Expanded({ child: txt(todo.title, textStyle) }),
          ],
        }),
      });
    });

    if (todoWidgets.length === 0) {
      todoWidgets.push(txt('  No todos yet. Press "a" to add one.', dimStyle));
    }

    const bottomBar: Widget = this._inputMode
      ? new Row({
          children: [
            txt('> '),
            new Expanded({ child: new TextField({ controller: this._inputController }) }),
          ],
        })
      : txt('a:add  d:delete  space:toggle  j/k:navigate  q:quit', dimStyle);

    return new Column({
      children: [
        new Container({
          decoration: new BoxDecoration({ border: headerBorder }),
          child: txt(' Todo App ', titleStyle),
        }),
        new Divider(),
        new Expanded({
          child: new Column({ mainAxisSize: 'min', children: todoWidgets }),
        }),
        new Divider(),
        bottomBar,
      ],
    });
  }
}
```

## 代码解析

### 数据模型

```typescript
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}
```

每个待办项包含唯一 ID、标题和完成状态。ID 通过自增计数器 `_nextId` 分配。

### 双模式状态机

TodoApp 有两种操作模式：

| 模式 | 触发 | 键盘映射 |
|------|------|----------|
| 普通模式 | 默认 | a/d/space/j/k/q |
| 输入模式 | 按 `a` | 可打印字符/Backspace/Enter/Escape |

```typescript
handleKeyEvent(key: string): 'handled' | 'ignored' {
  if (this._inputMode) {
    return this._handleInputModeKey(key);
  }
  return this._handleNormalModeKey(key);
}
```

### 选中项高亮

```typescript
const itemDecoration = isSelected
  ? new BoxDecoration({ color: selectedBg })
  : new BoxDecoration();

return new Container({
  decoration: itemDecoration,
  child: /* ... */,
});
```

当前选中项使用蓝色背景的 `BoxDecoration` 高亮显示。

### 条件性底部栏

```typescript
const bottomBar: Widget = this._inputMode
  ? new Row({
      children: [
        txt('> '),
        new Expanded({ child: new TextField({ controller: this._inputController }) }),
      ],
    })
  : txt('a:add  d:delete  space:toggle  j/k:navigate  q:quit', dimStyle);
```

底部栏根据当前模式动态切换：输入模式显示 TextField，普通模式显示快捷键提示。

### 布局结构

```
Column (全屏)
  ├─ Container (标题，带圆角边框)
  ├─ Divider
  ├─ Expanded > Column (待办列表，占满剩余空间)
  ├─ Divider
  └─ bottomBar (输入框或帮助提示)
```

使用 `Expanded` 让待办列表区域占满除标题栏、分割线和底栏之外的所有空间。

::: tip
这个示例展示了构建完整 CRUD 应用的模式：数据模型 + 状态管理 + 键盘路由 + 动态列表渲染。TextEditingController 的使用方式也为表单类应用提供了参考。
:::
