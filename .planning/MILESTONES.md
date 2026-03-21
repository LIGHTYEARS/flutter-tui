# Project Milestones: Flutter-TUI

<!-- Entries in reverse chronological order - newest first -->

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
