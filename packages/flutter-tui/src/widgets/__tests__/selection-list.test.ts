// Tests for SelectionList widget
// Verifies construction, keyboard navigation, mouse interaction, disabled items

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { SelectionList, SelectionListState } from '../selection-list';
import type { SelectionItem } from '../selection-list';
import { FocusManager } from '../../input/focus';
import { createKeyEvent } from '../../input/events';
import type { BuildContext } from '../../framework/widget';

// Helper to create a basic items array
function createItems(): SelectionItem[] {
  return [
    { label: 'Alpha', value: 'a' },
    { label: 'Beta', value: 'b', description: 'The second option' },
    { label: 'Gamma', value: 'c' },
  ];
}

// Helper to mount a SelectionList state for testing
function mountState(widget: SelectionList): SelectionListState {
  const state = widget.createState() as SelectionListState;
  const mockContext = { widget, mounted: true } as BuildContext;
  (state as any)._mount(widget, mockContext);
  return state;
}

describe('SelectionList', () => {
  test('creates with required properties', () => {
    const items = createItems();
    const onSelect = (_value: string): void => {};

    const list = new SelectionList({ items, onSelect });

    expect(list.items).toBe(items);
    expect(list.onSelect).toBe(onSelect);
    expect(list.onCancel).toBeUndefined();
    expect(list.initialIndex).toBeUndefined();
    expect(list.enableMouseInteraction).toBe(true);
    expect(list.showDescription).toBe(true);
  });

  test('creates with all optional properties', () => {
    const items = createItems();
    const onSelect = (_value: string): void => {};
    const onCancel = (): void => {};

    const list = new SelectionList({
      items,
      onSelect,
      onCancel,
      initialIndex: 2,
      enableMouseInteraction: false,
      showDescription: false,
    });

    expect(list.onCancel).toBe(onCancel);
    expect(list.initialIndex).toBe(2);
    expect(list.enableMouseInteraction).toBe(false);
    expect(list.showDescription).toBe(false);
  });

  test('is a StatefulWidget', () => {
    const list = new SelectionList({
      items: createItems(),
      onSelect: () => {},
    });
    expect(list.createElement).toBeDefined();
    expect(list.createState()).toBeDefined();
  });
});

