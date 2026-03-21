# Requirements: Flutter-TUI

**Defined:** 2026-03-21
**Core Value:** Flutter-faithful TUI framework with declarative widgets, box-constraint layout, and 60fps cell-level diff rendering

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Primitives (CORE)

- [ ] **CORE-01**: Offset, Size, Rect types with integer arithmetic operations
- [ ] **CORE-02**: Color class supporting Named/Ansi256/RGB with SGR conversion and round-trip fidelity
- [ ] **CORE-03**: TextStyle with merge semantics and toSgr() output
- [ ] **CORE-04**: TextSpan tree with traversal, plain text extraction, and CJK-aware width calculation
- [ ] **CORE-05**: BoxConstraints with tight/loose/constrain/enforce algebra
- [ ] **CORE-06**: Key system (ValueKey, UniqueKey, GlobalKey) for widget identity

### Terminal Layer (TERM)

- [ ] **TERM-01**: Cell struct (char + style attrs + wide-char marker)
- [ ] **TERM-02**: Double-buffered ScreenBuffer (front/back grids, swap, resize)
- [ ] **TERM-03**: Cell-level diff algorithm producing RowPatch[] with minimal change set
- [ ] **TERM-04**: ANSI renderer with SGR string building and BSU/ESU synchronized output
- [ ] **TERM-05**: Terminal I/O (raw mode toggle, alt screen, SIGWINCH resize handling)
- [ ] **TERM-06**: ANSI escape sequence parser → TextSpan conversion
- [ ] **TERM-07**: Terminal capability detection (DA1/DA2, color depth, mouse support)

### Widget Framework (FRMW)

- [ ] **FRMW-01**: Widget base class with key and createElement()
- [ ] **FRMW-02**: StatelessWidget with build() lifecycle
- [ ] **FRMW-03**: StatefulWidget + State<T> with full lifecycle (initState, didUpdateWidget, dispose, setState)
- [ ] **FRMW-04**: Element tree with updateChild/updateChildren and key-based reconciliation
- [ ] **FRMW-05**: InheritedWidget with dependency tracking and selective rebuild
- [ ] **FRMW-06**: RenderObject/RenderBox with layout/paint protocol
- [ ] **FRMW-07**: BuildOwner managing dirty element list with depth-sorted rebuild
- [ ] **FRMW-08**: PipelineOwner scheduling layout and paint passes
- [ ] **FRMW-09**: WidgetsBinding singleton with runApp() entry point

### Layout System (LYOT)

- [ ] **LYOT-01**: RenderFlex implementing Flutter's 6-step flex algorithm (Row/Column)
- [ ] **LYOT-02**: RenderPadding with constraint shrink and size expand
- [ ] **LYOT-03**: RenderConstrainedBox (SizedBox underlying implementation)
- [ ] **LYOT-04**: RenderDecoratedBox with Unicode border characters and background fill
- [ ] **LYOT-05**: ParentData system (FlexParentData, BoxParentData)

### Frame & Paint (FPNT)

- [ ] **FPNT-01**: Frame scheduler at 60fps with 4-phase pipeline (BUILD→LAYOUT→PAINT→RENDER)
- [ ] **FPNT-02**: Frame skipping when no dirty elements or render objects
- [ ] **FPNT-03**: PaintContext with drawChar/drawText/drawTextSpan/fillRect/drawBorder APIs
- [ ] **FPNT-04**: Clip rect support in PaintContext
- [ ] **FPNT-05**: Depth-first paint traversal with offset accumulation

### Input System (INPT)

- [ ] **INPT-01**: KeyEvent and LogicalKey with modifier key support
- [ ] **INPT-02**: MouseEvent with SGR mouse protocol
- [ ] **INPT-03**: Input parser state machine (raw bytes → structured events, multi-byte escape sequences)
- [ ] **INPT-04**: FocusNode/FocusScope/FocusManager with tab navigation
- [ ] **INPT-05**: Shortcut binding system

### Widgets (WDGT)

- [ ] **WDGT-01**: Text widget rendering styled text with TextSpan
- [ ] **WDGT-02**: Container widget (padding + decoration + constraints + child)
- [ ] **WDGT-03**: Row and Column widgets via Flex with MainAxisAlignment/CrossAxisAlignment
- [ ] **WDGT-04**: SizedBox, Padding, Center, Expanded, Flexible, Spacer widgets
- [ ] **WDGT-05**: Stack widget with positioned children
- [ ] **WDGT-06**: SingleChildScrollView and ListView with viewport clipping
- [ ] **WDGT-07**: TextField with cursor, selection, and input handling
- [ ] **WDGT-08**: Button widget with press handling and focus support
- [ ] **WDGT-09**: Table widget with column sizing
- [ ] **WDGT-10**: Divider and Builder/LayoutBuilder widgets

### Diagnostics (DIAG)

