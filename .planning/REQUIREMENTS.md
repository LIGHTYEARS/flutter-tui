# Requirements: Flutter-TUI

**Defined:** 2026-03-21 (v1.0), updated 2026-03-22 (v1.1)
**Core Value:** Flutter-faithful TUI framework with declarative widgets, box-constraint layout, and on-demand cell-level diff rendering
**Last review:** 2026-03-22 — v1.1 gap analysis requirements added

## v1.0 Requirements (Complete)

All v1.0 requirements shipped. See MILESTONES.md for details.

### Core Primitives (CORE)

- [x] **CORE-01**: Offset, Size, Rect types with integer arithmetic operations
- [x] **CORE-02**: Color class supporting Named/Ansi256/RGB with SGR conversion and round-trip fidelity
- [x] **CORE-03**: TextStyle with merge semantics and toSgr() output
- [x] **CORE-04**: TextSpan tree with traversal, plain text extraction, and CJK-aware width calculation
- [x] **CORE-05**: BoxConstraints with tight/loose/constrain/enforce algebra
- [x] **CORE-06**: Key system — ValueKey, UniqueKey, GlobalKey
- [x] **CORE-07**: Listenable / ChangeNotifier / ValueNotifier

### Terminal Layer (TERM)

- [x] **TERM-01**: Cell struct (char + style attrs + wide-char marker)
- [x] **TERM-02**: Double-buffered ScreenBuffer (front/back grids, swap, resize)
- [x] **TERM-03**: Cell-level diff algorithm producing RowPatch[]
- [x] **TERM-04**: ANSI renderer with SGR string building, BSU/ESU synchronized output
- [x] **TERM-05**: Terminal I/O (raw mode toggle, alt screen, SIGWINCH resize handling)
- [x] **TERM-06**: ANSI escape sequence parser → TextSpan conversion
- [x] **TERM-07**: Terminal capability detection (DA1/DA2, color depth, mouse support)

### Widget Framework (FRMW)

- [x] **FRMW-01** through **FRMW-11**: Complete three-tree framework

### Layout System (LYOT)

- [x] **LYOT-01** through **LYOT-05**: Complete layout system

### Frame & Paint (FPNT)

- [x] **FPNT-01** through **FPNT-06**: Complete frame scheduler and paint pipeline

### Input System (INPT)

- [x] **INPT-01** through **INPT-06**: Complete input system

### Widgets (WDGT)

- [x] **WDGT-01** through **WDGT-11**: Complete widget library

### Diagnostics & Examples (DIAG/EXMP)

- [x] **DIAG-01** through **DIAG-03**: Complete diagnostics
- [x] **EXMP-01** through **EXMP-08**: 28 example applications shipped

## v1.1 Requirements (Complete)

All v1.1 requirements shipped. See MILESTONES.md for details.

### Infrastructure InheritedWidgets (INFRA)

- [x] **INFRA-01**: MediaQuery InheritedWidget providing MediaQueryData (screen size, terminal capabilities) — wraps root widget in runApp (Amp: Q3)
- [x] **INFRA-02**: MediaQueryData class with size (width/height) and capabilities fields (Amp: nA)
- [x] **INFRA-03**: Theme InheritedWidget providing color scheme (primary, background, text, success, destructive, etc.) — used by DiffView, Button, RenderText (Amp: w3)
- [x] **INFRA-04**: HoverContext InheritedWidget for propagating mouse hover state to descendants (Amp: J_)

### Missing Widgets (MWDG)

- [x] **MWDG-01**: FocusScope/KeyboardListener StatefulWidget wrapping FocusNode — autofocus, onKey, onPaste, onFocusChange, canRequestFocus, skipTraversal (Amp: t4)
- [x] **MWDG-02**: Scrollbar StatefulWidget with thumb/track rendering, thickness, colors, characters, paired with ScrollController (Amp: ia)
- [x] **MWDG-03**: SelectionList StatefulWidget — interactive selection dialog with keyboard navigation (arrows/j/k/Tab), Enter confirm, Escape dismiss, mouse click, disabled item skip (Amp: ap)
- [x] **MWDG-04**: Dialog data class — title, type, widget, footerStyle, dimensions (Amp: ab)
- [x] **MWDG-05**: DiffView StatelessWidget — unified diff parsing, +/- line coloring, line numbers, syntax highlighting via Theme (Amp: Bn)
- [x] **MWDG-06**: ClipRect SingleChildRenderObjectWidget — clips child painting to parent bounds (Amp: nv)
- [x] **MWDG-07**: IntrinsicHeight SingleChildRenderObjectWidget with RenderIntrinsicHeight — queries child getMaxIntrinsicHeight and applies tight constraint (Amp: hJ/vU0)
- [x] **MWDG-08**: Markdown StatelessWidget — parses markdown text, renders as styled Text tree (headings, code, links via OSC 8) (Amp: _g)
- [x] **MWDG-09**: ContainerWithOverlays — extends Container with edge/corner overlay positioning using Stack+Positioned internally (Amp: bt)

