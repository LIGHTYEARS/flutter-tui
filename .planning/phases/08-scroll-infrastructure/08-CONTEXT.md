# Phase 8: Scroll Infrastructure - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix scroll so it actually works — keyboard, mouse, auto-follow, and user override. This phase covers the scroll controller wiring, follow mode logic, and keyboard navigation enablement. It does NOT cover content rendering (Phase 9) or visual feedback (Phase 11).

</domain>

<decisions>
## Implementation Decisions

### Scroll Repainting (SCROLL-01)
- **D-01:** `RenderScrollViewport` must override `attach()` to call `scrollController.addListener(() => markNeedsPaint())` and `detach()` to remove the listener. This ensures the viewport repaints when the scroll offset changes.

### Follow Mode Management (SCROLL-02, SCROLL-03)
- **D-02:** In `ScrollableState._handleKey` and `_handleScroll`, any scroll-up action calls `controller.disableFollowMode()` before executing the scroll.
- **D-03:** In `app.ts stateListener`, only call `enableFollowMode()` when `scrollController.atBottom` was true BEFORE the state update. Save `atBottom` state at the start of the listener, then conditionally re-enable.

### Keyboard Navigation (SCROLL-04)
- **D-04:** Pass `enableKeyboardScroll: true` to the `SingleChildScrollView` in `app.ts`. Remove any conflicting scroll-key handling from the app-level `FocusScope` if present.

### Claude's Discretion
- Whether to add `enableMouseScroll: true` explicitly (already defaults to true, so optional).
- Whether `RenderScrollViewport.detach()` should also be overridden for cleanup symmetry.

</decisions>

<code_context>
## Existing Code Insights

### Key Files
- `packages/flitter-core/src/widgets/scroll-view.ts` — RenderScrollViewport (L243+), ScrollableState (L104+)
- `packages/flitter-core/src/widgets/scroll-controller.ts` — ScrollController with followMode, atBottom, addListener
- `packages/flitter-amp/src/app.ts` — SingleChildScrollView usage (L206+), stateListener (L81+)

### Established Patterns
- `Scrollbar` widget already uses `controller.addListener`/`removeListener` in initState/dispose
- `ScrollController.disableFollowMode()` exists but is never called from scroll handlers
- `ScrollController.enableFollowMode()` exists and is called unconditionally in stateListener

### Integration Points
- `RenderScrollViewport.attach()` at L243+ — needs override to wire listener
- `ScrollableState._handleKey` at L125 — needs disableFollowMode() calls on up-scroll
- `ScrollableState._handleScroll` at L156 — needs disableFollowMode() call on scroll-up (button 64)
- `app.ts` stateListener at L83 — needs atBottom check before enableFollowMode
- `app.ts` SingleChildScrollView at L206 — needs `enableKeyboardScroll: true`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard scroll infrastructure fixes documented above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-scroll-infrastructure*
*Context gathered: 2026-03-28 via smart discuss (autonomous)*
