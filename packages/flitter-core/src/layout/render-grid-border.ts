// RenderGridBorder — multi-pane bordered container with internal dividers
// Amp ref: class GJH — custom RenderObject for PromptBar's bordered split layout
//
// Layout:
//   ╭────────────────────┬──────╮
//   │ left child         │ rt1  │
//   │                    ├──────┤
//   │                    │ rt2  │
//   ╰────────────────────┴──────╯
//
// The left pane gets the remaining width after the right pane.
// The right pane has a fixed width (or intrinsic width).
// Horizontal dividers separate right-pane sub-children.

import { Offset, Size } from '../core/types';
import { BoxConstraints } from '../core/box-constraints';
import { Color } from '../core/color';
import { ContainerRenderBox } from '../framework/render-object';
import { PaintContext } from '../scheduler/paint-context';
import {
  BOX_DRAWING,
  type BoxDrawingStyle,
} from '../painting/border-painter';

// ---------------------------------------------------------------------------
// RenderGridBorder
// ---------------------------------------------------------------------------

export interface GridBorderConfig {
  /** Border drawing style. Default: 'rounded'. */
  style?: BoxDrawingStyle;
  /** Border color. */
  borderColor?: Color;
  /** Width of the right pane in columns. 0 = no right pane. Default: 0. */
  rightPaneWidth?: number;
  /** Banner mode: replaces top-left corner with ├ for merging with banner above. */
  bannerMode?: boolean;
}

/**
 * A multi-child RenderBox that lays out children in a bordered grid.
 *
 * Children are interpreted as:
 * - children[0]: left pane (gets remaining width)
 * - children[1..n]: right pane children (stacked vertically, separated by horizontal dividers)
 *
 * If there's only one child, it fills the entire bordered area.
 *
 * Amp ref: class GJH extends GA (multi-child custom RenderObject)
 */
export class RenderGridBorder extends ContainerRenderBox {
  private _style: BoxDrawingStyle;
  private _borderColor: Color | undefined;
  private _rightPaneWidth: number;
  private _bannerMode: boolean;

  constructor(config?: GridBorderConfig) {
    super();
    this._style = config?.style ?? 'rounded';
    this._borderColor = config?.borderColor;
    this._rightPaneWidth = config?.rightPaneWidth ?? 0;
    this._bannerMode = config?.bannerMode ?? false;
  }

  // --- Config setters with dirty tracking ---

  get style(): BoxDrawingStyle { return this._style; }
  set style(v: BoxDrawingStyle) {
    if (this._style === v) return;
    this._style = v;
    this.markNeedsPaint();
  }

  get borderColor(): Color | undefined { return this._borderColor; }
  set borderColor(v: Color | undefined) {
    if (this._borderColor === v) return;
    this._borderColor = v;
    this.markNeedsPaint();
  }

  get rightPaneWidth(): number { return this._rightPaneWidth; }
  set rightPaneWidth(v: number) {
    if (this._rightPaneWidth === v) return;
    this._rightPaneWidth = v;
    this.markNeedsLayout();
  }

  get bannerMode(): boolean { return this._bannerMode; }
  set bannerMode(v: boolean) {
    if (this._bannerMode === v) return;
    this._bannerMode = v;
    this.markNeedsPaint();
  }

  // --- Layout ---

