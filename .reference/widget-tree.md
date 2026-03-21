# Widget Tree - Reverse-Engineered Code Patterns

Source: `amp-strings.txt` extracted from Amp CLI binary.

---

## Minified Name Mapping

| Minified | Flutter Equivalent | Source Line | Role |
|----------|-------------------|-------------|------|
| `Sf` | `Widget` | 529716 | Abstract base class for all widgets |
| `H3` | `StatelessWidget` | 530350 | Widget with no mutable state |
| `H8` | `StatefulWidget` | 529716 | Widget with mutable state |
| `_8` | `State<T>` | 529716 | Mutable state for StatefulWidget |
| `Bt` | `InheritedWidget` | 529716 | Widget for propagating data down the tree |
| `T$` | `Element` | 529716 | Base element (mount point in widget tree) |
| `lU0` | `StatelessElement` | 530350 | Element for StatelessWidget |
| `V_0` | `StatefulElement` | 529716 | Element for StatefulWidget |
| `Z_0` | `InheritedElement` | 529716 | Element for InheritedWidget |
| `jd` | `BuildContext` | 529716 | Context passed to build methods |
| `aJ` | `Key` | 529716 | Abstract base class for keys |
| `hg` | `ValueKey` | 529716 | Key based on a value |
| `Zs` | `GlobalKey` | 529716 | Unique key across entire widget tree |
| `yj` | `RenderObjectWidget` | 529716 | Widget that creates a RenderObject |
| `Qb` | `SingleChildRenderObjectWidget` | 529716 | RenderObjectWidget with one child |
| `An` | `MultiChildRenderObjectWidget` | 529716 | RenderObjectWidget with multiple children |
| `ef` | `LeafRenderObjectWidget` | 529716 | RenderObjectWidget with no children |
| `oj` | `RenderObjectElement` | 529716 | Element for RenderObjectWidget |
| `uv` | `SingleChildRenderObjectElement` | 529716 | Element for single-child render widget |
| `rJ` | `MultiChildRenderObjectElement` | 529716 | Element for multi-child render widget |
| `O$` | `LeafRenderObjectElement` | 529716 | Element for leaf render widget |
| `J3` | `WidgetsBinding` | 530127 | Top-level binding; owns BuildOwner + PipelineOwner |
| `NB0` | `BuildOwner` | 530126 | Manages dirty elements and build scopes |
| `UB0` | `PipelineOwner` | 530127 | Manages layout and paint pipeline |
| `c9` | `FrameScheduler` | 530126 | Schedules and executes frame callbacks |
| `Q3` | `MediaQuery` | 530127 | InheritedWidget providing screen size/capabilities |
| `nA` | `MediaQueryData` | 530127 | Data class for MediaQuery |
| `cz8` | `runApp()` | 530127 | Top-level entry point function |
| `m4` | `assert()` | 529716 | Debug assertion helper |
| `VG8` | (binding setup) | 529716 | Registers build/layout schedulers globally |
| `XG8` | (get build scheduler) | 529716 | Returns the registered build scheduler |

---

## 1. Key Classes (`aJ`, `hg`, `Zs`)

### `aJ` -- Key (abstract base)

`amp-strings.txt:529716`

```js
class aJ {
  constructor() {}
}
```

**Annotation**: Empty abstract base. All key types extend this.

### `hg` -- ValueKey

`amp-strings.txt:529716`

```js
class hg extends aJ {
  value;
  constructor(g) {
    super();
    this.value = g;
  }
  equals(g) {
    if (!(g instanceof hg)) return !1;
    return this.value === g.value;
  }
  get hashCode() {
    if (this.value === null || this.value === void 0) return 0;
    if (typeof this.value === "string") return this.stringHash(this.value);
    if (typeof this.value === "number") return this.value;
    if (typeof this.value === "boolean") return this.value ? 1 : 0;
    return this.stringHash(String(this.value));
  }
  stringHash(g) {
    let t = 0;
    for (let b = 0; b < g.length; b++) {
      let s = g.charCodeAt(b);
      t = (t << 5) - t + s;
      t = t & t;
    }
    return t;
  }
  toString() {
    return `ValueKey(${this.value})`;
  }
}
```

**Annotation**: Key identified by a value. Uses djb2 string hash. `equals()` checks both type and value.

### `Zs` -- GlobalKey

`amp-strings.txt:529716`

```js
class Zs extends aJ {
  static _registry = new Map;
  static _counter = 0;
  _id;
  _currentElement;

  constructor(g) {
    super();
    if (g) this._id = `${g}_${Zs._counter++}`;
    else this._id = `GlobalKey_${Zs._counter++}`;
    Zs._registry.set(this._id, this);
  }

  equals(g) {
    if (!(g instanceof Zs)) return !1;
    return this._id === g._id;
  }
  get hashCode() { return this.stringHash(this._id); }
  stringHash(g) { /* same djb2 hash */ }

  get currentElement() { return this._currentElement; }
  get currentWidget() { return this._currentElement?.widget; }

  _setElement(g) {
    m4(
      this._currentElement === void 0,
      `GlobalKey ${this._id} is already associated with an element. ` +
      `Each GlobalKey can only be used once in the widget tree.`
    );
    this._currentElement = g;
  }
  _clearElement() {
    this._currentElement = void 0;
    Zs._registry.delete(this._id);
  }
  toString() { return `GlobalKey(${this._id})`; }
  static _clearRegistry() { Zs._registry.clear(); Zs._counter = 0; }
}
```

**Annotation**: Global registry of keys. Each GlobalKey has a unique auto-incrementing ID. The `_setElement` / `_clearElement` pair links/unlinks the key to an element during mount/unmount. Asserts uniqueness -- a GlobalKey can only be associated with one element at a time.

---

## 2. Widget Base Class (`Sf`)

`amp-strings.txt:529716`

```js
class Sf {
  key;
  _debugData = {};

  constructor({ key: g } = {}) {
    if (this.constructor === Sf)
      throw Error("Widget is abstract and cannot be instantiated directly");
    this.key = g;
  }

  sendDebugData(g) {
    this._debugData = { ...this._debugData, ...g };
  }
  get debugData() { return this._debugData; }

  canUpdate(g) {
    if (this.constructor !== g.constructor) return !1;
    if (this.key === void 0 && g.key === void 0) return !0;
    if (this.key === void 0 || g.key === void 0) return !1;
    return this.key.equals(g.key);
  }
}
```

