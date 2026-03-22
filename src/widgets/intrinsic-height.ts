// IntrinsicHeight widget — sizes its child to the child's intrinsic height
// Amp ref: hJ/vU0 classes — SingleChildRenderObjectWidget for intrinsic sizing

import { Key } from '../core/key';
import { Offset, Size } from '../core/types';
import { BoxConstraints } from '../core/box-constraints';
import {
  SingleChildRenderObjectWidget,
  RenderBox,
  RenderObject,
  type PaintContext,
} from '../framework/render-object';
import { Widget } from '../framework/widget';

// ---------------------------------------------------------------------------
// IntrinsicHeight (Amp: hJ)
// ---------------------------------------------------------------------------

/**
 * A widget that sizes its child to the child's intrinsic height.
 *
 * This widget is useful when a child has unbounded height constraints but
 * you want it to size itself to its natural (intrinsic) height. For example,
 * placing a Row inside a Column where the Row's children have different
 * natural heights and you want them all to be the same height.
 *
 * WARNING: This widget can be expensive because it requires the child to
 * compute its intrinsic height, which may involve a full trial layout.
 *
 * Usage:
 *   new IntrinsicHeight({ child: someWidget })
 *
 * Amp ref: hJ class — SingleChildRenderObjectWidget
 */
export class IntrinsicHeight extends SingleChildRenderObjectWidget {
  constructor(opts: { child: Widget; key?: Key }) {
    super({ key: opts.key, child: opts.child });
  }

  createRenderObject(): RenderIntrinsicHeight {
    return new RenderIntrinsicHeight();
  }
}

// ---------------------------------------------------------------------------
// RenderIntrinsicHeight (Amp: vU0)
// ---------------------------------------------------------------------------

/**
 * A RenderBox that sizes its child to the child's max intrinsic height.
 *
 * Layout algorithm:
 * 1. If constraints have tight height, pass through directly (no intrinsic query).
 * 2. Otherwise, query child.getMaxIntrinsicHeight(constraints.maxWidth).
 * 3. Layout child with tight height at that intrinsic value (clamped to constraints).
 *
 * Amp ref: vU0 class
 */
export class RenderIntrinsicHeight extends RenderBox {
  private _child: RenderBox | null = null;

  get child(): RenderBox | null {
    return this._child;
  }

  set child(value: RenderBox | null) {
    if (this._child) {
      this.dropChild(this._child);
    }
    this._child = value;
    if (value) {
      this.adoptChild(value);
    }
  }

  performLayout(): void {
    const constraints = this.constraints!;

    if (!this._child) {
      this.size = constraints.constrain(Size.zero);
      return;
    }

    // If constraints already have tight height, pass through
    if (constraints.minHeight === constraints.maxHeight) {
      this._child.layout(constraints);
      this.size = constraints.constrain(this._child.size);
      return;
    }

    // Query the child's intrinsic height
    const intrinsicHeight = this._child.getMaxIntrinsicHeight(constraints.maxWidth);

    // Clamp intrinsic height to the constraints range
    const clampedHeight = Math.max(
      constraints.minHeight,
      Math.min(intrinsicHeight, constraints.maxHeight),
    );

    // Layout child with tight height at the intrinsic value
    const childConstraints = new BoxConstraints({
      minWidth: constraints.minWidth,
      maxWidth: constraints.maxWidth,
      minHeight: clampedHeight,
      maxHeight: clampedHeight,
    });

    this._child.layout(childConstraints);
    this.size = constraints.constrain(new Size(this._child.size.width, clampedHeight));
  }

  // Intrinsic dimensions delegate to child
  getMinIntrinsicWidth(height: number): number {
    return this._child ? this._child.getMinIntrinsicWidth(height) : 0;
  }

  getMaxIntrinsicWidth(height: number): number {
    return this._child ? this._child.getMaxIntrinsicWidth(height) : 0;
  }

  getMinIntrinsicHeight(width: number): number {
    return this._child ? this._child.getMinIntrinsicHeight(width) : 0;
  }

  getMaxIntrinsicHeight(width: number): number {
    return this._child ? this._child.getMaxIntrinsicHeight(width) : 0;
  }

  paint(context: PaintContext, offset: Offset): void {
    if (this._child) {
      this._child.paint(context, offset.add(this._child.offset));
    }
  }

  visitChildren(visitor: (child: RenderObject) => void): void {
    if (this._child) {
      visitor(this._child);
    }
  }
}
