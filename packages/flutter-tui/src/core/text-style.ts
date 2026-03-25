// Amp ref: amp-strings.txt:529716 (m0 - TextStyle)
// Immutable style descriptor for text rendering.

import { Color } from './color.js';

export class TextStyle {
  readonly foreground?: Color;
  readonly background?: Color;
  readonly bold?: boolean;
  readonly dim?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly strikethrough?: boolean;
  readonly inverse?: boolean;
  readonly hidden?: boolean;

  constructor(opts?: {
    foreground?: Color;
    background?: Color;
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    hidden?: boolean;
  }) {
    this.foreground = opts?.foreground;
    this.background = opts?.background;
    this.bold = opts?.bold;
    this.dim = opts?.dim;
    this.italic = opts?.italic;
    this.underline = opts?.underline;
    this.strikethrough = opts?.strikethrough;
    this.inverse = opts?.inverse;
    this.hidden = opts?.hidden;
  }

  /**
   * Merge: returns a new TextStyle where `other` overrides `this` for defined fields.
   * Fields that are undefined in `other` keep the value from `this`.
   */
  merge(other: TextStyle): TextStyle {
    return new TextStyle({
      foreground: other.foreground !== undefined ? other.foreground : this.foreground,
      background: other.background !== undefined ? other.background : this.background,
      bold: other.bold !== undefined ? other.bold : this.bold,
      dim: other.dim !== undefined ? other.dim : this.dim,
      italic: other.italic !== undefined ? other.italic : this.italic,
      underline: other.underline !== undefined ? other.underline : this.underline,
      strikethrough: other.strikethrough !== undefined ? other.strikethrough : this.strikethrough,
      inverse: other.inverse !== undefined ? other.inverse : this.inverse,
      hidden: other.hidden !== undefined ? other.hidden : this.hidden,
    });
  }

  /**
   * CopyWith: returns a new TextStyle with only the specified fields overridden.
   * Uses undefined-checking — only fields explicitly provided in `overrides` replace
   * the corresponding field from `this`. Unspecified fields keep their current value.
   * Amp ref: m0.copyWith
   */
  copyWith(overrides?: {
    foreground?: Color;
    background?: Color;
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    hidden?: boolean;
  }): TextStyle {
    return new TextStyle({
      foreground: overrides?.foreground !== undefined ? overrides.foreground : this.foreground,
      background: overrides?.background !== undefined ? overrides.background : this.background,
      bold: overrides?.bold !== undefined ? overrides.bold : this.bold,
      dim: overrides?.dim !== undefined ? overrides.dim : this.dim,
      italic: overrides?.italic !== undefined ? overrides.italic : this.italic,
      underline: overrides?.underline !== undefined ? overrides.underline : this.underline,
      strikethrough: overrides?.strikethrough !== undefined ? overrides.strikethrough : this.strikethrough,
      inverse: overrides?.inverse !== undefined ? overrides.inverse : this.inverse,
      hidden: overrides?.hidden !== undefined ? overrides.hidden : this.hidden,
    });
  }

  // -- Static factories (Amp ref: m0 static methods) --

  /** Plain text style, optionally with a foreground color. */
  static normal(color?: Color): TextStyle {
    return new TextStyle(color !== undefined ? { foreground: color } : undefined);
  }

  /** Bold text style, optionally with a foreground color. */
  static bold(color?: Color): TextStyle {
    return new TextStyle({ bold: true, foreground: color });
  }

  /** Italic text style, optionally with a foreground color. */
  static italic(color?: Color): TextStyle {
    return new TextStyle({ italic: true, foreground: color });
  }

  /** Underline text style, optionally with a foreground color. */
  static underline(color?: Color): TextStyle {
    return new TextStyle({ underline: true, foreground: color });
  }

  /** Just a foreground color, no other styling. */
  static colored(color: Color): TextStyle {
    return new TextStyle({ foreground: color });
  }

  /** Just a background color, no other styling. */
  static background(color: Color): TextStyle {
    return new TextStyle({ background: color });
  }

  /**
   * Produce SGR parameter string for this style (e.g. "1;31;42" for bold red on green).
   * Only includes attributes that are explicitly set (not undefined).
   * Returns empty string if no attributes are set.
   */
  toSgr(): string {
    const parts: string[] = [];

    // Boolean attributes
    if (this.bold === true) parts.push('1');
    if (this.dim === true) parts.push('2');
    if (this.italic === true) parts.push('3');
    if (this.underline === true) parts.push('4');
    if (this.inverse === true) parts.push('7');
    if (this.hidden === true) parts.push('8');
    if (this.strikethrough === true) parts.push('9');

    // Colors
    if (this.foreground !== undefined) parts.push(this.foreground.toSgrFg());
    if (this.background !== undefined) parts.push(this.background.toSgrBg());

    return parts.join(';');
  }

  /** Check if any attribute is set (not undefined). */
  get isEmpty(): boolean {
    return (
      this.foreground === undefined &&
      this.background === undefined &&
      this.bold === undefined &&
      this.dim === undefined &&
      this.italic === undefined &&
      this.underline === undefined &&
      this.strikethrough === undefined &&
      this.inverse === undefined &&
      this.hidden === undefined
    );
  }

  equals(other: TextStyle): boolean {
    // Compare boolean attributes
    if (this.bold !== other.bold) return false;
    if (this.dim !== other.dim) return false;
    if (this.italic !== other.italic) return false;
    if (this.underline !== other.underline) return false;
    if (this.strikethrough !== other.strikethrough) return false;
    if (this.inverse !== other.inverse) return false;
    if (this.hidden !== other.hidden) return false;

    // Compare foreground
    if (this.foreground === undefined && other.foreground === undefined) {
      // both undefined, ok
    } else if (this.foreground !== undefined && other.foreground !== undefined) {
      if (!this.foreground.equals(other.foreground)) return false;
    } else {
      return false;
    }

    // Compare background
    if (this.background === undefined && other.background === undefined) {
      // both undefined, ok
    } else if (this.background !== undefined && other.background !== undefined) {
      if (!this.background.equals(other.background)) return false;
    } else {
      return false;
    }

    return true;
  }

  toString(): string {
    const parts: string[] = [];
    if (this.bold !== undefined) parts.push(`bold: ${this.bold}`);
    if (this.dim !== undefined) parts.push(`dim: ${this.dim}`);
    if (this.italic !== undefined) parts.push(`italic: ${this.italic}`);
    if (this.underline !== undefined) parts.push(`underline: ${this.underline}`);
    if (this.strikethrough !== undefined) parts.push(`strikethrough: ${this.strikethrough}`);
    if (this.inverse !== undefined) parts.push(`inverse: ${this.inverse}`);
    if (this.hidden !== undefined) parts.push(`hidden: ${this.hidden}`);
    if (this.foreground !== undefined) parts.push(`fg: ${this.foreground}`);
    if (this.background !== undefined) parts.push(`bg: ${this.background}`);
    return `TextStyle(${parts.join(', ')})`;
  }
}