**Annotation**: Abstract base class for all widgets.
- Constructor enforces abstractness via `this.constructor === Sf` check.
- `canUpdate(other)` -- the canonical Flutter algorithm: same runtime type AND matching keys (both undefined, or both present and equal).
- `_debugData` is extra metadata for debug tooling.

---

## 3. Element Base Class (`T$`)

`amp-strings.txt:529716`

```js
class T$ {
  widget;
  parent;
  _children = [];
  _inheritedDependencies = new Set;
  _dirty = !1;
  _cachedDepth;
  _mounted = !1;

  constructor(g) { this.widget = g; }

  get children() { return this._children; }
  get depth() {
    if (this._cachedDepth !== void 0) return this._cachedDepth;
    let g = 0, t = this.parent;
    while (t) g++, t = t.parent;
    return this._cachedDepth = g, g;
  }
  _invalidateDepth() {
    this._cachedDepth = void 0;
    for (let g of this._children) g._invalidateDepth();
  }
  get dirty() { return this._dirty; }
  get mounted() { return this._mounted; }
  get renderObject() { return; }  // base returns undefined

  update(g) { this.widget = g; }

  addChild(g) {
    g.parent = this;
    g._invalidateDepth();
    this._children.push(g);
  }
  removeChild(g) {
    let t = this._children.indexOf(g);
    if (t !== -1) this._children.splice(t, 1), g.parent = void 0, g._invalidateDepth();
  }
  removeAllChildren() {
    for (let g of this._children) g.parent = void 0, g._invalidateDepth();
    this._children.length = 0;
  }

  markMounted() {
    if (this._mounted = !0, this.widget.key instanceof Zs)
      this.widget.key._setElement(this);
  }
  unmount() {
    if (this.widget.key instanceof Zs) this.widget.key._clearElement();
    this._mounted = !1;
    this._dirty = !1;
    this._cachedDepth = void 0;
    for (let g of this._inheritedDependencies)
      if ("removeDependent" in g) g.removeDependent(this);
    this._inheritedDependencies.clear();
  }

  markNeedsRebuild() {
    if (!this._mounted) return;
    this._dirty = !0;
    XG8().scheduleBuildFor(this);
  }

  dependOnInheritedWidgetOfExactType(g) {
    let t = this.parent;
    while (t) {
      if (t.widget.constructor === g) {
        if ("addDependent" in t && "removeDependent" in t) {
          let b = t;
          b.addDependent(this);
          this._inheritedDependencies.add(b);
        }
        return t;
      }
      t = t.parent;
    }
    return null;
  }

  findAncestorElementOfType(g) {
    let t = this.parent;
    while (t) { if (t instanceof g) return t; t = t.parent; }
    return null;
  }
  findAncestorWidgetOfType(g) {
    let t = this.parent;
    while (t) { if (t.widget instanceof g) return t.widget; t = t.parent; }
    return null;
  }
}
```

**Annotation**: Core element tree management.
- Tracks `parent`, `_children`, `_dirty`, `_mounted`, inherited dependencies.
- `depth` is lazily computed by walking up parents, cached until invalidated.
- `markMounted()` registers GlobalKey with `_setElement`.
- `unmount()` clears GlobalKey, clears inherited dependencies, resets state.
- `markNeedsRebuild()` marks dirty and schedules via the global build scheduler `XG8()`.
- `dependOnInheritedWidgetOfExactType()` walks up to find an InheritedWidget by constructor identity and registers as dependent.

---

## 4. BuildContext (`jd`)

`amp-strings.txt:529716`

```js
class jd {
  element;
  widget;
  mediaQuery;
  parent;

  constructor(g, t, b = void 0, s = null) {
    this.element = g;
    this.widget = t;
    this.mediaQuery = b;
    this.parent = s;
  }

  findAncestorElementOfType(g) {
    let t = this.element.parent;
    while (t) { if (t instanceof g) return t; t = t.parent; }
    return null;
  }
  findAncestorWidgetOfType(g) {
    return this.element.findAncestorWidgetOfType(g);
  }
  dependOnInheritedWidgetOfExactType(g) {
    return this.element.dependOnInheritedWidgetOfExactType(g);
  }
  findAncestorStateOfType(g) {
    let t = this.element.parent;
    while (t) {
      if ("state" in t && t.state instanceof g) return t.state;
      t = t.parent;
    }
    return null;
  }
  findRenderObject() {
    if ("renderObject" in this.element) {
      let g = this.element.renderObject;
      return g instanceof n_ ? g : void 0;
    }
    return;
  }
}
```

**Annotation**: The BuildContext wraps an element and provides the public API for tree traversal.
- `findAncestorStateOfType(g)` -- walks up elements looking for a StatefulElement whose `state` is `instanceof g`.
- `findRenderObject()` -- returns the nearest RenderObject if it is an instance of `n_` (RenderBox).
- `dependOnInheritedWidgetOfExactType()` delegates to the element, establishing the dependency.

---

## 5. StatelessWidget (`H3`) + StatelessElement (`lU0`)

`amp-strings.txt:530350`

### `H3` -- StatelessWidget

```js
class H3 extends Sf {
  createElement() { return new lU0(this); }
}
```

**Annotation**: Minimal. Subclasses must override `build(context)`. `createElement()` returns a `StatelessElement`.

### `lU0` -- StatelessElement

