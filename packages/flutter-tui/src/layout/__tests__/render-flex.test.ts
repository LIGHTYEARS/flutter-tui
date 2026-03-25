// Tests for RenderFlex — the 6-step flex layout algorithm.
// Covers: non-flex layout, flex distribution, all MainAxisAlignment variants,
//         all CrossAxisAlignment variants, mainAxisSize min vs max,
//         nested flex, empty children, mixed flex/non-flex, tight vs loose FlexFit.

import { describe, expect, test } from 'bun:test';
import { Offset, Size } from '../../core/types';
import { BoxConstraints } from '../../core/box-constraints';
import { RenderBox, PaintContext } from '../../framework/render-object';
import { RenderFlex } from '../render-flex';
import { FlexParentData } from '../parent-data';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * A minimal RenderBox that takes its constraints' biggest (or tight) size.
 * Useful for non-flex children with a known fixed size.
 */
class FixedSizeBox extends RenderBox {
  private _desiredSize: Size;

  constructor(width: number, height: number) {
    super();
    this._desiredSize = new Size(width, height);
  }

  performLayout(): void {
    this.size = this.constraints!.constrain(this._desiredSize);
  }

  paint(_context: PaintContext, _offset: Offset): void {}
}

/**
 * A RenderBox that always takes the biggest size allowed by constraints.
 * Useful for flex children to see what constraints they receive.
 */
class GreedyBox extends RenderBox {
  performLayout(): void {
    const c = this.constraints!;
    const w = Number.isFinite(c.maxWidth) ? c.maxWidth : c.minWidth;
    const h = Number.isFinite(c.maxHeight) ? c.maxHeight : c.minHeight;
    this.size = new Size(w, h);
  }

  paint(_context: PaintContext, _offset: Offset): void {}
}

/** Helper: insert a child into a RenderFlex and optionally set flex. */
function addChild(
  flex: RenderFlex,
  child: RenderBox,
  flexValue?: number,
  fit?: 'tight' | 'loose',
): void {
  flex.insert(child);
  const pd = child.parentData as FlexParentData;
  if (flexValue !== undefined) pd.flex = flexValue;
  if (fit !== undefined) pd.fit = fit;
}

// ---------------------------------------------------------------------------
// setupParentData
// ---------------------------------------------------------------------------

describe('RenderFlex setupParentData', () => {
  test('creates FlexParentData for children', () => {
    const flex = new RenderFlex();
    const child = new FixedSizeBox(10, 10);
    flex.insert(child);
    expect(child.parentData).toBeInstanceOf(FlexParentData);
  });

  test('does not replace existing FlexParentData', () => {
    const flex = new RenderFlex();
    const child = new FixedSizeBox(10, 10);
    const pd = new FlexParentData(3, 'loose');
    child.parentData = pd;
    flex.setupParentData(child);
    expect(child.parentData).toBe(pd);
  });
});

// ---------------------------------------------------------------------------
// Empty children
// ---------------------------------------------------------------------------

