---
phase: "10"
plan: "03"
subsystem: framework
tags: [binding, runApp, mediaquery, events, interceptors]
dependency-graph:
  requires: [10-01]
  provides: [async-runApp, widgetsbinding-events, context-mediaquery]
  affects: [framework/binding, framework/element, framework/widget, examples]
tech-stack:
  added: []
  patterns: [async-entry-point, event-callback-chains, interceptor-pattern]
key-files:
  created:
    - src/framework/__tests__/binding-enhancements.test.ts
  modified:
    - src/framework/binding.ts
    - src/framework/element.ts
    - src/framework/widget.ts
    - src/framework/__tests__/binding.test.ts
    - src/scheduler/__tests__/integration.test.ts
    - examples/__tests__/examples.test.ts
    - examples/__tests__/new-examples.test.ts
    - examples/hello-world.ts (and 22 other example files)
decisions:
  - "Used .then() pattern in examples for async runApp at module level"
  - "Imported KeyEvent/MouseEvent types from input/events.ts for event callbacks"
  - "mediaQuery getter on BuildContextImpl uses lazy require to avoid circular deps"
metrics:
  duration: "~11 minutes"
  completed: "2026-03-22"
  tasks-completed: 3
  tasks-total: 3
  tests-added: 24
  tests-total: 1752
  files-changed: 32
requirements:
  - FRMW-12
  - FRMW-13
  - FRMW-14
  - FRMW-15
  - FRMW-16
---

# Phase 10 Plan 03: WidgetsBinding Enhancements + async runApp Summary

WidgetsBinding gains event infrastructure (mouseManager, eventCallbacks, keyInterceptors), runApp becomes async with automatic MediaQuery wrapping, and BuildContext gets a convenience mediaQuery getter.

## Tasks Completed

### Task 1: WidgetsBinding Enhancements (FRMW-12, FRMW-13, FRMW-14)

Added three new fields to the WidgetsBinding class:

- **`mouseManager: any | null`** (FRMW-12) -- Placeholder field for future Phase 11 MouseManager integration. Defaults to null, reset on `WidgetsBinding.reset()`.

- **`eventCallbacks`** (FRMW-13) -- Global event callback lists with `key`, `mouse`, and `paste` arrays. These callbacks are invoked before the focus system processes events. Supports multiple callbacks per event type.

- **`keyInterceptors`** (FRMW-14) -- Keyboard event interceptor chain. Array of functions returning `'handled' | 'ignored'`. Called in order; first `'handled'` return stops propagation.

All three fields are properly cleaned up in `WidgetsBinding.reset()`.

### Task 2: Async runApp + MediaQuery Wrapping (FRMW-15)

Changed `runApp` from synchronous to async:
- Signature: `async function runApp(widget: Widget): Promise<WidgetsBinding>`
- Automatically wraps the user's widget in `MediaQuery(data: MediaQueryData.fromTerminal(cols, rows), child: widget)`
- In test mode (BUN_TEST set), uses 80x24 defaults
- In production mode, attempts to get real terminal size from `BunPlatform.getTerminalSize()`
- Registers SIGWINCH handler for terminal resize events (updates MediaQuery data)
- Updated all 23 examples and 3 test files to handle async return

### Task 3: BuildContext.mediaQuery Getter (FRMW-16)

Added `mediaQuery` getter to `BuildContextImpl`:
- Returns `MediaQueryData | undefined` from the nearest ancestor `MediaQuery` InheritedWidget
- Uses lazy `require()` for `MediaQuery` import to avoid circular dependency issues
- Shortcut for the verbose `MediaQuery.of(context)` pattern
- Also updated the `BuildContext` interface in `widget.ts` to include `readonly mediaQuery?: any`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated examples for async runApp compatibility**
- **Found during:** Task 2
- **Issue:** All 23 examples used synchronous `runApp(widget).setOutput(stdout)` at module level. The async change made `runApp` return a Promise, breaking the `.setOutput()` chain.
- **Fix:** Updated all examples to use `runApp(widget).then(binding => binding.setOutput(process.stdout))` pattern
- **Files modified:** 23 example files in `examples/`
- **Commit:** eb9cdde

**2. [Rule 3 - Blocking] Updated test files for async runApp**
- **Found during:** Task 2
- **Issue:** Existing tests in `binding.test.ts`, `integration.test.ts`, `examples.test.ts`, and `new-examples.test.ts` called `runApp()` without `await`
- **Fix:** Added `await` to all `runApp()` calls in test files
- **Files modified:** 4 test files
- **Commit:** eb9cdde

## Commits

| Hash | Message |
|------|---------|
| eb9cdde | feat(10-03): WidgetsBinding enhancements, async runApp with MediaQuery wrapping, BuildContext.mediaQuery |

## Verification

- All 1752 tests pass (1728 existing + 24 new)
- No test regressions
- WidgetsBinding fields properly initialized and cleaned up
- runApp correctly wraps in MediaQuery with 80x24 defaults in test mode
- BuildContext.mediaQuery getter correctly looks up MediaQueryData from ancestor chain

## Known Stubs

None -- all functionality is fully wired. The `mouseManager` field is intentionally null as a placeholder for Phase 11's MouseManager implementation.

## Self-Check: PASSED

- All key files exist on disk
- Commit eb9cdde verified in git log
- 1752 tests pass (0 failures)
