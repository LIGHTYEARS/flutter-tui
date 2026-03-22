// Tests for IntrinsicHeight widget and RenderIntrinsicHeight
// Verifies intrinsic height sizing, layout pass-through, and edge cases

import { describe, test, expect } from 'bun:test';
import { IntrinsicHeight, RenderIntrinsicHeight } from '../intrinsic-height';
import { RenderBox, type PaintContext, RenderObject } from '../../framework/render-object';
import { Offset, Size } from '../../core/types';
import { BoxConstraints } from '../../core/box-constraints';
import { StatelessWidget, type BuildContext, Widget } from '../../framework/widget';

// A minimal child widget for IntrinsicHeight
class _DummyWidget extends StatelessWidget {
  build(_context: BuildContext): Widget {
    return this;
  }
}

// A mock RenderBox with configurable intrinsic height
class MockRenderBox extends RenderBox {
  paintCalls: Array<{ context: any; offset: Offset }> = [];
  layoutSize: Size = new Size(20, 10);
  intrinsicHeight: number = 15;
  intrinsicWidth: number = 20;

  performLayout(): void {
    const constraints = this.constraints!;
    this.size = constraints.constrain(this.layoutSize);
  }

  getMaxIntrinsicHeight(_width: number): number {
    return this.intrinsicHeight;
  }

  getMinIntrinsicHeight(_width: number): number {
    return this.intrinsicHeight;
  }

  getMaxIntrinsicWidth(_height: number): number {
    return this.intrinsicWidth;
  }

  getMinIntrinsicWidth(_height: number): number {
    return this.intrinsicWidth;
  }

  paint(context: PaintContext, offset: Offset): void {
    this.paintCalls.push({ context, offset });
  }
}

describe('IntrinsicHeight', () => {
  test('creates with child', () => {
    const child = new _DummyWidget();
    const ih = new IntrinsicHeight({ child });
    expect(ih.child).toBe(child);
  });

  test('is a SingleChildRenderObjectWidget', () => {
    const child = new _DummyWidget();
    const ih = new IntrinsicHeight({ child });
    expect(ih.createRenderObject).toBeDefined();
  });

  test('createRenderObject returns RenderIntrinsicHeight', () => {
    const child = new _DummyWidget();
    const ih = new IntrinsicHeight({ child });
    const renderObject = ih.createRenderObject();
    expect(renderObject).toBeInstanceOf(RenderIntrinsicHeight);
  });
});

