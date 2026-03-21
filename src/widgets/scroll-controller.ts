// ScrollController - manages scroll state for scroll views
// Amp ref: Lg class, amp-strings.txt

/**
 * Controls scroll position and manages follow mode for auto-scrolling.
 * Listeners are notified whenever the scroll offset changes.
 *
 * Amp ref: class Lg
 */
export class ScrollController {
  private _offset: number = 0;
  private _maxScrollExtent: number = 0;
  private _listeners: Set<() => void> = new Set();
  private _followMode: boolean = true;

  /** Current scroll offset in the main axis. */
  get offset(): number {
    return this._offset;
  }

  /** Maximum scroll extent (childSize - viewportSize), always >= 0. */
  get maxScrollExtent(): number {
    return this._maxScrollExtent;
  }

  /** Whether the scroll position is at or near the bottom (within 1px tolerance). */
  get atBottom(): boolean {
    return this._offset >= this._maxScrollExtent - 1;
  }

  /** Whether follow mode is active (auto-scroll to end on content changes). */
  get followMode(): boolean {
    return this._followMode;
  }

  /**
   * Jump to a specific offset, clamped to [0, maxScrollExtent].
   * Notifies all listeners if the offset changes.
   */
  jumpTo(offset: number): void {
    const clamped = Math.max(0, Math.min(offset, this._maxScrollExtent));
    if (clamped !== this._offset) {
      this._offset = clamped;
      this._notifyListeners();
    }
  }

  /**
   * Scroll by a delta amount relative to the current offset.
   * Positive delta scrolls down/right, negative scrolls up/left.
   */
  scrollBy(delta: number): void {
    this.jumpTo(this._offset + delta);
  }

  /**
   * Update the maximum scroll extent.
   * If followMode is active and we were at the bottom, auto-scroll to the new end.
   */
  updateMaxScrollExtent(extent: number): void {
    const wasAtBottom = this.atBottom;
    this._maxScrollExtent = Math.max(0, extent);

    // Clamp current offset if it exceeds new max
    if (this._offset > this._maxScrollExtent) {
      this._offset = this._maxScrollExtent;
    }

    // Auto-scroll if follow mode is on and we were at the bottom
    if (this._followMode && wasAtBottom) {
      this._offset = this._maxScrollExtent;
    }

    this._notifyListeners();
  }

  /** Disable follow mode (e.g., when user manually scrolls up). */
  disableFollowMode(): void {
    this._followMode = false;
  }

  /** Re-enable follow mode. */
  enableFollowMode(): void {
    this._followMode = true;
  }

  /** Add a listener that is called whenever the scroll state changes. */
  addListener(fn: () => void): void {
    this._listeners.add(fn);
  }

  /** Remove a previously-added listener. */
  removeListener(fn: () => void): void {
    this._listeners.delete(fn);
  }

  /** Remove all listeners and reset state. */
  dispose(): void {
    this._listeners.clear();
  }

  private _notifyListeners(): void {
    for (const fn of this._listeners) {
      fn();
    }
  }
}
