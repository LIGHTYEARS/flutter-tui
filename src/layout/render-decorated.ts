// RenderDecoratedBox — single-child render box with decoration (border + background)
// Amp ref: class fE extends j9 — Container with decoration, border, color
// Source: .reference/widgets-catalog.md

import { Offset, Size } from '../core/types';
import { BoxConstraints } from '../core/box-constraints';
import { Color } from '../core/color';
import { RenderBox, PaintContext } from '../framework/render-object';

// ---------------------------------------------------------------------------
// Decoration types
// ---------------------------------------------------------------------------

export type BorderStyle = 'rounded' | 'solid';

/**
 * A single side of a border.
 */
export class BorderSide {
  readonly color: Color;
  readonly width: number;
  readonly style: BorderStyle;

  constructor(opts?: { color?: Color; width?: number; style?: BorderStyle }) {
    this.color = opts?.color ?? Color.defaultColor;
    this.width = Math.round(opts?.width ?? 1);
    this.style = opts?.style ?? 'solid';
  }

  static readonly none: BorderSide = new BorderSide({ width: 0 });

  equals(other: BorderSide): boolean {
    return (
      this.color.equals(other.color) &&
      this.width === other.width &&
      this.style === other.style
    );
  }
}

/**
 * Border for all four sides.
 * Amp ref: part of fE._decoration.border
 */
export class Border {
  readonly top: BorderSide;
  readonly right: BorderSide;
  readonly bottom: BorderSide;
  readonly left: BorderSide;

  constructor(opts?: {
    top?: BorderSide;
    right?: BorderSide;
    bottom?: BorderSide;
    left?: BorderSide;
  }) {
    this.top = opts?.top ?? BorderSide.none;
    this.right = opts?.right ?? BorderSide.none;
    this.bottom = opts?.bottom ?? BorderSide.none;
    this.left = opts?.left ?? BorderSide.none;
  }

  /** Create a border with the same side on all edges. */
  static all(side: BorderSide): Border {
    return new Border({ top: side, right: side, bottom: side, left: side });
  }

  /** Total horizontal border width (left + right). */
  get horizontal(): number {
    return this.left.width + this.right.width;
  }

  /** Total vertical border width (top + bottom). */
  get vertical(): number {
    return this.top.width + this.bottom.width;
  }

  equals(other: Border): boolean {
    return (
      this.top.equals(other.top) &&
      this.right.equals(other.right) &&
      this.bottom.equals(other.bottom) &&
      this.left.equals(other.left)
    );
  }
}

/**
 * Box decoration with background color and border.
 * Amp ref: fE._decoration with color and border
 */
export class BoxDecoration {
  readonly color?: Color;
  readonly border?: Border;

  constructor(opts?: { color?: Color; border?: Border }) {
    this.color = opts?.color;
    this.border = opts?.border;
  }

  equals(other: BoxDecoration): boolean {
    const colorEq =
      this.color === other.color ||
      (this.color !== undefined && other.color !== undefined && this.color.equals(other.color));
    const borderEq =
      this.border === other.border ||
      (this.border !== undefined && other.border !== undefined && this.border.equals(other.border));
    return colorEq && borderEq;
  }
}

// ---------------------------------------------------------------------------
// Unicode box-drawing characters
// ---------------------------------------------------------------------------

/** Box-drawing character sets indexed by border style. */
const BOX_CHARS: Record<
  BorderStyle,
  {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
    horizontal: string;
    vertical: string;
  }
> = {
  rounded: {
    topLeft: '\u256D',     // ╭
    topRight: '\u256E',    // ╮
    bottomLeft: '\u2570',  // ╰
    bottomRight: '\u256F', // ╯
    horizontal: '\u2500',  // ─
    vertical: '\u2502',    // │
  },
  solid: {
    topLeft: '\u250C',     // ┌
    topRight: '\u2510',    // ┐
    bottomLeft: '\u2514',  // └
    bottomRight: '\u2518', // ┘
    horizontal: '\u2500',  // ─
    vertical: '\u2502',    // │
  },
};

// ---------------------------------------------------------------------------
// Minimal PaintContext extension for decoration painting
// ---------------------------------------------------------------------------

/**
 * Extended PaintContext interface for decoration painting.
 * Full PaintContext is defined in Phase 5; this extends the minimal version
 * with the methods needed for decoration rendering.
 */
export interface DecorationPaintContext extends PaintContext {
  setChar?(col: number, row: number, char: string, style?: unknown, width?: number): void;
  getSize?(): { width: number; height: number };
}

// ---------------------------------------------------------------------------
// RenderDecoratedBox
// ---------------------------------------------------------------------------

/**
 * A single-child render object that paints a decoration (background color, border)
 * behind/around its child.
 *
 * Layout algorithm:
 * 1. Compute border widths
 * 2. Deflate parent constraints by border widths
 * 3. Layout child with deflated constraints
 * 4. Self-size = child size + border widths, constrained
 *
 * Paint algorithm:
 * 1. Fill background color within border bounds
 * 2. Draw border using Unicode box-drawing characters
 * 3. Recurse into child
 *
 * Amp ref: class fE extends j9, amp-strings.txt
 */
export class RenderDecoratedBox extends RenderBox {
  private _decoration: BoxDecoration;
  private _child: RenderBox | null = null;

