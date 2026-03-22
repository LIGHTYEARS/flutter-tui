# Phase 17: Rendering Pipeline Enhancements - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add alpha compositing (Color.alpha, blendColor, blendStyle), RGB→256-color fallback (sJ nearest-match), ScreenBuffer default colors, index-RGB mapping, and Buffer utility methods (copyTo, getCells). These are rendering pipeline internals with no user-facing design decisions.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure rendering pipeline infrastructure. Key constraints:
- Color.alpha: 0-1 range, default 1 (fully opaque)
- blendColor(front, back): standard alpha compositing formula `result = front * alpha + back * (1 - alpha)`
- sJ(r, g, b): 240-entry palette (216 cube + 24 grayscale), Euclidean distance, Map-based result cache
- Renderer: output `38;5;N` / `48;5;N` SGR when `capabilities.canRgb === false`, else true-color `38;2;r;g;b`
- Buffer.setDefaultColors(bg, fg): sets defaults used when cell has no explicit color
- Buffer.copyTo(target): deep copy all cells
- Buffer.getCells(): returns deep copy array

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/core/color.ts` — Color class (RGB, Ansi256, Named). Needs alpha property addition.
- `src/terminal/screen-buffer.ts` — ScreenBuffer with Buffer inner class. Needs default colors, copyTo, getCells.
- `src/terminal/renderer.ts` — Renderer with buildSgrDelta(). Needs 256-color conditional output.
- `src/scheduler/paint-context.ts` — PaintContext uses CellStyle for painting.

### Established Patterns
- Color stores r, g, b as 0-255 integers
- CellStyle has foreground/background Color references
- Buffer.setCell() does simple replacement currently
- Renderer builds SGR diff strings between consecutive cells

### Integration Points
- Buffer.setCell() needs alpha blending path
- Renderer.buildSgrDelta() needs canRgb check for 256-color fallback
- PerformanceOverlay (Phase 21) will use alpha compositing for semi-transparent background

</code_context>

<specifics>
## Specific Ideas

Amp ref: aF8 (blendStyle), sJ (nearest256), Uu0 (palette table)
Reference files: .reference/screen-buffer.md sections 9, 14

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
