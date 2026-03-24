// DiffView widget — StatelessWidget that parses unified diff and renders with coloring
// Amp ref: Bn class — diff viewer with line-by-line coloring
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
import { AppTheme, type AppThemeData } from './app-theme';
import { syntaxHighlight } from './syntax-highlight';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Classification of a diff line for styling purposes. */
type DiffLineType = 'addition' | 'deletion' | 'hunk-header' | 'context' | 'meta';

/** A parsed diff line with its type and original/new line numbers. */
export interface DiffLine {
  readonly type: DiffLineType;
  readonly content: string;
  readonly oldLineNumber?: number;
  readonly newLineNumber?: number;
}

/** A parsed hunk from a unified diff. */
export interface DiffHunk {
  readonly header: string;
  readonly lines: DiffLine[];
  readonly oldStart: number;
  readonly newStart: number;
}

/** A word-level diff segment indicating whether the word was same, added, or removed. */
export interface WordDiff {
  readonly text: string;
  readonly type: 'same' | 'added' | 'removed';
}

// ---------------------------------------------------------------------------
// DiffView (Amp: Bn)
// ---------------------------------------------------------------------------

/**
 * A StatelessWidget that parses unified diff text and renders it with coloring.
 *
 * Each line is styled according to its diff type:
 * - Addition lines ('+') are shown in green (diffAdded from Theme)
 * - Deletion lines ('-') are shown in red (diffRemoved from Theme)
 * - Hunk headers ('@@ ... @@') are shown in info/cyan
 * - Context lines are shown in normal text color
 *
 * Usage:
 *   new DiffView({
 *     diff: unifiedDiffString,
 *     showLineNumbers: true,
 *     context: 3,
 *   })
 *
 * Amp ref: Bn class
 */
export class DiffView extends StatelessWidget {
  readonly diff: string;
  readonly showLineNumbers: boolean;
  readonly context?: number;
  readonly ignoreWhitespace: boolean;
  readonly wordLevelDiff: boolean;

  constructor(opts: {
    key?: Key;
    diff: string;
    showLineNumbers?: boolean;
    context?: number;
    filePath?: string;
    ignoreWhitespace?: boolean;
    wordLevelDiff?: boolean;
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.diff = opts.diff;
    this.showLineNumbers = opts.showLineNumbers ?? true;
    this.context = opts.context;
    this.filePath = opts.filePath;
    this.ignoreWhitespace = opts.ignoreWhitespace ?? false;
    this.wordLevelDiff = opts.wordLevelDiff ?? true;
  }

  /** Optional filePath hint for syntax highlighting of diff content. */
  readonly filePath?: string;

  build(context: BuildContext): Widget {
    const themeData = Theme.maybeOf(context);
    const appThemeData = AppTheme.maybeOf(context);
    const hunks = DiffView.parseDiff(this.diff);
    const lines = this._collectDisplayLines(hunks);
    const children: Widget[] = [];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]!;
      const style = this._styleForLineType(line.type, themeData);
      let displayText: string;

      // Word-level diff: detect adjacent deletion+addition pairs
      if (
        this.wordLevelDiff &&
        line.type === 'deletion' &&
        lineIdx + 1 < lines.length &&
        lines[lineIdx + 1]!.type === 'addition'
      ) {
        const nextLine = lines[lineIdx + 1]!;
        const oldContent = line.content.length > 0 ? line.content.slice(1) : '';
        const newContent = nextLine.content.length > 0 ? nextLine.content.slice(1) : '';
        const wordDiffs = DiffView.computeWordDiff(oldContent, newContent);

        // Render deletion line with word-level highlighting
        const deletionStyle = this._styleForLineType('deletion', themeData);
        const deletionSpans = this._buildWordDiffSpans(
          line, wordDiffs, 'removed', deletionStyle, themeData,
        );
        children.push(new Text({ text: new TextSpan({ children: deletionSpans }) }));

        // Render addition line with word-level highlighting
        const additionStyle = this._styleForLineType('addition', themeData);
        const additionSpans = this._buildWordDiffSpans(
          nextLine, wordDiffs, 'added', additionStyle, themeData,
        );
        children.push(new Text({ text: new TextSpan({ children: additionSpans }) }));

        lineIdx++; // skip the addition line, already rendered
        continue;
      }

      if (this.showLineNumbers && line.type !== 'meta' && line.type !== 'hunk-header') {
        const oldNum = line.oldLineNumber !== undefined
          ? String(line.oldLineNumber).padStart(4, ' ')
          : '    ';
        const newNum = line.newLineNumber !== undefined
          ? String(line.newLineNumber).padStart(4, ' ')
          : '    ';
        displayText = `${oldNum} ${newNum} ${line.content}`;
      } else {
        displayText = line.content;
      }

      // When AppTheme is present with syntax highlight config, colorize
      // addition and context line content using syntax highlighting.
      if (
        appThemeData &&
        this.filePath &&
        (line.type === 'addition' || line.type === 'context')
      ) {
        // Strip the leading +/space character for highlighting
        const rawContent = line.content.length > 0 ? line.content.slice(1) : '';
        if (rawContent.length > 0) {
          const highlightedSpans = syntaxHighlight(rawContent, appThemeData.syntaxHighlight, this.filePath);
          if (highlightedSpans.length > 0) {
            // Build prefix (line numbers + leading char)
            const prefix = this.showLineNumbers && line.type !== 'meta' && line.type !== 'hunk-header'
              ? (() => {
                  const oldNum = line.oldLineNumber !== undefined
                    ? String(line.oldLineNumber).padStart(4, ' ')
                    : '    ';
                  const newNum = line.newLineNumber !== undefined
                    ? String(line.newLineNumber).padStart(4, ' ')
                    : '    ';
                  return `${oldNum} ${newNum} ${line.content.charAt(0)}`;
                })()
              : line.content.charAt(0);

            const prefixSpan = new TextSpan({ text: prefix, style });
            const highlightedChildren = [prefixSpan, ...highlightedSpans];
            children.push(
              new Text({
                text: new TextSpan({ children: highlightedChildren }),
              }),
            );
            continue;
          }
        }
      }

      children.push(
        new Text({
          text: new TextSpan({ text: displayText, style }),
        }),
      );
    }

