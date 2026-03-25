// Tests for Listenable, ChangeNotifier, ValueNotifier

import { describe, expect, it, mock } from 'bun:test';
import { ChangeNotifier, ValueNotifier } from '../listenable';

// ---------------------------------------------------------------------------
// ChangeNotifier tests
// ---------------------------------------------------------------------------

describe('ChangeNotifier', () => {
  it('addListener and notifyListeners calls all listeners', () => {
    class TestNotifier extends ChangeNotifier {
      notify() {
        this.notifyListeners();
      }
    }

    const notifier = new TestNotifier();
    const listener1 = mock(() => {});
    const listener2 = mock(() => {});

    notifier.addListener(listener1);
    notifier.addListener(listener2);
    notifier.notify();

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('removeListener stops callbacks', () => {
    class TestNotifier extends ChangeNotifier {
      notify() {
        this.notifyListeners();
      }
    }

    const notifier = new TestNotifier();
    const listener = mock(() => {});

    notifier.addListener(listener);
    notifier.notify();
    expect(listener).toHaveBeenCalledTimes(1);

    notifier.removeListener(listener);
    notifier.notify();
    expect(listener).toHaveBeenCalledTimes(1); // not called again
  });

  it('remove during notify does not crash', () => {
    class TestNotifier extends ChangeNotifier {
      notify() {
        this.notifyListeners();
      }
    }

    const notifier = new TestNotifier();
    const listener2 = mock(() => {});

    // listener1 removes listener2 during notification
    const listener1 = mock(() => {
      notifier.removeListener(listener2);
    });

    notifier.addListener(listener1);
    notifier.addListener(listener2);

    // Should not crash -- snapshot-based iteration protects against this
    expect(() => notifier.notify()).not.toThrow();
    expect(listener1).toHaveBeenCalledTimes(1);
    // listener2 may or may not be called depending on snapshot timing,
    // but it must not crash. Since we snapshot before iterating and check
    // if still in set, listener2 should NOT be called because listener1
    // removed it before listener2's turn.
    expect(listener2).toHaveBeenCalledTimes(0);
  });

  it('dispose prevents further use', () => {
    class TestNotifier extends ChangeNotifier {
      notify() {
        this.notifyListeners();
      }
    }

    const notifier = new TestNotifier();
    const listener = mock(() => {});

    notifier.addListener(listener);
    notifier.dispose();

    // Adding after dispose throws
    expect(() => notifier.addListener(listener)).toThrow();

    // notifyListeners is a no-op after dispose
    notifier.notify();
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('dispose clears all listeners', () => {
    const notifier = new ChangeNotifier();
    const listener = mock(() => {});
    notifier.addListener(listener);
    expect(notifier.hasListeners).toBe(true);
    notifier.dispose();
    expect(notifier.hasListeners).toBe(false);
  });

  it('removeListener after dispose does not throw', () => {
    const notifier = new ChangeNotifier();
    const listener = mock(() => {});
    notifier.addListener(listener);
    notifier.dispose();
    // Should silently succeed (matches Flutter)
    expect(() => notifier.removeListener(listener)).not.toThrow();
  });

  it('hasListeners reflects current state', () => {
    const notifier = new ChangeNotifier();
    expect(notifier.hasListeners).toBe(false);

    const listener = mock(() => {});
    notifier.addListener(listener);
    expect(notifier.hasListeners).toBe(true);

    notifier.removeListener(listener);
    expect(notifier.hasListeners).toBe(false);
  });

  it('adding same listener twice is deduplicated (Set behavior)', () => {
    class TestNotifier extends ChangeNotifier {
      notify() {
        this.notifyListeners();
      }
    }

    const notifier = new TestNotifier();
    const listener = mock(() => {});

    notifier.addListener(listener);
    notifier.addListener(listener); // duplicate
    notifier.notify();

    // Set deduplicates, so listener called only once
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifyListeners with no listeners does not crash', () => {
    class TestNotifier extends ChangeNotifier {
      notify() {
        this.notifyListeners();
      }
    }

    const notifier = new TestNotifier();
    expect(() => notifier.notify()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ValueNotifier tests
// ---------------------------------------------------------------------------

describe('ValueNotifier', () => {
  it('get/set value', () => {
    const notifier = new ValueNotifier(42);
    expect(notifier.value).toBe(42);

    notifier.value = 100;
    expect(notifier.value).toBe(100);
  });

  it('notifies on value change', () => {
    const notifier = new ValueNotifier('hello');
    const listener = mock(() => {});

    notifier.addListener(listener);
    notifier.value = 'world';

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does NOT notify if same value', () => {
    const notifier = new ValueNotifier(10);
    const listener = mock(() => {});

    notifier.addListener(listener);
    notifier.value = 10; // same value

    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('multiple changes notify each time', () => {
    const notifier = new ValueNotifier(0);
    const listener = mock(() => {});

    notifier.addListener(listener);
    notifier.value = 1;
    notifier.value = 2;
    notifier.value = 3;

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('uses strict inequality for change detection', () => {
    // Objects are compared by reference
    const obj1 = { a: 1 };
    const obj2 = { a: 1 };
    const notifier = new ValueNotifier(obj1);
    const listener = mock(() => {});

    notifier.addListener(listener);

    // Different reference, same shape -> notifies
    notifier.value = obj2;
    expect(listener).toHaveBeenCalledTimes(1);

    // Same reference -> does NOT notify
    notifier.value = obj2;
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('hasListeners reflects current state', () => {
    const notifier = new ValueNotifier(0);
    expect(notifier.hasListeners).toBe(false);

    const listener = () => {};
    notifier.addListener(listener);
    expect(notifier.hasListeners).toBe(true);

    notifier.removeListener(listener);
    expect(notifier.hasListeners).toBe(false);
  });

  it('dispose prevents value change notifications', () => {
    const notifier = new ValueNotifier(0);
    const listener = mock(() => {});
    notifier.addListener(listener);
    notifier.dispose();

    // After dispose, setting value still updates internal value but no notification
    // (notifyListeners is a no-op and _disposed is true)
    notifier.value = 99;
    expect(listener).toHaveBeenCalledTimes(0);
    // Value should still update since the setter writes before notifying
    expect(notifier.value).toBe(99);
  });

  it('works with boolean values', () => {
    const notifier = new ValueNotifier(false);
    const listener = mock(() => {});

    notifier.addListener(listener);
    notifier.value = true;
    expect(listener).toHaveBeenCalledTimes(1);

    notifier.value = true; // same
    expect(listener).toHaveBeenCalledTimes(1);

    notifier.value = false; // changed
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('works with null/undefined', () => {
    const notifier = new ValueNotifier<string | null>(null);
    const listener = mock(() => {});

    notifier.addListener(listener);
    notifier.value = 'hello';
    expect(listener).toHaveBeenCalledTimes(1);

    notifier.value = null;
    expect(listener).toHaveBeenCalledTimes(2);

    notifier.value = null; // same
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
