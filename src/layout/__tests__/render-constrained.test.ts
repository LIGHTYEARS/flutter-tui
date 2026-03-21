// Tests for RenderConstrainedBox
// Covers: tight constraints, loose constraints, enforce within parent, no child,
//   child sizing, infinity handling (SizedBox.expand)

import { describe, expect, test } from 'bun:test';
import { RenderConstrainedBox } from '../render-constrained';
import { BoxConstraints } from '../../core/box-constraints';
import { Offset, Size } from '../../core/types';
import { RenderBox, PaintContext } from '../../framework/render-object';

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

class GreedyBox extends RenderBox {
  performLayout(): void {
    const c = this.constraints!;
    this.size = new Size(
      Number.isFinite(c.maxWidth) ? c.maxWidth : c.minWidth,
      Number.isFinite(c.maxHeight) ? c.maxHeight : c.minHeight,
    );
  }

  paint(_context: PaintContext, _offset: Offset): void {}
}

describe('RenderConstrainedBox', () => {
  describe('additional tight constraints', () => {
    test('forces child to exact size', () => {
      const child = new FixedSizeBox(100, 50);
      const box = new RenderConstrainedBox({
        additionalConstraints: BoxConstraints.tight(new Size(30, 15)),
        child,
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // Additional tight(30,15) enforced within parent(0..80, 0..24) = tight(30,15)
      // Child constrained to 30x15
      expect(child.size.width).toBe(30);
      expect(child.size.height).toBe(15);

      // Self-size = constrain(child.size) = constrain(30,15) within tight(30,15) = 30x15
      expect(box.size.width).toBe(30);
      expect(box.size.height).toBe(15);
    });

    test('tight constraints larger than parent are clamped', () => {
      const child = new FixedSizeBox(200, 200);
      const box = new RenderConstrainedBox({
        additionalConstraints: BoxConstraints.tight(new Size(100, 50)),
        child,
      });

      box.layout(BoxConstraints.tight(new Size(40, 20)));

      // Additional tight(100,50) enforced within tight(40,20):
      // minW=clamp(100,40,40)=40, maxW=clamp(100,40,40)=40
      // minH=clamp(50,20,20)=20, maxH=clamp(50,20,20)=20
      // => tight(40,20)
      expect(child.size.width).toBe(40);
      expect(child.size.height).toBe(20);
      expect(box.size.width).toBe(40);
      expect(box.size.height).toBe(20);
    });
  });

  describe('additional loose constraints', () => {
    test('allows child to choose size within range', () => {
      const child = new FixedSizeBox(20, 10);
      const box = new RenderConstrainedBox({
        additionalConstraints: new BoxConstraints({
          minWidth: 10,
          maxWidth: 50,
          minHeight: 5,
          maxHeight: 30,
        }),
        child,
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // Enforced: minW=clamp(10,0,80)=10, maxW=clamp(50,0,80)=50
      //           minH=clamp(5,0,24)=5, maxH=clamp(30,0,24)=24
      // Child wants 20x10, constrained to (10..50, 5..24) = 20x10
      expect(child.size.width).toBe(20);
      expect(child.size.height).toBe(10);
      expect(box.size.width).toBe(20);
      expect(box.size.height).toBe(10);
    });
  });

  describe('enforce within parent constraints', () => {
    test('additional constraints are clamped to parent range', () => {
      const child = new GreedyBox();
      const box = new RenderConstrainedBox({
        additionalConstraints: new BoxConstraints({
          minWidth: 0,
          maxWidth: 200,
          minHeight: 0,
          maxHeight: 200,
        }),
        child,
      });

      box.layout(new BoxConstraints({
        minWidth: 10,
        maxWidth: 50,
        minHeight: 5,
        maxHeight: 25,
      }));

      // Enforced: minW=clamp(0,10,50)=10, maxW=clamp(200,10,50)=50
      //           minH=clamp(0,5,25)=5, maxH=clamp(200,5,25)=25
      // Greedy child takes max: 50x25
      expect(child.size.width).toBe(50);
      expect(child.size.height).toBe(25);
      expect(box.size.width).toBe(50);
      expect(box.size.height).toBe(25);
    });
  });

  describe('no child', () => {
    test('self-sizes to smallest of enforced constraints', () => {
      const box = new RenderConstrainedBox({
        additionalConstraints: new BoxConstraints({
          minWidth: 20,
          maxWidth: 60,
          minHeight: 10,
          maxHeight: 40,
        }),
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // Enforced: minW=clamp(20,0,80)=20, maxW=clamp(60,0,80)=60
      //           minH=clamp(10,0,24)=10, maxH=clamp(40,0,24)=24
      // No child: constrain(smallest) = constrain(20,10) within enforced = 20x10
      expect(box.size.width).toBe(20);
      expect(box.size.height).toBe(10);
    });

    test('no child with tight constraints = exact size', () => {
      const box = new RenderConstrainedBox({
        additionalConstraints: BoxConstraints.tight(new Size(30, 15)),
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      expect(box.size.width).toBe(30);
      expect(box.size.height).toBe(15);
    });
  });

  describe('child sizes correctly', () => {
    test('child gets enforced constraints passed through', () => {
      const child = new FixedSizeBox(5, 3);
      const box = new RenderConstrainedBox({
        additionalConstraints: new BoxConstraints({
          minWidth: 10,
          maxWidth: 40,
          minHeight: 8,
          maxHeight: 20,
        }),
        child,
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // Child wants 5x3 but min is 10x8
      expect(child.size.width).toBe(10);
      expect(child.size.height).toBe(8);

      // Self-size = constrain(child.size) within enforced
      expect(box.size.width).toBe(10);
      expect(box.size.height).toBe(8);
    });
  });

  describe('infinity dimension handling (SizedBox.expand)', () => {
    test('expand behavior: infinite additional constraints fill parent', () => {
      const child = new GreedyBox();
      // SizedBox.expand uses tight(Infinity, Infinity)
      const box = new RenderConstrainedBox({
        additionalConstraints: BoxConstraints.tight(new Size(Infinity, Infinity)),
        child,
      });

      box.layout(BoxConstraints.tight(new Size(80, 24)));

      // Enforced: minW=clamp(Inf,80,80)=80, maxW=clamp(Inf,80,80)=80
      //           minH=clamp(Inf,24,24)=24, maxH=clamp(Inf,24,24)=24
      // => tight(80,24)
      expect(child.size.width).toBe(80);
      expect(child.size.height).toBe(24);
      expect(box.size.width).toBe(80);
      expect(box.size.height).toBe(24);
    });

    test('width-only tight constraint', () => {
      const child = new FixedSizeBox(10, 5);
      // SizedBox(width: 30) uses tightFor(width: 30)
      const box = new RenderConstrainedBox({
        additionalConstraints: BoxConstraints.tightFor({ width: 30 }),
        child,
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // Enforced: minW=clamp(30,0,80)=30, maxW=clamp(30,0,80)=30
      //           minH=clamp(0,0,24)=0, maxH=clamp(Inf,0,24)=24
      // Child wants 10x5, constrained to (30..30, 0..24) = 30x5
      expect(child.size.width).toBe(30);
      expect(child.size.height).toBe(5);
      expect(box.size.width).toBe(30);
      expect(box.size.height).toBe(5);
    });

    test('height-only tight constraint', () => {
      const child = new FixedSizeBox(10, 5);
      const box = new RenderConstrainedBox({
        additionalConstraints: BoxConstraints.tightFor({ height: 20 }),
        child,
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      // Enforced: minW=0, maxW=80, minH=clamp(20,0,24)=20, maxH=clamp(20,0,24)=20
      // Child wants 10x5, constrained to (0..80, 20..20) = 10x20
      expect(child.size.width).toBe(10);
      expect(child.size.height).toBe(20);
      expect(box.size.width).toBe(10);
      expect(box.size.height).toBe(20);
    });
  });

  describe('property setter', () => {
    test('updating additionalConstraints triggers relayout', () => {
      const child = new FixedSizeBox(10, 5);
      const box = new RenderConstrainedBox({
        additionalConstraints: BoxConstraints.tight(new Size(20, 10)),
        child,
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));
      expect(box.size.width).toBe(20);

      box.additionalConstraints = BoxConstraints.tight(new Size(40, 15));
      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));
      expect(box.size.width).toBe(40);
      expect(box.size.height).toBe(15);
    });
  });

  describe('paint', () => {
    test('paints child with accumulated offset', () => {
      const paintCalls: Offset[] = [];

      class TrackingBox extends RenderBox {
        performLayout(): void {
          this.size = this.constraints!.constrain(new Size(10, 5));
        }
        paint(_context: PaintContext, offset: Offset): void {
          paintCalls.push(offset);
        }
      }

      const child = new TrackingBox();
      const box = new RenderConstrainedBox({
        additionalConstraints: BoxConstraints.tight(new Size(30, 15)),
        child,
      });

      box.layout(new BoxConstraints({ maxWidth: 80, maxHeight: 24 }));

      const mockContext = {} as PaintContext;
      box.paint(mockContext, new Offset(5, 3));

      expect(paintCalls.length).toBe(1);
      // Child offset is (0,0) since constrained box doesn't offset child
      expect(paintCalls[0]!.col).toBe(5);
      expect(paintCalls[0]!.row).toBe(3);
    });
  });
});
