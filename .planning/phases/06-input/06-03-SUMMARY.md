---
phase: "06"
plan: "03"
subsystem: "input/event-dispatch"
tags: [event-dispatcher, input-bridge, hit-test, mouse, keyboard, dispatch-pipeline]
dependency_graph:
  requires: [06-01]
  provides: [event-dispatch, input-bridge, hit-test]
  affects: [06-02, 07-widgets]
tech_stack:
  added: []
  patterns: [singleton, discriminated-union-routing, hit-test-dfs]
key_files:
  created:
    - src/input/event-dispatcher.ts
    - src/input/input-bridge.ts
    - src/input/hit-test.ts
    - src/input/__tests__/event-dispatcher.test.ts
  modified: []
decisions:
  - "FocusManager integration uses dynamic require with try-catch for parallel development"
  - "Hit-test traverses children in reverse order (front-most first) for correct z-ordering"
  - "Global release callbacks fire before regular mouse handlers"
metrics:
  duration: "294s"
  completed: "2026-03-21T03:57:34Z"
  tests_added: 54
  tests_passing: 54
---

# Phase 06 Plan 03: Event Dispatch Pipeline Summary

EventDispatcher singleton with key interceptor pipeline, InputBridge wiring raw stdin to parsed events, and HitTest DFS traversal for mouse hit-testing on the render tree.

## What Was Built

### EventDispatcher (`src/input/event-dispatcher.ts`)
- Singleton pattern with `instance` getter and `reset()` for testing
- Key event dispatch: interceptors -> FocusManager (dynamic) -> key handlers
- Key interceptors run before focus system for global shortcuts (Ctrl+C)
- Mouse event dispatch with global release callbacks for drag operations
- Resize handler dispatch (width, height)
- Paste event dispatch with FocusManager fallback
- Focus event (terminal window) dispatch
- All handler types support add/remove registration

### InputBridge (`src/input/input-bridge.ts`)
- Connects InputParser (Plan 06-01) to EventDispatcher
- `feed(data)` accepts strings or Buffers, parses and dispatches
- `attachStdin(stream)` / `detachStdin()` for production stdin reading
- `dispose()` cleans up parser and stdin listeners
- Supports custom parser/dispatcher injection for testing

### HitTest (`src/input/hit-test.ts`)
- `hitTest(root, x, y)` returns path from deepest to shallowest RenderObject
- DFS traversal with accumulated offset conversion to local coordinates
- ContainerRenderBox children tested in reverse order (front-most first)
- `hitTestSelf(renderBox, localX, localY)` bounds check utility
- Handles nested containers, zero-size objects, and coordinate transforms

## Test Coverage

54 tests across 5 describe blocks:
- EventDispatcher: 30 tests (singleton, key/mouse/resize/paste/focus handlers, interceptors, release callbacks, routing)
- InputBridge: 8 tests (feed, escape sequences, SGR mouse, focus events, paste, ctrl keys, dispose)
- hitTest: 8 tests (single box, miss, depth ordering, nesting, boundaries, z-order, zero-size)
- hitTestSelf: 3 tests (inside, outside, boundary conditions)
- Integration: 5 tests (Ctrl+C shortcut, press/release cycle, resize, mixed events)

## Decisions Made

1. **FocusManager dynamic import**: Since Plan 06-02 (Focus system) develops in parallel, EventDispatcher uses `try { require('./focus-manager') }` with graceful fallback. This allows the dispatcher to work independently while automatically integrating when FocusManager becomes available.

2. **Hit-test child ordering**: ContainerRenderBox children are tested in reverse order (last to first) because the last child is painted on top (front-most) and should receive mouse events first.

3. **Release callback ordering**: Global release callbacks fire before regular mouse handlers on release events, matching Amp's drag-completion-first pattern from TextField.

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None. All functionality is fully wired. FocusManager integration is conditional but functional (graceful degradation, not a stub).

## Commits

| Hash | Message |
|------|---------|
| 4c1361d | feat(06-03): implement event dispatch pipeline |

## Self-Check: PASSED

All 4 created files verified present. Commit 4c1361d verified in git log. 54 tests passing, 0 failures in new code.
