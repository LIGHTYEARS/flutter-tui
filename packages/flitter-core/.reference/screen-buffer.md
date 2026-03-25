# Screen Buffer & Rendering Architecture (Amp CLI)

Reverse-engineered from `/home/gem/home/tmp/amp-strings.txt`.
All code on **line 529716** unless otherwise noted (single mega-line of bundled JS).

---

## 1. Identifier Map

| Minified | Semantic Name | Role |
|----------|--------------|------|
| `ij` | **ScreenBuffer** | Double-buffered screen abstraction |
| `$F` | **Buffer** | Single cell grid (internal to ScreenBuffer) |
| `wB0` | **TerminalManager** | Terminal I/O coordinator, owns ScreenBuffer + Renderer |
| `z_0` | **Renderer** | Builds ANSI escape strings from diff changesets |
| `bJ` | **StringBuilder** | String accumulator for composing output |
| `q3` | **createCell** | Factory function for Cell objects |
| `yu` | **EMPTY_CELL** | Default/blank cell constant |
| `w0` | **Color** | Color type with factory methods (`.default()`, `.index(n)`, `.rgb(r,g,b)`) |
| `m0` | **TextStyle** | Style object with color, bold, italic, etc. |
| `bF8` | **cellsEqual** | Deep equality check for two cells |
| `sF8` | **stylesEqual** | Deep equality check for two styles |
| `Nu0` | **colorsEqual** | Deep equality check for two colors |
| `aF8` | **blendStyle** | Alpha-composites a style over an existing cell style |
| `WF8` | **buildSgrDelta** | Computes SGR escape delta between two styles |
| `Wu0` | **colorToSgr** | Converts a Color value to an SGR string |
| `DF8` | **buildHyperlinkDelta** | Computes OSC 8 hyperlink delta |
| `n_` | **RenderObject** (base) | Flutter-style render tree base class |
| `j9` | **RenderBox** | Box-model render object with size/offset |
| `J3` | **WidgetsBinding** | Singleton orchestrating build/layout/paint/render loop |
| `c9` | **FrameScheduler** | Schedules and sequences frame callbacks |

---

## 2. ScreenBuffer (`class ij`)

The double-buffered screen. Widgets paint to the **back buffer**; after diff computation the buffers swap.

```js
class ij {
  frontBuffer;          // $F — the "committed" frame (what's on screen)
  backBuffer;           // $F — the "working" frame (widgets paint here)
  width;                // number
  height;               // number
  needsFullRefresh = false;
  cursorPosition = null;  // {x, y} | null
  cursorVisible = false;
  cursorShape = 0;        // 0..6 (DECSCUSR values)

  constructor(width = 80, height = 24) {
    this.width = width;
    this.height = height;
    this.frontBuffer = new $F(width, height);
    this.backBuffer = new $F(width, height);
  }

  // --- Accessors ---
  getSize()       // => { width, height }
  getBuffer()     // => this.backBuffer  (the writable surface)
  getCell(x, y)   // => this.backBuffer.getCell(x, y)
  getCursor()     // => this.cursorPosition
  isCursorVisible()
  getCursorShape()
  getFrontBuffer()
  getBackBuffer()
  get requiresFullRefresh()  // => this.needsFullRefresh

  // --- Mutators ---
  resize(w, h)     // resizes both buffers
  setCell(x, y, cell)
  setChar(x, y, char, style, width)  // convenience wrapper
  clear()          // clears back buffer
  fill(x, y, w, h, char = ' ', style = {})
  setDefaultColors(bg, fg)           // propagates to both buffers
  setIndexRgbMapping(mapping)        // for 256-color index -> RGB

  // --- Cursor ---
  setCursor(x, y)              // sets position + makes visible
  setCursorPositionHint(x, y)  // sets position without changing visibility
  clearCursor()                // hides and nulls position
  setCursorShape(shape)

  // --- Render cycle ---
  markForRefresh()   // forces full redraw next frame
  getDiff()          // -> CellChange[] (see section 5)
  present()          // swaps front <-> back buffer
}
```

### Key insight: `present()` is a simple pointer swap

```js
present() {
  let g = this.frontBuffer;
  this.frontBuffer = this.backBuffer;
  this.backBuffer = g;
}
```

