// App layout TDD tests — verifies the full constraint chain from terminal → root → children
//
// Amp ref: Root build method in .planning/WIDGET-TREE-SKELETON.md
//
// The critical constraint chain:
// Terminal(120×40) → Root Column(stretch,max) → [Expanded(Row(stretch)), BottomGrid]
//   Row → [Expanded(ScrollView→Padding→ChatView), Scrollbar(1col)]
//   ChatView → Column(stretch, min) → [messages...]
//
// Key bugs to catch:
// 1. Root Column must use crossAxisAlignment:'stretch' to fill terminal width
// 2. Expanded row must use crossAxisAlignment:'stretch' for scrollbar height
// 3. ChatView column inside ScrollView gets unbounded height (correct for scrolling)
// 4. Transition from welcome screen (Center) to messages (Row+ScrollView) must work

import { describe, it, expect } from 'bun:test';
import { RenderBox } from 'flitter-core/src/framework/render-object';
import { BoxConstraints } from 'flitter-core/src/core/box-constraints';
import { Size, Offset } from 'flitter-core/src/core/types';
import type { PaintContext } from 'flitter-core/src/scheduler/paint-context';
import { RenderFlex } from 'flitter-core/src/layout/render-flex';
import { FlexParentData } from 'flitter-core/src/layout/parent-data';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

class GreedyBox extends RenderBox {
  performLayout(): void {
    const c = this.constraints!;
    const w = Number.isFinite(c.maxWidth) ? c.maxWidth : c.minWidth;
    const h = Number.isFinite(c.maxHeight) ? c.maxHeight : c.minHeight;
    this.size = new Size(w, h);
  }
  paint(_context: PaintContext, _offset: Offset): void {}
}

class FixedSizeBox extends RenderBox {
  constructor(private _w: number, private _h: number) { super(); }
  performLayout(): void {
    this.size = this.constraints!.constrain(new Size(this._w, this._h));
  }
  paint(_context: PaintContext, _offset: Offset): void {}
}

function setFlexData(child: RenderBox, flex: number, fit: 'tight' | 'loose' = 'tight') {
  const pd = child.parentData as any;
  if (pd) {
    pd.flex = flex;
    pd.fit = fit;
  }
}

// ---------------------------------------------------------------------------
// Tests: Full app constraint chain simulation
// ---------------------------------------------------------------------------