```js
class lU0 extends T$ {
  _child;
  _context;

  constructor(g) { super(g); }
  get statelessWidget() { return this.widget; }
  get child() { return this._child; }
  get renderObject() { return this._child?.renderObject; }

  mount() {
    this._context = new jd(this, this.widget);
    this.rebuild();
    this.markMounted();
  }

  unmount() {
    if (this._child) this._child.unmount(), this.removeChild(this._child), this._child = void 0;
    this._context = void 0;
    super.unmount();
  }

  update(g) {
    if (this.widget === g) return;
    if (super.update(g), this._context) this._context.widget = g;
    this.rebuild();
  }

  performRebuild() { this.rebuild(); }

  rebuild() {
    if (!this._context) throw Error("Cannot rebuild unmounted element");
    let g = this.statelessWidget.build(this._context);
    if (this._child) {
      if (this._child.widget === g) return;             // same instance, skip
      if (this._child.widget.canUpdate(g))
        this._child.update(g);                            // reuse element
      else {
        // Replace: unmount old, create new
        let t = this._child;
        let b = this.findNearestRenderObjectAncestor();
        if (b && t.renderObject) b.dropChild(t.renderObject);
        else if (!b && t.renderObject) t.renderObject.detach();
        this._child.unmount();
        this.removeChild(this._child);
        this._child = g.createElement();
        this.addChild(this._child);
        this._child.mount();
        if (b && this._child.renderObject)
          b.adoptChild(this._child.renderObject),
          this._child.renderObject.markNeedsLayout();
        else if (!b && this._child.renderObject)
          this._child.renderObject.attach(),
          this._child.renderObject.markNeedsLayout();
        if (this._child.renderObject)
          this._child.renderObject.markNeedsLayout();
      }
    } else {
      // First build
      this._child = g.createElement();
      this.addChild(this._child);
      this._child.mount();
    }
  }

  findNearestRenderObjectAncestor() {
    let g = this.parent;
    while (g) {
      if (g.renderObject) {
        if (this._child?.renderObject && g.renderObject === this._child.renderObject) {
          g = g.parent; continue;
        }
        return g.renderObject;
      }
      g = g.parent;
    }
    return;
  }
}
```

**Annotation**: Full lifecycle:
1. `mount()` -- creates BuildContext, calls `rebuild()`, marks mounted.
2. `rebuild()` -- calls `widget.build(context)`, then diffs child via `canUpdate()`.
3. `update(newWidget)` -- if widget identity changed, update context and rebuild.
4. `unmount()` -- recursively unmounts child, clears context.

The `findNearestRenderObjectAncestor` is used during child replacement to properly detach/attach RenderObjects in the render tree.

---

## 6. StatefulWidget (`H8`) + StatefulElement (`V_0`)

`amp-strings.txt:529716`

### `H8` -- StatefulWidget

```js
class H8 extends Sf {
  createElement() { return new V_0(this); }
}
```

**Annotation**: Subclasses must override `createState()`. The element manages the State lifecycle.

### `V_0` -- StatefulElement

```js
class V_0 extends T$ {
  _state;
  _child;
  _context;

  constructor(g) { super(g); }
  get statefulWidget() { return this.widget; }
  get state() { return this._state; }
  get child() { return this._child; }

  mount() {
    this._context = new jd(this, this.widget);
    this._state = this.statefulWidget.createState();
    this._state._mount(this.statefulWidget, this._context);
    this.rebuild();
    this.markMounted();
  }

  unmount() {
    if (this._child)
      this._child.unmount(), this.removeChild(this._child), this._child = void 0;
    if (this._state) this._state._unmount(), this._state = void 0;
    this._context = void 0;
    super.unmount();
  }

  update(g) {
    if (this.widget === g) return;
    if (super.update(g), this._state) this._state._update(this.statefulWidget);
    if (this._context) this._context.widget = g;
    this.rebuild();
  }

  performRebuild() { this.rebuild(); }

  rebuild() {
    if (!this._context || !this._state)
      throw Error("Cannot rebuild unmounted element");
    let g = this._state.build(this._context);
    if (this._child) {
      if (this._child.widget.canUpdate(g))
        this._child.update(g);
      else {
        let t = this._child;
        let b = this.findNearestRenderObjectAncestor();
        if (b && t.renderObject) b.dropChild(t.renderObject);
        else if (!b && t.renderObject) t.renderObject.detach();
        this._child.unmount();
        this.removeChild(this._child);
        this._child = g.createElement();
        this.addChild(this._child);
        this._child.mount();
        if (b && this._child.renderObject)
          b.adoptChild(this._child.renderObject),
          this._child.renderObject.markNeedsLayout();
        else if (!b && this._child.renderObject)
          this._child.renderObject.attach(),
          this._child.renderObject.markNeedsLayout();
        if (this._child.renderObject)
          this._child.renderObject.markNeedsLayout();
      }
    } else {
      this._child = g.createElement();
      this.addChild(this._child);
      this._child.mount();
    }
  }

  markNeedsBuild() { this.markNeedsRebuild(); }

  findNearestRenderObjectAncestor() { /* same as StatelessElement */ }

  get renderObject() { return this._child?.renderObject; }
}
```

**Annotation**: The StatefulElement orchestrates State lifecycle:
1. `mount()` -- creates context, calls `widget.createState()`, calls `state._mount()` (which runs `initState()`), then `rebuild()`.
2. `update(newWidget)` -- calls `state._update(newWidget)` which triggers `didUpdateWidget()`, then `rebuild()`.
3. `unmount()` -- unmounts child, calls `state._unmount()` (which runs `dispose()`), clears everything.
4. `rebuild()` -- calls `state.build(context)`, diffs child with `canUpdate()`.

---

## 7. State (`_8`) -- Full Lifecycle

`amp-strings.txt:529716`

```js
class _8 {
  widget;
  context;
  _mounted = !1;

  get mounted() { return this._mounted; }

  // --- Lifecycle hooks (overridable) ---
  initState() {}
  didUpdateWidget(g) {}
  dispose() {}

  // --- setState ---
  setState(g) {
    if (!this._mounted) throw Error("setState() called after dispose()");
    if (g) g();                    // execute the callback
    this._markNeedsBuild();
  }

  // --- Internal lifecycle methods ---
  _mount(g, t) {
    this.widget = g;
    this.context = t;
    this._mounted = !0;
    this.initState();
  }

  _update(g) {
    let t = this.widget;
    this.widget = g;
    this.didUpdateWidget(t);       // pass OLD widget
  }

  _unmount() {
    this._mounted = !1;
    this.dispose();
  }

  _markNeedsBuild() {
    let g = this.context.element;
    if ("markNeedsBuild" in g && typeof g.markNeedsBuild === "function")
      g.markNeedsBuild();
  }
}
```

**Annotation**: The complete State lifecycle in order:

| Step | Internal Method | User Hook Called | Description |
|------|----------------|-----------------|-------------|
| 1 | `_mount(widget, context)` | `initState()` | Called once when State is first created |
| 2 | (element rebuild) | `build(context)` | Called by StatefulElement.rebuild() |
| 3 | `_update(newWidget)` | `didUpdateWidget(oldWidget)` | Called when parent rebuilds with new widget |
| 4 | `setState(callback)` | -- | Executes callback, then schedules rebuild |
| 5 | `_unmount()` | `dispose()` | Called when element is removed from tree |

