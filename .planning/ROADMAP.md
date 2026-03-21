# Roadmap: Flutter-TUI

## Overview

Build a complete Flutter-for-Terminal framework in TypeScript/Bun, progressing from core type primitives through terminal abstraction, three-tree widget framework, layout engine, frame scheduling, input handling, high-level widgets, and finally diagnostics with example applications. Each phase builds on the previous, with parallel development opportunities within phases.

## Milestones

- 📋 **v1.0 MVP** — Phases 1-8 (planned)

## Phases

- [ ] **Phase 1: Core Primitives** — Type definitions, color model, text spans, box constraints, key system
- [ ] **Phase 2: Terminal Layer** — Cell buffer, double-buffering, diff algorithm, ANSI renderer, raw mode I/O
- [ ] **Phase 3: Widget Framework** — Three-tree core: Widget/Element/RenderObject lifecycle, BuildOwner, PipelineOwner, runApp
- [ ] **Phase 4: Layout System** — Flex algorithm, padding, constrained box, decorated box, parent data
- [ ] **Phase 5: Frame & Paint** — 60fps scheduler, 4-phase pipeline, PaintContext, clip support, paint traversal
- [ ] **Phase 6: Input System** — Keyboard/mouse events, input parser state machine, focus management, shortcuts
- [ ] **Phase 7: High-Level Widgets** — Text, Container, Flex, ScrollView, ListView, TextField, Button, Table
- [ ] **Phase 8: Diagnostics & Examples** — Performance overlay, frame stats, debug flags, 8 example applications

## Phase Details

### Phase 1: Core Primitives
**Goal**: Establish all foundational types that every other module depends on
**Depends on**: Nothing (first phase)
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06
**Success Criteria** (what must be TRUE):
  1. All core types (Offset, Size, Rect, Color, TextStyle, TextSpan, BoxConstraints, Key) are implemented with full test coverage
  2. Color round-trip conversion (RGB ↔ Ansi256 ↔ SGR) works correctly
  3. TextSpan tree correctly computes CJK-aware character widths
  4. BoxConstraints algebra (tight, loose, constrain, enforce) passes property-based tests
**Plans**: 3 plans

Plans:
- [ ] 01-01: Types + Color — Offset, Size, Rect, Color class with SGR
- [ ] 01-02: TextStyle + TextSpan — Style merging, span tree, CJK width
- [ ] 01-03: BoxConstraints + Key — Constraint algebra, ValueKey, UniqueKey, GlobalKey

### Phase 2: Terminal Layer
**Goal**: Abstract terminal I/O with double-buffered rendering and minimal-diff output
**Depends on**: Phase 1
**Requirements**: TERM-01, TERM-02, TERM-03, TERM-04, TERM-05, TERM-06, TERM-07
**Success Criteria** (what must be TRUE):
  1. ScreenBuffer correctly manages front/back cell grids with swap operation
  2. Diff algorithm produces minimal change set (empty→full, identical, single-cell, contiguous merge)
  3. Renderer outputs valid ANSI/SGR sequences with BSU/ESU wrapping
  4. Raw mode toggle and alt screen work on Linux terminals
  5. SIGWINCH triggers buffer resize
**Plans**: 3 plans

Plans:
- [ ] 02-01: Cell + ScreenBuffer — Cell struct, double-buffered grid, resize
- [ ] 02-02: Diff + Renderer — Cell-level diff algorithm, ANSI string builder, BSU/ESU
- [ ] 02-03: Terminal I/O + Capabilities — Raw mode, alt screen, SIGWINCH, DA1/DA2 detection

### Phase 3: Widget Framework (Three-Tree Core)
**Goal**: Implement Flutter's complete three-tree architecture with full lifecycle management
**Depends on**: Phase 1
**Requirements**: FRMW-01, FRMW-02, FRMW-03, FRMW-04, FRMW-05, FRMW-06, FRMW-07, FRMW-08, FRMW-09
**Success Criteria** (what must be TRUE):
  1. StatelessWidget build() is called on mount and rebuild
  2. StatefulWidget lifecycle (initState → build → didUpdateWidget → dispose) executes in correct order
  3. Element.updateChild correctly reuses, updates, or replaces child elements with key matching
  4. InheritedWidget notifies dependent elements when data changes
  5. BuildOwner processes dirty elements in depth-first order
  6. runApp() creates the three trees and triggers first frame
**Plans**: 3 plans

Plans:
- [ ] 03-01: Widget + State — Widget base, StatelessWidget, StatefulWidget, State<T> lifecycle
- [ ] 03-02: Element + RenderObject — Element tree, updateChild/updateChildren, RenderObject/RenderBox
- [ ] 03-03: BuildOwner + PipelineOwner + Binding — Dirty management, layout/paint scheduling, runApp