After `present()`, the old front buffer becomes the new back buffer (recycled for next frame's painting). This is the classic double-buffer swap pattern.

---

## 3. Buffer (`class $F`)

The actual cell grid. Each ScreenBuffer contains two of these.

```js
class $F {
  cells;            // Cell[][] — [row][col] indexed
  width;            // number
  height;           // number
  indexToRgb = [];  // number[][] — maps 256-color indices to RGB triplets
  defaultBg = w0.default();
  defaultFg = w0.default();

  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = [];
    this.resize(width, height);
  }

  // --- Initialization ---
  resize(w, h) {
    this.width = w;
    this.height = h;
    // Creates fresh grid filled with EMPTY_CELL (yu)
    this.cells = Array(h).fill(null).map(() =>
      Array(w).fill(null).map(() => yu)
    );
  }

  setDefaultColors(bg, fg)
  setIndexRgbMapping(mapping)

  // --- Cell access ---
  getSize()            // => { width, height }
  getCell(x, y)        // bounds-checked, returns null if OOB
  getCellRows()        // => this.cells  (raw row arrays)
  getCells()           // => deep copy of all cells

  // --- Cell mutation ---
  setCell(x, y, cell) {
    // Bounds check
    // Alpha blending: if fg or bg has alpha < 1, composites
    //   using aF8() over the existing cell style
    // Wide char support: fills trailing columns with space cells
    if (cell.width > 1) {
      for (r = 1; r < cell.width; r++)
        this.cells[y][x + r] = createCell(' ', cell.style, 1);
    }
  }

  setChar(x, y, char, style, width) {
    this.setCell(x, y, q3(char, style, width));
  }

  clear()              // fills all cells with EMPTY_CELL
  fill(x, y, w, h, char = ' ', style = {})
  copyTo(target)       // copies cells to another Buffer
}
```

---

## 4. Cell Structure

### Cell object (`q3` / `createCell`)

```js
function q3(char = ' ', style = {}, width = 1, hyperlink) {
  return {
    char: char,        // string — the displayed character
    style: { ...style },
    width: width,      // 1 for normal, 2 for CJK/wide chars
    hyperlink: hyperlink  // { uri, id } | undefined — OSC 8
  };
}

// Default empty cell:
var yu = q3(' ', {});
```

### Style properties

A cell's `style` object can have:

| Property | Type | SGR Code |
|----------|------|----------|
| `fg` | Color | 30-37, 38;5;n, 38;2;r;g;b, 39 |
| `bg` | Color | 40-47, 48;5;n, 48;2;r;g;b, 49 |
| `bold` | boolean | 1 / 22 |
| `dim` | boolean | 2 / 22 |
| `italic` | boolean | 3 / 23 |
| `underline` | boolean | 4 / 24 |
| `strikethrough` | boolean | 9 / 29 |
| `reverse` | boolean | 7 / 27 |

### Color type (`w0`)

Factory methods observed:
- `w0.default()` — terminal default color (type: "default")
- `w0.index(n)` — 256-color palette (type: "index", value: n)
- `w0.rgb(r, g, b)` — true color (type: "rgb", value: {r, g, b})
- Colors can have an `alpha` property for compositing

Color object shapes:
```
{ type: "none" }
{ type: "default" }
{ type: "index", value: number }
{ type: "rgb", value: { r: number, g: number, b: number } }
```

### Cell equality (`bF8`)

```js
function bF8(cellA, cellB) {
  return cellA.char === cellB.char
    && cellA.width === cellB.width
    && sF8(cellA.style, cellB.style)      // style deep equal
    && tJ(cellA.hyperlink, cellB.hyperlink);  // hyperlink deep equal
}

function sF8(styleA, styleB) {
  return Nu0(styleA.fg, styleB.fg)
    && Nu0(styleA.bg, styleB.bg)
    && styleA.bold === styleB.bold
    && styleA.italic === styleB.italic
    && styleA.underline === styleB.underline
    && styleA.strikethrough === styleB.strikethrough
    && styleA.reverse === styleB.reverse
    && styleA.dim === styleB.dim;
}
```

---

## 5. `getDiff()` -- Cell-Level Diff Algorithm

Returns an array of `{ x, y, cell }` change objects representing only the cells that differ between the back buffer (newly painted) and the front buffer (currently displayed).

```js
getDiff() {
  let changes = [];
  let frontRows = this.frontBuffer.getCellRows();
  let backRows = this.backBuffer.getCellRows();

  // FULL REFRESH PATH:
  if (this.needsFullRefresh) {
    for (let y = 0; y < this.height; y++) {
      let row = backRows[y];
      if (!row) continue;
      for (let x = 0; x < this.width; x++) {
        let cell = row[x] ?? EMPTY_CELL;
        changes.push({ x, y, cell });
        if (cell.width > 1) x += cell.width - 1;  // skip wide-char trailing
      }
    }
    this.needsFullRefresh = false;
    return changes;
  }

  // INCREMENTAL DIFF PATH:
  for (let y = 0; y < this.height; y++) {
    let frontRow = frontRows[y];
    let backRow = backRows[y];
    if (!frontRow || !backRow) continue;

    for (let x = 0; x < this.width; x++) {
      let frontCell = frontRow[x] ?? EMPTY_CELL;
      let backCell = backRow[x] ?? EMPTY_CELL;

      // Skip identical empty cells
      if (frontCell === EMPTY_CELL && backCell === EMPTY_CELL) continue;

      if (!cellsEqual(frontCell, backCell)) {
        changes.push({ x, y, cell: backCell });
        if (backCell.width > 1) x += backCell.width - 1;
      } else if (backCell.width > 1) {
        x += backCell.width - 1;
      }
    }
  }
  return changes;
}
```

**Key properties**:
- Identity check (`===`) for EMPTY_CELL as fast-path skip
- Deep equality via `bF8` / `cellsEqual` for populated cells
- Wide character awareness (skips trailing columns of 2-wide chars)
- No dirty-region tracking -- scans entire grid every frame
- Output is a flat array of changes, not grouped by region

---

## 6. Render Pipeline (TerminalManager `wB0.render()`)

Called from `WidgetsBinding` after paint phase.

```js
render() {
  if (!this.initialized) throw Error("TUI not initialized");
  if (this.suspended) return;

  // 1. Diff
  let diff = this.screen.getDiff();
  let size = this.screen.getSize();
  let totalCells = size.width * size.height;
  let changedCells = diff.length;
  let repaintPercent = totalCells > 0 ? changedCells / totalCells * 100 : 0;

  // Track stats
  this.lastRenderDiffStats = {
    repaintedCellCount: changedCells,
    totalCellCount: totalCells,
    repaintedPercent: repaintPercent,
    bytesWritten: 0
  };

  let cursor = this.screen.getCursor();

  if (diff.length > 0 || cursor !== null) {
    let output = new bJ();  // StringBuilder

    // 2. Begin Synchronized Update (BSU)
    output.append(this.renderer.startSync());  // ESC[?2026h

    // 3. Hide cursor during rendering
    output.append(this.renderer.hideCursor());  // ESC[?25l

    // 4. Reset SGR state
    output.append(this.renderer.reset());       // ESC[0m + OSC 8 close

    // 5. Home cursor
    output.append(this.renderer.moveTo(0, 0));  // ESC[1;1H

    // 6. Render diff cells to ANSI
    let rendered = this.renderer.render(diff);
    output.append(rendered);

    // 7. Position cursor
    if (cursor) {
      output.append(this.renderer.moveTo(cursor.x, cursor.y));
      if (this.screen.isCursorVisible()) {
        output.append(this.renderer.setCursorShape(
          this.screen.getCursorShape()
        ));
        output.append(this.renderer.showCursor());  // ESC[?25h
      } else {
        output.append(this.renderer.hideCursor());
      }
    } else {
      output.append(this.renderer.hideCursor());
    }

    // 8. End Synchronized Update (ESU)
    output.append(this.renderer.endSync());  // ESC[?2026l

    // 9. Write to stdout
    let str = output.toString();
    this.lastRenderDiffStats.bytesWritten =
      Buffer.byteLength(str, 'utf8');
    process.stdout.write(str);

    // 10. Swap buffers
    this.screen.present();
  }
}
```

---

## 7. Renderer (`class z_0`)

Converts diff changesets into ANSI escape sequences. Maintains SGR state to emit minimal deltas.

```js
class z_0 {
  capabilities;     // terminal capability flags
  currentStyle = {};  // tracks emitted SGR state
  currentX = 0;
  currentY = 0;

  render(diff) {
    if (diff.length === 0) return '';
    let out = new bJ();
    let lastStyle = null;
    let lastHyperlink;
    let lastEndX = -1, lastY = -1;
    let currentRowY = -1, skipUntilX = -1;

    for (let change of diff) {
      let char = change.cell.char;
      let isControl = isControlChar(char);
      let displayChar = isControl ? replacementChar(char) : char;

      // Track row changes
      if (change.y !== currentRowY) {
        currentRowY = change.y;
        skipUntilX = -1;
      }
      // Skip cells covered by previous wide char on same row
      if (skipUntilX !== -1 && change.x < skipUntilX) continue;
      skipUntilX = -1;

      // Emit cursor movement if needed (skip if continuing from last cell)
      if (!(lastStyle !== null
        && change.y === lastY
        && change.x === lastEndX
        && stylesMatch(lastStyle, change.cell.style)
        && hyperlinksMatch(lastHyperlink, change.cell.hyperlink)))
      {
        if (this.currentX !== change.x || this.currentY !== change.y) {
          out.append(moveTo(change.y, change.x));
          // ESC[{row+1};{col+1}H
        }
        // Emit SGR delta
        out.append(buildSgrDelta(change.cell.style, this.currentStyle, this.capabilities));
        // Emit hyperlink delta
        out.append(buildHyperlinkDelta(change.cell.hyperlink, this.currentStyle));
        lastStyle = change.cell.style;
        lastHyperlink = change.cell.hyperlink;
      }

      // Emit the character
      out.append(formatCell(change.cell, this.capabilities));
      this.currentX += change.cell.width;
      lastEndX = change.x + change.cell.width;
      lastY = change.y;

      // Wide char: mark trailing columns to skip
      if (change.cell.width > 1) {
        skipUntilX = change.x + change.cell.width;
      }
    }
    return out.toString();
  }

  // --- Escape sequence generators ---
  clearScreen()   // ESC[0m + close hyperlink + ESC[2J + ESC[H
  hideCursor()    // ESC[?25l
  showCursor()    // ESC[?25h
  setCursorShape(n)  // ESC[{n} q  (DECSCUSR)
  reset()         // ESC[0m + close hyperlink
  moveTo(x, y)    // ESC[{y+1};{x+1}H
  startSync()     // ESC[?2026h (BSU)
  endSync()       // ESC[?2026l (ESU)
  enterAltScreen()   // ESC[?1049h + clear
  exitAltScreen()    // ESC[?1049l
  enableMouse(pixel)    // ESC[?1002h + ?1003h + ?1004h + ?1006h [+ ?1016h]
  disableMouse()        // ESC[?1002l + ?1003l + ?1004l + ?1006l + ?1016l
  enableBracketedPaste()   // ESC[?2004h
  disableBracketedPaste()  // ESC[?2004l
  enableKittyKeyboard()    // ESC[>5u
  disableKittyKeyboard()   // ESC[<u
  enableModifyOtherKeys()  // ESC[>4;1m
  disableModifyOtherKeys() // ESC[>4;0m
  enableEmojiWidth()       // ESC[?2027h
  disableEmojiWidth()      // ESC[?2027l
  enableInBandResize()     // ESC[?2048h
  disableInBandResize()    // ESC[?2048l
  setProgressBarIndeterminate()  // OSC 9;4;3 ST
  setProgressBarOff()            // OSC 9;4;0 ST
  setProgressBarPaused()         // OSC 9;4;4 ST
}
```

---

## 8. ANSI/SGR Escape Sequence Constants

All defined as variables near the Renderer class:

```js
var ESC  = '\x1B';        // sf
var CSI  = '\x1B[';       // W3

// Reset
var SGR_RESET       = CSI + '0m';     // _u0
var SGR_RESET_SHORT = CSI + 'm';      // fF8

// Cursor positioning
var MOVE_TO = (row, col) => CSI + `${row+1};${col+1}H`;  // Bu0
var HOME    = CSI + 'H';              // uF8

// Cursor visibility
var HIDE_CURSOR = CSI + '?25l';       // nF8
var SHOW_CURSOR = CSI + '?25h';       // lF8

// Screen
var CLEAR_SCREEN = CSI + '2J';        // dF8

// Synchronized Update (flicker-free rendering)
var BSU = CSI + '?2026h';             // $F8  — Begin Synchronized Update
var ESU = CSI + '?2026l';             // iF8  — End Synchronized Update

// Bracketed Paste
var ENABLE_BRACKETED_PASTE  = CSI + '?2004h';  // yF8
var DISABLE_BRACKETED_PASTE = CSI + '?2004l';  // oF8

// Alt Screen
var ENTER_ALT_SCREEN = CSI + '?1049h';  // xF8
var EXIT_ALT_SCREEN  = CSI + '?1049l';  // vF8

// Mouse tracking
var ENABLE_MOUSE = CSI + '?1002h' + CSI + '?1003h'
                 + CSI + '?1004h' + CSI + '?1006h';  // kF8
var DISABLE_MOUSE = CSI + '?1002l' + CSI + '?1003l'
                  + CSI + '?1004l' + CSI + '?1006l';  // RF8
var ENABLE_PIXEL_MOUSE  = CSI + '?1016h';  // SF8
var DISABLE_PIXEL_MOUSE = CSI + '?1016l';  // eF8

// Emoji width (mode 2027)
var ENABLE_EMOJI_WIDTH  = CSI + '?2027h';  // PF8
var DISABLE_EMOJI_WIDTH = CSI + '?2027l';  // IF8

// In-band resize (mode 2048)
var ENABLE_INBAND_RESIZE  = CSI + '?2048h';  // jF8
var DISABLE_INBAND_RESIZE = CSI + '?2048l';  // hF8

// Kitty keyboard protocol
var ENABLE_KITTY_KBD  = CSI + '>5u';   // cF8
var DISABLE_KITTY_KBD = CSI + '<u';    // MF8

// ModifyOtherKeys
var ENABLE_MODIFY_OTHER_KEYS  = CSI + '>4;1m';  // LF8
var DISABLE_MODIFY_OTHER_KEYS = CSI + '>4;0m';  // AF8

// Cursor shape (DECSCUSR)
var SET_CURSOR_SHAPE = (n) => CSI + `${n} q`;  // _F8

// Mouse cursor (OSC 22)
var SET_MOUSE_SHAPE = (name) => ESC + `]22;${name}` + ESC + '\\';  // TF8

// Window title (OSC 0)
var SET_TITLE = (title) => ESC + `]0;${title}\x07`;  // OF8

// Tab width
var TAB_WIDTH = 4;  // G_0

// Hyperlinks (OSC 8)
var HYPERLINK_OPEN  = (link) => `\x1B]8;id=${link.id};${link.uri}\x1B\\`;  // pF8
var HYPERLINK_CLOSE = '\x1B]8;;\x1B\\';  // iF (function)
```

