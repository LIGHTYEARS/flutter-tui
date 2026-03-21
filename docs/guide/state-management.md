# 状态管理

Flutter-TUI 提供了多种状态管理模式，从简单的 `setState()` 到响应式的 `ChangeNotifier` / `ValueNotifier`，以及跨组件数据共享的 `InheritedWidget`。

## setState

`setState()` 是最基础的状态管理方式，适合组件内部的本地状态。

### 工作原理

```
setState(fn)
     │
     ├── 1. 执行 fn()，同步修改状态
     │
     ├── 2. 调用 Element.markNeedsBuild()
     │
     ├── 3. Element 加入 BuildOwner 脏集合
     │
     └── 4. 下一帧 BUILD 阶段调用 build()
```

### 使用示例

```typescript [toggle-example.ts]
class ToggleState extends State<ToggleWidget> {
  isOn = false;

  build(_context: BuildContext): Widget {
    return new Button({
      label: this.isOn ? 'ON' : 'OFF',
      onPressed: () => {
        this.setState(() => {
          this.isOn = !this.isOn;
        });
      },
    });
  }
}
```

::: warning setState 注意事项
- 回调必须是同步的，不要在回调中使用 `await`
- 只修改直接影响 `build()` 输出的状态
- 在 `dispose()` 后调用会抛出异常
- 不调用 `setState()` 直接修改变量不会触发重建
:::

## ChangeNotifier

`ChangeNotifier` 是一个可被多方监听的变更通知器，适合在多个组件之间共享状态。

### 接口

```typescript
interface Listenable {
  addListener(callback: () => void): void;
  removeListener(callback: () => void): void;
}

class ChangeNotifier implements Listenable {
  addListener(callback: () => void): void;
  removeListener(callback: () => void): void;
  get hasListeners(): boolean;
  protected notifyListeners(): void;
  dispose(): void;
}
```

### 自定义 ChangeNotifier

```typescript [counter-model.ts]
import { ChangeNotifier } from '../src/framework/listenable';

class CounterModel extends ChangeNotifier {
  private _count = 0;

  get count(): number {
    return this._count;
  }

  increment(): void {
    this._count++;
    this.notifyListeners();  // 通知所有监听者
  }

  decrement(): void {
    this._count--;
    this.notifyListeners();
  }

  reset(): void {
    this._count = 0;
    this.notifyListeners();
  }
}
```

### 在 State 中使用

```typescript [counter-view.ts]
class CounterViewState extends State<CounterView> {
  private _model = new CounterModel();
  private _onModelChange = () => this.setState(() => {});

  initState(): void {
    this._model.addListener(this._onModelChange);
  }

  dispose(): void {
    this._model.removeListener(this._onModelChange);
    this._model.dispose();
    super.dispose();
  }

  build(_context: BuildContext): Widget {
    return new Column({
      children: [
        new Text({
          text: new TextSpan({
            text: `Count: ${this._model.count}`,
          }),
        }),
        // ...按钮调用 this._model.increment() 等
      ],
    });
  }
}
```

::: tip 监听器安全
ChangeNotifier 在通知时会快照监听器集合，因此在回调中移除监听器是安全的，不会导致迭代异常。
:::

## ValueNotifier

`ValueNotifier<T>` 是 `ChangeNotifier` 的特化版本，持有单一值，当值变化时自动通知。

```typescript
class ValueNotifier<T> extends ChangeNotifier {
  get value(): T;
  set value(newValue: T);  // 值变化时自动 notifyListeners()
}
```

### 使用示例

```typescript [value-notifier-example.ts]
import { ValueNotifier } from '../src/framework/listenable';

// 创建
const counter = new ValueNotifier(0);
const isDarkMode = new ValueNotifier(false);

// 监听
counter.addListener(() => {
  console.log(`Counter changed to: ${counter.value}`);
});

// 修改（自动通知）
counter.value = 1;   // 触发监听器
counter.value = 1;   // 值相同，不触发
counter.value = 2;   // 触发监听器

// 清理
counter.dispose();
```

::: info 变化检测
ValueNotifier 使用严格不等 (`!==`) 检测变化。对于对象和数组，需要替换整个引用才能触发通知。
:::

## InheritedWidget 数据传递

`InheritedWidget` 用于在组件树中高效传递共享数据，而无需逐层传递 props。

### 模式

```
                    AppTheme (InheritedWidget)
                    (持有 ThemeData)
                         │
              ┌──────────┼──────────┐
              │          │          │
           Header     Content    Footer
              │
         HeaderTitle
         (dependOnInheritedWidgetOfExactType)
         (自动注册依赖)
```

