// Tests for Widget, StatelessWidget, StatefulWidget, State, InheritedWidget
// Verifies Amp-faithful lifecycle behavior

import { describe, expect, it, mock } from 'bun:test';
import {
  Widget,
  StatelessWidget,
  StatefulWidget,
  State,
  InheritedWidget,
  BuildContext,
} from '../widget';
import { ValueKey, UniqueKey, Key } from '../../core/key';

// ---------------------------------------------------------------------------
// Concrete test subclasses
// ---------------------------------------------------------------------------

class TestStatelessWidget extends StatelessWidget {
  readonly label: string;

  constructor(opts?: { key?: Key; label?: string }) {
    super(opts);
    this.label = opts?.label ?? 'test';
  }

  build(_context: BuildContext): Widget {
    // In real use this returns another widget; for testing return self (it's a Widget)
    return this;
  }
}

class TestStatefulWidget extends StatefulWidget {
  readonly label: string;

  constructor(opts?: { key?: Key; label?: string }) {
    super(opts);
    this.label = opts?.label ?? 'test';
  }

  createState(): TestState {
    return new TestState();
  }
}

class TestState extends State<TestStatefulWidget> {
  buildCount = 0;
  initStateCalled = false;
  didUpdateWidgetCalled = false;
  disposeCalled = false;
  lastOldWidget?: TestStatefulWidget;

  initState(): void {
    this.initStateCalled = true;
  }

  didUpdateWidget(oldWidget: TestStatefulWidget): void {
    this.didUpdateWidgetCalled = true;
    this.lastOldWidget = oldWidget;
  }

  build(_context: BuildContext): Widget {
    this.buildCount++;
    return new TestStatelessWidget({ label: 'from-state' });
  }

  dispose(): void {
    this.disposeCalled = true;
  }
}

class AnotherStatelessWidget extends StatelessWidget {
  build(_context: BuildContext): Widget {
    return this;
  }
}

class TestInheritedWidget extends InheritedWidget {
  readonly data: number;

  constructor(opts: { key?: Key; child: Widget; data: number }) {
    super({ key: opts.key, child: opts.child });
    this.data = opts.data;
  }

  updateShouldNotify(oldWidget: InheritedWidget): boolean {
    return this.data !== (oldWidget as TestInheritedWidget).data;
  }
}

// ---------------------------------------------------------------------------
// Widget.canUpdate tests
// ---------------------------------------------------------------------------

