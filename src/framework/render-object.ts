// RenderObject, RenderBox, ContainerRenderBox, ParentData, RenderObjectWidget
// Amp ref: n_ (RenderObject), j9 (RenderBox), PJ (ParentData),
//   yj (RenderObjectWidget), Qb (SingleChildRenderObjectWidget), An (MultiChildRenderObjectWidget)
// Source: amp-strings.txt:529716, 530350
// Reference: .reference/render-tree.md

import { Offset, Size } from '../core/types';
import { BoxConstraints } from '../core/box-constraints';
import { Widget } from './widget';
import { Key } from '../core/key';

// ---------------------------------------------------------------------------
// PaintContext (minimal forward declaration — full implementation in Phase 5)
// ---------------------------------------------------------------------------

/**
 * Minimal PaintContext interface.
 * Will be fully defined in Phase 5 (screen buffer / terminal rendering).
 */
export interface PaintContext {
  // Placeholder — painting details defined later
}

// ---------------------------------------------------------------------------
// PipelineOwner (minimal forward declaration — full implementation in Plan 03-03)
// ---------------------------------------------------------------------------

/**
 * Minimal PipelineOwner interface.
 * Full implementation in Plan 03-03 (PipelineOwner, BuildOwner, FrameScheduler).
 *
 * Amp ref: UB0 class, xH() global accessor
 */
export interface PipelineOwner {
  requestLayout(): void;
  requestPaint(): void;
}

// ---------------------------------------------------------------------------
// ParentData (Amp: PJ)
// ---------------------------------------------------------------------------

/**
 * Base class for parent data attached to a RenderObject by its parent.
 * Subclasses add layout-specific data (e.g., FlexParentData adds flex, fit).
 *
 * Amp ref: class PJ, amp-strings.txt:530350
 */
export class ParentData {
  detach(): void {}
}

/**
 * BoxParentData base.
 * Note: In Amp, offset is stored on RenderBox itself, not here.
 * This class exists as a base for FlexParentData and other layout-specific data.
 *
 * Amp ref: No direct equivalent — offset is on j9._offset
 */
export class BoxParentData extends ParentData {
  // Intentionally empty — offset lives on RenderBox in Amp's TUI
}

// ---------------------------------------------------------------------------
// RenderObject (Amp: n_)
// ---------------------------------------------------------------------------

/**
 * Abstract base class for all render objects in the render tree.
 *
 * Key Amp fidelity notes:
 * - NO RelayoutBoundary: markNeedsLayout() always propagates to root
 * - NO RepaintBoundary: no compositing layers
 * - NO sizedByParent / performResize(): all sizing in performLayout()
 * - NO parentUsesSize: layout() takes only constraints
 * - Child management (adoptChild/dropChild) is on the base class (Amp has no separate mixin)
 *
 * Amp ref: class n_, amp-strings.txt:529716
 */
export abstract class RenderObject {
  parent: RenderObject | null = null;
  parentData: ParentData | null = null;

  // Amp: _needsLayout = !1, _needsPaint = !1
  protected _needsLayout: boolean = true;
  protected _needsPaint: boolean = true;
  private _owner: PipelineOwner | null = null;
  private _attached: boolean = false;

  get needsLayout(): boolean {
    return this._needsLayout;
  }

  get needsPaint(): boolean {
    return this._needsPaint;
  }

  get owner(): PipelineOwner | null {
    return this._owner;
  }

  get attached(): boolean {
    return this._attached;
  }

  // --- Tree management ---
  // Amp ref: n_.adoptChild(g) — sets parent, pushes to children, setupParentData, attach if attached, markNeedsLayout

  adoptChild(child: RenderObject): void {
    child.parent = this;
    this.setupParentData(child);
    if (this._attached) {
      child.attach(this._owner!);
    }
    this.markNeedsLayout();
  }

  // Amp ref: n_.dropChild(g) — detach if attached, splice from children, clear parent, markNeedsLayout
  dropChild(child: RenderObject): void {
    if (child._attached) {
      child.detach();
    }
    child.parent = null;
    this.markNeedsLayout();
  }

  // Amp ref: n_.attach() — sets _attached=true, recurses to children
  attach(owner: PipelineOwner): void {
    if (this._attached) return;
    this._owner = owner;
    this._attached = true;
  }

  // Amp ref: n_.detach() — sets _attached=false, recurses to children
  detach(): void {
    if (!this._attached) return;
    this._owner = null;
    this._attached = false;
  }

  // --- Layout ---
  // Amp ref: n_.markNeedsLayout() — if already dirty or not attached, return early;
  //   set dirty, propagate to parent, or tell PipelineOwner if root

  markNeedsLayout(): void {
    if (this._needsLayout) return; // already dirty, stop
    if (!this._attached) {
      // Not in tree — just mark dirty without propagation
      this._needsLayout = true;
      return;
    }
    this._needsLayout = true;
    // In Amp: always propagate to parent (NO RelayoutBoundary)
    if (this.parent) {
      this.parent.markNeedsLayout();
    } else {
      // We're the root — tell owner
      this._owner?.requestLayout();
    }
  }

