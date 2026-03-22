# Project Milestones: Flutter-TUI

<!-- Entries in reverse chronological order - newest first -->

## v1.1 Amp CLI Feature Parity — Shipped 2026-03-22

**Scope**: Phases 9-15 (16 plans, 38 requirements)
**Result**: Full Amp CLI TUI widget parity with code-review fixes. 2165 tests, 0 failures.
**Stats**: 64 test files, ~25K lines TypeScript

**What shipped**:
- TextStyle/TextSpan API enhancements (copyWith, static factories, hyperlink, onClick, equals)
- ClipCanvas paint wrapper with CJK width-aware clipping
- RenderFlex intrinsic size methods
- MediaQuery, Theme, HoverContext InheritedWidgets
- WidgetsBinding enhancements (mouseManager, focusManager, eventCallbacks, keyInterceptors, async runApp)
- MouseManager singleton with hit-test offset accumulation, opaque blocking, cursor z-order
- ScrollController animation/followMode
- FocusScope/KeyboardListener, ClipRect, IntrinsicHeight, Scrollbar
- DiffView, Dialog, SelectionList, Markdown, ContainerWithOverlays
- RenderText selection/highlight, character position tracking, hyperlink click, emoji width
- Debug Inspector HTTP server (9 endpoints, periodic scanning, ring buffer keystroke history)
- 14 code-review fixes (4 CRITICAL, 6 WARNING, 4 NITPICK)

**Post-completion code review** (Linus-style, 2 parallel reviewers):
- CRITICAL: Hit-test offset accumulation, opaque property wiring, CJK clip boundary, pipeline parity
- WARNING: `as any` removal, cached require, closure-local counter, TOCTOU fix, disposed guards, cursor z-order
- NITPICK: Ring buffer, WeakMap reset, partial border clipping, redundant handlers

## v1.0 MVP — Shipped 2026-03-21

**Scope**: Phases 1-8 (25 plans)
**Result**: Complete Flutter three-tree TUI framework with 1567 tests, 28 example apps, VitePress documentation
**Stats**: 43 test files, 0 failures, ~15K lines TypeScript

**What shipped**:
- Core primitives (Offset, Size, Rect, Color, TextStyle, TextSpan, BoxConstraints, Key)
- Terminal layer (Cell, ScreenBuffer, double-buffered diff, ANSI renderer, raw mode)
- Three-tree framework (Widget/Element/RenderObject, BuildOwner, PipelineOwner, runApp)
- Layout system (Flex 6-step, Padding, ConstrainedBox, DecoratedBox)
- Frame scheduler (on-demand 4-phase pipeline, PaintContext)
- Input system (keyboard, SGR mouse, focus management, event dispatch)
- 20+ widgets (Text, Container, Row, Column, ScrollView, TextField, Button, Table, Stack, etc.)
- Diagnostics (PerfOverlay, FrameStats, debug flags)
- 28 example applications
- VitePress documentation site (62 pages)