**Notable differences from Flutter**:
- No `didChangeDependencies()` -- not implemented in this framework.
- No `deactivate()` -- the element goes directly from mounted to unmounted.
- `setState()` takes an optional callback, throws if called after `dispose()`.
- `_markNeedsBuild()` delegates to the element's `markNeedsBuild()` which calls `markNeedsRebuild()`.

---

## 8. InheritedWidget (`Bt`) + InheritedElement (`Z_0`)

`amp-strings.txt:529716`

### `Bt` -- InheritedWidget

```js
class Bt extends Sf {
  child;
  constructor({ key: g, child: t }) {
    super(g !== void 0 ? { key: g } : {});
    this.child = t;
  }
  createElement() { return new Z_0(this); }
}
```

**Annotation**: Takes a single `child` widget. Subclasses must override `updateShouldNotify(oldWidget)`.

### `Z_0` -- InheritedElement

```js
class Z_0 extends T$ {
  _child;
  _dependents = new Set;

  constructor(g) { super(g); }
  get inheritedWidget() { return this.widget; }
  get child() { return this._child; }
  get renderObject() { return this._child?.renderObject; }

  mount() {
    this._child = this.inheritedWidget.child.createElement();
    this.addChild(this._child);
    this._child.mount();
    this.markMounted();
  }

  unmount() {
    if (this._child)
      this._child.unmount(), this.removeChild(this._child), this._child = void 0;
    this._dependents.clear();
    super.unmount();
  }

  update(g) {
    let t = this.inheritedWidget;  // old widget
    super.update(g);
    let b = this.inheritedWidget;  // new widget (after super.update)

    if (b.updateShouldNotify(t)) this.notifyDependents();

    if (this._child && this._child.widget.canUpdate(b.child))
      this._child.update(b.child);
    else {
      if (this._child) this._child.unmount(), this.removeChild(this._child);
      this._child = b.child.createElement();
      this.addChild(this._child);
      this._child.mount();
    }
  }

  addDependent(g) { this._dependents.add(g); }
  removeDependent(g) { this._dependents.delete(g); }

  notifyDependents() {
    for (let g of this._dependents) g.markNeedsRebuild();
  }

  performRebuild() {}
}
```

**Annotation**: The dependency notification system:
1. When `dependOnInheritedWidgetOfExactType()` is called from any element, that element is added to `_dependents`.
2. On `update()`, if `updateShouldNotify(oldWidget)` returns true, all dependents are `markNeedsRebuild()`-ed.
3. On `unmount()`, elements remove themselves from inherited dependencies (see `T$.unmount()`).

---

## 9. RenderObjectWidget Hierarchy (`yj`, `Qb`, `An`, `ef`)

`amp-strings.txt:529716`

### `yj` -- RenderObjectWidget (base)

```js
class yj extends Sf {
  constructor({ key: g } = {}) { super(g !== void 0 ? { key: g } : {}); }
  createElement() { return new oj(this); }
  updateRenderObject(g) {}
}
```

### `Qb` -- SingleChildRenderObjectWidget

```js
class Qb extends yj {
  child;
  constructor({ key: g, child: t } = {}) {
    super(g ? { key: g } : {});
    this.child = t;
  }
  createElement() { return new uv(this); }
}
```

### `An` -- MultiChildRenderObjectWidget

```js
class An extends yj {
  children;
  constructor({ key: g, children: t = [] } = {}) {
    super(g ? { key: g } : {});
    this.children = [...t];
  }
  createElement() { return new rJ(this); }
}
```

### `ef` -- LeafRenderObjectWidget

```js
class ef extends yj {
  constructor({ key: g } = {}) { super(g ? { key: g } : {}); }
  createElement() { return new O$(this); }
}
```

---

## 10. RenderObjectElement Hierarchy (`oj`, `uv`, `rJ`, `O$`)

`amp-strings.txt:529716`

### `oj` -- RenderObjectElement (base)

```js
class oj extends T$ {
  _renderObject;

  constructor(g) { super(g); }
  get renderObjectWidget() { return this.widget; }
  get renderObject() { return this._renderObject; }

  mount() {
    this._renderObject = this.renderObjectWidget.createRenderObject();
    this._renderObject.attach();
    this.markMounted();
  }
  unmount() {
    if (this._renderObject)
      this._renderObject.detach(),
      this._renderObject.dispose(),
      this._renderObject = void 0;
    super.unmount();
  }
  update(g) {
    super.update(g);
    let t = this.renderObjectWidget;
    if (this._renderObject) t.updateRenderObject(this._renderObject);
  }
  performRebuild() {}
}
```

**Annotation**: On `mount()`, creates the RenderObject and attaches it. On `update()`, calls `updateRenderObject()`. On `unmount()`, detaches and disposes the RenderObject.

### `uv` -- SingleChildRenderObjectElement

```js
class uv extends oj {
  _child;

  constructor(g) { super(g); }
  get singleChildWidget() { return this.widget; }
  get child() { return this._child; }

  mount() {
    if (super.mount(), this.singleChildWidget.child) {
      this._child = this.singleChildWidget.child.createElement();
      this.addChild(this._child);
      this._child.mount();
      if (this._child.renderObject && this.renderObject)
        this.renderObject.adoptChild(this._child.renderObject);
    }
  }

  unmount() {
    if (this._child)
      this._child.unmount(), this.removeChild(this._child), this._child = void 0;
    super.unmount();
  }

  update(g) {
    super.update(g);
    let t = this.singleChildWidget;
    if (t.child && this._child) {
      if (this._child.widget.canUpdate(t.child))
        this._child.update(t.child);
      else {
        this._child.unmount();
        this.removeChild(this._child);
        this._child = t.child.createElement();
        this.addChild(this._child);
        this._child.mount();
        if (this.renderObject) {
          this.renderObject.removeAllChildren();
          if (this._child.renderObject)
            this.renderObject.adoptChild(this._child.renderObject);
        }
      }
    } else if (t.child && !this._child) {
      this._child = t.child.createElement();
      this.addChild(this._child);
      this._child.mount();
      if (this.renderObject && this._child.renderObject)
        this.renderObject.adoptChild(this._child.renderObject);
    } else if (!t.child && this._child) {
      this._child.unmount();
      this.removeChild(this._child);
      this._child = void 0;
      if (this.renderObject) this.renderObject.removeAllChildren();
    }
  }

  performRebuild() {}
}
```

