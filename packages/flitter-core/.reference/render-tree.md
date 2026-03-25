# Render Tree Architecture (Reverse-Engineered from Amp CLI)

Source: `/home/gem/home/tmp/amp-strings.txt`
Primary lines: 529716, 530127, 530350-530351

## Identifier Map

| Minified | Flutter Equivalent | Line |
|----------|-------------------|------|
| `n_` | `RenderObject` | 529716 |
| `j9` | `RenderBox` | 529716 |
| `UB0` | `PipelineOwner` | 530127 |
| `l3` | `BoxConstraints` | 529716 |
| `c9` | `SchedulerBinding` (FrameScheduler) | 530127 |
| `NB0` | `BuildOwner` | 530127 |
| `J3` | `WidgetsBinding` | 530127 |
| `PJ` | `ParentData` | 530350 |
| `S_` | `FlexParentData` | 530350 |
| `oJ` | `SchedulerPhase` enum | 530127 |
| `yj` | `RenderObjectWidget` | 529716 |
| `Qb` | `SingleChildRenderObjectWidget` | 529716 |
| `An` | `MultiChildRenderObjectWidget` | 529716 |
| `oj` | `RenderObjectElement` | 529716 |
| `uv` | `SingleChildRenderObjectElement` | 529716 |
| `rJ` | `MultiChildRenderObjectElement` | 529716 |
| `fE` | `RenderDecoratedBox` / ContainerRenderBox | 530350 |
| `oU0` | `RenderFlex` (Row/Column) | 530350 |
| `dU0` | `RenderClipRect` | 530350 |
| `gU0` | `RenderParagraph` (RichText) | 530135 |
| `xH()` | getPipelineOwner() accessor | 529716 |
| `VG8()` | initBindings(buildScheduler, pipelineOwner) | 529716 |
| `lF` | global BuildOwner ref | 529716 |
| `dF` | global PipelineOwner ref | 529716 |

---

## 1. RenderObject Base Class (`n_`)

**Line 529716** -- Full extracted code:

```javascript
class n_ {
  _parent;
  _children = [];
  _needsLayout = !1;     // false
  _needsPaint = !1;       // false
  _cachedDepth;
  _attached = !1;         // false
  _debugData = {};
  allowHitTestOutsideBounds = !1;
  parentData;

  // --- Parent Data Setup ---
  setupParentData(g) {}

  // --- Debug ---
  sendDebugData(g) { this._debugData = { ...this._debugData, ...g } }
  get debugData() { return this._debugData }

  // --- Tree getters ---
  get parent()   { return this._parent }
  get children() { return this._children }
  get depth() {
    if (this._cachedDepth !== void 0) return this._cachedDepth;
    let g = 0, t = this._parent;
    while (t) g++, t = t._parent;
    return this._cachedDepth = g, g;
  }
  _invalidateDepth() {
    this._cachedDepth = void 0;
    for (let g of this._children) g._invalidateDepth();
  }

  // --- Dirty flags ---
  get needsLayout() { return this._needsLayout }
  get needsPaint()  { return this._needsPaint }
  get attached()    { return this._attached }

  // --- Child management (ContainerRenderObject mixin equivalent) ---
  adoptChild(g) {
    g._parent = this;
    g._invalidateDepth();
    this._children.push(g);
    this.setupParentData(g);
    if (this._attached) g.attach();
    this.markNeedsLayout();
  }

  dropChild(g) {
    let t = this._children.indexOf(g);
    if (t !== -1) {
      if (g._attached) g.detach();
      this._children.splice(t, 1);
      g._parent = void 0;
      g._invalidateDepth();
      this.markNeedsLayout();
    }
  }

  removeAllChildren() {
    for (let g of this._children) {
      if (g._attached) g.detach();
      g._parent = void 0;
      g._invalidateDepth();
    }
    this._children.length = 0;
    this.markNeedsLayout();
  }

  replaceChildren(g) {
    for (let t of g)
      t._parent = this, t._invalidateDepth(), this.setupParentData(t);
    this._children = g;
    this.markNeedsLayout();
  }

  // --- Attach / Detach ---
  attach() {
    if (this._attached) return;
    this._attached = !0;
    for (let g of this._children) g.attach();
  }

  detach() {
    if (!this._attached) return;
    this._attached = !1;
    for (let g of this._children) g.detach();
  }

  // --- CRITICAL: markNeedsLayout ---
  // Walks up to root. No relayout boundary optimization in this implementation.
  markNeedsLayout() {
    if (this._needsLayout) return;       // already dirty, stop
    if (!this._attached) return;          // not in tree, skip
    this._needsLayout = !0;
    if (this.parent)
      this.parent.markNeedsLayout();      // propagate UP to parent
    else
      xH().requestLayout(this);           // root: tell PipelineOwner
  }

  // --- CRITICAL: markNeedsPaint ---
  markNeedsPaint() {
    if (this._needsPaint) return;
    if (!this._attached) return;
    this._needsPaint = !0;
    xH().requestPaint(this);              // always tells PipelineOwner directly
  }

  // --- performLayout (subclass override point) ---
  performLayout() {}

  // --- paint (default: paint children with offset) ---
  paint(g, t = 0, b = 0) {
    this._needsPaint = !1;
    for (let s of this.children)
      if ("offset" in s) {
        let a = s, r = t + a.offset.x, m = b + a.offset.y;
        s.paint(g, r, m);
      } else {
        s.paint(g, t, b);
      }
  }

  visitChildren(g) {
    for (let t of this._children) g(t);
  }

  dispose() {
    xH().removeFromQueues(this);
    this._cachedDepth = void 0;
    this._parent = void 0;
    this._children.length = 0;
  }
}
```

