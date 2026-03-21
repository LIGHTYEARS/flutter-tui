// WidgetsBinding + runApp() — top-level orchestrator
// Amp ref: J3 (WidgetsBinding), cz8 (runApp), amp-strings.txt:530127
// Reference: .reference/widget-tree.md, .reference/frame-scheduler.md
//
// CRITICAL Amp fidelity notes:
// - WidgetsBinding is a singleton that registers callbacks with FrameScheduler
// - Owns BuildOwner + PipelineOwner
// - runApp creates the root element, attaches it, and schedules first frame
// - Frame phases: build -> layout -> paint -> render

import { BuildOwner } from './build-owner';
import { PipelineOwner } from './pipeline-owner';
import { Widget, StatelessWidget, type BuildContext } from './widget';
import { Element, StatelessElement } from './element';
import { BoxConstraints } from '../core/box-constraints';
import { Size } from '../core/types';

// ---------------------------------------------------------------------------
// Global build/paint scheduler accessors (Amp: lF, dF, VG8, XG8, xH)
//
// These module-level variables bridge elements to the binding's
// BuildOwner and PipelineOwner. Set during WidgetsBinding construction.
// ---------------------------------------------------------------------------

/** Build scheduler interface — wraps BuildOwner.scheduleBuildFor */
interface BuildScheduler {
  scheduleBuildFor(element: Element): void;
}

/** Paint scheduler interface — wraps PipelineOwner methods */
interface PaintScheduler {
  requestLayout(node?: any): void;
  requestPaint(node?: any): void;
  removeFromQueues(node?: any): void;
}

let _buildScheduler: BuildScheduler | null = null;
let _paintScheduler: PaintScheduler | null = null;

/**
 * Register the global build and paint schedulers.
 * Called once during WidgetsBinding construction.
 * Amp ref: VG8(g, t)
 */
export function initSchedulers(
  buildScheduler: BuildScheduler,
  paintScheduler: PaintScheduler,
): void {
  _buildScheduler = buildScheduler;
  _paintScheduler = paintScheduler;
}

/**
 * Get the build scheduler. Used by Element.markNeedsRebuild().
 * Amp ref: XG8()
 */
export function getBuildScheduler(): BuildScheduler {
  if (!_buildScheduler) {
    // In test mode, return a no-op scheduler
    if (isTestEnvironment()) {
      return { scheduleBuildFor: () => {} };
    }
    throw new Error(
      'Build scheduler not initialized. Make sure WidgetsBinding is created.',
    );
  }
  return _buildScheduler;
}

/**
 * Get the paint scheduler. Used by RenderObject.markNeedsLayout/Paint().
 * Amp ref: xH()
 */
export function getPaintScheduler(): PaintScheduler {
  if (!_paintScheduler) {
    if (isTestEnvironment()) {
      return {
        requestLayout: () => {},
        requestPaint: () => {},
        removeFromQueues: () => {},
      };
    }
    throw new Error(
      'Paint scheduler not initialized. Make sure WidgetsBinding is created.',
    );
  }
  return _paintScheduler;
}

/** Reset global schedulers (for testing). */
export function resetSchedulers(): void {
  _buildScheduler = null;
  _paintScheduler = null;
}

/**
 * Detect test environment.
 * Amp ref: jz8() — checks BUN_TEST, VITEST, NODE_TEST_CONTEXT
 */
function isTestEnvironment(): boolean {
  if (typeof process === 'undefined') return false;
  return (
    process.env.BUN_TEST === '1' ||
    process.env.VITEST === 'true' ||
    process.env.NODE_TEST_CONTEXT === '1'
  );
}

// ---------------------------------------------------------------------------
// _RootWidget — internal root widget wrapper
//
// Wraps the user's widget to provide a root element for the tree.
// ---------------------------------------------------------------------------

class _RootWidget extends StatelessWidget {
  readonly child: Widget;

  constructor(opts: { child: Widget }) {
    super();
    this.child = opts.child;
  }

  build(_context: BuildContext): Widget {
    return this.child;
  }

  override createElement(): StatelessElement {
    return new StatelessElement(this);
  }
}

// ---------------------------------------------------------------------------
// WidgetsBinding (Amp: J3) — singleton orchestrator
//
// Ties together BuildOwner, PipelineOwner, and the frame scheduler.
// For Phase 3, this is a simplified version:
// - No TUI terminal management (Phase 5)
// - No FocusManager/MouseManager (Phase 6)
// - Frame scheduling uses queueMicrotask instead of FrameScheduler
// ---------------------------------------------------------------------------

export class WidgetsBinding {
  private static _instance: WidgetsBinding | null = null;

  readonly buildOwner: BuildOwner;
  readonly pipelineOwner: PipelineOwner;
  private _rootElement: Element | null = null;
  private _renderViewSize: Size = new Size(80, 24); // default terminal size
  private _frameScheduled: boolean = false;
  private _isRunning: boolean = false;

