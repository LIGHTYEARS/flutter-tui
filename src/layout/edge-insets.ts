// EdgeInsets — immutable edge insets for padding, margin, etc.
// Amp ref: class g8 (widgets-catalog.md)
// All values are integers (Math.round).

/**
 * Immutable set of edge insets: left, top, right, bottom.
 * All values are rounded to integers on construction.
 *
 * Amp ref: class g8
 *   static all(v), symmetric(h,v), horizontal(v), vertical(v), only({...})
 *   get horizontal(), get vertical()
 */
export class EdgeInsets {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;

  constructor(left: number, top: number, right: number, bottom: number) {
    this.left = Math.round(left);
    this.top = Math.round(top);
    this.right = Math.round(right);
    this.bottom = Math.round(bottom);
  }

  // --- Factory constructors ---

  static readonly zero: EdgeInsets = new EdgeInsets(0, 0, 0, 0);

  /** All four edges set to the same value. */
  static all(value: number): EdgeInsets {
    return new EdgeInsets(value, value, value, value);
  }

  /** Symmetric: horizontal applies to left/right, vertical to top/bottom. */
  static symmetric(opts?: { horizontal?: number; vertical?: number }): EdgeInsets {
    const h = opts?.horizontal ?? 0;
    const v = opts?.vertical ?? 0;
    return new EdgeInsets(h, v, h, v);
  }

  /** Left and right set to the given value, top and bottom are 0. */
  static horizontal(value: number): EdgeInsets {
    return new EdgeInsets(value, 0, value, 0);
  }

  /** Top and bottom set to the given value, left and right are 0. */
  static vertical(value: number): EdgeInsets {
    return new EdgeInsets(0, value, 0, value);
  }

  /** Set individual edges; omitted edges default to 0. */
  static only(opts?: {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
  }): EdgeInsets {
    return new EdgeInsets(
      opts?.left ?? 0,
      opts?.top ?? 0,
      opts?.right ?? 0,
      opts?.bottom ?? 0,
    );
  }

  // --- Computed properties ---

  /** Sum of left and right insets. */
  get totalHorizontal(): number {
    return this.left + this.right;
  }

  /** Sum of left and right insets. Alias matching Amp's g8.horizontal. */
  get horizontal(): number {
    return this.left + this.right;
  }

  /** Sum of top and bottom insets. */
  get totalVertical(): number {
    return this.top + this.bottom;
  }

  /** Sum of top and bottom insets. Alias matching Amp's g8.vertical. */
  get vertical(): number {
    return this.top + this.bottom;
  }

  // --- Equality ---

  equals(other: EdgeInsets): boolean {
    return (
      this.left === other.left &&
      this.top === other.top &&
      this.right === other.right &&
      this.bottom === other.bottom
    );
  }

  toString(): string {
    if (this.left === this.right && this.top === this.bottom) {
      if (this.left === this.top) {
        return `EdgeInsets.all(${this.left})`;
      }
      return `EdgeInsets.symmetric(h: ${this.left}, v: ${this.top})`;
    }
    return `EdgeInsets(${this.left}, ${this.top}, ${this.right}, ${this.bottom})`;
  }
}
