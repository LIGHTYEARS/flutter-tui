// Tests for RenderPadding
// Covers: uniform padding, asymmetric padding, no-child, child offset, constraint deflation, zero padding

import { describe, expect, test } from 'bun:test';
import { RenderPadding } from '../render-padded';
import { EdgeInsets } from '../edge-insets';
import { BoxConstraints } from '../../core/box-constraints';
import { Offset, Size } from '../../core/types';
import { RenderBox, PaintContext } from '../../framework/render-object';

// --- Test helper: a simple child that sizes itself to constraints ---

class TestRenderBox extends RenderBox {
  performLayout(): void {
    const c = this.constraints!;
    // Size to max available (like a greedy child)
    this.size = new Size(
      Number.isFinite(c.maxWidth) ? c.maxWidth : c.minWidth,
      Number.isFinite(c.maxHeight) ? c.maxHeight : c.minHeight,
    );
  }

  paint(_context: PaintContext, _offset: Offset): void {
    // no-op for testing
  }
}

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

describe('RenderPadding', () => {
  describe('layout with uniform padding', () => {
    test('deflates constraints and self-sizes correctly', () => {
      const child = new FixedSizeBox(20, 10);
      const padding = new RenderPadding({
        padding: EdgeInsets.all(2),
        child,
      });

      padding.layout(BoxConstraints.tight(new Size(80, 24)));

      // Child should be laid out with constraints deflated by 4 (2 left + 2 right, 2 top + 2 bottom)
      expect(child.constraints!.minWidth).toBe(76);
      expect(child.constraints!.maxWidth).toBe(76);
      expect(child.constraints!.minHeight).toBe(20);
      expect(child.constraints!.maxHeight).toBe(20);

      // Child sizes to constrained value (76x20 since tight)
      // Actually the FixedSizeBox tries 20x10 then constrain to 76x20
      // Wait: tight(80,24) deflated by 4,4 = tight(76,20)
      // FixedSizeBox wants 20x10, constrained to tight(76,20) = 76x20
      expect(child.size.width).toBe(76);
      expect(child.size.height).toBe(20);

      // Padding self-size = child + padding, constrained to parent
      // 76+4=80, 20+4=24 => constrained to (80,24) = (80,24)
      expect(padding.size.width).toBe(80);
      expect(padding.size.height).toBe(24);
    });

    test('loose constraints with small child', () => {
      const child = new FixedSizeBox(10, 5);
      const padding = new RenderPadding({
        padding: EdgeInsets.all(3),
        child,
      });

      padding.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // Deflated: min=0, max=74x18
      // Child wants 10x5, constrained to loose(74,18) = 10x5
      expect(child.size.width).toBe(10);
      expect(child.size.height).toBe(5);

      // Self-size = 10+6=16, 5+6=11, constrained to loose(80,24) = 16x11
      expect(padding.size.width).toBe(16);
      expect(padding.size.height).toBe(11);
    });
  });

  describe('layout with asymmetric padding', () => {
    test('different left/right/top/bottom values', () => {
      const child = new FixedSizeBox(10, 5);
      const padding = new RenderPadding({
        padding: new EdgeInsets(1, 2, 3, 4), // left=1, top=2, right=3, bottom=4
        child,
      });

      padding.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // Horizontal padding: 1+3=4, Vertical: 2+4=6
      // Deflated: max 80-4=76, max 24-6=18
      // Child wants 10x5 => 10x5
      expect(child.size.width).toBe(10);
      expect(child.size.height).toBe(5);

      // Self-size: 10+4=14, 5+6=11
      expect(padding.size.width).toBe(14);
      expect(padding.size.height).toBe(11);
    });
  });

  describe('no child case', () => {
    test('self-sizes to padding amount, constrained', () => {
      const padding = new RenderPadding({
        padding: EdgeInsets.all(5),
      });

      padding.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // No child: size = constrain(h=10, v=10)
      expect(padding.size.width).toBe(10);
      expect(padding.size.height).toBe(10);
    });

    test('padding larger than constraints clamps to max', () => {
      const padding = new RenderPadding({
        padding: EdgeInsets.all(50),
      });

      padding.layout(BoxConstraints.tight(new Size(20, 10)));

      // h=100, v=100, constrained to tight(20,10) = 20x10
      expect(padding.size.width).toBe(20);
      expect(padding.size.height).toBe(10);
    });
  });

  describe('child offset', () => {
    test('child offset is (padding.left, padding.top)', () => {
      const child = new FixedSizeBox(10, 5);
      const padding = new RenderPadding({
        padding: EdgeInsets.only({ left: 3, top: 7, right: 1, bottom: 2 }),
        child,
      });

      padding.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      expect(child.offset.col).toBe(3);
      expect(child.offset.row).toBe(7);
    });

    test('uniform padding sets child offset to (pad, pad)', () => {
      const child = new FixedSizeBox(10, 5);
      const padding = new RenderPadding({
        padding: EdgeInsets.all(4),
        child,
      });

      padding.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      expect(child.offset.col).toBe(4);
      expect(child.offset.row).toBe(4);
    });
  });

  describe('constraint deflation', () => {
    test('deflates min constraints correctly', () => {
      const child = new TestRenderBox();
      const padding = new RenderPadding({
        padding: EdgeInsets.all(5),
        child,
      });

      padding.layout(new BoxConstraints({
        minWidth: 40,
        maxWidth: 80,
        minHeight: 20,
        maxHeight: 24,
      }));

      // Deflated: min 40-10=30, max 80-10=70, min 20-10=10, max 24-10=14
      expect(child.constraints!.minWidth).toBe(30);
      expect(child.constraints!.maxWidth).toBe(70);
      expect(child.constraints!.minHeight).toBe(10);
      expect(child.constraints!.maxHeight).toBe(14);
    });

    test('deflation floors at zero', () => {
      const child = new TestRenderBox();
      const padding = new RenderPadding({
        padding: EdgeInsets.all(50),
        child,
      });

      padding.layout(new BoxConstraints({
        minWidth: 10,
        maxWidth: 20,
        minHeight: 5,
        maxHeight: 10,
      }));

      // Deflated: min max(0, 10-100)=0, max max(0, 20-100)=0, etc.
      expect(child.constraints!.minWidth).toBe(0);
      expect(child.constraints!.maxWidth).toBe(0);
      expect(child.constraints!.minHeight).toBe(0);
      expect(child.constraints!.maxHeight).toBe(0);
    });
  });

  describe('zero padding pass-through', () => {
    test('zero padding is equivalent to no padding', () => {
      const child = new FixedSizeBox(30, 15);
      const padding = new RenderPadding({
        padding: EdgeInsets.zero,
        child,
      });

      padding.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // Child gets full constraints
      expect(child.constraints!.maxWidth).toBe(80);
      expect(child.constraints!.maxHeight).toBe(24);

      // Same size as child
      expect(padding.size.width).toBe(30);
      expect(padding.size.height).toBe(15);

      // Child offset at origin
      expect(child.offset.col).toBe(0);
      expect(child.offset.row).toBe(0);
    });
  });

  describe('padding property setter', () => {
    test('updating padding triggers relayout', () => {
      const child = new FixedSizeBox(10, 5);
      const padding = new RenderPadding({
        padding: EdgeInsets.all(2),
        child,
      });

      padding.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));
      expect(padding.size.width).toBe(14); // 10 + 4

      padding.padding = EdgeInsets.all(5);
      padding.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));
      expect(padding.size.width).toBe(20); // 10 + 10
    });
  });

  describe('paint', () => {
    test('paints child with accumulated offset', () => {
      const paintCalls: Array<{ context: PaintContext; offset: Offset }> = [];

      class TrackingBox extends RenderBox {
        performLayout(): void {
          this.size = this.constraints!.constrain(new Size(10, 5));
        }

        paint(context: PaintContext, offset: Offset): void {
          paintCalls.push({ context, offset });
        }
      }

      const child = new TrackingBox();
      const padding = new RenderPadding({
        padding: EdgeInsets.only({ left: 3, top: 2 }),
        child,
      });

      padding.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      const mockContext = {} as PaintContext;
      const rootOffset = new Offset(10, 5);
      padding.paint(mockContext, rootOffset);

      expect(paintCalls.length).toBe(1);
      // Child offset is (3, 2), root is (10, 5) => accumulated (13, 7)
      expect(paintCalls[0]!.offset.col).toBe(13);
      expect(paintCalls[0]!.offset.row).toBe(7);
    });
  });
});
