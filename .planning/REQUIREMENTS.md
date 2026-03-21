# Requirements: Flutter-TUI

**Defined:** 2026-03-21
**Core Value:** Flutter-faithful TUI framework with declarative widgets, box-constraint layout, and on-demand cell-level diff rendering
**Last review:** 2026-03-21 — 4-agent parallel verification pass

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Primitives (CORE)

- [ ] **CORE-01**: Offset, Size, Rect types with integer arithmetic operations
- [ ] **CORE-02**: Color class supporting Named/Ansi256/RGB with SGR conversion and round-trip fidelity
- [ ] **CORE-03**: TextStyle with merge semantics and toSgr() output
- [ ] **CORE-04**: TextSpan tree with traversal, plain text extraction, and CJK-aware width calculation (vendored wcwidth table)
- [ ] **CORE-05**: BoxConstraints with tight/loose/constrain/enforce algebra
- [ ] **CORE-06**: Key system — ValueKey, UniqueKey (Phase 1); GlobalKey with currentState/currentContext/currentWidget (Phase 3)
- [ ] **CORE-07**: Listenable / ChangeNotifier / ValueNotifier base classes for reactive state propagation

### Terminal Layer (TERM)

- [ ] **TERM-01**: Cell struct (char + style attrs + wide-char marker)
- [ ] **TERM-02**: Double-buffered ScreenBuffer (front/back grids, swap, resize, dirty-region tracking)
- [ ] **TERM-03**: Cell-level diff algorithm producing RowPatch[] with minimal change set; dirty-region-scoped comparison
- [ ] **TERM-04**: ANSI renderer with SGR string building, BSU/ESU synchronized output, and cursor hide/show during render
- [ ] **TERM-05**: Terminal I/O (raw mode toggle, alt screen, SIGWINCH resize handling)
- [ ] **TERM-06**: ANSI escape sequence parser → TextSpan conversion
- [ ] **TERM-07**: Terminal capability detection (DA1/DA2, color depth, mouse support) with timeout fallback to safe defaults

### Widget Framework (FRMW)

- [ ] **FRMW-01**: Widget base class with key, createElement(), and static canUpdate(oldWidget, newWidget) — matches runtimeType + key
- [ ] **FRMW-02**: StatelessWidget with build() lifecycle
- [ ] **FRMW-03**: StatefulWidget + State<T> with full lifecycle: initState → didChangeDependencies → build → didUpdateWidget → deactivate → dispose; setState triggers rebuild
- [ ] **FRMW-04a**: Element.updateChild() with explicit 4-case logic: (null,null)→null, (null,widget)→inflate, (child,null)→deactivate, (child,widget)→canUpdate?update:replace
- [ ] **FRMW-04b**: Element.updateChildren() with O(N) key-matching algorithm (top-scan, bottom-scan, key-map) for list reconciliation
- [ ] **FRMW-05**: InheritedWidget with dependency tracking and selective rebuild via didChangeDependencies()
- [ ] **FRMW-06**: RenderObject/RenderBox with layout(constraints, parentUsesSize) vs performLayout() distinction; sizedByParent + performResize() protocol; markNeedsLayout/markNeedsPaint propagation
- [ ] **FRMW-07**: BuildOwner managing dirty element list with depth-sorted rebuild
- [ ] **FRMW-08**: PipelineOwner scheduling layout and paint passes; RelayoutBoundary optimization (stops markNeedsLayout propagation at tight constraints / sizedByParent); RepaintBoundary for scoped repaint
- [ ] **FRMW-09**: WidgetsBinding singleton with runApp() entry point — schedules first frame, attaches root element, initializes BuildOwner + PipelineOwner
- [ ] **FRMW-10**: RenderObjectWidget / SingleChildRenderObjectWidget / MultiChildRenderObjectWidget — createRenderObject() + updateRenderObject() bridge between Widget and RenderObject trees
- [ ] **FRMW-11**: ErrorWidget — displays error boundary on build() failure, preventing full tree crash

