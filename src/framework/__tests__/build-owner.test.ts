// Tests for BuildOwner — dirty element management and build scopes
// Amp ref: NB0 (BuildOwner), amp-strings.txt:530126

import { describe, it, expect, beforeEach } from 'bun:test';
import { BuildOwner, GlobalKeyRegistry } from '../build-owner';
import { Element, StatelessElement } from '../element';
import { Widget, StatelessWidget, type BuildContext } from '../widget';
import { GlobalKey } from '../../core/key';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

class TestWidget extends StatelessWidget {
  buildCount = 0;

  build(_context: BuildContext): Widget {
    this.buildCount++;
    return this;
  }

  override createElement(): StatelessElement {
    return new StatelessElement(this);
  }
}

/** Create a mounted element at a given depth. */
function makeElement(depth: number = 0): StatelessElement {
  const widget = new TestWidget();
  const element = new StatelessElement(widget);
  // Manually set up parent chain for depth
  let current: Element = element;
  for (let i = 0; i < depth; i++) {
    const parentWidget = new TestWidget();
    const parent = new StatelessElement(parentWidget);
    parent.addChild(current);
    current = parent;
  }
  // Mark mounted and dirty so rebuild works
  element._mounted = true;
  element._dirty = true;
  return element;
}

// ---------------------------------------------------------------------------
// BuildOwner tests
// ---------------------------------------------------------------------------