---

## 9. SGR String Building

### Color to SGR (`Wu0`)

```js
function Wu0(color, isForeground, capabilities) {
  if (!color) return '';
  switch (color.type) {
    case 'none':    return '';
    case 'default': return CSI + (isForeground ? '39' : '49') + 'm';
    case 'index':   return CSI + `${isForeground ? '38' : '48'};5;${color.value}m`;
    case 'rgb': {
      if (capabilities && !capabilities.canRgb) {
        // Fallback: find nearest 256-color index
        let idx = sJ(color.value.r, color.value.g, color.value.b);
        return CSI + `${isForeground ? '38' : '48'};5;${idx}m`;
      }
      let prefix = isForeground ? '38' : '48';
      let { r, g, b } = color.value;
      return CSI + `${prefix};2;${r};${g};${b}m`;
    }
  }
}
```

### RGB to 256-color Nearest-Match (`sJ`)

Uses a pre-computed 240-entry palette (216 color cube + 24 grayscale) and Euclidean distance with caching:

```js
// Palette: 216 colors (6x6x6 cube) + 24 grays
var Uu0 = [
  ...Array.from({length: 216}, (_, i) => {
    let r = Math.floor(i / 36);
    let g = Math.floor(i % 36 / 6);
    let b = i % 6;
    let map = (c) => c === 0 ? 0 : 55 + c * 40;
    return [map(r), map(g), map(b)];
  }),
  ...Array.from({length: 24}, (_, i) => {
    let v = 8 + i * 10;
    return [v, v, v];
  })
];

// Cache: "r,g,b" -> index
var Hu0 = new Map();

function sJ(r, g, b) {
  let key = `${r},${g},${b}`;
  let cached = Hu0.get(key);
  if (cached !== undefined) return cached;

  let bestIdx = 16, bestDist = Infinity;
  for (let i = 0; i < Uu0.length; i++) {
    let [pr, pg, pb] = Uu0[i];
    let dist = (r - pr)**2 + (g - pg)**2 + (b - pb)**2;
    if (dist < bestDist) { bestDist = dist; bestIdx = i + 16; }
  }
  Hu0.set(key, bestIdx);
  return bestIdx;
}
```

