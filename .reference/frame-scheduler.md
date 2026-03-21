# Frame Scheduler & Paint Pipeline Reference

Reverse-engineered from `/home/gem/home/tmp/amp-strings.txt`, line **530126** (FrameScheduler, Phase enum, BuildOwner) and line **530127** (PipelineOwner, WidgetsBinding, PerformanceOverlay, PerformanceTracker).

---

## Table of Contents

1. [Phase Enum (oJ)](#1-phase-enum-oj)
2. [Frame Timing Constants](#2-frame-timing-constants)
3. [FrameScheduler (c9) -- Singleton](#3-framescheduler-c9----singleton)
4. [BuildOwner (NB0)](#4-buildowner-nb0)
5. [PipelineOwner (UB0)](#5-pipelineowner-ub0)
6. [WidgetsBinding (J3) -- Orchestrator](#6-widgetsbinding-j3----orchestrator)
7. [4-Phase Pipeline Execution](#7-4-phase-pipeline-execution)
8. [Frame Skipping Logic](#8-frame-skipping-logic)
9. [On-Demand Scheduling -- Dirty State Triggers](#9-on-demand-scheduling----dirty-state-triggers)
10. [Frame Pacing & Timer Strategy](#10-frame-pacing--timer-strategy)
11. [PerformanceTracker (_B0)](#11-performancetracker-_b0)
12. [PerformanceOverlay (BB0)](#12-performanceoverlay-bb0)
13. [Percentile Function (Aa)](#13-percentile-function-aa)
14. [TUI / Screen Rendering (wB0)](#14-tui--screen-rendering-wb0)
15. [Paint Traversal (DFS)](#15-paint-traversal-dfs)
16. [Identifier Cross-Reference](#16-identifier-cross-reference)

---

## 1. Phase Enum (oJ)

**Source**: Line 530126

```js
var oJ;
((g) => {
  g.BUILD  = "build",
  g.LAYOUT = "layout",
  g.PAINT  = "paint",
  g.RENDER = "render"
})(oJ ||= {});
```

**Annotations**:
- `oJ` is the Phase enum used throughout the pipeline.
- The 4 phases execute in strict order: BUILD -> LAYOUT -> PAINT -> RENDER.
- Each phase string is used as a key in stats objects and callback registration.

---

## 2. Frame Timing Constants

**Source**: Line 530126

```js
var Iz8 = 60;            // Target FPS
var Oy  = 1000 / Iz8;    // Frame budget in ms (~16.67ms)
```

**Annotations**:
- `Iz8` = 60 (target frames per second).
- `Oy` = 1000/60 = ~16.67ms (maximum time budget per frame).
- `Oy` is used in frame pacing (delay calculation) and as the threshold for the performance overlay's color coding.

### Test Environment Detection (jz8)

```js
function jz8() {
  if (typeof process > "u") return false;
  return process.env.BUN_TEST === "1"
      || process.env.VITEST === "true"
      || process.env.NODE_TEST_CONTEXT === "1";
}
```

- When running in test environments, `_useFramePacing` is set to `false` (disabling pacing delays).

---

## 3. FrameScheduler (c9) -- Singleton

**Source**: Line 530126

### Fields

```js
class c9 {
  static _instance;                           // Singleton
  _frameCallbacks     = new Map();            // Map<id, {callback, phase, priority, name}>
  _postFrameCallbacks = [];                   // Array<{callback, name}>
  _frameScheduled     = false;                // Whether a frame is queued
  _frameInProgress    = false;                // Whether a frame is currently executing
  _executingPostFrameCallbacks = false;
  _pendingFrameTimer  = null;                 // setTimeout handle for paced frames
  _lastFrameTimestamp = 0;                    // performance.now() of last frame start
  _useFramePacing     = !jz8();               // Disabled in test environments

  _stats = {
    lastFrameTime: 0,
    phaseStats: {
      ["build"]:  { lastTime: 0 },
      ["layout"]: { lastTime: 0 },
      ["paint"]:  { lastTime: 0 },
      ["render"]: { lastTime: 0 }
    }
  };
  _lastCompletedStats = this.deepCopyStats(this._stats);
```

### Singleton Access

```js
  static get instance() {
    return c9._instance ??= new c9;
  }
```

### requestFrame() -- On-Demand Scheduling Entry Point

```js
  requestFrame() {
    if (this._frameScheduled) return;                    // Already queued -- skip
    if (this._frameInProgress) {
      this._frameScheduled = true;                       // Mark for re-run after current frame
      return;
    }
    if (!this._useFramePacing) {
      this._frameScheduled = true;
      this.scheduleFrameExecution(0);                    // Immediate (test mode)
      return;
    }

    // Frame pacing: respect the 16.67ms budget
    let g = performance.now();
    let t = this._lastFrameTimestamp;
    let b = g - t;

    if (t === 0 || b >= Oy) {
      this._frameScheduled = true;
      this.scheduleFrameExecution(0);                    // Enough time passed -- run now
      return;
    }

    let s = Math.max(0, Oy - b);                        // Remaining budget
    this._frameScheduled = true;
    this.scheduleFrameExecution(s);                      // Delay to hit frame boundary
  }
```

**Annotations**:
- Coalesces multiple `requestFrame()` calls into a single scheduled frame.
- Frame pacing ensures no more than 60fps by delaying if within `Oy` ms of the last frame.
- In test environments (`_useFramePacing = false`), frames execute immediately via `setImmediate`.

### scheduleFrameExecution(delay)

```js
  scheduleFrameExecution(g) {
    if (g <= 0) {
      setImmediate(() => this.runScheduledFrame());      // No delay -- use setImmediate (microtask)
      return;
    }
    this._pendingFrameTimer = setTimeout(
      () => this.runScheduledFrame(), g                  // Delay by remaining budget
    );
  }
```

**Annotations**:
- Zero-delay uses `setImmediate` (not `setTimeout(0)`) to yield to I/O but stay high priority.
- Positive delay uses `setTimeout` for frame pacing.
- No `setInterval` loop -- this is entirely event-driven / on-demand.

### runScheduledFrame()

```js
  runScheduledFrame() {
    if (this._pendingFrameTimer)
      clearTimeout(this._pendingFrameTimer),
      this._pendingFrameTimer = null;
    if (this._frameInProgress) return;                   // Guard against re-entry
    this.executeFrame();
  }
```

### executeFrame() -- Core Frame Loop

```js
  executeFrame() {
    if (this._frameInProgress) return;
    let g = performance.now();
    this._frameScheduled = false;
    this._frameInProgress = true;

    try {
      for (let t of ["build", "layout", "paint", "render"])
        this.executePhase(t);                            // 4-phase pipeline in order
      this.executePostFrameCallbacks();
    } catch (t) {
      V.error("Frame execution error:", t instanceof Error ? t.message : String(t));
    } finally {
      this.recordFrameStats(performance.now() - g);
      this._lastFrameTimestamp = g;
      this._lastCompletedStats = this.deepCopyStats(this._stats);
      this._frameInProgress = false;

      // If another frame was requested during execution, schedule it
      if (this._frameScheduled) {
        let t = performance.now() - this._lastFrameTimestamp;
        let b = t >= Oy ? 0 : Math.max(0, Oy - t);
        this.scheduleFrameExecution(b);
      }
    }
  }
```

**Annotations**:
- Phases are iterated as literal string array `["build", "layout", "paint", "render"]`.
- After the 4 phases, post-frame callbacks run (one-shot tasks).
- If `_frameScheduled` was set during execution (by a dirty notification), a follow-up frame is immediately re-scheduled with appropriate pacing.

### executePhase(phase)

```js
  executePhase(g) {
    let t = performance.now();
    try {
      let b = Array.from(this._frameCallbacks.values())
        .filter((s) => s.phase === g)
        .sort((s, a) => s.priority - a.priority);       // Lower priority number = runs first
      for (let s of b)
        try {
          s.callback();
        } catch (a) {
          V.error(`Frame callback error in ${g} phase (${s.name})`, { ... });
          m4(false, `FATAL: ${g} error in ${s.name}: ${a}`);
        }
    } finally {
      let b = performance.now() - t;
      this.recordPhaseStats(g, b);                       // Per-phase timing
    }
  }
```

### Callback Registration

```js
  addFrameCallback(id, callback, phase, priority = 0, name) {
    this._frameCallbacks.set(id, { callback, phase, priority, name: name || id });
  }

  removeFrameCallback(id) {
    this._frameCallbacks.delete(id);
  }

  addPostFrameCallback(callback, name) {
    this._postFrameCallbacks.push({ callback, name });
    if (!this._frameScheduled && (!this._frameInProgress || this._executingPostFrameCallbacks))
      this.requestFrame();
  }
```

### Post-Frame Callbacks

```js
  executePostFrameCallbacks() {
    if (this._postFrameCallbacks.length === 0) return;
    let g = this._postFrameCallbacks.splice(0);          // Drain all pending
    this._executingPostFrameCallbacks = true;
    try {
      for (let { callback: t, name: b } of g)
        try { t(); }
        catch (s) { V.error(`Post-frame callback error (${b || "anonymous"}):`, ...); }
    } finally {
      this._executingPostFrameCallbacks = false;
    }
  }
```

### Stats & Getters

```js
  recordFrameStats(g)     { this._stats.lastFrameTime = g; }
  recordPhaseStats(g, t)  { this._stats.phaseStats[g].lastTime = t; }

  get isFrameScheduled()  { return this._frameScheduled || this._frameInProgress; }
  get isFrameInProgress() { return this._frameInProgress; }
  get frameStats()        { return this.deepCopyStats(this._lastCompletedStats); }

  deepCopyStats(g) {
    return {
      ...g,
      phaseStats: {
        ["build"]:  { ...g.phaseStats.build },
        ["layout"]: { ...g.phaseStats.layout },
        ["paint"]:  { ...g.phaseStats.paint },
        ["render"]: { ...g.phaseStats.render }
      }
    };
  }

  resetStats() {
    this._stats = { lastFrameTime: 0, phaseStats: { ... } };
  }
```

---

## 4. BuildOwner (NB0)

**Source**: Line 530126

```js
class NB0 {
  _dirtyElements = new Set();
  _stats = {
    totalRebuilds: 0,
    elementsRebuiltThisFrame: 0,
    maxElementsPerFrame: 0,
    averageElementsPerFrame: 0,
    lastBuildTime: 0,
    averageBuildTime: 0,
    maxBuildTime: 0
  };
  _buildTimes = [];
  _elementsPerFrame = [];

  scheduleBuildFor(element) {
    if (this._dirtyElements.has(element)) return;       // Dedup
    this._dirtyElements.add(element);
    c9.instance.requestFrame();                          // Trigger a frame
  }

  buildScopes() {
    if (this._dirtyElements.size === 0) return;          // Skip if nothing dirty
    let g = performance.now();
    let t = 0;
    try {
      while (this._dirtyElements.size > 0) {
        let b = Array.from(this._dirtyElements);
        this._dirtyElements.clear();
        b.sort((s, a) => s.depth - a.depth);             // Sort by depth (ancestors first)
        for (let s of b)
          if (s.dirty)
            try {
              s.performRebuild();
              s._dirty = false;
              t++;
            } catch (a) { V.error("Element rebuild error:", { ... }); s._dirty = false; }
      }
    } finally {
      this.recordBuildStats(performance.now() - g, t);
    }
  }

  recordBuildStats(time, count) {
    this._stats.totalRebuilds += count;
    this._stats.elementsRebuiltThisFrame = count;
    this._stats.lastBuildTime = time;
    this._stats.maxElementsPerFrame = Math.max(this._stats.maxElementsPerFrame, count);
    this._stats.maxBuildTime = Math.max(this._stats.maxBuildTime, time);
    // Rolling window of 60 samples
    this._buildTimes.push(time);
    this._elementsPerFrame.push(count);
    if (this._buildTimes.length > 60)
      this._buildTimes.shift(), this._elementsPerFrame.shift();
    this._stats.averageBuildTime = this._buildTimes.reduce(...) / this._buildTimes.length;
  }

  get hasDirtyElements() { return this._dirtyElements.size > 0; }
  get buildStats()       { return { ...this._stats }; }

  resetBuildStats() {
    this._stats = { totalRebuilds: 0, ... };
    this._buildTimes.length = 0;
    this._elementsPerFrame.length = 0;
  }
}
```

**Annotations**:
- The while-loop in `buildScopes()` handles cascading dirty marks: a rebuild can dirty more elements.
- Sorted by depth so parents rebuild before children (avoids redundant child rebuilds).
- The 60-sample rolling window matches the 60fps target.

---

## 5. PipelineOwner (UB0)

**Source**: Line 530127

```js
class UB0 {
  _nodesNeedingPaint  = new Set();
  _rootRenderObject   = null;
  _rootConstraints    = null;

  requestLayout(element) {
    if (!c9.instance.isFrameInProgress)
      c9.instance.requestFrame();                        // Trigger frame on dirty layout
  }

  requestPaint(element) {
    if (this._nodesNeedingPaint.has(element)) return;    // Dedup
    this._nodesNeedingPaint.add(element);
    if (!c9.instance.isFrameInProgress)
      c9.instance.requestFrame();                        // Trigger frame on dirty paint
  }

  setRootRenderObject(obj) { this._rootRenderObject = obj; }

  updateRootConstraints(size) {
    let t = new l3(0, size.width, 0, size.height);       // BoxConstraints(0..width, 0..height)
    let changed = !this._rootConstraints
      || this._rootConstraints.maxWidth  !== t.maxWidth
      || this._rootConstraints.maxHeight !== t.maxHeight;
    if (changed && this._rootRenderObject && "markNeedsLayout" in this._rootRenderObject)
      this._rootRenderObject.markNeedsLayout();
    this._rootConstraints = t;
  }

  flushLayout() {
    let layoutPerformed = false;
    if (this._rootRenderObject && this._rootConstraints
        && "needsLayout" in this._rootRenderObject
        && this._rootRenderObject.needsLayout) {
      if ("layout" in this._rootRenderObject
          && typeof this._rootRenderObject.layout === "function")
        this._rootRenderObject.layout(this._rootConstraints);
      layoutPerformed = true;
    }
    return layoutPerformed;                              // Returns true if layout was needed
  }

  flushPaint() {
    if (this._nodesNeedingPaint.size === 0) return;
    try {
      for (let g of this._nodesNeedingPaint)
        if (g.needsPaint)
          g._needsPaint = false;                         // Clear dirty flag
    } finally {
      this._nodesNeedingPaint.clear();
    }
  }

  get hasNodesNeedingLayout() {
    return Boolean(this._rootRenderObject && this._rootRenderObject.needsLayout);
  }
  get hasNodesNeedingPaint()  { return this._nodesNeedingPaint.size > 0; }

  dispose()          { this._nodesNeedingPaint.clear(); }
  removeFromQueues(g){ this._nodesNeedingPaint.delete(g); }
}
```

**Annotations**:
- Layout is root-only: `flushLayout()` only calls `layout()` on the root render object. Individual nodes mark themselves via `markNeedsLayout` which propagates up.
- `flushPaint()` clears dirty paint flags but does NOT do the actual painting -- that happens in `WidgetsBinding.paint()`.
- Returns a boolean from `flushLayout()` to signal whether the PAINT phase should run.

---

## 6. WidgetsBinding (J3) -- Orchestrator

**Source**: Line 530127

### Fields

```js
class J3 {
  static _instance;
  frameScheduler      = c9.instance;
  buildOwner;                                            // NB0
  pipelineOwner;                                         // UB0
  focusManager        = er.instance;
  mouseManager        = Pg.instance;
  frameStatsOverlay   = new BB0();                       // PerformanceOverlay
  tui                 = new wB0();                       // Terminal UI manager
  rootElement;
  isRunning           = false;
  forcePaintOnNextFrame    = false;
  shouldPaintCurrentFrame  = false;
  didPaintCurrentFrame     = false;
  eventCallbacks      = { key: [], mouse: [], paste: [] };
  keyInterceptors     = [];
  pendingResizeEvent  = null;

  static get instance() { return J3._instance ??= new J3; }
```

### Constructor -- Callback Registration

```js
  constructor() {
    this.buildOwner    = new NB0();
    this.pipelineOwner = new UB0();

    // BUILD phase callbacks (ordered by priority)
    this.frameScheduler.addFrameCallback(
      "frame-start",
      () => this.beginFrame(),
      "build", -2000,                                    // Highest priority in BUILD
      "WidgetsBinding.beginFrame"
    );
    this.frameScheduler.addFrameCallback(
      "resize",
      () => this.processResizeIfPending(),
      "build", -1000,
      "WidgetsBinding.processResizeIfPending"
    );
    this.frameScheduler.addFrameCallback(
      "build",
      () => {
        this.buildOwner.buildScopes();
        this.updateRootRenderObject();
      },
      "build", 0,                                        // Default priority
      "BuildOwner.buildScopes"
    );

    // LAYOUT phase
    this.frameScheduler.addFrameCallback(
      "layout",
      () => {
        this.updateRootConstraints();
        if (this.pipelineOwner.flushLayout())
          this.shouldPaintCurrentFrame = true;            // Layout changed -> must repaint
      },
      "layout", 0,
      "PipelineOwner.flushLayout"
    );

    // PAINT phase
    this.frameScheduler.addFrameCallback(
      "paint",
      () => this.paint(),
      "paint", 0,
      "WidgetsBinding.paint"
    );

    // RENDER phase
    this.frameScheduler.addFrameCallback(
      "render",
      () => this.render(),
      "render", 0,
      "WidgetsBinding.render"
    );

    // Wire up element/render-object dirty callbacks
    VG8(
      { scheduleBuildFor: (g) => this.buildOwner.scheduleBuildFor(g) },
      { requestLayout: (g) => this.pipelineOwner.requestLayout(g),
        requestPaint:  (g) => this.pipelineOwner.requestPaint(g) }
    );
  }
```

### beginFrame() -- Frame Start / Dirty Assessment

```js
  beginFrame() {
    this.didPaintCurrentFrame = false;
    this.shouldPaintCurrentFrame =
         this.forcePaintOnNextFrame
      || this.buildOwner.hasDirtyElements
      || this.pipelineOwner.hasNodesNeedingLayout
      || this.pipelineOwner.hasNodesNeedingPaint
      || this.tui.getScreen().requiresFullRefresh;
    this.forcePaintOnNextFrame = false;
  }
```

**Annotations**:
- `beginFrame()` runs first in the BUILD phase (priority -2000).
- It decides whether painting is needed by checking ANY dirty state.
- `requiresFullRefresh` handles terminal resize or other screen-level invalidation.

### paint() -- PAINT Phase

```js
  paint() {
    if (!this.shouldPaintCurrentFrame) return;           // FRAME SKIP -- nothing dirty
    if (this.pipelineOwner.flushPaint()) { /* clears dirty flags */ }
    if (!this.rootElement) return;

    let g = this.rootElement.renderObject;
    if (!g && this.rootElement.children.length > 0)
      g = this.rootElement.children[0]?.renderObject;
    if (!g) return;

    try {
      let t = this.tui.getScreen();
      t.clear();
      t.clearCursor();
      this.renderRenderObject(g, t, 0, 0);              // DFS paint traversal
      let b = this.frameScheduler.frameStats;
      this.frameStatsOverlay.recordStats(b, this.tui.getLastRenderDiffStats());
      this.frameStatsOverlay.draw(t, b);                 // Overlay on top
      this.didPaintCurrentFrame = true;
    } catch (t) {
      V.error("Paint error:", t);
    }
  }
```

### render() -- RENDER Phase (Flush to Terminal)

```js
  render() {
    if (!this.didPaintCurrentFrame) return;              // Skip if paint was skipped
    try {
      this.tui.render();                                 // Diff + write to stdout
    } catch (g) {
      V.error("Render error:", g);
    }
  }
```

### requestForcedPaintFrame()

```js
  requestForcedPaintFrame() {
    this.forcePaintOnNextFrame = true;
    this.frameScheduler.requestFrame();
  }
```

### toggleFrameStatsOverlay()

```js
  toggleFrameStatsOverlay() {
    let g = !this.frameStatsOverlay.isEnabled();
    this.frameStatsOverlay.setEnabled(g);
    this.requestForcedPaintFrame();
  }
```

---

## 7. 4-Phase Pipeline Execution

Executed in `c9.executeFrame()` in strict order:

| Phase | Priority | Callbacks | What Happens |
|-------|----------|-----------|-------------|
| **BUILD** | -2000 | `beginFrame()` | Assess dirty state, set `shouldPaintCurrentFrame` |
| **BUILD** | -1000 | `processResizeIfPending()` | Handle pending terminal resize |
| **BUILD** | 0 | `buildScopes()` + `updateRootRenderObject()` | Rebuild dirty elements (depth-sorted) |
| **LAYOUT** | 0 | `flushLayout()` | Run layout on root if `needsLayout`; signal paint if layout changed |
| **PAINT** | 0 | `paint()` | Clear screen, DFS paint tree, record overlay stats |
| **RENDER** | 0 | `render()` | Diff screen buffer, generate ANSI escape sequences, write to stdout |

After all 4 phases: **Post-frame callbacks** run (one-shot tasks like `MouseManager.reestablishHoverState`).

---

## 8. Frame Skipping Logic

Frames are skipped at multiple levels:

1. **FrameScheduler.requestFrame()**: If `_frameScheduled` is already true, the call is a no-op (coalescing).
2. **beginFrame()**: Sets `shouldPaintCurrentFrame = false` unless dirty state exists.
3. **paint()**: Returns immediately if `!shouldPaintCurrentFrame`.
4. **render()**: Returns immediately if `!didPaintCurrentFrame`.

This means a frame requested by a callback that doesn't actually dirty anything will still execute the BUILD and LAYOUT phases but skip PAINT and RENDER entirely.

---

## 9. On-Demand Scheduling -- Dirty State Triggers

There is **no continuous frame loop**. Frames are requested on-demand when state becomes dirty:

| Trigger | Method | What Requests a Frame |
|---------|--------|-----------------------|
| Element marked dirty | `BuildOwner.scheduleBuildFor(element)` | Adds to `_dirtyElements` Set, calls `c9.instance.requestFrame()` |
| Layout needed | `PipelineOwner.requestLayout(element)` | Calls `c9.instance.requestFrame()` (if not mid-frame) |
| Paint needed | `PipelineOwner.requestPaint(element)` | Adds to `_nodesNeedingPaint` Set, calls `c9.instance.requestFrame()` |
| Terminal resize | `tui.onResize(handler)` | Sets `pendingResizeEvent`, calls `frameScheduler.requestFrame()` |
| Forced repaint | `requestForcedPaintFrame()` | Sets `forcePaintOnNextFrame = true`, calls `requestFrame()` |
| Post-frame callback added | `addPostFrameCallback()` | Calls `requestFrame()` if not already scheduled |

---

## 10. Frame Pacing & Timer Strategy

```
requestFrame()
  |
  +-- Already scheduled? --> return (coalesce)
  |
  +-- Frame in progress? --> mark _frameScheduled=true, return (re-run after)
  |
  +-- Test mode (_useFramePacing=false)? --> scheduleFrameExecution(0)
  |
  +-- Time since last frame >= Oy (16.67ms)? --> scheduleFrameExecution(0)
  |
  +-- Otherwise --> scheduleFrameExecution(Oy - elapsed)

scheduleFrameExecution(delay)
  |
  +-- delay <= 0 --> setImmediate(() => runScheduledFrame())
  |
  +-- delay > 0  --> setTimeout(() => runScheduledFrame(), delay)
```

- Uses `setImmediate` for zero-delay (yields to I/O but higher priority than setTimeout).
- Uses `setTimeout` for non-zero pacing delays.
- Does NOT use `setInterval` -- purely on-demand.
- Does NOT use `requestAnimationFrame` (this is a terminal app, not a browser).

---

## 11. PerformanceTracker (_B0)

**Source**: Line 530127

```js
function Aa(samples, percentile) {
  if (samples.length === 0) return 0;
  let sorted = [...samples].sort((r, m) => r - m);
  let p = Math.max(0, Math.min(percentile, 1));
  let idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, idx)] || 0;
}

class _B0 {
  frameTimes       = [];
  phaseTimes       = { build: [], layout: [], paint: [], render: [] };
  keyEventTimes    = [];
  mouseEventTimes  = [];
  repaintPercents  = [];
  bytesWritten     = [];
  lastKeyEventTime   = 0;
  lastMouseEventTime = 0;
  lastRepaintPercent = 0;
  lastBytesWritten   = 0;
  MAX_SAMPLES = 1024;                                    // Rolling window size

  recordFrame(time)                { push+shift if > MAX_SAMPLES }
  recordPhase(phase, time)         { push+shift on phaseTimes[phase] }
  recordKeyEvent(time)             { push+shift }
  recordMouseEvent(time)           { push+shift }
  recordRepaintPercent(pct)        { push+shift }
  recordBytesWritten(bytes)        { push+shift }

  getFrameP99()                    { return Aa(this.frameTimes, 0.99); }
  getFrameP95()                    { return Aa(this.frameTimes, 0.95); }
  getPhaseP99(phase)               { return Aa(this.phaseTimes[phase], 0.99); }
  getPhaseP95(phase)               { return Aa(this.phaseTimes[phase], 0.95); }
  getKeyEventP99()                 { return Aa(this.keyEventTimes, 0.99); }
  getKeyEventP95()                 { return Aa(this.keyEventTimes, 0.95); }
  getMouseEventP99()               { return Aa(this.mouseEventTimes, 0.99); }
  getMouseEventP95()               { return Aa(this.mouseEventTimes, 0.95); }
  getRepaintPercentP99()           { return Aa(this.repaintPercents, 0.99); }
  getRepaintPercentP95()           { return Aa(this.repaintPercents, 0.95); }
  getBytesWrittenP99()             { return Aa(this.bytesWritten, 0.99); }
  getBytesWrittenP95()             { return Aa(this.bytesWritten, 0.95); }

  reset() {
    this.frameTimes = [];
    for (let g of Object.values(oJ)) this.phaseTimes[g] = [];
    this.keyEventTimes = []; this.mouseEventTimes = [];
    this.repaintPercents = []; this.bytesWritten = [];
    this.lastKeyEventTime = 0; this.lastMouseEventTime = 0;
    this.lastRepaintPercent = 0; this.lastBytesWritten = 0;
  }
}
```

**Annotations**:
- 1024-sample rolling window for all metrics.
- Tracks 8 categories: frame total, 4 phases, key events, mouse events, repaint%, bytes written.
- P95 and P99 computed on demand via the `Aa` function.

---

## 12. PerformanceOverlay (BB0)

**Source**: Line 530127

```js
class BB0 {
  enabled = false;
  tracker = new _B0();

  setEnabled(g)          { this.enabled = g; }
  isEnabled()            { return this.enabled; }
  recordKeyEvent(time)   { this.tracker.recordKeyEvent(time); }
  recordMouseEvent(time) { this.tracker.recordMouseEvent(time); }

  recordStats(frameStats, renderDiffStats) {
    this.tracker.recordFrame(frameStats.lastFrameTime);
    for (let phase of Object.values(oJ))
      this.tracker.recordPhase(phase, frameStats.phaseStats[phase].lastTime);
    if (renderDiffStats)
      this.tracker.recordRepaintPercent(renderDiffStats.repaintedPercent),
      this.tracker.recordBytesWritten(renderDiffStats.bytesWritten);
  }
```

### draw() -- Overlay Rendering

```js
  draw(screen, frameStats) {
    if (!this.enabled) return;
    let { width, height } = screen.getSize();
    let boxWidth  = 34;
    let boxHeight = 14;
    let x = width - boxWidth - 2;                        // Top-right corner
    let y = 1;
    if (x < 0 || y + boxHeight >= height) return;        // Skip if terminal too small

    // Box drawing with Unicode borders
    // Title: " Gotta Go Fast " (centered, warning color)

    // Rows displayed:
    //   Header:  "          Last    P95    P99"
    //   Key:     last / P95 / P99 ms
    //   Mouse:   last / P95 / P99 ms
    //   (blank)
    //   Build:   last / P95 / P99 ms
    //   Layout:  last / P95 / P99 ms
    //   Paint:   last / P95 / P99 ms
    //   Render:  last / P95 / P99 ms
    //   (blank)
    //   Frame:   last / P95 / P99 ms (total)
    //   Repaint: last / P95 / P99 %
    //   Bytes:   last / P95 / P99 (formatted)
  }
```

### Color Thresholds

```js
  getTimingColor(ms) {
    let colorScheme = qb.default().colorScheme;
    let budget = Oy;                                     // 16.67ms
    let warning = Oy * 0.7;                              // ~11.67ms
    if (ms >= budget)  return colorScheme.destructive;   // RED: over budget
    if (ms >= warning) return colorScheme.warning;       // YELLOW: approaching budget
    return colorScheme.foreground;                        // Normal: under 70%
  }

  getPercentColor(percent) {
    if (percent >= 50) return colorScheme.destructive;   // RED: 50%+ repaint
    if (percent >= 20) return colorScheme.warning;       // YELLOW: 20-50% repaint
    return colorScheme.foreground;                        // Normal: under 20%
  }

  formatBytes(bytes) {
    if (bytes >= 10000) return `${Math.round(bytes / 1000)}k`;
    if (bytes >= 1000)  return `${(bytes / 1000).toFixed(1)}k`;
    return `${Math.round(bytes)}`;
  }
```

---

## 13. Percentile Function (Aa)

**Source**: Line 530127

```js
function Aa(samples, percentile) {
  if (samples.length === 0) return 0;
  let sorted = [...samples].sort((a, b) => a - b);
  let p   = Math.max(0, Math.min(percentile, 1));       // Clamp 0..1
  let idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, idx)] || 0;
}
```

- Used for P95 (0.95) and P99 (0.99) calculations across all metric arrays.
- Creates a sorted copy (does not mutate the original array).
- Nearest-rank method for percentile computation.

---

## 14. TUI / Screen Rendering (wB0)

**Source**: Line 530126

### Key Fields

```js
class wB0 {
  parser; initialized; inAltScreen; suspended;
  tty;
  screen;                                                // ij (Screen buffer)
  renderer;                                              // z_0 (ANSI renderer)
  terminalSize = { width: 80, height: 24 };
  jetBrainsWheelFilter;
  keyHandlers = [];
  mouseHandlers = [];
  lastRenderDiffStats = {
    repaintedCellCount: 0,
    totalCellCount: 1920,                                // 80*24 default
    repaintedPercent: 0,
    bytesWritten: 0
  };
}
```

### render() -- Terminal Output

```js
  render() {
    if (!this.initialized) throw Error("TUI not initialized");
    if (this.suspended) return;

    let diff  = this.screen.getDiff();                   // Changed cells only
    let size  = this.screen.getSize();
    let total = size.width * size.height;
    let count = diff.length;
    let pct   = total > 0 ? count / total * 100 : 0;
    this.lastRenderDiffStats = {
      repaintedCellCount: count,
      totalCellCount: total,
      repaintedPercent: pct,
      bytesWritten: 0
    };

    let cursor = this.screen.getCursor();
    if (diff.length > 0 || cursor !== null) {
      let buf = new bJ();                                // String builder
      buf.append(this.renderer.startSync());             // Begin Synchronized Output
      buf.append(this.renderer.hideCursor());
      buf.append(this.renderer.reset());
      buf.append(this.renderer.moveTo(0, 0));
      let rendered = this.renderer.render(diff);         // ANSI escape sequences for diff
      buf.append(rendered);

      if (cursor) {
        buf.append(this.renderer.moveTo(cursor.x, cursor.y));
        if (this.screen.isCursorVisible())
          buf.append(this.renderer.setCursorShape(this.screen.getCursorShape())),
          buf.append(this.renderer.showCursor());
        else
          buf.append(this.renderer.hideCursor());
      } else {
        buf.append(this.renderer.hideCursor());
      }

      let output = buf.toString();                       // Finalize
      this.lastRenderDiffStats = {
        ...this.lastRenderDiffStats,
        bytesWritten: Buffer.byteLength(output, "utf8")
      };
      process.stdout.write(output);                      // Write to terminal
      this.screen.present();                             // Swap buffers (mark current as clean)
    }
  }
```

**Annotations**:
- Uses **double-buffering**: `screen.getDiff()` returns only changed cells, `screen.present()` promotes the new buffer.
- Uses **Synchronized Output** (`startSync()`) to prevent tearing.
- Diff-based rendering minimizes bytes written to the terminal.
- `bJ` is a string builder that batches all ANSI sequences into a single `process.stdout.write()` call.

---

## 15. Paint Traversal (DFS)

**Source**: Line 530127

```js
  // In WidgetsBinding (J3):
  renderRenderObject(renderObj, screen, offsetX, offsetY) {
    if ("paint" in renderObj && typeof renderObj.paint === "function")
      renderObj.paint(screen, offsetX, offsetY);
  }
```

**Annotations**:
- The paint traversal is delegated to each render object's `paint(screen, x, y)` method.
- Each render object receives the screen buffer and its absolute offset.
- Render objects are responsible for painting their children (typically with accumulated offsets).
- The PerformanceOverlay draws on top after the main tree paint completes.

### Paint Method Signature (Render Objects)

```
paint(screen: ij, offsetX: number, offsetY: number): void
```

### Screen Cell API (used by render objects and the overlay)

```js
screen.setCell(x, y, cell)     // Set a single cell at (x, y)
screen.getSize()               // { width, height }
screen.clear()                 // Clear all cells
screen.clearCursor()           // Remove cursor position
screen.setCursor(x, y)        // Set cursor position
screen.isCursorVisible()      // Check cursor visibility
screen.getCursorShape()       // Get cursor shape
screen.markForRefresh()        // Force full repaint on next frame
screen.getDiff()               // Get changed cells since last present()
screen.present()               // Swap buffers
screen.resize(w, h)           // Resize the screen buffer
```

### Cell Constructor (q3)

```js
q3(character, { fg, bg, ... })
// Example: q3("A", { fg: "#ffffff" })
// Example: q3("\u2500", { fg: borderColor })  // Box-drawing horizontal line
```

---

## 16. Identifier Cross-Reference

| Minified | Deobfuscated | Type | Source Line |
|----------|-------------|------|-------------|
| `oJ` | Phase (enum) | Enum: BUILD/LAYOUT/PAINT/RENDER | 530126 |
| `Iz8` | TARGET_FPS | Constant: 60 | 530126 |
| `Oy` | FRAME_BUDGET_MS | Constant: 1000/60 (~16.67) | 530126 |
| `c9` | FrameScheduler | Singleton class | 530126 |
| `NB0` | BuildOwner | Class | 530126 |
| `UB0` | PipelineOwner | Class | 530127 |
| `J3` | WidgetsBinding | Singleton class (orchestrator) | 530127 |
| `_B0` | PerformanceTracker | Class | 530127 |
| `BB0` | PerformanceOverlay | Class | 530127 |
| `wB0` | TUI (TerminalUI) | Class | 530126 |
| `nA` | MediaQueryData | Class (size + capabilities) | 530127 |
| `Q3` | MediaQuery | InheritedWidget class | 530127 |
| `Aa` | percentile() | Function (P95/P99 calc) | 530127 |
| `jz8` | isTestEnvironment() | Function | 530126 |
| `q3` | Cell() | Function (terminal cell constructor) | 530127 |
| `bJ` | StringBuffer | Class (string builder) | 530126 |
| `z_0` | AnsiRenderer | Class | 530126 |
| `ij` | Screen | Class (double-buffered cell grid) | 530126 |
| `l3` | BoxConstraints | Class | 530127 |
| `er` | FocusManager | Singleton | 530127 |
| `Pg` | MouseManager | Singleton | 530127 |
| `qb` | Theme | Singleton accessor | 530127 |
| `V` | Logger | Global logger instance | 530126-530127 |
| `VG8` | setupBindingCallbacks() | Function (wires dirty notifications) | 530127 |
| `m4` | assert() | Function (fatal assertion) | 530126 |

---

## Architecture Summary

```
User Interaction (key/mouse/resize/setState)
        |
        v
  markDirty (element/layout/paint)
        |
        v
  c9.requestFrame()  [coalesced, paced to 60fps]
        |
        v
  setImmediate / setTimeout
        |
        v
  c9.executeFrame()
        |
        +-- BUILD phase
        |     beginFrame()      -- assess dirty state
        |     processResize()   -- handle pending resize
        |     buildScopes()     -- rebuild dirty elements (depth-sorted)
        |
        +-- LAYOUT phase
        |     flushLayout()     -- layout root if needed
        |
        +-- PAINT phase
        |     paint()           -- skip if nothing dirty
        |       clear screen
        |       DFS paint traversal (renderRenderObject)
        |       draw PerformanceOverlay
        |
        +-- RENDER phase
        |     render()          -- skip if paint was skipped
        |       getDiff()       -- changed cells only
        |       startSync()     -- synchronized output
        |       write ANSI to stdout
        |       present()       -- swap buffers
        |
        +-- Post-frame callbacks (one-shot)
        |
        +-- Re-schedule if _frameScheduled was set during execution
```