### Key Annotations

- **No RelayoutBoundary**: Unlike Flutter, `markNeedsLayout()` always walks to the root.
  There is no `_relayoutBoundary` field or `sizedByParent` optimization. The root node
  tells `PipelineOwner.requestLayout()`.
- **No RepaintBoundary**: `markNeedsPaint()` immediately tells PipelineOwner. There is
  no `isRepaintBoundary` or `_needsCompositing` -- the TUI does not need compositing layers.
- **ContainerRenderObject is built-in**: `adoptChild()`, `dropChild()`, `removeAllChildren()`,
  `replaceChildren()` are all on the base class, not a separate mixin.
- **parentData**: Set via `setupParentData(g)`, overridden by subclasses.

---

## 2. RenderBox (`j9 extends n_`)

**Line 529716** -- Full extracted code:

```javascript
class j9 extends n_ {
  _size = { width: 0, height: 0 };

  get size() { return { ...this._size } }

  setSize(g, t) {
    m4(Number.isFinite(g) && Number.isFinite(t),
      `RenderBox.setSize received non-finite dimension: ${g}x${t}`);
    this._size.width = g;
    this._size.height = t;
  }

  // --- Offset (BoxParentData equivalent, built into RenderBox) ---
  _offset = { x: 0, y: 0 };

  get offset() { return { ...this._offset } }

  setOffset(g, t) {
    let b = Number.isFinite(g) ? Math.round(g) : 0;
    let s = Number.isFinite(t) ? Math.round(t) : 0;
    this._offset.x = b;
    this._offset.y = s;
  }

  // --- Coordinate transforms ---
  localToGlobal(g) {
    let { x: t, y: b } = g, s = this;
    while (s)
      t += s._offset.x, b += s._offset.y,
      s = s.parent,
      if (s && !("_offset" in s)) break;
    return { x: t, y: b };
  }

  globalToLocal(g) {
    let t = this.localToGlobal({ x: 0, y: 0 });
    return { x: g.x - t.x, y: g.y - t.y };
  }

  // --- CRITICAL: layout(constraints) ---
  _lastConstraints;

  layout(g) {
    let t = !this._lastConstraints || !g.equals(this._lastConstraints);
    if (!this._needsLayout && !t) return;  // skip if clean + same constraints
    this._lastConstraints = g;
    this._needsLayout = !1;                // mark clean BEFORE performLayout
    this.performLayout();                   // subclass hook
  }

  // --- Intrinsic sizing protocol ---
  getMinIntrinsicWidth(g) {
    let t = this.children;
    if (t.length === 0) return 0;
    let b = 0;
    for (let s of t) b = Math.max(b, s.getMinIntrinsicWidth(g));
    return b;
  }

  getMaxIntrinsicWidth(g)  { /* same pattern, Math.max over children */ }
  getMinIntrinsicHeight(g) { /* same pattern */ }
  getMaxIntrinsicHeight(g) { /* same pattern */ }

  // --- paint: with viewport culling ---
  paint(g, t = 0, b = 0) {
    let s = g.getSize(), a = s.width, r = s.height;
    for (let m of this.children)
      if (m instanceof j9) {
        let p = t + this.offset.x + m.offset.x;
        let f = b + this.offset.y + m.offset.y;
        let l = p + m.size.width;
        let i = f + m.size.height;
        // Viewport culling: skip if entirely off-screen
        if (!(p >= a || f >= r || l <= 0 || i <= 0))
          m.paint(g, t + this.offset.x, b + this.offset.y);
      }
  }

  // --- hitTest ---
  hitTest(g, t, b = 0, s = 0) {
    let a = b + this.offset.x, r = s + this.offset.y;
    let m = t.x >= a && t.x < a + this.size.width;
    let p = t.y >= r && t.y < r + this.size.height;
    if (m && p) {
      g.addWithPaintOffset(this, { x: a, y: r }, t);
      for (let l = this.children.length - 1; l >= 0; l--)
        this.children[l].hitTest(g, t, a, r);
      return !0;
    }
    if (this.allowHitTestOutsideBounds) {
      for (let l = this.children.length - 1; l >= 0; l--)
        this.children[l].hitTest(g, t, a, r);
    }
    return !1;
  }
}
```

