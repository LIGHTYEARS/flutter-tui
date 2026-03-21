// Builder and LayoutBuilder widgets
// Amp ref: custom utility widgets

import { Widget, StatelessWidget, StatefulWidget, State, type BuildContext } from '../framework/widget';
import { SingleChildRenderObjectWidget, RenderBox, type PaintContext, type RenderObject } from '../framework/render-object';
import { BoxConstraints } from '../core/box-constraints';
import { Offset, Size } from '../core/types';
import { Key } from '../core/key';

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * A widget that delegates its build to a callback.
 * Useful for inline widget creation without subclassing StatelessWidget.
 */
export class Builder extends StatelessWidget {
  readonly builder: (context: BuildContext) => Widget;

  constructor(opts: {
    key?: Key;
    builder: (context: BuildContext) => Widget;
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.builder = opts.builder;
  }

  build(context: BuildContext): Widget {
    return this.builder(context);
  }
}

// ---------------------------------------------------------------------------
// LayoutBuilder
// ---------------------------------------------------------------------------

/**
 * Builds a widget tree that depends on the parent's constraints.
 *
 * Implementation approach (simplified from Flutter):
 * Uses a StatefulWidget that wraps a RenderLayoutBuilder.
 * The RenderLayoutBuilder stores constraints during performLayout
 * and triggers a rebuild so the builder callback can access them.
 *
 * For our simplified version, LayoutBuilder extends SingleChildRenderObjectWidget
 * and uses a RenderLayoutBuilder that calls the builder during layout.
 */
export class LayoutBuilder extends StatefulWidget {
  readonly builder: (context: BuildContext, constraints: BoxConstraints) => Widget;

  constructor(opts: {
    key?: Key;
    builder: (context: BuildContext, constraints: BoxConstraints) => Widget;
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.builder = opts.builder;
  }

  createState(): State<LayoutBuilder> {
    return new LayoutBuilderState();
  }
}

class LayoutBuilderState extends State<LayoutBuilder> {
  private _constraints: BoxConstraints = new BoxConstraints();

  /** Update constraints (called by RenderLayoutBuilder during layout). */
  updateConstraints(constraints: BoxConstraints): void {
    if (!this._constraints.equals(constraints)) {
      this._constraints = constraints;
      // Note: in a full framework, this would trigger a rebuild.
      // For now, constraints are stored for the next build() call.
    }
  }

  get currentConstraints(): BoxConstraints {
    return this._constraints;
  }

  build(context: BuildContext): Widget {
    return new _LayoutBuilderDelegate({
      builder: this.widget.builder,
      buildContext: context,
      state: this,
    });
  }
}

/**
 * Internal widget that wraps the RenderLayoutBuilder.
 * This delegates to SingleChildRenderObjectWidget so we get a RenderObject
 * that can access constraints during layout and call the builder.
 */
class _LayoutBuilderDelegate extends SingleChildRenderObjectWidget {
  readonly builder: (context: BuildContext, constraints: BoxConstraints) => Widget;
  readonly buildContext: BuildContext;
  readonly state: LayoutBuilderState;

  constructor(opts: {
    builder: (context: BuildContext, constraints: BoxConstraints) => Widget;
    buildContext: BuildContext;
    state: LayoutBuilderState;
  }) {
    super();
    this.builder = opts.builder;
    this.buildContext = opts.buildContext;
    this.state = opts.state;
  }

  createRenderObject(): RenderLayoutBuilder {
    return new RenderLayoutBuilder({
      callback: (constraints: BoxConstraints) => {
        this.state.updateConstraints(constraints);
      },
    });
  }

  updateRenderObject(renderObject: RenderLayoutBuilder): void {
    renderObject.callback = (constraints: BoxConstraints) => {
      this.state.updateConstraints(constraints);
    };
  }
}

// ---------------------------------------------------------------------------
// RenderLayoutBuilder
// ---------------------------------------------------------------------------

/**
 * A RenderBox that notifies its callback with constraints during layout,
 * allowing the widget tree above to rebuild with constraint knowledge.
 */
export class RenderLayoutBuilder extends RenderBox {
  callback: (constraints: BoxConstraints) => void;
  private _child: RenderBox | null = null;

  constructor(opts: { callback: (constraints: BoxConstraints) => void }) {
    super();
    this.callback = opts.callback;
  }

  get child(): RenderBox | null {
    return this._child;
  }

  set child(value: RenderBox | null) {
    if (this._child === value) return;
    if (this._child) this.dropChild(this._child);
    this._child = value;
    if (this._child) this.adoptChild(this._child);
  }

  override visitChildren(visitor: (child: RenderObject) => void): void {
    if (this._child) visitor(this._child);
  }

  performLayout(): void {
    const constraints = this.constraints!;

    // Notify callback with current constraints
    this.callback(constraints);

    if (this._child) {
      this._child.layout(constraints);
      this.size = constraints.constrain(this._child.size);
    } else {
      this.size = constraints.constrain(Size.zero);
    }
  }

  paint(context: PaintContext, offset: Offset): void {
    if (this._child) {
      this._child.paint(context, offset);
    }
  }
}