describe('RenderFlex empty children', () => {
  test('horizontal flex with no children', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    flex.layout(BoxConstraints.tight(new Size(80, 24)));
    expect(flex.size.width).toBe(80);
    expect(flex.size.height).toBe(24);
  });

  test('vertical flex with no children', () => {
    const flex = new RenderFlex({ direction: 'vertical' });
    flex.layout(BoxConstraints.tight(new Size(80, 24)));
    expect(flex.size.width).toBe(80);
    expect(flex.size.height).toBe(24);
  });

  test('mainAxisSize min with no children yields zero main axis', () => {
    const flex = new RenderFlex({ direction: 'horizontal', mainAxisSize: 'min' });
    flex.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));
    expect(flex.size.width).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Non-flex children layout
// ---------------------------------------------------------------------------

describe('RenderFlex non-flex children', () => {
  test('horizontal: children laid out left to right', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new FixedSizeBox(10, 5);
    const c2 = new FixedSizeBox(20, 8);
    const c3 = new FixedSizeBox(15, 3);

    addChild(flex, c1);
    addChild(flex, c2);
    addChild(flex, c3);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));

    // Children start at left
    expect(c1.offset.col).toBe(0);
    expect(c1.offset.row).toBe(0);
    expect(c2.offset.col).toBe(10);
    expect(c3.offset.col).toBe(30);

    // Sizes preserved
    expect(c1.size.width).toBe(10);
    expect(c2.size.width).toBe(20);
    expect(c3.size.width).toBe(15);
  });

  test('vertical: children laid out top to bottom', () => {
    const flex = new RenderFlex({ direction: 'vertical' });
    const c1 = new FixedSizeBox(30, 5);
    const c2 = new FixedSizeBox(40, 10);

    addChild(flex, c1);
    addChild(flex, c2);

    flex.layout(BoxConstraints.tight(new Size(80, 40)));

    expect(c1.offset.row).toBe(0);
    expect(c1.offset.col).toBe(0);
    expect(c2.offset.row).toBe(5);
    expect(c2.offset.col).toBe(0);
  });

  test('allocatedSize tracks total main axis usage', () => {
    const flex = new RenderFlex({ direction: 'horizontal', mainAxisSize: 'min' });
    const c1 = new FixedSizeBox(10, 5);
    const c2 = new FixedSizeBox(20, 8);

    addChild(flex, c1);
    addChild(flex, c2);

    flex.layout(new BoxConstraints({ maxWidth: 100, maxHeight: 20 }));

    // mainAxisSize=min -> size.width = allocatedSize = 10 + 20
    expect(flex.size.width).toBe(30);
  });

  test('cross axis tracks maximum child cross size', () => {
    const flex = new RenderFlex({
      direction: 'horizontal',
      mainAxisSize: 'min',
    });
    const c1 = new FixedSizeBox(10, 5);
    const c2 = new FixedSizeBox(20, 12);

    addChild(flex, c1);
    addChild(flex, c2);

    flex.layout(new BoxConstraints({ maxWidth: 100, maxHeight: 20 }));

    // Cross axis (height) should be max of children = 12
    expect(flex.size.height).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// Flex children distribution
// ---------------------------------------------------------------------------

describe('RenderFlex flex distribution', () => {
  test('1:1 flex ratio splits space evenly', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new GreedyBox();
    const c2 = new GreedyBox();

    addChild(flex, c1, 1);
    addChild(flex, c2, 1);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));

    // Each gets 50 (100 / 2)
    expect(c1.size.width).toBe(50);
    expect(c2.size.width).toBe(50);
  });

  test('1:2:3 flex ratio distributes proportionally', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new GreedyBox();
    const c2 = new GreedyBox();
    const c3 = new GreedyBox();

    addChild(flex, c1, 1);
    addChild(flex, c2, 2);
    addChild(flex, c3, 3);

    flex.layout(BoxConstraints.tight(new Size(120, 20)));

    // Total flex = 6, space per flex = 20
    // c1 = 20, c2 = 40, c3 = 60
    expect(c1.size.width).toBe(20);
    expect(c2.size.width).toBe(40);
    expect(c3.size.width).toBe(60);
  });

  test('vertical flex distribution', () => {
    const flex = new RenderFlex({ direction: 'vertical' });
    const c1 = new GreedyBox();
    const c2 = new GreedyBox();

    addChild(flex, c1, 1);
    addChild(flex, c2, 3);

    flex.layout(BoxConstraints.tight(new Size(40, 100)));

    // Total flex = 4, space per flex = 25
    // c1 = 25, c2 = 75
    expect(c1.size.height).toBe(25);
    expect(c2.size.height).toBe(75);
  });
});

// ---------------------------------------------------------------------------
// Mixed flex and non-flex
// ---------------------------------------------------------------------------

