---
phase: "09"
plan: "01"
subsystem: "core/text-style"
tags: [text-style, copyWith, static-factories, tdd]
dependency-graph:
  requires: []
  provides: [TextStyle.copyWith, TextStyle.normal, TextStyle.bold, TextStyle.italic, TextStyle.underline, TextStyle.colored, TextStyle.background]
  affects: [screen-buffer, widgets/text, ansi-parser]
tech-stack:
  added: []
  patterns: [immutable-copyWith, static-factory-methods]
key-files:
  created: []
  modified:
    - src/core/text-style.ts
    - src/core/__tests__/text-style.test.ts
decisions:
  - "copyWith uses undefined-checking identical to merge(), matching Amp m0.copyWith behavior"
  - "static normal() returns empty TextStyle when no color provided (foreground stays undefined)"
metrics:
  duration: "~2 minutes"
  completed: "2026-03-22"
  tasks: 2
  files: 2
  tests-added: 18
  tests-total: 53
requirements: [TEXT-01, TEXT-02]
---

# Phase 9 Plan 01: TextStyle Enhancements Summary

TextStyle.copyWith() with undefined-checking and 6 static factories (normal, bold, italic, underline, colored, background) matching Amp m0 API.

## What Was Done

### Task 1: TDD RED - Failing Tests (82058ab)
- Added 6 tests for `copyWith()`: field override, empty override, no-args copy, all-fields override, empty-base copy, immutability check
- Added 12 tests for static factories: `normal`, `bold`, `italic`, `underline`, `colored`, `background` -- each with and without color argument
- All 18 new tests failed as expected; all 35 existing tests continued to pass

### Task 2: TDD GREEN - Implementation (64a1f3c)
- Implemented `copyWith(overrides?)` method using undefined-checking on each field, creating a new TextStyle with specified overrides applied on top of current values
- Implemented 6 static factory methods:
  - `static normal(color?)` -- returns empty TextStyle or one with just foreground
  - `static bold(color?)` -- returns TextStyle with bold=true and optional foreground
  - `static italic(color?)` -- returns TextStyle with italic=true and optional foreground
  - `static underline(color?)` -- returns TextStyle with underline=true and optional foreground
  - `static colored(color)` -- returns TextStyle with just foreground color
  - `static background(color)` -- returns TextStyle with just background color
- All 53 tests pass (35 existing + 18 new)

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- All 53 TextStyle tests pass
- Full suite: 1585 tests, 0 failures across 43 files
- No regressions detected

## Known Stubs

None - all implementations are complete and fully wired.

## Self-Check: PASSED
