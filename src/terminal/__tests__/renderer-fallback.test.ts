import { describe, it, expect } from 'bun:test';
import { Color } from '../../core/color.js';
import type { CellStyle } from '../cell.js';
import { createCell } from '../cell.js';
import {
  buildSgrDelta,
  Renderer,
  CSI,
  BSU,
  ESU,
  CURSOR_HIDE,
  CURSOR_MOVE,
  SGR_RESET,
} from '../renderer.js';
import type { TerminalCapabilities } from '../platform.js';
import type { RowPatch, Cell } from '../cell.js';

function cell(char: string, style: CellStyle = {}, width: number = 1): Cell {
  return createCell(char, style, width);
}

function rowPatch(row: number, col: number, cells: Cell[]): RowPatch {
  return { row, patches: [{ col, cells }] };
}

/** Create a capabilities object with overrides. */
function makeCaps(overrides: Partial<TerminalCapabilities> = {}): TerminalCapabilities {
  return {
    trueColor: true,
    ansi256: true,
    mouse: true,
    altScreen: true,
    syncOutput: true,
    unicode: true,
    hyperlinks: true,
    ...overrides,
  };
}

// ============================================================
// buildSgrDelta with capabilities
// ============================================================
describe('buildSgrDelta with 256-color fallback', () => {
  it('emits true-color SGR when trueColor=true', () => {
    const caps = makeCaps({ trueColor: true });
    const result = buildSgrDelta({}, { fg: Color.rgb(100, 150, 200) }, caps);
    expect(result).toBe(`${CSI}38;2;100;150;200m`);
  });

  it('emits ansi256 SGR when trueColor=false for RGB fg color', () => {
    const caps = makeCaps({ trueColor: false });
    const result = buildSgrDelta({}, { fg: Color.rgb(255, 0, 0) }, caps);
    // rgb(255,0,0) -> nearest ansi256 is 196
    expect(result).toBe(`${CSI}38;5;196m`);
  });

  it('emits ansi256 SGR when trueColor=false for RGB bg color', () => {
    const caps = makeCaps({ trueColor: false });
    const result = buildSgrDelta({}, { bg: Color.rgb(0, 255, 0) }, caps);
    // rgb(0,255,0) -> nearest ansi256 is 46
    expect(result).toBe(`${CSI}48;5;46m`);
  });

  it('does not downconvert ansi256 colors (already ansi256)', () => {
    const caps = makeCaps({ trueColor: false });
    const result = buildSgrDelta({}, { fg: Color.ansi256(123) }, caps);
    expect(result).toBe(`${CSI}38;5;123m`);
  });

  it('does not downconvert named colors', () => {
    const caps = makeCaps({ trueColor: false });
    const result = buildSgrDelta({}, { fg: Color.red }, caps);
    expect(result).toBe(`${CSI}31m`);
  });

  it('works normally without capabilities (undefined)', () => {
    // Should emit true-color as before
    const result = buildSgrDelta({}, { fg: Color.rgb(100, 150, 200) });
    expect(result).toBe(`${CSI}38;2;100;150;200m`);
  });

  it('works normally with capabilities=null', () => {
    const result = buildSgrDelta({}, { fg: Color.rgb(100, 150, 200) }, null);
    expect(result).toBe(`${CSI}38;2;100;150;200m`);
  });

  it('downconverts both fg and bg RGB in same delta', () => {
    const caps = makeCaps({ trueColor: false });
    const result = buildSgrDelta(
      {},
      { fg: Color.rgb(255, 0, 0), bg: Color.rgb(0, 0, 255) },
      caps,
    );
    // fg: rgb(255,0,0) -> 196, bg: rgb(0,0,255) -> 21
    expect(result).toContain('38;5;196');
    expect(result).toContain('48;5;21');
  });
});

// ============================================================
// Renderer with capabilities set
// ============================================================
describe('Renderer 256-color fallback via setCapabilities', () => {
  it('renders RGB as ansi256 when trueColor=false', () => {
    const renderer = new Renderer();
    renderer.setCapabilities(makeCaps({ trueColor: false }));

    const patches: RowPatch[] = [
      rowPatch(0, 0, [cell('X', { fg: Color.rgb(255, 0, 0) })]),
    ];
    const result = renderer.render(patches);

    expect(result).toContain('38;5;196');
    expect(result).not.toContain('38;2;');
  });

  it('renders RGB as true-color when trueColor=true', () => {
    const renderer = new Renderer();
    renderer.setCapabilities(makeCaps({ trueColor: true }));

    const patches: RowPatch[] = [
      rowPatch(0, 0, [cell('X', { fg: Color.rgb(255, 0, 0) })]),
    ];
    const result = renderer.render(patches);

    expect(result).toContain('38;2;255;0;0');
    expect(result).not.toContain('38;5;');
  });

  it('renders RGB as true-color when no capabilities set', () => {
    const renderer = new Renderer();
    // capabilities defaults to null

    const patches: RowPatch[] = [
      rowPatch(0, 0, [cell('X', { fg: Color.rgb(255, 0, 0) })]),
    ];
    const result = renderer.render(patches);

    expect(result).toContain('38;2;255;0;0');
  });

  it('fallback applies during reset path too', () => {
    const renderer = new Renderer();
    renderer.setCapabilities(makeCaps({ trueColor: false }));

    // Force a reset path: prev has bold+dim, next has only dim + RGB color
    // This triggers reset logic in buildSgrDelta
    const patches: RowPatch[] = [
      rowPatch(0, 0, [
        cell('A', { bold: true, dim: true }),
        cell('B', { dim: true, fg: Color.rgb(0, 255, 0) }),
      ]),
    ];
    const result = renderer.render(patches);

    // After reset, the fg color should be emitted as ansi256
    expect(result).toContain('38;5;46');
    expect(result).not.toContain('38;2;');
  });
});