### 完整示例

```typescript [app-config.ts]
// 1. InheritedWidget 包装
class AppConfigProvider extends InheritedWidget {
  readonly config: { appName: string; version: string };

  constructor(opts: { config: { appName: string; version: string }; child: Widget }) {
    super({ child: opts.child });
    this.config = opts.config;
  }

  updateShouldNotify(oldWidget: AppConfigProvider): boolean {
    return this.config !== (oldWidget as AppConfigProvider).config;
  }
}

// 2. 后代组件中读取
class AppTitle extends StatelessWidget {
  build(context: BuildContext): Widget {
    const element = (context as any)
      .dependOnInheritedWidgetOfExactType(AppConfigProvider);
    const config = (element?.widget as AppConfigProvider)?.config;
    return new Text({
      text: new TextSpan({ text: config?.appName ?? 'Unknown' }),
    });
  }
}

// 3. 在树的高层注入
new AppConfigProvider({
  config: { appName: 'My TUI App', version: '1.0.0' },
  child: new AppTitle(),
});
```

### 依赖追踪机制

| 步骤 | 操作 |
|------|------|
| 注册 | 后代调用 `dependOnInheritedWidgetOfExactType()`，Element 加入 InheritedElement 的依赖集合 |
| 检测 | InheritedWidget 更新时，调用 `updateShouldNotify()` |
| 通知 | 返回 `true` 时，所有依赖的 Element 标记为脏 |
| 重建 | 依赖者在下一帧 BUILD 阶段重建，获取新数据 |

## TextEditingController

`TextEditingController` 是 `ChangeNotifier` 的实际应用，管理文本输入状态。

```typescript [text-field-example.ts]
import { TextEditingController } from '../src/widgets/text-field';

class FormState extends State<FormWidget> {
  private _nameCtrl = new TextEditingController();
  private _onChange = () => this.setState(() => {});

  initState(): void {
    this._nameCtrl.addListener(this._onChange);
  }

  dispose(): void {
    this._nameCtrl.removeListener(this._onChange);
    this._nameCtrl.dispose();
    super.dispose();
  }

  build(_context: BuildContext): Widget {
    return new Column({
      children: [
        new TextField({ controller: this._nameCtrl, placeholder: 'Name' }),
        new Text({
          text: new TextSpan({ text: `Input: ${this._nameCtrl.text}` }),
        }),
      ],
    });
  }
}
```

### TextEditingController API

| 属性/方法 | 说明 |
|----------|------|
| `text` | 当前文本内容（getter/setter，变化时通知） |
| `cursorPosition` | 光标位置（getter/setter） |
| `selectionStart` / `selectionEnd` | 选区范围 |
| `insertText(text)` | 在光标位置插入文本 |
| `deleteBack()` | 删除光标前一个字符 |
| `deleteForward()` | 删除光标后一个字符 |

## ScrollController

`ScrollController` 管理滚动位置，同样基于监听器模式。

```typescript [scroll-example.ts]
import { ScrollController } from '../src/widgets/scroll-controller';

class ScrollableListState extends State<ScrollableList> {
  private _scrollCtrl = new ScrollController();

  build(_context: BuildContext): Widget {
    return new SingleChildScrollView({
      controller: this._scrollCtrl,
      child: new Column({
        children: this.items.map(item =>
          new Text({ text: new TextSpan({ text: item }) })
        ),
      }),
    });
  }
}
```

### ScrollController API

| 属性/方法 | 说明 |
|----------|------|
| `offset` | 当前滚动偏移 |
| `maxScrollExtent` | 最大可滚动范围 |
| `atBottom` | 是否在底部 |
| `followMode` | 是否自动跟随新内容 |
| `jumpTo(offset)` | 跳转到指定位置 |
| `scrollBy(delta)` | 按增量滚动 |
| `addListener(cb)` | 监听滚动变化 |

## 状态管理选型

| 场景 | 推荐方案 |
|------|---------|
| 组件内部简单状态 | `setState()` |
| 多组件共享业务逻辑 | `ChangeNotifier` |
| 单一值的响应式绑定 | `ValueNotifier` |
| 跨子树数据共享 | `InheritedWidget` |
| 文本输入控制 | `TextEditingController` |
| 滚动位置控制 | `ScrollController` |

## 下一步

- [Widget 生命周期](/guide/widget-lifecycle) — 理解 State 和 Widget 的完整生命周期
- [键盘事件](/guide/keyboard-input) — 如何响应用户输入
- [焦点管理](/guide/focus-management) — 焦点树和事件路由
