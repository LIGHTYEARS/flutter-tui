import { Key } from '../core/key';
import { Widget } from '../framework/widget';
import { MultiChildRenderObjectWidget, type RenderObject } from '../framework/render-object';
import { RenderStickyHeader } from '../layout/render-sticky-header';

/**
 * A widget that displays a header above a body, pinning the header to the
 * viewport top when it scrolls out of view. When the entire StickyHeader
 * area is about to leave the viewport, the next sticky header pushes
 * the current one away.
 *
 * Uses MultiChildRenderObjectWidget with children = [header, body].
 */
export class StickyHeader extends MultiChildRenderObjectWidget {
  readonly header: Widget;
  readonly body: Widget;

  constructor(opts: { key?: Key; header: Widget; body: Widget }) {
    super({ key: opts.key, children: [opts.header, opts.body] });
    this.header = opts.header;
    this.body = opts.body;
  }

  createRenderObject(): RenderStickyHeader {
    return new RenderStickyHeader();
  }

  updateRenderObject(_renderObject: RenderObject): void {}
}
