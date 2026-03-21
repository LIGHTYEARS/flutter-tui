# Element

`来源: src/framework/element.ts`

Element 是 Widget 在树中的实例化表示。Element 管理 Widget 配置和 RenderObject 之间的关系。包含 Element 基类及其子类：StatelessElement、StatefulElement、InheritedElement、RenderObjectElement 等。

## Element（基类）

### 构造函数

```typescript
new Element(widget: Widget)
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| widget | `Widget` | 当前 Widget 配置 |
| parent | `Element \| undefined` | 父 Element |
| children | `Element[]` | 子 Element 列表 |
| depth | `number` | 在树中的深度（惰性计算并缓存） |
| dirty | `boolean` | 是否标记为需要重建 |
| mounted | `boolean` | 是否已挂载 |
| renderObject | `any` | 关联的 RenderObject（基类返回 `undefined`） |

### 生命周期方法

#### `markMounted(): void`

标记为已挂载。

#### `unmount(): void`

取消挂载。清理 dirty 标志、深度缓存、InheritedWidget 依赖。

::: warning
没有 `deactivate()` 阶段，Element 直接从 mounted 到 unmounted。
:::

#### `update(newWidget: Widget): void`

用新 Widget 更新此 Element。基类仅替换 widget 引用。

#### `performRebuild(): void`

执行重建。基类为空操作，子类覆盖。

### 子元素管理

#### `addChild(child: Element): void`
#### `removeChild(child: Element): void`
#### `removeAllChildren(): void`

### 树查询

#### `dependOnInheritedWidgetOfExactType(widgetType): InheritedElement | null`

向上查找指定类型的 InheritedWidget 并注册依赖。

#### `findAncestorElementOfType(elementType): Element | null`

向上查找指定类型的祖先 Element。

#### `findAncestorWidgetOfType(widgetType): Widget | null`

向上查找指定类型的祖先 Widget。

---

## StatelessElement

管理 StatelessWidget 的 Element。

### 关键行为

- `mount()`: 创建 BuildContext，调用 `rebuild()`，标记已挂载
- `rebuild()`: 调用 `widget.build(context)`，使用 `canUpdate` 比较新旧子 Widget
- `update(newWidget)`: 替换 Widget 后重建

---

## StatefulElement

管理 StatefulWidget 的 Element。

### 关键行为

- `mount()`: 创建 BuildContext，调用 `createState()`，调用 `state._mount()`，然后 `rebuild()`
- `rebuild()`: 调用 `state.build(context)`，diff 子树
- `update(newWidget)`: 调用 `state._update()`，然后重建
- `unmount()`: 卸载子元素，调用 `state._unmount()`

---

## InheritedElement

管理 InheritedWidget 的 Element，维护依赖者集合。

### 关键行为

- `update(newWidget)`: 如果 `updateShouldNotify(oldWidget)` 返回 true，调用 `notifyDependents()`
- `addDependent(element)`: 注册依赖者
- `removeDependent(element)`: 移除依赖者
- `notifyDependents()`: 标记所有依赖者为需要重建

---

## RenderObjectElement

管理 RenderObjectWidget 的 Element。

### 关键行为

- `mount()`: 调用 `widget.createRenderObject()`，attach RenderObject
- `update(newWidget)`: 调用 `widget.updateRenderObject(renderObject)`
- `unmount()`: detach 并 dispose RenderObject

---

## SingleChildRenderObjectElement

### updateChild 的四种情况

| 旧子元素 | 新 Widget | 行为 |
|---------|----------|------|
| 有 | 有 (canUpdate) | 更新旧 Element |
| 有 | 有 (不兼容) | 卸载旧，创建新 |
| 无 | 有 | 创建新 Element |
| 有 | 无 | 卸载旧 Element |
| 无 | 无 | 无操作 |

---

## MultiChildRenderObjectElement

### updateChildren 三阶段 O(N) 算法

1. **从头扫描**: 从前向后匹配 `canUpdate` 的元素
2. **从尾扫描**: 从后向前匹配 `canUpdate` 的元素
3. **中间协调**: 使用 Key 映射匹配剩余元素

---

## LeafRenderObjectElement

无子元素的 RenderObject Element，用于叶节点（如 Text 渲染对象）。

---

## BuildContextImpl

BuildContext 的具体实现。提供树查询方法。

### 额外方法

#### `findAncestorStateOfType(stateType): State | null`

向上查找指定类型的 State。

## 示例

```typescript
// Element 通常由框架自动创建，不需要手动操作
// 但理解生命周期对调试很重要

// StatefulWidget 的 Element 生命周期：
// 1. widget.createElement() -> StatefulElement
// 2. element.mount() -> createState() + initState() + build()
// 3. setState() -> markNeedsRebuild() -> state.build()
// 4. parent rebuild -> element.update(newWidget) -> didUpdateWidget()
// 5. element.unmount() -> dispose()
```
