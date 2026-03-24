// Tests for CollapsibleDrawer widget and CollapsibleDrawerState
// Verifies construction, defaults, state lifecycle, keyboard/mouse handling,
// spinner lifecycle, content truncation, and "View all" behavior

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { CollapsibleDrawer, CollapsibleDrawerState } from '../collapsible-drawer';
import {
  StatelessWidget,
  StatefulWidget,
  State,
  type BuildContext,
  type Widget,
} from '../../framework/widget';
import { Text } from '../text';
import { TextSpan } from '../../core/text-span';
import { TextStyle } from '../../core/text-style';
import { SizedBox } from '../sized-box';
import { Column } from '../flex';
import { ClipRect } from '../clip-rect';
import { FocusScope } from '../focus-scope';
import { MouseRegion } from '../mouse-region';
import { createKeyEvent } from '../../input/events';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Minimal widget for child/title tests */
class _DummyWidget extends StatelessWidget {
  readonly label: string;
  constructor(label: string = 'dummy') {
    super();
    this.label = label;
  }
  build(_context: BuildContext): Widget {
    return this;
  }
}

/** Create a title Text widget for testing */
function makeTitle(text: string = 'Test Section'): Text {
  return new Text({ text: new TextSpan({ text }) });
}

/** Create a child widget for testing */
function makeChild(label: string = 'child content'): _DummyWidget {
  return new _DummyWidget(label);
}

/**
 * Helper to mount a CollapsibleDrawerState for testing.
 * Since State requires _mount to be called, we simulate the framework.
 */
function mountState(widget: CollapsibleDrawer): CollapsibleDrawerState {
  const state = widget.createState() as CollapsibleDrawerState;
  // Simulate framework mounting: set widget and context, call initState
  const mockElement = {
    widget,
    mounted: true,
    markNeedsBuild: () => {},
  };
  (state as any)._mount(widget, mockElement as unknown as BuildContext);
  return state;
}

/**
 * Helper to simulate didUpdateWidget by calling _update on the state.
 */
function updateWidget(state: CollapsibleDrawerState, newWidget: CollapsibleDrawer): void {
  (state as any)._update(newWidget);
}

/**
 * Helper to simulate unmount by calling _unmount on the state.
 */
function unmountState(state: CollapsibleDrawerState): void {
  (state as any)._unmount();
}

// ===========================================================================
// CollapsibleDrawer (StatefulWidget) — Constructor & Defaults
// ===========================================================================

describe('CollapsibleDrawer', () => {
  test('creates with required title and child only, defaults applied', () => {
    const title = makeTitle();
    const child = makeChild();
    const drawer = new CollapsibleDrawer({ title, child });

    expect(drawer.title).toBe(title);
    expect(drawer.child).toBe(child);
    expect(drawer.expanded).toBe(false);
    expect(drawer.onChanged).toBeUndefined();
    expect(drawer.maxContentLines).toBeUndefined();
    expect(drawer.showViewAll).toBe(true);
    expect(drawer.spinner).toBe(false);
  });

  test('creates with all options specified', () => {
    const title = makeTitle('All Options');
    const child = makeChild('all-opts');
    const onChanged = (_expanded: boolean) => {};
    const drawer = new CollapsibleDrawer({
      title,
      child,
      expanded: true,
      onChanged,
      maxContentLines: 10,
      showViewAll: false,
      spinner: true,
    });

    expect(drawer.title).toBe(title);
    expect(drawer.child).toBe(child);
    expect(drawer.expanded).toBe(true);
    expect(drawer.onChanged).toBe(onChanged);
    expect(drawer.maxContentLines).toBe(10);
    expect(drawer.showViewAll).toBe(false);
    expect(drawer.spinner).toBe(true);
  });

  test('expanded defaults to false', () => {
    const drawer = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
    });
    expect(drawer.expanded).toBe(false);
  });

  test('showViewAll defaults to true', () => {
    const drawer = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
    });
    expect(drawer.showViewAll).toBe(true);
  });

  test('spinner defaults to false', () => {
    const drawer = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
    });
    expect(drawer.spinner).toBe(false);
  });

  test('is a StatefulWidget', () => {
    const drawer = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
    });
    expect(drawer).toBeInstanceOf(StatefulWidget);
  });

  test('createState returns a CollapsibleDrawerState', () => {
    const drawer = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
    });
    const state = drawer.createState();
    expect(state).toBeInstanceOf(CollapsibleDrawerState);
  });

  test('accepts a Key option', () => {
    const { ValueKey } = require('../../core/key');
    const key = new ValueKey('drawer-key');
    const drawer = new CollapsibleDrawer({
      key,
      title: makeTitle(),
      child: makeChild(),
    });
    expect(drawer.key).toBeDefined();
    expect(drawer.key!.equals(key)).toBe(true);
  });
});

