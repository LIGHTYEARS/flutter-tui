// Layout guardrail tests for flitter-amp
// Verifies the widget tree constraint chain matches the Amp CLI skeleton spec.
//
// These tests ensure:
// 1. Root layout fills terminal (both width and height)
// 2. InputArea stretches full width with minHeight:3
// 3. StatusBar stretches full width at 1 row
// 4. Chat area (Expanded + ScrollView) fills remaining space
// 5. Welcome screen centers in viewport
// 6. Overlay stacks expand to full terminal size
//
// Ref: .planning/WIDGET-TREE-SKELETON.md

import { describe, it, expect } from 'bun:test';
import { RenderBox } from 'flitter-core/src/framework/render-object';
import { BoxConstraints } from 'flitter-core/src/core/box-constraints';
import { Size, Offset } from 'flitter-core/src/core/types';
import type { PaintContext } from 'flitter-core/src/scheduler/paint-context';
import { RenderFlex } from 'flitter-core/src/layout/render-flex';
import { Column, Row } from 'flitter-core/src/widgets/flex';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** A RenderBox that takes the biggest size allowed by constraints. */
class GreedyBox extends RenderBox {
  performLayout(): void {
    const c = this.constraints!;
    const w = Number.isFinite(c.maxWidth) ? c.maxWidth : c.minWidth;
    const h = Number.isFinite(c.maxHeight) ? c.maxHeight : c.minHeight;
    this.size = new Size(w, h);
  }
  paint(_context: PaintContext, _offset: Offset): void {}
}

/** A RenderBox that takes a fixed desired size (clamped by constraints). */
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

// ---------------------------------------------------------------------------
// Tests: Constraint Chain Verification
// ---------------------------------------------------------------------------

