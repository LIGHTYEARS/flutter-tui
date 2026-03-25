# Widget 生命周期

Flitter 提供了三种核心 Widget 类型，每种有不同的生命周期和用途。

## StatelessWidget

无状态组件，输出完全由输入（构造参数）决定。

### 生命周期

```
constructor(opts)     创建 Widget 实例
       │
createElement()       框架调用，创建 StatelessElement
       │
build(context)        框架调用，返回子 Widget 树
```

### 示例

```typescript [greeting.ts]
import { StatelessWidget, Widget, type BuildContext } from '../src/framework/widget';
import { Text } from '../src/widgets/text';
import { TextSpan } from '../src/core/text-span';

class Greeting extends StatelessWidget {
  readonly name: string;

  constructor(opts: { name: string }) {
    super();
    this.name = opts.name;
  }

  build(_context: BuildContext): Widget {
    return new Text({
      text: new TextSpan({ text: `Hello, ${this.name}!` }),
    });
  }
}
```

::: tip 何时使用 StatelessWidget
当组件不需要内部状态，且 UI 只取决于构造参数时，使用 StatelessWidget。它更轻量，更容易测试。
:::

## StatefulWidget

有状态组件，拥有一个可变的 `State` 对象来管理内部状态。

### 生命周期

```
StatefulWidget                    State<T>
  constructor(opts)
       │
  createElement()  ──────→  StatefulElement
       │                         │
  createState()    ──────→  new State()
                                 │
                          _mount(widget, context)
                                 │
                            initState()        ← 初始化（一次性）
                                 │
                            build(context)     ← 构建子树
                                 │
                         ┌── [setState(fn)]    ← 状态变更触发重建
                         │       │
                         │   fn() 执行
                         │       │
                         │   markNeedsBuild()
                         │       │
                         └── build(context)    ← 再次构建
                                 │
                      didUpdateWidget(old)     ← 父组件重建传入新 Widget
                                 │
                            _unmount()
                                 │
                            dispose()          ← 释放资源
```

### State 的关键方法

| 方法 | 调用时机 | 用途 |
|------|---------|------|
| `initState()` | State 挂载后调用一次 | 初始化资源、注册监听器 |
| `build(context)` | 每次需要重建时 | 返回当前状态对应的 Widget 子树 |
| `didUpdateWidget(old)` | 父组件传入新 Widget 时 | 比较新旧配置，更新依赖 |
| `dispose()` | State 从树中永久移除时 | 释放资源、取消订阅 |
| `setState(fn?)` | 需要更新 UI 时手动调用 | 执行回调 + 标记脏重建 |

### 完整示例

```typescript [timer-widget.ts]
class TimerWidget extends StatefulWidget {
  readonly interval: number;
  constructor(opts: { interval: number }) { super(); this.interval = opts.interval; }
  createState(): TimerState { return new TimerState(); }
}

class TimerState extends State<TimerWidget> {
  elapsed = 0;
  private _timer: ReturnType<typeof setInterval> | null = null;

  initState(): void {
    this._timer = setInterval(() => {
      this.setState(() => { this.elapsed++; });
    }, this.widget.interval);
  }

  didUpdateWidget(oldWidget: TimerWidget): void {
    if (oldWidget.interval !== this.widget.interval) {
      if (this._timer) clearInterval(this._timer);
      this._timer = setInterval(() => {
        this.setState(() => { this.elapsed++; });
      }, this.widget.interval);
    }
  }

  dispose(): void {
    if (this._timer) clearInterval(this._timer);
    super.dispose();
  }

  build(_context: BuildContext): Widget {
    return new Text({
      text: new TextSpan({
        text: `Elapsed: ${this.elapsed}s`,
        style: new TextStyle({ foreground: Color.cyan }),
      }),
    });
  }
}
```

### setState 机制

`setState()` 是触发 UI 更新的核心方法：

```typescript
setState(fn?: () => void): void {
  if (!this._mounted) {
    throw new Error('setState() called after dispose()');
  }
  // 1. 同步执行回调修改状态
  if (fn) fn();
  // 2. 标记 Element 为脏
  this._markNeedsBuild();
}
```