### `rJ` -- MultiChildRenderObjectElement

```js
class rJ extends oj {
  _childElements = [];

  constructor(g) { super(g); }
  get multiChildWidget() { return this.widget; }
  get children() { return this._childElements; }

  mount() {
    super.mount();
    for (let g of this.multiChildWidget.children) {
      let t = g.createElement();
      this._childElements.push(t);
      this.addChild(t);
      t.mount();
      if (t.renderObject && this.renderObject)
        this.renderObject.adoptChild(t.renderObject);
    }
  }

  unmount() {
    for (let g of this._childElements)
      g.unmount(), this.removeChild(g);
    this._childElements.length = 0;
    super.unmount();
  }

  update(g) {
    super.update(g);
    let t = this.multiChildWidget;
    this.updateChildren(this._childElements, [...t.children]);
  }

  updateChildren(oldElements, newWidgets) {
    // Two-pointer diffing algorithm:
    // 1. Match from front while canUpdate is true
    // 2. Match from back while canUpdate is true
    // 3. Handle middle section with key-based matching + fallback
    // Uses createChildElement() for new, deactivateChild() for removed
    // ... (full algorithm handles keyed + unkeyed children)
  }

  createChildElement(g) {
    let t = g.createElement();
    return this.addChild(t), t.mount(), t;
  }
  deactivateChild(g) {
    g.unmount();
    this.removeChild(g);
  }
  performRebuild() {}
}
```

**Annotation**: The `updateChildren` method implements an O(n) two-pointer diffing algorithm similar to Flutter's. It:
1. Matches children from the front while `canUpdate()` is true.
2. Matches children from the back while `canUpdate()` is true.
3. For the remaining middle section, uses a key-based Map for O(1) lookup.
4. Falls back to sequential search for unkeyed children.
5. `deactivateChild()` unmounts and removes elements that are no longer needed.

### `O$` -- LeafRenderObjectElement

```js
class O$ extends oj {
  constructor(g) { super(g); }
  get leafWidget() { return this.widget; }
  performRebuild() {}
}
```

---

## 11. BuildOwner (`NB0`)

`amp-strings.txt:530126`

```js
class NB0 {
  _dirtyElements = new Set;
  _stats = {
    totalRebuilds: 0,
    elementsRebuiltThisFrame: 0,
    maxElementsPerFrame: 0,
    averageElementsPerFrame: 0,
    lastBuildTime: 0,
    averageBuildTime: 0,
    maxBuildTime: 0
  };
  _buildTimes = [];
  _elementsPerFrame = [];

  constructor() {}

  scheduleBuildFor(g) {
    if (this._dirtyElements.has(g)) return;
    this._dirtyElements.add(g);
    c9.instance.requestFrame();
  }

  buildScopes() {
    if (this._dirtyElements.size === 0) return;
    let g = performance.now(), t = 0;
    try {
      while (this._dirtyElements.size > 0) {
        let b = Array.from(this._dirtyElements);
        this._dirtyElements.clear();
        b.sort((s, a) => s.depth - a.depth);  // depth-first ordering
        for (let s of b) {
          if (s.dirty) {
            try {
              s.performRebuild();
              s._dirty = !1;
              t++;
            } catch (a) {
              V.error("Element rebuild error:", {
                error: a instanceof Error ? a.message : String(a),
                stack: a instanceof Error ? a.stack : void 0,
                elementType: s.widget.constructor.name,
                elementDebugLabel: s.widget.debugLabel
              });
              s._dirty = !1;
            }
          }
        }
      }
    } finally {
      this.recordBuildStats(performance.now() - g, t);
    }
  }

  recordBuildStats(time, count) { /* rolling average over 60 frames */ }
  get dirtyElements() { /* ... */ }
  get hasDirtyElements() { return this._dirtyElements.size > 0; }
  dispose() { this._dirtyElements.clear(); }
}
```

**Annotation**: Manages the build phase.
- `scheduleBuildFor(element)` adds element to dirty set and requests a frame.
- `buildScopes()` processes ALL dirty elements sorted by depth (parent before child). Uses a `while` loop because rebuilds can dirty new elements.
- Stats tracking records rolling averages over 60 frames.

---

## 12. PipelineOwner (`UB0`)

`amp-strings.txt:530127`

```js
class UB0 {
  _nodesNeedingPaint = new Set;
  _rootRenderObject = null;
  _rootConstraints = null;

  constructor() {}

  requestLayout(g) {
    if (!c9.instance.isFrameInProgress) c9.instance.requestFrame();
  }
  requestPaint(g) {
    if (this._nodesNeedingPaint.has(g)) return;
    this._nodesNeedingPaint.add(g);
    if (!c9.instance.isFrameInProgress) c9.instance.requestFrame();
  }
  setRootRenderObject(g) { this._rootRenderObject = g; }
  updateRootConstraints(g) {
    let t = new l3(0, g.width, 0, g.height);
    let b = !this._rootConstraints ||
            this._rootConstraints.maxWidth !== t.maxWidth ||
            this._rootConstraints.maxHeight !== t.maxHeight;
    if (this._rootConstraints = t, b && this._rootRenderObject &&
        "markNeedsLayout" in this._rootRenderObject)
      this._rootRenderObject.markNeedsLayout();
  }
  flushLayout() {
    let g = !1;
    if (this._rootRenderObject && this._rootConstraints &&
        "needsLayout" in this._rootRenderObject &&
        this._rootRenderObject.needsLayout) {
      if ("layout" in this._rootRenderObject &&
          typeof this._rootRenderObject.layout === "function")
        this._rootRenderObject.layout(this._rootConstraints), g = !0;
    }
    return g;
  }
  flushPaint() {
    if (this._nodesNeedingPaint.size === 0) return;
    try {
      for (let g of this._nodesNeedingPaint)
        if (g.needsPaint) g._needsPaint = !1;
    } finally {
      this._nodesNeedingPaint.clear();
    }
  }
  dispose() { this._nodesNeedingPaint.clear(); }
  removeFromQueues(g) { this._nodesNeedingPaint.delete(g); }
}
```

