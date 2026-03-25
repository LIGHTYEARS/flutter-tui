import { describe, expect, it } from 'bun:test';
import { Buffer, ScreenBuffer } from '../screen-buffer';
import {
  EMPTY_CELL,
  createCell,
  blendStyle,
} from '../cell';
import { Color, blendColor } from '../../core/color';

// ============================================================
// ScreenBuffer.setDefaultColors
// ============================================================
describe('ScreenBuffer.setDefaultColors', () => {
  it('sets defaultBg and defaultFg', () => {
    const sb = new ScreenBuffer(10, 5);
    const bg = Color.rgb(30, 30, 30);
    const fg = Color.rgb(200, 200, 200);
    sb.setDefaultColors(bg, fg);
    expect(sb.defaultBg).toBe(bg);
    expect(sb.defaultFg).toBe(fg);
  });

  it('allows setting only bg', () => {
    const sb = new ScreenBuffer(10, 5);
    const bg = Color.rgb(30, 30, 30);
    sb.setDefaultColors(bg);
    expect(sb.defaultBg).toBe(bg);
    expect(sb.defaultFg).toBeUndefined();
  });

  it('allows setting only fg', () => {
    const sb = new ScreenBuffer(10, 5);
    const fg = Color.rgb(200, 200, 200);
    sb.setDefaultColors(undefined, fg);
    expect(sb.defaultBg).toBeUndefined();
    expect(sb.defaultFg).toBe(fg);
  });

  it('defaults are initially undefined', () => {
    const sb = new ScreenBuffer(10, 5);
    expect(sb.defaultBg).toBeUndefined();
    expect(sb.defaultFg).toBeUndefined();
  });

  it('can clear defaults by passing undefined', () => {
    const sb = new ScreenBuffer(10, 5);
    sb.setDefaultColors(Color.red, Color.green);
    sb.setDefaultColors(undefined, undefined);
    expect(sb.defaultBg).toBeUndefined();
    expect(sb.defaultFg).toBeUndefined();
  });
});

// ============================================================
// ScreenBuffer.setIndexRgbMapping
// ============================================================
describe('ScreenBuffer.setIndexRgbMapping', () => {
  it('stores the mapping', () => {
    const sb = new ScreenBuffer(10, 5);
    const mapping = new Map<number, Color>();
    mapping.set(196, Color.rgb(255, 0, 0));
    mapping.set(46, Color.rgb(0, 255, 0));
    sb.setIndexRgbMapping(mapping);
    expect(sb.indexRgbMapping).toBe(mapping);
    expect(sb.indexRgbMapping!.get(196)!.r).toBe(255);
    expect(sb.indexRgbMapping!.get(46)!.g).toBe(255);
  });

  it('starts as undefined', () => {
    const sb = new ScreenBuffer(10, 5);
    expect(sb.indexRgbMapping).toBeUndefined();
  });
});

// ============================================================
// Buffer.copyTo
// ============================================================
describe('Buffer.copyTo', () => {
  it('deep copies all cells to target', () => {
    const src = new Buffer(5, 3);
    src.setCell(0, 0, createCell('A', { bold: true }));
    src.setCell(4, 2, createCell('Z', { fg: Color.red }));

    const target = new Buffer(5, 3);
    src.copyTo(target);

    expect(target.getCell(0, 0).char).toBe('A');
    expect(target.getCell(0, 0).style.bold).toBe(true);
    expect(target.getCell(4, 2).char).toBe('Z');
    expect(target.getCell(4, 2).style.fg).toBe(Color.red);
  });

  it('copies are independent (modifying target does not affect source)', () => {
    const src = new Buffer(3, 3);
    src.setCell(1, 1, createCell('X', { italic: true }));

    const target = new Buffer(3, 3);
    src.copyTo(target);

    target.setCell(1, 1, createCell('Y'));
    expect(src.getCell(1, 1).char).toBe('X');
    expect(target.getCell(1, 1).char).toBe('Y');
  });

  it('copies are deep (style objects are not shared)', () => {
    const src = new Buffer(3, 3);
    const style = { bold: true, fg: Color.rgb(10, 20, 30) };
    src.setCell(0, 0, createCell('M', style));

    const target = new Buffer(3, 3);
    src.copyTo(target);

    // Style objects should be different references
    const srcStyle = src.getCell(0, 0).style;
    const tgtStyle = target.getCell(0, 0).style;
    expect(srcStyle).not.toBe(tgtStyle);
    expect(tgtStyle.bold).toBe(true);
    expect(tgtStyle.fg!.r).toBe(10);
  });

  it('preserves EMPTY_CELL references for empty cells', () => {
    const src = new Buffer(3, 3);
    const target = new Buffer(3, 3);
    src.copyTo(target);

    // All cells should be EMPTY_CELL
    expect(target.getCell(0, 0)).toBe(EMPTY_CELL);
    expect(target.getCell(2, 2)).toBe(EMPTY_CELL);
  });

  it('resizes target if dimensions differ', () => {
    const src = new Buffer(5, 5);
    src.setCell(3, 3, createCell('Q'));

    const target = new Buffer(2, 2);
    src.copyTo(target);

    expect(target.width).toBe(5);
    expect(target.height).toBe(5);
    expect(target.getCell(3, 3).char).toBe('Q');
  });
});

