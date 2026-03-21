// RenderConstrainedBox — applies additional constraints on top of parent's
// Amp ref: class xU0 extends j9 — used by SizedBox (X0)
// Source: .reference/widgets-catalog.md

import { Offset, Size } from '../core/types';
import { BoxConstraints } from '../core/box-constraints';
import { RenderBox, PaintContext } from '../framework/render-object';

/**
 * A single-child render object that applies additional box constraints.
 *
 * Used as the underlying render object for SizedBox (Amp: X0).
 *
 * Layout algorithm:
 * 1. Enforce additionalConstraints within parent constraints
 * 2. If child: layout child with enforced constraints, self-size = child size
 * 3. If no child: self-size = enforced constraints' smallest
 *
 * Amp ref: class xU0 extends j9, amp-strings.txt
 */
export class RenderConstrainedBox extends RenderBox {
  private _additionalConstraints: BoxConstraints;
  private _child: RenderBox | null = null;

  constructor(opts: {
    additionalConstraints: BoxConstraints;
    child?: RenderBox | null;
  }) {
    super();
    this._additionalConstraints = opts.additionalConstraints;
    if (opts.child) {
      this.child = opts.child;
    }
  }

  get additionalConstraints(): BoxConstraints {
    return this._additionalConstraints;
  }

  set additionalConstraints(value: BoxConstraints) {
    if (this._additionalConstraints.equals(value)) return;
    this._additionalConstraints = value;
    this.markNeedsLayout();
  }

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

  // Amp ref: xU0.performLayout()
  performLayout(): void {
    const constraints = this.constraints!;

    // Enforce additional constraints within parent constraints
    const enforced = this._additionalConstraints.enforce(constraints);

    if (this._child) {
      this._child.layout(enforced);
      this.size = enforced.constrain(this._child.size);
    } else {
      // No child: size to the smallest allowed by enforced constraints
      this.size = enforced.constrain(enforced.smallest);
    }
  }

  paint(context: PaintContext, offset: Offset): void {
    if (this._child) {
      this._child.paint(context, offset.add(this._child.offset));
    }
  }

  visitChildren(visitor: (child: RenderBox) => void): void {
    if (this._child) {
      visitor(this._child);
    }
  }
}