**Annotation**: Manages layout and paint pipeline. `flushLayout()` runs layout from root with constraints. `flushPaint()` clears dirty paint flags.

---

## 13. FrameScheduler (`c9`)

`amp-strings.txt:530126`

```js
class c9 {
  static _instance;
  _frameCallbacks = new Map;
  _postFrameCallbacks = [];
  _frameScheduled = !1;
  _frameInProgress = !1;
  _executingPostFrameCallbacks = !1;
  _pendingFrameTimer = null;
  _lastFrameTimestamp = 0;
  _useFramePacing = !jz8();  // disabled in test mode
  _stats = { /* per-phase timing stats */ };

  static get instance() { return c9._instance ??= new c9; }

  requestFrame() {
    if (this._frameScheduled) return;
    if (this._frameInProgress) { this._frameScheduled = !0; return; }
    if (!this._useFramePacing) {
      this._frameScheduled = !0;
      this.scheduleFrameExecution(0);
      return;
    }
    let g = performance.now(), t = this._lastFrameTimestamp;
    let b = g - t;
    if (t === 0 || b >= Oy) {  // Oy = frame budget (likely ~16.67ms)
      this._frameScheduled = !0;
      this.scheduleFrameExecution(0);
      return;
    }
    let s = Math.max(0, Oy - b);
    this._frameScheduled = !0;
    this.scheduleFrameExecution(s);
  }

  scheduleFrameExecution(g) {
    if (g <= 0) { setImmediate(() => this.runScheduledFrame()); return; }
    this._pendingFrameTimer = setTimeout(() => this.runScheduledFrame(), g);
  }

  executeFrame() {
    if (this._frameInProgress) return;
    let g = performance.now();
    this._frameScheduled = !1;
    this._frameInProgress = !0;
    try {
      for (let t of ["build", "layout", "paint", "render"])
        this.executePhase(t);
      this.executePostFrameCallbacks();
    } catch (t) {
      V.error("Frame execution error:", t instanceof Error ? t.message : String(t));
    } finally {
      this.recordFrameStats(performance.now() - g);
      this._lastFrameTimestamp = g;
      this._frameInProgress = !1;
      if (this._frameScheduled) { /* schedule next frame */ }
    }
  }

  addFrameCallback(name, callback, phase, priority, debugName) { /* ... */ }
  removeFrameCallback(name) { /* ... */ }
  addPostFrameCallback(callback, name) { /* ... */ }
}
```

**Annotation**: The frame scheduler implements frame pacing (with `Oy` as the target frame time). Frame execution phases run in strict order: **build -> layout -> paint -> render**. Post-frame callbacks run after all phases. Uses `setImmediate` for immediate frames or `setTimeout` for paced frames.

---

## 14. WidgetsBinding (`J3`) -- Full Implementation

`amp-strings.txt:530127`

```js
class J3 {
  static _instance;
  frameScheduler = c9.instance;
  buildOwner;
  pipelineOwner;
  focusManager = er.instance;
  mouseManager = Pg.instance;
  frameStatsOverlay = new BB0;
  tui = new wB0;
  rootElement;
  isRunning = !1;
  rootElementMountedCallback;
  forcePaintOnNextFrame = !1;
  shouldPaintCurrentFrame = !1;
  didPaintCurrentFrame = !1;
  eventCallbacks = { key: [], mouse: [], paste: [] };
  keyInterceptors = [];

  static get instance() { return J3._instance ??= new J3; }

  constructor() {
    this.buildOwner = new NB0;
    this.pipelineOwner = new UB0;

    // Register frame phases
    this.frameScheduler.addFrameCallback("frame-start",
      () => this.beginFrame(), "build", -2000, "WidgetsBinding.beginFrame");
    this.frameScheduler.addFrameCallback("resize",
      () => this.processResizeIfPending(), "build", -1000,
      "WidgetsBinding.processResizeIfPending");
    this.frameScheduler.addFrameCallback("build",
      () => { this.buildOwner.buildScopes(); this.updateRootRenderObject(); },
      "build", 0, "BuildOwner.buildScopes");
    this.frameScheduler.addFrameCallback("layout",
      () => {
        if (this.updateRootConstraints(), this.pipelineOwner.flushLayout())
          this.shouldPaintCurrentFrame = !0;
      }, "layout", 0, "PipelineOwner.flushLayout");
    this.frameScheduler.addFrameCallback("paint",
      () => this.paint(), "paint", 0, "WidgetsBinding.paint");
    this.frameScheduler.addFrameCallback("render",
      () => this.render(), "render", 0, "WidgetsBinding.render");

    // Register global schedulers for element tree
    VG8(
      { scheduleBuildFor: (g) => this.buildOwner.scheduleBuildFor(g) },
      {
        requestLayout: (g) => this.pipelineOwner.requestLayout(g),
        requestPaint: (g) => this.pipelineOwner.requestPaint(g),
        removeFromQueues: (g) => this.pipelineOwner.removeFromQueues(g)
      }
    );
    this.setupErrorHandler();
  }

  async runApp(g) {
    if (this.isRunning) throw Error("App is already running");
    try {
      this.isRunning = !0;
      this.tui.init();
      this.tui.enterAltScreen();

      // Lazy-load focus and idle tracking
      let { initFocusTracking: t } = await Promise.resolve().then(() => EE0);
      t(this.tui);
      let { initIdleTracking: b } = await Promise.resolve().then(() => (BE0(), wE0));
      b(this.tui);

      await this.tui.waitForCapabilities(1000);

      // Terminal color detection
      let s = this.tui.getQueryParser();
      let a = s?.getRgbColors();
      if (a) this.updateRgbColors(a);
      if (s) s.setColorPaletteChangeCallback(() => {
        let p = s.getRgbColors();
        if (p) this.updateRgbColors(p);
      });

      // Create MediaQuery wrapper and mount root
      let r = this.createMediaQueryWrapper(g);
      this.rootElement = r.createElement();
      this.rootElement.mount();

      if (this.rootElementMountedCallback)
        this.rootElementMountedCallback(this.rootElement);

      // Set up render pipeline
      let m = this.rootElement.renderObject;
      if (!m && this.rootElement.children.length > 0)
        m = this.rootElement.children[0]?.renderObject;
      if (m) this.pipelineOwner.setRootRenderObject(m), this.updateRootConstraints();
      if (this.rootElement.renderObject)
        this.mouseManager.setRootRenderObject(this.rootElement.renderObject);

      this.mouseManager.setTui(this.tui);
      this.setupEventHandlers();
      this.frameScheduler.requestFrame();
      await this.waitForExit();
    } finally {
      await this.cleanup();
    }
  }

  stop() {
    this.isRunning = !1;
    if (this.exitResolve) this.exitResolve(), this.exitResolve = null;
  }

  beginFrame() {
    this.didPaintCurrentFrame = !1;
    this.shouldPaintCurrentFrame =
      this.forcePaintOnNextFrame ||
      this.buildOwner.hasDirtyElements ||
      this.pipelineOwner.hasNodesNeedingLayout ||
      this.pipelineOwner.hasNodesNeedingPaint ||
      this.tui.getScreen().requiresFullRefresh;
    this.forcePaintOnNextFrame = !1;
  }

  paint() {
    if (!this.shouldPaintCurrentFrame) return;
    if (this.pipelineOwner.flushPaint(), !this.rootElement) return;
    let g = this.rootElement.renderObject;
    if (!g && this.rootElement.children.length > 0)
      g = this.rootElement.children[0]?.renderObject;
    if (!g) return;
    try {
      let t = this.tui.getScreen();
      t.clear();
      t.clearCursor();
      this.renderRenderObject(g, t, 0, 0);
      this.frameStatsOverlay.recordStats(/*...*/);
      this.frameStatsOverlay.draw(t, /*...*/);
      this.didPaintCurrentFrame = !0;
    } catch (t) { V.error("Paint error:", t); }
  }

  render() {
    if (!this.didPaintCurrentFrame) return;
    try { this.tui.render(); } catch (g) { V.error("Render error:", g); }
  }

  createMediaQueryWrapper(g) {
    let t = this.tui.getCapabilities() || xF();
    let b = this.tui.getSize();
    let s = new nA(b, t);
    return new Q3({ data: s, child: g });
  }

  async cleanup() {
    this.isRunning = !1;
    if (this.rootElement) this.rootElement.unmount(), this.rootElement = void 0;
    this.buildOwner.dispose();
    this.pipelineOwner.dispose();
    this.focusManager.dispose();
    this.mouseManager.dispose();
    // Remove all frame callbacks
    for (let name of ["frame-start","resize","build","layout","paint","render"])
      this.frameScheduler.removeFrameCallback(name);
    await this.tui.deinit();
  }
}
```

