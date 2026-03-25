// Tests for RenderDecoratedBox
// Covers: border width deflation, self-sizing, BoxDecoration/Border construction,
//   no decoration pass-through, paint outputs correct border characters

import { describe, expect, test } from 'bun:test';
import {
  RenderDecoratedBox,
  BoxDecoration,
  Border,
  BorderSide,
} from '../render-decorated';
import { BoxConstraints } from '../../core/box-constraints';
import { Offset, Size } from '../../core/types';
import { Color } from '../../core/color';
import { RenderBox } from '../../framework/render-object';
import { PaintContext } from '../../scheduler/paint-context';
import { ScreenBuffer } from '../../terminal/screen-buffer';

// --- Test helpers ---

class FixedSizeBox extends RenderBox {
  private _desiredWidth: number;
  private _desiredHeight: number;

  constructor(width: number, height: number) {
    super();
    this._desiredWidth = width;
    this._desiredHeight = height;
  }

  performLayout(): void {
    const c = this.constraints!;
    this.size = c.constrain(new Size(this._desiredWidth, this._desiredHeight));
  }

  paint(_context: PaintContext, _offset: Offset): void {}
}

/** Create a PaintContext backed by a real ScreenBuffer and return both. */
function createTestContext(width: number, height: number) {
  const screen = new ScreenBuffer(width, height);
  const ctx = new PaintContext(screen);
  return { screen, ctx };
}

/** Read a character from the back buffer at (col, row). */
function getCharAt(screen: ScreenBuffer, col: number, row: number): string {
  const cell = screen.getBackBuffer().getCell(col, row);
  return cell.char;
}

