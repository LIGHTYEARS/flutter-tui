# Widget

`来源: src/framework/widget.ts`

Widget 是 Flutter-TUI 框架的核心构建块。Widget 描述 Element 的配置，是不可变的。包含 Widget、StatelessWidget、StatefulWidget、State、InheritedWidget 和 BuildContext。

## Widget（抽象基类）

所有 Widget 的抽象基类。Widget 描述了 Element 的配置信息。

### 构造函数

```typescript
// 不能直接实例化 Widget
abstract class Widget {
  constructor(opts?: { key?: Key })
}
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| key | `Key \| undefined` | 可选的标识键 |

### 方法

#### `abstract createElement(): Element`

创建管理此 Widget 的 Element。由具体子类实现。

#### `static canUpdate(oldWidget, newWidget): boolean`

判断旧 Element 是否可以用新 Widget 更新。条件：相同构造函数 + Key 匹配。

#### `canUpdate(other: Widget): boolean`

实例方法，委托给静态 `canUpdate`。

---

## StatelessWidget

没有可变状态的 Widget。子类必须实现 `build()` 方法。

### 构造函数

```typescript
abstract class StatelessWidget extends Widget {
  constructor(opts?: { key?: Key })
}
```

### 方法

#### `abstract build(context: BuildContext): Widget`

构建此 Widget 的子树。每次需要渲染时被调用。

```typescript
class MyLabel extends StatelessWidget {
  readonly text: string;
  constructor(text: string) {
    super();
    this.text = text;
  }
  build(context: BuildContext): Widget {
    return new Text({ text: new TextSpan({ text: this.text }) });
  }
}
```

---

## StatefulWidget

有可变状态的 Widget，状态由独立的 State 对象管理。

### 构造函数

```typescript
abstract class StatefulWidget extends Widget {
  constructor(opts?: { key?: Key })
}
```

### 方法

#### `abstract createState(): State<StatefulWidget>`

创建此 Widget 的可变 State。在 Element 挂载时调用一次。

---

## State\<T\>

StatefulWidget 的可变状态。

### 生命周期

```
_mount(widget, context)  -->  initState()
build(context)           <--  被 StatefulElement.rebuild() 调用
_update(newWidget)       -->  didUpdateWidget(oldWidget)
setState(fn?)            -->  标记 Element 为 dirty
_unmount()               -->  dispose()
```

::: warning
此框架没有 `didChangeDependencies()`、`deactivate()` 或 `reassemble()`。Element 直接从 mounted 转变为 unmounted。
:::

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| widget | `T` | 当前的 Widget 配置 |
| context | `BuildContext` | 此 State 的构建上下文 |
| mounted | `boolean` | 是否在树中 |

### 生命周期钩子

#### `initState(): void`

State 创建并挂载后调用一次。用于一次性初始化。

#### `didUpdateWidget(oldWidget: T): void`

父级用同类型的新 Widget 重建时调用。可比较新旧配置。

#### `abstract build(context: BuildContext): Widget`

构建此 State 的 Widget 子树。

#### `dispose(): void`

State 从树中永久移除时调用。用于释放资源。

#### `setState(fn?: () => void): void`

调度重建。可选的回调先同步执行以修改状态。在 `dispose()` 后调用会抛出错误。

---

## InheritedWidget

向下传播数据的 Widget。依赖此 Widget 的后代会在数据变化时重建。

### 构造函数

```typescript
abstract class InheritedWidget extends Widget {
  constructor(opts: { key?: Key; child: Widget })
}
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| child | `Widget` | 子 Widget |

### 方法

#### `abstract updateShouldNotify(oldWidget: InheritedWidget): boolean`

接收旧 Widget，返回数据是否变化。返回 `true` 时通知所有依赖者重建。

---

## BuildContext（接口）

```typescript
interface BuildContext {
  readonly widget: Widget;
  readonly mounted: boolean;
}
```

构建上下文，在 `build()` 方法中使用。提供对树结构的查询能力。

## 示例

```typescript
import { StatefulWidget, State, BuildContext } from './framework/widget';

class Counter extends StatefulWidget {
  createState() { return new CounterState(); }
}

class CounterState extends State<Counter> {
  count = 0;

  build(context: BuildContext): Widget {
    return new Text({
      text: new TextSpan({ text: `Count: ${this.count}` }),
    });
  }

  increment() {
    this.setState(() => { this.count++; });
  }
}
```