// ============================================================
// Buffer.getDeepCopiedCells
// ============================================================
describe('Buffer.getDeepCopiedCells', () => {
  it('returns array of same length', () => {
    const buf = new Buffer(4, 3);
    const cells = buf.getDeepCopiedCells();
    expect(cells.length).toBe(12);
  });

  it('returns deep copies (not same references)', () => {
    const buf = new Buffer(3, 3);
    buf.setCell(1, 1, createCell('X', { bold: true }));

    const cells = buf.getDeepCopiedCells();
    const idx = 1 * 3 + 1; // row 1, col 1
    expect(cells[idx]!.char).toBe('X');
    expect(cells[idx]!.style.bold).toBe(true);

    // Should be a different reference
    const rawCells = buf.getCells();
    expect(cells[idx]).not.toBe(rawCells[idx]);
  });

  it('preserves EMPTY_CELL references for empty cells', () => {
    const buf = new Buffer(3, 3);
    const cells = buf.getDeepCopiedCells();
    expect(cells[0]).toBe(EMPTY_CELL);
  });

  it('modifying returned array does not affect buffer', () => {
    const buf = new Buffer(3, 3);
    buf.setCell(0, 0, createCell('A'));

    const cells = buf.getDeepCopiedCells();
    cells[0] = createCell('Z');

    expect(buf.getCell(0, 0).char).toBe('A');
  });

  it('getCells still returns raw array for performance', () => {
    const buf = new Buffer(3, 3);
    buf.setCell(0, 0, createCell('A'));

    const raw = buf.getCells();
    raw[0] = createCell('Z');

    // Modifying raw array DOES affect buffer (by design)
    expect(buf.getCell(0, 0).char).toBe('Z');
  });
});

// ============================================================
// blendStyle function
// ============================================================
describe('blendStyle', () => {
  it('returns front style when no alpha blending needed', () => {
    const front = { fg: Color.red, bg: Color.blue, bold: true };
    const back = { fg: Color.green, bg: Color.yellow, italic: true };
    const result = blendStyle(front, back);

    expect(result.fg).toBe(Color.red); // alpha=1.0, no blend
    expect(result.bg).toBe(Color.blue); // alpha=1.0, no blend
    expect(result.bold).toBe(true);
  });

  it('blends fg colors when front fg has alpha < 1', () => {
    const front = { fg: Color.rgb(255, 0, 0).withAlpha(0.5) };
    const back = { fg: Color.rgb(0, 255, 0) };
    const result = blendStyle(front, back);

    expect(result.fg!.mode).toBe('rgb');
    expect(result.fg!.r).toBe(128);
    expect(result.fg!.g).toBe(128);
  });

  it('blends bg colors when front bg has alpha < 1', () => {
    const front = { bg: Color.rgb(255, 0, 0).withAlpha(0.5) };
    const back = { bg: Color.rgb(0, 0, 255) };
    const result = blendStyle(front, back);

    expect(result.bg!.mode).toBe('rgb');
    expect(result.bg!.r).toBe(128);
    expect(result.bg!.b).toBe(128);
  });

  it('falls back to back fg when front has no fg', () => {
    const front = { bold: true };
    const back = { fg: Color.green };
    const result = blendStyle(front, back);
    expect(result.fg).toBe(Color.green);
  });

  it('falls back to back bg when front has no bg', () => {
    const front = { bold: true };
    const back = { bg: Color.blue };
    const result = blendStyle(front, back);
    expect(result.bg).toBe(Color.blue);
  });

  it('inherits boolean attrs from front with fallback to back', () => {
    const front = { bold: true };
    const back = { italic: true, underline: true, bold: false };
    const result = blendStyle(front, back);

    expect(result.bold).toBe(true);     // from front
    expect(result.italic).toBe(true);   // from back (front undefined)
    expect(result.underline).toBe(true); // from back (front undefined)
  });

  it('front alpha fg with no back fg uses front fg as-is', () => {
    const front = { fg: Color.rgb(255, 0, 0).withAlpha(0.5) };
    const back = {};
    const result = blendStyle(front, back);

    // No back fg to blend with, so front fg is used as-is
    expect(result.fg).toBe(front.fg);
  });
});
