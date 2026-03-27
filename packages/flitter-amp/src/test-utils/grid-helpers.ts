/**
 * grid-helpers — cell-level assertion utilities for visual testing.
 *
 * Operates on the grid returned by captureToGrid():
 *   { getCell(x, y): { char, style }, width, height }
 *
 * Provides text extraction, text search, and style assertion helpers.
 */

import { Color } from 'flitter-core/src/core/color';
import { expect } from 'bun:test';

// ── Types ─────────────────────────────────────────────────────────────

export interface GridCell {
  char: string;
  style: CellStyleSnapshot;
}

export interface CellStyleSnapshot {
  fg?: Color;
  bg?: Color;
  /** Runtime cells may use TextStyle property names instead of CellStyle. */
  foreground?: Color;
  background?: Color;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  dim?: boolean;
  inverse?: boolean;
}

export interface Grid {
  getCell(x: number, y: number): GridCell;
  width: number;
  height: number;
}

export interface StyleExpectation {
  fg?: Color;
  bg?: Color;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  dim?: boolean;
  inverse?: boolean;
}

export interface TextLocation {
  x: number;
  y: number;
}

// ── ANSI stripping ────────────────────────────────────────────────────

/**
 * Strip ANSI escape sequences from a string.
 * Handles CSI (ESC[...), OSC (ESC]...\x07|\x1b\\), and simple ESC sequences.
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[A-Za-z]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[()][0-9A-Za-z]|\x1b[>=<]|\x1b\[[\?]?[0-9;]*[hlm]/g, '');
}

// ── Text extraction ───────────────────────────────────────────────────

/**
 * Read all characters in a row, right-trimmed.
 */
export function readRow(grid: Grid, y: number): string {
  let row = '';
  for (let x = 0; x < grid.width; x++) {
    row += grid.getCell(x, y).char;
  }
  return row.replace(/\s+$/, '');
}

/**
 * Read all rows as an array of right-trimmed strings.
 */
export function readScreenText(grid: Grid): string[] {
  const lines: string[] = [];
  for (let y = 0; y < grid.height; y++) {
    lines.push(readRow(grid, y));
  }
  return lines;
}

/**
 * Read a rectangular region as an array of strings.
 */
export function readRegion(grid: Grid, x: number, y: number, w: number, h: number): string[] {
  const lines: string[] = [];
  for (let row = y; row < y + h && row < grid.height; row++) {
    let line = '';
    for (let col = x; col < x + w && col < grid.width; col++) {
      line += grid.getCell(col, row).char;
    }
    lines.push(line.replace(/\s+$/, ''));
  }
  return lines;
}

// ── Text search ───────────────────────────────────────────────────────

/**
 * Find all occurrences of `needle` in the grid.
 * Returns {x, y} for the start of each match.
 */
export function findText(grid: Grid, needle: string): TextLocation[] {
  const results: TextLocation[] = [];
  for (let y = 0; y < grid.height; y++) {
    const row = readRow(grid, y);
    let idx = 0;
    while ((idx = row.indexOf(needle, idx)) !== -1) {
      results.push({ x: idx, y });
      idx += 1;
    }
  }
  return results;
}

/**
 * Find exactly one occurrence of `needle`. Throws if 0 or >1 matches.
 */
export function findTextOnce(grid: Grid, needle: string): TextLocation {
  const matches = findText(grid, needle);
  if (matches.length === 0) {
    const screenDump = readScreenText(grid).filter(l => l.length > 0).join('\n');
    throw new Error(`findTextOnce: "${needle}" not found in grid.\nScreen:\n${screenDump}`);
  }
  if (matches.length > 1) {
    throw new Error(
      `findTextOnce: "${needle}" found ${matches.length} times (expected 1). ` +
      `Locations: ${matches.map(m => `(${m.x},${m.y})`).join(', ')}`,
    );
  }
  return matches[0]!;
}

/**
 * Find the first row index containing `needle`, or -1 if not found.
 */
export function findRow(grid: Grid, needle: string): number {
  for (let y = 0; y < grid.height; y++) {
    if (readRow(grid, y).includes(needle)) return y;
  }
  return -1;
}

// ── Text assertions ───────────────────────────────────────────────────

/**
 * Assert that row `y` contains the substring.
 */
