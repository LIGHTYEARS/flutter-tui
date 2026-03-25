// Tests for PipelineOwner — layout and paint scheduling
// Amp ref: UB0 (PipelineOwner), amp-strings.txt:530127

import { describe, it, expect, beforeEach } from 'bun:test';
import { PipelineOwner } from '../pipeline-owner';
import { RenderBox, RenderObject } from '../render-object';
import { BoxConstraints } from '../../core/box-constraints';
import { Size, Offset } from '../../core/types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

class TestRenderBox extends RenderBox {
  layoutCount = 0;
  lastConstraints: BoxConstraints | null = null;

  performLayout(): void {
    this.layoutCount++;
    if (this.constraints) {
      this.lastConstraints = this.constraints;
      const constrained = this.constraints.constrain(
        new Size(this.constraints.maxWidth, this.constraints.maxHeight),
      );
      this.size = constrained;
    }
  }

  paint(): void {
    // no-op for tests
  }
}

// ---------------------------------------------------------------------------
// PipelineOwner tests
// ---------------------------------------------------------------------------

describe('PipelineOwner', () => {
  let owner: PipelineOwner;

  beforeEach(() => {
    owner = new PipelineOwner();
  });

  describe('setRootRenderObject', () => {
    it('sets the root node', () => {
      const root = new TestRenderBox();
      owner.setRootRenderObject(root);
      expect(owner.rootNode).toBe(root);
    });

    it('attaches the root to the owner', () => {
      const root = new TestRenderBox();
      owner.setRootRenderObject(root);
      expect(root.attached).toBe(true);
    });

    it('accepts null to clear root', () => {
      const root = new TestRenderBox();
      owner.setRootRenderObject(root);
      owner.setRootRenderObject(null);
      expect(owner.rootNode).toBeNull();
    });
  });

  describe('setConstraints', () => {
    it('marks needsLayout', () => {
      const root = new TestRenderBox();
      owner.setRootRenderObject(root);
      // Clear the initial needsLayout from construction
      const constraints = BoxConstraints.tight(new Size(80, 24));
      root.layout(constraints);

      // Now set new constraints
      owner.setConstraints(BoxConstraints.tight(new Size(100, 50)));
      expect(owner.hasNodesNeedingLayout).toBe(true);
    });
  });

  describe('flushLayout', () => {
    it('calls layout on root with constraints', () => {
      const root = new TestRenderBox();
      owner.setRootRenderObject(root);
      owner.setConstraints(BoxConstraints.tight(new Size(80, 24)));

      const result = owner.flushLayout();

      expect(result).toBe(true);
      expect(root.layoutCount).toBe(1);
    });

    it('is no-op when root does not need layout', () => {
      const root = new TestRenderBox();
      owner.setRootRenderObject(root);
      owner.setConstraints(BoxConstraints.tight(new Size(80, 24)));

      // First layout
      owner.flushLayout();
      expect(root.layoutCount).toBe(1);

      // Second layout — root is clean, should be no-op
      const result = owner.flushLayout();
      expect(result).toBe(false);
      expect(root.layoutCount).toBe(1);
    });

    it('is no-op when no root node', () => {
      owner.setConstraints(BoxConstraints.tight(new Size(80, 24)));
      const result = owner.flushLayout();
      expect(result).toBe(false);
    });

    it('is no-op when no constraints set', () => {
      const root = new TestRenderBox();
      owner.setRootRenderObject(root);
      // Don't set constraints
      const result = owner.flushLayout();
      expect(result).toBe(false);
    });
  });

  describe('requestLayout', () => {
    it('sets needsLayout flag', () => {
      const root = new TestRenderBox();
      owner.setRootRenderObject(root);
      owner.setConstraints(BoxConstraints.tight(new Size(80, 24)));

      // Flush to clear
      owner.flushLayout();
      expect(owner.hasNodesNeedingLayout).toBe(false);

      // Now request layout
      root.markNeedsLayout();
      expect(owner.hasNodesNeedingLayout).toBe(true);
    });
  });

  describe('requestPaint', () => {
    it('sets needsPaint flag', () => {
      expect(owner.hasNodesNeedingPaint).toBe(false);

      const root = new TestRenderBox();
      owner.requestPaint(root);
      expect(owner.hasNodesNeedingPaint).toBe(true);
    });

    it('deduplicates same node', () => {
      const root = new TestRenderBox();
      owner.requestPaint(root);
      owner.requestPaint(root);
      // Should still have exactly one entry
      expect(owner.hasNodesNeedingPaint).toBe(true);
    });
  });

  describe('flushPaint', () => {
    it('clears paint dirty flags', () => {
      const root = new TestRenderBox();
      owner.requestPaint(root);
      expect(owner.hasNodesNeedingPaint).toBe(true);

      owner.flushPaint();
      expect(owner.hasNodesNeedingPaint).toBe(false);
    });

    it('is no-op when nothing needs paint', () => {
      // Should not throw
      owner.flushPaint();
      expect(owner.hasNodesNeedingPaint).toBe(false);
    });
  });

  describe('updateRootConstraints', () => {
    it('marks root for layout when size changes', () => {
      const root = new TestRenderBox();
      owner.setRootRenderObject(root);
      owner.setConstraints(BoxConstraints.tight(new Size(80, 24)));
      owner.flushLayout();

      owner.updateRootConstraints(new Size(120, 40));
      expect(owner.hasNodesNeedingLayout).toBe(true);
    });
  });

  describe('removeFromQueues', () => {
    it('removes node from paint queue', () => {
      const node = new TestRenderBox();
      owner.requestPaint(node);
      expect(owner.hasNodesNeedingPaint).toBe(true);

      owner.removeFromQueues(node);
      expect(owner.hasNodesNeedingPaint).toBe(false);
    });
  });

  describe('dispose', () => {
    it('clears all state', () => {
      const root = new TestRenderBox();
      owner.setRootRenderObject(root);
      owner.requestPaint(root);

      owner.dispose();
      expect(owner.rootNode).toBeNull();
      expect(owner.hasNodesNeedingPaint).toBe(false);
    });
  });
});