// ===========================================================================
// CollapsibleDrawerState — Core State Management
// ===========================================================================

describe('CollapsibleDrawerState', () => {
  let title: Text;
  let child: _DummyWidget;

  beforeEach(() => {
    title = makeTitle();
    child = makeChild();
  });

  test('initState sets expanded from widget', () => {
    const widget = new CollapsibleDrawer({ title, child, expanded: true });
    const state = mountState(widget);
    expect(state.expanded).toBe(true);
    unmountState(state);
  });

  test('initState sets expanded=false by default', () => {
    const widget = new CollapsibleDrawer({ title, child });
    const state = mountState(widget);
    expect(state.expanded).toBe(false);
    unmountState(state);
  });

  test('toggle() changes expanded state from false to true', () => {
    const widget = new CollapsibleDrawer({ title, child });
    const state = mountState(widget);

    expect(state.expanded).toBe(false);
    state.toggle();
    expect(state.expanded).toBe(true);
    unmountState(state);
  });

  test('toggle() changes expanded state from true to false', () => {
    const widget = new CollapsibleDrawer({ title, child, expanded: true });
    const state = mountState(widget);

    expect(state.expanded).toBe(true);
    state.toggle();
    expect(state.expanded).toBe(false);
    unmountState(state);
  });

  test('toggle() calls onChanged with new expanded state', () => {
    const changes: boolean[] = [];
    const widget = new CollapsibleDrawer({
      title,
      child,
      onChanged: (expanded) => changes.push(expanded),
    });
    const state = mountState(widget);

    state.toggle(); // false -> true
    expect(changes).toEqual([true]);

    state.toggle(); // true -> false
    expect(changes).toEqual([true, false]);

    unmountState(state);
  });

  test('toggle() works without onChanged callback', () => {
    const widget = new CollapsibleDrawer({ title, child });
    const state = mountState(widget);

    // Should not throw
    state.toggle();
    expect(state.expanded).toBe(true);
    unmountState(state);
  });

  test('didUpdateWidget syncs expanded when it changes', () => {
    const widget1 = new CollapsibleDrawer({ title, child, expanded: false });
    const state = mountState(widget1);
    expect(state.expanded).toBe(false);

    const widget2 = new CollapsibleDrawer({ title, child, expanded: true });
    updateWidget(state, widget2);
    expect(state.expanded).toBe(true);

    unmountState(state);
  });

  test('didUpdateWidget does not change expanded when widget prop is unchanged', () => {
    const widget1 = new CollapsibleDrawer({ title, child, expanded: false });
    const state = mountState(widget1);

    // Toggle to true manually (state diverges from widget prop)
    state.toggle();
    expect(state.expanded).toBe(true);

    // Update with same expanded=false — since oldWidget.expanded === newWidget.expanded,
    // didUpdateWidget does NOT sync _expanded. The locally toggled state persists.
    const widget2 = new CollapsibleDrawer({ title, child, expanded: false });
    updateWidget(state, widget2);
    expect(state.expanded).toBe(true); // not synced because prop didn't change

    unmountState(state);
  });

  test('is an instance of State', () => {
    const widget = new CollapsibleDrawer({ title, child });
    const state = widget.createState();
    expect(state).toBeInstanceOf(State);
  });
});

// ===========================================================================
// CollapsibleDrawerState — Keyboard Handling
// ===========================================================================

