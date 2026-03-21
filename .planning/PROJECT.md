# Flutter-TUI

## What This Is

A complete TUI (Terminal User Interface) rendering framework for TypeScript/Bun, faithfully reproducing Flutter's three-tree architecture (Widget → Element → RenderObject) for the terminal. It provides a declarative, composable widget system with box-constraint layout, double-buffered cell-level diff rendering, and 60fps frame scheduling — enabling developers to build rich, performant terminal applications using familiar Flutter patterns.

## Core Value

Deliver a production-grade, Flutter-faithful TUI framework where developers compose terminal UIs from declarative widgets with real layout constraints, achieving 60fps rendering through cell-level diffing — no other TypeScript TUI library provides this architecture.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Core type primitives (Offset, Size, Rect, Color, TextStyle, TextSpan, BoxConstraints, Key)
- [ ] Terminal abstraction layer (Cell, ScreenBuffer, diff, ANSI renderer, raw mode, capability detection)
- [ ] Three-tree framework (Widget/Element/RenderObject lifecycle, BuildOwner, PipelineOwner, runApp)
- [ ] Layout system (Flex 6-step algorithm, Padding, ConstrainedBox, DecoratedBox)
- [ ] Frame scheduler + paint pipeline (60fps, 4-phase pipeline, PaintContext, clip support)
- [ ] Input system (keyboard, mouse SGR, input parser state machine, focus management)
- [ ] High-level widgets (Text, Container, Row, Column, ScrollView, ListView, TextField, Button, Table)
- [ ] Diagnostics + examples (PerformanceOverlay, FrameStats, debug flags, 8 example apps)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- GPU rendering — terminal is character-cell based, no GPU acceleration needed
- JSX/TSX syntax — pure TypeScript constructors, following Flutter's non-JSX pattern
- Node.js compatibility layer — Bun-first, may work on Node but not a goal for v1
- Accessibility (screen reader) — complex and orthogonal to the core rendering architecture
- Image protocol (Kitty/Sixel) — focus on text/box-drawing character rendering first
- Animation framework — defer tweens/curves to v2; v1 handles manual setState-driven updates

## Context

- Reverse-engineered from Amp CLI binary analysis revealing a complete Flutter-for-Terminal implementation
- Key architectural patterns identified: immutable Widgets, mutable Elements/RenderObjects, synchronous frame pipeline
- Terminal rendering uses double-buffered ScreenBuffer with cell-level diff producing minimal ANSI escape sequences
- All coordinates are integer (col, row) — no sub-pixel positioning
- CJK wide-character support required (wcwidth)
- Built with Bun v1.3.10 runtime, TypeScript, using bun test for testing

## Constraints

- **Runtime**: Bun (primary), TypeScript strict mode
- **Coordinates**: Integer-only (col, row) — no floating point in layout
- **Testing**: TDD with bun test, >80% coverage on core modules
- **Architecture**: Must faithfully follow Flutter's three-tree model — no shortcuts that break the abstraction
- **Performance**: 1000-widget tree must maintain 60fps rendering
- **Dependencies**: Zero runtime dependencies (only dev dependencies for testing)

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Integer coordinates everywhere | Terminal cells are discrete; sub-pixel makes no sense | — Pending |
| Immutable Widget, mutable Element/RenderObject | Faithful to Flutter model; enables efficient reconciliation | — Pending |
| Synchronous frame pipeline (BUILD→LAYOUT→PAINT→RENDER) | Simpler than async; terminal doesn't need async rendering | — Pending |
| Cell-level diff (not line-level) | Produces minimal ANSI output; better performance | — Pending |
| No JSX | Matches Flutter pattern; pure constructor composition | — Pending |
| Bun-first | Better performance than Node; native TypeScript support | — Pending |
| Zero runtime deps | Framework should be self-contained; reduces supply chain risk | — Pending |

---
*Last updated: 2026-03-21 after initial project creation*