### Phase 4: Layout System
**Goal**: Implement Flutter's box-constraint layout model with flex, padding, and decoration
**Depends on**: Phase 3
**Requirements**: LYOT-01, LYOT-02, LYOT-03, LYOT-04, LYOT-05
**Success Criteria** (what must be TRUE):
  1. RenderFlex correctly implements all 6 steps of Flutter's flex algorithm
  2. All MainAxisAlignment variants (start, end, center, spaceBetween, spaceAround, spaceEvenly) produce correct positions
  3. Flex ratio allocation distributes space proportionally
  4. Nested constraints (Padding inside SizedBox inside Flex) resolve correctly
  5. DecoratedBox renders Unicode box-drawing borders
**Plans**: 2 plans

Plans:
- [ ] 04-01: RenderFlex + ParentData — 6-step flex algorithm, FlexParentData, BoxParentData
- [ ] 04-02: Padding + Constrained + Decorated — RenderPadding, RenderConstrainedBox, RenderDecoratedBox

### Phase 5: Frame Scheduler + Paint Pipeline
**Goal**: Implement 60fps frame scheduling with ordered phase execution and paint context
**Depends on**: Phase 3, Phase 4
**Requirements**: FPNT-01, FPNT-02, FPNT-03, FPNT-04, FPNT-05
**Success Criteria** (what must be TRUE):
  1. Frame scheduler ticks at ~16.67ms intervals
  2. Frames are skipped when nothing is dirty (no unnecessary work)
  3. 4-phase pipeline (BUILD→LAYOUT→PAINT→RENDER) executes in correct order
  4. PaintContext correctly writes styled characters to cells with offset accumulation
  5. Clip rect prevents painting outside bounds
**Plans**: 2 plans

Plans:
- [ ] 05-01: Frame Scheduler — 60fps tick, 4-phase pipeline, frame skipping logic
- [ ] 05-02: PaintContext + Paint Traversal — drawChar/drawText/fillRect/drawBorder, clipRect, DFS paint

### Phase 6: Input System
**Goal**: Parse raw terminal input into structured events with focus management
**Depends on**: Phase 2
**Requirements**: INPT-01, INPT-02, INPT-03, INPT-04, INPT-05
**Success Criteria** (what must be TRUE):
  1. Correctly parses Ctrl+key, arrow keys, F-keys, and special keys from raw bytes
  2. SGR mouse protocol events (press, release, move, scroll) parse correctly
  3. Multi-byte escape sequences are handled by state machine without data loss
  4. FocusManager supports tab-order navigation between focusable widgets
  5. Shortcut bindings trigger correct actions
**Plans**: 2 plans

Plans:
- [ ] 06-01: Keyboard + Mouse + Parser — KeyEvent, MouseEvent, input state machine
- [ ] 06-02: Focus + Shortcuts — FocusNode, FocusScope, FocusManager, shortcut bindings

### Phase 7: High-Level Widgets
**Goal**: Build the standard widget library that application developers use directly
**Depends on**: Phase 4, Phase 5, Phase 6
**Requirements**: WDGT-01 through WDGT-10
**Success Criteria** (what must be TRUE):
  1. Text widget renders styled text at correct position in ScreenBuffer
  2. Container applies padding, decoration, and constraints to child
  3. Row/Column distribute space according to flex factors and alignment
  4. ScrollView clips content and responds to scroll input
  5. TextField accepts keyboard input with cursor movement
  6. Table renders with correct column alignment
**Plans**: 3 plans

Plans:
- [ ] 07-01: Text + Container + Flex widgets — Text, Container, Row, Column, Expanded, SizedBox, Padding, Center
- [ ] 07-02: Scroll + Stack + Builder — SingleChildScrollView, ListView, Stack, Builder, LayoutBuilder
- [ ] 07-03: Interactive widgets — TextField, Button, Table, Divider, Spacer, Flexible

### Phase 8: Diagnostics & Examples
**Goal**: Add developer tooling and demonstrate the framework with 8 example applications
**Depends on**: Phase 7
**Requirements**: DIAG-01, DIAG-02, DIAG-03, EXMP-01 through EXMP-08
**Success Criteria** (what must be TRUE):
  1. PerformanceOverlay displays real-time P95/P99 frame metrics
  2. FrameStats collects rolling 1024-sample window of frame times
  3. hello-world example renders centered colored text
  4. counter example responds to keyboard increment/decrement
  5. todo-app example supports full CRUD operations
  6. perf-stress example maintains 60fps with 1000 widgets
**Plans**: 3 plans

Plans:
- [ ] 08-01: Diagnostics — PerformanceOverlay, FrameStats, debug flags
- [ ] 08-02: Basic examples — hello-world, counter, flex-layout, scroll-demo
- [ ] 08-03: Advanced examples — table-demo, input-form, todo-app, perf-stress

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
(Phases 2, 3, and 6 have parallel opportunities — see parallel development strategy)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Primitives | 0/3 | Not started | - |
| 2. Terminal Layer | 0/3 | Not started | - |
| 3. Widget Framework | 0/3 | Not started | - |
| 4. Layout System | 0/2 | Not started | - |
| 5. Frame & Paint | 0/2 | Not started | - |
| 6. Input System | 0/2 | Not started | - |
| 7. High-Level Widgets | 0/3 | Not started | - |
| 8. Diagnostics & Examples | 0/3 | Not started | - |