export function assertRowContains(grid: Grid, y: number, substring: string): void {
  const row = readRow(grid, y);
  expect(row).toContain(substring);
}

/**
 * Assert that characters at (x, y) match `expected` exactly.
 */
export function assertTextAt(grid: Grid, x: number, y: number, expected: string): void {
  let actual = '';
  for (let i = 0; i < expected.length; i++) {
    actual += grid.getCell(x + i, y).char;
  }
  if (actual !== expected) {
    throw new Error(
      `assertTextAt(${x},${y}): expected "${expected}" but got "${actual}"`,
    );
  }
}

// ── Style assertions ──────────────────────────────────────────────────

/**
 * Assert style properties at a single cell position.
 * Only checks fields present in `expected`.
 */
export function assertStyleAt(
  grid: Grid,
  x: number,
  y: number,
  expected: Partial<StyleExpectation>,
): void {
  const cell = grid.getCell(x, y);
  const style = cell.style;
  const pos = `(${x},${y}) char='${cell.char}'`;

  if (expected.bold !== undefined) {
    expect((style.bold ?? false), `${pos}: bold`).toBe(expected.bold);
  }
  if (expected.italic !== undefined) {
    expect((style.italic ?? false), `${pos}: italic`).toBe(expected.italic);
  }
  if (expected.dim !== undefined) {
    expect((style.dim ?? false), `${pos}: dim`).toBe(expected.dim);
  }
  if (expected.underline !== undefined) {
    expect((style.underline ?? false), `${pos}: underline`).toBe(expected.underline);
  }
  if (expected.strikethrough !== undefined) {
    expect((style.strikethrough ?? false), `${pos}: strikethrough`).toBe(expected.strikethrough);
  }
  if (expected.inverse !== undefined) {
    expect((style.inverse ?? false), `${pos}: inverse`).toBe(expected.inverse);
  }
  if (expected.fg !== undefined) {
    const actualFg = resolveFg(style);
    if (!actualFg) {
      throw new Error(`${pos}: expected fg color but style.fg/foreground is undefined`);
    }
    if (!actualFg.equals(expected.fg)) {
      throw new Error(
        `${pos}: fg color mismatch — expected ${colorDesc(expected.fg)} but got ${colorDesc(actualFg)}`,
      );
    }
  }
  if (expected.bg !== undefined) {
    const actualBg = resolveBg(style);
    if (!actualBg) {
      throw new Error(`${pos}: expected bg color but style.bg/background is undefined`);
    }
    if (!actualBg.equals(expected.bg)) {
      throw new Error(
        `${pos}: bg color mismatch — expected ${colorDesc(expected.bg)} but got ${colorDesc(actualBg)}`,
      );
    }
  }
}

/**
 * Assert that all cells in range [x, x+length) at row y share the specified style.
 */
export function assertStyleRange(
  grid: Grid,
  x: number,
  y: number,
  length: number,
  expected: Partial<StyleExpectation>,
): void {
  for (let i = 0; i < length; i++) {
    assertStyleAt(grid, x + i, y, expected);
  }
}

// ── Counting helpers ──────────────────────────────────────────────────

/**
 * Count rows that have at least one non-space character.
 */
export function countNonBlankRows(grid: Grid): number {
  let count = 0;
  for (let y = 0; y < grid.height; y++) {
    const row = readRow(grid, y);
    if (row.length > 0) count++;
  }
  return count;
}

// ── Internal helpers ──────────────────────────────────────────────────

/**
 * Resolve the foreground color from a cell style.
 * Runtime cells may use either CellStyle (`fg`) or TextStyle (`foreground`) property names
 * due to a type-level mismatch in the rendering pipeline (TextStyle objects flow through
 * as CellStyle at runtime without property name remapping).
 */
function resolveFg(style: CellStyleSnapshot): Color | undefined {
  return style.fg ?? style.foreground;
}

/**
 * Resolve the background color from a cell style.
 */
function resolveBg(style: CellStyleSnapshot): Color | undefined {
  return style.bg ?? style.background;
}

function colorDesc(c: Color): string {
  if (c.mode === 'rgb') {
    const r = (c.value >> 16) & 0xff;
    const g = (c.value >> 8) & 0xff;
    const b = c.value & 0xff;
    return `rgb(${r},${g},${b})`;
  }
  return `${c.mode}(${c.value})`;
}