### Key Annotations

- **layout() vs performLayout()**: `layout(constraints)` is the parent-facing API.
  It checks if constraints changed or needs layout, caches constraints, clears
  `_needsLayout`, then calls `performLayout()`. Subclasses override `performLayout()`.
- **No `parentUsesSize`**: The Flutter `layout(constraints, parentUsesSize: false)`
  parameter is absent. Every layout call is effectively `parentUsesSize: true`.
- **No `sizedByParent` / `performResize()`**: The two-phase layout optimization does
  not exist. All sizing happens in `performLayout()`.
- **Offset is built into RenderBox**: Unlike Flutter where `BoxParentData.offset` is
  on the parentData, here `_offset` is directly on `j9`. Values are `Math.round()`'d
  since TUI uses integer cell positions.
- **Viewport culling in paint()**: RenderBox.paint() skips children that are entirely
  outside the screen bounds. This is a TUI-specific optimization.

---

## 3. BoxConstraints (`l3`)

**Line 529716**:

```javascript
class l3 {
  minWidth;    // number (default 0)
  maxWidth;    // number (default Infinity)
  minHeight;   // number (default 0)
  maxHeight;   // number (default Infinity)

  constructor(g, t, b, s) {
    // Can take either (minW, maxW, minH, maxH) or ({ minWidth, ... })
    if (typeof g === "object")
      this.minWidth = g.minWidth ?? 0, this.maxWidth = g.maxWidth ?? Infinity,
      this.minHeight = g.minHeight ?? 0, this.maxHeight = g.maxHeight ?? Infinity;
    else
      this.minWidth = g ?? 0, this.maxWidth = t ?? Infinity,
      this.minHeight = b ?? 0, this.maxHeight = s ?? Infinity;
  }

  static tight(g, t)  { return new l3(g, g, t, t) }
  static loose(g, t)   { return new l3(0, g, 0, t) }

  get hasBoundedWidth()  { return this.maxWidth !== Infinity }
  get hasBoundedHeight() { return this.maxHeight !== Infinity }
  get hasTightWidth()    { return this.minWidth >= this.maxWidth }
  get hasTightHeight()   { return this.minHeight >= this.maxHeight }

  constrain(g, t) {
    return {
      width:  Math.max(this.minWidth, Math.min(this.maxWidth, g)),
      height: Math.max(this.minHeight, Math.min(this.maxHeight, t))
    };
  }

  enforce(g) {
    // Clamp another constraint's values to fit within this constraint
    let t = (b, s, a) => Math.max(s, Math.min(a, b));
    return new l3(
      t(g.minWidth, this.minWidth, this.maxWidth),
      t(g.maxWidth, this.minWidth, this.maxWidth),
      t(g.minHeight, this.minHeight, this.maxHeight),
      t(g.maxHeight, this.minHeight, this.maxHeight)
    );
  }

  get biggest()  { return { width: this.maxWidth, height: this.maxHeight } }
  get smallest() { return { width: this.minWidth, height: this.minHeight } }

  loosen()  { return new l3(0, this.maxWidth, 0, this.maxHeight) }

  tighten({ width, height } = {}) {
    // Tighten to specific values (clamped within bounds)
    return new l3(
      width === void 0  ? this.minWidth  : Math.max(this.minWidth, Math.min(this.maxWidth, width)),
      width === void 0  ? this.maxWidth  : Math.max(this.minWidth, Math.min(this.maxWidth, width)),
      height === void 0 ? this.minHeight : Math.max(this.minHeight, Math.min(this.maxHeight, height)),
      height === void 0 ? this.maxHeight : Math.max(this.minHeight, Math.min(this.maxHeight, height))
    );
  }

  static tightFor({ width, height } = {}) {
    return new l3(width ?? 0, width ?? Infinity, height ?? 0, height ?? Infinity);
  }

  equals(g) {
    return this.minWidth === g.minWidth && this.maxWidth === g.maxWidth
        && this.minHeight === g.minHeight && this.maxHeight === g.maxHeight;
  }
}
```

