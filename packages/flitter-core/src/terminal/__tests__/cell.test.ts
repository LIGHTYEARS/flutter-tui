import { describe, expect, it } from 'bun:test';
import {
  type Cell,
  type CellStyle,
  EMPTY_CELL,
  createCell,
  cellsEqual,
  stylesEqual,
  cloneCell,
} from '../cell';
import { Color } from '../../core/color';

// ============================================================
// EMPTY_CELL
// ============================================================
describe('EMPTY_CELL', () => {
  it('is a space with empty style and width 1', () => {
    expect(EMPTY_CELL.char).toBe(' ');
    expect(EMPTY_CELL.width).toBe(1);
    expect(EMPTY_CELL.style).toEqual({});
    expect(EMPTY_CELL.hyperlink).toBeUndefined();
  });

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(EMPTY_CELL)).toBe(true);
    expect(Object.isFrozen(EMPTY_CELL.style)).toBe(true);
  });

  it('is a singleton for identity comparison', () => {
    expect(EMPTY_CELL === EMPTY_CELL).toBe(true);
  });
});

// ============================================================
// createCell
// ============================================================
describe('createCell', () => {
  it('creates a cell with defaults', () => {
    const cell = createCell();
    expect(cell.char).toBe(' ');
    expect(cell.width).toBe(1);
    expect(cell.style).toEqual({});
    expect(cell.hyperlink).toBeUndefined();
  });

  it('creates a cell with specified values', () => {
    const style: CellStyle = { bold: true, fg: Color.red };
    const cell = createCell('A', style, 1, 'https://example.com');
    expect(cell.char).toBe('A');
    expect(cell.width).toBe(1);
    expect(cell.style.bold).toBe(true);
    expect(cell.style.fg).toBe(Color.red);
    expect(cell.hyperlink).toBe('https://example.com');
  });

  it('creates a width-2 cell for CJK', () => {
    const cell = createCell('\u4e16', {}, 2);
    expect(cell.char).toBe('\u4e16');
    expect(cell.width).toBe(2);
  });

  it('copies style object (not shared reference)', () => {
    const style: CellStyle = { bold: true };
    const cell = createCell('X', style);
    style.bold = false; // mutate original
    expect(cell.style.bold).toBe(true); // cell unaffected
  });
});

// ============================================================
// stylesEqual
// ============================================================
describe('stylesEqual', () => {
  it('returns true for two empty styles', () => {
    expect(stylesEqual({}, {})).toBe(true);
  });

  it('returns true for identical non-empty styles', () => {
    const a: CellStyle = { bold: true, italic: true, fg: Color.red, bg: Color.blue };
    const b: CellStyle = { bold: true, italic: true, fg: Color.red, bg: Color.blue };
    expect(stylesEqual(a, b)).toBe(true);
  });

  it('returns false when bold differs', () => {
    expect(stylesEqual({ bold: true }, { bold: false })).toBe(false);
    expect(stylesEqual({ bold: true }, {})).toBe(false);
  });

  it('returns false when fg color differs', () => {
    expect(stylesEqual({ fg: Color.red }, { fg: Color.blue })).toBe(false);
  });

  it('returns false when bg color differs', () => {
    expect(stylesEqual({ bg: Color.green }, {})).toBe(false);
  });

  it('returns true for equal RGB colors', () => {
    const a: CellStyle = { fg: Color.rgb(100, 200, 50) };
    const b: CellStyle = { fg: Color.rgb(100, 200, 50) };
    expect(stylesEqual(a, b)).toBe(true);
  });

  it('checks all boolean attributes', () => {
    const base: CellStyle = {
      bold: true,
      italic: true,
      underline: true,
      strikethrough: true,
      dim: true,
      inverse: true,
    };
    expect(stylesEqual(base, { ...base })).toBe(true);
    expect(stylesEqual(base, { ...base, dim: false })).toBe(false);
    expect(stylesEqual(base, { ...base, inverse: false })).toBe(false);
    expect(stylesEqual(base, { ...base, underline: false })).toBe(false);
    expect(stylesEqual(base, { ...base, strikethrough: false })).toBe(false);
  });
});

// ============================================================
// cellsEqual
// ============================================================
describe('cellsEqual', () => {
  it('returns true for same reference', () => {
    const cell = createCell('A');
    expect(cellsEqual(cell, cell)).toBe(true);
  });

  it('returns true for EMPTY_CELL identity', () => {
    expect(cellsEqual(EMPTY_CELL, EMPTY_CELL)).toBe(true);
  });

  it('returns true for equivalent cells', () => {
    const a = createCell('X', { bold: true }, 1);
    const b = createCell('X', { bold: true }, 1);
    expect(cellsEqual(a, b)).toBe(true);
  });

  it('returns false when char differs', () => {
    expect(cellsEqual(createCell('A'), createCell('B'))).toBe(false);
  });

  it('returns false when width differs', () => {
    expect(cellsEqual(createCell('A', {}, 1), createCell('A', {}, 2))).toBe(false);
  });

  it('returns false when style differs', () => {
    expect(cellsEqual(
      createCell('A', { bold: true }),
      createCell('A', { bold: false }),
    )).toBe(false);
  });

  it('returns false when hyperlink differs', () => {
    expect(cellsEqual(
      createCell('A', {}, 1, 'https://a.com'),
      createCell('A', {}, 1, 'https://b.com'),
    )).toBe(false);
  });

  it('handles hyperlink present vs absent', () => {
    expect(cellsEqual(
      createCell('A', {}, 1, 'https://a.com'),
      createCell('A', {}, 1),
    )).toBe(false);
  });
});

// ============================================================
// cloneCell
// ============================================================
describe('cloneCell', () => {
  it('creates a deep copy', () => {
    const original = createCell('Z', { fg: Color.green, bold: true }, 1, 'https://link.com');
    const clone = cloneCell(original);

    expect(cellsEqual(original, clone)).toBe(true);
    expect(clone).not.toBe(original);
    expect(clone.style).not.toBe(original.style);
  });

  it('clone mutation does not affect original', () => {
    const original = createCell('A', { bold: true });
    const clone = cloneCell(original);
    clone.char = 'B';
    clone.style.bold = false;

    expect(original.char).toBe('A');
    expect(original.style.bold).toBe(true);
  });
});