  // --- Paint ---
  // Amp ref: n_.markNeedsPaint() — if already dirty or not attached, return;
  //   set dirty, tell PipelineOwner directly (no RepaintBoundary)

  markNeedsPaint(): void {
    if (this._needsPaint) return;
    if (!this._attached) {
      this._needsPaint = true;
      return;
    }
    this._needsPaint = true;
    // Amp ref: always tells PipelineOwner directly (no RepaintBoundary)
    // But also propagate to parent for full-repaint semantics
    if (this.parent) {
      this.parent.markNeedsPaint();
    } else {
      this._owner?.requestPaint();
    }
  }

  abstract performLayout(): void;
  abstract paint(context: PaintContext, offset: Offset): void;

  // --- Visitor ---
  // Amp ref: n_.visitChildren(g) — iterates _children
  visitChildren(_visitor: (child: RenderObject) => void): void {
    // Base class has no children; subclasses override
  }

  // --- ParentData ---
  // Amp ref: n_.setupParentData(g) — overridden by subclasses
  setupParentData(child: RenderObject): void {
    if (!(child.parentData instanceof ParentData)) {
      child.parentData = new ParentData();
    }
  }
}

// ---------------------------------------------------------------------------
// RenderBox (Amp: j9 extends n_)
// ---------------------------------------------------------------------------

/**
 * A render object that uses box constraints and has a 2D size.
 *
 * Key Amp fidelity notes:
 * - Offset is stored directly on RenderBox (not in BoxParentData)
 * - layout(constraints) is single-arg (no parentUsesSize)
 * - layout() skips if constraints unchanged AND not dirty
 * - _needsLayout is cleared BEFORE performLayout() is called
 *
 * Amp ref: class j9 extends n_, amp-strings.txt:529716
 */
export abstract class RenderBox extends RenderObject {
  // Amp ref: j9._size = { width: 0, height: 0 }
  private _size: Size = Size.zero;

  // Amp ref: j9._offset = { x: 0, y: 0 } — offset ON the RenderBox itself
  private _offset: Offset = Offset.zero;

  // Amp ref: j9._lastConstraints
  private _lastConstraints: BoxConstraints | null = null;

  get size(): Size {
    return this._size;
  }

  set size(value: Size) {
    this._size = value;
  }

  get offset(): Offset {
    return this._offset;
  }

  set offset(value: Offset) {
    this._offset = value;
  }

  get constraints(): BoxConstraints | null {
    return this._lastConstraints;
  }

  get hasSize(): boolean {
    return this._size.width > 0 || this._size.height > 0;
  }

  /**
   * Layout this box with the given constraints.
   *
   * From Amp: layout(g) {
   *   let t = !this._lastConstraints || !g.equals(this._lastConstraints);
   *   if (!this._needsLayout && !t) return;
   *   this._lastConstraints = g;
   *   this._needsLayout = false;
   *   this.performLayout();
   * }
   *
   * Amp ref: j9.layout(g), amp-strings.txt:529716
   */
  layout(constraints: BoxConstraints): void {
    const constraintsChanged =
      !this._lastConstraints ||
      !constraints.equals(this._lastConstraints);
    if (!this._needsLayout && !constraintsChanged) return;
    this._lastConstraints = constraints;
    this._needsLayout = false;
    this.performLayout();
  }

  // --- Intrinsic Size ---

  /**
   * Returns the minimum width that this box could be without failing to
   * correctly paint its contents within itself, at the given height.
   * Base implementation returns 0. Subclasses override.
   *
   * Amp ref: j9.getMinIntrinsicWidth(height)
   */
  getMinIntrinsicWidth(_height: number): number {
    return 0;
  }

  /**
   * Returns the smallest width beyond which increasing the width never
   * decreases the preferred height. Base implementation returns 0.
   *
   * Amp ref: j9.getMaxIntrinsicWidth(height)
   */
  getMaxIntrinsicWidth(_height: number): number {
    return 0;
  }

  /**
   * Returns the minimum height that this box could be without failing to
   * correctly paint its contents within itself, at the given width.
   * Base implementation returns 0. Subclasses override.
   *
   * Amp ref: j9.getMinIntrinsicHeight(width)
   */
  getMinIntrinsicHeight(_width: number): number {
    return 0;
  }

  /**
   * Returns the smallest height beyond which increasing the height never
   * decreases the preferred width. Base implementation returns 0.
   *
   * Amp ref: j9.getMaxIntrinsicHeight(width)
   */
  getMaxIntrinsicHeight(_width: number): number {
    return 0;
  }

  /**
   * Subclasses override this to compute size and layout children.
   * Must set this.size = ...
   */
  abstract performLayout(): void;

  /**
   * Override to paint this render object.
   * offset is the accumulated offset from the root.
   */
  abstract paint(context: PaintContext, offset: Offset): void;
}

// ---------------------------------------------------------------------------
// ContainerRenderBox (Amp: built into n_, used by fE, oU0)
// ---------------------------------------------------------------------------