---

## 4. PipelineOwner (`UB0`)

**Line 530127** -- Manages the layout/paint pipeline:

```javascript
class UB0 {
  _nodesNeedingPaint = new Set;
  _rootRenderObject = null;
  _rootConstraints = null;

  constructor() {}

  // --- Called by markNeedsLayout (via xH().requestLayout) ---
  requestLayout(g) {
    if (!c9.instance.isFrameInProgress)
      c9.instance.requestFrame();
    // NOTE: does NOT maintain a _nodesNeedingLayout list!
    // Layout is driven entirely from the root.
  }

  // --- Called by markNeedsPaint (via xH().requestPaint) ---
  requestPaint(g) {
    if (this._nodesNeedingPaint.has(g)) return;
    this._nodesNeedingPaint.add(g);
    if (!c9.instance.isFrameInProgress)
      c9.instance.requestFrame();
  }

  setRootRenderObject(g) { this._rootRenderObject = g }

  updateRootConstraints(g) {
    let t = new l3(0, g.width, 0, g.height);
    let b = !this._rootConstraints
         || this._rootConstraints.maxWidth !== t.maxWidth
         || this._rootConstraints.maxHeight !== t.maxHeight;
    this._rootConstraints = t;
    if (b && this._rootRenderObject && "markNeedsLayout" in this._rootRenderObject)
      this._rootRenderObject.markNeedsLayout();
  }

  // --- flushLayout: layout from root only ---
  flushLayout() {
    let g = !1;
    if (this._rootRenderObject && this._rootConstraints
        && "needsLayout" in this._rootRenderObject
        && this._rootRenderObject.needsLayout) {
      if ("layout" in this._rootRenderObject
          && typeof this._rootRenderObject.layout === "function")
        this._rootRenderObject.layout(this._rootConstraints);
      g = !0;
    }
    return g;  // returns whether layout happened
  }

  // --- flushPaint: clear paint dirty flags ---
  flushPaint() {
    if (this._nodesNeedingPaint.size === 0) return;
    try {
      for (let g of this._nodesNeedingPaint)
        if (g.needsPaint) g._needsPaint = !1;
    } finally {
      this._nodesNeedingPaint.clear();
    }
  }

  get nodesNeedingLayout() { return [] }
  get nodesNeedingPaint()  { return Array.from(this._nodesNeedingPaint) }
  get hasNodesNeedingLayout() {
    return Boolean(this._rootRenderObject && this._rootRenderObject.needsLayout);
  }
  get hasNodesNeedingPaint() { return this._nodesNeedingPaint.size > 0 }

  dispose() { this._nodesNeedingPaint.clear() }
  removeFromQueues(g) { this._nodesNeedingPaint.delete(g) }
}
```

