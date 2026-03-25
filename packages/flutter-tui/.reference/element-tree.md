# Element Tree Reconciliation -- Reverse-Engineered from Amp CLI

> Source: `/home/gem/home/tmp/amp-strings.txt`, line 529716 (single bundled line)
> All framework classes appear on this one enormous line; byte offsets vary.

---

## Table of Contents

1. [Identifier Map](#identifier-map)
2. [Widget Base Class (Sf)](#1-widget-base-class-sf)
3. [Key Hierarchy (aJ, hg, Zs)](#2-key-hierarchy-aj-hg-zs)
4. [Element Base Class (T$)](#3-element-base-class-t)
5. [BuildContext (jd)](#4-buildcontext-jd)
6. [State Class (_8)](#5-state-class-_8)
7. [Widget Subclasses](#6-widget-subclasses)
8. [Element Subclasses -- RenderObject branch](#7-element-subclasses--renderobject-branch)
9. [Element Subclasses -- Component branch](#8-element-subclasses--component-branch)
10. [InheritedElement (Z_0)](#9-inheritedelement-z_0)
11. [ParentDataElement (iU0)](#10-parentdataelement-iu0)
12. [updateChildren() Algorithm (rJ)](#11-updatechildren-algorithm-rj)
13. [BuildOwner (NB0)](#12-buildowner-nb0)
14. [FrameScheduler (c9)](#13-framescheduler-c9)
15. [WidgetsBinding Frame Pipeline](#14-widgetsbinding-frame-pipeline)
16. [RenderObject Base (n_)](#15-renderobject-base-n_)
17. [Debug Inspector (Mu)](#16-debug-inspector-mu)

---

## Identifier Map

| Minified | Flutter Equivalent         | Type             |
|----------|---------------------------|------------------|
| `Sf`     | `Widget`                  | Abstract base    |
| `T$`     | `Element`                 | Abstract base    |
| `aJ`     | `Key`                     | Abstract base    |
| `hg`     | `ValueKey`                | Key subclass     |
| `Zs`     | `GlobalKey`               | Key subclass     |
| `jd`     | `BuildContext`            | Context wrapper  |
| `_8`     | `State`                   | State base       |
| `H3`     | `StatelessWidget`         | Widget subclass  |
| `lU0`    | `StatelessElement`        | Element subclass |
| `H8`     | `StatefulWidget`          | Widget subclass  |
| `V_0`    | `StatefulElement`         | Element subclass |
| `Bt`     | `InheritedWidget`         | Widget subclass  |
| `Z_0`    | `InheritedElement`        | Element subclass |
| `yj`     | `RenderObjectWidget`      | Widget subclass  |
| `Qb`     | `SingleChildRenderObjectWidget` | Widget subclass |
| `An`     | `MultiChildRenderObjectWidget`  | Widget subclass |
| `ef`     | `LeafRenderObjectWidget`  | Widget subclass  |
| `oj`     | `RenderObjectElement`     | Element subclass |
| `uv`     | `SingleChildRenderObjectElement` | Element subclass |
| `rJ`     | `MultiChildRenderObjectElement`  | Element subclass |
| `O$`     | `LeafRenderObjectElement` | Element subclass |
| `R_`     | `ParentDataWidget`        | Widget subclass  |
| `iU0`    | `ParentDataElement`       | Element subclass |
| `NB0`    | `BuildOwner`              | Build scheduler  |
| `c9`     | `FrameScheduler`          | Frame scheduler  |
| `n_`     | `RenderObject`            | Render base      |
| `j9`     | `RenderBox`               | Render subclass  |
| `Mu`     | `WidgetInspector` / DevToolsServer | Debug inspector |
| `XG8()`  | `getBuildScheduler()`     | Global accessor  |
| `xH()`   | `getPaintScheduler()`     | Global accessor  |
| `VG8()`  | `initSchedulers()`        | Initialization   |

---

## 1. Widget Base Class (Sf)

```js
class Sf {
  key;          // aJ | undefined
  _debugData = {};

  constructor({ key } = {}) {
    if (this.constructor === Sf)
      throw Error("Widget is abstract and cannot be instantiated directly");
    this.key = key;
  }

  sendDebugData(g) { this._debugData = { ...this._debugData, ...g }; }
  get debugData() { return this._debugData; }

  // --- THE CRITICAL canUpdate CHECK ---
  // Determines whether an existing Element can be reused with a new Widget.
  // Two conditions: same constructor (runtimeType) AND matching keys.
  canUpdate(newWidget) {
    if (this.constructor !== newWidget.constructor) return false;
    if (this.key === undefined && newWidget.key === undefined) return true;
    if (this.key === undefined || newWidget.key === undefined) return false;
    return this.key.equals(newWidget.key);
  }
}
```

**Annotation**: This is the JS equivalent of Flutter's `Widget.canUpdate(oldWidget, newWidget)`.
The logic is identical: same runtimeType + same key (or both null) = can update in place.

---

## 2. Key Hierarchy (aJ, hg, Zs)

### Key base (aJ)

```js
class aJ {
  constructor() {}
}
```

### ValueKey (hg)

```js
class hg extends aJ {
  value;

  constructor(value) {
    super();
    this.value = value;
  }

  equals(other) {
    if (!(other instanceof hg)) return false;
    return this.value === other.value;
  }

  get hashCode() {
    if (this.value === null || this.value === undefined) return 0;
    if (typeof this.value === "string") return this.stringHash(this.value);
    if (typeof this.value === "number") return this.value;
    if (typeof this.value === "boolean") return this.value ? 1 : 0;
    return this.stringHash(String(this.value));
  }

  stringHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      hash = (hash << 5) - hash + c;
      hash = hash & hash;  // Convert to 32-bit integer
    }
    return hash;
  }

  toString() { return `ValueKey(${this.value})`; }
}
```

### GlobalKey (Zs)

```js
class Zs extends aJ {
  static _registry = new Map();  // id -> GlobalKey instance
  static _counter = 0;
  _id;
  _currentElement;  // T$ | undefined

  constructor(debugLabel) {
    super();
    if (debugLabel) this._id = `${debugLabel}_${Zs._counter++}`;
    else this._id = `GlobalKey_${Zs._counter++}`;
    Zs._registry.set(this._id, this);
  }

  equals(other) {
    if (!(other instanceof Zs)) return false;
    return this._id === other._id;
  }

  get currentElement() { return this._currentElement; }
  get currentWidget() { return this._currentElement?.widget; }

  // Called during Element.markMounted()
  _setElement(element) {
    m4(  // assert
      this._currentElement === undefined,
      `GlobalKey ${this._id} is already associated with an element. ` +
      `Each GlobalKey can only be used once in the widget tree.`
    );
    this._currentElement = element;
  }

  // Called during Element.unmount()
  _clearElement() {
    this._currentElement = undefined;
    Zs._registry.delete(this._id);
  }

  toString() { return `GlobalKey(${this._id})`; }

  static _clearRegistry() {
    Zs._registry.clear();
    Zs._counter = 0;
  }
}
```

**Annotation**: The "duplicate GlobalKey" assertion is at `_setElement()` -- identical to Flutter's
error `"Multiple widgets used the same GlobalKey"`. The `_registry` is a static Map for
cross-tree element lookup.

---

## 3. Element Base Class (T$)

```js
class T$ {
  widget;                           // Sf -- the current widget configuration
  parent;                           // T$ | undefined
  _children = [];                   // T$[]
  _inheritedDependencies = new Set(); // Set<InheritedElement>
  _dirty = false;
  _cachedDepth;                     // number | undefined (lazy-computed)
  _mounted = false;

  constructor(widget) {
    this.widget = widget;
  }

  get children() { return this._children; }

  // --- Depth (lazy, invalidated on reparent) ---
  get depth() {
    if (this._cachedDepth !== undefined) return this._cachedDepth;
    let d = 0, p = this.parent;
    while (p) { d++; p = p.parent; }
    return this._cachedDepth = d, d;
  }

  _invalidateDepth() {
    this._cachedDepth = undefined;
    for (let child of this._children) child._invalidateDepth();
  }

  get dirty() { return this._dirty; }
  get mounted() { return this._mounted; }
  get renderObject() { return; }  // base returns undefined

  // --- update(): just swaps the widget reference ---
  update(newWidget) {
    this.widget = newWidget;
  }

  // --- Child management ---
  addChild(child) {
    child.parent = this;
    child._invalidateDepth();
    this._children.push(child);
  }

  removeChild(child) {
    let idx = this._children.indexOf(child);
    if (idx !== -1) {
      this._children.splice(idx, 1);
      child.parent = undefined;
      child._invalidateDepth();
    }
  }

  removeAllChildren() {
    for (let child of this._children) {
      child.parent = undefined;
      child._invalidateDepth();
    }
    this._children.length = 0;
  }

  // --- Lifecycle: mount ---
  markMounted() {
    this._mounted = true;
    if (this.widget.key instanceof Zs)    // GlobalKey registration
      this.widget.key._setElement(this);
  }

  // --- Lifecycle: unmount ---
  unmount() {
    if (this.widget.key instanceof Zs)    // GlobalKey deregistration
      this.widget.key._clearElement();
    this._mounted = false;
    this._dirty = false;
    this._cachedDepth = undefined;
    // Unsubscribe from all inherited dependencies
    for (let dep of this._inheritedDependencies)
      if ("removeDependent" in dep) dep.removeDependent(this);
    this._inheritedDependencies.clear();
  }

  // --- Dirty flag / rebuild scheduling ---
  markNeedsRebuild() {
    if (!this._mounted) return;        // guard: ignore if unmounted
    this._dirty = true;
    XG8().scheduleBuildFor(this);       // -> BuildOwner.scheduleBuildFor
  }

  // --- InheritedWidget lookup (walks up parent chain) ---
  dependOnInheritedWidgetOfExactType(widgetType) {
    let ancestor = this.parent;
    while (ancestor) {
      if (ancestor.widget.constructor === widgetType) {
        if ("addDependent" in ancestor && "removeDependent" in ancestor) {
          ancestor.addDependent(this);
          this._inheritedDependencies.add(ancestor);
        }
        return ancestor;
      }
      ancestor = ancestor.parent;
    }
    return null;
  }

  // --- Ancestor queries ---
  findAncestorElementOfType(elementType) {
    let t = this.parent;
    while (t) {
      if (t instanceof elementType) return t;
      t = t.parent;
    }
    return null;
  }

  findAncestorWidgetOfType(widgetType) {
    let t = this.parent;
    while (t) {
      if (t.widget instanceof widgetType) return t.widget;
      t = t.parent;
    }
    return null;
  }
}
```

**Annotation**: No `deactivate()` / `activate()` lifecycle in this implementation --
the framework uses a simpler mount/unmount pair. No `inflateWidget()` as a named method;
instead, `widget.createElement()` is called directly (see component elements below).

---

## 4. BuildContext (jd)

```js
class jd {
  element;      // T$ -- the backing Element
  widget;       // Sf -- mutable, updated on rebuild
  mediaQuery;   // optional
  parent;       // jd | null

  constructor(element, widget, mediaQuery = undefined, parent = null) {
    this.element = element;
    this.widget = widget;
    this.mediaQuery = mediaQuery;
    this.parent = parent;
  }

  findAncestorElementOfType(type) {
    let t = this.element.parent;
    while (t) { if (t instanceof type) return t; t = t.parent; }
    return null;
  }

  findAncestorWidgetOfType(type) {
    return this.element.findAncestorWidgetOfType(type);
  }

  dependOnInheritedWidgetOfExactType(type) {
    return this.element.dependOnInheritedWidgetOfExactType(type);
  }

  findAncestorStateOfType(stateType) {
    let t = this.element.parent;
    while (t) {
      if ("state" in t && t.state instanceof stateType) return t.state;
      t = t.parent;
    }
    return null;
  }

  findRenderObject() {
    if ("renderObject" in this.element) {
      let ro = this.element.renderObject;
      return ro instanceof n_ ? ro : undefined;
    }
    return;
  }
}
```

---

## 5. State Class (_8)

```js
class _8 {
  widget;       // Sf -- current widget
  context;      // jd -- BuildContext
  _mounted = false;

  get mounted() { return this._mounted; }

  // --- Lifecycle callbacks (user overrides) ---
  initState() {}
  didUpdateWidget(oldWidget) {}
  dispose() {}

  // --- setState: the core reactivity trigger ---
  setState(fn) {
    if (!this._mounted)
      throw Error("setState() called after dispose()");
    if (fn) fn();
    this._markNeedsBuild();
  }

  // --- Internal lifecycle ---
  _mount(widget, context) {
    this.widget = widget;
    this.context = context;
    this._mounted = true;
    this.initState();
  }

  _update(newWidget) {
    let oldWidget = this.widget;
    this.widget = newWidget;
    this.didUpdateWidget(oldWidget);
  }

  _unmount() {
    this._mounted = false;
    this.dispose();
  }

  _markNeedsBuild() {
    let element = this.context.element;
    if ("markNeedsBuild" in element && typeof element.markNeedsBuild === "function")
      element.markNeedsBuild();
  }
}
```

**Annotation**: `setState()` calls the callback synchronously, then marks the element dirty.
The `markNeedsBuild()` on the element delegates to `markNeedsRebuild()` which schedules
via BuildOwner.

---

## 6. Widget Subclasses

### StatelessWidget (H3)

```js
class H3 extends Sf {
  createElement() { return new lU0(this); }  // -> StatelessElement
  // User implements: build(context) -> Widget
}
```

### StatefulWidget (H8)

```js
class H8 extends Sf {
  createElement() { return new V_0(this); }  // -> StatefulElement
  // User implements: createState() -> State
}
```

### InheritedWidget (Bt)

```js
class Bt extends Sf {
  child;   // single required child

  constructor({ key, child }) {
    super(key !== undefined ? { key } : {});
    this.child = child;
  }

  createElement() { return new Z_0(this); }  // -> InheritedElement
  // User implements: updateShouldNotify(oldWidget) -> boolean
}
```

### RenderObjectWidget (yj) -- base for leaf/single/multi

```js
class yj extends Sf {
  constructor({ key } = {}) {
    super(key !== undefined ? { key } : {});
  }
  createElement() { return new oj(this); }    // -> RenderObjectElement
  updateRenderObject(renderObject) {}          // user overrides to push config
  // User implements: createRenderObject() -> RenderObject
}
```

### SingleChildRenderObjectWidget (Qb)

```js
class Qb extends yj {
  child;   // Sf | undefined

  constructor({ key, child } = {}) {
    super(key ? { key } : {});
    this.child = child;
  }

  createElement() { return new uv(this); }    // -> SingleChildRenderObjectElement
}
```

### MultiChildRenderObjectWidget (An)

```js
class An extends yj {
  children;   // Sf[]

  constructor({ key, children = [] } = {}) {
    super(key ? { key } : {});
    this.children = [...children];
  }

  createElement() { return new rJ(this); }    // -> MultiChildRenderObjectElement
}
```

### LeafRenderObjectWidget (ef)

```js
class ef extends yj {
  constructor({ key } = {}) {
    super(key ? { key } : {});
  }
  createElement() { return new O$(this); }    // -> LeafRenderObjectElement
}
```

### ParentDataWidget (R_)

```js
class R_ extends Sf {
  child;

  constructor(child, key) {
    super(key ? { key } : {});
    this.child = child;
  }

  createElement() { return new iU0(this); }   // -> ParentDataElement
  // User implements: createParentData(), applyParentData(renderObject)
}
```

---

## 7. Element Subclasses -- RenderObject branch

### RenderObjectElement (oj)

```js
class oj extends T$ {
  _renderObject;   // n_ | undefined

  constructor(widget) { super(widget); }

  get renderObjectWidget() { return this.widget; }
  get renderObject() { return this._renderObject; }

  mount() {
    this._renderObject = this.renderObjectWidget.createRenderObject();
    this._renderObject.attach();
    this.markMounted();
  }

  unmount() {
    if (this._renderObject) {
      this._renderObject.detach();
      this._renderObject.dispose();
      this._renderObject = undefined;
    }
    super.unmount();
  }

  update(newWidget) {
    super.update(newWidget);
    let w = this.renderObjectWidget;
    if (this._renderObject)
      w.updateRenderObject(this._renderObject);
  }

  performRebuild() {}  // no-op for RenderObjectElements
}
```

### SingleChildRenderObjectElement (uv)

```js
class uv extends oj {
  _child;   // T$ | undefined

  get singleChildWidget() { return this.widget; }
  get child() { return this._child; }

  mount() {
    super.mount();
    if (this.singleChildWidget.child) {
      this._child = this.singleChildWidget.child.createElement();   // inflate
      this.addChild(this._child);
      this._child.mount();
      if (this._child.renderObject && this.renderObject)
        this.renderObject.adoptChild(this._child.renderObject);
    }
  }

  unmount() {
    if (this._child) {
      this._child.unmount();
      this.removeChild(this._child);
      this._child = undefined;
    }
    super.unmount();
  }

  // --- The 4-case update logic (updateChild equivalent) ---
  update(newWidget) {
    super.update(newWidget);
    let w = this.singleChildWidget;

    if (w.child && this._child) {
      // Case: (old=child, new=widget) -> canUpdate ? update : replace
      if (this._child.widget.canUpdate(w.child))
        this._child.update(w.child);
      else {
        // Replace: unmount old, create+mount new
        this._child.unmount();
        this.removeChild(this._child);
        this._child = w.child.createElement();
        this.addChild(this._child);
        this._child.mount();
        if (this.renderObject) {
          this.renderObject.removeAllChildren();
          if (this._child.renderObject)
            this.renderObject.adoptChild(this._child.renderObject);
        }
      }
    } else if (w.child && !this._child) {
      // Case: (old=null, new=widget) -> inflate
      this._child = w.child.createElement();
      this.addChild(this._child);
      this._child.mount();
      if (this.renderObject && this._child.renderObject)
        this.renderObject.adoptChild(this._child.renderObject);
    } else if (!w.child && this._child) {
      // Case: (old=child, new=null) -> deactivate/unmount
      this._child.unmount();
      this.removeChild(this._child);
      this._child = undefined;
      if (this.renderObject)
        this.renderObject.removeAllChildren();
    }
    // Case: (old=null, new=null) -> nothing (implicit)
  }

  performRebuild() {}
}
```

**Annotation**: This is the **updateChild() 4-case logic**, inlined into the `update()` method
rather than extracted as a separate `updateChild()` function. The four cases:

| old child | new widget | action                                                |
|-----------|-----------|-------------------------------------------------------|
| null      | null      | nothing                                               |
| null      | widget    | `createElement()` + `mount()` (inflate)               |
| child     | null      | `unmount()` + `removeChild()` (deactivate)            |
| child     | widget    | `canUpdate()` ? `update()` : unmount old + inflate new |

### LeafRenderObjectElement (O$)

```js
class O$ extends oj {
  constructor(widget) { super(widget); }
  get leafWidget() { return this.widget; }
  performRebuild() {}  // no children to rebuild
}
```

---

## 8. Element Subclasses -- Component branch

### StatelessElement (lU0)

```js
class lU0 extends T$ {
  _child;     // T$ | undefined -- single child from build()
  _context;   // jd | undefined

  get statelessWidget() { return this.widget; }
  get child() { return this._child; }
  get renderObject() { return this._child?.renderObject; }

  mount() {
    this._context = new jd(this, this.widget);
    this.rebuild();
    this.markMounted();
  }

  unmount() {
    if (this._child) {
      this._child.unmount();
      this.removeChild(this._child);
      this._child = undefined;
    }
    this._context = undefined;
    super.unmount();
  }

  update(newWidget) {
    if (this.widget === newWidget) return;   // identity check: skip if same
    super.update(newWidget);
    if (this._context) this._context.widget = newWidget;
    this.rebuild();
  }

  performRebuild() { this.rebuild(); }

  rebuild() {
    if (!this._context)
      throw Error("Cannot rebuild unmounted element");

    let newWidget = this.statelessWidget.build(this._context);

    if (this._child) {
      if (this._child.widget === newWidget) return;  // identity shortcut
      if (this._child.widget.canUpdate(newWidget))
        this._child.update(newWidget);               // reuse element
      else {
        // Replace: detach render object, unmount, create new
        let old = this._child;
        let ancestor = this.findNearestRenderObjectAncestor();
        if (ancestor && old.renderObject)
          ancestor.dropChild(old.renderObject);
        else if (!ancestor && old.renderObject)
          old.renderObject.detach();

        this._child.unmount();
        this.removeChild(this._child);

        this._child = newWidget.createElement();      // inflate new
        this.addChild(this._child);
        this._child.mount();

        if (ancestor && this._child.renderObject) {
          ancestor.adoptChild(this._child.renderObject);
          this._child.renderObject.markNeedsLayout();
        } else if (!ancestor && this._child.renderObject) {
          this._child.renderObject.attach();
          this._child.renderObject.markNeedsLayout();
        }

        if (this._child.renderObject)
          this._child.renderObject.markNeedsLayout();
      }
    } else {
      // First build: inflate
      this._child = newWidget.createElement();
      this.addChild(this._child);
      this._child.mount();
    }
  }

  findNearestRenderObjectAncestor() {
    let p = this.parent;
    while (p) {
      if (p.renderObject) {
        // Skip if it is our own child's render object (proxy element case)
        if (this._child?.renderObject && p.renderObject === this._child.renderObject) {
          p = p.parent;
          continue;
        }
        return p.renderObject;
      }
      p = p.parent;
    }
    return;
  }
}
```

### StatefulElement (V_0)

```js
class V_0 extends T$ {
  _state;     // _8 | undefined
  _child;     // T$ | undefined
  _context;   // jd | undefined

  get statefulWidget() { return this.widget; }
  get state() { return this._state; }
  get child() { return this._child; }
  get renderObject() { return this._child?.renderObject; }

  mount() {
    this._context = new jd(this, this.widget);
    this._state = this.statefulWidget.createState();
    this._state._mount(this.statefulWidget, this._context);
    this.rebuild();
    this.markMounted();
  }

  unmount() {
    if (this._child) {
      this._child.unmount();
      this.removeChild(this._child);
      this._child = undefined;
    }
    if (this._state) {
      this._state._unmount();   // calls dispose()
      this._state = undefined;
    }
    this._context = undefined;
    super.unmount();
  }

  update(newWidget) {
    if (this.widget === newWidget) return;
    super.update(newWidget);
    if (this._state) this._state._update(this.statefulWidget);  // didUpdateWidget
    if (this._context) this._context.widget = newWidget;
    this.rebuild();
  }

  performRebuild() { this.rebuild(); }

  // --- markNeedsBuild (alias for markNeedsRebuild) ---
  markNeedsBuild() {
    this.markNeedsRebuild();
  }

  rebuild() {
    if (!this._context || !this._state)
      throw Error("Cannot rebuild unmounted element");

    let newWidget = this._state.build(this._context);

    if (this._child) {
      if (this._child.widget.canUpdate(newWidget))
        this._child.update(newWidget);
      else {
        // Replace child: detach old render object, unmount, inflate new
        let old = this._child;
        let ancestor = this.findNearestRenderObjectAncestor();
        if (ancestor && old.renderObject)
          ancestor.dropChild(old.renderObject);
        else if (!ancestor && old.renderObject)
          old.renderObject.detach();

        this._child.unmount();
        this.removeChild(this._child);

        this._child = newWidget.createElement();
        this.addChild(this._child);
        this._child.mount();

        if (ancestor && this._child.renderObject) {
          ancestor.adoptChild(this._child.renderObject);
          this._child.renderObject.markNeedsLayout();
        } else if (!ancestor && this._child.renderObject) {
          this._child.renderObject.attach();
          this._child.renderObject.markNeedsLayout();
        }

        if (this._child.renderObject)
          this._child.renderObject.markNeedsLayout();
      }
    } else {
      this._child = newWidget.createElement();
      this.addChild(this._child);
      this._child.mount();
    }
  }

  findNearestRenderObjectAncestor() {
    let p = this.parent;
    while (p) {
      if (p.renderObject) {
        if (this._child?.renderObject && p.renderObject === this._child.renderObject) {
          p = p.parent;
          continue;
        }
        return p.renderObject;
      }
      p = p.parent;
    }
    return;
  }
}
```

**Annotation**: The rebuild logic is identical between StatelessElement and StatefulElement,
except that StatefulElement calls `this._state.build(context)` instead of
`this.statelessWidget.build(context)`. Both handle the canUpdate/replace pattern inline.

---

## 9. InheritedElement (Z_0)

```js
class Z_0 extends T$ {
  _child;             // T$ | undefined
  _dependents = new Set();  // Set<T$> -- elements that depend on this

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
    if (this._child) {
      this._child.unmount();
      this.removeChild(this._child);
      this._child = undefined;
    }
    this._dependents.clear();
    super.unmount();
  }

  update(newWidget) {
    let oldWidget = this.inheritedWidget;
    super.update(newWidget);
    let newInherited = this.inheritedWidget;

    // Notify dependents if data changed
    if (newInherited.updateShouldNotify(oldWidget))
      this.notifyDependents();

    // Update child using canUpdate pattern
    if (this._child && this._child.widget.canUpdate(newInherited.child))
      this._child.update(newInherited.child);
    else {
      if (this._child) {
        this._child.unmount();
        this.removeChild(this._child);
      }
      this._child = newInherited.child.createElement();
      this.addChild(this._child);
      this._child.mount();
    }
  }

  addDependent(element) { this._dependents.add(element); }
  removeDependent(element) { this._dependents.delete(element); }

  notifyDependents() {
    for (let dep of this._dependents)
      dep.markNeedsRebuild();
  }

  performRebuild() {}
}
```

**Annotation**: `updateShouldNotify()` is called with the OLD widget (before `super.update()`
swaps it). If it returns true, all dependents are marked dirty and will rebuild on the
next frame. This matches Flutter's InheritedWidget notification pattern.

---

## 10. ParentDataElement (iU0)

```js
class iU0 extends T$ {
  _child;   // T$ | undefined

  get parentDataWidget() { return this.widget; }
  get child() { return this._child; }
  get renderObject() { return this._child?.renderObject; }

  mount() {
    this._child = this.parentDataWidget.child.createElement();
    this.addChild(this._child);
    this._child.mount();
    this._applyParentData();
  }

  unmount() {
    if (this._child) {
      this._child.unmount();
      this.removeChild(this._child);
      this._child = undefined;
    }
    super.unmount();
  }

  update(newWidget) {
    super.update(newWidget);
    if (this._child) {
      if (this._child.widget.canUpdate(newWidget.child))
        this._child.update(newWidget.child);
      else {
        this._child.unmount();
        this.removeChild(this._child);
        this._child = newWidget.child.createElement();
        this.addChild(this._child);
        this._child.mount();
      }
    } else {
      this._child = newWidget.child.createElement();
      this.addChild(this._child);
      this._child.mount();
    }
    this._applyParentData();
  }

  performRebuild() { this._applyParentData(); }

  _applyParentData() {
    let child = this._child;
    if (!child) return;
    let ro = child.renderObject;
    if (!ro) return;
    if (!this.parentDataWidget.debugIsValidRenderObject(ro))
      throw Error(
        `ParentDataWidget ${this.parentDataWidget.constructor.name} ` +
        `provided parent data to ${ro.constructor.name}, but ` +
        `${ro.constructor.name} doesn't support this type of parent data.`
      );
    if (!ro.parentData ||
        ro.parentData.constructor !== this.parentDataWidget.createParentData().constructor)
      ro.parentData = this.parentDataWidget.createParentData();
    this.parentDataWidget.applyParentData(ro);
  }
}
```

---

## 11. updateChildren() Algorithm (rJ)

This is the O(N) key-matching algorithm on `MultiChildRenderObjectElement`.

```js
class rJ extends oj {
  _childElements = [];   // T$[]

  get multiChildWidget() { return this.widget; }
  get children() { return this._childElements; }

  mount() {
    super.mount();
    for (let widget of this.multiChildWidget.children) {
      let elem = widget.createElement();
      this._childElements.push(elem);
      this.addChild(elem);
      elem.mount();
      if (elem.renderObject && this.renderObject)
        this.renderObject.adoptChild(elem.renderObject);
    }
  }

  unmount() {
    for (let elem of this._childElements) {
      elem.unmount();
      this.removeChild(elem);
    }
    this._childElements.length = 0;
    super.unmount();
  }

  update(newWidget) {
    super.update(newWidget);
    this.updateChildren(this._childElements, [...this.multiChildWidget.children]);
  }

  // =======================================================================
  // updateChildren(oldElements, newWidgets)
  //
  // Three-phase O(N) algorithm:
  //   Phase 1: Top-down scan (match from start)
  //   Phase 2: Bottom-up scan (match from end)
  //   Phase 3: Key-map middle reconciliation
  // =======================================================================
  updateChildren(oldElements, newWidgets) {
    let result = [];
    let oldStart = 0, newStart = 0;
    let oldEnd = oldElements.length - 1;
    let newEnd = newWidgets.length - 1;

    // --- Phase 1: Top-down scan ---
    // Walk forward while old and new match (canUpdate)
    while (oldStart <= oldEnd && newStart <= newEnd) {
      let oldElem = oldElements[oldStart];
      let newWidget = newWidgets[newStart];
      if (!oldElem || !newWidget || !oldElem.widget.canUpdate(newWidget))
        break;
      if (oldElem.widget !== newWidget)   // skip update if identical
        oldElem.update(newWidget);
      result.push(oldElem);
      oldStart++;
      newStart++;
    }

    // --- Phase 2: Bottom-up scan ---
    // Walk backward while old and new match (canUpdate)
    let bottomResult = [];
    while (oldStart <= oldEnd && newStart <= newEnd) {
      let oldElem = oldElements[oldEnd];
      let newWidget = newWidgets[newEnd];
      if (!oldElem || !newWidget || !oldElem.widget.canUpdate(newWidget))
        break;
      if (oldElem.widget !== newWidget)
        oldElem.update(newWidget);
      bottomResult.unshift(oldElem);
      oldEnd--;
      newEnd--;
    }

    // --- Phase 3: Middle reconciliation ---
    if (oldStart > oldEnd) {
      // All old elements matched; remaining new widgets are insertions
      for (let i = newStart; i <= newEnd; i++) {
        let w = newWidgets[i];
        if (w) {
          let elem = this.createChildElement(w);
          result.push(elem);
        }
      }
    } else if (newStart > newEnd) {
      // All new widgets matched; remaining old elements are removals
      for (let i = oldStart; i <= oldEnd; i++) {
        let elem = oldElements[i];
        if (elem) this.deactivateChild(elem);
      }
    } else {
      // Build key maps for the remaining old elements
      let oldKeyedChildren = new Map();   // key_string -> Element
      let oldKeyedIndices = new Map();    // key_string -> index

      for (let i = oldStart; i <= oldEnd; i++) {
        let elem = oldElements[i];
        if (elem.widget.key) {
          let keyStr = elem.widget.key.toString();
          oldKeyedChildren.set(keyStr, elem);
          oldKeyedIndices.set(keyStr, i);
        }
      }

      // Match remaining new widgets against old elements
      for (let i = newStart; i <= newEnd; i++) {
        let newWidget = newWidgets[i];
        if (!newWidget) continue;

        let match;

        if (newWidget.key) {
          // --- Keyed match ---
          let keyStr = newWidget.key.toString();
          match = oldKeyedChildren.get(keyStr);
          if (match) {
            oldKeyedChildren.delete(keyStr);
            let oldIdx = oldKeyedIndices.get(keyStr);
            if (oldIdx !== undefined)
              oldElements[oldIdx] = null;    // mark consumed

            if (match.widget === newWidget)
              ;  // identity match, no update needed
            else if (match.widget.canUpdate(newWidget))
              match.update(newWidget);
            else {
              this.deactivateChild(match);
              match = this.createChildElement(newWidget);
            }
          } else {
            match = this.createChildElement(newWidget);  // new keyed element
          }
        } else {
          // --- Non-keyed match: linear scan for compatible element ---
          let found = false;
          for (let j = oldStart; j <= oldEnd; j++) {
            let oldElem = oldElements[j];
            if (oldElem && !oldElem.widget.key) {
              if (oldElem.widget === newWidget) {
                match = oldElem;
                oldElements[j] = null;
                found = true;
                break;
              } else if (oldElem.widget.canUpdate(newWidget)) {
                match = oldElem;
                oldElements[j] = null;
                match.update(newWidget);
                found = true;
                break;
              }
            }
          }
          if (!found)
            match = this.createChildElement(newWidget);
        }

        if (match) result.push(match);
      }

      // Deactivate remaining unmatched old elements
      for (let i = oldStart; i <= oldEnd; i++) {
        let elem = oldElements[i];
        if (elem) this.deactivateChild(elem);
      }
      for (let elem of oldKeyedChildren.values())
        this.deactivateChild(elem);
    }

    // Merge top + middle + bottom
    result.push(...bottomResult);
    this._childElements = result;

    // Sync render object children
    if (this.renderObject) {
      let renderChildren = [];
      for (let elem of result)
        if (elem.renderObject) renderChildren.push(elem.renderObject);
      let current = this.renderObject.children;
      if (current.length !== renderChildren.length ||
          current.some((c, i) => c !== renderChildren[i]))
        this.renderObject.replaceChildren(renderChildren);
    }
  }

  createChildElement(widget) {
    let elem = widget.createElement();
    this.addChild(elem);
    elem.mount();
    return elem;
  }

  deactivateChild(elem) {
    elem.unmount();
    this.removeChild(elem);
  }

  performRebuild() {}
}
```

**Annotation**: This is a simplified version of Flutter's `updateChildren()`. The key differences:
- No separate `replaceWithNewChild` / `deactivateChild` abstraction
- Non-keyed fallback does a linear scan (not just position-based)
- The three phases (top-scan, bottom-scan, key-map) match Flutter's algorithm exactly
- After reconciliation, the render object's children are bulk-replaced via `replaceChildren()`

---

## 12. BuildOwner (NB0)

```js
class NB0 {
  _dirtyElements = new Set();   // Set<T$>

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

  // --- Schedule an element for rebuild ---
  scheduleBuildFor(element) {
    if (this._dirtyElements.has(element)) return;   // deduplicate
    this._dirtyElements.add(element);
    c9.instance.requestFrame();                      // request next frame
  }

  // --- buildScopes: rebuild all dirty elements, depth-sorted ---
  buildScopes() {
    if (this._dirtyElements.size === 0) return;

    let startTime = performance.now();
    let rebuiltCount = 0;

    try {
      // Loop because rebuilding can dirty more elements
      while (this._dirtyElements.size > 0) {
        let elements = Array.from(this._dirtyElements);
        this._dirtyElements.clear();

        // Sort by depth (parents before children)
        elements.sort((a, b) => a.depth - b.depth);

        for (let elem of elements) {
          if (elem.dirty) {
            try {
              elem.performRebuild();
              elem._dirty = false;
              rebuiltCount++;
            } catch (error) {
              V.error("Element rebuild error:", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                elementType: elem.widget.constructor.name,
                elementDebugLabel: elem.widget.debugLabel
              });
              elem._dirty = false;  // clear even on error to prevent loops
            }
          }
        }
      }
    } finally {
      this.recordBuildStats(performance.now() - startTime, rebuiltCount);
    }
  }

  recordBuildStats(duration, count) {
    this._stats.totalRebuilds += count;
    this._stats.elementsRebuiltThisFrame = count;
    this._stats.lastBuildTime = duration;
    this._stats.maxElementsPerFrame = Math.max(this._stats.maxElementsPerFrame, count);
    this._stats.maxBuildTime = Math.max(this._stats.maxBuildTime, duration);

    this._buildTimes.push(duration);
    this._elementsPerFrame.push(count);

    if (this._buildTimes.length > 60) {
      this._buildTimes.shift();
      this._elementsPerFrame.shift();
    }

    this._stats.averageBuildTime =
      this._buildTimes.reduce((sum, t) => sum + t, 0) / this._buildTimes.length;
    this._stats.averageElementsPerFrame =
      this._elementsPerFrame.reduce((sum, c) => sum + c, 0) / this._elementsPerFrame.length;
  }

  get dirtyElements() { return Array.from(this._dirtyElements); }
  get hasDirtyElements() { return this._dirtyElements.size > 0; }
  get buildStats() { return { ...this._stats }; }

  resetBuildStats() {
    this._stats = { /* ... reset to zeros ... */ };
    this._buildTimes.length = 0;
    this._elementsPerFrame.length = 0;
  }

  dispose() {
    this._dirtyElements.clear();
  }
}
```

**Annotation**: Key differences from Flutter's BuildOwner:
- Uses a `Set` instead of a `List` for dirty elements (automatic dedup)
- The `while` loop handles cascading dirtying (rebuilding element A may dirty element B)
- Depth-first sorting ensures parents rebuild before children
- Includes built-in performance stats tracking (60-frame rolling window)
- No lock/unlock mechanism (no `lockState` equivalent)

---

## 13. FrameScheduler (c9)

```js
class c9 {
  static _instance;
  _frameCallbacks = new Map();      // phase -> callback info
  _postFrameCallbacks = [];
  _frameScheduled = false;
  _frameInProgress = false;
  _executingPostFrameCallbacks = false;
  _pendingFrameTimer = null;
  _lastFrameTimestamp = 0;
  _useFramePacing = !isTestEnvironment();

  static get instance() {
    return c9._instance ??= new c9();
  }

  requestFrame() {
    if (this._frameScheduled) return;
    if (this._frameInProgress) {
      this._frameScheduled = true;
      return;
    }
    if (!this._useFramePacing) {
      this._frameScheduled = true;
      this.scheduleFrameExecution(0);
      return;
    }
    // Frame pacing: maintain target frame rate
    let now = performance.now();
    let elapsed = now - this._lastFrameTimestamp;
    if (this._lastFrameTimestamp === 0 || elapsed >= FRAME_BUDGET) {
      this._frameScheduled = true;
      this.scheduleFrameExecution(0);
      return;
    }
    let delay = Math.max(0, FRAME_BUDGET - elapsed);
    this._frameScheduled = true;
    this.scheduleFrameExecution(delay);
  }

  scheduleFrameExecution(delayMs) {
    if (delayMs <= 0) setImmediate(() => this.runScheduledFrame());
    else this._pendingFrameTimer = setTimeout(() => this.runScheduledFrame(), delayMs);
  }

  executeFrame() {
    if (this._frameInProgress) return;
    this._frameScheduled = false;
    this._frameInProgress = true;
    try {
      for (let phase of ["build", "layout", "paint", "render"])
        this.executePhase(phase);
      this.executePostFrameCallbacks();
    } catch (error) {
      V.error("Frame execution error:", error);
    } finally {
      this.recordFrameStats(/* ... */);
      this._lastFrameTimestamp = performance.now();
      this._frameInProgress = false;
      if (this._frameScheduled) { /* schedule next frame */ }
    }
  }

  addFrameCallback(id, callback, phase, priority, name) { /* ... */ }
  removeFrameCallback(id) { /* ... */ }
  addPostFrameCallback(callback, name) { /* ... */ }
}
```

---

## 14. WidgetsBinding Frame Pipeline

The frame pipeline is registered during binding initialization:

```js
// Phase order (registered with priorities):
// 1. "frame-start"  -> beginFrame()                    (priority: -2000)
// 2. "resize"       -> processResizeIfPending()         (priority: -1000)
// 3. "build"        -> buildOwner.buildScopes() +       (priority: 0)
//                      updateRootRenderObject()
// 4. "layout"       -> updateRootConstraints() +        (priority: 0)
//                      pipelineOwner.flushLayout()
// 5. "paint"        -> paint()                          (priority: 0)
// 6. "render"       -> render()                         (priority: 0)

// Global scheduler init:
VG8(
  { scheduleBuildFor: (elem) => this.buildOwner.scheduleBuildFor(elem) },
  {
    requestLayout: (ro) => this.pipelineOwner.requestLayout(ro),
    requestPaint:  (ro) => this.pipelineOwner.requestPaint(ro),
    removeFromQueues: (ro) => this.pipelineOwner.removeFromQueues(ro)
  }
);
```

**Annotation**: This matches Flutter's frame pipeline phases:
`beginFrame` -> `build` -> `layout` -> `paint` -> `compositing/render`.
The global accessor functions `XG8()` (build scheduler) and `xH()` (paint scheduler) are
set once during binding init and used throughout the framework.

---

## 15. RenderObject Base (n_)

```js
class n_ {
  _parent;                     // n_ | undefined
  _children = [];              // n_[]
  _needsLayout = false;
  _needsPaint = false;
  _cachedDepth;
  _attached = false;
  _debugData = {};
  allowHitTestOutsideBounds = false;
  parentData;                  // PJ (ParentData) | undefined

  adoptChild(child) {
    child._parent = this;
    child._invalidateDepth();
    this._children.push(child);
    this.setupParentData(child);
    if (this._attached) child.attach();
    this.markNeedsLayout();
  }

  dropChild(child) {
    let idx = this._children.indexOf(child);
    if (idx !== -1) {
      if (child._attached) child.detach();
      this._children.splice(idx, 1);
      child._parent = undefined;
      child._invalidateDepth();
      this.markNeedsLayout();
    }
  }

  replaceChildren(newChildren) {
    for (let c of newChildren) {
      c._parent = this;
      c._invalidateDepth();
      this.setupParentData(c);
    }
    this._children = newChildren;
    this.markNeedsLayout();
  }

  attach() {
    if (this._attached) return;
    this._attached = true;
    for (let c of this._children) c.attach();
  }

  detach() {
    if (!this._attached) return;
    this._attached = false;
    for (let c of this._children) c.detach();
  }

  markNeedsLayout() {
    if (this._needsLayout) return;
    if (!this._attached) return;
    this._needsLayout = true;
    if (this.parent)
      this.parent.markNeedsLayout();     // propagate up
    else
      xH().requestLayout(this);          // root: schedule with PipelineOwner
  }

  markNeedsPaint() {
    if (this._needsPaint) return;
    if (!this._attached) return;
    this._needsPaint = true;
    xH().requestPaint(this);
  }

  paint(canvas, offsetX = 0, offsetY = 0) {
    this._needsPaint = false;
    for (let child of this.children) {
      if ("offset" in child) {
        let c = child;
        child.paint(canvas, offsetX + c.offset.x, offsetY + c.offset.y);
      } else {
        child.paint(canvas, offsetX, offsetY);
      }
    }
  }

  visitChildren(visitor) {
    for (let child of this._children) visitor(child);
  }

  dispose() {
    xH().removeFromQueues(this);
    this._cachedDepth = undefined;
    this._parent = undefined;
    this._children.length = 0;
  }
}
```

### RenderBox (j9)

```js
class j9 extends n_ {
  _size = { width: 0, height: 0 };
  _offset = { x: 0, y: 0 };

  get size() { return { ...this._size }; }
  get offset() { return { ...this._offset }; }

  setSize(w, h) {
    m4(Number.isFinite(w) && Number.isFinite(h),
       `RenderBox.setSize received non-finite dimension: ${w}x${h}`);
    this._size.width = w;
    this._size.height = h;
  }

  setOffset(x, y) {
    this._offset.x = Number.isFinite(x) ? Math.round(x) : 0;
    this._offset.y = Number.isFinite(y) ? Math.round(y) : 0;
  }
}
```

---

## 16. Debug Inspector (Mu)

The framework includes a built-in widget tree debugger server:

```js
class Mu {
  enabled;
  interval;
  static _instance = null;
  server = null;
  rootElement = null;
  port;   // default: 9876
  renderObjectToElementMap = new Map();
  keystrokeHistory = [];

  // HTTP endpoints:
  //   GET /widget-tree   -> JSON snapshot of element tree
  //   GET /focus-tree    -> JSON snapshot of focus tree
  //   GET /health        -> { status: "ok" }

  // Debug commands (via socket):
  //   $.getState(element)  -> Get state from StatefulElement
}
```

**Annotation**: The inspector runs on `http://localhost:9876` when enabled, exposing the
widget tree as JSON for developer tools.

---

## Summary of Reconciliation Flow

```
setState() / markNeedsRebuild()
    |
    v
T$.markNeedsRebuild()
    |  sets _dirty = true
    v
XG8().scheduleBuildFor(this)        // -> NB0.scheduleBuildFor
    |  adds to _dirtyElements Set
    |  calls c9.instance.requestFrame()
    v
[Next frame]
    |
    v
c9.executeFrame()
    |
    v
Phase "build":
    NB0.buildScopes()
        |  sorts dirty elements by depth (parent-first)
        |  for each: elem.performRebuild(), elem._dirty = false
        |
        v
    performRebuild() dispatches to:
        - StatelessElement.rebuild()  -> calls widget.build(context)
        - StatefulElement.rebuild()   -> calls state.build(context)
        - RenderObjectElement         -> no-op (config push happens in update())
        - InheritedElement            -> no-op
        |
        v
    Inside rebuild():
        newWidget = build(context)
        if (child.widget.canUpdate(newWidget))
            child.update(newWidget)     // REUSE element, recurse down
        else
            child.unmount()             // DISCARD old subtree
            child = newWidget.createElement()  // CREATE new subtree
            child.mount()               // INFLATE new subtree
        |
        v
Phase "layout":
    PipelineOwner.flushLayout()
        |
        v
Phase "paint":
    paint()
        |
        v
Phase "render":
    render()                            // flush to terminal screen buffer
```