### Layout System (LYOT)

- [ ] **LYOT-01**: RenderFlex implementing Flutter's 6-step flex algorithm (Row/Column)
- [ ] **LYOT-02**: RenderPadding with constraint shrink and size expand
- [ ] **LYOT-03**: RenderConstrainedBox (SizedBox underlying implementation)
- [ ] **LYOT-04**: RenderDecoratedBox with Unicode border characters and background fill
- [ ] **LYOT-05**: ParentData system (FlexParentData, BoxParentData)

### Frame & Paint (FPNT)

- [ ] **FPNT-01**: On-demand frame scheduler with configurable SchedulerMode (on-demand default, capped fps, continuous); 4-phase pipeline BUILD→LAYOUT→PAINT→RENDER; frame budget instrumentation
- [ ] **FPNT-02**: Frame skipping when no dirty elements or render objects; scheduler sleeps when clean
- [ ] **FPNT-03**: PaintContext with drawChar/drawText/drawTextSpan/fillRect/drawBorder APIs
- [ ] **FPNT-04**: Clip rect support in PaintContext
- [ ] **FPNT-05**: Depth-first paint traversal with offset accumulation
- [ ] **FPNT-06**: ScreenBuffer integration — PaintContext writes to back buffer; RENDER phase triggers diff + ANSI renderer + buffer swap

### Input System (INPT)

- [ ] **INPT-01**: InputEvent discriminated union type (key | mouse | resize | focus) with LogicalKey and modifier support
- [ ] **INPT-02**: MouseEvent with SGR mouse protocol (press, release, move, scroll)
- [ ] **INPT-03**: Input parser state machine (raw bytes → structured InputEvent, multi-byte escape sequences)
- [ ] **INPT-04**: FocusNode/FocusScope/FocusManager with tab navigation
- [ ] **INPT-05**: Shortcut binding system — Shortcuts widget, LogicalKeySet mapping, action dispatch
- [ ] **INPT-06**: Event dispatch pipeline — route parsed InputEvent through FocusManager to widget callbacks (onKey, onTap) with bubbling semantics

### Widgets (WDGT)

- [ ] **WDGT-01**: Text widget rendering styled text with TextSpan
- [ ] **WDGT-02**: Container widget (padding + decoration + constraints + child)
- [ ] **WDGT-03**: Row and Column widgets via Flex with MainAxisAlignment/CrossAxisAlignment
- [ ] **WDGT-04a**: Layout wrappers — SizedBox, Padding, Center widgets
- [ ] **WDGT-04b**: Flex helpers — Expanded, Flexible, Spacer widgets
- [ ] **WDGT-05**: Stack widget with positioned children
- [ ] **WDGT-06a**: SingleChildScrollView with offset clip and scroll input handling
- [ ] **WDGT-06b**: ListView with lazy child building and viewport-based rendering
- [ ] **WDGT-07**: TextField with cursor, selection, and input handling (requires ChangeNotifier-based TextEditingController)
- [ ] **WDGT-08**: Button widget with press handling and focus support
- [ ] **WDGT-09**: Table widget with column sizing
- [ ] **WDGT-10a**: Divider widget
- [ ] **WDGT-10b**: Builder and LayoutBuilder widgets — LayoutBuilder receives constraints and rebuilds on constraint change
- [ ] **WDGT-11**: DefaultTextStyle InheritedWidget for cascading text styling to descendant Text widgets

### Diagnostics (DIAG)

- [ ] **DIAG-01**: PerformanceOverlay displaying P95/P99 frame times
- [ ] **DIAG-02**: FrameStats collector with 1024-sample rolling window; per-phase timing (BUILD/LAYOUT/PAINT/RENDER)
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

- **ANIM-01**: Tween-based animation controller (switches FrameScheduler to continuous mode)
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

### Navigation & Overlay

