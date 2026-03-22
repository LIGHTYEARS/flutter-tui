// Markdown widget — StatelessWidget that parses markdown and renders as styled Text
// Amp ref: _g class — simple markdown renderer
// Source: .reference/widgets-catalog.md

import { Key } from '../core/key';
import { Color } from '../core/color';
import { TextStyle } from '../core/text-style';
import { TextSpan } from '../core/text-span';
import {
  Widget,
  StatelessWidget,
  type BuildContext,
} from '../framework/widget';
import { Column } from './flex';
import { Text } from './text';
import { Theme, type ThemeData } from './theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Classification of a markdown block for rendering. */
type MarkdownBlockType =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bullet'
  | 'code-block'
  | 'paragraph';

/** A parsed markdown block. */
interface MarkdownBlock {
  readonly type: MarkdownBlockType;
  readonly content: string;
  /** For code blocks, the language hint if provided. */
  readonly language?: string;
}

// ---------------------------------------------------------------------------
// Inline segment types
// ---------------------------------------------------------------------------

interface InlineSegment {
  readonly text: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly code?: boolean;
  readonly linkText?: string;
  readonly linkUrl?: string;
}

// ---------------------------------------------------------------------------
// Markdown (Amp: _g)
// ---------------------------------------------------------------------------

/**
 * A StatelessWidget that parses markdown text and renders it as styled Text.
 *
 * Supports simple line-by-line markdown:
 * - `# Heading` -> bold text
 * - `## Heading` -> bold text
 * - `### Heading` -> bold text (dimmer)
 * - `` `code` `` -> styled with background
 * - `**bold**` -> bold style
 * - `*italic*` -> italic style
 * - `[text](url)` -> text with hyperlink TextSpan (OSC 8)
 * - `- item` -> bullet point list
 * - ``` code block ``` -> code block with background
 * - Regular text -> plain Text widget
 *
 * Usage:
 *   new Markdown({
 *     markdown: '# Hello\n\nSome **bold** and *italic* text.',
 *   })
 *
 * Amp ref: _g class
 */
export class Markdown extends StatelessWidget {
  readonly markdown: string;
  readonly textAlign: 'left' | 'center' | 'right';
  readonly maxLines?: number;
  readonly overflow: 'clip' | 'ellipsis';

  constructor(opts: {
    key?: Key;
    markdown: string;
    textAlign?: 'left' | 'center' | 'right';
    maxLines?: number;
    overflow?: 'clip' | 'ellipsis';
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.markdown = opts.markdown;
    this.textAlign = opts.textAlign ?? 'left';
    this.maxLines = opts.maxLines;
    this.overflow = opts.overflow ?? 'clip';
  }

  build(context: BuildContext): Widget {
    const themeData = Theme.maybeOf(context);
    const blocks = Markdown.parseMarkdown(this.markdown);
    const children: Widget[] = [];

    for (const block of blocks) {
      const widget = this._renderBlock(block, themeData);
      children.push(widget);
    }

    // If no blocks parsed, render empty
    if (children.length === 0) {
      children.push(
        new Text({
          text: new TextSpan({ text: '' }),
          textAlign: this.textAlign,
        }),
      );
    }

    return new Column({ children });
  }

  // ---------------------------------------------------------------------------
  // Markdown Parsing
  // ---------------------------------------------------------------------------

  /**
   * Parse markdown text into blocks.
   * Exported as static for testability.
   */
  static parseMarkdown(markdown: string): MarkdownBlock[] {
    const lines = markdown.split('\n');
    const blocks: MarkdownBlock[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i]!;

      // Code block: ``` ... ```
      if (line.trimStart().startsWith('```')) {
        const indent = line.indexOf('```');
        const langHint = line.slice(indent + 3).trim();
        const codeLines: string[] = [];
        i++;

        while (i < lines.length) {
          const codeLine = lines[i]!;
          if (codeLine.trimStart().startsWith('```')) {
            i++;
            break;
          }
          codeLines.push(codeLine);
          i++;
        }

        blocks.push({
          type: 'code-block',
          content: codeLines.join('\n'),
          language: langHint || undefined,
        });
        continue;
      }

      // Heading: # ## ###
      if (line.startsWith('### ')) {
        blocks.push({ type: 'heading3', content: line.slice(4) });
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        blocks.push({ type: 'heading2', content: line.slice(3) });
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        blocks.push({ type: 'heading1', content: line.slice(2) });
        i++;
        continue;
      }

      // Bullet: - item or * item
      if (/^[\-\*]\s+/.test(line)) {
        const content = line.replace(/^[\-\*]\s+/, '');
        blocks.push({ type: 'bullet', content });
        i++;
        continue;
      }

      // Empty line: skip
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Regular paragraph
      blocks.push({ type: 'paragraph', content: line });
      i++;
    }

    return blocks;
  }

  /**
   * Parse inline markdown formatting within a text string.
   * Handles: **bold**, *italic*, `code`, [text](url)
   * Exported as static for testability.
   */
  static parseInline(text: string): InlineSegment[] {
    const segments: InlineSegment[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      // Try to match inline patterns
      // Order matters: **bold** before *italic*

      // Bold: **text**
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        segments.push({ text: boldMatch[1]!, bold: true });
        remaining = remaining.slice(boldMatch[0]!.length);
        continue;
      }

      // Italic: *text*
      const italicMatch = remaining.match(/^\*(.+?)\*/);
      if (italicMatch) {
        segments.push({ text: italicMatch[1]!, italic: true });
        remaining = remaining.slice(italicMatch[0]!.length);
        continue;
      }

      // Inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        segments.push({ text: codeMatch[1]!, code: true });
        remaining = remaining.slice(codeMatch[0]!.length);
        continue;
      }

