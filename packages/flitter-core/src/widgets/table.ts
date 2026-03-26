// Table widget — N-column data table
// Amp ref: XYH class — full custom table RenderObject
//
// This widget wraps RenderTable for proper multi-column layout
// with column width modes, borders, and cell padding.
//
// Simple 2-column backward-compatible API:
//   new Table({ items, renderRow: (item) => [left, right] })
//
// Full N-column API:
//   new DataTable({
//     columns: 3,
//     columnWidths: [TableColumnWidth.fixed(20), TableColumnWidth.flex(), TableColumnWidth.intrinsic()],
//     showBorder: true,
//     rows: [[cell1, cell2, cell3], [cell4, cell5, cell6]],
//   })

import { Widget, StatelessWidget, type BuildContext } from '../framework/widget';
import { MultiChildRenderObjectWidget } from '../framework/render-object';
import { Key } from '../core/key';
import { Color } from '../core/color';
import { Column, Row } from './flex';
import { Expanded } from './flexible';
import { Divider } from './divider';
import {
  RenderTable,
  TableColumnWidth,
} from '../layout/render-table';
import type { BoxDrawingStyle } from '../painting/border-painter';

// Re-export for convenience
export { TableColumnWidth } from '../layout/render-table';

// ---------------------------------------------------------------------------
// Table (backward-compatible 2-column wrapper)
// ---------------------------------------------------------------------------

/**
 * A two-column data table widget (backward-compatible API).
 *
 * Takes an array of items and a renderRow function that produces a
 * [left, right] widget pair for each item. Each row is rendered as
 * a Row with two Expanded children.
 *
 * For N-column tables with borders and column width modes, use DataTable.
 */
export class Table<T = unknown> extends StatelessWidget {
  readonly items: T[];
  readonly renderRow: (item: T) => [Widget, Widget];
  readonly showDividers: boolean;

  constructor(opts: {
    key?: Key;
    items: T[];
    renderRow: (item: T) => [Widget, Widget];
    showDividers?: boolean;
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.items = opts.items;
    this.renderRow = opts.renderRow;
    this.showDividers = opts.showDividers ?? false;
  }

  build(_context: BuildContext): Widget {
    const children: Widget[] = [];

    for (let i = 0; i < this.items.length; i++) {
      const [left, right] = this.renderRow(this.items[i]!);
      children.push(
        new Row({
          children: [
            new Expanded({ child: left }),
            new Expanded({ child: right }),
          ],
        }),
      );
      if (this.showDividers && i < this.items.length - 1) {
        children.push(new Divider());
      }
    }

    return new Column({
      mainAxisSize: 'min',
      children,
    });
  }
}

// ---------------------------------------------------------------------------
// DataTable (N-column with RenderTable)
// ---------------------------------------------------------------------------

/**
 * An N-column data table widget using proper custom layout.
 *
 * Features:
 * - N-column support with configurable column widths
 * - Column width modes: fixed, flex, intrinsic
 * - Optional border painting with box-drawing characters
 * - Cell padding support
 *
 * Children are provided as rows of widgets:
 *   rows: [[col0, col1, col2], [col0, col1, col2], ...]
 *
 * Amp ref: class XYH
 */
export class DataTable extends MultiChildRenderObjectWidget {
  readonly columnCount: number;
  readonly columnWidths: TableColumnWidth[];
  readonly showBorder: boolean;
  readonly borderStyle: BoxDrawingStyle;
  readonly borderColor?: Color;
  readonly cellPadding: number;

  constructor(opts: {
    key?: Key;
    columns: number;
    columnWidths?: TableColumnWidth[];
    showBorder?: boolean;
    borderStyle?: BoxDrawingStyle;
    borderColor?: Color;
    cellPadding?: number;
    /** Rows of cells. Each inner array has `columns` widgets. */
    rows: Widget[][];
  }) {
    // Flatten rows into a flat children array
    const flatChildren: Widget[] = [];
    for (const row of opts.rows) {
      for (const cell of row) {
        flatChildren.push(cell);
      }
    }
    super({ key: opts.key, children: flatChildren });

    this.columnCount = opts.columns;
    this.columnWidths = opts.columnWidths ?? [];
    this.showBorder = opts.showBorder ?? false;
    this.borderStyle = opts.borderStyle ?? 'solid';
    this.borderColor = opts.borderColor;
    this.cellPadding = opts.cellPadding ?? 0;
  }

  createRenderObject(): RenderTable {
    return new RenderTable({
      columns: this.columnCount,
      columnWidths: this.columnWidths,
      showBorder: this.showBorder,
      borderStyle: this.borderStyle,
      borderColor: this.borderColor,
      cellPadding: this.cellPadding,
    });
  }

  updateRenderObject(renderObject: RenderTable): void {
    renderObject.columns = this.columnCount;
    renderObject.columnWidths = this.columnWidths;
    renderObject.showBorder = this.showBorder;
    renderObject.borderStyle = this.borderStyle;
    renderObject.borderColor = this.borderColor;
    renderObject.cellPadding = this.cellPadding;
  }
}