describe('BoxDecoration', () => {
  test('default construction has no color or border', () => {
    const dec = new BoxDecoration();
    expect(dec.color).toBeUndefined();
    expect(dec.border).toBeUndefined();
  });

  test('construction with color and border', () => {
    const dec = new BoxDecoration({
      color: Color.blue,
      border: Border.all(new BorderSide({ width: 1 })),
    });
    expect(dec.color).toBe(Color.blue);
    expect(dec.border).toBeDefined();
  });

  test('equality', () => {
    const a = new BoxDecoration({ color: Color.red });
    const b = new BoxDecoration({ color: Color.red });
    const c = new BoxDecoration({ color: Color.blue });
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

describe('Border', () => {
  test('Border.all creates uniform border', () => {
    const side = new BorderSide({ width: 1, style: 'rounded' });
    const border = Border.all(side);
    expect(border.top.equals(side)).toBe(true);
    expect(border.right.equals(side)).toBe(true);
    expect(border.bottom.equals(side)).toBe(true);
    expect(border.left.equals(side)).toBe(true);
  });

  test('horizontal and vertical totals', () => {
    const border = new Border({
      top: new BorderSide({ width: 1 }),
      right: new BorderSide({ width: 2 }),
      bottom: new BorderSide({ width: 1 }),
      left: new BorderSide({ width: 3 }),
    });
    expect(border.horizontal).toBe(5); // 3 + 2
    expect(border.vertical).toBe(2);   // 1 + 1
  });
});

describe('BorderSide', () => {
  test('defaults', () => {
    const side = new BorderSide();
    expect(side.width).toBe(1);
    expect(side.style).toBe('solid');
  });

  test('none has zero width', () => {
    expect(BorderSide.none.width).toBe(0);
  });
});

describe('RenderDecoratedBox', () => {
  describe('border width deflation in layout', () => {
    test('child receives constraints deflated by border widths', () => {
      const child = new FixedSizeBox(20, 10);
      const box = new RenderDecoratedBox({
        decoration: new BoxDecoration({
          border: Border.all(new BorderSide({ width: 1 })),
        }),
        child,
      });

      box.layout(BoxConstraints.tight(new Size(40, 20)));

      // Border: 1 on each side => h=2, v=2
      // Deflated: tight(38, 18)
      expect(child.constraints!.minWidth).toBe(38);
      expect(child.constraints!.maxWidth).toBe(38);
      expect(child.constraints!.minHeight).toBe(18);
      expect(child.constraints!.maxHeight).toBe(18);

      // Child sizes to 38x18 (tight constraints)
      expect(child.size.width).toBe(38);
      expect(child.size.height).toBe(18);

      // Self-size = child + border = 38+2=40, 18+2=20
      expect(box.size.width).toBe(40);
      expect(box.size.height).toBe(20);
    });

    test('child offset is inside the border', () => {
      const child = new FixedSizeBox(10, 5);
      const box = new RenderDecoratedBox({
        decoration: new BoxDecoration({
          border: new Border({
            top: new BorderSide({ width: 1 }),
            right: new BorderSide({ width: 1 }),
            bottom: new BorderSide({ width: 1 }),
            left: new BorderSide({ width: 2 }),
          }),
        }),
        child,
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // Child offset should be (left border, top border) = (2, 1)
      expect(child.offset.col).toBe(2);
      expect(child.offset.row).toBe(1);
    });
  });

  describe('self-sizing with border', () => {
    test('no child sizes to border widths', () => {
      const box = new RenderDecoratedBox({
        decoration: new BoxDecoration({
          border: Border.all(new BorderSide({ width: 1 })),
        }),
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // No child: size = constrain(h=2, v=2)
      expect(box.size.width).toBe(2);
      expect(box.size.height).toBe(2);
    });
  });

  describe('no decoration pass-through', () => {
    test('empty decoration acts as transparent wrapper', () => {
      const child = new FixedSizeBox(20, 10);
      const box = new RenderDecoratedBox({
        decoration: new BoxDecoration(),
        child,
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // No border => no deflation
      expect(child.constraints!.maxWidth).toBe(80);
      expect(child.constraints!.maxHeight).toBe(24);
      expect(child.size.width).toBe(20);
      expect(child.size.height).toBe(10);
      expect(box.size.width).toBe(20);
      expect(box.size.height).toBe(10);
    });
  });

  describe('paint outputs correct border characters', () => {
    test('rounded border draws correct corners and edges', () => {
      const box = new RenderDecoratedBox({
        decoration: new BoxDecoration({
          border: Border.all(new BorderSide({ width: 1, style: 'rounded' })),
        }),
      });

      // Force a 6x4 size
      box.layout(BoxConstraints.tight(new Size(6, 4)));

      const { screen, ctx } = createTestContext(10, 8);
      box.paint(ctx, Offset.zero);

      // Corners
      expect(getCharAt(screen, 0, 0)).toBe('\u256D'); // ╭ top-left
      expect(getCharAt(screen, 5, 0)).toBe('\u256E'); // ╮ top-right
      expect(getCharAt(screen, 0, 3)).toBe('\u2570'); // ╰ bottom-left
      expect(getCharAt(screen, 5, 3)).toBe('\u256F'); // ╯ bottom-right

      // Horizontal edges (top)
      expect(getCharAt(screen, 1, 0)).toBe('\u2500'); // ─
      expect(getCharAt(screen, 4, 0)).toBe('\u2500'); // ─

      // Vertical edges (left)
      expect(getCharAt(screen, 0, 1)).toBe('\u2502'); // │
      expect(getCharAt(screen, 0, 2)).toBe('\u2502'); // │

      // Vertical edges (right)
      expect(getCharAt(screen, 5, 1)).toBe('\u2502'); // │
      expect(getCharAt(screen, 5, 2)).toBe('\u2502'); // │
    });

    test('solid border draws correct corners', () => {
      const box = new RenderDecoratedBox({
        decoration: new BoxDecoration({
          border: Border.all(new BorderSide({ width: 1, style: 'solid' })),
        }),
      });

      box.layout(BoxConstraints.tight(new Size(4, 3)));

      const { screen, ctx } = createTestContext(10, 8);
      box.paint(ctx, Offset.zero);

      expect(getCharAt(screen, 0, 0)).toBe('\u250C'); // ┌ top-left
      expect(getCharAt(screen, 3, 0)).toBe('\u2510'); // ┐ top-right
      expect(getCharAt(screen, 0, 2)).toBe('\u2514'); // └ bottom-left
      expect(getCharAt(screen, 3, 2)).toBe('\u2518'); // ┘ bottom-right
    });

    test('background color fills interior', () => {
      const bgColor = Color.blue;
      const box = new RenderDecoratedBox({
        decoration: new BoxDecoration({
          color: bgColor,
          border: Border.all(new BorderSide({ width: 1, style: 'solid' })),
        }),
      });

      box.layout(BoxConstraints.tight(new Size(5, 4)));

      const { screen, ctx } = createTestContext(10, 8);
      box.paint(ctx, Offset.zero);

      // Interior cells (inside border) should have background color
      const backBuf = screen.getBackBuffer();
      let bgCount = 0;
      for (let r = 1; r < 3; r++) {
        for (let c = 1; c < 4; c++) {
          const cell = backBuf.getCell(c, r);
          expect(cell.char).toBe(' ');
          expect(cell.style?.bg).toBe(bgColor);
          bgCount++;
        }
      }

      // Interior is 3x2 = 6 cells
      expect(bgCount).toBe(6);
    });

    test('paint with offset shifts all coordinates', () => {
      const box = new RenderDecoratedBox({
        decoration: new BoxDecoration({
          border: Border.all(new BorderSide({ width: 1, style: 'rounded' })),
        }),
      });

      box.layout(BoxConstraints.tight(new Size(4, 3)));

      const { screen, ctx } = createTestContext(20, 12);
      box.paint(ctx, new Offset(10, 5));

      // Top-left corner should be at (10, 5)
      expect(getCharAt(screen, 10, 5)).toBe('\u256D'); // ╭
      // Bottom-right corner at (13, 7)
      expect(getCharAt(screen, 13, 7)).toBe('\u256F'); // ╯
    });
  });

  describe('decoration property setter', () => {
    test('updating decoration triggers relayout', () => {
      const child = new FixedSizeBox(10, 5);
      const box = new RenderDecoratedBox({
        decoration: new BoxDecoration(),
        child,
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));
      expect(box.size.width).toBe(10);

      box.decoration = new BoxDecoration({
        border: Border.all(new BorderSide({ width: 2 })),
      });
      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // With border 2 on each side: child gets max 76x20, wants 10x5
      // Self-size = 10+4=14, 5+4=9
      expect(box.size.width).toBe(14);
      expect(box.size.height).toBe(9);
    });
  });
});
