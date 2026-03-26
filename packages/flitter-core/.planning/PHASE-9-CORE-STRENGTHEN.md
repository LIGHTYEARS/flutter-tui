# Phase 9: flitter-core TUI Capability Strengthening

> Prerequisite for Phase 8 Amp CLI layout bug fixes
> Generated from Amp CLI capability audit vs flitter-core gap analysis

## Scope

Strengthen flitter-core's primitives so flitter-amp can faithfully reproduce the Amp CLI TUI.
Only items that **block** or **materially degrade** Amp reproduction are included.

## Items (Priority Order)

### P1: `BorderPainter` Utility — Extended Box-Drawing Characters

**Status**: flitter-core's `PaintContext.drawBorder()` only draws simple rectangular borders.
Amp's `GJH` uses T-junctions (`├ ┤ ┬ ┴ ┼`), internal dividers, and banner-mode corners.

**Deliverable**: A `BorderPainter` utility module exporting:
- `BORDER_CHARS_EXTENDED` — full set of box-drawing junction characters for both `rounded` and `solid` styles
- `drawHorizontalDivider(ctx, x, y, width, style, color)` — draws `├───┤` (left/right T + horizontal line)
- `drawVerticalDivider(ctx, x, y, height, style, color)` — draws `┬│...│┴` (top/bottom T + vertical line)

**File**: `src/painting/border-painter.ts` (new)

**Rationale**: The PromptBar (`F0H`) uses `GJH` which paints internal grid dividers with proper junction characters. Rather than building a monolithic custom RenderObject, we provide painting utilities that any widget can compose.

---

### P2: `RenderGridBorder` — Multi-Pane Bordered Container

**Status**: MISSING. Amp's `GJH` is used for the PromptBar — a bordered container with an internal vertical split (left pane = TextField, right pane = optional buttons), plus optional horizontal dividers between right-pane sub-children.

**Deliverable**: A custom `ContainerRenderBox` that:
1. Accepts 1-3 children (left, right-top, right-bottom)
2. Paints an outer border (rounded/solid) with internal dividers
3. Vertical divider at configurable split position (e.g., left gets remaining width, right gets fixed width)
4. Horizontal dividers between right-pane children
5. Junction characters at intersections (`┬ ┴ ├ ┤`)
6. Optional `bannerMode` — replaces top-left corner with `├` for merging with banner above

**Files**:
- `src/layout/render-grid-border.ts` (RenderObject)
- `src/widgets/grid-border.ts` (Widget wrapper)
- `src/widgets/__tests__/grid-border.test.ts` (Tests)

---

### P3: `RenderTable` — Proper N-Column Table

**Status**: Current `Table` widget is a simple 2-column `StatelessWidget` using `Row`+`Expanded`. Amp's `XYH` is a full custom RenderObject supporting N columns, multiple width modes, and border painting.

**Deliverable**: Replace `Table` with a proper `RenderTable`:
1. N-column support with `TableColumnWidth` config per column:
   - `fixed(n)` — exact width in chars
   - `flex(f)` — proportional to remaining space
   - `intrinsic()` — measure children, use max
2. Border painting between rows/columns (optional, with box-drawing chars)
3. Cell padding support
4. Header row support (optional bold styling)

**Files**:
- `src/layout/render-table.ts` (RenderObject)
- `src/widgets/table.ts` (overhaul existing widget)
- `src/widgets/__tests__/table.test.ts` (Tests)

---

### P4: `BrailleSpinner` Utility

**Status**: MISSING. Amp's `Af` uses a cellular automaton mapped to braille characters for loading indicators.

**Deliverable**: A pure utility class (no RenderObject needed):
- `BrailleSpinner` class with `step()` method advancing one generation
- `toBraille(): string` returning a single braille character (U+2800 range)
- Conway's Game of Life rules on 2x4 grid
- Auto-reseed when state becomes static/cyclical/depleted

**File**: `src/utilities/braille-spinner.ts`

---

### P5: `TreeConnector` Paint Utility

**Status**: MISSING. Amp's `cQH` paints tree connector characters (`├─`, `└─`, `│`) alongside children for file tree display.

**Deliverable**: A painting utility (not a full RenderObject) that:
- `paintTreeConnectors(ctx, x, y, heights, isLast[])` — draws tree lines alongside a column of children
- Supports configurable connector style and color

**File**: `src/painting/tree-connector.ts`

---

### P6: `ForceDim` InheritedWidget

**Status**: MISSING. Amp's `ao` propagates a `forceDim` boolean down the tree. When true, Container dims all child content.

**Deliverable**:
- `ForceDim` InheritedWidget with `forceDim: boolean`
- `ForceDim.shouldForceDim(context): boolean` static method
- Integration with `RenderDecoratedBox` — when forceDim is true, paint adds `dim: true` to all styles

**File**: `src/widgets/force-dim.ts`

---

## Out of Scope (for this phase)

| Item | Reason |
|------|--------|
| LayerLink system | Only needed for autocomplete overlay, not core Amp TUI |
| Chart RenderObject | Analytics feature, not core chat UI |
| Perlin Noise Orb | Visual branding, not functional |
| Wave Spinner | Trivial app-level `setInterval` + `setState` |
| SelectionList enhancements | Existing version is sufficient |
| Drag-to-resize | Existing MouseRegion primitives are sufficient |
| ContainerWithOverlays enhancements | Current version works for overlay positioning |

## Implementation Order

```
P1 (BorderPainter)  →  P2 (RenderGridBorder)  →  P3 (RenderTable)
                                                       ↓
P4 (BrailleSpinner)  →  P5 (TreeConnector)  →  P6 (ForceDim)
```

P1 must come first since P2 and P3 depend on the extended border characters.
P4-P6 are independent and can be done in any order.

## Verification

- All new code has unit tests
- `bun test` passes in flitter-core
- New exports added to `src/index.ts`
- TypeScript compiles cleanly