### Style Delta (`WF8` / `buildSgrDelta`)

Compares current emitted style vs desired style, emitting only changed attributes:

```js
function WF8(desired, currentState, capabilities) {
  let s = '';
  // Foreground
  if (!colorsEqual(desired.fg, currentState.fg)) {
    if (desired.fg === undefined && currentState.fg !== undefined)
      s += CSI + '39m';  // reset to default
    else
      s += colorToSgr(desired.fg, true, capabilities);
    currentState.fg = desired.fg;
  }
  // Background (similar)
  // Bold: 1m on, 22m off (also resets dim, so re-emit dim if needed)
  // Italic: 3m / 23m
  // Underline: 4m / 24m (respects capabilities.underlineSupport)
  // Strikethrough: 9m / 29m
  // Reverse: 7m / 27m
  // Dim: 2m / 22m (also resets bold, so re-emit bold if needed)
  return s;
}
```

---

## 10. BSU / ESU (Synchronized Update)

**Purpose**: Prevents screen tearing/flicker during multi-cell updates.

- **BSU** = `ESC[?2026h` (Begin Synchronized Update) -- tells terminal to buffer output
- **ESU** = `ESC[?2026l` (End Synchronized Update) -- tells terminal to flush/display

Found at:
- Line 1492: `[?2026h` (raw string)
- Line 1495: `[?2026l` (raw string)
- Line 529716: `$F8 = W3 + "?2026h"` (BSU constant)
- Line 529716: `iF8 = W3 + "?2026l"` (ESU constant)
- Line 296192: `[?2026hH` (BSU + Home combined in some context)
- Line 296353: `[?2026lH` (ESU + Home combined in some context)

