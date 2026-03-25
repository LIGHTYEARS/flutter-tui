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
import { Column, Row } from './flex';
import { Text } from './text';
import { Theme, type ThemeData } from './theme';
import { Divider } from './divider';
import { AppTheme, type SyntaxHighlightConfig } from './app-theme';
import { syntaxHighlight, detectLanguage } from './syntax-highlight';
import { Padding } from './padding';
import { EdgeInsets } from '../layout/edge-insets';
import { SizedBox } from './sized-box';
import { Container } from './container';
import { BoxDecoration } from '../layout/render-decorated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Classification of a markdown block for rendering. */
export type MarkdownBlockType =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'bullet'
  | 'numbered-list'
  | 'blockquote'
  | 'horizontal-rule'
  | 'table'
  | 'code-block'
  | 'paragraph';

/** A parsed markdown block. */
export interface MarkdownBlock {
  readonly type: MarkdownBlockType;
  readonly content: string;
  /** For code blocks, the language hint if provided. */
  readonly language?: string;
  /** For numbered lists, the list item number. */
  readonly listNumber?: number;
  /** For GFM tables, the header column names. */
  readonly tableHeaders?: string[];
  /** For GFM tables, the data rows (array of arrays). */
  readonly tableRows?: string[][];
}

// ---------------------------------------------------------------------------
// Inline segment types
// ---------------------------------------------------------------------------

export interface InlineSegment {
  readonly text: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly code?: boolean;
  readonly linkText?: string;
  readonly linkUrl?: string;
  readonly strikethrough?: boolean;
  readonly boldItalic?: boolean;
}

// ---------------------------------------------------------------------------
// LRU AST Cache (Amp caches 100 entries)
// ---------------------------------------------------------------------------

class MarkdownCache {
  private _cache: Map<string, MarkdownBlock[]> = new Map();
  private _order: string[] = [];
  private _maxSize: number;

  constructor(maxSize: number = 100) {
    this._maxSize = maxSize;
  }

  get(key: string): MarkdownBlock[] | undefined {
    const value = this._cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      const idx = this._order.indexOf(key);
      if (idx !== -1) {
        this._order.splice(idx, 1);
        this._order.push(key);
      }
    }
    return value;
  }

  set(key: string, value: MarkdownBlock[]): void {
    if (this._cache.has(key)) {
      // Update existing entry, move to end
      this._cache.set(key, value);
      const idx = this._order.indexOf(key);
      if (idx !== -1) {
        this._order.splice(idx, 1);
      }
      this._order.push(key);
    } else {
      // Evict LRU if at capacity
      if (this._order.length >= this._maxSize) {
        const evictKey = this._order.shift()!;
        this._cache.delete(evictKey);
      }
      this._cache.set(key, value);
      this._order.push(key);
    }
  }

  invalidate(key: string): void {
    if (this._cache.has(key)) {
      this._cache.delete(key);
      const idx = this._order.indexOf(key);
      if (idx !== -1) {
        this._order.splice(idx, 1);
      }
    }
  }

  clear(): void {
    this._cache.clear();
    this._order = [];
  }
}