### Key Difference from Flutter

- **No `_nodesNeedingLayout` list**: Flutter maintains a sorted list of dirty nodes and
  walks each one. Amp's TUI always layouts from the root when anything is dirty. This is
  simpler but means every dirty node triggers a full tree layout.
- **flushPaint is trivial**: Just clears the dirty flags. Actual painting happens in the
  render phase of the frame callback, driven by `WidgetsBinding.paint()`.

---

## 5. Frame Scheduler (`c9` -- SchedulerBinding)

**Line 530127**:

### Phase Enum (`oJ`)

```javascript
var oJ;
((g) => {
  g.BUILD  = "build";
  g.LAYOUT = "layout";
  g.PAINT  = "paint";
  g.RENDER = "render";
})(oJ || = {});
```

### Frame Scheduler (singleton)

```javascript
class c9 {
  static _instance;
  _frameCallbacks = new Map;
  _postFrameCallbacks = [];
  _frameScheduled = !1;
  _frameInProgress = !1;
  // ... (60fps pacing)

  static get instance() { return c9._instance ??= new c9 }

  requestFrame() { /* schedules via setImmediate or setTimeout for frame pacing */ }

  executeFrame() {
    this._frameScheduled = !1;
    this._frameInProgress = !0;
    try {
      for (let t of ["build", "layout", "paint", "render"])
        this.executePhase(t);
      this.executePostFrameCallbacks();
    } finally {
      this._frameInProgress = !1;
    }
  }

  executePhase(g) {
    // Sort callbacks by priority, execute each
    let b = Array.from(this._frameCallbacks.values())
      .filter(s => s.phase === g)
      .sort((s, a) => s.priority - a.priority);
    for (let s of b)
      s.callback();
  }

  addFrameCallback(g, t, b, s = 0, a) { /* register for phase */ }
  addPostFrameCallback(g, t) { /* run after frame */ }
}
```

---

## 6. WidgetsBinding (`J3`) -- Frame Pipeline Integration

**Line 530127** -- The binding ties everything together:

