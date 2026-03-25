// Core value types for the TUI framework.
// All coordinates are integer cell positions (Math.round).
// Amp ref: amp-strings.txt — RenderBox uses integer offsets/sizes

/**
 * Represents a 2D position in terminal cell coordinates (col, row).
 * Immutable value type with integer arithmetic.
 */
export class Offset {
  readonly col: number;
  readonly row: number;

  constructor(col: number, row: number) {
    this.col = Math.round(col);
    this.row = Math.round(row);
  }

  static readonly zero: Offset = new Offset(0, 0);

  add(other: Offset): Offset {
    return new Offset(this.col + other.col, this.row + other.row);
  }

  subtract(other: Offset): Offset {
    return new Offset(this.col - other.col, this.row - other.row);
  }

  equals(other: Offset): boolean {
    return this.col === other.col && this.row === other.row;
  }

  toString(): string {
    return `Offset(${this.col}, ${this.row})`;
  }
}

/**
 * Represents a 2D size in terminal cell dimensions (width, height).
 * Immutable value type with integer arithmetic.
 */
export class Size {
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = Math.round(width);
    this.height = Math.round(height);
  }

  static readonly zero: Size = new Size(0, 0);

  /**
   * Returns true if the given offset is within the bounds of this size.
   * The offset must satisfy 0 <= col < width && 0 <= row < height.
   */
  contains(offset: Offset): boolean {
    return (
      offset.col >= 0 &&
      offset.col < this.width &&
      offset.row >= 0 &&
      offset.row < this.height
    );
  }

  equals(other: Size): boolean {
    return this.width === other.width && this.height === other.height;
  }

  toString(): string {
    return `Size(${this.width}, ${this.height})`;
  }
}

/**
 * Represents a rectangle in terminal cell coordinates.
 * Defined by (left, top, width, height), all integers.
 */
export class Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;

  constructor(left: number, top: number, width: number, height: number) {
    this.left = Math.round(left);
    this.top = Math.round(top);
    this.width = Math.round(width);
    this.height = Math.round(height);
  }

  static readonly zero: Rect = new Rect(0, 0, 0, 0);

  /**
   * Creates a Rect from left, top, right, bottom coordinates.
   */
  static fromLTRB(
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): Rect {
    return new Rect(left, top, right - left, bottom - top);
  }

  get right(): number {
    return this.left + this.width;
  }

  get bottom(): number {
    return this.top + this.height;
  }

  get size(): Size {
    return new Size(this.width, this.height);
  }

  get topLeft(): Offset {
    return new Offset(this.left, this.top);
  }

  get bottomRight(): Offset {
    return new Offset(this.right, this.bottom);
  }

  /**
   * Returns true if the given offset is within this rectangle.
   * The offset must satisfy left <= col < right && top <= row < bottom.
   */
  contains(offset: Offset): boolean {
    return (
      offset.col >= this.left &&
      offset.col < this.right &&
      offset.row >= this.top &&
      offset.row < this.bottom
    );
  }

  /**
   * Returns the intersection of this rectangle with another.
   * If they don't overlap, returns a zero-area Rect.
   */
  intersect(other: Rect): Rect {
    const newLeft = Math.max(this.left, other.left);
    const newTop = Math.max(this.top, other.top);
    const newRight = Math.min(this.right, other.right);
    const newBottom = Math.min(this.bottom, other.bottom);

    if (newRight <= newLeft || newBottom <= newTop) {
      return new Rect(newLeft, newTop, 0, 0);
    }

    return Rect.fromLTRB(newLeft, newTop, newRight, newBottom);
  }

  equals(other: Rect): boolean {
    return (
      this.left === other.left &&
      this.top === other.top &&
      this.width === other.width &&
      this.height === other.height
    );
  }

  toString(): string {
    return `Rect(${this.left}, ${this.top}, ${this.width}, ${this.height})`;
  }
}