**Render cycle wrapping**:
```
BSU -> hide cursor -> reset SGR -> render diff cells -> position cursor -> show cursor -> ESU
```

---

## 11. Cursor Management

Cursor state is tracked in ScreenBuffer (`ij`):

```js
// In ScreenBuffer:
setCursor(x, y) {
  this.cursorPosition = { x, y };
  this.cursorVisible = true;
}

setCursorPositionHint(x, y) {
  // Sets position without changing visibility
  this.cursorPosition = { x, y };
}

clearCursor() {
  this.cursorPosition = null;
  this.cursorVisible = false;
}

setCursorShape(shape)  // DECSCUSR: 0=default, 1=block blink, 2=block, etc.
```

In the render cycle (TerminalManager):
1. Cursor is hidden at start: `ESC[?25l`
2. After rendering diff, cursor is repositioned: `ESC[{row+1};{col+1}H`
3. If cursor should be visible: shape set via `ESC[{n} q`, then shown via `ESC[?25h`
4. If not visible: remains hidden

---

## 12. Dirty Region Tracking

**There is no explicit dirty region tracking.** The diff algorithm (`getDiff()`) scans the **entire grid** every frame, comparing front vs back buffer cell-by-cell. The only optimization is:

1. **`needsFullRefresh` flag**: When set (e.g., after resize, resume), skips comparison and emits all back-buffer cells
2. **Identity check for EMPTY_CELL**: `if (front === yu && back === yu) continue;` -- fast-path skip when both cells are the same empty cell object reference
3. **Wide-char skip**: Advances x by `cell.width` to avoid redundant checks on trailing columns

