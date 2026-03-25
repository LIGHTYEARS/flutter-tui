// Listenable, ChangeNotifier, ValueNotifier
// Amp ref: Core reactive primitives (CORE-07 pattern)
// Source: Standard Flutter patterns adapted for Amp TUI

// ---------------------------------------------------------------------------
// Listenable interface
// ---------------------------------------------------------------------------

/**
 * An object that maintains a list of listeners.
 * This is the base interface for all observable objects.
 */
export interface Listenable {
  addListener(callback: () => void): void;
  removeListener(callback: () => void): void;
}

// ---------------------------------------------------------------------------
// ChangeNotifier
// ---------------------------------------------------------------------------

/**
 * A class that can be extended or mixed in to provide change notifications.
 * Maintains a set of listener callbacks and notifies them when data changes.
 *
 * Uses Set<> for O(1) add/remove and safe iteration during notification
 * (removing during iteration is safe with Set since we snapshot before iterating).
 */
export class ChangeNotifier implements Listenable {
  private _listeners: Set<() => void> = new Set();
  private _disposed: boolean = false;

  /** Register a callback to be called when this object changes. */
  addListener(callback: () => void): void {
    if (this._disposed) {
      throw new Error('Cannot add listener to disposed ChangeNotifier');
    }
    this._listeners.add(callback);
  }

  /** Remove a previously registered callback. */
  removeListener(callback: () => void): void {
    if (this._disposed) {
      return; // silently ignore after disposal (matches Flutter behavior)
    }
    this._listeners.delete(callback);
  }

  /** Whether any listeners are currently registered. */
  get hasListeners(): boolean {
    return this._listeners.size > 0;
  }

  /**
   * Notify all registered listeners.
   * Safe against listeners that remove themselves during notification:
   * we snapshot the set before iterating.
   */
  protected notifyListeners(): void {
    if (this._disposed) return;
    // Snapshot to handle removals during iteration
    const snapshot = [...this._listeners];
    for (const listener of snapshot) {
      // Only call if still registered (may have been removed by a prior listener)
      if (this._listeners.has(listener)) {
        listener();
      }
    }
  }

  /**
   * Release all resources. After disposal, no more listeners can be added
   * and notifyListeners becomes a no-op.
   */
  dispose(): void {
    this._listeners.clear();
    this._disposed = true;
  }
}

// ---------------------------------------------------------------------------
// ValueNotifier<T>
// ---------------------------------------------------------------------------

/**
 * A ChangeNotifier that holds a single value and notifies when it changes.
 * Uses strict inequality (!==) for change detection.
 */
export class ValueNotifier<T> extends ChangeNotifier {
  private _value: T;

  constructor(value: T) {
    super();
    this._value = value;
  }

  /** The current value. */
  get value(): T {
    return this._value;
  }

  /** Set a new value. If different from the current value (!==), notifies listeners. */
  set value(newValue: T) {
    if (this._value !== newValue) {
      this._value = newValue;
      this.notifyListeners();
    }
  }
}
