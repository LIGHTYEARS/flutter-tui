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
- [ ] Terminal abstraction layer (Cell, ScreenBuffer with full-grid diff, ANSI renderer, raw mode, capability detection)
- [ ] Three-tree framework (Widget/Element/RenderObject lifecycle, canUpdate, updateChild 4-case, updateChildren O(N), ErrorWidget, BuildOwner, PipelineOwner, runApp; no RelayoutBoundary/RepaintBoundary per Amp)
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

## Reverse-Engineering Source of Truth

**Goal: 100% fidelity to Amp CLI's TUI implementation.** Every class, method, algorithm, and rendering behavior must match the original.

**Reference materials** (in `.reference/`):
- `widget-tree.md` — Widget/State lifecycle strings and patterns
- `element-tree.md` — Element reconciliation, BuildOwner, dirty management
- `render-tree.md` — RenderObject/RenderBox layout/paint protocol
- `screen-buffer.md` — Double-buffered rendering, diff, ANSI output
- `frame-scheduler.md` — 4-phase pipeline, frame scheduling
- `input-system.md` — Keyboard/mouse parsing, focus management
- `widgets-catalog.md` — Built-in widget implementations

**Amp binary**: `/home/gem/home/tmp/amp-binary` (107MB, Bun --compile, v0.0.1774051433-g91f10a)
**Extracted strings**: `/home/gem/home/tmp/amp-strings.txt` (531,013 lines)

**Known minified identifiers** (Amp → Concept):

| Minified | Concept | Category |
|----------|---------|----------|
| `Sf` | Widget base | Widget tree |
| `H3` | StatelessWidget | Widget tree |
| `H8` | StatefulWidget | Widget tree |
| `_8` | State<T> | Widget tree |
| `Bt` | InheritedWidget | Widget tree |
| `T` / `lU0` | Element | Element tree |
| `NB0` | BuildOwner | Element tree |
| `j9` | RenderBox | Render tree |
| `UB0` | PipelineOwner | Render tree |
| `c9` | FrameScheduler | Scheduling |
| `ij` | ScreenBuffer | Terminal |
| `wB0` | TerminalManager | Terminal |
| `BB0` | PerformanceOverlay | Diagnostics |
| `J3` | WidgetsBinding | Binding |
| `e0` | Text widget | Widgets |
| `o8` | Column | Widgets |
| `q8` | Row | Widgets |
| `R4` | SingleChildScrollView | Widgets |
| `X0` | SizedBox | Widgets |
| `R8` | Padding | Widgets |
| `A8` | Container | Widgets |
| `u3` | Expanded | Widgets |
| `jA` | Table | Widgets |
| `Bn` | DiffView | Widgets |
| `ab` | Dialog | Widgets |

**Development rule**: Before implementing any class or algorithm, the developer MUST:
1. Search `.reference/` and `amp-strings.txt` for the corresponding Amp implementation
2. Identify the minified class/method and surrounding patterns
3. Match the exact behavior, method signatures, and algorithm steps
4. Document the Amp reference (line numbers) in code comments

## Context

- Reverse-engineered from Amp CLI binary analysis (Bun v1.3.10, JavaScriptCore, `/$bunfs/` virtual filesystem)
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
- **Architecture**: 100% fidelity to Amp CLI's TUI implementation — every class, lifecycle, algorithm must match the reverse-engineered original. Reference `.reference/` and `amp-strings.txt` before implementing.
- **Performance**: 1000-widget tree must maintain 60fps rendering (on-demand scheduling + root-driven layout)
- **Dependencies**: Zero transitive runtime dependencies; vendored wcwidth table; use Intl.Segmenter for grapheme boundaries

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Integer coordinates everywhere | Terminal cells are discrete; sub-pixel makes no sense | Affirmed |
| Immutable Widget, mutable Element/RenderObject | Faithful to Flutter model; enables efficient reconciliation | Affirmed |
| On-demand frame scheduling (not fixed 60fps timer) | Terminals are idle 99% of the time; on-demand saves CPU/bandwidth; configurable SchedulerMode for animations | Revised from "60fps" |
| Cell-level diff with full-buffer comparison | Amp does full-grid scan every frame (only optimization: EMPTY_CELL identity check). No dirty-region tracking. Simple and correct. | Revised from "dirty-region optimization" after Amp analysis |
| No JSX | Matches Flutter pattern; pure constructor composition; invest in examples for onboarding | Affirmed |
| Bun-first with platform.ts adapter | Better performance than Node; native TS; isolate Bun-specific calls (~5 functions) behind adapter for future portability | Revised — added isolation layer |
| Zero transitive runtime deps | Vendor wcwidth table (~150-line lookup); use Intl.Segmenter for graphemes; no node_modules at runtime | Revised from "zero deps" |
| Abstract classes for Widget/Element/RenderObject | Carry default implementations (canUpdate, createElement); enforce contracts at type level; interfaces cannot do this | Added |
| Options objects for >2 params | TypeScript lacks named params; 0-2 required positional, rest in options object for readability | Added |
| Discriminated unions for InputEvent | Events are data (exhaustive switch); widgets are behavior (class hierarchy) — use the right pattern for each | Added |
| layout() vs performLayout() split | Parent calls layout(constraints); subclass overrides performLayout(). No sizedByParent/performResize/parentUsesSize in Amp — all sizing in performLayout(). Offset stored on RenderBox directly. | Revised after Amp analysis |
| No RelayoutBoundary / No RepaintBoundary | Amp does NOT implement these Flutter optimizations. markNeedsLayout() always propagates to root. PipelineOwner.flushLayout() layouts from root. Full repaint every frame. TUI workloads are small enough that this works. | Revised — removed per Amp fidelity |
| No didChangeDependencies / No deactivate | Amp's State lifecycle is: initState → build → didUpdateWidget → dispose. No didChangeDependencies callback. Elements go mounted → unmounted directly (no deactivate intermediate state). | Revised — removed per Amp fidelity |
| Vendored wcwidth over zero-dep purity | CJK width calculation is subtle (emoji, Hangul, ZWJ). Vendoring battle-tested table avoids rendering bugs. | Added |
| Frame budget instrumentation | BUILD+LAYOUT+PAINT budget ≤12ms (leaving 4ms for RENDER+input). Debug warning when exceeded. | Added |

---
*Last updated: 2026-03-21 — Amp fidelity reconciliation after .reference/ extraction*