The `markForRefresh()` method sets `needsFullRefresh = true`, forcing the next `getDiff()` to return every cell.

---

## 13. TerminalManager (`class wB0`)

The top-level terminal I/O coordinator. Singleton owned by `WidgetsBinding`.

```js
class wB0 {
  parser = null;          // yJ — terminal input parser
  initialized = false;
  inAltScreen = false;
  suspended = false;
  tty;                    // TTY handle
  screen;                 // ij (ScreenBuffer)
  renderer;               // z_0 (Renderer)
  queryParser = null;     // vF — capability detection parser
  capabilities = null;    // resolved terminal capabilities
  terminalSize = { width: 80, height: 24 };

  // Event handler arrays
  keyHandlers = [];
  mouseHandlers = [];
  resizeHandlers = [];
  focusHandlers = [];
  pasteHandlers = [];
  capabilityHandlers = [];

  lastRenderDiffStats = {
    repaintedCellCount: 0,
    totalCellCount: 1920,
    repaintedPercent: 0,
    bytesWritten: 0
  };

  constructor() {
    this.screen = new ij(80, 24);    // ScreenBuffer
    this.renderer = new z_0();       // Renderer
    this.tty = createTty();
  }

  // --- Lifecycle ---
  init()    // sets up parser, registers event handlers, enters alt screen
  deinit()  // cleanup: disable modes, restore cursor, exit alt screen

  // --- Rendering ---
  render()  // the full render cycle (see section 6)
  clearScreen()
  showCursor() / hideCursor()

  // --- Alt screen ---
  enterAltScreen() / exitAltScreen()
  isInAltScreen()

  // --- Mouse ---
  enableMouse() / disableMouse()

  // --- Input ---
  onKey(handler) / offKey(handler)
  onMouse(handler) / offMouse(handler)
  onResize(handler) / offResize(handler)
  onFocus(handler) / offFocus(handler)
  onPaste(handler) / offPaste(handler)
  onCapabilities(handler) / offCapabilities(handler)

  // --- Terminal info ---
  getSize()          // => { width, height }
  getScreen()        // => this.screen (ij)
  getCapabilities()
  getLastRenderDiffStats()

  // --- Suspend/Resume ---
  suspend()   // disables all modes, pauses TTY
  resume()    // re-enables modes, marks screen for refresh
}
```