```javascript
class J3 {
  static _instance;
  frameScheduler = c9.instance;
  buildOwner;          // NB0
  pipelineOwner;       // UB0
  focusManager = er.instance;
  mouseManager = Pg.instance;
  tui = new wB0;       // Terminal UI driver
  rootElement;

  constructor() {
    this.buildOwner = new NB0;
    this.pipelineOwner = new UB0;

    // Register frame callbacks for each phase:
    this.frameScheduler.addFrameCallback("frame-start",
      () => this.beginFrame(), "build", -2000);
    this.frameScheduler.addFrameCallback("resize",
      () => this.processResizeIfPending(), "build", -1000);
    this.frameScheduler.addFrameCallback("build",
      () => { this.buildOwner.buildScopes(); this.updateRootRenderObject(); },
      "build", 0);
    this.frameScheduler.addFrameCallback("layout",
      () => {
        this.updateRootConstraints();
        if (this.pipelineOwner.flushLayout())
          this.shouldPaintCurrentFrame = !0;
      }, "layout", 0);
    this.frameScheduler.addFrameCallback("paint",
      () => this.paint(), "paint", 0);
    this.frameScheduler.addFrameCallback("render",
      () => this.render(), "render", 0);

    // Wire up the global accessors:
    VG8(
      { scheduleBuildFor: (g) => this.buildOwner.scheduleBuildFor(g) },
      { requestLayout: (g) => this.pipelineOwner.requestLayout(g),
        requestPaint:  (g) => this.pipelineOwner.requestPaint(g),
        removeFromQueues: (g) => this.pipelineOwner.removeFromQueues(g) }
    );
  }

  // --- Frame lifecycle ---
  beginFrame() {
    this.didPaintCurrentFrame = !1;
    this.shouldPaintCurrentFrame =
      this.forcePaintOnNextFrame
      || this.buildOwner.hasDirtyElements
      || this.pipelineOwner.hasNodesNeedingLayout
      || this.pipelineOwner.hasNodesNeedingPaint
      || this.tui.getScreen().requiresFullRefresh;
    this.forcePaintOnNextFrame = !1;
  }

  paint() {
    if (!this.shouldPaintCurrentFrame) return;
    this.pipelineOwner.flushPaint();
    let g = this.rootElement.renderObject;
    let t = this.tui.getScreen();
    t.clear(); t.clearCursor();
    this.renderRenderObject(g, t, 0, 0);
    this.didPaintCurrentFrame = !0;
  }

  render() {
    if (!this.didPaintCurrentFrame) return;
    this.tui.render();  // flush screen buffer to terminal
  }

  renderRenderObject(g, t, b, s) {
    if ("paint" in g && typeof g.paint === "function")
      g.paint(t, b, s);
  }
}
```

### Frame Pipeline Order

```
1. BUILD phase:
   - beginFrame()          -- decide if paint needed
   - processResizeIfPending()
   - buildOwner.buildScopes()  -- rebuild dirty Elements
   - updateRootRenderObject()

2. LAYOUT phase:
   - updateRootConstraints()
   - pipelineOwner.flushLayout()  -- layout from root down

3. PAINT phase:
   - pipelineOwner.flushPaint()  -- clear dirty flags
   - screen.clear()
   - rootRenderObject.paint(screen, 0, 0)  -- walk tree, write to screen buffer

4. RENDER phase:
   - tui.render()  -- diff screen buffer, write escape codes to stdout
```

---

## 7. BuildOwner (`NB0`)

**Line 530127**:

```javascript
class NB0 {
  _dirtyElements = new Set;

  scheduleBuildFor(g) {
    if (this._dirtyElements.has(g)) return;
    this._dirtyElements.add(g);
    c9.instance.requestFrame();
  }

  buildScopes() {
    if (this._dirtyElements.size === 0) return;
    while (this._dirtyElements.size > 0) {
      let b = Array.from(this._dirtyElements);
      this._dirtyElements.clear();
      b.sort((s, a) => s.depth - a.depth);  // parent-first
      for (let s of b)
        if (s.dirty) {
          s.performRebuild();
          s._dirty = !1;
        }
    }
  }

  get hasDirtyElements() { return this._dirtyElements.size > 0 }
}
```

---

## 8. ParentData Classes

### Base ParentData (`PJ`)

**Line 530350**:

```javascript
class PJ {
  detach() {}
  toString() { return `${this.constructor.name}#${this.hashCode()}` }
  hashCode() { return Math.random().toString(36).substr(2, 9) }
}
```

### FlexParentData (`S_ extends PJ`)

**Line 530350**:

```javascript
class S_ extends PJ {
  flex;    // number
  fit;     // "tight" | "loose"

