// PipelineOwner — manages layout and paint scheduling
// Amp ref: UB0, amp-strings.txt:530127
// Reference: .reference/render-tree.md, .reference/frame-scheduler.md
//
// CRITICAL Amp fidelity notes:
// - PipelineOwner has NO _nodesNeedingLayout list — layouts from ROOT ONLY
// - flushLayout() only calls layout on the root render object
// - flushPaint() clears dirty paint flags (actual painting is done by WidgetsBinding)
// - requestLayout() and requestPaint() only request a frame if not mid-frame

import { RenderBox, type RenderObject } from './render-object';
import { BoxConstraints } from '../core/box-constraints';
import { Size } from '../core/types';

// ---------------------------------------------------------------------------
// PipelineOwner (Amp: UB0)
//
// Manages the layout/paint pipeline. Owns the root render object and
// root constraints (based on terminal size).
//
// Key difference from Flutter:
// - No _nodesNeedingLayout list. Layout always starts from root.
// - flushPaint is trivial — just clears dirty flags.
// ---------------------------------------------------------------------------

export class PipelineOwner {
  // Amp ref: UB0._rootRenderObject = null
  private _rootRenderObject: RenderBox | null = null;
  // Amp ref: UB0._rootConstraints = null
  private _rootConstraints: BoxConstraints | null = null;
  // Amp ref: UB0._nodesNeedingPaint = new Set()
  private _nodesNeedingPaint: Set<RenderObject> = new Set();

  // Derived dirty flags
  private _needsLayout: boolean = false;

  /** Amp ref: UB0._rootRenderObject getter/setter */
  get rootNode(): RenderBox | null {
    return this._rootRenderObject;
  }

  /**
   * Set the root render object.
   * Amp ref: UB0.setRootRenderObject(g)
   */
  setRootRenderObject(node: RenderBox | null): void {
    this._rootRenderObject = node;
    if (node) {
      node.attach(this as any);
    }
  }

  /**
   * Called by RenderObject.markNeedsLayout() when it reaches the root.
   * In Amp, this just requests a frame from the scheduler.
   *
   * Amp ref: UB0.requestLayout(g) — just triggers frame request
   */
  requestLayout(): void {
    this._needsLayout = true;
    // In full implementation, calls c9.instance.requestFrame()
    // That wiring happens in WidgetsBinding
  }

  /**
   * Called by RenderObject.markNeedsPaint() to register a node for paint.
   * Amp ref: UB0.requestPaint(g) — adds to _nodesNeedingPaint set
   */
  requestPaint(node?: RenderObject): void {
    if (node) {
      if (this._nodesNeedingPaint.has(node)) return;
      this._nodesNeedingPaint.add(node);
    }
    // In full implementation, calls c9.instance.requestFrame()
  }

  /**
   * Update root constraints based on terminal size.
   * Amp ref: UB0.updateRootConstraints(g) — creates BoxConstraints(0..width, 0..height)
   */
  updateRootConstraints(size: Size): void {
    const newConstraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: size.width,
      minHeight: 0,
      maxHeight: size.height,
    });

    const changed =
      !this._rootConstraints ||
      this._rootConstraints.maxWidth !== newConstraints.maxWidth ||
      this._rootConstraints.maxHeight !== newConstraints.maxHeight;

    this._rootConstraints = newConstraints;

    if (changed && this._rootRenderObject) {
      this._rootRenderObject.markNeedsLayout();
    }
  }

  /**
   * Set constraints directly (convenience method).
   */
  setConstraints(constraints: BoxConstraints): void {
    const changed =
      !this._rootConstraints ||
      !constraints.equals(this._rootConstraints);

    this._rootConstraints = constraints;

    if (changed) {
      this._needsLayout = true;
      if (this._rootRenderObject) {
        this._rootRenderObject.markNeedsLayout();
      }
    }
  }

  /**
   * Run layout from root.
   * From Amp: PipelineOwner.flushLayout() only calls layout on root.
   * No _nodesNeedingLayout list.
   *
   * Amp ref: UB0.flushLayout() — returns boolean indicating if layout happened
   */
  flushLayout(): boolean {
    let layoutPerformed = false;
    if (
      this._rootRenderObject &&
      this._rootConstraints &&
      this._rootRenderObject.needsLayout
    ) {
      this._rootRenderObject.layout(this._rootConstraints);
      layoutPerformed = true;
    }
    this._needsLayout = false;
    return layoutPerformed;
  }

  /**
   * Clear paint dirty flags.
   * Actual painting is done by WidgetsBinding.paint() in the PAINT phase.
   *
   * Amp ref: UB0.flushPaint() — clears _needsPaint on each node, then clears set
   */
  flushPaint(): void {
    if (this._nodesNeedingPaint.size === 0) return;
    try {
      for (const node of this._nodesNeedingPaint) {
        if (node.needsPaint) {
          (node as any)._needsPaint = false;
        }
      }
    } finally {
      this._nodesNeedingPaint.clear();
    }
  }

  /**
   * Amp ref: UB0.hasNodesNeedingLayout
   * In Amp: returns Boolean(rootRenderObject && rootRenderObject.needsLayout)
   */
  get hasNodesNeedingLayout(): boolean {
    return Boolean(
      this._rootRenderObject && this._rootRenderObject.needsLayout,
    );
  }

  /** Amp ref: UB0.hasNodesNeedingPaint */
  get hasNodesNeedingPaint(): boolean {
    return this._nodesNeedingPaint.size > 0;
  }

  /** Check if paint is needed */
  get needsPaint(): boolean {
    return this._nodesNeedingPaint.size > 0;
  }

  /** Remove a node from the paint queue */
  removeFromQueues(node: RenderObject): void {
    this._nodesNeedingPaint.delete(node);
  }

  /** Amp ref: UB0.dispose() */
  dispose(): void {
    this._nodesNeedingPaint.clear();
    this._rootRenderObject = null;
    this._rootConstraints = null;
  }
}
