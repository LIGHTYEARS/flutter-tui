// SingleChildScrollView, Scrollable, ScrollViewport, RenderScrollViewport
// Amp ref: R4 (SingleChildScrollView), dH0 (Scrollable), yH0 (ScrollViewport), oH0 (RenderScrollViewport)
// Source: amp-strings.txt:529716

import { Widget, StatelessWidget, StatefulWidget, State, type BuildContext } from '../framework/widget';
import { SingleChildRenderObjectWidget, RenderBox, type PaintContext } from '../framework/render-object';
import { BoxConstraints } from '../core/box-constraints';
import { Offset, Size } from '../core/types';
import { ScrollController } from './scroll-controller';
import { Key } from '../core/key';

// ---------------------------------------------------------------------------
// SingleChildScrollView (Amp: R4)
// ---------------------------------------------------------------------------

/**
 * A scrollable container that wraps a single child.
 * Delegates to Scrollable + ScrollViewport.
 *
 * Amp ref: class R4 extends H3
 */
export class SingleChildScrollView extends StatelessWidget {
  readonly child: Widget;
  readonly controller?: ScrollController;
  readonly scrollDirection: 'vertical' | 'horizontal';
  readonly position: 'top' | 'bottom';

  constructor(opts: {
    key?: Key;
    child: Widget;
    controller?: ScrollController;
    scrollDirection?: 'vertical' | 'horizontal';
    position?: 'top' | 'bottom';
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.child = opts.child;
    this.controller = opts.controller;
    this.scrollDirection = opts.scrollDirection ?? 'vertical';
    this.position = opts.position ?? 'top';
  }

  build(_context: BuildContext): Widget {
    return new Scrollable({
      child: this.child,
      controller: this.controller,
      scrollDirection: this.scrollDirection,
      position: this.position,
    });
  }
}

// ---------------------------------------------------------------------------
// Scrollable (Amp: dH0)
// ---------------------------------------------------------------------------

/**
 * Manages scroll state and keyboard input for scrolling.
 * Creates or uses a ScrollController for state management.
 *
 * Amp ref: class dH0 extends H8
 */
export class Scrollable extends StatefulWidget {
  readonly child: Widget;
  readonly controller?: ScrollController;
  readonly scrollDirection: 'vertical' | 'horizontal';
  readonly position: 'top' | 'bottom';

  constructor(opts: {
    key?: Key;
    child: Widget;
    controller?: ScrollController;
    scrollDirection?: 'vertical' | 'horizontal';
    position?: 'top' | 'bottom';
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.child = opts.child;
    this.controller = opts.controller;
    this.scrollDirection = opts.scrollDirection ?? 'vertical';
    this.position = opts.position ?? 'top';
  }

  createState(): State<Scrollable> {
    return new ScrollableState();
  }
}

class ScrollableState extends State<Scrollable> {
  private _controller?: ScrollController;

  get effectiveController(): ScrollController {
    return this.widget.controller ?? this._controller!;
  }

  initState(): void {
    if (!this.widget.controller) {
      this._controller = new ScrollController();
    }
  }

  dispose(): void {
    if (this._controller) {
      this._controller.dispose();
      this._controller = undefined;
    }
    super.dispose();
  }

  build(_context: BuildContext): Widget {
    return new ScrollViewport({
      child: this.widget.child,
      controller: this.effectiveController,
      scrollDirection: this.widget.scrollDirection,
      position: this.widget.position,
    });
  }
}

// ---------------------------------------------------------------------------
// ScrollViewport (Amp: yH0)
// ---------------------------------------------------------------------------

/**
 * SingleChildRenderObjectWidget that creates a RenderScrollViewport.
 *
 * Amp ref: class yH0 extends Qb
 */
export class ScrollViewport extends SingleChildRenderObjectWidget {
  readonly controller: ScrollController;
  readonly scrollDirection: 'vertical' | 'horizontal';
  readonly position: 'top' | 'bottom';

  constructor(opts: {
    key?: Key;
    child?: Widget;
    controller: ScrollController;
    scrollDirection?: 'vertical' | 'horizontal';
    position?: 'top' | 'bottom';
  }) {
    super({ key: opts.key, child: opts.child });
    this.controller = opts.controller;
    this.scrollDirection = opts.scrollDirection ?? 'vertical';
    this.position = opts.position ?? 'top';
  }

  createRenderObject(): RenderScrollViewport {
    return new RenderScrollViewport({
      scrollController: this.controller,
      axisDirection: this.scrollDirection,
      position: this.position,
    });
  }