  constructor(g = 0, t = "tight") {
    super();
    this.flex = g;
    this.fit = t;
  }
}
```

### BoxParentData Note

In Flutter, `BoxParentData` provides the `offset` field. In Amp's TUI, the offset
(`_offset = {x, y}`) is built directly into `j9` (RenderBox). There is no separate
`BoxParentData` class. The `parentData` field on `n_` is used only for flex-specific
data (`S_`), not for positioning.

---

## 9. Element-to-RenderObject Connection

### RenderObjectWidget (`yj extends Sf`)

**Line 529716**:

```javascript
class yj extends Sf {
  constructor({ key } = {}) { super(key !== void 0 ? { key } : {}) }
  createElement() { return new oj(this) }
  updateRenderObject(g) {}   // subclass hook to update render object properties
}
```

### SingleChildRenderObjectWidget (`Qb extends yj`)

```javascript
class Qb extends yj {
  child;
  constructor({ key, child } = {}) { super(key ? { key } : {}); this.child = child; }
  createElement() { return new uv(this) }
}
```

### MultiChildRenderObjectWidget (`An extends yj`)

```javascript
class An extends yj {
  children;
  constructor({ key, children } = {}) { super(key ? { key } : {}); this.children = [...children]; }
  createElement() { return new rJ(this) }
}
```

### RenderObjectElement (`oj extends T$`)

```javascript
class oj extends T$ {
  _renderObject;

  get renderObjectWidget() { return this.widget }
  get renderObject()       { return this._renderObject }

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
}
```

### SingleChildRenderObjectElement (`uv extends oj`)

Manages one child. On `mount()`, creates child element and calls
`this.renderObject.adoptChild(child.renderObject)`. On `update()`, either
updates in-place or unmounts+remounts the child.

### MultiChildRenderObjectElement (`rJ extends oj`)

Manages `_childElements[]`. On `mount()`, creates all child elements and
`adoptChild()`s their render objects. On `update()`, runs a diff algorithm
similar to Flutter's `updateChildren()`.

---

## 10. Concrete RenderBox Subclasses

### RenderFlex (`oU0 extends j9`) -- Row/Column

**Line 530350-530351**:

```javascript
class oU0 extends j9 {
  _direction;           // "horizontal" | "vertical"
  _mainAxisAlignment;   // "start" | "center" | "end" | "spaceBetween" | "spaceAround" | "spaceEvenly"
  _crossAxisAlignment;  // "start" | "center" | "end" | "stretch"
  _mainAxisSize;        // "min" | "max"

  performLayout() {
    super.performLayout();
    let g = this._lastConstraints;
    let t = this._direction === "horizontal";

    // Phase 1: Separate flex and non-flex children
    let b = []; // flex children (Expanded)
    let s = []; // non-flex children
    for (let v of this.children) {
      let x = v.parentData;
      if (x && x.flex > 0) b.push({ child: v, flex: x.flex, fit: x.fit });
      else s.push(v);
    }

    // Phase 2: Layout non-flex children, measure cross axis
    let a = 0, r = 0;
    // ... layout each non-flex child with loose constraints
    // accumulate main axis size, track max cross axis

    // Phase 3: Distribute remaining space to flex children
    let f = isFinite(maxMain) ? Math.max(0, maxMain - a) : 0;
    let i = b.reduce((v, x) => v + x.flex, 0);
    // ... give each flex child (freeSpace * flex / totalFlex)

    // Phase 4: Position children with mainAxisAlignment offsets
    // ... calculate leading space, between space based on alignment
    // ... set each child's offset
  }
}
```

### ContainerRenderBox (`fE extends j9`) -- Decorated Box

**Line 530350**:

```javascript
class fE extends j9 {
  _width; _height; _padding; _margin; _decoration; _constraints;

  performLayout() {
    super.performLayout();
    let g = this._lastConstraints;
    // Calculate available space after margin, padding, border
    // Layout child with inner constraints
    // Set child offset accounting for margin + border + padding
    // Set own size to child size + decorations
  }

