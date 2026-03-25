---
phase: "12"
plan: "01"
subsystem: "widgets"
tags: [focus, keyboard, clip, render-object, stateful-widget]
dependency_graph:
  requires: [input/focus, input/events, framework/render-object, scheduler/paint-context]
  provides: [widgets/focus-scope, widgets/clip-rect]
  affects: [src/index.ts]
tech_stack:
  added: []
  patterns: [StatefulWidget-with-lifecycle, SingleChildRenderObjectWidget-with-clip]
key_files:
  created:
    - src/widgets/focus-scope.ts
    - src/widgets/clip-rect.ts
    - src/widgets/__tests__/focus-scope.test.ts
    - src/widgets/__tests__/clip-rect.test.ts
  modified:
    - src/index.ts
decisions:
  - "FocusScope creates and manages internal FocusNode when none provided externally"
  - "RenderClipRect uses PaintContext.withClip() with runtime check for fallback"
  - "FocusScope registers node with FocusManager root scope (null parent)"
metrics:
  duration: "283s"
  completed: "2026-03-22T03:17:00Z"
  tasks_completed: 2
  tasks_total: 2
  tests_added: 35
  tests_total_pass: 1864
requirements: [MWDG-01, MWDG-06]
---

# Phase 12 Plan 01: FocusScope/KeyboardListener + ClipRect Summary

FocusScope StatefulWidget managing FocusNode lifecycle with onKey/onPaste/onFocusChange callbacks, plus ClipRect SingleChildRenderObjectWidget using PaintContext.withClip() for child clipping

## What Was Built

### FocusScope Widget (MWDG-01)

A StatefulWidget that wraps a FocusNode as a widget, providing declarative focus management:

- **FocusScope class**: Accepts optional `focusNode`, `child`, `autofocus`, `canRequestFocus`, `skipTraversal`, `onKey`, `onPaste`, `onFocusChange`, and `debugLabel` properties
- **FocusScopeState**: Manages FocusNode lifecycle:
  - Creates internal FocusNode when none is provided externally
  - Sets up `onKey` and `onPaste` handlers on the effective focus node
  - Listens for focus changes and fires `onFocusChange` callback on transitions
  - Registers node with `FocusManager` on mount
  - Handles `autofocus` by calling `requestFocus()` during `initState`
  - Properly disposes owned FocusNode on unmount (leaves external nodes untouched)
  - Updates node properties (`canRequestFocus`, `skipTraversal`) on `didUpdateWidget`
- **Behavior-only widget**: `build()` returns the child directly (no render object)

### ClipRect Widget (MWDG-06)

A SingleChildRenderObjectWidget that clips child painting to parent bounds:

- **ClipRect class**: Simple wrapper that creates `RenderClipRect`
- **RenderClipRect**: A RenderBox that:
  - **Layout**: Passes constraints through to child, sizes to child size constrained by parent
  - **Paint**: Uses `PaintContext.withClip()` to create a restricted sub-context, ensuring child painting is clipped to own bounds
  - **Fallback**: If paint context doesn't support `withClip()`, paints child normally (graceful degradation)
  - Properly manages child via `adoptChild`/`dropChild`

## Key Implementation Details

- FocusScope integrates with the existing `FocusManager` singleton and `FocusNode` tree from Phase 6
- RenderClipRect delegates to `PaintContext.withClip()` from Phase 5 (paint-context.ts) for actual clip enforcement
- Both widgets follow established project patterns (options objects, Amp reference comments, proper lifecycle)

## Commits

| Hash | Message |
|------|---------|
| ec76005 | feat(12-01): add FocusScope and ClipRect widgets |

## Test Results

- 35 new tests added (22 for FocusScope, 13 for ClipRect)
- All 1864 tests pass across the full test suite

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all widgets are fully functional with no placeholder implementations.

## Self-Check: PASSED

All created files verified present. Commit ec76005 verified in git log.