### Framework Enhancements (FRMW)

- [x] **FRMW-12**: WidgetsBinding.mouseManager — global MouseManager singleton reference (Amp: Pg in J3)
- [x] **FRMW-13**: WidgetsBinding.eventCallbacks — keyboard, mouse, paste event global callback lists (Amp: J3)
- [x] **FRMW-14**: WidgetsBinding.keyInterceptors — keyboard event interceptor chain, priority over focus system (Amp: J3)
- [x] **FRMW-15**: Async runApp with terminal capability detection, MediaQuery wrapping of root widget, lazy focus/idle loading (Amp: cz8)
- [x] **FRMW-16**: BuildContext.mediaQuery field for fast MediaQueryData access (Amp: jd.mediaQuery)

### Text API Enhancements (TEXT)

- [x] **TEXT-01**: TextStyle.copyWith() for partial-override new instance creation (Amp: m0.copyWith)
- [x] **TEXT-02**: TextStyle static factories — normal(color), bold(color), italic(color), underline(color), colored(color), background(color) (Amp: m0 static methods)
- [x] **TEXT-03**: TextSpan.hyperlink property — { uri: string, id?: string } for OSC 8 terminal hyperlinks (Amp: TextSpan hyperlink)
- [x] **TEXT-04**: TextSpan.onClick callback property for click handling (Amp: TextSpan onClick)
- [x] **TEXT-05**: TextSpan.equals() deep structural comparison (Amp: TextSpan equality)

### RenderObject Enhancements (ROBJ)

- [x] **ROBJ-01**: RenderText selection support — selectable flag, selectedRanges[], selectionColor, copyHighlightColor, highlightMode (Amp: gU0)
- [x] **ROBJ-02**: RenderText character position tracking — _characterPositions[], _visualLines[] cache, getCharacterRect(index), getOffsetForPosition(x,y) (Amp: gU0)
- [x] **ROBJ-03**: RenderText hyperlink/click handling — getHyperlinkAtPosition(), getOnClickAtPosition(), handleMouseEvent() with cursor changes (Amp: gU0)
- [x] **ROBJ-04**: RenderText emoji width detection — _emojiWidthSupported flag from MediaQuery capabilities (Amp: gU0)
- [x] **ROBJ-05**: RenderFlex intrinsic size methods — getMinIntrinsicWidth(h), getMaxIntrinsicWidth(h), getMinIntrinsicHeight(w), getMaxIntrinsicHeight(w) (Amp: oU0)
- [x] **ROBJ-06**: RenderFlex CrossAxisAlignment.baseline variant (Amp: oU0)
- [x] **ROBJ-07**: ClipCanvas paint wrapper — clips painting area for scroll viewports (Amp: E$)

### Mouse/Cursor System (MOUS)

- [x] **MOUS-01**: MouseTracker/MouseManager singleton — global mouse tracking, cursor shape management, hover state coordination (Amp: Pg)
- [x] **MOUS-02**: SystemMouseCursors constants (POINTER, DEFAULT) with ANSI escape sequences (Amp: gg)
- [x] **MOUS-03**: MouseRegion.onRelease event callback (Amp: Ba.onRelease)
- [x] **MOUS-04**: MouseRegion.onDrag event callback (Amp: Ba.onDrag)

### ScrollController Enhancements (SCRL)

- [x] **SCRL-01**: ScrollController.animateTo(offset) with timer-based smooth scrolling animation (Amp: Lg.animateTo)
- [x] **SCRL-02**: ScrollController.followMode — auto-scroll to bottom when content grows, with disableFollowMode() (Amp: Lg.followMode)
- [x] **SCRL-03**: ScrollController.atBottom getter — check if scrolled to end (Amp: Lg.atBottom)

### Debug Tools (DBUG)

- [x] **DBUG-01**: Debug Inspector HTTP server on port 9876 — /tree, /inspect, /select endpoints exposing widget tree as JSON (Amp: Mu)

## v1.2 Requirements

Requirements for Amp CLI deep fidelity — rendering pipeline, terminal protocols, and advanced widget features identified by gap analysis (2026-03-22).

### Image Protocol (IMG)

- [x] **IMG-01**: ImagePreview StatefulWidget (`O_`) — displays inline images in terminal using Kitty graphics protocol. Transmits PNG data via `ESC_G` escape sequences with chunked transfer and placement cells. Falls back to empty SizedBox if terminal lacks Kitty support.
- [x] **IMG-02**: KittyImageWidget SingleChildRenderObjectWidget (`IH0`) — render object for Kitty image display with cell placement and sizing.
- [x] **IMG-03**: ImagePreviewProvider InheritedWidget (`X_`) — provides image preview context (image data, display state) to descendant widgets.