  paint(g, t, b) {
    // Fill background color
    // Paint border (rounded/square corners)
    // Paint children via super.paint()
  }

  // Full intrinsic size protocol implementation
  getMinIntrinsicWidth(g)  { /* child intrinsic + decorations */ }
  getMaxIntrinsicWidth(g)  { /* child intrinsic + decorations */ }
  getMinIntrinsicHeight(g) { /* child intrinsic + decorations */ }
  getMaxIntrinsicHeight(g) { /* child intrinsic + decorations */ }
}
```

### ClipRect (`dU0 extends j9`)

**Line 530350**:

```javascript
class dU0 extends j9 {
  _clipBehavior;  // "none" | "antiAlias"

  performLayout() {
    let g = this._lastConstraints;
    if (this.children.length === 0) {
      this.setSize(g.minWidth, g.minHeight);
      return;
    }
    let t = this.children[0];
    t.layout(g);
    this.setSize(t.size.width, t.size.height);
  }

  paint(g, t, b) {
    if (this._clipBehavior === "none") { super.paint(g, t, b); return; }
    // Create clipped screen region (E$) and paint child into it
    let f = new E$(g, a, r, m, p);
    this.children[0].paint(f, t + this.offset.x, b + this.offset.y);
  }
}
```

---

## 11. Global Accessor Functions

**Line 529716**:

```javascript
var lF = null;  // BuildOwner callbacks
var dF = null;  // PipelineOwner callbacks

// Set by WidgetsBinding constructor
function VG8(g, t) { lF = g; dF = t; }

// Get BuildOwner scheduler
function XG8() {
  if (!lF) {
    if (H_0()) return { scheduleBuildFor: () => {} };  // test env stub
    throw Error("Build scheduler not initialized.");
  }
  return lF;
}

// Get PipelineOwner callbacks
function xH() {
  if (!dF) {
    if (H_0()) return { requestLayout: () => {}, requestPaint: () => {}, removeFromQueues: () => {} };
    throw Error("Pipeline owner not initialized.");
  }
  return dF;
}
```

---

## 12. Summary: Flutter vs Amp TUI Render Pipeline

| Concept | Flutter | Amp TUI |
|---------|---------|---------|
| RenderObject base | `RenderObject` | `n_` |
| RenderBox | `RenderBox` | `j9 extends n_` |
| BoxConstraints | `BoxConstraints` | `l3` |
| PipelineOwner | `PipelineOwner` | `UB0` |
| BuildOwner | `BuildOwner` | `NB0` |
| SchedulerBinding | `SchedulerBinding` | `c9` |
| WidgetsBinding | `WidgetsBinding` | `J3` |
| ParentData | `ParentData` | `PJ` |
| FlexParentData | `FlexParentData` | `S_ extends PJ` |
| BoxParentData.offset | `BoxParentData` | Built into `j9._offset` |
| RelayoutBoundary | Yes, stops propagation | **No** -- always propagates to root |
| RepaintBoundary | Yes, compositing layers | **No** -- full repaint each frame |
| sizedByParent | Two-phase layout optimization | **No** -- all in performLayout |
| parentUsesSize | Affects relayout boundary | **No** -- not present |
| Layout list | `_nodesNeedingLayout` sorted | Root-only: if root dirty, layout all |
| Paint list | `_nodesNeedingPaint` | `Set` in UB0, cleared in flushPaint |
| Frame phases | build, layout, compositingBits, paint, compositing, semantics | build, layout, paint, render |
| Screen output | Layer tree -> GPU | Screen buffer -> terminal escape codes |
| Coordinate system | Floating-point pixels | Integer cell positions (Math.round) |
| Viewport culling | Layer-level clipping | Built into j9.paint() bounds check |
| Child management | `ContainerRenderObjectMixin` | Built into `n_` base class |