  performLayout(): void {
    const constraints = this.constraints!;
    const children = this.children;

    // Border takes 1 char on each side
    const borderH = 2; // left + right border
    const borderV = 2; // top + bottom border

    if (children.length === 0) {
      this.size = constraints.constrain(new Size(borderH, borderV));
      return;
    }

    const innerWidth = Math.max(0, constraints.maxWidth - borderH);
    const innerHeight = Math.max(0, constraints.maxHeight - borderV);

    const hasRightPane = this._rightPaneWidth > 0 && children.length > 1;
    const dividerWidth = hasRightPane ? 1 : 0; // vertical divider between panes
    const rightWidth = hasRightPane ? this._rightPaneWidth : 0;
    const leftWidth = Math.max(0, innerWidth - dividerWidth - rightWidth);

    // Layout left child (children[0])
    const leftChild = children[0];
    const leftConstraints = new BoxConstraints({
      minWidth: leftWidth,
      maxWidth: leftWidth,
      minHeight: innerHeight,
      maxHeight: innerHeight,
    });
    leftChild.layout(leftConstraints);
    leftChild.offset = new Offset(1, 1); // inside left border

    if (hasRightPane) {
      // Right pane children: children[1..n]
      const rightChildren = children.slice(1);
      const rightCount = rightChildren.length;
      // Horizontal dividers between right children
      const dividerCount = Math.max(0, rightCount - 1);
      const totalDividerHeight = dividerCount; // each divider = 1 row
      const availableRightHeight = Math.max(0, innerHeight - totalDividerHeight);

      // Distribute height evenly among right children
      const perChildHeight = rightCount > 0
        ? Math.floor(availableRightHeight / rightCount)
        : 0;
      let remainder = rightCount > 0
        ? availableRightHeight - perChildHeight * rightCount
        : 0;

      const rightX = 1 + leftWidth + dividerWidth; // border + left + divider
      let currentY = 1; // start inside top border

      for (let i = 0; i < rightChildren.length; i++) {
        const child = rightChildren[i];
        const h = perChildHeight + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;

        const childConstraints = new BoxConstraints({
          minWidth: rightWidth,
          maxWidth: rightWidth,
          minHeight: h,
          maxHeight: h,
        });
        child.layout(childConstraints);
        child.offset = new Offset(rightX, currentY);

        currentY += h;
        // Skip the divider row (accounted for in paint)
        if (i < rightChildren.length - 1) {
          currentY += 1;
        }
      }
    }

    // Size to constraints max (fill available space)
    this.size = constraints.constrain(
      new Size(constraints.maxWidth, constraints.maxHeight),
    );
  }

  // --- Paint ---

  paint(context: PaintContext, offset: Offset): void {
    const w = this.size.width;
    const h = this.size.height;
    if (w < 2 || h < 2) return;

    const col = offset.col;
    const row = offset.row;
    const chars = BOX_DRAWING[this._style];
    const cellStyle = this._borderColor ? { fg: this._borderColor } : {};

    // --- Draw outer border ---
    const tlChar = this._bannerMode ? chars.teeRight : chars.tl;
    context.drawChar(col, row, tlChar, cellStyle, 1);
    context.drawChar(col + w - 1, row, chars.tr, cellStyle, 1);
    context.drawChar(col, row + h - 1, chars.bl, cellStyle, 1);
    context.drawChar(col + w - 1, row + h - 1, chars.br, cellStyle, 1);

    // Top and bottom edges
    for (let c = col + 1; c < col + w - 1; c++) {
      context.drawChar(c, row, chars.h, cellStyle, 1);
      context.drawChar(c, row + h - 1, chars.h, cellStyle, 1);
    }

    // Left and right edges
    for (let r = row + 1; r < row + h - 1; r++) {
      context.drawChar(col, r, chars.v, cellStyle, 1);
      context.drawChar(col + w - 1, r, chars.v, cellStyle, 1);
    }

    // --- Draw vertical divider between left and right panes ---
    const hasRightPane = this._rightPaneWidth > 0 && this.children.length > 1;
    if (hasRightPane) {
      const innerWidth = w - 2;
      const dividerX = col + 1 + (innerWidth - 1 - this._rightPaneWidth);

      // Top T-junction
      context.drawChar(dividerX, row, chars.teeDown, cellStyle, 1);
      // Vertical line
      for (let r = row + 1; r < row + h - 1; r++) {
        context.drawChar(dividerX, r, chars.v, cellStyle, 1);
      }
      // Bottom T-junction
      context.drawChar(dividerX, row + h - 1, chars.teeUp, cellStyle, 1);

      // --- Draw horizontal dividers between right pane children ---
      const rightChildren = this.children.slice(1);
      for (let i = 0; i < rightChildren.length - 1; i++) {
        const child = rightChildren[i];
        const dividerY = offset.row + child.offset.row + child.size.height;

        // Cross junction at left edge of divider
        context.drawChar(dividerX, dividerY, chars.cross, cellStyle, 1);

        // Horizontal line from dividerX+1 to right border
        for (let c = dividerX + 1; c < col + w - 1; c++) {
          context.drawChar(c, dividerY, chars.h, cellStyle, 1);
        }

        // Right T-junction
        context.drawChar(col + w - 1, dividerY, chars.teeLeft, cellStyle, 1);
      }
    }

    // --- Paint children ---
    for (const child of this.children) {
      child.paint(context, offset.add(child.offset));
    }
  }
}