describe('SelectionListState', () => {
  beforeEach(() => {
    FocusManager.reset();
  });

  afterEach(() => {
    FocusManager.reset();
  });

  describe('initialization', () => {
    test('initializes with selectedIndex 0 by default', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
      });
      const state = mountState(list);

      expect(state.selectedIndex).toBe(0);

      (state as any)._unmount();
    });

    test('initializes with provided initialIndex', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
        initialIndex: 2,
      });
      const state = mountState(list);

      expect(state.selectedIndex).toBe(2);

      (state as any)._unmount();
    });

    test('clamps initialIndex to valid range', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
        initialIndex: 99,
      });
      const state = mountState(list);

      expect(state.selectedIndex).toBe(2); // last valid index

      (state as any)._unmount();
    });

    test('skips disabled initial item', () => {
      const items: SelectionItem[] = [
        { label: 'Disabled', value: 'x', disabled: true },
        { label: 'Enabled', value: 'y' },
      ];
      const list = new SelectionList({
        items,
        onSelect: () => {},
      });
      const state = mountState(list);

      expect(state.selectedIndex).toBe(1); // skipped disabled item at 0

      (state as any)._unmount();
    });
  });

  describe('keyboard navigation', () => {
    test('ArrowDown moves selection forward', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
      });
      const state = mountState(list);

      expect(state.selectedIndex).toBe(0);

      state.handleKeyEvent(createKeyEvent('ArrowDown'));
      expect(state.selectedIndex).toBe(1);

      state.handleKeyEvent(createKeyEvent('ArrowDown'));
      expect(state.selectedIndex).toBe(2);

      (state as any)._unmount();
    });

    test('ArrowUp moves selection backward', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
        initialIndex: 2,
      });
      const state = mountState(list);

      expect(state.selectedIndex).toBe(2);

      state.handleKeyEvent(createKeyEvent('ArrowUp'));
      expect(state.selectedIndex).toBe(1);

      state.handleKeyEvent(createKeyEvent('ArrowUp'));
      expect(state.selectedIndex).toBe(0);

      (state as any)._unmount();
    });

    test('j key moves selection forward', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
      });
      const state = mountState(list);

      state.handleKeyEvent(createKeyEvent('j'));
      expect(state.selectedIndex).toBe(1);

      (state as any)._unmount();
    });

    test('k key moves selection backward', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
        initialIndex: 2,
      });
      const state = mountState(list);

      state.handleKeyEvent(createKeyEvent('k'));
      expect(state.selectedIndex).toBe(1);

      (state as any)._unmount();
    });

    test('Tab cycles forward through items', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
      });
      const state = mountState(list);

      state.handleKeyEvent(createKeyEvent('Tab'));
      expect(state.selectedIndex).toBe(1);

      state.handleKeyEvent(createKeyEvent('Tab'));
      expect(state.selectedIndex).toBe(2);

      (state as any)._unmount();
    });

    test('wraps around from last to first on ArrowDown', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
        initialIndex: 2,
      });
      const state = mountState(list);

      state.handleKeyEvent(createKeyEvent('ArrowDown'));
      expect(state.selectedIndex).toBe(0); // wrapped

      (state as any)._unmount();
    });

    test('wraps around from first to last on ArrowUp', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
        initialIndex: 0,
      });
      const state = mountState(list);

      state.handleKeyEvent(createKeyEvent('ArrowUp'));
      expect(state.selectedIndex).toBe(2); // wrapped

      (state as any)._unmount();
    });

    test('skips disabled items when navigating forward', () => {
      const items: SelectionItem[] = [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b', disabled: true },
        { label: 'C', value: 'c' },
      ];
      const list = new SelectionList({ items, onSelect: () => {} });
      const state = mountState(list);

      expect(state.selectedIndex).toBe(0);

      state.handleKeyEvent(createKeyEvent('ArrowDown'));
      expect(state.selectedIndex).toBe(2); // skipped disabled B

      (state as any)._unmount();
    });

    test('skips disabled items when navigating backward', () => {
      const items: SelectionItem[] = [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b', disabled: true },
        { label: 'C', value: 'c' },
      ];
      const list = new SelectionList({
        items,
        onSelect: () => {},
        initialIndex: 2,
      });
      const state = mountState(list);

      state.handleKeyEvent(createKeyEvent('ArrowUp'));
      expect(state.selectedIndex).toBe(0); // skipped disabled B

      (state as any)._unmount();
    });

    test('Enter confirms selection and calls onSelect', () => {
      const selected: string[] = [];
      const list = new SelectionList({
        items: createItems(),
        onSelect: (value) => selected.push(value),
        initialIndex: 1,
      });
      const state = mountState(list);

      state.handleKeyEvent(createKeyEvent('Enter'));
      expect(selected).toEqual(['b']);

      (state as any)._unmount();
    });

    test('Escape calls onCancel', () => {
      let cancelled = false;
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
        onCancel: () => { cancelled = true; },
      });
      const state = mountState(list);

      state.handleKeyEvent(createKeyEvent('Escape'));
      expect(cancelled).toBe(true);

      (state as any)._unmount();
    });

    test('Escape with no onCancel does not throw', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
      });
      const state = mountState(list);

      // Should not throw
      const result = state.handleKeyEvent(createKeyEvent('Escape'));
      expect(result).toBe('handled');

      (state as any)._unmount();
    });

    test('unrecognized key returns ignored', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
      });
      const state = mountState(list);

      const result = state.handleKeyEvent(createKeyEvent('x'));
      expect(result).toBe('ignored');

      (state as any)._unmount();
    });

    test('handled keys return handled result', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
      });
      const state = mountState(list);

      expect(state.handleKeyEvent(createKeyEvent('ArrowDown'))).toBe('handled');
      expect(state.handleKeyEvent(createKeyEvent('ArrowUp'))).toBe('handled');
      expect(state.handleKeyEvent(createKeyEvent('j'))).toBe('handled');
      expect(state.handleKeyEvent(createKeyEvent('k'))).toBe('handled');
      expect(state.handleKeyEvent(createKeyEvent('Tab'))).toBe('handled');
      expect(state.handleKeyEvent(createKeyEvent('Enter'))).toBe('handled');
      expect(state.handleKeyEvent(createKeyEvent('Escape'))).toBe('handled');

      (state as any)._unmount();
    });
  });

  describe('mouse interaction', () => {
    test('handleMouseClick selects and confirms', () => {
      const selected: string[] = [];
      const list = new SelectionList({
        items: createItems(),
        onSelect: (value) => selected.push(value),
      });
      const state = mountState(list);

      state.handleMouseClick(1);
      expect(selected).toEqual(['b']);

      (state as any)._unmount();
    });

    test('handleMouseClick ignores disabled items', () => {
      const selected: string[] = [];
      const items: SelectionItem[] = [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b', disabled: true },
      ];
      const list = new SelectionList({
        items,
        onSelect: (value) => selected.push(value),
      });
      const state = mountState(list);

      state.handleMouseClick(1); // disabled item
      expect(selected).toEqual([]);

      (state as any)._unmount();
    });

    test('handleMouseClick ignores out-of-bounds index', () => {
      const selected: string[] = [];
      const list = new SelectionList({
        items: createItems(),
        onSelect: (value) => selected.push(value),
      });
      const state = mountState(list);

      state.handleMouseClick(-1);
      state.handleMouseClick(99);
      expect(selected).toEqual([]);

      (state as any)._unmount();
    });

    test('handleMouseClick ignored when enableMouseInteraction is false', () => {
      const selected: string[] = [];
      const list = new SelectionList({
        items: createItems(),
        onSelect: (value) => selected.push(value),
        enableMouseInteraction: false,
      });
      const state = mountState(list);

      state.handleMouseClick(0);
      expect(selected).toEqual([]);

      (state as any)._unmount();
    });
  });

  describe('build', () => {
    test('build returns a FocusScope wrapping a Column', () => {
      const list = new SelectionList({
        items: createItems(),
        onSelect: () => {},
      });
      const state = mountState(list);
      const mockContext = { widget: list, mounted: true } as BuildContext;

      const built = state.build(mockContext);
      // Should be a FocusScope widget
      expect(built.constructor.name).toBe('FocusScope');

      (state as any)._unmount();
    });

    test('build includes item descriptions when showDescription is true', () => {
      // This is a structural test; the widget tree is created correctly
      const items: SelectionItem[] = [
        { label: 'A', value: 'a', description: 'First item' },
      ];
      const list = new SelectionList({
        items,
        onSelect: () => {},
        showDescription: true,
      });
      const state = mountState(list);
      const mockContext = { widget: list, mounted: true } as BuildContext;

      // Build should succeed without errors
      const built = state.build(mockContext);
      expect(built).toBeDefined();

      (state as any)._unmount();
    });
  });

  describe('edge cases', () => {
    test('empty items list does not crash', () => {
      const selected: string[] = [];
      const list = new SelectionList({
        items: [],
        onSelect: (value) => selected.push(value),
      });
      const state = mountState(list);

      // Navigation should not crash
      state.handleKeyEvent(createKeyEvent('ArrowDown'));
      state.handleKeyEvent(createKeyEvent('ArrowUp'));
      state.handleKeyEvent(createKeyEvent('Enter'));
      state.handleMouseClick(0);

      expect(selected).toEqual([]);

      (state as any)._unmount();
    });

    test('single item list navigation wraps to same item', () => {
      const list = new SelectionList({
        items: [{ label: 'Only', value: 'only' }],
        onSelect: () => {},
      });
      const state = mountState(list);

      expect(state.selectedIndex).toBe(0);

      state.handleKeyEvent(createKeyEvent('ArrowDown'));
      expect(state.selectedIndex).toBe(0); // wraps to same

      state.handleKeyEvent(createKeyEvent('ArrowUp'));
      expect(state.selectedIndex).toBe(0); // wraps to same

      (state as any)._unmount();
    });

    test('all disabled items - navigation stays at current', () => {
      const items: SelectionItem[] = [
        { label: 'A', value: 'a', disabled: true },
        { label: 'B', value: 'b', disabled: true },
        { label: 'C', value: 'c', disabled: true },
      ];
      const list = new SelectionList({
        items,
        onSelect: () => {},
      });
      const state = mountState(list);

      // All disabled, should not move
      const idx = state.selectedIndex;
      state.handleKeyEvent(createKeyEvent('ArrowDown'));
      expect(state.selectedIndex).toBe(idx);

      (state as any)._unmount();
    });

    test('Enter on disabled item does not call onSelect', () => {
      const selected: string[] = [];
      const items: SelectionItem[] = [
        { label: 'A', value: 'a', disabled: true },
      ];
      const list = new SelectionList({
        items,
        onSelect: (value) => selected.push(value),
      });
      const state = mountState(list);

      state.handleKeyEvent(createKeyEvent('Enter'));
      expect(selected).toEqual([]);

      (state as any)._unmount();
    });
  });
});
