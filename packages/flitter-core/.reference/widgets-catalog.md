# Amp CLI Widget Catalog - Reverse-Engineered Reference

> Extracted from `/home/gem/home/tmp/amp-strings.txt` (531013 lines)
> Primary widget code found on lines 530135, 530350, 530353, 530387, 530700, 530811, 530822, 530899, 530903, 530904

---

## Table of Contents

1. [Widget Class Hierarchy](#widget-class-hierarchy)
2. [Core Infrastructure](#core-infrastructure)
3. [Text (e0) - Rich Text Rendering](#1-text-e0---rich-text-rendering)
4. [Column (o8) - Vertical Flex Layout](#2-column-o8---vertical-flex-layout)
5. [Row (q8) - Horizontal Flex Layout](#3-row-q8---horizontal-flex-layout)
6. [Flex Base (IJ) and RenderFlex (oU0)](#4-flex-base-ij-and-renderflex-ou0)
7. [SingleChildScrollView (R4)](#5-singlechildscrollview-r4)
8. [SizedBox (X0)](#6-sizedbox-x0)
9. [Padding (R8)](#7-padding-r8)
10. [Container (A8)](#8-container-a8)
11. [Expanded (u3)](#9-expanded-u3)
12. [Flexible (lv)](#10-flexible-lv)
13. [Stack (ng) and Positioned (L4)](#11-stack-ng-and-positioned-l4)
14. [Table (jA)](#12-table-ja)
15. [DiffView (Bn)](#13-diffview-bn)
16. [Dialog (ab)](#14-dialog-ab)
17. [Center (h3)](#15-center-h3)
18. [Spacer (cg)](#16-spacer-cg)
19. [Divider (WF0)](#17-divider-wf0)
20. [Button (ME)](#18-button-me)
21. [MouseRegion (T3)](#19-mouseregion-t3)
22. [FocusScope / KeyboardListener (t4)](#20-focusscope--keyboardlistener-t4)
23. [Scrollbar (ia)](#21-scrollbar-ia)
24. [ScrollController (Lg)](#22-scrollcontroller-lg)
25. [SelectionList / Dialog (ap)](#23-selectionlist--dialog-ap)
26. [ClipRect (nv)](#24-cliprect-nv)
27. [IntrinsicHeight (hJ)](#25-intrinsicheight-hj)
28. [Markdown (_g)](#26-markdown-_g)
29. [Image Preview (O_)](#27-image-preview-o_)
30. [Supporting Classes](#supporting-classes)

---

## Widget Class Hierarchy

```
Sf (Widget base)
  +-- Bt (InheritedWidget)
  |     +-- w3 (Theme)
  |     +-- X_ (ImagePreviewProvider)
  |     +-- J_ (HoverContext)
  +-- ef (LeafWidget / LeafRenderObjectWidget)
  |     +-- e0 (Text)
  |     +-- WF0 (Divider)
  +-- Qb (SingleChildRenderObjectWidget)
  |     +-- X0 (SizedBox)
  |     +-- A8 (Container)
  |     +-- T3 (MouseRegion)
  |     +-- nv (ClipRect)
  |     +-- h3 (Center)
  |     +-- yH0 (ScrollViewport)
  |     +-- IH0 (KittyImageWidget)
  +-- R_ (ParentDataWidget)
  |     +-- u3 (Expanded)
  |     +-- lv (Flexible)
  |     +-- L4 (Positioned)
  +-- An (MultiChildRenderObjectWidget)
  |     +-- IJ (Flex)
  |     |     +-- o8 (Column)
  |     |     +-- q8 (Row)
  |     +-- ng (Stack)
  +-- H8 (StatefulWidget)
  |     +-- t4 (FocusScope / KeyboardListener)
  |     +-- ap (SelectionList / Dialog prompt)
  |     +-- O_ (ImagePreview)
  |     +-- ia (Scrollbar)
  |     +-- R4 > dH0 (Scrollable)
  +-- H3 (StatelessWidget)
        +-- R4 (SingleChildScrollView)
        +-- jA (Table)
        +-- Bn (DiffView)
        +-- ME (Button)
        +-- _g (Markdown)
        +-- bt (ContainerWithOverlays)

j9 (RenderBox base)
  +-- gU0 (RenderText)
  +-- oU0 (RenderFlex)
  +-- xU0 (RenderSizedBox)
  +-- RU0 (RenderPadding)
  +-- cF  (RenderCenter)
  +-- hF  (RenderStack)
  +-- Ba  (RenderMouseRegion)
  +-- oH0 (RenderScrollViewport)
  +-- DF0 (RenderDivider)
  +-- xD0 (RenderScrollableContent)
```

---

## Core Infrastructure

### BoxConstraints (l3)
**Line: 530353**

```javascript
class l3 {
  minWidth; maxWidth; minHeight; maxHeight;

  constructor(g, t, b, s) {
    // Supports object form: new l3({ minWidth, maxWidth, minHeight, maxHeight })
    // Or positional: new l3(minWidth, maxWidth, minHeight, maxHeight)
    if (typeof g === "object")
      this.minWidth = g.minWidth ?? 0,
      this.maxWidth = g.maxWidth ?? Infinity,
      this.minHeight = g.minHeight ?? 0,
      this.maxHeight = g.maxHeight ?? Infinity;
    else
      this.minWidth = g ?? 0,
      this.maxWidth = t ?? Infinity,
      this.minHeight = b ?? 0,
      this.maxHeight = s ?? Infinity;
  }

  static tight(w, h)  { return new l3(w, w, h, h); }
  static loose(w, h)   { return new l3(0, w, 0, h); }

  get hasBoundedWidth()  { return this.maxWidth !== Infinity; }
  get hasBoundedHeight() { return this.maxHeight !== Infinity; }
  get hasTightWidth()    { return this.minWidth >= this.maxWidth; }
  get hasTightHeight()   { return this.minHeight >= this.maxHeight; }

  constrain(w, h) {
    return {
      width:  Math.max(this.minWidth, Math.min(this.maxWidth, w)),
      height: Math.max(this.minHeight, Math.min(this.maxHeight, h))
    };
  }

  enforce(other) { /* clamp other's bounds within this */ }
  get biggest()  { return { width: this.maxWidth, height: this.maxHeight }; }
  get smallest() { return { width: this.minWidth, height: this.minHeight }; }
  loosen()       { return new l3(0, this.maxWidth, 0, this.maxHeight); }
}
```

### EdgeInsets (g8)
**Line: 530353**

```javascript
class g8 {
  left; top; right; bottom;

  constructor(g, t, b, s) {
    // Object form: new g8({ left, top, right, bottom })
    // Positional: new g8(left, top, right, bottom)
  }

  static all(v)              { return new g8(v, v, v, v); }
  static symmetric(h=0, v=0) { return new g8(h, v, h, v); }
  // NOTE: symmetric(horizontal, vertical) -- first arg is left/right, second is top/bottom
  static horizontal(v)       { return new g8(v, 0, v, 0); }
  static vertical(v)         { return new g8(0, v, 0, v); }
  static only({ left, top, right, bottom }) { /* named fields */ }

  get horizontal() { return this.left + this.right; }
  get vertical()   { return this.top + this.bottom; }
}
```

### TextStyle (m0)
**Line: 530135**

```javascript
class m0 {
  color;            // w0 color instance
  backgroundColor;  // w0 color instance
  bold;             // boolean
  italic;           // boolean
  underline;        // boolean
  strikethrough;    // boolean
  dim;              // boolean

  constructor({ color, backgroundColor, bold, italic, underline, strikethrough, dim } = {})

  copyWith({ color, backgroundColor, bold, italic, underline, strikethrough, dim })
  merge(other)  // other style overrides this style's undefined fields

  // Static factories:
  static normal(color)     // plain text, optional color
  static bold(color)       // bold text, optional color
  static italic(color)     // italic text, optional color
  static underline(color)  // underline text, optional color
  static colored(color)    // just color, no other styling
  static background(color) // just background color
}
```

### TextSpan (q)
**Line: 530135**

```javascript
class q {
  text;       // string | undefined
  style;      // m0 | undefined
  children;   // q[] | undefined
  hyperlink;  // { uri: string, id?: string } | undefined
  onClick;    // function | undefined

  constructor(text, style, children, hyperlink, onClick)

  toPlainText()       // Flatten tree to string
  equals(other)       // Deep structural comparison
  visitTextSpan(fn)   // Walk the span tree; fn returns false to stop
}
```

### BoxDecoration (_9) and Border (B3)
**Line: 530353**

```javascript
class _9 {  // BoxDecoration
  color;   // background color
  border;  // B3 instance
  constructor(color, border)
}

class B3 {  // Border
  top; right; bottom; left;  // P3 (BorderSide) instances
  constructor(top, right, bottom, left)
  static all(side) { return new B3(side, side, side, side); }
}

class P3 {  // BorderSide
  color;  // default: w0.black
  width;  // default: 1
  style;  // "rounded" | "solid" -- default: "rounded"
  constructor(color = w0.black, width = 1, style = "rounded")
}
```

### FlexParentData (S_)
**Line: 530353**

```javascript
class S_ extends PJ {
  flex;  // number, default 0
  fit;   // "tight" | "loose", default "tight"
  constructor(flex = 0, fit = "tight")
}
```

---

## 1. Text (e0) - Rich Text Rendering

**Minified ID**: `e0`
**Line**: 530135
**Extends**: `ef` (LeafRenderObjectWidget)
**Element**: `JB0`
**RenderObject**: `gU0` (extends `j9`)

### Widget Constructor

```javascript
class e0 extends ef {
  text;        // q (TextSpan) - the rich text tree
  textAlign;   // "left" | "center" | "right" -- default: "left"
  maxLines;    // number | undefined
  overflow;    // "clip" | "ellipsis" -- default: "clip"
  selectable;  // boolean -- default: false

  constructor({ key, text, textAlign = "left", maxLines, overflow = "clip", selectable = false })

  createElement()       { return new JB0(this); }
  createRenderObject()  { return new gU0(this.text, this.textAlign, ...); }
  updateRenderObject(g) {}
}
```

### Element (JB0)

```javascript
class JB0 extends O$ {
  mount()  // Sets up render object, reads MediaQuery for emoji width support
  update() // Re-reads MediaQuery, updates text/alignment/maxLines/overflow/selectable

  _updateRenderObjectWithMediaQuery() {
    // Reads: Q3.of(context) -- MediaQuery for supportsEmojiWidth
    // Reads: w3.maybeOf(context) -- Theme for selection color & copy highlight color
    // Falls back to w0.index(8) for selection, w0.yellow for copy highlight
  }
}
```

### RenderObject (gU0) - RenderText

Key fields:
- `_text`, `_textAlign`, `_maxLines`, `_overflow`
- `_emojiWidthSupported`, `_selectable`
- `selectableId`, `_selectionArea`, `_selectedRanges[]`
- `_cachedStyledCells`, `_characterPositions[]`, `_visualLines[]`
- `_selectionColor`, `_copyHighlightColor`, `_highlightMode`
- `_hasTappableSpans`

Key methods:
- `handleMouseEvent(event)` -- click-through for hyperlinks, hover cursor changes
- `updateSelection(start, end, mode)` -- selection/copy highlighting
- `getCharacterRect(index)` -- returns `{ x, y, width, height: 1 }`
- `getOffsetForPosition(x, y)` -- hit-test to character offset
- `getHyperlinkAtPosition(x, y)` -- returns URI string or null
- `getOnClickAtPosition(x, y)` -- returns onClick handler or null

### ANSI Text Parsing

Function `ZB0(textSpan)` normalizes `\r` in text spans.

ANSI escape code parser (`oX8`) maps SGR codes to `m0` styles:
- 0: reset, 1: bold, 2: dim, 3: italic, 4: underline, 9: strikethrough
- 30-37: foreground colors (index 0-7)
- 38;2;R;G;B: RGB foreground, 38;5;N: indexed foreground
- 40-47: background colors, 48: extended background
- 90-97: bright foreground (index 8-15)

OSC 8 hyperlink parsing (`vX8`): `8;params;URI` format, extracts `{ uri, id }`.

---

## 2. Column (o8) - Vertical Flex Layout

**Minified ID**: `o8`
**Line**: 530353
**Extends**: `IJ` (Flex base)
**Direction**: `"vertical"`

```javascript
class o8 extends IJ {
  constructor({
    key,
    children = [],
    mainAxisAlignment = "start",
    crossAxisAlignment = "center",
    mainAxisSize = "max"
  } = {}) {
    super({ direction: "vertical", children, mainAxisAlignment, crossAxisAlignment, mainAxisSize });
  }

  // Static convenience constructors:
  static start(children)        // mainAxisAlignment: "start"
  static center(children)       // mainAxisAlignment: "center"
  static end(children)          // mainAxisAlignment: "end"
  static spaceBetween(children) // mainAxisAlignment: "spaceBetween"
  static spaceAround(children)  // mainAxisAlignment: "spaceAround"
  static spaceEvenly(children)  // mainAxisAlignment: "spaceEvenly"
}
```

---

## 3. Row (q8) - Horizontal Flex Layout

**Minified ID**: `q8`
**Line**: 530353
**Extends**: `IJ` (Flex base)
**Direction**: `"horizontal"`

```javascript
class q8 extends IJ {
  constructor({
    key,
    children = [],
    mainAxisAlignment = "start",
    crossAxisAlignment = "center",
    mainAxisSize = "max"
  } = {}) {
    super({ direction: "horizontal", children, mainAxisAlignment, crossAxisAlignment, mainAxisSize });
  }

  // Same static convenience constructors as Column:
  static start(children)
  static center(children)
  static end(children)
  static spaceBetween(children)
  static spaceAround(children)
  static spaceEvenly(children)
}
```

---

## 4. Flex Base (IJ) and RenderFlex (oU0)

**Line**: 530353

### Flex Widget (IJ)

```javascript
class IJ extends An {
  direction;           // "horizontal" | "vertical"
  mainAxisAlignment;   // "start"|"end"|"center"|"spaceBetween"|"spaceAround"|"spaceEvenly"
  crossAxisAlignment;  // "start"|"end"|"center"|"stretch"|"baseline"
  mainAxisSize;        // "min" | "max"

  createRenderObject() {
    return new oU0(this.direction, this.mainAxisAlignment, this.crossAxisAlignment, this.mainAxisSize);
  }
}
```

### RenderFlex (oU0) - Layout Algorithm

**Critical layout method** `performLayout()`:

```javascript
// Phase 1: Layout non-flex children, accumulate total size and total flex
let allocatedSize = 0, totalFlex = 0;
for (child of children) {
  let parentData = child.parentData;
  if (parentData?.flex > 0) {
    totalFlex += parentData.flex;
  } else {
    // Layout with unbounded main axis
    child.layout(isHorizontal
      ? new l3(0, Infinity, 0, constraints.maxHeight)
      : new l3(0, constraints.maxWidth, 0, Infinity));
    allocatedSize += isHorizontal ? child.size.width : child.size.height;
    crossSize = Math.max(crossSize, isHorizontal ? child.size.height : child.size.width);
  }
}

// Phase 2: Distribute remaining space to flex children
let freeSpace = mainAxisLimit - allocatedSize;
if (totalFlex > 0) {
  let spacePerFlex = freeSpace / totalFlex;
  for (child of flexChildren) {
    let childMainSize = Math.floor(spacePerFlex * child.flex);
    // fit="tight" -> tight constraints at childMainSize
    // fit="loose" -> loose constraints (0..childMainSize) if NOT in unbounded
    child.layout(constraintsForFit);
  }
}

// Phase 3: Position children based on mainAxisAlignment
// "start"        -> offset=0
// "end"          -> offset=remainingSpace
// "center"       -> offset=remainingSpace/2
// "spaceBetween" -> spacing=remaining/(count-1)
// "spaceAround"  -> spacing=remaining/count, offset=spacing/2
// "spaceEvenly"  -> spacing=remaining/(count+1), offset=spacing
```

### Intrinsic Size Methods

The RenderFlex provides all four intrinsic methods:
- `getMinIntrinsicWidth(height)` / `getMaxIntrinsicWidth(height)`
- `getMinIntrinsicHeight(width)` / `getMaxIntrinsicHeight(width)`

For the main axis direction, it sums non-flex children and adds `maxIntrinsicSize/flex * totalFlex` for flex children. For the cross axis, it takes the maximum.

---

## 5. SingleChildScrollView (R4)

**Minified ID**: `R4`
**Line**: 530387
**Extends**: `H3` (StatelessWidget)
**Render**: `oH0` (RenderScrollViewport)

### Widget

```javascript
class R4 extends H3 {
  child;              // Widget
  controller;         // Lg (ScrollController)
  scrollDirection;    // "vertical" | "horizontal" -- default: "vertical"
  autofocus;          // boolean -- default: true
  position;           // "top" | "bottom" -- default: "top"
  keyboardScrolling;  // boolean -- default: true

  build(context) {
    return new dH0({  // Scrollable
      controller: this.controller,
      axisDirection: this.scrollDirection,
      autofocus: this.autofocus,
      keyboardScrolling: this.keyboardScrolling,
      viewportBuilder: (_, offset, __, scrollCtrl) => {
        return new yH0(this.child, {
          axisDirection: this.scrollDirection,
          offset: offset,
          scrollController: scrollCtrl || this.controller,
          position: this.position
        });
      }
    });
  }
}
```

### Scrollable (dH0) - StatefulWidget

```javascript
class dH0 extends H8 {
  axisDirection;       // "vertical" | "horizontal"
  controller;          // Lg (ScrollController)
  physics;             // scroll physics
  viewportBuilder;     // (context, offset, ?, controller) => Widget
  autofocus;           // boolean
  keyboardScrolling;   // boolean
}
```

### RenderScrollViewport (oH0)

```javascript
class oH0 extends j9 {
  _axisDirection;    // "vertical" | "horizontal"
  _scrollOffset;     // number
  _scrollController; // Lg
  _position;         // "top" | "bottom"

  performLayout() {
    // Child gets unbounded main axis constraint:
    //   vertical:   l3(minWidth, maxWidth, 0, Infinity)
    //   horizontal: l3(0, Infinity, minHeight, maxHeight)
    child.layout(unboundedConstraints);

    // Self-size: clamp child to viewport constraints
    // Update scroll controller max extent
    // If followMode && atBottom -> auto-scroll to end
    // Handle "bottom" position (content anchored to bottom)
  }

  get totalScrollExtent() {
    return Math.max(0, childSize - viewportSize);
  }

  // Clipped paint: uses E$ (ClipCanvas) to restrict painting to viewport bounds
  paint(canvas, tx, ty) {
    for (child of children) {
      let clipped = new E$(canvas, tx, ty, this.size.width, this.size.height);
      child.paint(clipped, tx, ty);
    }
  }
}
```

---

## 6. SizedBox (X0)

**Minified ID**: `X0`
**Line**: 530353
**Extends**: `Qb` (SingleChildRenderObjectWidget)
**RenderObject**: `xU0`

```javascript
class X0 extends Qb {
  width;   // number | undefined
  height;  // number | undefined

  constructor({ key, width, height, child } = {})

  createRenderObject()     { return new xU0(this.width, this.height); }
  updateRenderObject(ro)   { ro.updateDimensions(this.width, this.height); }

  // Static factories:
  static fromSize(w, h, child)
  static expand(child)    // width: Infinity, height: Infinity
  static shrink(child)    // width: 0, height: 0
  static height(h, child) // fixed height
  static width(w, child)  // fixed width
}
```

### RenderSizedBox (xU0)

```javascript
class xU0 extends j9 {
  performLayout() {
    // If width is set: use it (Infinity -> maxWidth from constraints)
    // If height is set: use it (Infinity -> maxHeight from constraints)
    // Otherwise: layout child with parent constraints, use child size
    // Constrain final size to parent constraints
    // If child present: layout child with tight(finalWidth, finalHeight)
  }
}
```

---

## 7. Padding (R8)

**Minified ID**: `R8`
**Line**: 530353
**Extends**: `Sf` (Widget) -- custom createElement
**Element**: `kU0`
**RenderObject**: `RU0`

```javascript
class R8 extends Sf {
  padding;  // g8 (EdgeInsets)
  child;    // Widget

  constructor({ key, padding, child })
  createElement() { return new kU0(this); }
}
```

### RenderPadding (RU0)

```javascript
class RU0 extends j9 {
  _padding;  // g8

  performLayout() {
    let h = this._padding.horizontal;
    let v = this._padding.vertical;

    if (hasChild) {
      // Shrink constraints by padding:
      let childConstraints = new l3(
        max(0, constraints.minWidth - h),
        max(0, constraints.maxWidth - h),
        max(0, constraints.minHeight - v),
        max(0, constraints.maxHeight - v)
      );
      child.layout(childConstraints);
      child.setOffset(this._padding.left, this._padding.top);
      // Self-size: child size + padding, constrained
      let result = constraints.constrain(child.width + h, child.height + v);
      this.setSize(result.width, result.height);
    } else {
      let result = constraints.constrain(h, v);
      this.setSize(result.width, result.height);
    }
  }

  // Intrinsic methods: add padding to child intrinsics
  // hitTest: handles offset for padding
}
```

---

## 8. Container (A8)

**Minified ID**: `A8`
**Line**: 530353
**Extends**: `Qb` (SingleChildRenderObjectWidget)

```javascript
class A8 extends Qb {
  width;        // number | undefined
  height;       // number | undefined
  padding;      // g8 (EdgeInsets) | undefined
  margin;       // g8 (EdgeInsets) | undefined
  decoration;   // _9 (BoxDecoration) | { color, border } | undefined
  constraints;  // l3 (BoxConstraints) | undefined

  constructor({ key, child, width, height, padding, margin, decoration, constraints } = {})
}
```

**Annotation**: Container is a convenience widget that composes SizedBox-like sizing, Padding, decoration (background color + border), margin, and constraint enforcement into a single widget. The render object handles painting the decoration (background fill + border characters) and offsetting the child by padding.

### Usage patterns seen in codebase:

```javascript
// Bordered container with background
new A8({
  constraints: new l3(width, width, 0, Number.POSITIVE_INFINITY),
  decoration: new _9(colorScheme.background, B3.all(new P3(colorScheme.primary, 1, "rounded"))),
  padding: g8.symmetric(2, 1),
  child: content
})

// Simple fixed-size box
new A8({
  width: 12,
  height: 5,
  decoration: { border: B3.all(new P3(color, 1, "solid")), color: bg },
  child: content
})
```

---

## 9. Expanded (u3)

**Minified ID**: `u3`
**Line**: 530353
**Extends**: `R_` (ParentDataWidget)

```javascript
class u3 extends R_ {
  flex;  // number, default: 1

  constructor({ child, flex = 1, key })

  createParentData() { return new S_(this.flex, "tight"); }  // Always "tight" fit
  applyParentData(renderObject) {
    renderObject.parentData.flex = this.flex;
    renderObject.parentData.fit = "tight";  // Key difference from Flexible
  }
}
```

**Key difference from Flexible**: Expanded always uses `fit: "tight"`, meaning the child MUST fill its allocated space. Flexible uses `fit: "loose"`, allowing children to be smaller.

---

## 10. Flexible (lv)

**Minified ID**: `lv`
**Line**: 530353
**Extends**: `R_` (ParentDataWidget)

```javascript
class lv extends R_ {
  flex;  // number, default: 1
  fit;   // "loose" | "tight", default: "loose"

  constructor({ child, flex = 1, fit = "loose", key })

  createParentData() { return new S_(this.flex, this.fit); }
  applyParentData(renderObject) {
    renderObject.parentData.flex = this.flex;
    renderObject.parentData.fit = this.fit;
  }
}
```

---

## 11. Stack (ng) and Positioned (L4)

**Minified ID**: `ng` (Stack), `L4` (Positioned)
**Line**: 530353
**RenderObject**: `hF` (RenderStack)

### Stack Widget

```javascript
class ng extends An {
  fit;  // "loose" | "expand" | "passthrough" -- default: "loose"

  constructor({ key, fit = "loose", children = [] } = {})

  createRenderObject()   { return new hF(this.fit); }
  updateRenderObject(ro) { ro.fit = this.fit; }
}
```

### Positioned Widget

```javascript
class L4 extends R_ {
  left; top; right; bottom; width; height;

  constructor({ key, left, top, right, bottom, width, height, child })
  // Validates: cannot set all three of left+right+width or top+bottom+height

  createParentData() {
    return new uE(this.left, this.top, this.right, this.bottom, this.width, this.height);
  }
}
```

### RenderStack (hF) - Layout

```javascript
class hF extends j9 {
  fit;  // "loose" | "expand" | "passthrough"
  allowHitTestOutsideBounds = true;

  performLayout() {
    // 1. Compute child constraints based on fit:
    //    "loose"       -> parent.loosen()
    //    "expand"      -> tight(parent.biggest)
    //    "passthrough" -> parent as-is

    // 2. Layout non-positioned children, track max width/height
    // 3. Self-size: max of non-positioned children (or biggest if no non-positioned)
    // 4. Layout positioned children with positionedChildConstraints:
    //    - If left+right set: width = self.width - left - right
    //    - If width set: use width
    //    - Otherwise: 0..Infinity
    //    - Same logic for vertical

    // 5. Position positioned children:
    //    - left ?? (self.width - right - child.width)
    //    - top ?? (self.height - bottom - child.height)
  }
}
```

### PositionedParentData (uE)

```javascript
class uE extends PJ {
  left; top; right; bottom; width; height;

  isPositioned() {
    return top !== undefined || right !== undefined ||
           bottom !== undefined || left !== undefined ||
           width !== undefined || height !== undefined;
  }

  positionedChildConstraints(parentSize) {
    // Calculate tight or bounded constraints from position values
  }
}
```

---

## 12. Table (jA)

**Minified ID**: `jA`
**Line**: 530811
**Extends**: `H3` (StatelessWidget)

```javascript
class jA extends H3 {
  items;      // array of data items
  renderRow;  // (item) => [leftWidget, rightWidget]

  build(context) {
    let width = Q3.of(context).size.width;
    let isNarrow = width < 50;

    for (item of this.items) {
      let [left, right] = this.renderRow(item);

      if (isNarrow) {
        // Vertical layout: Column with left, then indented right
        row = new o8({
          crossAxisAlignment: "start",
          mainAxisSize: "min",
          children: [left, new R8({ padding: g8.only({ left: 4 }), child: right })]
        });
      } else {
        // Horizontal layout: two Expanded columns with spacer
        row = new q8({
          crossAxisAlignment: "start",
          children: [
            new u3({ flex: 1, child: left }),
            new X0({ width: 1 }),
            new u3({ flex: 1, child: right })
          ]
        });
      }
      rows.push(new R8({ padding: g8.horizontal(6), child: row }));
    }

    return new o8({ crossAxisAlignment: "start", mainAxisSize: "min", children: rows });
  }
}
```

**Annotation**: The Table widget is a responsive two-column layout. It switches between side-by-side (wide) and stacked (narrow) at a 50-column breakpoint.

---

## 13. DiffView (Bn)

**Minified ID**: `Bn`
**Line**: 530822
**Extends**: `H3` (StatelessWidget)

```javascript
class Bn extends H3 {
  props;                                // { diff, filePath, ... }
  highlightedLines = new Map();         // line index -> syntax-highlighted spans
  cachedDiffLines;                      // parsed diff lines
  cachedLineNumDimensions;              // line number column widths

  constructor(props) {
    this.cachedDiffLines = this.parseDiffLines(props.diff);
    this.cachedLineNumDimensions = this.calculateLineNumberDimensions();
  }

  createHighlightedSpan(prefix, content, highlights, color, appColors, dim) {
    // Creates a TextSpan with syntax highlighting applied per token
    // Returns: new q(text, style) or new q("", undefined, [spans...])
  }

  build(context) {
    let theme = h8.of(context);
    // Syntax highlight each non-chunk diff line using file extension
    if (this.props.filePath && this.highlightedLines.size === 0) {
      for (line of this.cachedDiffLines) {
        if (line.type !== "chunk" && line.content.trim()) {
          let highlighted = ae(line.content, theme.app.syntaxHighlight, this.props.filePath);
          this.highlightedLines.set(index, highlighted);
        }
      }
    }
    return this.formatUnifiedDiff(theme.colors);
  }

  parseDiffLines(diffText) {
    // Parses unified diff format into structured line objects
    // Each line: { type: "add"|"remove"|"context"|"chunk", content, oldLineNum, newLineNum }
  }

  formatUnifiedDiff(colors) {
    // Renders the diff as a Column of styled Text widgets
    // + lines: green/success color
    // - lines: red/destructive color
    // chunk headers: muted
    // Line numbers in gutters
  }
}
```

---

## 14. Dialog (ab)

**Minified ID**: `ab`
**Line**: 530811
**Type**: Plain data class (NOT a widget)

```javascript
class ab {
  widget;       // Widget - the content to display in the dialog
  title;        // string, default: "Info"
  type;         // "info" | "error" | "warning" -- default: "info"
  footerStyle;  // "default" | other styles
  dimensions;   // { width, height } | undefined

  constructor(widget, title = "Info", type = "info", footerStyle = "default", dimensions)
}
```

**Annotation**: `ab` is a dialog data container, NOT a widget itself. It carries the content widget, title, and metadata. The actual dialog rendering is handled by the application shell which overlays the `ab.widget` content in a bordered Container.

### SelectionList Dialog (ap) - The Actual Dialog Widget

```javascript
class ap extends H8 {
  options;                // [{ value, label, description?, enabled? }]
  onSelect;              // (value | null) => void
  title;                 // string | undefined
  body;                  // string | Widget | undefined
  borderColor;           // color
  backgroundColor;       // color
  padding;               // g8, default: new g8(1, 0, 1, 0)
  selectedIndex;         // number, default: 0
  autofocus;             // boolean, default: true
  showDismissalMessage;  // boolean, default: true
  enableMouseInteraction; // boolean, default: true
  showBorder;            // boolean, default: true

  // State handles:
  // - ArrowDown/n(ctrl)/Tab/j: move selection +1 (wraps, skips disabled)
  // - ArrowUp/p(ctrl)/Shift+Tab/k: move selection -1 (wraps, skips disabled)
  // - Enter: select current option
  // - Escape: onSelect(null)
}
```

---

## 15. Center (h3)

**Minified ID**: `h3`
**Line**: 530353
**Extends**: `Qb` (SingleChildRenderObjectWidget)
**RenderObject**: `cF`

```javascript
class h3 extends Qb {
  widthFactor;   // number | undefined
  heightFactor;  // number | undefined

  constructor({ key, child, widthFactor, heightFactor } = {})

  static child(widget) { return new h3({ child: widget }); }
}
```

### RenderCenter (cF)

```javascript
class cF extends j9 {
  performLayout() {
    // 1. Layout child with loosened constraints
    // 2. Self-size:
    //    - If widthFactor set: child.width * widthFactor (clamped to constraints)
    //    - If unbounded: child.width * (widthFactor ?? 1) (clamped)
    //    - Otherwise: maxWidth from constraints
    //    - Same logic for height
    // 3. Center child: offset = (self.size - child.size) / 2
  }
}
```

---

## 16. Spacer (cg)

**Minified ID**: `cg`
**Line**: 530353

```javascript
class cg extends Sf {
  flex;    // number, default: 1
  width;   // number | undefined
  height;  // number | undefined

  constructor({ key, flex = 1, width, height } = {})

  createElement() {
    // If width or height set: creates a SizedBox with those dimensions
    // Otherwise: creates Expanded(flex, child: SizedBox.shrink())
  }

  // Static factories:
  static horizontal(width)   // Fixed-width spacer
  static vertical(height)    // Fixed-height spacer
  static flexible(flex = 1)  // Flex spacer
}
```

---

## 17. Divider (WF0)

**Minified ID**: `WF0`
**Line**: 530899

```javascript
class WF0 extends ef {  // LeafRenderObjectWidget
  color;  // color for the divider line

  constructor({ color, key })
  createRenderObject()   { return new DF0(this.color); }
  updateRenderObject(ro) { ro.color = this.color; }
}
```

### RenderDivider (DF0)

```javascript
class DF0 extends j9 {
  color;

  performLayout() {
    // Takes full width from constraints, height = 1
    this.setSize(constraints.maxWidth, 1);
  }

  paint(canvas, tx, ty) {
    // Draws horizontal line using Unicode box-drawing character
    for (let x = 0; x < width; x++) {
      canvas.setChar(tx + x, ty, "\u2500", { fg: this.color }, 1);
    }
  }
}
```

---

## 18. Button (ME)

**Minified ID**: `ME`
**Line**: 530899

```javascript
class ME extends H3 {  // StatelessWidget
  text;       // string
  onPressed;  // () => void
  padding;    // g8, default: g8.symmetric(2, 1)
  cursor;     // string, default: "pointer"
  color;      // color | undefined
  reverse;    // boolean, default: false

  constructor({ text, onPressed, padding, cursor, color, reverse, key })

  build(context) {
    // Wraps text in a styled e0 with T3 (MouseRegion) for click handling
    // Uses cursor change and optional reverse video effect
  }
}
```

---

## 19. MouseRegion (T3)

**Minified ID**: `T3`
**Line**: 530353
**Extends**: `Qb` (SingleChildRenderObjectWidget)
**RenderObject**: `Ba`

```javascript
class T3 extends Qb {
  child;      // Widget
  onClick;    // (event) => void | null
  onEnter;    // (event) => void | null
  onExit;     // (event) => void | null
  onHover;    // (event) => void | null
  onScroll;   // (event) => void | null
  onRelease;  // (event) => void | null
  onDrag;     // (event) => void | null
  cursor;     // string | null (e.g., "pointer", "default")
  opaque;     // boolean, default: true

  createRenderObject() {
    return new Ba({
      onClick, onEnter, onExit, onHover, onScroll, onRelease, onDrag, cursor, opaque
    });
  }
}
```

### RenderMouseRegion (Ba)

```javascript
class Ba extends j9 {
  get hasMouseListeners() {
    return !!(this.onClick || this.onEnter || this.onExit ||
              this.onHover || this.onScroll || this.onRelease || this.onDrag);
  }

  handleMouseEvent(event) {
    switch (event.type) {
      case "click":   this.onClick?.(event);   break;
      case "enter":   this._isHovered = true;  this.onEnter?.(event); break;
      case "exit":    this._isHovered = false;  this.onExit?.(event); break;
      case "hover":   this.onHover?.(event);   break;
      case "scroll":  this.onScroll?.(event);  break;
      case "drag":    this.onDrag?.(event);    break;
      case "release": this.onRelease?.(event); break;
    }
  }
}
```

---

## 20. FocusScope / KeyboardListener (t4)

**Minified ID**: `t4`
**Line**: 530353

```javascript
class t4 extends H8 {  // StatefulWidget
  focusNode;         // D9 (FocusNode) | undefined
  child;             // Widget
  autofocus;         // boolean, default: false
  canRequestFocus;   // boolean, default: true
  skipTraversal;     // boolean, default: false
  onKey;             // (KeyEvent) => "handled" | "ignored"
  onPaste;           // (string) => void | undefined
  onFocusChange;     // (boolean) => void | undefined
  debugLabel;        // string | undefined
}
```

### FocusNode (D9)

```javascript
class D9 {
  // Manages focus state and key event dispatching
  addKeyHandler(handler)
  dispose()
}
```

**Usage pattern**:

```javascript
new t4({
  autofocus: true,
  focusNode: this.focusNode,
  onKey: (event) => {
    if (event.key === "Escape") { /* ... */ return "handled"; }
    if (event.key === "ArrowDown") { /* ... */ return "handled"; }
    return "ignored";
  },
  child: contentWidget
})
```

---

## 21. Scrollbar (ia)

**Minified ID**: `ia`
**Line**: 530899

```javascript
class ia extends H8 {  // StatefulWidget
  controller;     // Lg (ScrollController) | null
  getScrollInfo;  // () => { totalContentHeight, viewportHeight, scrollOffset }
  thickness;      // number, default: 1
  trackChar;      // string, default: I50 (light shade character)
  thumbChar;      // string, default: j50 (full block character)
  showTrack;      // boolean, default: true
  thumbColor;     // color | undefined
  trackColor;     // color | undefined
}
```

**Common usage** (paired with ScrollView):

```javascript
new q8({
  crossAxisAlignment: "stretch",
  children: [
    new u3({ child: new R4({ controller: scrollCtrl, child: content }) }),
    new ia({
      controller: scrollCtrl,
      thumbColor: colors.scrollbarThumb,
      trackColor: colors.scrollbarTrack,
      getScrollInfo: () => ({
        totalContentHeight: Math.max(scrollCtrl.maxScrollExtent + viewport, 0),
        viewportHeight: viewport,
        scrollOffset: Math.max(scrollCtrl.offset, 0)
      })
    })
  ]
})
```

---

## 22. ScrollController (Lg)

**Minified ID**: `Lg`
**Line**: 530353

```javascript
class Lg {
  _offset = 0;
  _listeners = [];
  _disposed = false;
  _maxScrollExtent = 0;
  _hasInitialOffset = false;
  _animationTimer = null;
  _animationTarget = null;
  _animationStartTime = 0;
  _animationDuration = 0;
  _followMode = true;       // auto-scroll to bottom when content grows

  get offset() { return this._offset; }
  get atBottom() { /* check if scrolled to end */ }
  get followMode() { return this._followMode; }
  get maxScrollExtent() { return this._maxScrollExtent; }

  jumpTo(offset)
  updateMaxScrollExtent(extent)
  disableFollowMode()
  dispose()
}
```

---

## 23. SelectionList / Dialog (ap)

See [Dialog (ab)](#14-dialog-ab) section above for full details.

Key state management:
- `selectedIndex`: current selection
- Arrow keys / j/k / Tab for navigation (wraps around, skips disabled)
- Enter to confirm, Escape to dismiss
- Mouse click support when `enableMouseInteraction` is true

---

## 24. ClipRect (nv)

**Minified ID**: `nv`
**Line**: 530353

```javascript
class nv extends Qb {
  clipBehavior;  // "antiAlias" | other -- default: "antiAlias"

  constructor(child, { key, clipBehavior = "antiAlias" })
}
```

**Annotation**: Used to clip child painting to the parent's bounds. The scroll viewport (`oH0`) achieves clipping by creating a `E$` (ClipCanvas) wrapper in its paint method rather than using nv directly.

---

## 25. IntrinsicHeight (hJ)

**Minified ID**: `hJ`
**Line**: 530353

```javascript
class hJ extends Qb {
  constructor({ child })
  createRenderObject() { return new vU0; }
}
```

### RenderIntrinsicHeight (vU0)

```javascript
class vU0 extends j9 {
  performLayout() {
    // If constraints are tight height -> pass through
    // Otherwise: query child's getMaxIntrinsicHeight(maxWidth)
    //   and layout child with tight height at that value
    let intrinsicH = child.getMaxIntrinsicHeight(constraints.maxWidth);
    let tightConstraints = new l3(minWidth, maxWidth, intrinsicH, intrinsicH);
    child.layout(tightConstraints);
    this.setSize(child.size.width, child.size.height);
  }
}
```

---

## 26. Markdown (_g)

**Minified ID**: `_g`
**Line**: 530904

```javascript
class _g extends H3 {  // StatelessWidget
  markdown;          // string
  textAlign;         // "left" | "center" | "right"
  maxLines;          // number | undefined
  overflow;          // "clip" | "ellipsis"
  styleScheme;       // custom style scheme | undefined
  colorTransform;    // color transform function | undefined
}
```

**Annotation**: Markdown widget parses markdown text and renders it as a tree of Text widgets with appropriate styling (headings as bold, code in monospace style, links as hyperlinks, etc.).

---

## 27. Image Preview (O_)

**Minified ID**: `O_`
**Line**: 530700

```javascript
class O_ extends H8 {  // StatefulWidget
  props;  // { image, width, height, backgroundColor }

  // Uses Kitty graphics protocol for terminal image display
  // Transmits PNG data via escape sequences: ESC_G q=2,a=T,U=1,f=100,i=ID,c=W,r=H,m=M;DATA ESC\\
  // Falls back to empty SizedBox if terminal doesn't support Kitty graphics
  // Uses Unicode combining characters as placement cells
}
```

---

## 28. ContainerWithOverlays (bt)

**Minified ID**: `bt`
**Line**: 530353 (extends A8)

```javascript
class bt extends A8 {
  overlays;  // Array of { child, position: "top"|"bottom", alignment: "left"|"center"|"right", offsetX? }

  constructor({ key, child, padding, overlays = [], overlayGroupSpacing = 1,
                decoration, constraints, width, height, margin })

  // Internally creates a Stack with:
  //   1. Main Container (A8) with the primary child
  //   2. Positioned overlay widgets at corners/edges
  // Smart flex allocation between left/right overlays (25%-75% range)
  // Groups overlays by position (top/bottom) and alignment (left/center/right)
  // Text overlays are merged into single TextSpans for efficiency
}
```

---

## Supporting Classes

### Widget Base Types

| Minified | Flutter Analog | Description |
|----------|---------------|-------------|
| `Sf` | `Widget` | Base widget class |
| `ef` | `LeafRenderObjectWidget` | Widget that creates a leaf render object (no children) |
| `Qb` | `SingleChildRenderObjectWidget` | Widget with single child + render object |
| `An` | `MultiChildRenderObjectWidget` | Widget with multiple children + render object |
| `R_` | `ParentDataWidget` | Widget that configures parent data (flex, position) |
| `H8` | `StatefulWidget` | Widget with mutable state |
| `H3` | `StatelessWidget` | Widget with build() method |
| `Bt` | `InheritedWidget` | Widget for data propagation down the tree |
| `_8` | `State` | State object for StatefulWidget |

### RenderObject Base

| Minified | Flutter Analog | Description |
|----------|---------------|-------------|
| `j9` | `RenderBox` | Base render object with layout/paint |
| `PJ` | `ParentData` | Base parent data class |
| `S_` | `FlexParentData` | Parent data with flex/fit |
| `uE` | `StackParentData` | Parent data with positioning |

### Context & Infrastructure

| Minified | Flutter Analog | Description |
|----------|---------------|-------------|
| `Q3` | `MediaQuery` | Screen size, capabilities |
| `w3` | `Theme` | Color scheme and styling |
| `h8` | `AppTheme` | Application-specific theme data |
| `w0` | `Color` | Terminal color (index, RGB, default) |
| `D9` | `FocusNode` | Focus management |
| `Lg` | `ScrollController` | Scroll position and control |
| `E$` | `ClipCanvas` | Canvas with clipping bounds |
| `Pg` | `MouseTracker` | Global mouse/cursor manager |
| `gg` | `SystemMouseCursors` | Cursor constants (POINTER, DEFAULT) |
| `Zs` | `GlobalKey` | Unique key for element lookup |
| `hg` | `ValueKey` | Key based on value equality |

### Key Event Result

Keyboard handlers return `"handled"` or `"ignored"` (string, not enum).

### Layout Helper

```javascript
function fS(widget) {
  // Estimates intrinsic width of a widget tree:
  // - e0 (Text):      string length of plain text
  // - X0 (SizedBox):  max(0, width ?? 0)
  // - q8 (Row):       sum of children widths
  // - ng (Stack):     max of children widths
  // - u3/lv/L4:       width of child
  // - A8/nv/T3:       width of child or 0
  // - default:        1
}
```

---

## Common Widget Composition Patterns

### Bordered Panel

```javascript
new A8({
  constraints: new l3(width, width, 0, Number.POSITIVE_INFINITY),
  decoration: new _9(bg, B3.all(new P3(borderColor, 1, "rounded"))),
  padding: g8.symmetric(horizontalPad, verticalPad),
  child: content
})
```

### Scrollable Content with Scrollbar

```javascript
new q8({
  crossAxisAlignment: "stretch",
  children: [
    new u3({ child: new R4({ controller: scrollCtrl, child: content }) }),
    new ia({ controller: scrollCtrl, thumbColor, trackColor, getScrollInfo: () => ({...}) })
  ]
})
```

### Stack with Positioned Overlay

```javascript
new ng({
  children: [
    new R8({ padding: g8.only({ right: 1 }), child: mainContent }),
    new L4({ right: 0, top: 0, bottom: 0, child: new X0({ width: 1, child: scrollbar }) })
  ]
})
```

### Keyboard-Focusable Container

```javascript
new t4({
  autofocus: true,
  focusNode: focusNode,
  onKey: (event) => {
    if (event.key === "Escape") return "handled";
    return "ignored";
  },
  child: new h3({ child: borderedContainer })
})
```

### Two-Column Responsive Layout

```javascript
// Wide: side-by-side
new q8({
  children: [
    new u3({ flex: 1, child: left }),
    new X0({ width: 1 }),
    new u3({ flex: 1, child: right })
  ]
})

// Narrow: stacked
new o8({
  mainAxisSize: "min",
  children: [left, new R8({ padding: g8.only({ left: 4 }), child: right })]
})
```

---

## Enum/String Constants Reference

### MainAxisAlignment
`"start"` | `"end"` | `"center"` | `"spaceBetween"` | `"spaceAround"` | `"spaceEvenly"`

### CrossAxisAlignment
`"start"` | `"end"` | `"center"` | `"stretch"` | `"baseline"`

### MainAxisSize
`"min"` | `"max"`

### FlexFit
`"tight"` | `"loose"`

### TextAlign
`"left"` | `"center"` | `"right"`

### Overflow
`"clip"` | `"ellipsis"`

### StackFit
`"loose"` | `"expand"` | `"passthrough"`

### BorderStyle
`"rounded"` | `"solid"`

### ScrollDirection
`"vertical"` | `"horizontal"`

### ScrollPosition
`"top"` | `"bottom"`

### KeyEventResult
`"handled"` | `"ignored"`

### MouseEventType
`"click"` | `"enter"` | `"exit"` | `"hover"` | `"scroll"` | `"drag"` | `"release"`

### CursorType (gg)
`gg.POINTER` | `gg.DEFAULT`