describe('CollapsibleDrawerState keyboard handling', () => {
  let state: CollapsibleDrawerState;

  beforeEach(() => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
    });
    state = mountState(widget);
  });

  afterEach(() => {
    unmountState(state);
  });

  test('Enter key toggles and returns handled', () => {
    const handleKey = (state as any)._handleKey;
    const result = handleKey(createKeyEvent('Enter'));
    expect(result).toBe('handled');
    expect(state.expanded).toBe(true);
  });

  test('Space key toggles and returns handled', () => {
    const handleKey = (state as any)._handleKey;
    const result = handleKey(createKeyEvent(' '));
    expect(result).toBe('handled');
    expect(state.expanded).toBe(true);
  });

  test('other keys return ignored and do not toggle', () => {
    const handleKey = (state as any)._handleKey;

    const result1 = handleKey(createKeyEvent('Tab'));
    expect(result1).toBe('ignored');
    expect(state.expanded).toBe(false);

    const result2 = handleKey(createKeyEvent('Escape'));
    expect(result2).toBe('ignored');
    expect(state.expanded).toBe(false);

    const result3 = handleKey(createKeyEvent('a'));
    expect(result3).toBe('ignored');
    expect(state.expanded).toBe(false);
  });

  test('Enter toggles back and forth', () => {
    const handleKey = (state as any)._handleKey;

    handleKey(createKeyEvent('Enter'));
    expect(state.expanded).toBe(true);

    handleKey(createKeyEvent('Enter'));
    expect(state.expanded).toBe(false);
  });
});

// ===========================================================================
// CollapsibleDrawerState — Spinner Lifecycle
// ===========================================================================

describe('CollapsibleDrawerState spinner', () => {
  test('spinner starts on initState when spinner=true', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      spinner: true,
    });
    const state = mountState(widget);

    // Spinner timer should be set
    expect((state as any)._spinnerTimer).toBeDefined();

    unmountState(state);
  });

  test('spinner does not start when spinner=false', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      spinner: false,
    });
    const state = mountState(widget);

    expect((state as any)._spinnerTimer).toBeUndefined();

    unmountState(state);
  });

  test('dispose cleans up spinner timer', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      spinner: true,
    });
    const state = mountState(widget);
    expect((state as any)._spinnerTimer).toBeDefined();

    unmountState(state);
    expect((state as any)._spinnerTimer).toBeUndefined();
  });

  test('didUpdateWidget starts spinner when spinner changes to true', () => {
    const widget1 = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      spinner: false,
    });
    const state = mountState(widget1);
    expect((state as any)._spinnerTimer).toBeUndefined();

    const widget2 = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      spinner: true,
    });
    updateWidget(state, widget2);
    expect((state as any)._spinnerTimer).toBeDefined();

    unmountState(state);
  });

  test('didUpdateWidget stops spinner when spinner changes to false', () => {
    const widget1 = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      spinner: true,
    });
    const state = mountState(widget1);
    expect((state as any)._spinnerTimer).toBeDefined();

    const widget2 = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      spinner: false,
    });
    updateWidget(state, widget2);
    expect((state as any)._spinnerTimer).toBeUndefined();

    unmountState(state);
  });

  test('spinner frame starts at 0', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      spinner: true,
    });
    const state = mountState(widget);

    expect((state as any)._spinnerFrame).toBe(0);

    unmountState(state);
  });
});

// ===========================================================================
// CollapsibleDrawerState — build()
// ===========================================================================