- **NOVL-01**: Overlay / OverlayEntry for tooltips, dropdowns, modals
- **NOVL-02**: NotificationListener / Notification bubbling (ScrollNotification etc.)
- **NOVL-03**: Navigator / Route for screen management
- **NOVL-04**: TerminalQuery InheritedWidget (MediaQuery equivalent — terminal size, color depth, capabilities)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| GPU rendering | Terminal is character-cell; no GPU needed |
| JSX/TSX syntax | Pure TS constructors match Flutter pattern |
| Node.js compat layer | Bun-first; Node may work but not guaranteed (platform.ts adapter isolates Bun calls) |
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
| CORE-06 (ValueKey/UniqueKey) | Phase 1 | Pending |
| CORE-06 (GlobalKey full) | Phase 3 | Pending |
| CORE-07 | Phase 3 | Pending |
| TERM-01 | Phase 2 | Pending |
| TERM-02 | Phase 2 | Pending |
| TERM-03 | Phase 2 | Pending |
| TERM-04 | Phase 2 | Pending |
| TERM-05 | Phase 2 | Pending |
| TERM-06 | Phase 7 | Pending |
| TERM-07 | Phase 2 | Pending |
| FRMW-01 | Phase 3 | Pending |
| FRMW-02 | Phase 3 | Pending |
| FRMW-03 | Phase 3 | Pending |
| FRMW-04a | Phase 3 | Pending |
| FRMW-04b | Phase 3 | Pending |
| FRMW-05 | Phase 3 | Pending |
| FRMW-06 | Phase 3 | Pending |
| FRMW-07 | Phase 3 | Pending |
| FRMW-08 | Phase 3 | Pending |
| FRMW-09 | Phase 3 | Pending |
| FRMW-10 | Phase 3 | Pending |
| FRMW-11 | Phase 3 | Pending |
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
| FPNT-06 | Phase 5 | Pending |
| INPT-01 | Phase 6 | Pending |
| INPT-02 | Phase 6 | Pending |
| INPT-03 | Phase 6 | Pending |
| INPT-04 | Phase 6 | Pending |
| INPT-05 | Phase 6 | Pending |
| INPT-06 | Phase 6 | Pending |
| WDGT-01 | Phase 7 | Pending |
| WDGT-02 | Phase 7 | Pending |
| WDGT-03 | Phase 7 | Pending |
| WDGT-04a | Phase 7 | Pending |
| WDGT-04b | Phase 7 | Pending |
| WDGT-05 | Phase 7 | Pending |
| WDGT-06a | Phase 7 | Pending |
| WDGT-06b | Phase 7 | Pending |
| WDGT-07 | Phase 7 | Pending |
| WDGT-08 | Phase 7 | Pending |
| WDGT-09 | Phase 7 | Pending |
| WDGT-10a | Phase 7 | Pending |
| WDGT-10b | Phase 7 | Pending |
| WDGT-11 | Phase 7 | Pending |
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
- v1 requirements: 65 total (was 54, +11 from review)
- Mapped to phases: 65
- Unmapped: 0 ✓

**Changes from review (2026-03-21):**
- Added: CORE-07 (Listenable/ChangeNotifier), FRMW-04a/04b (split updateChild/updateChildren), FRMW-10 (RenderObjectWidget bridge), FRMW-11 (ErrorWidget), FPNT-06 (ScreenBuffer integration), INPT-06 (event dispatch pipeline), WDGT-11 (DefaultTextStyle)
- Split: FRMW-04→04a/04b, WDGT-04→04a/04b, WDGT-06→06a/06b, WDGT-10→10a/10b
- Revised: FRMW-01 (added canUpdate), FRMW-03 (added didChangeDependencies/deactivate), FRMW-06 (added performLayout/sizedByParent/markNeeds*), FRMW-08 (added RelayoutBoundary/RepaintBoundary), FPNT-01 (on-demand default), CORE-06 (split GlobalKey to Phase 3), TERM-06 (moved to Phase 7)
- Moved: TERM-06 from Phase 2 to Phase 7 (no Phase 2 consumer)

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after 4-agent verification review*