describe('RenderFlex mixed flex and non-flex', () => {
  test('non-flex child gets fixed size, flex child gets remainder', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const fixed = new FixedSizeBox(30, 10);
    const flexible = new GreedyBox();

    addChild(flex, fixed);
    addChild(flex, flexible, 1);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));

    // Fixed child: 30 wide
    // Flexible child: 100 - 30 = 70
    expect(fixed.size.width).toBe(30);
    expect(flexible.size.width).toBe(70);

    // Positions
    expect(fixed.offset.col).toBe(0);
    expect(flexible.offset.col).toBe(30);
  });

  test('multiple non-flex and flex children', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const f1 = new FixedSizeBox(10, 10);
    const f2 = new FixedSizeBox(20, 10);
    const e1 = new GreedyBox();
    const e2 = new GreedyBox();

    addChild(flex, f1);       // non-flex: 10
    addChild(flex, e1, 1);    // flex=1
    addChild(flex, f2);       // non-flex: 20
    addChild(flex, e2, 2);    // flex=2

    flex.layout(BoxConstraints.tight(new Size(120, 10)));

    // Non-flex total: 10 + 20 = 30
    // Remaining: 120 - 30 = 90
    // Total flex: 3
    // e1 = 30, e2 = 60
    expect(f1.size.width).toBe(10);
    expect(e1.size.width).toBe(30);
    expect(f2.size.width).toBe(20);
    expect(e2.size.width).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// MainAxisAlignment variants
// ---------------------------------------------------------------------------

describe('RenderFlex MainAxisAlignment', () => {
  // Helper: layout 3 children of 10px each in 100px container (horizontal)
  function layoutAlignment(alignment: 'start' | 'end' | 'center' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly') {
    const flex = new RenderFlex({
      direction: 'horizontal',
      mainAxisAlignment: alignment,
    });
    const c1 = new FixedSizeBox(10, 5);
    const c2 = new FixedSizeBox(10, 5);
    const c3 = new FixedSizeBox(10, 5);

    addChild(flex, c1);
    addChild(flex, c2);
    addChild(flex, c3);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    return [c1, c2, c3];
  }

  test('start: children packed at start', () => {
    const [c1, c2, c3] = layoutAlignment('start');
    expect(c1.offset.col).toBe(0);
    expect(c2.offset.col).toBe(10);
    expect(c3.offset.col).toBe(20);
  });

  test('end: children packed at end', () => {
    const [c1, c2, c3] = layoutAlignment('end');
    // remaining = 100 - 30 = 70
    expect(c1.offset.col).toBe(70);
    expect(c2.offset.col).toBe(80);
    expect(c3.offset.col).toBe(90);
  });

  test('center: children centered', () => {
    const [c1, c2, c3] = layoutAlignment('center');
    // remaining = 70, leading = 35
    expect(c1.offset.col).toBe(35);
    expect(c2.offset.col).toBe(45);
    expect(c3.offset.col).toBe(55);
  });

  test('spaceBetween: space distributed between children', () => {
    const [c1, c2, c3] = layoutAlignment('spaceBetween');
    // remaining = 70, between = 70/2 = 35
    expect(c1.offset.col).toBe(0);
    expect(c2.offset.col).toBe(45); // 10 + 35
    expect(c3.offset.col).toBe(90); // 45 + 10 + 35
  });

  test('spaceAround: space distributed around children', () => {
    const [c1, c2, c3] = layoutAlignment('spaceAround');
    // remaining = 70, between = 70/3 ≈ 23.33, leading = 11.67
    // c1.col = round(11.67) = 12
    // c2.col = round(11.67 + 10 + 23.33) = round(45) = 45
    // c3.col = round(45 + 10 + 23.33) = round(78.33) = 78
    expect(c1.offset.col).toBe(12);
    expect(c2.offset.col).toBe(45);
    expect(c3.offset.col).toBe(78);
  });

  test('spaceEvenly: equal space before, between, and after', () => {
    const [c1, c2, c3] = layoutAlignment('spaceEvenly');
    // remaining = 70, between = 70/4 = 17.5, leading = 17.5
    // c1.col = round(17.5) = 18
    // c2.col = round(17.5 + 10 + 17.5) = round(45) = 45
    // c3.col = round(45 + 10 + 17.5) = round(72.5) = 73
    expect(c1.offset.col).toBe(18);
    expect(c2.offset.col).toBe(45);
    expect(c3.offset.col).toBe(73);
  });

  test('spaceBetween with single child: child at start', () => {
    const flex = new RenderFlex({
      direction: 'horizontal',
      mainAxisAlignment: 'spaceBetween',
    });
    const c1 = new FixedSizeBox(10, 5);
    addChild(flex, c1);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    expect(c1.offset.col).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// CrossAxisAlignment variants
// ---------------------------------------------------------------------------

describe('RenderFlex CrossAxisAlignment', () => {
  test('start: children at cross axis start', () => {
    const flex = new RenderFlex({
      direction: 'horizontal',
      crossAxisAlignment: 'start',
    });
    const c1 = new FixedSizeBox(20, 5);
    addChild(flex, c1);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    expect(c1.offset.row).toBe(0);
  });

  test('center: children centered on cross axis', () => {
    const flex = new RenderFlex({
      direction: 'horizontal',
      crossAxisAlignment: 'center',
    });
    const c1 = new FixedSizeBox(20, 10);
    addChild(flex, c1);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    // (20 - 10) / 2 = 5
    expect(c1.offset.row).toBe(5);
  });

  test('end: children at cross axis end', () => {
    const flex = new RenderFlex({
      direction: 'horizontal',
      crossAxisAlignment: 'end',
    });
    const c1 = new FixedSizeBox(20, 10);
    addChild(flex, c1);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    // 20 - 10 = 10
    expect(c1.offset.row).toBe(10);
  });

  test('stretch: children stretched to fill cross axis', () => {
    const flex = new RenderFlex({
      direction: 'horizontal',
      crossAxisAlignment: 'stretch',
    });
    const c1 = new GreedyBox();
    addChild(flex, c1);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    // Stretch forces height=20
    expect(c1.size.height).toBe(20);
    expect(c1.offset.row).toBe(0);
  });

  test('vertical flex with cross axis center', () => {
    const flex = new RenderFlex({
      direction: 'vertical',
      crossAxisAlignment: 'center',
    });
    const c1 = new FixedSizeBox(20, 5);
    addChild(flex, c1);

    flex.layout(BoxConstraints.tight(new Size(80, 40)));
    // Cross is horizontal: (80 - 20) / 2 = 30
    expect(c1.offset.col).toBe(30);
  });

  test('vertical flex with cross axis end', () => {
    const flex = new RenderFlex({
      direction: 'vertical',
      crossAxisAlignment: 'end',
    });
    const c1 = new FixedSizeBox(20, 5);
    addChild(flex, c1);

    flex.layout(BoxConstraints.tight(new Size(80, 40)));
    // 80 - 20 = 60
    expect(c1.offset.col).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// mainAxisSize min vs max
// ---------------------------------------------------------------------------

describe('RenderFlex mainAxisSize', () => {
  test('max: flex takes full available main axis', () => {
    const flex = new RenderFlex({
      direction: 'horizontal',
      mainAxisSize: 'max',
    });
    const c1 = new FixedSizeBox(20, 10);
    addChild(flex, c1);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    expect(flex.size.width).toBe(100);
  });

  test('min: flex shrinks to content', () => {
    const flex = new RenderFlex({
      direction: 'horizontal',
      mainAxisSize: 'min',
    });
    const c1 = new FixedSizeBox(20, 10);
    const c2 = new FixedSizeBox(15, 10);
    addChild(flex, c1);
    addChild(flex, c2);

    flex.layout(new BoxConstraints({ maxWidth: 100, maxHeight: 20 }));
    // content = 20 + 15 = 35
    expect(flex.size.width).toBe(35);
  });

  test('vertical min: shrinks to content height', () => {
    const flex = new RenderFlex({
      direction: 'vertical',
      mainAxisSize: 'min',
    });
    const c1 = new FixedSizeBox(30, 8);
    const c2 = new FixedSizeBox(30, 12);
    addChild(flex, c1);
    addChild(flex, c2);

    flex.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 100 }));
    expect(flex.size.height).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// tight vs loose FlexFit
// ---------------------------------------------------------------------------

describe('RenderFlex FlexFit', () => {
  test('tight fit: child must fill its allocated space', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new GreedyBox();
    addChild(flex, c1, 1, 'tight');

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    // Tight constraints: min=max=100
    expect(c1.size.width).toBe(100);
  });

  test('loose fit: child can be smaller than allocated space', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    // A FixedSizeBox will use its desired size (clamped to constraints)
    const c1 = new FixedSizeBox(30, 10);
    addChild(flex, c1, 1, 'loose');

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    // Loose constraints: 0..100, FixedSizeBox wants 30
    expect(c1.size.width).toBe(30);
  });

  test('loose fit with GreedyBox still takes allocated space', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new GreedyBox();
    addChild(flex, c1, 1, 'loose');

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    // GreedyBox always takes max available, which is 100 with loose constraints
    expect(c1.size.width).toBe(100);
  });

  test('mixed tight and loose', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const tight = new GreedyBox();
    const loose = new FixedSizeBox(20, 10);

    addChild(flex, tight, 1, 'tight');
    addChild(flex, loose, 1, 'loose');

    flex.layout(BoxConstraints.tight(new Size(100, 20)));

    // Both get 50 allocated (1:1 ratio)
    // Tight greedy: takes 50
    // Loose fixed: wants 20, max=50 -> takes 20
    expect(tight.size.width).toBe(50);
    expect(loose.size.width).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// Nested flex
// ---------------------------------------------------------------------------

describe('RenderFlex nested', () => {
  test('flex inside flex', () => {
    // Outer: horizontal, 100x20
    // Inner: vertical flex, taking all space via flex=1
    const outer = new RenderFlex({ direction: 'horizontal' });
    const inner = new RenderFlex({ direction: 'vertical' });

    // Inner has two children
    const c1 = new GreedyBox();
    const c2 = new GreedyBox();
    addChild(inner, c1, 1);
    addChild(inner, c2, 1);

    addChild(outer, inner, 1);

    outer.layout(BoxConstraints.tight(new Size(100, 20)));

    // Inner gets all 100 width, 20 height
    expect(inner.size.width).toBe(100);
    expect(inner.size.height).toBe(20);

    // Each child of inner gets 10 height (20/2)
    expect(c1.size.height).toBe(10);
    expect(c2.size.height).toBe(10);
  });

  test('horizontal inside vertical', () => {
    const outer = new RenderFlex({ direction: 'vertical' });
    const row = new RenderFlex({ direction: 'horizontal' });

    const c1 = new GreedyBox();
    const c2 = new GreedyBox();
    addChild(row, c1, 1);
    addChild(row, c2, 2);

    addChild(outer, row, 1);

    outer.layout(BoxConstraints.tight(new Size(60, 30)));

    expect(row.size.width).toBe(60);
    expect(row.size.height).toBe(30);

    // c1: 60/3 = 20, c2: 60*2/3 = 40
    expect(c1.size.width).toBe(20);
    expect(c2.size.width).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// Property setters trigger markNeedsLayout
// ---------------------------------------------------------------------------

describe('RenderFlex property changes', () => {
  test('changing direction triggers re-layout', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new GreedyBox();
    addChild(flex, c1, 1);

    flex.layout(BoxConstraints.tight(new Size(80, 40)));
    expect(c1.size.width).toBe(80);
    expect(c1.size.height).toBe(40);

    flex.direction = 'vertical';
    // Now needs re-layout
    flex.layout(BoxConstraints.tight(new Size(80, 40)));
    // Direction changed to vertical: main axis is now height
    expect(c1.size.height).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// Intrinsic size helpers
// ---------------------------------------------------------------------------

/**
 * A RenderBox with known intrinsic sizes for testing.
 */
class IntrinsicSizeBox extends RenderBox {
  private _minW: number;
  private _maxW: number;
  private _minH: number;
  private _maxH: number;

  constructor(minW: number, maxW: number, minH: number, maxH: number) {
    super();
    this._minW = minW;
    this._maxW = maxW;
    this._minH = minH;
    this._maxH = maxH;
  }

  getMinIntrinsicWidth(_height: number): number { return this._minW; }
  getMaxIntrinsicWidth(_height: number): number { return this._maxW; }
  getMinIntrinsicHeight(_width: number): number { return this._minH; }
  getMaxIntrinsicHeight(_width: number): number { return this._maxH; }

  performLayout(): void {
    this.size = this.constraints!.constrain(new Size(this._maxW, this._maxH));
  }
  paint(_context: PaintContext, _offset: Offset): void {}
}

// ---------------------------------------------------------------------------
// Intrinsic sizes — Horizontal (Row)
// ---------------------------------------------------------------------------

describe('RenderFlex intrinsic sizes (horizontal)', () => {
  test('minIntrinsicWidth = sum of children minIntrinsicWidth', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new IntrinsicSizeBox(10, 20, 5, 10);
    const c2 = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, c1);
    addChild(flex, c2);

    expect(flex.getMinIntrinsicWidth(100)).toBe(25); // 10 + 15
  });

  test('maxIntrinsicWidth = sum of children maxIntrinsicWidth', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new IntrinsicSizeBox(10, 20, 5, 10);
    const c2 = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, c1);
    addChild(flex, c2);

    expect(flex.getMaxIntrinsicWidth(100)).toBe(50); // 20 + 30
  });

  test('minIntrinsicHeight = max of children minIntrinsicHeight', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new IntrinsicSizeBox(10, 20, 5, 10);
    const c2 = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, c1);
    addChild(flex, c2);

    expect(flex.getMinIntrinsicHeight(100)).toBe(8); // max(5, 8)
  });

  test('maxIntrinsicHeight = max of children maxIntrinsicHeight', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new IntrinsicSizeBox(10, 20, 5, 10);
    const c2 = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, c1);
    addChild(flex, c2);

    expect(flex.getMaxIntrinsicHeight(100)).toBe(12); // max(10, 12)
  });

  test('flex children contribute 0 to minIntrinsicWidth', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const nonFlex = new IntrinsicSizeBox(10, 20, 5, 10);
    const flexChild = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, nonFlex);
    addChild(flex, flexChild, 1);

    // Flex child contributes 0 to min
    expect(flex.getMinIntrinsicWidth(100)).toBe(10); // only nonFlex
  });

  test('flex children contribute to maxIntrinsicWidth', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const nonFlex = new IntrinsicSizeBox(10, 20, 5, 10);
    const flexChild = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, nonFlex);
    addChild(flex, flexChild, 1);

    // All children contribute to max
    expect(flex.getMaxIntrinsicWidth(100)).toBe(50); // 20 + 30
  });

  test('empty flex returns 0 for all intrinsic sizes', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    expect(flex.getMinIntrinsicWidth(100)).toBe(0);
    expect(flex.getMaxIntrinsicWidth(100)).toBe(0);
    expect(flex.getMinIntrinsicHeight(100)).toBe(0);
    expect(flex.getMaxIntrinsicHeight(100)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Intrinsic sizes — Vertical (Column)
// ---------------------------------------------------------------------------

describe('RenderFlex intrinsic sizes (vertical)', () => {
  test('minIntrinsicWidth = max of children minIntrinsicWidth', () => {
    const flex = new RenderFlex({ direction: 'vertical' });
    const c1 = new IntrinsicSizeBox(10, 20, 5, 10);
    const c2 = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, c1);
    addChild(flex, c2);

    expect(flex.getMinIntrinsicWidth(100)).toBe(15); // max(10, 15)
  });

  test('maxIntrinsicWidth = max of children maxIntrinsicWidth', () => {
    const flex = new RenderFlex({ direction: 'vertical' });
    const c1 = new IntrinsicSizeBox(10, 20, 5, 10);
    const c2 = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, c1);
    addChild(flex, c2);

    expect(flex.getMaxIntrinsicWidth(100)).toBe(30); // max(20, 30)
  });

  test('minIntrinsicHeight = sum of children minIntrinsicHeight', () => {
    const flex = new RenderFlex({ direction: 'vertical' });
    const c1 = new IntrinsicSizeBox(10, 20, 5, 10);
    const c2 = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, c1);
    addChild(flex, c2);

    expect(flex.getMinIntrinsicHeight(100)).toBe(13); // 5 + 8
  });

  test('maxIntrinsicHeight = sum of children maxIntrinsicHeight', () => {
    const flex = new RenderFlex({ direction: 'vertical' });
    const c1 = new IntrinsicSizeBox(10, 20, 5, 10);
    const c2 = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, c1);
    addChild(flex, c2);

    expect(flex.getMaxIntrinsicHeight(100)).toBe(22); // 10 + 12
  });

  test('flex children contribute 0 to minIntrinsicHeight', () => {
    const flex = new RenderFlex({ direction: 'vertical' });
    const nonFlex = new IntrinsicSizeBox(10, 20, 5, 10);
    const flexChild = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, nonFlex);
    addChild(flex, flexChild, 1);

    // Flex child contributes 0 to min in main axis (height for vertical)
    expect(flex.getMinIntrinsicHeight(100)).toBe(5); // only nonFlex
  });

  test('flex children contribute to maxIntrinsicHeight', () => {
    const flex = new RenderFlex({ direction: 'vertical' });
    const nonFlex = new IntrinsicSizeBox(10, 20, 5, 10);
    const flexChild = new IntrinsicSizeBox(15, 30, 8, 12);
    addChild(flex, nonFlex);
    addChild(flex, flexChild, 1);

    // All children contribute to max
    expect(flex.getMaxIntrinsicHeight(100)).toBe(22); // 10 + 12
  });
});

// ---------------------------------------------------------------------------
// CrossAxisAlignment.baseline
// ---------------------------------------------------------------------------

describe('RenderFlex CrossAxisAlignment baseline', () => {
  test('baseline: children positioned at cross offset 0 (horizontal)', () => {
    const flex = new RenderFlex({
      direction: 'horizontal',
      crossAxisAlignment: 'baseline',
    });
    const c1 = new FixedSizeBox(20, 5);
    const c2 = new FixedSizeBox(20, 10);
    addChild(flex, c1);
    addChild(flex, c2);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    // Both should be at cross offset 0 (TUI simplification)
    expect(c1.offset.row).toBe(0);
    expect(c2.offset.row).toBe(0);
  });

  test('baseline: children positioned at cross offset 0 (vertical)', () => {
    const flex = new RenderFlex({
      direction: 'vertical',
      crossAxisAlignment: 'baseline',
    });
    const c1 = new FixedSizeBox(20, 5);
    const c2 = new FixedSizeBox(30, 10);
    addChild(flex, c1);
    addChild(flex, c2);

    flex.layout(BoxConstraints.tight(new Size(80, 40)));
    // Both should be at cross offset 0 (col=0 for vertical flex)
    expect(c1.offset.col).toBe(0);
    expect(c2.offset.col).toBe(0);
  });

  test('baseline type is assignable to crossAxisAlignment', () => {
    const flex = new RenderFlex();
    flex.crossAxisAlignment = 'baseline';
    expect(flex.crossAxisAlignment).toBe('baseline');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('RenderFlex edge cases', () => {
  test('all children are flex', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new GreedyBox();
    const c2 = new GreedyBox();
    const c3 = new GreedyBox();

    addChild(flex, c1, 1);
    addChild(flex, c2, 1);
    addChild(flex, c3, 1);

    flex.layout(BoxConstraints.tight(new Size(90, 20)));

    // Each gets 30 (90/3)
    expect(c1.size.width).toBe(30);
    expect(c2.size.width).toBe(30);
    expect(c3.size.width).toBe(30);
  });

  test('flex with zero remaining space', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const fixed = new FixedSizeBox(100, 10);
    const flexible = new GreedyBox();

    addChild(flex, fixed);
    addChild(flex, flexible, 1);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));

    // Fixed takes all 100, flex gets 0
    expect(fixed.size.width).toBe(100);
    expect(flexible.size.width).toBe(0);
  });

  test('single flex child takes all space', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const c1 = new GreedyBox();
    addChild(flex, c1, 1);

    flex.layout(BoxConstraints.tight(new Size(80, 20)));
    expect(c1.size.width).toBe(80);
    expect(c1.size.height).toBe(20);
  });

  test('paint calls children paint with correct offsets', () => {
    const flex = new RenderFlex({ direction: 'horizontal' });
    const painted: Array<{ offset: Offset }> = [];

    class TrackingBox extends RenderBox {
      performLayout(): void {
        this.size = this.constraints!.constrain(new Size(10, 10));
      }
      paint(_context: PaintContext, offset: Offset): void {
        painted.push({ offset });
      }
    }

    const c1 = new TrackingBox();
    const c2 = new TrackingBox();
    addChild(flex, c1);
    addChild(flex, c2);

    flex.layout(BoxConstraints.tight(new Size(100, 20)));
    flex.paint({} as PaintContext, new Offset(5, 3));

    // c1 at (0,0) + parent offset (5,3) = (5,3)
    // c2 at (10,0) + parent offset (5,3) = (15,3)
    expect(painted[0].offset.col).toBe(5);
    expect(painted[0].offset.row).toBe(3);
    expect(painted[1].offset.col).toBe(15);
    expect(painted[1].offset.row).toBe(3);
  });
});
