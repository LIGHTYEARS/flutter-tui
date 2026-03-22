---
phase: "14"
plan: "01"
subsystem: widgets/text
tags: [selection, position-tracking, render-text, hit-testing]
dependency_graph:
  requires: [core-types, text-style, text-span, render-object]
  provides: [text-selection, character-positions, hit-testing]
  affects: [text-widget, selection-manager]
tech_stack:
  added: []
  patterns: [position-cache-on-layout, set-based-highlight-lookup, center-based-hit-testing]
key_files:
  created:
    - src/widgets/__tests__/render-text-selection.test.ts
  modified:
    - src/widgets/text.ts
    - src/index.ts
decisions:
  - "Selection highlight uses TextStyle.copyWith to overlay background color, preserving all existing style attributes"
  - "Character position cache is rebuilt during performLayout() to stay in sync with layout alignment"
  - "getOffsetForPosition uses center-of-character distance for hit testing, with first-match tie-breaking"
  - "Copy mode falls back to selectionColor when copyHighlightColor is not set"
metrics:
  duration: "7m 19s"
  completed: "2026-03-22T03:59:51Z"
  tests_added: 43
  tests_total: 1994
  files_changed: 3
---

# Phase 14 Plan 01: Text Selection + Position Tracking Summary

RenderText enhanced with selection highlighting and character position tracking, enabling hit-testing for mouse-driven text selection and copy operations.

## Tasks Completed

### Task 1: Selection Support (ROBJ-01)

Added selection state and rendering to RenderText:

- `selectable: boolean` -- enables selection mode
- `selectedRanges: TextSelectionRange[]` -- array of {start, end} index ranges
- `selectionColor` / `copyHighlightColor` -- theme-driven highlight colors
- `highlightMode: 'selection' | 'copy' | 'none'` -- controls which color is used
- `selectableId?: string` -- unique ID for coordination across multiple RenderText instances
- `updateSelection(start, end, mode)` -- sets selection with index clamping
- `clearSelection()` -- resets all selection state

During paint, when selectable and a highlight mode is active, selected characters are drawn with their background color overridden via `TextStyle.copyWith({ background: highlightColor })`. This preserves all existing style attributes (bold, foreground color, etc.) while adding the selection background.

### Task 2: Character Position Tracking (ROBJ-02)

Added cached position data rebuilt during `performLayout()`:

- `characterPositions: CharacterPosition[]` -- per-character {col, row, width} accounting for alignment offsets and CJK double-width characters
- `visualLines: VisualLine[]` -- per-line {startIndex, endIndex, row} for line-level queries
- `getCharacterRect(index): Rect | null` -- returns bounding rectangle for a character
- `getOffsetForPosition(x, y): number` -- hit-test returning the nearest character index using center-of-character distance, with closest-row fallback for y-coordinates between lines

Position cache respects textAlign (left/center/right) and maxLines truncation.

## Decisions Made

1. **Selection highlight via copyWith**: Using `TextStyle.copyWith({ background: color })` ensures all existing text styling (bold, italic, foreground color) is preserved while only the background changes.
2. **Cache rebuild on layout**: Position caches are only rebuilt during `performLayout()`, not during paint. This ensures consistency and avoids redundant computation.
3. **Center-based hit testing**: `getOffsetForPosition` uses distance from the query point to the center of each character cell. Ties are broken by first match (leftmost character wins).
4. **Copy color fallback**: When `copyHighlightColor` is undefined, copy mode falls back to `selectionColor` rather than showing no highlight.

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all functionality is fully wired.

## Verification

- 43 new tests covering selection state, painting, position cache, visual lines, hit testing, and integration
- All 1951 existing tests continue to pass (0 failures)
- Total test count: 1994

## Commits

| Hash | Message |
|------|---------|
| d8b901a | feat(14-01): add text selection support and character position tracking to RenderText |