### AppTheme System (ATHM)

- [x] **ATHM-01**: AppTheme InheritedWidget (`h8`) — distinct from Theme (`w3`), provides application-specific theme data including `syntaxHighlight` config, `app` config, and `colors`. Accessed via `AppTheme.of(context)`.
- [x] **ATHM-02**: Syntax highlighting function (`ae`) — `syntaxHighlight(content, config, filePath)` performs file-extension-based syntax highlighting. Used by DiffView for colorized diff content.

### TextField Enhancements (TXFD)

- [x] **TXFD-01**: Multi-line editing support with `maxLines` property. Single-line: Enter submits. Multi-line: Ctrl+Enter submits, Enter inserts newline. Shift+Enter / Alt+Enter / Backslash+Enter for newline insertion.
- [x] **TXFD-02**: Word-level operations — delete word (Ctrl+Backspace/Ctrl+Delete), move by word (Ctrl+Left/Ctrl+Right), select word (Ctrl+Shift+Left/Right).
- [x] **TXFD-03**: Mouse interaction — click to place cursor, double-click to select word, click-and-drag for character/word selection. Global mouse release tracking via `MouseManager.addGlobalReleaseCallback`.
- [x] **TXFD-04**: Selection and clipboard — auto-copy selection to clipboard (500ms delay, 300ms highlight). Visual selection highlight using TextStyle background overlay.
- [x] **TXFD-05**: Render via RenderText — TextField should use Text/RenderText underneath (not a stub display widget) for consistent text rendering, CJK support, and hyperlink passthrough.

### Rendering Pipeline (RPIP)

- [x] **RPIP-01**: Alpha compositing / style blending (`aF8`) — Color class supports alpha channel. `Buffer.setCell()` blends styles when alpha < 1. `blendColor(front, back)` and `blendStyle(front, back)` functions.
- [x] **RPIP-02**: RGB to 256-color fallback (`sJ`) — nearest-match function using 240-entry palette (216 cube + 24 grayscale) with Euclidean distance and result caching. Used when `capabilities.canRgb` is false.
- [x] **RPIP-03**: ScreenBuffer default colors — `setDefaultColors(bg, fg)` sets default background/foreground for both buffers. Buffer stores `defaultBg`, `defaultFg`.
- [x] **RPIP-04**: Index-to-RGB mapping — `setIndexRgbMapping(mapping)` provides lookup table for 256-color indices to RGB values (used in alpha blending).
- [x] **RPIP-05**: Buffer `copyTo(target)` method — deep copy cells from one buffer to another.

### Terminal Protocol (TPRO)