**Annotation**: The WidgetsBinding is the top-level singleton that orchestrates everything:
- Owns `BuildOwner` and `PipelineOwner`.
- Registers frame callbacks in priority order: frame-start (-2000) > resize (-1000) > build (0) > layout (0) > paint (0) > render (0).
- `runApp()` initializes TUI, enters alt screen, detects terminal capabilities, wraps root widget in `MediaQuery`, mounts the element tree, and enters the event loop.
- `beginFrame()` determines whether painting is needed this frame.
- `paint()` clears screen, paints from root RenderObject, then overlays frame stats.
- `render()` flushes the screen buffer to the terminal.
- `cleanup()` unmounts root element, disposes all managers, restores terminal state.

---

## 15. runApp Entry Point (`cz8`)

`amp-strings.txt:530127`

```js
async function cz8(g, t) {
  let b = J3.instance;
  if (t?.onRootElementMounted)
    b.setRootElementMountedCallback(t.onRootElementMounted);
  await b.runApp(g);
}
```

**Annotation**: The public `runApp()` function. Takes a widget and optional config with `onRootElementMounted` callback. Delegates to `WidgetsBinding.instance.runApp()`.

---

## 16. MediaQuery (`Q3`) -- Example InheritedWidget

`amp-strings.txt:530127`

```js
class Q3 extends Bt {
  data;
  constructor({ key: g, data: t, child: b }) {
    super(g !== void 0 ? { key: g, child: b } : { child: b });
    this.data = t;
  }
  updateShouldNotify(g) {
    return this.data !== g.data ||
           this.data.size.width !== g.data.size.width ||
           this.data.size.height !== g.data.size.height ||
           this.data.capabilities !== g.data.capabilities;
  }
  static of(g) {
    let t = g.dependOnInheritedWidgetOfExactType(Q3);
    if (t) return t.widget.data;
    throw Error("MediaQuery not found in context. Wrap your app with MediaQuery widget.");
  }
  static sizeOf(g) { return Q3.of(g).size; }
  static capabilitiesOf(g) { return Q3.of(g).capabilities; }
}
```

**Annotation**: Concrete InheritedWidget providing terminal size and capabilities. Notifies dependents when size or capabilities change. Follows the standard `.of(context)` pattern for access.

---

## 17. Global Scheduler Binding Functions

`amp-strings.txt:529716`

```js
var lF = null, dF = null;

function VG8(g, t) {
  lF = g;   // build scheduler: { scheduleBuildFor }
  dF = t;   // render scheduler: { requestLayout, requestPaint, removeFromQueues }
}

function XG8() {
  if (!lF) {
    if (H_0()) return { scheduleBuildFor: () => {} };  // test mode noop
    throw Error("Build scheduler not initialized. Make sure WidgetsBinding is created.");
  }
  return lF;
}

function xH() {
  if (!dF) {
    if (H_0()) return { requestLayout: () => {}, requestPaint: () => {}, removeFromQueues: () => {} };
    throw Error("Paint scheduler not initialized. Make sure WidgetsBinding is created.");
  }
  return dF;
}
```

**Annotation**: Module-level globals that bridge elements to the binding's BuildOwner and PipelineOwner. `VG8` is called during `J3` construction to register the schedulers. `XG8` and `xH` are called by elements when they need to schedule builds or paints.

---

## 18. Assert Helper (`m4`)

`amp-strings.txt:529716`

```js
function m4(g, ...t) {
  if (!g) {
    let b = t.join(" "), s = Error(b);
    V.error("TUI Assert failed", {
      assertion: b, stackTrace: s.stack, meta: t
    });
    let a = process.env.AMP_DEBUG, r = process.env.VITEST;
    if (a || r) {
      if (r) throw s;
      zG8();  // restore terminal
      console.error("FATAL TUI ERROR:", b);
      console.error("Stack trace:", s.stack);
      console.error("Context:", { meta: t });
      process.exit(1);
    }
  }
}
```