  private constructor() {
    this.buildOwner = new BuildOwner();
    this.pipelineOwner = new PipelineOwner();

    // Wire up global schedulers (Amp ref: VG8 call in J3 constructor)
    initSchedulers(
      {
        scheduleBuildFor: (element: Element) =>
          this.buildOwner.scheduleBuildFor(element),
      },
      {
        requestLayout: () => this.pipelineOwner.requestLayout(),
        requestPaint: (node?: any) => this.pipelineOwner.requestPaint(node),
        removeFromQueues: (node?: any) =>
          this.pipelineOwner.removeFromQueues(node),
      },
    );
  }

  /**
   * Get or create the singleton WidgetsBinding.
   * Amp ref: J3.instance — static get instance() { return J3._instance ??= new J3; }
   */
  static get instance(): WidgetsBinding {
    if (!WidgetsBinding._instance) {
      WidgetsBinding._instance = new WidgetsBinding();
    }
    return WidgetsBinding._instance;
  }

  /** Reset singleton for testing. */
  static reset(): void {
    if (WidgetsBinding._instance) {
      WidgetsBinding._instance.buildOwner.dispose();
      WidgetsBinding._instance.pipelineOwner.dispose();
    }
    WidgetsBinding._instance = null;
    resetSchedulers();
  }

  get rootElement(): Element | null {
    return this._rootElement;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Attach the root widget to create the three trees (widget/element/render).
   *
   * Amp ref: J3.runApp(g) — creates MediaQuery wrapper, mounts root element
   * Simplified: no MediaQuery wrapper yet (Phase 7)
   */
  attachRootWidget(widget: Widget): void {
    // Wrap in a RootWidget that provides the root element
    const rootWidget = new _RootWidget({ child: widget });
    this._rootElement = rootWidget.createElement();

    // Mount the root element (this builds the tree)
    if (
      this._rootElement &&
      'mount' in this._rootElement &&
      typeof (this._rootElement as any).mount === 'function'
    ) {
      (this._rootElement as any).mount();
    }

    // Set initial constraints based on terminal size
    this.pipelineOwner.setConstraints(
      BoxConstraints.tight(this._renderViewSize),
    );

    this._isRunning = true;
  }

  /**
   * Handle terminal resize.
   *
   * Amp ref: WidgetsBinding resize handling — updates constraints, schedules frame
   */
  handleResize(width: number, height: number): void {
    this._renderViewSize = new Size(width, height);
    this.pipelineOwner.setConstraints(
      BoxConstraints.tight(this._renderViewSize),
    );
    this.scheduleFrame();
  }

  /**
   * Schedule a frame (build + layout + paint).
   * In Phase 5 this will use the FrameScheduler; for now, queueMicrotask.
   *
   * Amp ref: c9.requestFrame() — coalesced, only one pending frame at a time
   */
  scheduleFrame(): void {
    if (this._frameScheduled) return;
    this._frameScheduled = true;
    // In full implementation (Phase 5), this uses FrameScheduler
    // For now, process via microtask
    queueMicrotask(() => this.drawFrame());
  }

  /**
   * Execute one frame: build -> layout -> paint.
   *
   * Amp ref: c9.executeFrame() — iterates ["build", "layout", "paint", "render"]
   * Simplified for Phase 3.
   */
  drawFrame(): void {
    this._frameScheduled = false;
    // BUILD phase
    this.buildOwner.buildScopes();
    // LAYOUT phase
    this.pipelineOwner.flushLayout();
    // PAINT phase (stub — Phase 5 implements actual paint)
    this.pipelineOwner.flushPaint();
  }

  /**
   * Synchronous version for testing.
   * Runs build -> layout -> paint immediately without microtask.
   */
  drawFrameSync(): void {
    this._frameScheduled = false;
    this.buildOwner.buildScopes();
    this.pipelineOwner.flushLayout();
    this.pipelineOwner.flushPaint();
  }

  /**
   * Stop the binding.
   * Amp ref: J3.stop()
   */
  stop(): void {
    this._isRunning = false;
    if (this._rootElement) {
      this._rootElement.unmount();
      this._rootElement = null;
    }
    this.buildOwner.dispose();
    this.pipelineOwner.dispose();
  }
}

// ---------------------------------------------------------------------------
// runApp (Amp: cz8)
//
// Top-level entry point. Creates/gets the binding singleton,
// attaches the root widget, and schedules the first frame.
//
// Amp ref: async function cz8(g, t) { let b = J3.instance; await b.runApp(g); }
// Simplified for Phase 3 (synchronous, no TUI init).
// ---------------------------------------------------------------------------

export function runApp(widget: Widget): WidgetsBinding {
  const binding = WidgetsBinding.instance;
  binding.attachRootWidget(widget);
  binding.scheduleFrame();
  return binding;
}