- [ ] **DIAG-01**: PerformanceOverlay displaying P95/P99 frame times
- [ ] **DIAG-02**: FrameStats collector with 1024-sample rolling window
- [ ] **DIAG-03**: Debug flags (debugPaintSize, repaintRainbow)

### Examples (EXMP)

- [ ] **EXMP-01**: hello-world — Center + Text, verifies basic rendering
- [ ] **EXMP-02**: counter — StatefulWidget with keyboard interaction
- [ ] **EXMP-03**: flex-layout — Row/Column with all alignment variants
- [ ] **EXMP-04**: scroll-demo — ScrollView with long content
- [ ] **EXMP-05**: table-demo — Table with data
- [ ] **EXMP-06**: input-form — TextField + focus navigation
- [ ] **EXMP-07**: todo-app — Full CRUD application
- [ ] **EXMP-08**: perf-stress — 1000-widget tree maintaining 60fps

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Animation

- **ANIM-01**: Tween-based animation controller
- **ANIM-02**: Curve library (ease, bounce, elastic)
- **ANIM-03**: AnimatedContainer, AnimatedOpacity widgets

### Advanced Rendering

- **ARND-01**: Kitty image protocol support
- **ARND-02**: Sixel graphics support
- **ARND-03**: Hyperlink support (OSC 8)

### Developer Experience

- **DEVX-01**: Hot reload for development
- **DEVX-02**: Widget inspector (DevTools-like)
- **DEVX-03**: Theme system with dark/light variants

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| GPU rendering | Terminal is character-cell; no GPU needed |
| JSX/TSX syntax | Pure TS constructors match Flutter pattern |
| Node.js compat layer | Bun-first; Node may work but not guaranteed |
| Screen reader / a11y | Orthogonal to core rendering; v2+ |
| Web target | Terminal-only framework |
| React-like hooks API | Flutter uses class-based State, not hooks |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| CORE-03 | Phase 1 | Pending |
| CORE-04 | Phase 1 | Pending |
| CORE-05 | Phase 1 | Pending |
| CORE-06 | Phase 1 | Pending |
| TERM-01 | Phase 2 | Pending |
| TERM-02 | Phase 2 | Pending |
| TERM-03 | Phase 2 | Pending |
| TERM-04 | Phase 2 | Pending |
| TERM-05 | Phase 2 | Pending |
| TERM-06 | Phase 2 | Pending |
| TERM-07 | Phase 2 | Pending |
| FRMW-01 | Phase 3 | Pending |
| FRMW-02 | Phase 3 | Pending |
| FRMW-03 | Phase 3 | Pending |
| FRMW-04 | Phase 3 | Pending |
| FRMW-05 | Phase 3 | Pending |
| FRMW-06 | Phase 3 | Pending |
| FRMW-07 | Phase 3 | Pending |
| FRMW-08 | Phase 3 | Pending |
| FRMW-09 | Phase 3 | Pending |
| LYOT-01 | Phase 4 | Pending |
| LYOT-02 | Phase 4 | Pending |
| LYOT-03 | Phase 4 | Pending |
| LYOT-04 | Phase 4 | Pending |
| LYOT-05 | Phase 4 | Pending |
| FPNT-01 | Phase 5 | Pending |
| FPNT-02 | Phase 5 | Pending |
| FPNT-03 | Phase 5 | Pending |
| FPNT-04 | Phase 5 | Pending |
| FPNT-05 | Phase 5 | Pending |
| INPT-01 | Phase 6 | Pending |
| INPT-02 | Phase 6 | Pending |
| INPT-03 | Phase 6 | Pending |
| INPT-04 | Phase 6 | Pending |
| INPT-05 | Phase 6 | Pending |
| WDGT-01 | Phase 7 | Pending |
| WDGT-02 | Phase 7 | Pending |
| WDGT-03 | Phase 7 | Pending |
| WDGT-04 | Phase 7 | Pending |
| WDGT-05 | Phase 7 | Pending |
| WDGT-06 | Phase 7 | Pending |
| WDGT-07 | Phase 7 | Pending |
| WDGT-08 | Phase 7 | Pending |
| WDGT-09 | Phase 7 | Pending |
| WDGT-10 | Phase 7 | Pending |
| DIAG-01 | Phase 8 | Pending |
| DIAG-02 | Phase 8 | Pending |
| DIAG-03 | Phase 8 | Pending |
| EXMP-01 | Phase 8 | Pending |
| EXMP-02 | Phase 8 | Pending |
| EXMP-03 | Phase 8 | Pending |
| EXMP-04 | Phase 8 | Pending |
| EXMP-05 | Phase 8 | Pending |
| EXMP-06 | Phase 8 | Pending |
| EXMP-07 | Phase 8 | Pending |
| EXMP-08 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 54 total
- Mapped to phases: 54
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after initial definition*