### Terminal cleanup (`zG8` function)

Called on process exit/SIGINT/SIGTERM:

```js
function zG8() {
  // Restore console
  _m.getInstance().restoreConsole();

  // Disable all terminal modes
  process.stdout.write('\x1B[?1002l');  // mouse button tracking
  process.stdout.write('\x1B[?1003l');  // any-event mouse
  process.stdout.write('\x1B[?1004l');  // focus events
  process.stdout.write('\x1B[?1006l');  // SGR mouse
  process.stdout.write('\x1B[?1016l');  // pixel mouse
  process.stdout.write('\x1B[?2004l');  // bracketed paste
  process.stdout.write('\x1B[?2031l');  // color palette notifications
  process.stdout.write('\x1B[?2048l');  // in-band resize
  process.stdout.write('\x1B[<u');      // kitty keyboard
  process.stdout.write('\x1B[?1049l');  // alt screen
  process.stdout.write('\x1B[0 q');     // reset cursor shape
  process.stdout.write('\x1B[?25h');    // show cursor
  process.stdout.write('\x1B[999;1H');  // move to bottom
  process.stdout.write('\x1B[0m');      // reset SGR

  // iTerm progress bar reset
  if (!process.env.TERM_PROGRAM?.startsWith('iTerm'))
    process.stdout.write('\x1B]9;4;0\x1B\\');
}
```

---

## 14. Alpha Compositing (`aF8`)

When a cell has semi-transparent colors (alpha < 1), the style is blended over the existing cell:

```js
function aF8(newStyle, existingStyle, defaultBg, defaultFg, indexToRgb) {
  let result = { ...existingStyle };
  if (newStyle.fg) {
    if (existingStyle.fg)
      result.fg = blendColor(newStyle.fg, existingStyle.fg, indexToRgb);
    else
      result.fg = blendColor(newStyle.fg, defaultFg, indexToRgb);
  }
  if (newStyle.bg) {
    let alpha = getAlpha(newStyle.bg);
    if (newStyle.bg.type === 'none' || alpha === 0) {
      if (existingStyle.bg) result.bg = existingStyle.bg;
    } else if (existingStyle.bg) {
      result.bg = blendColor(newStyle.bg, existingStyle.bg, indexToRgb);
    } else {
      result.bg = blendColor(newStyle.bg, defaultBg, indexToRgb);
    }
  }
  // Copy boolean attributes if defined
  if (newStyle.bold !== undefined) result.bold = newStyle.bold;
  if (newStyle.italic !== undefined) result.italic = newStyle.italic;
  // ... etc for underline, strikethrough, reverse, dim
  return result;
}
```

