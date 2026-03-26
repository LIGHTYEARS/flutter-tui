// TreeConnector — paint utility for tree-drawing connector characters
// Amp ref: class cQH — paints ├─, └─, │ alongside vertically stacked children
//
// Usage:
//   paintTreeConnectors(ctx, x, y, childHeights, {
//     style: 'solid',
//     color: Color.dim,
//   });

import type { PaintContext } from '../scheduler/paint-context';
import type { Color } from '../core/color';

// ---------------------------------------------------------------------------
// Tree Drawing Characters
// ---------------------------------------------------------------------------

export interface TreeChars {
  readonly tee: string;    // ├ (non-last child)
  readonly elbow: string;  // └ (last child)
  readonly pipe: string;   // │ (continuation)
  readonly dash: string;   // ─ (horizontal connector)
}

export const TREE_CHARS_SOLID: TreeChars = {
  tee: '\u251C',    // ├
  elbow: '\u2514',  // └
  pipe: '\u2502',   // │
  dash: '\u2500',   // ─
};

export const TREE_CHARS_ROUNDED: TreeChars = {
  tee: '\u251C',      // ├
  elbow: '\u2570',    // ╰
  pipe: '\u2502',     // │
  dash: '\u2500',     // ─
};

export interface TreeConnectorOpts {
  /** Character style: 'solid' or 'rounded'. Default: 'solid'. */
  readonly style?: 'solid' | 'rounded';
  /** Color for tree connector characters. */
  readonly color?: Color;
  /** Number of dash characters after the tee/elbow. Default: 1. */
  readonly dashWidth?: number;
}

/**
 * Paint tree connector characters alongside a vertical list of children.
 *
 * This draws the tree lines to the LEFT of the children. The caller is
 * responsible for positioning the children themselves.
 *
 * ```
 * ├─ child 0          (height: 2 rows)
 * │  continuation
 * ├─ child 1          (height: 1 row)
 * └─ child 2 (last)   (height: 3 rows)
 *    continuation
 *    continuation
 * ```
 *
 * @param ctx           PaintContext to draw on
 * @param x             Column for the │/├/└ character
 * @param y             Starting row
 * @param childHeights  Array of heights (in rows) for each child
 * @param opts          Style options
 */
export function paintTreeConnectors(
  ctx: PaintContext,
  x: number,
  y: number,
  childHeights: number[],
  opts?: TreeConnectorOpts,
): void {
  const chars = (opts?.style === 'rounded') ? TREE_CHARS_ROUNDED : TREE_CHARS_SOLID;
  const cellStyle = opts?.color ? { fg: opts.color } : {};
  const dashWidth = opts?.dashWidth ?? 1;
  const count = childHeights.length;

  let currentY = y;
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const height = childHeights[i];

    // First row of this child: tee or elbow
    const connector = isLast ? chars.elbow : chars.tee;
    ctx.drawChar(x, currentY, connector, cellStyle, 1);

    // Dashes after the connector
    for (let d = 1; d <= dashWidth; d++) {
      ctx.drawChar(x + d, currentY, chars.dash, cellStyle, 1);
    }

    // Continuation rows: pipe (if not last) or space (if last)
    for (let row = 1; row < height; row++) {
      if (!isLast) {
        ctx.drawChar(x, currentY + row, chars.pipe, cellStyle, 1);
      }
      // If last child, no pipe — leave blank
    }

    currentY += height;
  }
}

/**
 * Compute the total width consumed by tree connector characters.
 * This is the number of columns reserved for the tree lines.
 *
 * @param dashWidth Number of dash characters. Default: 1.
 * @returns Total width: 1 (connector) + dashWidth + 1 (space)
 */
export function treeConnectorWidth(dashWidth: number = 1): number {
  return 1 + dashWidth + 1; // connector + dashes + space
}
