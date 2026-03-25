// Tests for MediaQuery and MediaQueryData
// Covers: data class construction, defaults, copyWith, equality, InheritedWidget lookup

import { describe, it, expect } from 'bun:test';
import { MediaQueryData, MediaQuery, TerminalCapabilities } from '../media-query';
import { StatelessWidget, Widget, BuildContext } from '../../framework/widget';
import { StatelessElement, InheritedElement, BuildContextImpl } from '../../framework/element';

// ---------------------------------------------------------------------------
// Helpers — minimal widgets for building a tree to test InheritedWidget lookup
// ---------------------------------------------------------------------------

class DummyLeaf extends StatelessWidget {
  build(_context: BuildContext): Widget {
    return this; // self-referential leaf
  }
}

// ---------------------------------------------------------------------------
// MediaQueryData
// ---------------------------------------------------------------------------

describe('MediaQueryData', () => {
  describe('constructor', () => {
    it('stores size with integer rounding', () => {
      const data = new MediaQueryData({
        size: { width: 80.7, height: 23.3 },
      });
      expect(data.size.width).toBe(81);
      expect(data.size.height).toBe(23);
    });

    it('uses safe defaults for capabilities when not provided', () => {
      const data = new MediaQueryData({ size: { width: 80, height: 24 } });
      expect(data.capabilities.colorDepth).toBe('ansi256');
      expect(data.capabilities.mouseSupport).toBe(false);
      expect(data.capabilities.emojiWidth).toBe('unknown');
      expect(data.capabilities.kittyGraphics).toBe(false);
    });

    it('accepts partial capabilities and fills defaults', () => {
      const data = new MediaQueryData({
        size: { width: 120, height: 40 },
        capabilities: { colorDepth: 'truecolor', mouseSupport: true },
      });
      expect(data.capabilities.colorDepth).toBe('truecolor');
      expect(data.capabilities.mouseSupport).toBe(true);
      expect(data.capabilities.emojiWidth).toBe('unknown');
      expect(data.capabilities.kittyGraphics).toBe(false);
    });

    it('accepts full capabilities', () => {
      const data = new MediaQueryData({
        size: { width: 80, height: 24 },
        capabilities: {
          colorDepth: 'none',
          mouseSupport: true,
          emojiWidth: 'wide',
          kittyGraphics: true,
        },
      });
      expect(data.capabilities.colorDepth).toBe('none');
      expect(data.capabilities.mouseSupport).toBe(true);
      expect(data.capabilities.emojiWidth).toBe('wide');
      expect(data.capabilities.kittyGraphics).toBe(true);
    });

    it('freezes size and capabilities', () => {
      const data = new MediaQueryData({ size: { width: 80, height: 24 } });
      expect(Object.isFrozen(data.size)).toBe(true);
      expect(Object.isFrozen(data.capabilities)).toBe(true);
    });
  });

  describe('fromTerminal', () => {
    it('creates from cols and rows with defaults', () => {
      const data = MediaQueryData.fromTerminal(132, 50);
      expect(data.size.width).toBe(132);
      expect(data.size.height).toBe(50);
      expect(data.capabilities.colorDepth).toBe('ansi256');
      expect(data.capabilities.mouseSupport).toBe(false);
    });
  });

  describe('copyWith', () => {
    const original = new MediaQueryData({
      size: { width: 80, height: 24 },
      capabilities: {
        colorDepth: 'ansi256',
        mouseSupport: false,
        emojiWidth: 'narrow',
        kittyGraphics: false,
      },
    });

    it('replaces size only', () => {
      const copied = original.copyWith({ size: { width: 120, height: 40 } });
      expect(copied.size.width).toBe(120);
      expect(copied.size.height).toBe(40);
      // capabilities unchanged
      expect(copied.capabilities.colorDepth).toBe('ansi256');
      expect(copied.capabilities.emojiWidth).toBe('narrow');
    });

    it('replaces partial capabilities', () => {
      const copied = original.copyWith({
        capabilities: { colorDepth: 'truecolor' },
      });
      // size unchanged
      expect(copied.size.width).toBe(80);
      expect(copied.size.height).toBe(24);
      // colorDepth changed, rest preserved
      expect(copied.capabilities.colorDepth).toBe('truecolor');
      expect(copied.capabilities.mouseSupport).toBe(false);
      expect(copied.capabilities.emojiWidth).toBe('narrow');
      expect(copied.capabilities.kittyGraphics).toBe(false);
    });

    it('replaces both size and capabilities', () => {
      const copied = original.copyWith({
        size: { width: 200, height: 60 },
        capabilities: { kittyGraphics: true },
      });
      expect(copied.size.width).toBe(200);
      expect(copied.capabilities.kittyGraphics).toBe(true);
      expect(copied.capabilities.colorDepth).toBe('ansi256');
    });

    it('returns a new instance (does not mutate original)', () => {
      const copied = original.copyWith({ size: { width: 999, height: 999 } });
      expect(original.size.width).toBe(80);
      expect(copied.size.width).toBe(999);
    });
  });

  describe('equals', () => {
    it('returns true for identical data', () => {
      const a = MediaQueryData.fromTerminal(80, 24);
      const b = MediaQueryData.fromTerminal(80, 24);
      expect(a.equals(b)).toBe(true);
    });

    it('returns false when size differs', () => {
      const a = MediaQueryData.fromTerminal(80, 24);
      const b = MediaQueryData.fromTerminal(120, 24);
      expect(a.equals(b)).toBe(false);
    });

    it('returns false when capabilities differ', () => {
      const a = new MediaQueryData({
        size: { width: 80, height: 24 },
        capabilities: { colorDepth: 'ansi256' },
      });
      const b = new MediaQueryData({
        size: { width: 80, height: 24 },
        capabilities: { colorDepth: 'truecolor' },
      });
      expect(a.equals(b)).toBe(false);
    });

    it('compares all capability fields', () => {
      const base = {
        size: { width: 80, height: 24 },
        capabilities: {
          colorDepth: 'truecolor' as const,
          mouseSupport: true,
          emojiWidth: 'wide' as const,
          kittyGraphics: true,
        },
      };
      const a = new MediaQueryData(base);
      const b = new MediaQueryData({
        ...base,
        capabilities: { ...base.capabilities, emojiWidth: 'narrow' as const },
      });
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns readable string', () => {
      const data = MediaQueryData.fromTerminal(80, 24);
      const str = data.toString();
      expect(str).toContain('80x24');
      expect(str).toContain('ansi256');
      expect(str).toContain('MediaQueryData');
    });
  });
});