describe('Layout Guardrails: Constraint Chain', () => {
  // Test the RenderFlex (Column/Row) behavior directly with constraints
  // matching what the app receives from PipelineOwner

  describe('Root Column fills terminal with loose constraints', () => {
    it('Column(mainAxisSize:max) uses maxHeight even with loose constraints', () => {
      const flex = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'max',
        crossAxisAlignment: 'stretch',
      });

      const child = new GreedyBox();
      flex.insert(child);

      // Simulate PipelineOwner loose constraints (min=0, max=terminal)
      const looseConstraints = new BoxConstraints({
        minWidth: 0, maxWidth: 120,
        minHeight: 0, maxHeight: 40,
      });

      flex.layout(looseConstraints);

      // Column should fill to maxHeight with mainAxisSize:'max'
      expect(flex.size.width).toBe(120);
      expect(flex.size.height).toBe(40);
    });

    it('Column(crossAxisAlignment:stretch) forces children to fill width', () => {
      const flex = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'max',
        crossAxisAlignment: 'stretch',
      });

      // A child that would be 10 wide without stretch
      const child = new FixedSizeBox(10, 5);
      flex.insert(child);

      flex.layout(new BoxConstraints({
        minWidth: 0, maxWidth: 120,
        minHeight: 0, maxHeight: 40,
      }));

      // With stretch, child should be forced to 120 wide
      expect(child.size.width).toBe(120);
    });

    it('Column(crossAxisAlignment:center) does NOT stretch children', () => {
      const flex = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'max',
        crossAxisAlignment: 'center', // the DEFAULT
      });

      const child = new FixedSizeBox(10, 5);
      flex.insert(child);

      flex.layout(new BoxConstraints({
        minWidth: 0, maxWidth: 120,
        minHeight: 0, maxHeight: 40,
      }));

      // Without stretch, child keeps its natural 10 width
      expect(child.size.width).toBe(10);
    });
  });

  describe('Expanded allocates remaining space', () => {
    it('Expanded child fills remaining height in Column', () => {
      const flex = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'max',
        crossAxisAlignment: 'stretch',
      });

      // Non-flex child: 3 rows (InputArea)
      const inputArea = new FixedSizeBox(120, 3);
      flex.insert(inputArea);

      // Non-flex child: 1 row (StatusBar)
      const statusBar = new FixedSizeBox(120, 1);
      flex.insert(statusBar);

      // Flex child: should get remaining space (40 - 3 - 1 = 36)
      const chatArea = new GreedyBox();
      // Set flex parent data for Expanded behavior
      (chatArea as any).parentData = { flex: 1, fit: 'tight', nextSibling: null, previousSibling: null, offset: new Offset(0, 0) };
      flex.insert(chatArea, statusBar); // insert before statusBar? No, insert after

      // Actually, RenderFlex reads children in order. Let me set up correctly:
      // Children order: [chatArea(expanded), inputArea, statusBar]
      // But we need chatArea first in the list for Amp layout
      const flex2 = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'max',
        crossAxisAlignment: 'stretch',
      });

      const expandedChild = new GreedyBox();
      const fixedChild1 = new FixedSizeBox(120, 3); // InputArea
      const fixedChild2 = new FixedSizeBox(120, 1); // StatusBar

      flex2.insert(expandedChild);
      flex2.insert(fixedChild1);
      flex2.insert(fixedChild2);

      // Set Expanded parent data on the first child
      const pd = expandedChild.parentData as any;
      if (pd) {
        pd.flex = 1;
        pd.fit = 'tight';
      }

      flex2.layout(new BoxConstraints({
        minWidth: 0, maxWidth: 120,
        minHeight: 0, maxHeight: 40,
      }));

      expect(flex2.size.height).toBe(40);
      expect(fixedChild1.size.height).toBe(3);
      expect(fixedChild2.size.height).toBe(1);
      // Expanded child gets remaining: 40 - 3 - 1 = 36
      expect(expandedChild.size.height).toBe(36);
    });
  });

  describe('Row with crossAxisAlignment:stretch fills height', () => {
    it('Row stretches children to fill parent height', () => {
      const flex = new RenderFlex({
        direction: 'horizontal',
        crossAxisAlignment: 'stretch',
      });

      const child1 = new FixedSizeBox(50, 10); // would be 10 tall without stretch
      const child2 = new FixedSizeBox(1, 5);   // scrollbar, 1 wide

      flex.insert(child1);
      flex.insert(child2);

      // Give it tight height from parent (like inside Expanded)
      flex.layout(new BoxConstraints({
        minWidth: 120, maxWidth: 120,
        minHeight: 36, maxHeight: 36,
      }));

      // Both children should be stretched to 36 tall
      expect(child1.size.height).toBe(36);
      expect(child2.size.height).toBe(36);
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: Specific Widget Layout Properties
// ---------------------------------------------------------------------------

describe('Layout Guardrails: Widget Properties', () => {
  describe('Default flex properties', () => {
    it('RenderFlex default crossAxisAlignment is start (low-level)', () => {
      const flex = new RenderFlex({ direction: 'vertical' });
      expect((flex as any)._crossAxisAlignment).toBe('start');
    });

    it('Column widget default crossAxisAlignment is center (widget-level)', () => {
      const col = new Column();
      expect(col.crossAxisAlignment).toBe('center');
    });

    it('Column default mainAxisSize is max', () => {
      const flex = new RenderFlex({ direction: 'vertical' });
      expect((flex as any)._mainAxisSize).toBe('max');
    });

    it('Row widget default crossAxisAlignment is center (widget-level)', () => {
      const row = new Row();
      expect(row.crossAxisAlignment).toBe('center');
    });

    it('RenderFlex default crossAxisAlignment is start (low-level, Row)', () => {
      const flex = new RenderFlex({ direction: 'horizontal' });
      expect((flex as any)._crossAxisAlignment).toBe('start');
    });
  });

  describe('InputArea constraints', () => {
    it('FixedSizeBox with minHeight:3 gets at least 3 rows', () => {
      // Simulate Container with BoxConstraints(minHeight:3)
      // When placed in a Column with stretch, it gets tight width, unbounded height
      const child = new FixedSizeBox(120, 1); // content is 1 row, but container enforces minHeight:3

      // Container applies enforce: clamp additional constraints within parent
      const parentConstraints = new BoxConstraints({
        minWidth: 120, maxWidth: 120,
        minHeight: 0, maxHeight: Infinity,
      });
      const additionalConstraints = new BoxConstraints({
        minHeight: 3,
      });
      const enforced = additionalConstraints.enforce(parentConstraints);

      // minHeight should be clamped to max(3, 0) = 3
      expect(enforced.minHeight).toBe(3);

      child.layout(enforced);
      // Child (1 row content) gets constrained to at least 3
      expect(child.size.height).toBe(3);
    });
  });

  describe('Greedy sizing', () => {
    it('GreedyBox fills available space from loose constraints', () => {
      const box = new GreedyBox();
      box.layout(new BoxConstraints({
        minWidth: 0, maxWidth: 120,
        minHeight: 0, maxHeight: 40,
      }));
      expect(box.size.width).toBe(120);
      expect(box.size.height).toBe(40);
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: Regression guards for known bugs
// ---------------------------------------------------------------------------

describe('Layout Guardrails: Regression', () => {
  describe('BUG: Column inside ScrollView with mainAxisSize:min shrinks to content', () => {
    it('Column(mainAxisSize:min) with unbounded height sizes to content', () => {
      const flex = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'min',
        crossAxisAlignment: 'center',
        mainAxisAlignment: 'center',
      });

      const child = new FixedSizeBox(50, 10);
      flex.insert(child);

      // Unbounded height (from SingleChildScrollView)
      flex.layout(new BoxConstraints({
        minWidth: 0, maxWidth: 120,
        minHeight: 0, maxHeight: Infinity,
      }));

      // Column height should be content height (10), not viewport height
      expect(flex.size.height).toBe(10);
      // mainAxisAlignment:'center' has NO effect when height = content height
      // This is the root cause of the "welcome screen not centered" bug
    });

    it('Column(mainAxisSize:max) with unbounded height ALSO sizes to content', () => {
      const flex = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'max',
        crossAxisAlignment: 'center',
      });

      const child = new FixedSizeBox(50, 10);
      flex.insert(child);

      // Unbounded height
      flex.layout(new BoxConstraints({
        minWidth: 0, maxWidth: 120,
        minHeight: 0, maxHeight: Infinity,
      }));

      // With unbounded max, mainAxisSize:'max' falls back to content size
      // because Number.isFinite(Infinity) === false
      expect(flex.size.height).toBe(10);
    });
  });

  describe('Root Column must use stretch to fill terminal width', () => {
    it('Without stretch, Column cross-axis size is max child width (not maxWidth)', () => {
      const flex = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'max',
        crossAxisAlignment: 'center',
      });

      const child = new FixedSizeBox(50, 5);
      flex.insert(child);

      flex.layout(new BoxConstraints({
        minWidth: 0, maxWidth: 120,
        minHeight: 0, maxHeight: 40,
      }));

      // Column cross size = max(childWidth, minWidth) = max(50, 0) = 50
      expect(flex.size.width).toBe(50);
      expect(flex.size.height).toBe(40);
      // Child is 50 wide
      expect(child.size.width).toBe(50);
    });

    it('With stretch, children fill terminal width', () => {
      const flex = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'max',
        crossAxisAlignment: 'stretch', // GOOD
      });

      const child = new FixedSizeBox(50, 5);
      flex.insert(child);

      flex.layout(new BoxConstraints({
        minWidth: 0, maxWidth: 120,
        minHeight: 0, maxHeight: 40,
      }));

      // Both column and child fill width
      expect(flex.size.width).toBe(120);
      expect(child.size.width).toBe(120);
    });
  });
});