::: warning 注意事项
- `setState()` 在 `dispose()` 之后调用会抛出异常
- 回调中只应包含同步状态变更，不要执行异步操作
- 不调用 `setState()` 直接修改状态不会触发重建
:::

## InheritedWidget

继承型组件，用于向子树高效传递共享数据。

### 工作原理

```
         InheritedWidget
         (持有共享数据)
              │
    ┌─────────┼─────────┐
    │         │         │
  child     child     child
  (可访问)  (可访问)   (可访问)
```

1. `InheritedWidget` 通过 `child` 将数据注入子树
2. 后代 Widget 通过 `dependOnInheritedWidgetOfExactType` 读取数据
3. 读取数据的 Widget 会自动注册依赖
4. 当 InheritedWidget 更新且 `updateShouldNotify()` 返回 `true` 时，所有依赖者重建

### 示例

```typescript [theme-widget.ts]
import {
  InheritedWidget,
  Widget,
  type BuildContext,
} from '../src/framework/widget';
import { Color } from '../src/core/color';

// 1. 定义数据
interface ThemeData {
  primaryColor: Color;
  textColor: Color;
}

// 2. 创建 InheritedWidget
class Theme extends InheritedWidget {
  readonly data: ThemeData;

  constructor(opts: { data: ThemeData; child: Widget }) {
    super({ child: opts.child });
    this.data = opts.data;
  }

  updateShouldNotify(oldWidget: Theme): boolean {
    // 数据变化时通知依赖者
    return this.data !== (oldWidget as Theme).data;
  }
}

// 3. 后代 Widget 中访问
class ThemedText extends StatelessWidget {
  build(context: BuildContext): Widget {
    // dependOnInheritedWidgetOfExactType 查找最近的 Theme 祖先
    const themeElement = (context as any)
      .dependOnInheritedWidgetOfExactType(Theme);
    const theme = (themeElement?.widget as Theme)?.data;

    return new Text({
      text: new TextSpan({
        text: 'Themed text',
        style: new TextStyle({
          foreground: theme?.textColor ?? Color.white,
        }),
      }),
    });
  }
}
```

### updateShouldNotify

| 返回值 | 行为 |
|--------|------|
| `true` | 所有调用过 `dependOnInheritedWidgetOfExactType` 的后代 Element 标记为脏 |
| `false` | 不通知依赖者，即使数据引用发生了变化 |

## Element 生命周期详解

Element 是 Widget 和 RenderObject 之间的桥梁。

### 状态转换

```
              mount()
创建 ──────────────→ mounted
                        │
              ┌─────────┤
              │         │
        markNeedsBuild  │
              │         │
        performRebuild  │
              │         │
              └─────────┤
                        │
              unmount()
mounted ──────────────→ unmounted
```

### 各类 Element 的 performRebuild

| Element 类型 | performRebuild 行为 |
|-------------|---------------------|
| `StatelessElement` | 调用 `widget.build(this)` 获取新子 Widget，通过 `updateChild()` 协调 |
| `StatefulElement` | 调用 `state.build(this)` 获取新子 Widget，通过 `updateChild()` 协调 |
| `InheritedElement` | 更新数据并通知依赖者 |
| `RenderObjectElement` | 调用 `widget.updateRenderObject()` 更新渲染对象属性 |

### BuildOwner 调度

`BuildOwner` 管理脏 Element 的重建调度：

```typescript
buildScopes(): void {
  // 1. 将脏元素按深度排序（浅层优先）
  const sorted = [...this._dirtyElements]
    .sort((a, b) => a.depth - b.depth);

  // 2. 使用 while 循环处理级联脏标记
  while (sorted.length > 0) {
    const element = sorted.shift()!;
    if (element.dirty && element.mounted) {
      element.performRebuild();
    }
    // 重建可能新增脏元素，继续循环
  }
}
```

::: info 深度优先排序的意义
父组件先于子组件重建。如果父组件的重建替换了整个子树，那么子组件的脏标记就不需要处理了，避免了冗余重建。
:::

## 下一步

- [三棵树架构](/guide/three-tree) — 回顾整体架构
- [状态管理](/guide/state-management) — 深入 ChangeNotifier 和 ValueNotifier
- [布局系统](/guide/layout-system) — 了解 RenderObject 如何布局
