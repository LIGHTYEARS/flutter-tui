# Flutter-TUI Development Instructions

## Goal: 100% Fidelity to Amp CLI TUI

This project reproduces the TUI rendering architecture from the Amp CLI binary. Every class, lifecycle method, algorithm, and rendering behavior must match the reverse-engineered original.

## Reference Materials

### Primary Source
- **Amp binary**: `/home/gem/home/tmp/amp-binary` (107MB ELF, Bun --compile)
- **Extracted strings**: `/home/gem/home/tmp/amp-strings.txt` (531,013 lines)

### Structured References
- `.reference/widget-tree.md` — Widget/State lifecycle
- `.reference/element-tree.md` — Element reconciliation, BuildOwner
- `.reference/render-tree.md` — RenderObject layout/paint protocol
- `.reference/screen-buffer.md` — Double-buffered rendering, diff, ANSI
- `.reference/frame-scheduler.md` — 4-phase pipeline
- `.reference/input-system.md` — Keyboard/mouse, focus
- `.reference/widgets-catalog.md` — Built-in widgets

### Planning Documents
- `.planning/PROJECT.md` — Project definition, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 65 v1 requirements with traceability
- `.planning/ROADMAP.md` — 8 phases, 25 plans, parallel wave strategy
- `.planning/STATE.md` — Current progress tracking

## Development Rules

### Before Implementing Any Class
1. **Search reference first**: Check `.reference/` for the corresponding Amp patterns
2. **Search strings**: `grep -n "pattern" /home/gem/home/tmp/amp-strings.txt` for additional context
3. **Match behavior**: Reproduce the exact method signatures, lifecycle order, and algorithm steps
4. **Document source**: Add `// Amp ref: amp-strings.txt:NNNN` comments for key implementations

### Code Style
- TypeScript strict mode
- Abstract classes (not interfaces) for Widget/Element/RenderObject hierarchy
- Options objects for constructors with >2 parameters
- Discriminated unions for InputEvent types
- Integer coordinates only (col, row)
- Zero transitive runtime dependencies

### Testing (TDD)
- Write tests BEFORE implementation
- `bun test` for all tests
- >80% coverage on core modules
- Use `WidgetTester` / `TestTerminal` / `pump()` helpers for widget tests

### Commit Convention
- Run `bun test` before every commit
- Atomic commits per plan/feature
- Reference phase and plan in commit messages (e.g., "feat(phase-1/01-01): implement Offset, Size, Rect types")

## Known Minified Identifiers

When searching amp-strings.txt, these minified names map to our classes:

| Amp | Our Class | Module |
|-----|-----------|--------|
| Sf | Widget | framework/widget.ts |
| H3 | StatelessWidget | framework/widget.ts |
| H8 | StatefulWidget | framework/widget.ts |
| _8 | State | framework/state.ts |
| Bt | InheritedWidget | framework/inherited-widget.ts |
| T/lU0 | Element | framework/element.ts |
| NB0 | BuildOwner | framework/build-owner.ts |
| j9 | RenderBox | framework/render-object.ts |
| UB0 | PipelineOwner | framework/pipeline-owner.ts |
| c9 | FrameScheduler | scheduler/frame-scheduler.ts |
| ij | ScreenBuffer | terminal/screen-buffer.ts |
| wB0 | TerminalManager | terminal/terminal-io.ts |
| BB0 | PerformanceOverlay | diagnostics/perf-overlay.ts |
| J3 | WidgetsBinding | framework/binding.ts |
| e0 | Text | widgets/text.ts |
| o8 | Column | widgets/flex.ts |
| q8 | Row | widgets/flex.ts |
| R4 | SingleChildScrollView | widgets/scroll-view.ts |
| X0 | SizedBox | widgets/sized-box.ts |
| R8 | Padding | widgets/padding.ts |
| A8 | Container | widgets/container.ts |
| u3 | Expanded | widgets/flex.ts |
| jA | Table | widgets/table.ts |

## Parallel Development

Use the 6-wave strategy from ROADMAP.md. Within each wave, agents can work independently on different plans. Always reference the wave table before starting parallel work.