- [x] **TPRO-01**: Kitty keyboard protocol — `enableKittyKeyboard()` (`ESC[>5u`) / `disableKittyKeyboard()` (`ESC[<u]`) for enhanced key event reporting.
- [x] **TPRO-02**: ModifyOtherKeys — `enableModifyOtherKeys()` (`ESC[>4;1m`) / `disableModifyOtherKeys()` (`ESC[>4;0m`) for disambiguating key events.
- [x] **TPRO-03**: Emoji width mode — `enableEmojiWidth()` (`ESC[?2027h`) / `disableEmojiWidth()` (`ESC[?2027l]`) for accurate emoji width detection.
- [x] **TPRO-04**: In-band resize — `enableInBandResize()` (`ESC[?2048h`) / `disableInBandResize()` (`ESC[?2048l]`) for resize event via escape sequence.
- [x] **TPRO-05**: Progress bar OSC — `setProgressBarIndeterminate()` (`OSC 9;4;3 ST`), `setProgressBarOff()` (`OSC 9;4;0 ST`), `setProgressBarPaused()` (`OSC 9;4;4 ST`).
- [x] **TPRO-06**: Window title OSC — `SET_TITLE(title)` (`ESC]0;{title}\x07`).
- [x] **TPRO-07**: Mouse cursor shape OSC — `SET_MOUSE_SHAPE(name)` (`ESC]22;{name} ESC\`).
- [x] **TPRO-08**: Pixel mouse — `enablePixelMouse()` (`ESC[?1016h`) / `disablePixelMouse()` (`ESC[?1016l`).
- [x] **TPRO-09**: Terminal cleanup function (`zG8`) — comprehensive cleanup on exit (SIGINT/SIGTERM/process exit) disabling all 12+ terminal modes including Kitty kbd, pixel mouse, in-band resize, emoji width, color palette notifications.
- [x] **TPRO-10**: Terminal capability detection via escape queries (`vF` queryParser) — send capability queries and parse responses to detect Kitty graphics, emoji width support, color depth.

### Performance Diagnostics (PERF)

- [x] **PERF-01**: PerformanceTracker additional metrics — `keyEventTimes`, `mouseEventTimes`, `repaintPercents`, `bytesWritten` with P95/P99 getters for all categories.
- [x] **PERF-02**: PerformanceOverlay direct-to-buffer rendering — `draw(screen, frameStats)` paints 34x14 box to screen buffer at top-right corner with Unicode borders, "Gotta Go Fast" title, color-coded thresholds (green <70%, yellow 70-100%, red >100%).
- [x] **PERF-03**: `WidgetsBinding.toggleFrameStatsOverlay()` — method to toggle overlay on/off with forced paint frame request.

### Minor Enhancements (MINR)

- [x] **MINR-01**: JetBrains terminal wheel filter — `jetBrainsWheelFilter` on TerminalManager for non-standard scroll behavior in JetBrains terminals.
- [x] **MINR-02**: `setCursorPositionHint(x, y)` on ScreenBuffer — sets cursor position without changing visibility.
- [x] **MINR-03**: `processResizeIfPending()` as separate BUILD phase callback at priority -1000 (between beginFrame at -2000 and buildScopes at 0).
- [x] **MINR-04**: `eventCallbacks.paste` array — global paste event callback list on WidgetsBinding alongside existing key/mouse callbacks.
- [x] **MINR-05**: `capabilities.scrollStep()` method — configurable lines per scroll step (default 3).
- [x] **MINR-06**: Layout helper function (`fS`) — standalone function estimating intrinsic width by recursively examining widget types.
- [x] **MINR-07**: `Buffer.getCells()` deep copy method — returns deep copy of all cells.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Animation

- **ANIM-01**: Tween-based animation controller
- **ANIM-02**: Curve library (ease, bounce, elastic)
- **ANIM-03**: AnimatedContainer, AnimatedOpacity widgets

### Navigation & Overlay

- **NOVL-01**: Overlay / OverlayEntry for tooltips, dropdowns, modals
- **NOVL-02**: NotificationListener / Notification bubbling
- **NOVL-03**: Navigator / Route for screen management

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
| Sixel image rendering | Only Kitty protocol is used in Amp; Sixel not needed |
| Animation framework (Tween/Curve) | Amp uses timer-based scheduling, not tweens |
| GestureDetector/GestureRecognizer | Amp only uses MouseRegion; no gesture recognizer pattern |
| Navigator/Route | Amp uses state-based UI switching; no routing system |
| ListView/SliverList | Amp only uses SingleChildScrollView; no sliver protocol |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

### v1.0 Traceability (Complete)

All 65 v1.0 requirements completed across Phases 1-8. See MILESTONES.md.

### v1.1 Traceability (Complete)

All 38 v1.1 requirements completed across Phases 9-15. See MILESTONES.md.

### v1.2 Traceability (Complete)

All 35 v1.2 requirements completed across Phases 16-22.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMG-01 | Phase 19 | Complete |
| IMG-02 | Phase 19 | Complete |
| IMG-03 | Phase 19 | Complete |
| ATHM-01 | Phase 16 | Complete |
| ATHM-02 | Phase 16 | Complete |
| TXFD-01 | Phase 20 | Complete |
| TXFD-02 | Phase 20 | Complete |
| TXFD-03 | Phase 20 | Complete |
| TXFD-04 | Phase 20 | Complete |
| TXFD-05 | Phase 20 | Complete |
| RPIP-01 | Phase 17 | Complete |
| RPIP-02 | Phase 17 | Complete |
| RPIP-03 | Phase 17 | Complete |
| RPIP-04 | Phase 17 | Complete |
| RPIP-05 | Phase 17 | Complete |
| TPRO-01 | Phase 18 | Complete |
| TPRO-02 | Phase 18 | Complete |
| TPRO-03 | Phase 18 | Complete |
| TPRO-04 | Phase 18 | Complete |
| TPRO-05 | Phase 18 | Complete |
| TPRO-06 | Phase 18 | Complete |
| TPRO-07 | Phase 18 | Complete |
| TPRO-08 | Phase 18 | Complete |
| TPRO-09 | Phase 18 | Complete |
| TPRO-10 | Phase 18 | Complete |
| PERF-01 | Phase 21 | Complete |
| PERF-02 | Phase 21 | Complete |
| PERF-03 | Phase 21 | Complete |
| MINR-01 | Phase 22 | Complete |
| MINR-02 | Phase 22 | Complete |
| MINR-03 | Phase 22 | Complete |
| MINR-04 | Phase 22 | Complete |
| MINR-05 | Phase 22 | Complete |
| MINR-06 | Phase 22 | Complete |
| MINR-07 | Phase 22 | Complete |

**Coverage:**
- v1.2 requirements: 35 total
- Completed: 35
- Remaining: 0

---
*Requirements defined: 2026-03-21 (v1.0)*
*Last updated: 2026-03-22 — v1.2 complete*