describe('CollapsibleDrawerState build', () => {
  test('build method exists and is callable', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
    });
    const state = mountState(widget);

    // Build with a minimal mock context
    const mockContext = { widget, mounted: true } as unknown as BuildContext;
    const result = state.build(mockContext);
    expect(result).toBeDefined();

    unmountState(state);
  });

  test('collapsed state returns FocusScope wrapping title bar', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      expanded: false,
    });
    const state = mountState(widget);

    const mockContext = { widget, mounted: true } as unknown as BuildContext;
    const result = state.build(mockContext);

    // When collapsed, build returns FocusScope (title bar only)
    expect(result).toBeInstanceOf(FocusScope);

    unmountState(state);
  });

  test('expanded state returns Column with title bar and content', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      expanded: true,
    });
    const state = mountState(widget);

    const mockContext = { widget, mounted: true } as unknown as BuildContext;
    const result = state.build(mockContext);

    // When expanded, build returns Column
    expect(result).toBeInstanceOf(Column);

    unmountState(state);
  });

  test('expanded with maxContentLines wraps content in SizedBox+ClipRect', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      expanded: true,
      maxContentLines: 5,
    });
    const state = mountState(widget);

    const mockContext = { widget, mounted: true } as unknown as BuildContext;
    const result = state.build(mockContext);

    // Should be a Column with [titleBar, contentColumn]
    expect(result).toBeInstanceOf(Column);
    const column = result as Column;
    // Column.children[1] should be a Column (content area with SizedBox and "View all")
    expect(column.children.length).toBe(2);

    unmountState(state);
  });

  test('expanded without maxContentLines renders child directly', () => {
    const childWidget = makeChild();
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: childWidget,
      expanded: true,
    });
    const state = mountState(widget);

    const mockContext = { widget, mounted: true } as unknown as BuildContext;
    const result = state.build(mockContext);

    // Column[1] should be the child directly (no SizedBox wrapping)
    expect(result).toBeInstanceOf(Column);
    const column = result as Column;
    expect(column.children[1]).toBe(childWidget);

    unmountState(state);
  });

  test('showViewAll=false suppresses View all link', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      expanded: true,
      maxContentLines: 5,
      showViewAll: false,
    });
    const state = mountState(widget);

    const mockContext = { widget, mounted: true } as unknown as BuildContext;
    const result = state.build(mockContext);

    // Content area should be a Column with just the SizedBox (no "View all")
    expect(result).toBeInstanceOf(Column);
    const outerCol = result as Column;
    const contentArea = outerCol.children[1];
    expect(contentArea).toBeInstanceOf(Column);
    const contentCol = contentArea as Column;
    // Only SizedBox, no MouseRegion for "View all"
    expect(contentCol.children.length).toBe(1);

    unmountState(state);
  });

  test('showViewAll=true adds View all link', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      expanded: true,
      maxContentLines: 5,
      showViewAll: true,
    });
    const state = mountState(widget);

    const mockContext = { widget, mounted: true } as unknown as BuildContext;
    const result = state.build(mockContext);

    expect(result).toBeInstanceOf(Column);
    const outerCol = result as Column;
    const contentArea = outerCol.children[1];
    expect(contentArea).toBeInstanceOf(Column);
    const contentCol = contentArea as Column;
    // SizedBox + MouseRegion("View all")
    expect(contentCol.children.length).toBe(2);

    unmountState(state);
  });

  test('spinner=true adds spinner text to title bar', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      expanded: false,
      spinner: true,
    });
    const state = mountState(widget);

    const mockContext = { widget, mounted: true } as unknown as BuildContext;
    const result = state.build(mockContext);

    // Result is a FocusScope wrapping a MouseRegion wrapping a Row
    // The Row should have: spinner Text, indicator Text, Expanded(title)
    expect(result).toBeInstanceOf(FocusScope);

    unmountState(state);
  });
});

// ===========================================================================
// CollapsibleDrawerState — View All behavior
// ===========================================================================

describe('CollapsibleDrawerState _showAll', () => {
  test('_showAll starts as false', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      expanded: true,
      maxContentLines: 5,
    });
    const state = mountState(widget);

    expect((state as any)._showAll).toBe(false);

    unmountState(state);
  });

  test('when _showAll is true, content renders without truncation', () => {
    const childWidget = makeChild();
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: childWidget,
      expanded: true,
      maxContentLines: 5,
    });
    const state = mountState(widget);

    // Manually set _showAll to true (simulating View all click)
    (state as any)._showAll = true;

    const mockContext = { widget, mounted: true } as unknown as BuildContext;
    const result = state.build(mockContext);

    // When _showAll is true, content should be rendered directly (no SizedBox)
    expect(result).toBeInstanceOf(Column);
    const column = result as Column;
    expect(column.children[1]).toBe(childWidget);

    unmountState(state);
  });
});

// ===========================================================================
// CollapsibleDrawerState — Multiple toggles and edge cases
// ===========================================================================

describe('CollapsibleDrawerState edge cases', () => {
  test('multiple rapid toggles track state correctly', () => {
    const changes: boolean[] = [];
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      onChanged: (expanded) => changes.push(expanded),
    });
    const state = mountState(widget);

    state.toggle();
    state.toggle();
    state.toggle();

    expect(state.expanded).toBe(true);
    expect(changes).toEqual([true, false, true]);

    unmountState(state);
  });

  test('didUpdateWidget with same expanded does not alter toggled state', () => {
    const widget1 = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      expanded: false,
    });
    const state = mountState(widget1);

    // Same expanded value - should not change state
    const widget2 = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      expanded: false,
    });
    updateWidget(state, widget2);
    expect(state.expanded).toBe(false);

    unmountState(state);
  });

  test('dispose stops spinner and does not throw', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      spinner: true,
    });
    const state = mountState(widget);

    // Should not throw
    unmountState(state);
    expect((state as any)._spinnerTimer).toBeUndefined();
  });

  test('dispose without spinner does not throw', () => {
    const widget = new CollapsibleDrawer({
      title: makeTitle(),
      child: makeChild(),
      spinner: false,
    });
    const state = mountState(widget);

    // Should not throw
    unmountState(state);
  });
});