  constructor(opts: { decoration: BoxDecoration; child?: RenderBox | null }) {
    super();
    this._decoration = opts.decoration;
    if (opts.child) {
      this.child = opts.child;
    }
  }

  get decoration(): BoxDecoration {
    return this._decoration;
  }

  set decoration(value: BoxDecoration) {
    if (this._decoration.equals(value)) return;
    this._decoration = value;
    this.markNeedsPaint();
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

  /** Compute the total border deflation. */
  private get _borderHorizontal(): number {
    return this._decoration.border?.horizontal ?? 0;
  }

  private get _borderVertical(): number {
    return this._decoration.border?.vertical ?? 0;
  }

  private get _borderLeft(): number {
    return this._decoration.border?.left.width ?? 0;
  }

  private get _borderTop(): number {
    return this._decoration.border?.top.width ?? 0;
  }

  performLayout(): void {
    const constraints = this.constraints!;
    const h = this._borderHorizontal;
    const v = this._borderVertical;

    if (this._child) {
      // Deflate constraints by border widths
      const childConstraints = new BoxConstraints({
        minWidth: Math.max(0, constraints.minWidth - h),
        maxWidth: Math.max(0, constraints.maxWidth - h),
        minHeight: Math.max(0, constraints.minHeight - v),
        maxHeight: Math.max(0, constraints.maxHeight - v),
      });

      this._child.layout(childConstraints);

      // Set child offset to inside the border
      this._child.offset = new Offset(this._borderLeft, this._borderTop);

      // Self-size = child + border, constrained
      const result = constraints.constrain(
        new Size(this._child.size.width + h, this._child.size.height + v),
      );
      this.size = result;
    } else {
      // No child: size to the border alone, constrained
      const result = constraints.constrain(new Size(h, v));
      this.size = result;
    }
  }

  paint(context: PaintContext, offset: Offset): void {
    const ctx = context as DecorationPaintContext;

    // Paint background and border if PaintContext supports setChar
    if (ctx.setChar) {
      this._paintDecoration(ctx, offset);
    }

    // Paint child
    if (this._child) {
      this._child.paint(context, offset.add(this._child.offset));
    }
  }

  /**
   * Paint the decoration (background color + border) using setChar.
   */
  private _paintDecoration(ctx: DecorationPaintContext, offset: Offset): void {
    const w = this.size.width;
    const h = this.size.height;
    const col = offset.col;
    const row = offset.row;

    if (w <= 0 || h <= 0) return;

    // Paint background color (fill the interior)
    if (this._decoration.color) {
      const border = this._decoration.border;
      const innerLeft = col + (border?.left.width ?? 0);
      const innerTop = row + (border?.top.width ?? 0);
      const innerRight = col + w - (border?.right.width ?? 0);
      const innerBottom = row + h - (border?.bottom.width ?? 0);

      for (let r = innerTop; r < innerBottom; r++) {
        for (let c = innerLeft; c < innerRight; c++) {
          ctx.setChar!(c, r, ' ', { bg: this._decoration.color });
        }
      }
    }

    // Paint border
    if (this._decoration.border) {
      this._paintBorder(ctx, col, row, w, h, this._decoration.border);
    }
  }

  /**
   * Paint border using Unicode box-drawing characters.
   * Uses the style from the top side to determine the character set.
   */
  private _paintBorder(
    ctx: DecorationPaintContext,
    col: number,
    row: number,
    w: number,
    h: number,
    border: Border,
  ): void {
    // Use top side style for the corner/line character set
    const style = border.top.style;
    const chars = BOX_CHARS[style];
    const borderColor = border.top.color;
    const colorStyle = borderColor.equals(Color.defaultColor) ? undefined : { fg: borderColor };

    // Only paint if there's actual border width
    const hasTop = border.top.width > 0;
    const hasBottom = border.bottom.width > 0;
    const hasLeft = border.left.width > 0;
    const hasRight = border.right.width > 0;

    if (h < 1 || w < 1) return;

    // Top border
    if (hasTop) {
      if (hasLeft) ctx.setChar!(col, row, chars.topLeft, colorStyle);
      for (let c = col + (hasLeft ? 1 : 0); c < col + w - (hasRight ? 1 : 0); c++) {
        ctx.setChar!(c, row, chars.horizontal, colorStyle);
      }
      if (hasRight) ctx.setChar!(col + w - 1, row, chars.topRight, colorStyle);
    }

    // Left and right vertical borders
    for (let r = row + (hasTop ? 1 : 0); r < row + h - (hasBottom ? 1 : 0); r++) {
      if (hasLeft) ctx.setChar!(col, r, chars.vertical, colorStyle);
      if (hasRight) ctx.setChar!(col + w - 1, r, chars.vertical, colorStyle);
    }

    // Bottom border
    if (hasBottom && h > 1) {
      if (hasLeft) ctx.setChar!(col, row + h - 1, chars.bottomLeft, colorStyle);
      for (let c = col + (hasLeft ? 1 : 0); c < col + w - (hasRight ? 1 : 0); c++) {
        ctx.setChar!(c, row + h - 1, chars.horizontal, colorStyle);
      }
      if (hasRight) ctx.setChar!(col + w - 1, row + h - 1, chars.bottomRight, colorStyle);
    }
  }

  visitChildren(visitor: (child: RenderBox) => void): void {
    if (this._child) {
      visitor(this._child);
    }
  }
}