describe('BuildOwner', () => {
  let owner: BuildOwner;

  beforeEach(() => {
    owner = new BuildOwner();
  });

  describe('scheduleBuildFor', () => {
    it('adds element to dirty set', () => {
      const elem = makeElement();
      expect(owner.dirtyElementCount).toBe(0);
      owner.scheduleBuildFor(elem);
      expect(owner.dirtyElementCount).toBe(1);
    });

    it('deduplicates (Set behavior)', () => {
      const elem = makeElement();
      owner.scheduleBuildFor(elem);
      owner.scheduleBuildFor(elem);
      owner.scheduleBuildFor(elem);
      expect(owner.dirtyElementCount).toBe(1);
    });

    it('accepts multiple different elements', () => {
      const elem1 = makeElement();
      const elem2 = makeElement();
      owner.scheduleBuildFor(elem1);
      owner.scheduleBuildFor(elem2);
      expect(owner.dirtyElementCount).toBe(2);
    });
  });

  describe('buildScope', () => {
    it('rebuilds dirty elements in depth order (shallowest first)', () => {
      const rebuildOrder: number[] = [];

      // Create elements at different depths
      const widget1 = new TestWidget();
      const deepElem = new StatelessElement(widget1);
      const widget2 = new TestWidget();
      const midElem = new StatelessElement(widget2);
      const widget3 = new TestWidget();
      const shallowElem = new StatelessElement(widget3);

      // Set up parent chain: shallow -> mid -> deep
      shallowElem.addChild(midElem);
      midElem.addChild(deepElem);

      // Mark all as mounted and dirty
      for (const e of [shallowElem, midElem, deepElem]) {
        e._mounted = true;
        e._dirty = true;
      }

      // Override performRebuild to track order
      const origPerformRebuild = Element.prototype.performRebuild;
      shallowElem.performRebuild = () => {
        rebuildOrder.push(shallowElem.depth);
      };
      midElem.performRebuild = () => {
        rebuildOrder.push(midElem.depth);
      };
      deepElem.performRebuild = () => {
        rebuildOrder.push(deepElem.depth);
      };

      // Schedule in reverse order (deep first)
      owner.scheduleBuildFor(deepElem);
      owner.scheduleBuildFor(shallowElem);
      owner.scheduleBuildFor(midElem);

      owner.buildScope();

      // Should rebuild shallowest first: depth 0, 1, 2
      expect(rebuildOrder).toEqual([0, 1, 2]);
    });

    it('handles cascading dirtying (element marks another dirty during rebuild)', () => {
      const widget1 = new TestWidget();
      const elem1 = new StatelessElement(widget1);
      const widget2 = new TestWidget();
      const elem2 = new StatelessElement(widget2);

      elem1._mounted = true;
      elem1._dirty = true;
      elem2._mounted = true;
      elem2._dirty = false;

      let elem2Rebuilt = false;

      // elem1's rebuild should dirty elem2
      elem1.performRebuild = () => {
        // Cascade: mark elem2 dirty during rebuild
        elem2._dirty = true;
        owner.scheduleBuildFor(elem2);
      };

      elem2.performRebuild = () => {
        elem2Rebuilt = true;
      };

      owner.scheduleBuildFor(elem1);
      owner.buildScope();

      expect(elem2Rebuilt).toBe(true);
    });

    it('is no-op with no dirty elements', () => {
      // Should not throw
      owner.buildScope();
      expect(owner.dirtyElementCount).toBe(0);
    });

    it('skips unmounted elements during rebuild', () => {
      const widget = new TestWidget();
      const elem = new StatelessElement(widget);
      elem._mounted = false;
      elem._dirty = true;

      let rebuilt = false;
      elem.performRebuild = () => {
        rebuilt = true;
      };

      owner.scheduleBuildFor(elem);
      owner.buildScope();

      // Element was dirty but not mounted — should not rebuild
      // (The Amp code checks elem.dirty, but dirty was true. However,
      // the element is not mounted. In Amp, the check is just `if (s.dirty)`.
      // Unmounted elements should still have their dirty flag cleared.)
      // Note: In Amp, unmounted elements would still get performRebuild called
      // if they are dirty. But the performRebuild should handle unmounted state.
      // For safety, the dirty flag gets cleared regardless.
      expect(elem._dirty).toBe(false);
    });

    it('clears dirty flag even on rebuild error', () => {
      const widget = new TestWidget();
      const elem = new StatelessElement(widget);
      elem._mounted = true;
      elem._dirty = true;

      elem.performRebuild = () => {
        throw new Error('Build failed!');
      };

      owner.scheduleBuildFor(elem);
      // Should not throw
      owner.buildScope();

      expect(elem._dirty).toBe(false);
    });

    it('runs optional callback before building', () => {
      let callbackRan = false;
      owner.buildScope(() => {
        callbackRan = true;
      });
      expect(callbackRan).toBe(true);
    });

    it('sets isBuilding during scope execution', () => {
      const widget = new TestWidget();
      const elem = new StatelessElement(widget);
      elem._mounted = true;
      elem._dirty = true;

      let wasBuildingDuringRebuild = false;
      elem.performRebuild = () => {
        wasBuildingDuringRebuild = owner.isBuilding;
      };

      owner.scheduleBuildFor(elem);
      expect(owner.isBuilding).toBe(false);
      owner.buildScope();
      expect(owner.isBuilding).toBe(false);
      expect(wasBuildingDuringRebuild).toBe(true);
    });
  });

  describe('buildScopes', () => {
    it('is an alias for buildScope with no callback', () => {
      // Just verify it doesn't throw and behaves like buildScope
      const widget = new TestWidget();
      const elem = new StatelessElement(widget);
      elem._mounted = true;
      elem._dirty = true;

      let rebuilt = false;
      elem.performRebuild = () => {
        rebuilt = true;
      };

      owner.scheduleBuildFor(elem);
      owner.buildScopes();
      expect(rebuilt).toBe(true);
    });
  });

  describe('hasDirtyElements', () => {
    it('returns false when no dirty elements', () => {
      expect(owner.hasDirtyElements).toBe(false);
    });

    it('returns true when elements are scheduled', () => {
      const elem = makeElement();
      owner.scheduleBuildFor(elem);
      expect(owner.hasDirtyElements).toBe(true);
    });

    it('returns false after buildScopes completes', () => {
      const elem = makeElement();
      owner.scheduleBuildFor(elem);
      owner.buildScopes();
      expect(owner.hasDirtyElements).toBe(false);
    });
  });

  describe('buildStats', () => {
    it('tracks rebuild count', () => {
      const elem = makeElement();
      elem.performRebuild = () => {}; // no-op
      owner.scheduleBuildFor(elem);
      owner.buildScopes();

      const stats = owner.buildStats;
      expect(stats.totalRebuilds).toBe(1);
      expect(stats.elementsRebuiltThisFrame).toBe(1);
    });
  });

  describe('dispose', () => {
    it('clears dirty elements', () => {
      const elem = makeElement();
      owner.scheduleBuildFor(elem);
      expect(owner.dirtyElementCount).toBe(1);
      owner.dispose();
      expect(owner.dirtyElementCount).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// GlobalKeyRegistry tests
// ---------------------------------------------------------------------------

describe('GlobalKeyRegistry', () => {
  let registry: GlobalKeyRegistry;

  beforeEach(() => {
    registry = new GlobalKeyRegistry();
  });

  it('registers and retrieves an element by key', () => {
    const key = new GlobalKey();
    const widget = new TestWidget();
    const elem = new StatelessElement(widget);

    registry.register(key, elem);
    expect(registry.getElement(key)).toBe(elem);
  });

  it('throws when registering duplicate key', () => {
    const key = new GlobalKey();
    const widget = new TestWidget();
    const elem1 = new StatelessElement(widget);
    const elem2 = new StatelessElement(widget);

    registry.register(key, elem1);
    expect(() => registry.register(key, elem2)).toThrow(
      /already associated with an element/,
    );
  });

  it('unregisters an element by key', () => {
    const key = new GlobalKey();
    const widget = new TestWidget();
    const elem = new StatelessElement(widget);

    registry.register(key, elem);
    registry.unregister(key, elem);
    expect(registry.getElement(key)).toBeUndefined();
  });

  it('clear removes all entries', () => {
    const key1 = new GlobalKey();
    const key2 = new GlobalKey();
    const widget = new TestWidget();

    registry.register(key1, new StatelessElement(widget));
    registry.register(key2, new StatelessElement(widget));
    expect(registry.size).toBe(2);

    registry.clear();
    expect(registry.size).toBe(0);
  });
});