/**
 * Base class for RenderBoxes that manage a list of child RenderBoxes.
 * In Amp this is built into the base n_ class; we separate it for clarity.
 *
 * Uses an array (not linked list) matching Amp's _children = [].
 *
 * Amp ref: n_._children, n_.adoptChild, n_.dropChild, n_.removeAllChildren
 */
export abstract class ContainerRenderBox extends RenderBox {
  private _children: RenderBox[] = [];

  get children(): ReadonlyArray<RenderBox> {
    return this._children;
  }

  get childCount(): number {
    return this._children.length;
  }

  get firstChild(): RenderBox | null {
    return this._children[0] ?? null;
  }

  get lastChild(): RenderBox | null {
    return this._children[this._children.length - 1] ?? null;
  }

  // Amp ref: adoptChild pushes to _children array
  insert(child: RenderBox, after?: RenderBox): void {
    this.setupParentData(child);
    this.adoptChild(child);
    if (after) {
      const idx = this._children.indexOf(after);
      if (idx >= 0) {
        this._children.splice(idx + 1, 0, child);
      } else {
        this._children.push(child);
      }
    } else {
      this._children.push(child);
    }
  }

  // Amp ref: dropChild splices from _children
  remove(child: RenderBox): void {
    const idx = this._children.indexOf(child);
    if (idx >= 0) {
      this._children.splice(idx, 1);
      this.dropChild(child);
    }
  }

  // Amp ref: n_.removeAllChildren()
  removeAll(): void {
    for (const child of [...this._children]) {
      this.dropChild(child);
    }
    this._children = [];
  }

  move(child: RenderBox, after?: RenderBox): void {
    const idx = this._children.indexOf(child);
    if (idx >= 0) this._children.splice(idx, 1);
    if (after) {
      const afterIdx = this._children.indexOf(after);
      this._children.splice(afterIdx + 1, 0, child);
    } else {
      this._children.unshift(child);
    }
  }

  // Amp ref: n_.visitChildren(g) { for (let t of this._children) g(t); }
  visitChildren(visitor: (child: RenderObject) => void): void {
    for (const child of this._children) {
      visitor(child);
    }
  }
}

// ---------------------------------------------------------------------------
// RenderObjectWidget (Amp: yj extends Sf)
// ---------------------------------------------------------------------------

/**
 * Abstract base class for widgets that have an associated RenderObject.
 * Subclasses must implement createRenderObject().
 *
 * Amp ref: class yj extends Sf, amp-strings.txt:529716
 */
export abstract class RenderObjectWidget extends Widget {
  constructor(opts?: { key?: Key }) {
    super(opts);
  }

  abstract createRenderObject(): RenderObject;

  // Amp ref: yj.updateRenderObject(g) {} — default no-op
  updateRenderObject(_renderObject: RenderObject): void {}
}

// ---------------------------------------------------------------------------
// SingleChildRenderObjectWidget (Amp: Qb extends yj)
// ---------------------------------------------------------------------------

/**
 * A RenderObjectWidget with a single optional child.
 *
 * Amp ref: class Qb extends yj, amp-strings.txt:529716
 */
export abstract class SingleChildRenderObjectWidget extends RenderObjectWidget {
  readonly child?: Widget;

  constructor(opts?: { key?: Key; child?: Widget }) {
    super(opts?.key !== undefined ? { key: opts.key } : undefined);
    this.child = opts?.child;
  }

  // Amp ref: Qb.createElement() -> new uv(this)
  createElement(): any {
    const { SingleChildRenderObjectElement } = require('./element');
    return new SingleChildRenderObjectElement(this);
  }
}

// ---------------------------------------------------------------------------
// MultiChildRenderObjectWidget (Amp: An extends yj)
// ---------------------------------------------------------------------------

/**
 * A RenderObjectWidget with multiple children.
 *
 * Amp ref: class An extends yj, amp-strings.txt:529716
 */
export abstract class MultiChildRenderObjectWidget extends RenderObjectWidget {
  readonly children: Widget[];

  constructor(opts?: { key?: Key; children?: Widget[] }) {
    super(opts?.key !== undefined ? { key: opts.key } : undefined);
    this.children = opts?.children ? [...opts.children] : [];
  }

  // Amp ref: An.createElement() -> new rJ(this)
  createElement(): any {
    const { MultiChildRenderObjectElement } = require('./element');
    return new MultiChildRenderObjectElement(this);
  }
}

// ---------------------------------------------------------------------------
// LeafRenderObjectWidget
// ---------------------------------------------------------------------------

/**
 * A RenderObjectWidget with no children.
 * Used for terminal leaf nodes like Text render objects.
 */
export abstract class LeafRenderObjectWidget extends RenderObjectWidget {
  constructor(opts?: { key?: Key }) {
    super(opts);
  }

  // Amp ref: ef.createElement() -> new O$(this)
  createElement(): any {
    const { LeafRenderObjectElement } = require('./element');
    return new LeafRenderObjectElement(this);
  }
}
