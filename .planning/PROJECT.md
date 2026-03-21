# Flutter-TUI

## What This Is

A complete TUI (Terminal User Interface) rendering framework for TypeScript/Bun, faithfully reproducing Flutter's three-tree architecture (Widget → Element → RenderObject) for the terminal. It provides a declarative, composable widget system with box-constraint layout, double-buffered cell-level diff rendering, and on-demand frame scheduling — enabling developers to build rich, performant terminal applications using familiar Flutter patterns.

## Core Value

Deliver a production-grade, Flutter-faithful TUI framework where developers compose terminal UIs from declarative widgets with real layout constraints, achieving on-demand rendering through cell-level diffing — no other TypeScript TUI library provides this architecture.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Core type primitives (Offset, Size, Rect, Color, TextStyle, TextSpan, BoxConstraints, Key, Listenable/ChangeNotifier)
- [ ] Terminal abstraction layer (Cell, ScreenBuffer with dirty-region tracking, diff, ANSI renderer, raw mode, capability detection)
- [ ] Three-tree framework (Widget/Element/RenderObject lifecycle, canUpdate, updateChild 4-case, updateChildren O(N), RelayoutBoundary, RepaintBoundary, ErrorWidget, BuildOwner, PipelineOwner, runApp)
- [ ] Layout system (Flex 6-step algorithm, Padding, ConstrainedBox, DecoratedBox)
- [ ] Frame scheduler + paint pipeline (on-demand rendering, 4-phase pipeline, PaintContext, ScreenBuffer integration)
- [ ] Input system (keyboard, mouse SGR, input parser state machine, focus management, event dispatch pipeline)
- [ ] High-level widgets (Text, DefaultTextStyle, Container, Row, Column, ScrollView, ListView, TextField, Button, Table)
- [ ] Diagnostics + examples (PerformanceOverlay, FrameStats, debug flags, 8 example apps)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- GPU rendering — terminal is character-cell based, no GPU acceleration needed
- JSX/TSX syntax — pure TypeScript constructors, following Flutter's non-JSX pattern
- Node.js compatibility layer — Bun-first, may work on Node but not a goal for v1 (platform.ts adapter isolates coupling)
- Accessibility (screen reader) — complex and orthogonal to the core rendering architecture
- Image protocol (Kitty/Sixel) — focus on text/box-drawing character rendering first
- Animation framework — defer tweens/curves to v2; v1 handles manual setState-driven updates
- Navigator/Route — screen management deferred to v2
- Overlay/OverlayEntry — popup/dialog layer deferred to v2

## Context

- Reverse-engineered from Amp CLI binary analysis revealing a complete Flutter-for-Terminal implementation
- Key architectural patterns identified: immutable Widgets, mutable Elements/RenderObjects, synchronous frame pipeline
- Terminal rendering uses double-buffered ScreenBuffer with cell-level diff producing minimal ANSI escape sequences
- All coordinates are integer (col, row) — no sub-pixel positioning
- CJK wide-character support required (vendored wcwidth table)
- Built with Bun v1.3.10+ runtime, TypeScript strict mode, using bun test for testing
- Competitive landscape: blessed (unmaintained), ink (React/Yoga-based), terminal-kit (low-level). No existing Flutter-faithful TUI framework in TypeScript.

## Constraints

- **Runtime**: Bun v1.3.10+ (primary), TypeScript strict mode; Bun-specific calls isolated behind platform.ts adapter
- **Coordinates**: Integer-only (col, row) — no floating point in layout
- **Testing**: TDD with bun test, >80% coverage on core modules
- **Architecture**: Must faithfully follow Flutter's three-tree model — no shortcuts that break the abstraction
- **Performance**: 1000-widget tree must maintain 60fps rendering (validated by RelayoutBoundary + RepaintBoundary)
- **Dependencies**: Zero transitive runtime dependencies; vendored wcwidth table; use Intl.Segmenter for grapheme boundaries

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Integer coordinates everywhere | Terminal cells are discrete; sub-pixel makes no sense | Affirmed |
| Immutable Widget, mutable Element/RenderObject | Faithful to Flutter model; enables efficient reconciliation | Affirmed |
| On-demand frame scheduling (not fixed 60fps timer) | Terminals are idle 99% of the time; on-demand saves CPU/bandwidth; configurable SchedulerMode for animations | Revised from "60fps" |
| Cell-level diff with dirty-region optimization | Start with full-buffer diff (simple, correct); add dirty-region-scoped comparison when profiling shows need | Affirmed + planned optimization |
| No JSX | Matches Flutter pattern; pure constructor composition; invest in examples for onboarding | Affirmed |
| Bun-first with platform.ts adapter | Better performance than Node; native TS; isolate Bun-specific calls (~5 functions) behind adapter for future portability | Revised — added isolation layer |
| Zero transitive runtime deps | Vendor wcwidth table (~150-line lookup); use Intl.Segmenter for graphemes; no node_modules at runtime | Revised from "zero deps" |
| Abstract classes for Widget/Element/RenderObject | Carry default implementations (canUpdate, createElement); enforce contracts at type level; interfaces cannot do this | Added |
| Options objects for >2 params | TypeScript lacks named params; 0-2 required positional, rest in options object for readability | Added |
| Discriminated unions for InputEvent | Events are data (exhaustive switch); widgets are behavior (class hierarchy) — use the right pattern for each | Added |
| layout() vs performLayout() split | Parent calls layout(constraints, parentUsesSize); subclass overrides performLayout(). Critical for RelayoutBoundary. | Added |
| RelayoutBoundary + RepaintBoundary | Without these, markNeedsLayout walks to root on every dirty. Required for 1000-widget 60fps target. | Added |
| Vendored wcwidth over zero-dep purity | CJK width calculation is subtle (emoji, Hangul, ZWJ). Vendoring battle-tested table avoids rendering bugs. | Added |
| Frame budget instrumentation | BUILD+LAYOUT+PAINT budget ≤12ms (leaving 4ms for RENDER+input). Debug warning when exceeded. | Added |

---
*Last updated: 2026-03-21 after 4-agent verification review*
