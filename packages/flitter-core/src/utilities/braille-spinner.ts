// BrailleSpinner — cellular automaton spinner mapped to Unicode braille characters
// Amp ref: class Af in amp-js-strings.txt
//
// Uses a 2×4 grid (matching the braille dot layout) running a simplified
// Game of Life-like rule set. Each generation maps to a single Unicode
// braille character (U+2800 range).
//
// Usage:
//   const spinner = new BrailleSpinner();
//   setInterval(() => {
//     spinner.step();
//     setText(spinner.toBraille());
//   }, 100);

// ---------------------------------------------------------------------------
// Braille dot layout (2 cols × 4 rows):
//
//   dot1(0,0)  dot4(1,0)
//   dot2(0,1)  dot5(1,1)
//   dot3(0,2)  dot6(1,2)
//   dot7(0,3)  dot8(1,3)
//
// Braille codepoint = 0x2800 + weighted sum of active dots
// ---------------------------------------------------------------------------

const DOT_WEIGHTS = [
  [0x01, 0x08],  // row 0: dot1, dot4
  [0x02, 0x10],  // row 1: dot2, dot5
  [0x04, 0x20],  // row 2: dot3, dot6
  [0x40, 0x80],  // row 3: dot7, dot8
];

const GRID_ROWS = 4;
const GRID_COLS = 2;

/**
 * A cellular automaton-based spinner that outputs a single Unicode braille
 * character per frame.
 *
 * The automaton runs on a 2×4 grid using Game of Life-like rules:
 * - A live cell with 1-3 live neighbors survives
 * - A dead cell with exactly 2-3 live neighbors is born
 * - Otherwise the cell dies
 *
 * Auto-reseeds when the state becomes static, cyclical (period ≤ 4),
 * or depleted (fewer than 2 live cells).
 */
export class BrailleSpinner {
  private _grid: boolean[][];
  private _history: number[] = [];
  private _maxHistory = 5;

  constructor() {
    this._grid = this._randomGrid();
  }

  /** Advance one generation. */
  step(): void {
    const next = this._emptyGrid();

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const neighbors = this._countNeighbors(r, c);
        if (this._grid[r][c]) {
          // Survive with 1-3 neighbors
          next[r][c] = neighbors >= 1 && neighbors <= 3;
        } else {
          // Born with 2-3 neighbors
          next[r][c] = neighbors >= 2 && neighbors <= 3;
        }
      }
    }

    this._grid = next;

    // Track history for cycle/stagnation detection
    const code = this._toCode();
    this._history.push(code);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    // Check for stagnation or depletion
    if (this._shouldReseed()) {
      this._grid = this._randomGrid();
      this._history = [];
    }
  }

  /** Convert current grid state to a single braille character. */
  toBraille(): string {
    return String.fromCodePoint(0x2800 + this._toCode());
  }

  /** Get the raw braille code point offset (0-255). */
  toCode(): number {
    return this._toCode();
  }

  /** Reset with a fresh random state. */
  reset(): void {
    this._grid = this._randomGrid();
    this._history = [];
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private _toCode(): number {
    let code = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this._grid[r][c]) {
          code |= DOT_WEIGHTS[r][c];
        }
      }
    }
    return code;
  }

  private _countNeighbors(row: number, col: number): number {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
          if (this._grid[nr][nc]) count++;
        }
      }
    }
    return count;
  }

  private _shouldReseed(): boolean {
    // Depleted: fewer than 2 live cells
    let liveCount = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this._grid[r][c]) liveCount++;
      }
    }
    if (liveCount < 2) return true;

    // Static: last 2+ frames identical
    const h = this._history;
    if (h.length >= 2 && h[h.length - 1] === h[h.length - 2]) return true;

    // Cyclical: period ≤ 4 (check if current appears earlier in history)
    if (h.length >= 4) {
      const current = h[h.length - 1];
      for (let i = 0; i < h.length - 1; i++) {
        if (h[i] === current) return true;
      }
    }

    return false;
  }

  private _randomGrid(): boolean[][] {
    const grid: boolean[][] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        row.push(Math.random() > 0.4); // ~60% initial density
      }
      grid.push(row);
    }
    return grid;
  }

  private _emptyGrid(): boolean[][] {
    const grid: boolean[][] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      grid.push(new Array(GRID_COLS).fill(false));
    }
    return grid;
  }
}