describe('RenderIntrinsicHeight', () => {
  test('creates with no child by default', () => {
    const render = new RenderIntrinsicHeight();
    expect(render.child).toBeNull();
  });

  test('can set and get child', () => {
    const render = new RenderIntrinsicHeight();
    const child = new MockRenderBox();
    render.child = child;
    expect(render.child).toBe(child);
  });

  test('can clear child by setting null', () => {
    const render = new RenderIntrinsicHeight();
    const child = new MockRenderBox();
    render.child = child;
    render.child = null;
    expect(render.child).toBeNull();
  });

  test('layout with no child sizes to constrained zero', () => {
    const render = new RenderIntrinsicHeight();

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 40,
      minHeight: 0,
      maxHeight: 20,
    });
    render.layout(constraints);

    expect(render.size.width).toBe(0);
    expect(render.size.height).toBe(0);
  });

  test('layout with no child respects min constraints', () => {
    const render = new RenderIntrinsicHeight();

    const constraints = new BoxConstraints({
      minWidth: 5,
      maxWidth: 40,
      minHeight: 3,
      maxHeight: 20,
    });
    render.layout(constraints);

    expect(render.size.width).toBe(5);
    expect(render.size.height).toBe(3);
  });

  test('layout passes tight height constraints through', () => {
    const render = new RenderIntrinsicHeight();
    const child = new MockRenderBox();
    child.layoutSize = new Size(20, 10);
    child.intrinsicHeight = 15; // should be ignored with tight constraints
    render.child = child;

    // Tight height = 12
    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 40,
      minHeight: 12,
      maxHeight: 12,
    });
    render.layout(constraints);

    // Should use the tight height, not the intrinsic height
    expect(render.size.height).toBe(12);
  });

  test('layout uses intrinsic height when constraints are not tight', () => {
    const render = new RenderIntrinsicHeight();
    const child = new MockRenderBox();
    child.layoutSize = new Size(20, 15); // will be constrained
    child.intrinsicHeight = 15;
    render.child = child;

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 40,
      minHeight: 0,
      maxHeight: 30,
    });
    render.layout(constraints);

    // Should use intrinsic height = 15
    expect(render.size.height).toBe(15);
  });

  test('layout clamps intrinsic height to max constraint', () => {
    const render = new RenderIntrinsicHeight();
    const child = new MockRenderBox();
    child.layoutSize = new Size(20, 10);
    child.intrinsicHeight = 50; // larger than max
    render.child = child;

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 40,
      minHeight: 0,
      maxHeight: 20,
    });
    render.layout(constraints);

    // Should clamp to maxHeight = 20
    expect(render.size.height).toBe(20);
  });

  test('layout respects min height constraint', () => {
    const render = new RenderIntrinsicHeight();
    const child = new MockRenderBox();
    child.layoutSize = new Size(20, 5);
    child.intrinsicHeight = 3; // smaller than min
    render.child = child;

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 40,
      minHeight: 10,
      maxHeight: 30,
    });
    render.layout(constraints);

    // Should clamp to minHeight = 10
    expect(render.size.height).toBe(10);
  });

  test('layout gives child tight height at intrinsic value', () => {
    const render = new RenderIntrinsicHeight();
    const child = new MockRenderBox();
    child.intrinsicHeight = 15;
    child.layoutSize = new Size(20, 15);
    render.child = child;

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 40,
      minHeight: 0,
      maxHeight: 30,
    });
    render.layout(constraints);

    // Child should have received tight height constraints
    const childConstraints = child.constraints!;
    expect(childConstraints.minHeight).toBe(15);
    expect(childConstraints.maxHeight).toBe(15);
    // Width should pass through
    expect(childConstraints.minWidth).toBe(0);
    expect(childConstraints.maxWidth).toBe(40);
  });

  test('intrinsic dimensions delegate to child', () => {
    const render = new RenderIntrinsicHeight();
    const child = new MockRenderBox();
    child.intrinsicHeight = 25;
    child.intrinsicWidth = 30;
    render.child = child;

    expect(render.getMinIntrinsicHeight(100)).toBe(25);
    expect(render.getMaxIntrinsicHeight(100)).toBe(25);
    expect(render.getMinIntrinsicWidth(100)).toBe(30);
    expect(render.getMaxIntrinsicWidth(100)).toBe(30);
  });

  test('intrinsic dimensions return 0 without child', () => {
    const render = new RenderIntrinsicHeight();

    expect(render.getMinIntrinsicHeight(100)).toBe(0);
    expect(render.getMaxIntrinsicHeight(100)).toBe(0);
    expect(render.getMinIntrinsicWidth(100)).toBe(0);
    expect(render.getMaxIntrinsicWidth(100)).toBe(0);
  });

  test('paint delegates to child', () => {
    const render = new RenderIntrinsicHeight();
    const child = new MockRenderBox();
    render.child = child;

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 40,
      minHeight: 0,
      maxHeight: 30,
    });
    render.layout(constraints);

    const ctx = {} as PaintContext;
    const offset = new Offset(5, 3);
    render.paint(ctx, offset);

    expect(child.paintCalls.length).toBe(1);
    expect(child.paintCalls[0].context).toBe(ctx);
  });

  test('paint does nothing with no child', () => {
    const render = new RenderIntrinsicHeight();

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 40,
      minHeight: 0,
      maxHeight: 30,
    });
    render.layout(constraints);

    // Should not throw
    render.paint({} as PaintContext, Offset.zero);
  });

  test('visitChildren visits child when present', () => {
    const render = new RenderIntrinsicHeight();
    const child = new MockRenderBox();
    render.child = child;

    const visited: RenderBox[] = [];
    render.visitChildren((c) => visited.push(c as RenderBox));

    expect(visited.length).toBe(1);
    expect(visited[0]).toBe(child);
  });

  test('visitChildren does nothing when no child', () => {
    const render = new RenderIntrinsicHeight();

    const visited: RenderBox[] = [];
    render.visitChildren((c) => visited.push(c as RenderBox));

    expect(visited.length).toBe(0);
  });

  test('replacing child drops old and adopts new', () => {
    const render = new RenderIntrinsicHeight();
    const child1 = new MockRenderBox();
    const child2 = new MockRenderBox();

    render.child = child1;
    expect(child1.parent).toBe(render);

    render.child = child2;
    expect(child1.parent).toBeNull();
    expect(child2.parent).toBe(render);
  });
});
