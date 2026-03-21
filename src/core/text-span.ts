// Amp ref: amp-strings.txt (TextSpan tree for styled text)
// A tree structure for styled text. Each node has optional text, style, and children.

import { TextStyle } from './text-style.js';
import { stringWidth } from './wcwidth.js';

export class TextSpan {
  readonly text?: string;
  readonly style?: TextStyle;
  readonly children?: readonly TextSpan[];

  constructor(opts?: {
    text?: string;
    style?: TextStyle;
    children?: TextSpan[];
  }) {
    this.text = opts?.text;
    this.style = opts?.style;
    this.children = opts?.children ? Object.freeze([...opts.children]) : undefined;
  }

  /**
   * Visit each text segment with its effective (merged) style.
   * Callback receives (text, style) for each text segment in tree order.
   * parentStyle is the inherited style from ancestors.
   */
  visitChildren(
    visitor: (text: string, style: TextStyle) => void,
    parentStyle?: TextStyle,
  ): void {
    // Compute effective style by merging parent style with this node's style
    const effectiveStyle = this._computeEffectiveStyle(parentStyle);

    // Visit this node's text if present
    if (this.text !== undefined && this.text.length > 0) {
      visitor(this.text, effectiveStyle);
    }

    // Visit children with the effective style as their parent
    if (this.children) {
      for (const child of this.children) {
        child.visitChildren(visitor, effectiveStyle);
      }
    }
  }

  /**
   * Extract all text content without any styling, in tree order.
   */
  toPlainText(): string {
    const parts: string[] = [];
    this._collectPlainText(parts);
    return parts.join('');
  }

  /**
   * Compute the display width in terminal columns.
   * Handles CJK characters (width 2), control chars (width 0), regular chars (width 1).
   */
  computeWidth(): number {
    return stringWidth(this.toPlainText());
  }

  toString(): string {
    const parts: string[] = [];
    if (this.text !== undefined) parts.push(`text: "${this.text}"`);
    if (this.style !== undefined) parts.push(`style: ${this.style}`);
    if (this.children !== undefined && this.children.length > 0) {
      parts.push(`children: [${this.children.length}]`);
    }
    return `TextSpan(${parts.join(', ')})`;
  }

  private _computeEffectiveStyle(parentStyle?: TextStyle): TextStyle {
    if (parentStyle === undefined && this.style === undefined) {
      return new TextStyle();
    }
    if (parentStyle === undefined) {
      return this.style!;
    }
    if (this.style === undefined) {
      return parentStyle;
    }
    return parentStyle.merge(this.style);
  }

  private _collectPlainText(parts: string[]): void {
    if (this.text !== undefined) {
      parts.push(this.text);
    }
    if (this.children) {
      for (const child of this.children) {
        child._collectPlainText(parts);
      }
    }
  }
}