const _astCache = new MarkdownCache(100);

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
  readonly enableCache: boolean;

  constructor(opts: {
    key?: Key;
    markdown: string;
    textAlign?: 'left' | 'center' | 'right';
    maxLines?: number;
    overflow?: 'clip' | 'ellipsis';
    enableCache?: boolean;
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.markdown = opts.markdown;
    this.textAlign = opts.textAlign ?? 'left';
    this.maxLines = opts.maxLines;
    this.overflow = opts.overflow ?? 'clip';
    this.enableCache = opts.enableCache ?? true;
  }

  static invalidateCache(markdown: string): void {
    _astCache.invalidate(markdown);
  }

  static clearCache(): void {
    _astCache.clear();
  }

  build(context: BuildContext): Widget {
    const themeData = Theme.maybeOf(context);
    const blocks = this.enableCache
      ? Markdown.parseMarkdown(this.markdown)
      : Markdown._parseMarkdownNoCache(this.markdown);
    const children: Widget[] = [];

    for (const block of blocks) {
      const widget = this._renderBlock(block, themeData, context);
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
    // Check cache first
    const cached = _astCache.get(markdown);
    if (cached !== undefined) {
      return cached;
    }

    const blocks = Markdown._parseMarkdownNoCache(markdown);

    // Store result in cache
    _astCache.set(markdown, blocks);

    return blocks;
  }

  /**
   * Parse markdown without cache interaction.
   * Used internally when enableCache is false.
   */
  private static _parseMarkdownNoCache(markdown: string): MarkdownBlock[] {
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

      // Heading: # ## ### ####
      if (line.startsWith('#### ')) {
        blocks.push({ type: 'heading4', content: line.slice(5) });
        i++;
        continue;
      }
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

      // Horizontal rule: ---, ***, ___ (3+ of same char, standalone line)
      if (/^[-*_]{3,}\s*$/.test(line) && /^([-]{3,}|[*]{3,}|[_]{3,})\s*$/.test(line)) {
        blocks.push({ type: 'horizontal-rule', content: '' });
        i++;
        continue;
      }

      // GFM Table: detect separator row | --- | --- |
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]!;
        if (/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(nextLine) && line.includes('|')) {
          // Parse table header from current line
          const headers = Markdown._parseTableRow(line);
          if (headers.length > 0) {
            // Skip header and separator
            i += 2;
            // Collect data rows
            const dataRows: string[][] = [];
            while (i < lines.length) {
              const dataLine = lines[i]!;
              if (!dataLine.includes('|') || dataLine.trim() === '') {
                break;
              }
              dataRows.push(Markdown._parseTableRow(dataLine));
              i++;
            }
            blocks.push({
              type: 'table',
              content: '',
              tableHeaders: headers,
              tableRows: dataRows,
            });
            continue;
          }
        }
      }

      // Blockquote: > text (collect contiguous > lines)
      if (/^>\s?/.test(line)) {
        const quoteLines: string[] = [];
        while (i < lines.length && /^>\s?/.test(lines[i]!)) {
          quoteLines.push(lines[i]!.replace(/^>\s?/, ''));
          i++;
        }
        blocks.push({ type: 'blockquote', content: quoteLines.join('\n') });
        continue;
      }

      // Numbered list: 1. item, 2. item, etc.
      const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        const num = parseInt(numberedMatch[1]!, 10);
        const content = numberedMatch[2]!;
        blocks.push({ type: 'numbered-list', content, listNumber: num });
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
   * Parse a GFM table row into cell strings.
   */
  private static _parseTableRow(line: string): string[] {
    let trimmed = line.trim();
    // Strip leading and trailing pipes
    if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
    return trimmed.split('|').map((cell) => cell.trim());
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
      // Order matters: ***boldItalic*** before **bold** before *italic*

      // Bold+Italic: ***text***
      const boldItalicMatch = remaining.match(/^\*\*\*(.+?)\*\*\*/);
      if (boldItalicMatch) {
        segments.push({ text: boldItalicMatch[1]!, boldItalic: true });
        remaining = remaining.slice(boldItalicMatch[0]!.length);
        continue;
      }

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

      // Strikethrough: ~~text~~
      const strikeMatch = remaining.match(/^~~(.+?)~~/);
      if (strikeMatch) {
        segments.push({ text: strikeMatch[1]!, strikethrough: true });
        remaining = remaining.slice(strikeMatch[0]!.length);
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
      const plainMatch = remaining.match(/^[^*`\[~]+/);
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
  private _renderBlock(block: MarkdownBlock, themeData?: ThemeData, context?: BuildContext): Widget {
    switch (block.type) {
      case 'heading1':
        return this._renderHeading(block.content, 1, themeData);
      case 'heading2':
        return this._renderHeading(block.content, 2, themeData);
      case 'heading3':
        return this._renderHeading(block.content, 3, themeData);
      case 'heading4':
        return this._renderHeading(block.content, 4, themeData);
      case 'bullet':
        return this._renderBullet(block.content, themeData);
      case 'numbered-list':
        return this._renderNumberedList(block.content, block.listNumber ?? 1, themeData);
      case 'blockquote':
        return this._renderBlockquote(block.content, themeData);
      case 'horizontal-rule':
        return this._renderHorizontalRule(themeData);
      case 'table':
        return this._renderTable(block, themeData);
      case 'code-block':
        return this._renderCodeBlock(block.content, themeData, block.language, context);
      case 'paragraph':
      default:
        return this._renderParagraph(block.content, themeData);
    }
  }

  /**
   * Render a heading with bold styling.
   * H1, H3: use primary color. H2, H4: use textSecondary color.
   */
  private _renderHeading(
    content: string,
    level: number,
    themeData?: ThemeData,
  ): Widget {
    const primaryColor = themeData?.primary ?? Color.rgb(97, 175, 239);
    const secondaryColor = themeData?.textSecondary ?? Color.brightBlack;
    const textColor = (level === 1 || level === 3) ? primaryColor : secondaryColor;
    const style = new TextStyle({
      foreground: textColor,
      bold: true,
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
   * Render a code block with background styling and optional syntax highlighting.
   */
  private _renderCodeBlock(content: string, themeData?: ThemeData, language?: string, context?: BuildContext): Widget {
    const bgColor = themeData?.surface ?? Color.rgb(45, 45, 45);
    const fgColor = themeData?.text ?? Color.rgb(220, 220, 220);

    // Try syntax highlighting if we have a context and AppTheme
    if (context && language) {
      const appThemeData = AppTheme.maybeOf(context);
      if (appThemeData) {
        const syntheticPath = `file.${language}`;
        const detectedLang = detectLanguage(syntheticPath);
        if (detectedLang) {
          const highlightedLines = syntaxHighlight(content, appThemeData.syntaxHighlight, syntheticPath);
          const lineWidgets: Widget[] = highlightedLines.map((lineSpan) =>
            new Text({
              text: lineSpan,
              textAlign: this.textAlign,
            }),
          );
          return new Column({ children: lineWidgets });
        }
      }
    }

    // Fallback: simple styled text
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
   * Render a numbered list item with `  N. ` prefix.
   */
  private _renderNumberedList(content: string, listNumber: number, themeData?: ThemeData): Widget {
    const numColor = Color.brightBlack;
    const numSpan = new TextSpan({
      text: `  ${listNumber}. `,
      style: new TextStyle({ foreground: numColor, dim: true }),
    });

    const baseStyle = new TextStyle({
      foreground: themeData?.text ?? Color.rgb(220, 220, 220),
    });

    const segments = Markdown.parseInline(content);
    const contentSpans = segments.map((seg) => this._segmentToSpan(seg, baseStyle, themeData));

    return new Text({
      text: new TextSpan({
        children: [numSpan, ...contentSpans],
      }),
      textAlign: this.textAlign,
      maxLines: this.maxLines,
      overflow: this.overflow,
    });
  }

  /**
   * Render a blockquote with `  \u2502 ` left-border prefix in info color, content in dim.
   * Multi-line blockquotes produce one row per line, each with its own border prefix.
   */
  private _renderBlockquote(content: string, themeData?: ThemeData): Widget {
    const borderColor = themeData?.info ?? Color.brightBlue;
    const contentStyle = new TextStyle({
      foreground: Color.brightBlack,
    });

    const quoteLines = content.split('\n');

    // Single-line blockquote: render as a single Text
    if (quoteLines.length === 1) {
      const borderSpan = new TextSpan({
        text: '  \u2502 ',
        style: new TextStyle({ foreground: borderColor }),
      });
      const segments = Markdown.parseInline(content);
      const contentSpans = segments.map((seg) => this._segmentToSpan(seg, contentStyle, themeData));

      return new Text({
        text: new TextSpan({
          children: [borderSpan, ...contentSpans],
        }),
        textAlign: this.textAlign,
        maxLines: this.maxLines,
        overflow: this.overflow,
      });
    }

    // Multi-line blockquote: one Text widget per line, wrapped in Column
    const lineWidgets: Widget[] = quoteLines.map((quoteLine) => {
      const borderSpan = new TextSpan({
        text: '  \u2502 ',
        style: new TextStyle({ foreground: borderColor }),
      });
      const segments = Markdown.parseInline(quoteLine);
      const contentSpans = segments.map((seg) => this._segmentToSpan(seg, contentStyle, themeData));

      return new Text({
        text: new TextSpan({
          children: [borderSpan, ...contentSpans],
        }),
        textAlign: this.textAlign,
      });
    });

    return new Column({ children: lineWidgets });
  }

  /**
   * Render a horizontal rule as a Divider widget.
   */
  private _renderHorizontalRule(themeData?: ThemeData): Widget {
    return new Divider({ color: themeData?.border ?? Color.brightBlack });
  }

  /**
   * Render a GFM table with header row and data rows.
   */
  private _renderTable(block: MarkdownBlock, themeData?: ThemeData): Widget {
    const headers = block.tableHeaders ?? [];
    const rows = block.tableRows ?? [];
    const baseTextColor = themeData?.text ?? Color.rgb(220, 220, 220);
    const headerColor = themeData?.primary ?? Color.rgb(97, 175, 239);
    const borderColor = themeData?.border ?? Color.brightBlack;

    // Compute column widths (max of header and each row)
    const colCount = headers.length;
    const colWidths: number[] = headers.map((h) => h.length);
    for (const row of rows) {
      for (let c = 0; c < colCount; c++) {
        const cellLen = (row[c] ?? '').length;
        if (cellLen > colWidths[c]!) colWidths[c] = cellLen;
      }
    }

    const tableLines: Widget[] = [];

    // Header row
    const headerCells = headers.map((h, c) => h.padEnd(colWidths[c]!));
    const headerText = '  ' + headerCells.join(' \u2502 ');
    tableLines.push(
      new Text({
        text: new TextSpan({
          text: headerText,
          style: new TextStyle({ foreground: headerColor, bold: true }),
        }),
        textAlign: this.textAlign,
      }),
    );

    // Separator row
    const sepCells = colWidths.map((w) => '\u2500'.repeat(w));
    const sepText = '  ' + sepCells.join('\u2500\u253c\u2500');
    tableLines.push(
      new Text({
        text: new TextSpan({
          text: sepText,
          style: new TextStyle({ foreground: borderColor }),
        }),
        textAlign: this.textAlign,
      }),
    );

    // Data rows
    for (const row of rows) {
      const cells = headers.map((_, c) => (row[c] ?? '').padEnd(colWidths[c]!));
      const rowText = '  ' + cells.join(' \u2502 ');
      tableLines.push(
        new Text({
          text: new TextSpan({
            text: rowText,
            style: new TextStyle({ foreground: baseTextColor }),
          }),
          textAlign: this.textAlign,
        }),
      );
    }

    return new Column({ children: tableLines });
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

    if (segment.boldItalic) {
      style = style.copyWith({ bold: true, italic: true });
    }
    if (segment.bold) {
      style = style.copyWith({ bold: true });
    }
    if (segment.italic) {
      style = style.copyWith({ italic: true });
    }
    if (segment.strikethrough) {
      style = style.copyWith({ strikethrough: true });
    }
    if (segment.code) {
      // Amp style: bold + yellow foreground for inline code
      style = style.copyWith({ bold: true, foreground: Color.yellow });
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