      // Link: [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        segments.push({
          text: linkMatch[1]!,
          linkText: linkMatch[1]!,
          linkUrl: linkMatch[2]!,
        });
        remaining = remaining.slice(linkMatch[0]!.length);
        continue;
      }

      // Plain text: consume until next special character or end
      const plainMatch = remaining.match(/^[^*`\[]+/);
      if (plainMatch) {
        segments.push({ text: plainMatch[0]! });
        remaining = remaining.slice(plainMatch[0]!.length);
        continue;
      }

      // If no pattern matches, consume one character as plain text
      segments.push({ text: remaining[0]! });
      remaining = remaining.slice(1);
    }

    return segments;
  }

  // ---------------------------------------------------------------------------
  // Private rendering
  // ---------------------------------------------------------------------------

  /**
   * Render a markdown block into a Text widget.
   */
  private _renderBlock(block: MarkdownBlock, themeData?: ThemeData): Widget {
    switch (block.type) {
      case 'heading1':
        return this._renderHeading(block.content, 1, themeData);
      case 'heading2':
        return this._renderHeading(block.content, 2, themeData);
      case 'heading3':
        return this._renderHeading(block.content, 3, themeData);
      case 'bullet':
        return this._renderBullet(block.content, themeData);
      case 'code-block':
        return this._renderCodeBlock(block.content, themeData);
      case 'paragraph':
      default:
        return this._renderParagraph(block.content, themeData);
    }
  }

  /**
   * Render a heading with bold styling.
   */
  private _renderHeading(
    content: string,
    level: number,
    themeData?: ThemeData,
  ): Widget {
    const textColor = themeData?.primary ?? Color.rgb(97, 175, 239);
    const style = new TextStyle({
      foreground: textColor,
      bold: true,
      dim: level >= 3 ? true : undefined,
    });

    const prefix = level === 1 ? '' : level === 2 ? '' : '';
    const text = prefix + content;

    // Parse inline formatting within the heading
    const segments = Markdown.parseInline(text);
    const children = segments.map((seg) => this._segmentToSpan(seg, style, themeData));

    return new Text({
      text: children.length === 1
        ? children[0]!
        : new TextSpan({ children }),
      textAlign: this.textAlign,
      maxLines: this.maxLines,
      overflow: this.overflow,
    });
  }

  /**
   * Render a bullet point item.
   */
  private _renderBullet(content: string, themeData?: ThemeData): Widget {
    const bulletColor = themeData?.textSecondary ?? Color.rgb(150, 150, 150);
    const bulletSpan = new TextSpan({
      text: '  \u2022 ',
      style: new TextStyle({ foreground: bulletColor }),
    });

    const baseStyle = new TextStyle({
      foreground: themeData?.text ?? Color.rgb(220, 220, 220),
    });

    const segments = Markdown.parseInline(content);
    const contentSpans = segments.map((seg) => this._segmentToSpan(seg, baseStyle, themeData));

    return new Text({
      text: new TextSpan({
        children: [bulletSpan, ...contentSpans],
      }),
      textAlign: this.textAlign,
      maxLines: this.maxLines,
      overflow: this.overflow,
    });
  }

  /**
   * Render a code block with background styling.
   */
  private _renderCodeBlock(content: string, themeData?: ThemeData): Widget {
    const bgColor = themeData?.surface ?? Color.rgb(45, 45, 45);
    const fgColor = themeData?.text ?? Color.rgb(220, 220, 220);
    const style = new TextStyle({
      foreground: fgColor,
      background: bgColor,
    });

    return new Text({
      text: new TextSpan({ text: content, style }),
      textAlign: this.textAlign,
      maxLines: this.maxLines,
      overflow: this.overflow,
    });
  }

  /**
   * Render a paragraph with inline formatting.
   */
  private _renderParagraph(content: string, themeData?: ThemeData): Widget {
    const baseStyle = new TextStyle({
      foreground: themeData?.text ?? Color.rgb(220, 220, 220),
    });

    const segments = Markdown.parseInline(content);
    const children = segments.map((seg) => this._segmentToSpan(seg, baseStyle, themeData));

    return new Text({
      text: children.length === 1
        ? children[0]!
        : new TextSpan({ children }),
      textAlign: this.textAlign,
      maxLines: this.maxLines,
      overflow: this.overflow,
    });
  }

  /**
   * Convert an InlineSegment to a TextSpan with appropriate styling.
   */
  private _segmentToSpan(
    segment: InlineSegment,
    baseStyle: TextStyle,
    themeData?: ThemeData,
  ): TextSpan {
    let style = baseStyle;

    if (segment.bold) {
      style = style.copyWith({ bold: true });
    }
    if (segment.italic) {
      style = style.copyWith({ italic: true });
    }
    if (segment.code) {
      const bgColor = themeData?.surface ?? Color.rgb(45, 45, 45);
      style = style.copyWith({ background: bgColor });
    }
    if (segment.linkUrl) {
      const linkColor = themeData?.primary ?? Color.rgb(97, 175, 239);
      style = style.copyWith({ foreground: linkColor, underline: true });
      return new TextSpan({
        text: segment.text,
        style,
        hyperlink: { uri: segment.linkUrl },
      });
    }

    return new TextSpan({ text: segment.text, style });
  }
}