// ---------------------------------------------------------------------------
// MediaQuery InheritedWidget
// ---------------------------------------------------------------------------

describe('MediaQuery', () => {
  describe('construction', () => {
    it('stores data and child', () => {
      const data = MediaQueryData.fromTerminal(80, 24);
      const child = new DummyLeaf();
      const mq = new MediaQuery({ data, child });
      expect(mq.data).toBe(data);
      expect(mq.child).toBe(child);
    });

    it('accepts an optional key', () => {
      const { ValueKey } = require('../../core/key');
      const data = MediaQueryData.fromTerminal(80, 24);
      const child = new DummyLeaf();
      const mq = new MediaQuery({ data, child, key: new ValueKey('mq') });
      expect(mq.key).toBeDefined();
    });
  });

  describe('updateShouldNotify', () => {
    it('returns false when data is equal', () => {
      const child = new DummyLeaf();
      const a = new MediaQuery({ data: MediaQueryData.fromTerminal(80, 24), child });
      const b = new MediaQuery({ data: MediaQueryData.fromTerminal(80, 24), child });
      expect(b.updateShouldNotify(a)).toBe(false);
    });

    it('returns true when size changes', () => {
      const child = new DummyLeaf();
      const a = new MediaQuery({ data: MediaQueryData.fromTerminal(80, 24), child });
      const b = new MediaQuery({ data: MediaQueryData.fromTerminal(120, 40), child });
      expect(b.updateShouldNotify(a)).toBe(true);
    });

    it('returns true when capabilities change', () => {
      const child = new DummyLeaf();
      const a = new MediaQuery({
        data: new MediaQueryData({
          size: { width: 80, height: 24 },
          capabilities: { colorDepth: 'ansi256' },
        }),
        child,
      });
      const b = new MediaQuery({
        data: new MediaQueryData({
          size: { width: 80, height: 24 },
          capabilities: { colorDepth: 'truecolor' },
        }),
        child,
      });
      expect(b.updateShouldNotify(a)).toBe(true);
    });
  });

  describe('createElement', () => {
    it('creates an InheritedElement', () => {
      const data = MediaQueryData.fromTerminal(80, 24);
      const child = new DummyLeaf();
      const mq = new MediaQuery({ data, child });
      const element = mq.createElement();
      expect(element).toBeInstanceOf(InheritedElement);
      expect(element.widget).toBe(mq);
    });
  });

  describe('static accessors (of, sizeOf, capabilitiesOf)', () => {
    // Build a minimal element tree: MediaQuery -> DummyLeaf
    // Then create a BuildContextImpl for the leaf so we can test lookups.

    function buildTree(data: MediaQueryData) {
      const leaf = new DummyLeaf();
      const mq = new MediaQuery({ data, child: leaf });

      // Create elements
      const mqElement = mq.createElement() as InheritedElement;
      mqElement.mount();

      // The child element is mqElement._child (the leaf's element)
      const leafElement = mqElement.child!;
      // Create a BuildContextImpl for the leaf
      const context = new BuildContextImpl(leafElement, leafElement.widget);
      return { context, mqElement, leafElement };
    }

    it('MediaQuery.of() returns the data', () => {
      const data = MediaQueryData.fromTerminal(80, 24);
      const { context } = buildTree(data);
      const result = MediaQuery.of(context);
      expect(result).toBe(data);
    });

    it('MediaQuery.of() throws when not found', () => {
      // Create a standalone leaf with no MediaQuery ancestor
      const leaf = new DummyLeaf();
      const leafElement = leaf.createElement() as StatelessElement;
      // Don't mount through MediaQuery, just create context directly
      const context = new BuildContextImpl(leafElement, leaf);
      expect(() => MediaQuery.of(context)).toThrow('MediaQuery.of()');
    });

    it('MediaQuery.maybeOf() returns undefined when not found', () => {
      const leaf = new DummyLeaf();
      const leafElement = leaf.createElement() as StatelessElement;
      const context = new BuildContextImpl(leafElement, leaf);
      expect(MediaQuery.maybeOf(context)).toBeUndefined();
    });

    it('MediaQuery.sizeOf() returns the size', () => {
      const data = MediaQueryData.fromTerminal(132, 50);
      const { context } = buildTree(data);
      const size = MediaQuery.sizeOf(context);
      expect(size.width).toBe(132);
      expect(size.height).toBe(50);
    });

    it('MediaQuery.capabilitiesOf() returns the capabilities', () => {
      const data = new MediaQueryData({
        size: { width: 80, height: 24 },
        capabilities: { colorDepth: 'truecolor', mouseSupport: true },
      });
      const { context } = buildTree(data);
      const caps = MediaQuery.capabilitiesOf(context);
      expect(caps.colorDepth).toBe('truecolor');
      expect(caps.mouseSupport).toBe(true);
      expect(caps.emojiWidth).toBe('unknown');
      expect(caps.kittyGraphics).toBe(false);
    });

    it('registers dependency on the InheritedElement', () => {
      const data = MediaQueryData.fromTerminal(80, 24);
      const { context, mqElement } = buildTree(data);

      // Before lookup, no dependents
      const dependents = (mqElement as any)._dependents as Set<any>;

      // Trigger dependency
      MediaQuery.of(context);

      // Now the leaf element should be a dependent
      expect(dependents.size).toBeGreaterThan(0);
    });
  });

  describe('nested MediaQuery override', () => {
    it('inner MediaQuery overrides outer', () => {
      const outerData = MediaQueryData.fromTerminal(80, 24);
      const innerData = MediaQueryData.fromTerminal(40, 12);
      const leaf = new DummyLeaf();

      const inner = new MediaQuery({ data: innerData, child: leaf });
      const outer = new MediaQuery({ data: outerData, child: inner });

      // Mount outer
      const outerElement = outer.createElement() as InheritedElement;
      outerElement.mount();

      // Walk to find the leaf element
      // outer -> inner (InheritedElement) -> leaf (StatelessElement)
      const innerElement = outerElement.child! as InheritedElement;
      const leafElement = innerElement.child!;

      const context = new BuildContextImpl(leafElement, leafElement.widget);
      const result = MediaQuery.of(context);
      expect(result.size.width).toBe(40);
      expect(result.size.height).toBe(12);
    });
  });
});
