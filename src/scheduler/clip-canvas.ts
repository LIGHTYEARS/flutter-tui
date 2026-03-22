// ClipCanvas — wraps a PaintContext and clips all draw operations to a Rect.
// Used by RenderScrollViewport.paint() to clip content to viewport bounds.
// Amp ref: E$ class — clip wrapper for paint context
//
// All draw operations outside the clip rect are silently discarded.
// Draw operations that partially overlap are truncated/intersected to fit.

import { Rect } from '../core/types.js';
import { PaintContext } from './paint-context.js';
import { type CellStyle } from '../terminal/cell.js';
import { TextSpan } from '../core/text-span.js';
import { type BorderStyle } from './paint-context.js';
import { Color } from '../core/color.js';

/**
 * A canvas wrapper that clips all drawing operations to a specified Rect.
 *
 * ClipCanvas delegates to an underlying PaintContext but silently discards
 * or truncates any draw calls that fall outside the clip region.
 *
 * Amp ref: E$ class — used by scroll viewport paint
 */
export class ClipCanvas {
  private readonly _context: PaintContext;
  private readonly _clip: Rect;

  constructor(context: PaintContext, clip: Rect) {
    this._context = context;
    this._clip = clip;
  }

  /** The clip rectangle for this canvas. */
  get clip(): Rect {
    return this._clip;
  }

  /** The underlying paint context. */
  get context(): PaintContext {
    return this._context;
  }

  /**
   * Draw a single character at (col, row).
   * Silently skipped if outside the clip rect.
   */
  drawChar(col: number, row: number, char: string, style?: CellStyle): void {
    if (!this._isInClip(col, row)) return;
    this._context.drawChar(col, row, char, style);
  }

  /**
   * Draw a text string starting at (col, row).
   * Text is truncated to fit within the clip rect horizontally.
   * If the row is outside the clip, the entire draw is skipped.
   */
  drawText(col: number, row: number, text: string, style?: CellStyle): void {
    if (row < this._clip.top || row >= this._clip.bottom) return;

    // Calculate the visible portion of the text
    const clipLeft = this._clip.left;
    const clipRight = this._clip.right;

    let curCol = col;
    let visibleText = '';
    let startCol: number | null = null;

    for (const char of text) {
      // Simple width-1 assumption for most chars; we truncate at column level
      const charWidth = 1; // PaintContext handles CJK internally
      if (curCol >= clipRight) break; // past right edge
      if (curCol >= clipLeft) {
        if (startCol === null) startCol = curCol;
        visibleText += char;
      }
      curCol += charWidth;
    }

    if (visibleText.length > 0 && startCol !== null) {
      this._context.drawText(startCol, row, visibleText, style);
    }
  }

  /**
   * Draw a TextSpan tree starting at (col, row).
   * Truncated to fit within the clip rect.
   * If the row is outside the clip, the entire draw is skipped.
   * Returns the number of columns drawn.
   */
  drawTextSpan(col: number, row: number, span: TextSpan): number {
    if (row < this._clip.top || row >= this._clip.bottom) return 0;

    // Use maxWidth to limit span rendering to clip bounds
    const maxWidth = Math.max(0, this._clip.right - col);
    if (maxWidth <= 0) return 0;
    if (col < this._clip.left) {
      // Span starts before clip — delegate to context which handles clipping
      // via the PaintContext's own clip mechanism
      return this._context.drawTextSpan(col, row, span, maxWidth);
    }
    return this._context.drawTextSpan(col, row, span, maxWidth);
  }

  /**
   * Fill a rectangular region with a character and style.
   * The fill rect is intersected with the clip rect.
   */
  fillRect(
    x: number,
    y: number,
    w: number,
    h: number,
    char: string = ' ',
    style?: CellStyle,
  ): void {
    const fillRect = new Rect(x, y, w, h);
    const clipped = fillRect.intersect(this._clip);
    if (clipped.width <= 0 || clipped.height <= 0) return;

    this._context.fillRect(
      clipped.left,
      clipped.top,
      clipped.width,
      clipped.height,
      char,
      style,
    );
  }

  /**
   * Draw a Unicode box-drawing border.
   * The border rect is intersected with the clip rect.
   * If the intersection is too small for a valid border (< 2x2), skipped.
   */
  drawBorder(
    x: number,
    y: number,
    w: number,
    h: number,
    borderStyle: BorderStyle,
    color?: Color,
  ): void {
    const borderRect = new Rect(x, y, w, h);
    const clipped = borderRect.intersect(this._clip);
    if (clipped.width < 2 || clipped.height < 2) return;

    this._context.drawBorder(
      clipped.left,
      clipped.top,
      clipped.width,
      clipped.height,
      borderStyle,
      color,
    );
  }

  /**
   * Create a sub-ClipCanvas with a further-restricted clip rect.
   * The new clip is the intersection of the current clip and the given rect.
   */
  withClip(rect: Rect): ClipCanvas {
    const newClip = this._clip.intersect(rect);
    return new ClipCanvas(this._context, newClip);
  }

  /**
   * Check if a single cell position (col, row) is within the clip rect.
   */
  private _isInClip(col: number, row: number): boolean {
    return (
      col >= this._clip.left &&
      col < this._clip.right &&
      row >= this._clip.top &&
      row < this._clip.bottom
    );
  }
}