**Annotation**: Debug assertion function. In `AMP_DEBUG` mode, crashes hard with full stack trace. In `VITEST` mode, throws to fail the test. In production, logs and continues.

---

## 19. Error Strings Catalog

All error strings related to the widget lifecycle found in the binary:

| Error String | Location | Context |
|-------------|----------|---------|
| `"Widget is abstract and cannot be instantiated directly"` | 529716 | `Sf` constructor -- prevents direct instantiation |
| `"setState() called after dispose()"` | 529716 | `_8.setState()` -- thrown when calling setState on unmounted State |
| `"Cannot rebuild unmounted element"` | 529716, 530350 | `lU0.rebuild()`, `V_0.rebuild()` -- thrown when rebuild is attempted without context |
| `"Build scheduler not initialized. Make sure WidgetsBinding is created."` | 529716 | `XG8()` -- thrown when element tries to schedule build before binding exists |
| `"Paint scheduler not initialized. Make sure WidgetsBinding is created."` | 529716 | `xH()` -- thrown when render object tries to schedule paint before binding exists |
| `"App is already running"` | 530127 | `J3.runApp()` -- prevents double invocation |
| `"MediaQuery not found in context. Wrap your app with MediaQuery widget."` | 530127 | `Q3.of()` -- thrown when no MediaQuery ancestor found |
| `"GlobalKey ${id} is already associated with an element..."` | 529716 | `Zs._setElement()` -- assertion, not throw; enforces single-use |
| `"Child must be a RenderBox"` | 530350 | RenderObject child validation |
| `"renderObject must be an instance of ContainerRenderObject"` | 530350 | Container validation |

---

## 20. Complete Widget Lifecycle Flow

### Mount Phase (initial creation)

```
runApp(widget)
  |
  v
WidgetsBinding.runApp(widget)
  |-- createMediaQueryWrapper(widget) -> Q3(InheritedWidget)
  |-- rootWidget.createElement() -> Element
  |-- element.mount()
       |-- [StatelessElement] creates BuildContext, calls rebuild()
       |-- [StatefulElement] creates BuildContext, calls createState(),
       |   state._mount() -> initState(), then rebuild()
       |-- [InheritedElement] creates child element, mounts it
       |-- [RenderObjectElement] calls createRenderObject(), attach()
       |-- element.markMounted()
            |-- [if GlobalKey] key._setElement(this)
```

### Rebuild Phase (state change)

```
state.setState(callback)
  |-- callback() executes
  |-- state._markNeedsBuild()
       |-- element.markNeedsBuild()
            |-- element.markNeedsRebuild()
                 |-- element._dirty = true
                 |-- XG8().scheduleBuildFor(element)
                      |-- BuildOwner._dirtyElements.add(element)
                      |-- FrameScheduler.requestFrame()

[next frame]
FrameScheduler.executeFrame()
  |-- beginFrame() -- decide if painting needed
  |-- BuildOwner.buildScopes()
  |    |-- sort dirty elements by depth
  |    |-- for each: element.performRebuild()
  |         |-- [Stateful/Stateless] rebuild()
  |              |-- state.build(context) / widget.build(context)
  |              |-- diff child via canUpdate()
  |              |-- if canUpdate: child.update(newWidget)
  |              |-- else: unmount old, createElement new, mount new
  |-- PipelineOwner.flushLayout()
  |-- paint()
  |-- render()
```

### Update Phase (parent rebuilt with new widget)

```
parentElement.rebuild()
  |-- old child canUpdate(new widget)? YES
       |-- child.update(newWidget)
            |-- [StatefulElement] state._update(newWidget)
            |    |-- oldWidget = state.widget
            |    |-- state.widget = newWidget
            |    |-- state.didUpdateWidget(oldWidget)
            |-- rebuild()
```

### Unmount Phase (widget removed from tree)

```
element.unmount()
  |-- [StatefulElement]
  |    |-- child.unmount() (recursive)
  |    |-- state._unmount()
  |    |    |-- state._mounted = false
  |    |    |-- state.dispose()
  |    |-- context = undefined
  |-- [StatelessElement]
  |    |-- child.unmount() (recursive)
  |    |-- context = undefined
  |-- [InheritedElement]
  |    |-- child.unmount() (recursive)
  |    |-- _dependents.clear()
  |-- [RenderObjectElement]
  |    |-- renderObject.detach()
  |    |-- renderObject.dispose()
  |-- [Base Element]
       |-- if GlobalKey: key._clearElement()
       |-- _mounted = false
       |-- clear inherited dependencies
```

---

## 21. InheritedWidget Dependency System

```
[Consumer Element]                      [InheritedElement (Z_0)]
       |                                        |
       |-- dependOnInheritedWidgetOfExactType(Type)
       |        |-- walks up parent chain        |
       |        |-- finds matching InheritedElement
       |        |-- calls element.addDependent(this) --> _dependents.add(consumer)
       |        |-- consumer._inheritedDependencies.add(inheritedElement)
       |        |                                |
       |        v                                |
       |   returns InheritedElement              |
       |                                        |
[When InheritedWidget updates]                  |
       |-- inheritedElement.update(newWidget)    |
            |-- if updateShouldNotify(old)       |
                 |-- notifyDependents()          |
                      |-- for each dependent:    |
                           dependent.markNeedsRebuild()
```

---

## Notes on Differences from Flutter

1. **No `didChangeDependencies()`**: The `_8` (State) class only has `initState`, `didUpdateWidget`, `dispose`, and `setState`. There is no `didChangeDependencies` callback.

2. **No `deactivate()`**: Elements go directly from mounted to unmounted. There is no intermediate "deactivated" state.

3. **No `reassemble()`**: No hot reload support (this is a compiled binary).

4. **Simplified BuildContext**: `jd` (BuildContext) is a concrete class, not an interface. It stores `element`, `widget`, `mediaQuery`, and `parent` directly.

5. **Render pipeline phases**: The frame executes in strict order: `build -> layout -> paint -> render`, managed by the FrameScheduler with priority-sorted callbacks.

6. **TUI-specific**: The binding manages terminal I/O (alt screen, keyboard, mouse, paste events), screen clearing, and terminal capability detection. The paint phase writes directly to a terminal screen buffer.

7. **Frame pacing**: Uses `setImmediate` for immediate frames and `setTimeout` for paced frames, with a target frame budget stored in `Oy`.