  updateRenderObject(renderObject: RenderScrollViewport): void {
    renderObject.scrollController = this.controller;
    renderObject.axisDirection = this.scrollDirection;
    renderObject.position = this.position;
  }
}

// ---------------------------------------------------------------------------
// RenderScrollViewport (Amp: oH0)
// ---------------------------------------------------------------------------

/**
 * A RenderBox that clips its child and offsets painting by the scroll offset.
 * The child is laid out with unbounded constraints on the main axis.
 *
 * Amp ref: class oH0 extends j9
 */
export class RenderScrollViewport extends RenderBox {
  private _scrollOffset: number = 0;
  private _child: RenderBox | null = null;

  scrollController: ScrollController;
  axisDirection: 'vertical' | 'horizontal';
  position: 'top' | 'bottom';

  constructor(opts: {
    scrollController: ScrollController;
    axisDirection?: 'vertical' | 'horizontal';
    position?: 'top' | 'bottom';
  }) {
    super();
    this.scrollController = opts.scrollController;
    this.axisDirection = opts.axisDirection ?? 'vertical';
    this.position = opts.position ?? 'top';
  }

  get child(): RenderBox | null {
    return this._child;
  }

  set child(value: RenderBox | null) {
    if (this._child === value) return;
    if (this._child) {
      this.dropChild(this._child);
    }
    this._child = value;
    if (this._child) {
      this.adoptChild(this._child);
    }
  }

  override visitChildren(visitor: (child: import('../framework/render-object').RenderObject) => void): void {
    if (this._child) {
      visitor(this._child);
    }
  }

  /**
   * Layout protocol:
   * 1. Layout child with UNBOUNDED main axis
   * 2. Self-size to parent constraints
   * 3. Update scrollController maxScrollExtent
   * 4. Handle followMode and position='bottom' anchoring
   */
  performLayout(): void {
    const constraints = this.constraints!;

    if (!this._child) {
      this.size = constraints.constrain(Size.zero);
      return;
    }

    // Create unbounded constraints on the main axis
    let childConstraints: BoxConstraints;
    if (this.axisDirection === 'vertical') {
      childConstraints = new BoxConstraints({
        minWidth: constraints.minWidth,
        maxWidth: constraints.maxWidth,
        minHeight: 0,
        maxHeight: Infinity,
      });
    } else {
      childConstraints = new BoxConstraints({
        minWidth: 0,
        maxWidth: Infinity,
        minHeight: constraints.minHeight,
        maxHeight: constraints.maxHeight,
      });
    }

    // Layout child with unbounded main axis
    this._child.layout(childConstraints);

    // Self-size to parent constraints
    this.size = constraints.constrain(new Size(
      this.axisDirection === 'vertical' ? this._child.size.width : constraints.maxWidth,
      this.axisDirection === 'vertical' ? constraints.maxHeight : this._child.size.height,
    ));

    // Calculate max scroll extent
    const childMainSize = this.axisDirection === 'vertical'
      ? this._child.size.height
      : this._child.size.width;
    const viewportMainSize = this.axisDirection === 'vertical'
      ? this.size.height
      : this.size.width;
    const maxExtent = Math.max(0, childMainSize - viewportMainSize);

    // Update controller
    this.scrollController.updateMaxScrollExtent(maxExtent);

    // Store current scroll offset
    this._scrollOffset = this.scrollController.offset;

    // Position anchoring for position='bottom'
    if (this.position === 'bottom' && childMainSize < viewportMainSize) {
      // Anchor content to bottom of viewport
      if (this.axisDirection === 'vertical') {
        this._child.offset = new Offset(0, viewportMainSize - childMainSize);
      } else {
        this._child.offset = new Offset(viewportMainSize - childMainSize, 0);
      }
    } else {
      this._child.offset = Offset.zero;
    }
  }

  /**
   * Paint protocol:
   * Clip to viewport bounds, then paint child at scroll-adjusted offset.
   */
  paint(context: PaintContext, offset: Offset): void {
    if (!this._child) return;

    this._scrollOffset = this.scrollController.offset;

    // Use withClip to restrict painting to viewport bounds
    const clipContext = (context as any).withClip
      ? (context as any).withClip(offset.col, offset.row, this.size.width, this.size.height)
      : context;

    // Calculate child paint offset adjusted by scroll
    let childOffset: Offset;
    if (this.axisDirection === 'vertical') {
      childOffset = new Offset(
        offset.col + this._child.offset.col,
        offset.row + this._child.offset.row - this._scrollOffset,
      );
    } else {
      childOffset = new Offset(
        offset.col + this._child.offset.col - this._scrollOffset,
        offset.row + this._child.offset.row,
      );
    }

    this._child.paint(clipContext, childOffset);
  }
}