    // If no lines parsed, render a single empty line
    if (children.length === 0) {
      children.push(
        new Text({
          text: new TextSpan({ text: '', style: new TextStyle() }),
        }),
      );
    }

    return new Column({ children });
  }

  // ---------------------------------------------------------------------------
  // Diff Parsing
  // ---------------------------------------------------------------------------

  /**
   * Parse a unified diff string into hunks.
   * Exported as static for testability.
   */
  static parseDiff(diff: string): DiffHunk[] {
    const lines = diff.split('\n');
    const hunks: DiffHunk[] = [];
    let currentHunk: {
      header: string;
      lines: DiffLine[];
      oldStart: number;
      newStart: number;
      oldLine: number;
      newLine: number;
    } | undefined;

    for (const rawLine of lines) {
      // Hunk header: @@ -old,count +new,count @@
      const hunkMatch = rawLine.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@(.*)$/);

      if (hunkMatch) {
        // Save previous hunk
        if (currentHunk) {
          hunks.push({
            header: currentHunk.header,
            lines: currentHunk.lines,
            oldStart: currentHunk.oldStart,
            newStart: currentHunk.newStart,
          });
        }

        const oldStart = parseInt(hunkMatch[1]!, 10);
        const newStart = parseInt(hunkMatch[2]!, 10);

        currentHunk = {
          header: rawLine,
          lines: [],
          oldStart,
          newStart,
          oldLine: oldStart,
          newLine: newStart,
        };
        continue;
      }

      // Meta lines (--- a/file, +++ b/file, diff --git, index, etc.)
      if (!currentHunk) {
        // Lines before any hunk are meta lines
        // Skip empty trailing lines
        if (rawLine.length > 0) {
          // We don't create hunks for meta lines; they're handled separately
          // But to display them, we'll create a virtual meta hunk
          if (hunks.length === 0 || hunks[hunks.length - 1]!.header !== '__meta__') {
            hunks.push({
              header: '__meta__',
              lines: [],
              oldStart: 0,
              newStart: 0,
            });
          }
          hunks[hunks.length - 1]!.lines.push({
            type: 'meta',
            content: rawLine,
          });
        }
        continue;
      }

      // Inside a hunk: classify lines
      if (rawLine.startsWith('+')) {
        currentHunk.lines.push({
          type: 'addition',
          content: rawLine,
          newLineNumber: currentHunk.newLine,
        });
        currentHunk.newLine++;
      } else if (rawLine.startsWith('-')) {
        currentHunk.lines.push({
          type: 'deletion',
          content: rawLine,
          oldLineNumber: currentHunk.oldLine,
        });
        currentHunk.oldLine++;
      } else if (rawLine === '\\ No newline at end of file') {
        currentHunk.lines.push({
          type: 'meta',
          content: rawLine,
        });
      } else {
        // Context line (starts with ' ' or is empty within hunk)
        currentHunk.lines.push({
          type: 'context',
          content: rawLine,
          oldLineNumber: currentHunk.oldLine,
          newLineNumber: currentHunk.newLine,
        });
        currentHunk.oldLine++;
        currentHunk.newLine++;
      }
    }

    // Save the last hunk
    if (currentHunk) {
      hunks.push({
        header: currentHunk.header,
        lines: currentHunk.lines,
        oldStart: currentHunk.oldStart,
        newStart: currentHunk.newStart,
      });
    }

    return hunks;
  }

  // ---------------------------------------------------------------------------
  // Static: computeDiff — Myers diff algorithm (O(ND))
  // ---------------------------------------------------------------------------

  /**
   * Compute a unified diff between two text strings using the Myers diff algorithm.
   * Self-contained, no external dependencies.
   *
   * @param oldText - The original text
   * @param newText - The modified text
   * @param options - Optional configuration
   * @returns Unified diff format string
   */
  static computeDiff(
    oldText: string,
    newText: string,
    options?: {
      ignoreWhitespace?: boolean;
      contextLines?: number;
      fileName?: string;
    },
  ): string {
    const contextLines = options?.contextLines ?? 3;
    const fileName = options?.fileName ?? 'file';
    const ignoreWs = options?.ignoreWhitespace ?? false;

    const oldLines = oldText.length === 0 ? [] : oldText.split('\n');
    const newLines = newText.length === 0 ? [] : newText.split('\n');

    // Normalize for comparison if ignoreWhitespace
    const oldCmp = ignoreWs ? oldLines.map((l) => l.trimEnd()) : oldLines;
    const newCmp = ignoreWs ? newLines.map((l) => l.trimEnd()) : newLines;

    // Run Myers diff on lines to get edit script
    const editScript = DiffView._myersDiff(oldCmp, newCmp);

    // If no changes, return empty string
    if (editScript.every((op) => op.type === 'equal')) {
      return '';
    }

    // Group into hunks with context
    const hunks = DiffView._buildHunks(editScript, oldLines, newLines, contextLines);

    // Format as unified diff
    const result: string[] = [];
    result.push(`--- a/${fileName}`);
    result.push(`+++ b/${fileName}`);

    for (const hunk of hunks) {
      result.push(
        `@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@`,
      );
      for (const line of hunk.lines) {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  // ---------------------------------------------------------------------------
  // Static: computeWordDiff
  // ---------------------------------------------------------------------------

  /**
   * Compute word-level diff between two lines.
   * Splits each line into tokens (words and whitespace), then applies Myers diff
   * at the token level.
   *
   * @param oldLine - The original line text (without leading -/+ prefix)
   * @param newLine - The new line text (without leading -/+ prefix)
   * @returns Array of WordDiff segments
   */
  static computeWordDiff(oldLine: string, newLine: string): WordDiff[] {
    const oldTokens = DiffView._tokenizeWords(oldLine);
    const newTokens = DiffView._tokenizeWords(newLine);

    const editScript = DiffView._myersDiff(oldTokens, newTokens);

    const result: WordDiff[] = [];
    for (const op of editScript) {
      if (op.type === 'equal') {
        result.push({ text: op.oldVal!, type: 'same' });
      } else if (op.type === 'delete') {
        result.push({ text: op.oldVal!, type: 'removed' });
      } else if (op.type === 'insert') {
        result.push({ text: op.newVal!, type: 'added' });
      }
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Build TextSpan children for a word-diff enhanced line.
   * @param line - The DiffLine being rendered
   * @param wordDiffs - The computed word diffs for this pair
   * @param highlightType - Which type to highlight ('removed' for deletion lines, 'added' for addition lines)
   * @param baseStyle - The base style for this line type
   * @param themeData - Optional theme data
   */
  private _buildWordDiffSpans(
    line: DiffLine,
    wordDiffs: WordDiff[],
    highlightType: 'removed' | 'added',
    baseStyle: TextStyle,
    _themeData?: ThemeData,
  ): TextSpan[] {
    const spans: TextSpan[] = [];

    // Build prefix (line numbers + leading char)
    let prefix: string;
    if (this.showLineNumbers && line.type !== 'meta' && line.type !== 'hunk-header') {
      const oldNum = line.oldLineNumber !== undefined
        ? String(line.oldLineNumber).padStart(4, ' ')
        : '    ';
      const newNum = line.newLineNumber !== undefined
        ? String(line.newLineNumber).padStart(4, ' ')
        : '    ';
      prefix = `${oldNum} ${newNum} ${line.content.charAt(0)}`;
    } else {
      prefix = line.content.charAt(0);
    }

    spans.push(new TextSpan({ text: prefix, style: baseStyle }));

    // Background colors for highlighted words
    const highlightBg = highlightType === 'added'
      ? Color.rgb(0, 60, 0)   // dark green
      : Color.rgb(60, 0, 0);  // dark red

    const highlightStyle = new TextStyle({
      foreground: baseStyle.foreground,
      background: highlightBg,
    });

    for (const wd of wordDiffs) {
      if (wd.type === 'same') {
        spans.push(new TextSpan({ text: wd.text, style: baseStyle }));
      } else if (wd.type === highlightType) {
        spans.push(new TextSpan({ text: wd.text, style: highlightStyle }));
      }
      // Skip the opposite type (e.g., 'added' words on a deletion line)
    }

    return spans;
  }

  /**
   * Collect all display lines from parsed hunks, applying context filtering
   * if this.context is specified.
   */
  private _collectDisplayLines(hunks: DiffHunk[]): DiffLine[] {
    const result: DiffLine[] = [];

    for (const hunk of hunks) {
      if (hunk.header === '__meta__') {
        // Add meta lines directly
        result.push(...hunk.lines);
        continue;
      }

      // Add hunk header line
      result.push({
        type: 'hunk-header',
        content: hunk.header,
      });

      if (this.context !== undefined) {
        // Filter to only show N context lines around changes
        const filteredLines = this._filterContextLines(hunk.lines, this.context);
        result.push(...filteredLines);
      } else {
        result.push(...hunk.lines);
      }
    }

    return result;
  }

  /**
   * Filter hunk lines to only include context lines within `n` lines of a change.
   */
  private _filterContextLines(lines: DiffLine[], n: number): DiffLine[] {
    // Mark which lines should be included
    const include = new Array<boolean>(lines.length).fill(false);

    // Find all changed line indices
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.type === 'addition' || line.type === 'deletion') {
        // Include this line and n context lines before and after
        for (let j = Math.max(0, i - n); j <= Math.min(lines.length - 1, i + n); j++) {
          include[j] = true;
        }
      }
    }

    const result: DiffLine[] = [];
    let lastIncluded = -1;

    for (let i = 0; i < lines.length; i++) {
      if (include[i]) {
        // Add separator if there's a gap
        if (lastIncluded >= 0 && i - lastIncluded > 1) {
          result.push({
            type: 'meta',
            content: '  ...',
          });
        }
        result.push(lines[i]!);
        lastIncluded = i;
      }
    }

    return result;
  }

  /**
   * Get the TextStyle for a given diff line type, using theme colors if available.
   */
  private _styleForLineType(type: DiffLineType, themeData?: ThemeData): TextStyle {
    switch (type) {
      case 'addition':
        return new TextStyle({
          foreground: themeData?.diffAdded ?? Color.rgb(80, 200, 120),
        });
      case 'deletion':
        return new TextStyle({
          foreground: themeData?.diffRemoved ?? Color.rgb(240, 80, 80),
        });
      case 'hunk-header':
        return new TextStyle({
          foreground: themeData?.info ?? Color.rgb(97, 175, 239),
        });
      case 'meta':
        return new TextStyle({
          foreground: themeData?.textSecondary ?? Color.rgb(150, 150, 150),
          bold: true,
        });
      case 'context':
      default:
        return new TextStyle({
          foreground: themeData?.text ?? Color.rgb(220, 220, 220),
        });
    }
  }

  // ---------------------------------------------------------------------------
  // Myers Diff Algorithm — private static helpers
  // ---------------------------------------------------------------------------

  /** Edit operation from Myers diff. */
  private static _myersDiff<T>(
    oldArr: readonly T[],
    newArr: readonly T[],
  ): Array<{ type: 'equal' | 'insert' | 'delete'; oldVal?: T; newVal?: T }> {
    const N = oldArr.length;
    const M = newArr.length;

    // Edge case: both empty
    if (N === 0 && M === 0) return [];

    // Edge case: old is empty — all inserts
    if (N === 0) {
      return newArr.map((v) => ({ type: 'insert' as const, newVal: v }));
    }

    // Edge case: new is empty — all deletes
    if (M === 0) {
      return oldArr.map((v) => ({ type: 'delete' as const, oldVal: v }));
    }

    const MAX = N + M;
    // V array indexed from -MAX to MAX. We use offset to map to 0-based.
    const size = 2 * MAX + 1;

    // Store the V array for each D step so we can trace back
    const vHistory: Int32Array[] = [];

    // Current V: v[k + MAX] = x value on diagonal k with furthest reach
    const v = new Int32Array(size);
    v[1 + MAX] = 0;

    let found = false;
    let finalD = 0;

    outer:
    for (let d = 0; d <= MAX; d++) {
      // Save a copy of V before mutation for trace-back
      vHistory.push(new Int32Array(v));

      for (let k = -d; k <= d; k += 2) {
        let x: number;

        if (k === -d || (k !== d && v[k - 1 + MAX]! < v[k + 1 + MAX]!)) {
          // Move down (insert from new)
          x = v[k + 1 + MAX]!;
        } else {
          // Move right (delete from old)
          x = v[k - 1 + MAX]! + 1;
        }

        let y = x - k;

        // Follow diagonal (equal elements)
        while (x < N && y < M && oldArr[x] === newArr[y]) {
          x++;
          y++;
        }

        v[k + MAX] = x;

        if (x >= N && y >= M) {
          // We reached the end
          finalD = d;
          found = true;
          break outer;
        }
      }
    }

    if (!found) {
      // Should not happen for valid inputs, but just in case
      finalD = MAX;
    }

    // Trace back: reconstruct the edit path
    const edits: Array<{ type: 'equal' | 'insert' | 'delete'; oldVal?: T; newVal?: T }> = [];

    let x = N;
    let y = M;

    for (let d = finalD; d > 0; d--) {
      const vPrev = vHistory[d]!;
      const k = x - y;

      let prevK: number;
      if (k === -d || (k !== d && vPrev[k - 1 + MAX]! < vPrev[k + 1 + MAX]!)) {
        prevK = k + 1; // came from insert (down)
      } else {
        prevK = k - 1; // came from delete (right)
      }

      const prevX = vPrev[prevK + MAX]!;
      const prevY = prevX - prevK;

      // Add diagonal (equal) moves from (prevX, prevY) to the point just before (x, y) step
      // The current position was reached via a non-diagonal move from (midX, midY)
      // then diagonal to (x, y). Let's compute the mid-point.
      let midX: number;
      let midY: number;

      if (prevK === k + 1) {
        // Insert: moved from (prevX, prevY) down to (prevX, prevY+1), then diagonal
        midX = prevX;
        midY = prevY + 1;
      } else {
        // Delete: moved from (prevX, prevY) right to (prevX+1, prevY), then diagonal
        midX = prevX + 1;
        midY = prevY;
      }

      // Diagonal moves from (midX, midY) to (x, y)
      while (x > midX && y > midY) {
        x--;
        y--;
        edits.push({ type: 'equal', oldVal: oldArr[x], newVal: newArr[y] });
      }

      // The non-diagonal step
      if (prevK === k + 1) {
        // Insert
        y--;
        edits.push({ type: 'insert', newVal: newArr[y] });
      } else {
        // Delete
        x--;
        edits.push({ type: 'delete', oldVal: oldArr[x] });
      }
    }

    // Any remaining diagonal moves from (0,0) to current (x,y)
    while (x > 0 && y > 0) {
      x--;
      y--;
      edits.push({ type: 'equal', oldVal: oldArr[x], newVal: newArr[y] });
    }

    // Reverse to get forward order
    edits.reverse();

    return edits;
  }

  /**
   * Tokenize a line into words and whitespace segments.
   * Keeps whitespace as separate tokens so the diff preserves spacing.
   */
  private static _tokenizeWords(line: string): string[] {
    const tokens: string[] = [];
    const regex = /(\s+|\S+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      tokens.push(match[0]!);
    }
    return tokens;
  }

  /**
   * Build unified diff hunks from an edit script, grouping changes
   * with the specified number of context lines.
   */
  private static _buildHunks(
    editScript: Array<{ type: 'equal' | 'insert' | 'delete'; oldVal?: unknown; newVal?: unknown }>,
    oldLines: string[],
    newLines: string[],
    contextLines: number,
  ): Array<{ oldStart: number; oldCount: number; newStart: number; newCount: number; lines: string[] }> {
    // Assign line numbers to each edit op
    interface EditWithPos {
      type: 'equal' | 'insert' | 'delete';
      oldIdx?: number;
      newIdx?: number;
    }
    const ops: EditWithPos[] = [];
    let oldIdx = 0;
    let newIdx = 0;
    for (const op of editScript) {
      if (op.type === 'equal') {
        ops.push({ type: 'equal', oldIdx, newIdx });
        oldIdx++;
        newIdx++;
      } else if (op.type === 'delete') {
        ops.push({ type: 'delete', oldIdx });
        oldIdx++;
      } else {
        ops.push({ type: 'insert', newIdx });
        newIdx++;
      }
    }

    // Find ranges of changes (non-equal ops) and expand with context
    const changeIndices: number[] = [];
    for (let i = 0; i < ops.length; i++) {
      if (ops[i]!.type !== 'equal') {
        changeIndices.push(i);
      }
    }

    if (changeIndices.length === 0) return [];

    // Group changes into hunk ranges with context
    const hunkRanges: Array<{ start: number; end: number }> = [];
    let rangeStart = Math.max(0, changeIndices[0]! - contextLines);
    let rangeEnd = Math.min(ops.length - 1, changeIndices[0]! + contextLines);

    for (let i = 1; i < changeIndices.length; i++) {
      const changeStart = changeIndices[i]! - contextLines;
      const changeEnd = changeIndices[i]! + contextLines;

      if (changeStart <= rangeEnd + 1) {
        // Merge with current range
        rangeEnd = Math.min(ops.length - 1, changeEnd);
      } else {
        // Save current range and start new one
        hunkRanges.push({ start: rangeStart, end: rangeEnd });
        rangeStart = Math.max(0, changeStart);
        rangeEnd = Math.min(ops.length - 1, changeEnd);
      }
    }
    hunkRanges.push({ start: rangeStart, end: rangeEnd });

    // Convert ranges to hunk output
    const hunks: Array<{
      oldStart: number;
      oldCount: number;
      newStart: number;
      newCount: number;
      lines: string[];
    }> = [];

    for (const range of hunkRanges) {
      const hunkLines: string[] = [];
      let hunkOldStart = -1;
      let hunkNewStart = -1;
      let hunkOldCount = 0;
      let hunkNewCount = 0;

      for (let i = range.start; i <= range.end; i++) {
        const op = ops[i]!;
        if (op.type === 'equal') {
          if (hunkOldStart === -1) hunkOldStart = op.oldIdx!;
          if (hunkNewStart === -1) hunkNewStart = op.newIdx!;
          hunkLines.push(` ${oldLines[op.oldIdx!]}`);
          hunkOldCount++;
          hunkNewCount++;
        } else if (op.type === 'delete') {
          if (hunkOldStart === -1) hunkOldStart = op.oldIdx!;
          if (hunkNewStart === -1) {
            // Find the corresponding new line position
            // Look ahead for the next equal or insert op
            for (let j = i + 1; j <= range.end; j++) {
              if (ops[j]!.newIdx !== undefined) {
                hunkNewStart = ops[j]!.newIdx!;
                break;
              }
            }
            if (hunkNewStart === -1) hunkNewStart = newLines.length;
          }
          hunkLines.push(`-${oldLines[op.oldIdx!]}`);
          hunkOldCount++;
        } else {
          // insert
          if (hunkNewStart === -1) hunkNewStart = op.newIdx!;
          if (hunkOldStart === -1) {
            // Look ahead for next equal or delete op
            for (let j = i + 1; j <= range.end; j++) {
              if (ops[j]!.oldIdx !== undefined) {
                hunkOldStart = ops[j]!.oldIdx!;
                break;
              }
            }
            if (hunkOldStart === -1) hunkOldStart = oldLines.length;
          }
          hunkLines.push(`+${newLines[op.newIdx!]}`);
          hunkNewCount++;
        }
      }

      // Use 1-based line numbers
      hunks.push({
        oldStart: hunkOldStart + 1,
        oldCount: hunkOldCount,
        newStart: hunkNewStart + 1,
        newCount: hunkNewCount,
        lines: hunkLines,
      });
    }

    return hunks;
  }
}