describe('Widget.canUpdate', () => {
  it('same type, no keys -> true', () => {
    const a = new TestStatelessWidget();
    const b = new TestStatelessWidget();
    expect(Widget.canUpdate(a, b)).toBe(true);
  });

  it('same type, same key value -> true', () => {
    const a = new TestStatelessWidget({ key: new ValueKey('id1') });
    const b = new TestStatelessWidget({ key: new ValueKey('id1') });
    expect(Widget.canUpdate(a, b)).toBe(true);
  });

  it('same type, different key values -> false', () => {
    const a = new TestStatelessWidget({ key: new ValueKey('id1') });
    const b = new TestStatelessWidget({ key: new ValueKey('id2') });
    expect(Widget.canUpdate(a, b)).toBe(false);
  });

  it('different type, no keys -> false', () => {
    const a = new TestStatelessWidget();
    const b = new AnotherStatelessWidget();
    expect(Widget.canUpdate(a, b)).toBe(false);
  });

  it('different type, same key -> false', () => {
    const a = new TestStatelessWidget({ key: new ValueKey('x') });
    const b = new AnotherStatelessWidget({ key: new ValueKey('x') });
    expect(Widget.canUpdate(a, b)).toBe(false);
  });

  it('both null keys (undefined) -> true', () => {
    const a = new TestStatelessWidget();
    const b = new TestStatelessWidget();
    // Both have key === undefined
    expect(a.key).toBeUndefined();
    expect(b.key).toBeUndefined();
    expect(Widget.canUpdate(a, b)).toBe(true);
  });

  it('one has key, other does not -> false', () => {
    const a = new TestStatelessWidget({ key: new ValueKey('x') });
    const b = new TestStatelessWidget();
    expect(Widget.canUpdate(a, b)).toBe(false);
    expect(Widget.canUpdate(b, a)).toBe(false);
  });

  it('instance method delegates to static', () => {
    const a = new TestStatelessWidget({ key: new ValueKey('y') });
    const b = new TestStatelessWidget({ key: new ValueKey('y') });
    expect(a.canUpdate(b)).toBe(true);
  });

  it('UniqueKey: different instances -> false', () => {
    const a = new TestStatelessWidget({ key: new UniqueKey() });
    const b = new TestStatelessWidget({ key: new UniqueKey() });
    expect(Widget.canUpdate(a, b)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// StatelessWidget tests
// ---------------------------------------------------------------------------

describe('StatelessWidget', () => {
  it('requires build() implementation', () => {
    const w = new TestStatelessWidget({ label: 'hello' });
    const mockContext = { widget: w, mounted: true } as BuildContext;
    const result = w.build(mockContext);
    expect(result).toBe(w); // our test impl returns self
  });

  it('stores key from constructor', () => {
    const key = new ValueKey('abc');
    const w = new TestStatelessWidget({ key });
    expect(w.key).toBe(key);
  });

  it('createElement returns object with widget reference', () => {
    const w = new TestStatelessWidget();
    const elem = w.createElement();
    expect(elem.widget).toBe(w);
  });

  it('toString includes class name', () => {
    const w = new TestStatelessWidget();
    expect(w.toString()).toContain('TestStatelessWidget');
  });
});

// ---------------------------------------------------------------------------
// StatefulWidget tests
// ---------------------------------------------------------------------------

describe('StatefulWidget', () => {
  it('requires createState() implementation', () => {
    const w = new TestStatefulWidget({ label: 'counter' });
    const state = w.createState();
    expect(state).toBeInstanceOf(TestState);
  });

  it('stores key from constructor', () => {
    const key = new ValueKey(42);
    const w = new TestStatefulWidget({ key });
    expect(w.key).toBe(key);
  });

  it('createElement returns object with widget reference', () => {
    const w = new TestStatefulWidget();
    const elem = w.createElement();
    expect(elem.widget).toBe(w);
  });
});

// ---------------------------------------------------------------------------
// State lifecycle tests
// ---------------------------------------------------------------------------

describe('State', () => {
  it('initState is called during _mount', () => {
    const w = new TestStatefulWidget();
    const state = new TestState();
    const mockContext = { widget: w, mounted: true } as BuildContext;

    expect(state.initStateCalled).toBe(false);
    state._mount(w, mockContext);
    expect(state.initStateCalled).toBe(true);
  });

  it('mounted is true after _mount, false after _unmount', () => {
    const w = new TestStatefulWidget();
    const state = new TestState();
    const mockContext = { widget: w, mounted: true } as BuildContext;

    expect(state.mounted).toBe(false);
    state._mount(w, mockContext);
    expect(state.mounted).toBe(true);
    state._unmount();
    expect(state.mounted).toBe(false);
  });

  it('widget getter returns the mounted widget', () => {
    const w = new TestStatefulWidget({ label: 'original' });
    const state = new TestState();
    const mockContext = { widget: w, mounted: true } as BuildContext;

    state._mount(w, mockContext);
    expect(state.widget).toBe(w);
    expect(state.widget.label).toBe('original');
  });

  it('didUpdateWidget is called during _update with old widget', () => {
    const w1 = new TestStatefulWidget({ label: 'v1' });
    const w2 = new TestStatefulWidget({ label: 'v2' });
    const state = new TestState();
    const mockContext = { widget: w1, mounted: true } as BuildContext;

    state._mount(w1, mockContext);
    expect(state.didUpdateWidgetCalled).toBe(false);

    state._update(w2);
    expect(state.didUpdateWidgetCalled).toBe(true);
    expect(state.lastOldWidget).toBe(w1);
    expect(state.widget).toBe(w2);
  });

  it('dispose is called during _unmount', () => {
    const w = new TestStatefulWidget();
    const state = new TestState();
    const mockContext = { widget: w, mounted: true } as BuildContext;

    state._mount(w, mockContext);
    expect(state.disposeCalled).toBe(false);
    state._unmount();
    expect(state.disposeCalled).toBe(true);
  });

  it('setState calls the callback', () => {
    const w = new TestStatefulWidget();
    const state = new TestState();
    const mockMarkNeedsBuild = mock(() => {});
    const mockContext = {
      widget: w,
      mounted: true,
      markNeedsBuild: mockMarkNeedsBuild,
    } as unknown as BuildContext;

    state._mount(w, mockContext);

    let callbackCalled = false;
    state.setState(() => {
      callbackCalled = true;
    });
    expect(callbackCalled).toBe(true);
  });

  it('setState marks element as needing build', () => {
    const w = new TestStatefulWidget();
    const state = new TestState();
    const mockMarkNeedsBuild = mock(() => {});
    const mockContext = {
      widget: w,
      mounted: true,
      markNeedsBuild: mockMarkNeedsBuild,
    } as unknown as BuildContext;

    state._mount(w, mockContext);
    state.setState();
    expect(mockMarkNeedsBuild).toHaveBeenCalledTimes(1);
  });

  it('setState throws after dispose', () => {
    const w = new TestStatefulWidget();
    const state = new TestState();
    const mockContext = { widget: w, mounted: true } as BuildContext;

    state._mount(w, mockContext);
    state._unmount();

    expect(() => state.setState()).toThrow('setState() called after dispose()');
  });

  it('setState with no callback still marks dirty', () => {
    const w = new TestStatefulWidget();
    const state = new TestState();
    const mockMarkNeedsBuild = mock(() => {});
    const mockContext = {
      widget: w,
      mounted: true,
      markNeedsBuild: mockMarkNeedsBuild,
    } as unknown as BuildContext;

    state._mount(w, mockContext);
    state.setState(); // no callback
    expect(mockMarkNeedsBuild).toHaveBeenCalledTimes(1);
  });

  it('build returns a widget', () => {
    const w = new TestStatefulWidget();
    const state = new TestState();
    const mockContext = { widget: w, mounted: true } as BuildContext;
    state._mount(w, mockContext);

    const result = state.build(mockContext);
    expect(result).toBeInstanceOf(Widget);
  });

  it('lifecycle method existence', () => {
    const state = new TestState();
    expect(typeof state.initState).toBe('function');
    expect(typeof state.didUpdateWidget).toBe('function');
    expect(typeof state.dispose).toBe('function');
    expect(typeof state.build).toBe('function');
    expect(typeof state.setState).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// InheritedWidget tests
// ---------------------------------------------------------------------------

describe('InheritedWidget', () => {
  it('stores child widget', () => {
    const child = new TestStatelessWidget();
    const inherited = new TestInheritedWidget({ child, data: 42 });
    expect(inherited.child).toBe(child);
  });

  it('stores key', () => {
    const child = new TestStatelessWidget();
    const key = new ValueKey('inh');
    const inherited = new TestInheritedWidget({ key, child, data: 1 });
    expect(inherited.key).toBe(key);
  });

  it('updateShouldNotify returns true when data changes', () => {
    const child = new TestStatelessWidget();
    const old = new TestInheritedWidget({ child, data: 1 });
    const nw = new TestInheritedWidget({ child, data: 2 });
    expect(nw.updateShouldNotify(old)).toBe(true);
  });

  it('updateShouldNotify returns false when data is same', () => {
    const child = new TestStatelessWidget();
    const old = new TestInheritedWidget({ child, data: 5 });
    const nw = new TestInheritedWidget({ child, data: 5 });
    expect(nw.updateShouldNotify(old)).toBe(false);
  });

  it('createElement returns object with widget reference', () => {
    const child = new TestStatelessWidget();
    const inherited = new TestInheritedWidget({ child, data: 1 });
    const elem = inherited.createElement();
    expect(elem.widget).toBe(inherited);
  });
});

// ---------------------------------------------------------------------------
// Widget abstractness tests
// ---------------------------------------------------------------------------

describe('Widget (abstract)', () => {
  it('cannot be instantiated directly', () => {
    // @ts-expect-error -- testing runtime enforcement of abstractness
    expect(() => new Widget()).toThrow(
      'Widget is abstract and cannot be instantiated directly'
    );
  });
});