---

## 15. Frame Pipeline (WidgetsBinding `J3`)

The overall frame pipeline that drives rendering:

```
Frame Start
  -> Process Resize (if pending)
  -> Build Phase (reconcile widget tree)
  -> Layout Phase (compute sizes/positions)
  -> Paint Phase (widgets paint to back buffer via setCell/setChar)
  -> Render Phase (diff + emit ANSI + swap buffers)
```

Registered callbacks in `WidgetsBinding` constructor:
```js
this.frameScheduler.addFrameCallback("frame-start", () => this.beginFrame(), "build", -2000);
this.frameScheduler.addFrameCallback("resize", () => this.processResizeIfPending(), "build", -1000);
this.frameScheduler.addFrameCallback("build", () => { this.buildOwner.buildScopes(); ... }, "build", 0);
this.frameScheduler.addFrameCallback("layout", () => { ... flushLayout() ... }, "layout", 0);
this.frameScheduler.addFrameCallback("paint", () => this.paint(), "paint", 0);
this.frameScheduler.addFrameCallback("render", () => this.render(), "render", 0);
```

---

## 16. Performance Tracking (`_B0` / `BB0`)

The framework tracks render performance metrics:

```js
class _B0 {  // PerformanceTracker
  frameTimes = [];
  phaseTimes = { build: [], layout: [], paint: [], render: [] };
  keyEventTimes = [];
  mouseEventTimes = [];
  repaintPercents = [];
  bytesWritten = [];
  MAX_SAMPLES = 1024;

  // Records and provides P95/P99 percentiles for:
  // - Total frame time
  // - Per-phase times (build, layout, paint, render)
  // - Key/mouse event processing times
  // - Repaint percentage (% of cells changed per frame)
  // - Bytes written to stdout per frame
}
```

The "Gotta Go Fast" overlay (`BB0`) can display these stats live in the TUI.

---

## 17. SGR Parsing (for ANSI input processing)

The `oX8` function parses SGR parameters from incoming ANSI sequences (used when processing styled text content, not for output):

```js
function oX8(currentStyle, csiEvent) {
  let params = extractParams(csiEvent.params);
  if (params.length === 0) params.push(0);
  let style = currentStyle;

  for (let i = 0; i < params.length; i++) {
    let p = params[i];
    switch (p) {
      case 0:  style = new TextStyle(); break;        // reset
      case 1:  style = style.copyWith({bold: true}); break;
      case 2:  style = style.copyWith({dim: true}); break;
      case 3:  style = style.copyWith({italic: true}); break;
      case 4:  style = style.copyWith({underline: true}); break;
      case 9:  style = style.copyWith({strikethrough: true}); break;
      case 22: style = style.copyWith({bold: false, dim: false}); break;
      case 23: style = style.copyWith({italic: false}); break;
      case 24: style = style.copyWith({underline: false}); break;
      case 29: style = style.copyWith({strikethrough: false}); break;
      case 30..37:  style = style.copyWith({color: w0.index(p - 30)}); break;
      case 38:      /* extended fg: 256-color or RGB */ break;
      case 39:      style = style.copyWith({color: w0.default()}); break;
      case 40..47:  style = style.copyWith({backgroundColor: w0.index(p - 40)}); break;
      case 48:      /* extended bg */ break;
      case 49:      style = style.copyWith({backgroundColor: w0.default()}); break;
      case 90..97:  style = style.copyWith({color: w0.index(p - 90 + 8)}); break;
      case 100..107: style = style.copyWith({backgroundColor: w0.index(p - 100 + 8)}); break;
    }
  }
  return style;
}
```

---

## Summary of Rendering Flow

```
Widgets paint() calls:
  screen.setCell(x, y, cell)
  screen.setChar(x, y, char, style, width)
      |
      v
  backBuffer cells[][] is populated
      |
      v
  wB0.render():
    1. screen.getDiff()      -- compare front vs back buffer
    2. renderer.startSync()  -- BSU: ESC[?2026h
    3. renderer.hideCursor() -- ESC[?25l
    4. renderer.render(diff) -- emit ANSI: cursor moves + SGR + chars
    5. position cursor       -- ESC[row;colH
    6. renderer.endSync()    -- ESU: ESC[?2026l
    7. process.stdout.write(output)
    8. screen.present()      -- swap front <-> back
```