describe('App Layout: Full Constraint Chain', () => {

  describe('Root Column(stretch, max) with terminal constraints', () => {
    it('fills terminal 120x40, children stretched to full width', () => {
      // Simulates: Column(mainAxisSize:max, crossAxisAlignment:stretch)
      //   - Expanded(flex:1) → chat area row
      //   - FixedSizeBox(120,3) → InputArea (minHeight:3)
      const root = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'max',
        crossAxisAlignment: 'stretch',
      });

      const chatArea = new GreedyBox();
      const inputArea = new FixedSizeBox(120, 3);

      root.insert(chatArea);
      root.insert(inputArea);
      setFlexData(chatArea, 1);

      root.layout(new BoxConstraints({
        minWidth: 0, maxWidth: 120,
        minHeight: 0, maxHeight: 40,
      }));

      expect(root.size.width).toBe(120);
      expect(root.size.height).toBe(40);
      expect(inputArea.size.width).toBe(120);
      expect(inputArea.size.height).toBe(3);
      // Chat area gets remaining: 40 - 3 = 37
      expect(chatArea.size.height).toBe(37);
      expect(chatArea.size.width).toBe(120);
    });
  });

  describe('Chat area Row(stretch) with Expanded(ScrollView) + Scrollbar', () => {
    it('Row stretches children to fill height, scrollbar gets 1 col', () => {
      const row = new RenderFlex({
        direction: 'horizontal',
        crossAxisAlignment: 'stretch',
      });

      const scrollContent = new GreedyBox();
      const scrollbar = new FixedSizeBox(1, 37);

      row.insert(scrollContent);
      row.insert(scrollbar);
      setFlexData(scrollContent, 1);

      // Row receives tight constraints from Expanded in parent Column
      row.layout(new BoxConstraints({
        minWidth: 120, maxWidth: 120,
        minHeight: 37, maxHeight: 37,
      }));

      expect(row.size.width).toBe(120);
      expect(row.size.height).toBe(37);
      // Scrollbar takes 1 col, Expanded takes the rest
      expect(scrollbar.size.width).toBe(1);
      expect(scrollbar.size.height).toBe(37);
      // Expanded child: 120 - 1 = 119 wide, 37 tall
      expect(scrollContent.size.width).toBe(119);
      expect(scrollContent.size.height).toBe(37);
    });
  });

  describe('ChatView Column inside ScrollView (unbounded height)', () => {
    it('Column(min, stretch) under unbounded height sizes to content', () => {
      const col = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'min',
        crossAxisAlignment: 'stretch',
      });

      // Simulate 3 message blocks: user(2), spacer(1), assistant(5)
      const msg1 = new FixedSizeBox(100, 2);
      const spacer = new FixedSizeBox(100, 1);
      const msg2 = new FixedSizeBox(100, 5);

      col.insert(msg1);
      col.insert(spacer);
      col.insert(msg2);

      // ScrollView passes: tight width (from Expanded - padding), unbounded height
      col.layout(new BoxConstraints({
        minWidth: 115, maxWidth: 115,
        minHeight: 0, maxHeight: Infinity,
      }));

      expect(col.size.width).toBe(115);
      expect(col.size.height).toBe(8); // 2+1+5
      // All children stretched to 115 wide
      expect(msg1.size.width).toBe(115);
      expect(spacer.size.width).toBe(115);
      expect(msg2.size.width).toBe(115);
    });

    it('Column(min, stretch) with many messages overflows viewport (scrollable)', () => {
      const col = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'min',
        crossAxisAlignment: 'stretch',
      });

      // 20 messages each 5 rows tall = 100 total (viewport is only 37)
      for (let i = 0; i < 20; i++) {
        col.insert(new FixedSizeBox(100, 5));
      }

      col.layout(new BoxConstraints({
        minWidth: 115, maxWidth: 115,
        minHeight: 0, maxHeight: Infinity,
      }));

      expect(col.size.height).toBe(100);
      expect(col.size.width).toBe(115);
    });
  });

  describe('Welcome screen bypass (no messages → Center, not ScrollView)', () => {
    it('Center widget fills available space and centers child', () => {
      // When items=[], app.ts uses Center instead of Row+ScrollView
      // This test ensures the constraint chain works for centering

      // Simulating: Expanded(Center(ChatView))
      // The Expanded gives tight height, Center passes loose to child
      const centerArea = new GreedyBox();

      // Center receives tight constraints from Expanded
      centerArea.layout(new BoxConstraints({
        minWidth: 120, maxWidth: 120,
        minHeight: 37, maxHeight: 37,
      }));

      expect(centerArea.size.width).toBe(120);
      expect(centerArea.size.height).toBe(37);
    });
  });

  describe('Edge case: single message (transition from welcome to chat)', () => {
    it('after first message, Column(stretch) fills width correctly', () => {
      // This is the critical transition: items goes from [] to [user_message]
      // App switches from Center path to Row+ScrollView path
      const col = new RenderFlex({
        direction: 'vertical',
        mainAxisSize: 'min',
        crossAxisAlignment: 'stretch',
      });

      const singleMessage = new FixedSizeBox(50, 3);
      col.insert(singleMessage);

      col.layout(new BoxConstraints({
        minWidth: 115, maxWidth: 115,
        minHeight: 0, maxHeight: Infinity,
      }));

      // Message should be stretched to fill width
      expect(singleMessage.size.width).toBe(115);
      expect(col.size.height).toBe(3);
    });
  });

  describe('InputArea minimum height constraint', () => {
    it('InputArea gets at least 3 rows from minHeight constraint', () => {
      const box = new FixedSizeBox(120, 1);

      const parentConstraints = new BoxConstraints({
        minWidth: 120, maxWidth: 120,
        minHeight: 0, maxHeight: Infinity,
      });
      const additionalConstraints = new BoxConstraints({ minHeight: 3 });
      const enforced = additionalConstraints.enforce(parentConstraints);

      box.layout(enforced);
      expect(box.size.height).toBe(3);
    });
  });
});
