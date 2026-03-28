# Phase 8: Scroll Infrastructure — Summary

**Completed:** 2026-03-28
**Wave Count:** 1
**Commits:** `8c3557d` (implementation)

## What Changed

### RenderScrollViewport Repaint (SCROLL-01)
- Added `attach()`/`detach()` lifecycle to `RenderScrollViewport`
- Registers a listener on `ScrollController` that calls `markNeedsPaint()` when offset changes
- Listener properly swapped when `scrollController` property is updated

### Follow Mode Discipline (SCROLL-02)
- `_handleKey`: calls `disableFollowMode()` before upward scroll actions (k, ArrowUp, PageUp, Ctrl+u, Home/g)
- `_handleScroll`: calls `disableFollowMode()` before mouse scroll up (button 64)
- Downward scrolls do not disable — `jumpTo` naturally re-enables at bottom

### State Listener Guard (SCROLL-03)
- `stateListener` captures `wasAtBottom` before `setState()`
- Only calls `enableFollowMode()` when `isProcessing && wasAtBottom`
- Prevents forced re-follow when user has scrolled up during streaming

### Keyboard Scroll Enabled (SCROLL-04)
- `enableKeyboardScroll: true` added to chat area `SingleChildScrollView`

## Files Modified

| File | Changes |
|------|---------|
| `flitter-core/src/widgets/scroll-view.ts` | RenderScrollViewport: attach/detach/listener; ScrollableState: disableFollowMode on upward scroll |
| `flitter-amp/src/app.ts` | stateListener wasAtBottom guard, enableKeyboardScroll: true |

---

*Phase: 08-scroll-infrastructure*
*Summary written: 2026-03-28*
