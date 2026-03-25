// Scrollbar widget — StatefulWidget that renders a vertical scrollbar synced to a ScrollController
// Amp ref: ia class — leaf render object for scrollbar rendering
// Typically placed in a Row alongside an Expanded ScrollView

import {
  Widget,
  StatefulWidget,
  State,
  type BuildContext,
} from '../framework/widget';
import {
  LeafRenderObjectWidget,
  RenderBox,
  type PaintContext,
} from '../framework/render-object';
import { BoxConstraints } from '../core/box-constraints';
import { Offset, Size } from '../core/types';
import { Color } from '../core/color';
import { ScrollController } from './scroll-controller';
import { Key } from '../core/key';

/** Unicode lower-block elements for 1/8 character precision scrollbar rendering (amp ref: ia class). */
const BLOCK_ELEMENTS = [' ', '\u2581', '\u2582', '\u2583', '\u2584', '\u2585', '\u2586', '\u2587', '\u2588'];

// ---------------------------------------------------------------------------
// ScrollInfo — describes current scroll state for rendering the scrollbar
// ---------------------------------------------------------------------------

/**
 * Provides the scroll state information needed to render the scrollbar thumb.
 */
export interface ScrollInfo {
  totalContentHeight: number;
  viewportHeight: number;
  scrollOffset: number;
}

// ---------------------------------------------------------------------------
// Scrollbar (Amp: ia)
// ---------------------------------------------------------------------------

/**
 * A StatefulWidget that renders a vertical scrollbar synced to a ScrollController.
 *
 * The scrollbar renders as a column of characters:
 * - Track: filled with trackChar (default '░') for the full height
 * - Thumb: filled with thumbChar (default '█') at the scroll position
 *
 * The thumb position and height are calculated from the scroll state:
 * - Thumb position = (scrollOffset / totalContentHeight) * viewportHeight
 * - Thumb height = max(1, (viewportHeight / totalContentHeight) * viewportHeight)
 *
 * Usage:
 *   new Row({ children: [
 *     new Expanded({ child: new SingleChildScrollView({ controller, child }) }),
 *     new Scrollbar({ controller }),
 *   ]})
 *
 * Amp ref: ia class
 */
export class Scrollbar extends StatefulWidget {
  readonly controller?: ScrollController;
  readonly getScrollInfo?: () => ScrollInfo;
  readonly thickness: number;
  readonly trackChar: string;
  readonly thumbChar: string;
  readonly showTrack: boolean;
  readonly thumbColor?: Color;
  readonly trackColor?: Color;
  readonly subCharacterPrecision: boolean;

  constructor(opts: {
    key?: Key;
    controller?: ScrollController;
    getScrollInfo?: () => ScrollInfo;
    thickness?: number;
    trackChar?: string;
    thumbChar?: string;
    showTrack?: boolean;
    thumbColor?: Color;
    trackColor?: Color;
    subCharacterPrecision?: boolean;
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.controller = opts.controller;
    this.getScrollInfo = opts.getScrollInfo;
    this.thickness = opts.thickness ?? 1;
    this.trackChar = opts.trackChar ?? '\u2591'; // ░ light shade
    this.thumbChar = opts.thumbChar ?? '\u2588'; // █ full block
    this.showTrack = opts.showTrack ?? true;
    this.thumbColor = opts.thumbColor;
    this.trackColor = opts.trackColor;
    this.subCharacterPrecision = opts.subCharacterPrecision ?? true;
  }

  createState(): State<Scrollbar> {
    return new ScrollbarState();
  }
}

// ---------------------------------------------------------------------------
// ScrollbarState
// ---------------------------------------------------------------------------

/**
 * State for Scrollbar. Manages the ScrollController listener lifecycle
 * and builds the underlying _ScrollbarRender leaf widget.
 */
class ScrollbarState extends State<Scrollbar> {
  private _onScrollChanged = (): void => {
    if (this.mounted) {
      this.setState();
    }
  };

  initState(): void {
    super.initState();
    this.widget.controller?.addListener(this._onScrollChanged);
  }

  didUpdateWidget(oldWidget: Scrollbar): void {
    if (oldWidget.controller !== this.widget.controller) {
      oldWidget.controller?.removeListener(this._onScrollChanged);
      this.widget.controller?.addListener(this._onScrollChanged);
    }
  }

  dispose(): void {
    this.widget.controller?.removeListener(this._onScrollChanged);
    super.dispose();
  }

  build(_context: BuildContext): Widget {
    // Compute scroll info from controller or getScrollInfo callback
    let scrollInfo: ScrollInfo | undefined;

    if (this.widget.getScrollInfo) {
      scrollInfo = this.widget.getScrollInfo();
    } else if (this.widget.controller) {
      const ctrl = this.widget.controller;
      // Derive exact scroll info from controller state.
      // ScrollController tracks viewportSize (set by RenderScrollViewport during layout)
      // and maxScrollExtent = totalContentHeight - viewportHeight.
      const vpSize = ctrl.viewportSize;
      scrollInfo = {
        totalContentHeight: vpSize > 0
          ? ctrl.maxScrollExtent + vpSize
          : 0,
        viewportHeight: vpSize,
        scrollOffset: ctrl.offset,
      };
    }

    return new _ScrollbarRender({
      scrollInfo,
      thickness: this.widget.thickness,
      trackChar: this.widget.trackChar,
      thumbChar: this.widget.thumbChar,
      showTrack: this.widget.showTrack,
      thumbColor: this.widget.thumbColor,
      trackColor: this.widget.trackColor,
      subCharacterPrecision: this.widget.subCharacterPrecision,
    });
  }
}

// ---------------------------------------------------------------------------
// _ScrollbarRender (LeafRenderObjectWidget)
// ---------------------------------------------------------------------------

class _ScrollbarRender extends LeafRenderObjectWidget {
  readonly scrollInfo?: ScrollInfo;
  readonly thickness: number;
  readonly trackChar: string;
  readonly thumbChar: string;
  readonly showTrack: boolean;
  readonly thumbColor?: Color;
  readonly trackColor?: Color;
  readonly subCharacterPrecision: boolean;

  constructor(opts: {
    scrollInfo?: ScrollInfo;
    thickness: number;
    trackChar: string;
    thumbChar: string;
    showTrack: boolean;
    thumbColor?: Color;
    trackColor?: Color;
    subCharacterPrecision: boolean;
  }) {
    super();
    this.scrollInfo = opts.scrollInfo;
    this.thickness = opts.thickness;
    this.trackChar = opts.trackChar;
    this.thumbChar = opts.thumbChar;
    this.showTrack = opts.showTrack;
    this.thumbColor = opts.thumbColor;
    this.trackColor = opts.trackColor;
    this.subCharacterPrecision = opts.subCharacterPrecision;
  }

  createRenderObject(): RenderScrollbar {
    return new RenderScrollbar(
      this.scrollInfo,
      this.thickness,
      this.trackChar,
      this.thumbChar,
      this.showTrack,
      this.thumbColor,
      this.trackColor,
      this.subCharacterPrecision,
    );
  }

  updateRenderObject(renderObject: any): void {
    const r = renderObject as RenderScrollbar;
    r.scrollInfo = this.scrollInfo;
    r.thickness = this.thickness;
    r.trackChar = this.trackChar;
    r.thumbChar = this.thumbChar;
    r.showTrack = this.showTrack;
    r.thumbColor = this.thumbColor;
    r.trackColor = this.trackColor;
    r.subCharacterPrecision = this.subCharacterPrecision;
    r.markNeedsPaint();
  }
}

// ---------------------------------------------------------------------------
// RenderScrollbar — leaf render object that paints thumb + track
// ---------------------------------------------------------------------------

/**
 * A leaf RenderBox that paints a vertical scrollbar.
 *
 * Layout: Takes thickness as width, fills available height from constraints.
 * Paint: Draws track characters for full height, then overlays thumb characters
 *        at the computed position.
 *
 * Amp ref: ia class render object
 */
export class RenderScrollbar extends RenderBox {
  scrollInfo?: ScrollInfo;
  thickness: number;
  trackChar: string;
  thumbChar: string;
  showTrack: boolean;
  thumbColor?: Color;
  trackColor?: Color;
  subCharacterPrecision: boolean;

  constructor(
    scrollInfo?: ScrollInfo,
    thickness: number = 1,
    trackChar: string = '\u2591',
    thumbChar: string = '\u2588',
    showTrack: boolean = true,
    thumbColor?: Color,
    trackColor?: Color,
    subCharacterPrecision: boolean = true,
  ) {
    super();
    this.scrollInfo = scrollInfo;
    this.thickness = thickness;
    this.trackChar = trackChar;
    this.thumbChar = thumbChar;
    this.showTrack = showTrack;
    this.thumbColor = thumbColor;
    this.trackColor = trackColor;
    this.subCharacterPrecision = subCharacterPrecision;
  }

  /**
   * Layout: width = thickness, height = max available height.
   * The scrollbar always wants to fill the available height.
   */
  performLayout(): void {
    const constraints = this.constraints!;
    const width = Math.max(constraints.minWidth, Math.min(this.thickness, constraints.maxWidth));
    const height = constraints.maxHeight;
    this.size = new Size(width, height);
  }

  /**
   * Returns the intrinsic width = thickness.
   */
  getMinIntrinsicWidth(_height: number): number {
    return this.thickness;
  }

  getMaxIntrinsicWidth(_height: number): number {
    return this.thickness;
  }

  /**
   * Compute thumb position and height from scroll info.
   * Returns { thumbTop, thumbHeight } in rows relative to the scrollbar.
   */
  computeThumbMetrics(viewportHeight: number): { thumbTop: number; thumbHeight: number } | null {
    if (!this.scrollInfo || viewportHeight <= 0) return null;

    const totalContentHeight = this.scrollInfo.totalContentHeight;
    const vpHeight = this.scrollInfo.viewportHeight > 0
      ? this.scrollInfo.viewportHeight
      : viewportHeight;
    const scrollOffset = this.scrollInfo.scrollOffset;

    // Recompute totalContentHeight when viewportHeight was not originally provided
    const effectiveTotalContent = this.scrollInfo.viewportHeight > 0
      ? totalContentHeight
      : (totalContentHeight > 0 ? totalContentHeight - 1 + vpHeight : 0);

    if (effectiveTotalContent <= 0 || effectiveTotalContent <= vpHeight) {
      // No scrollbar needed (content fits in viewport)
      return null;
    }

    const thumbHeight = Math.max(1, Math.round((vpHeight / effectiveTotalContent) * viewportHeight));
    const maxThumbTop = viewportHeight - thumbHeight;
    const scrollFraction = scrollOffset / (effectiveTotalContent - vpHeight);
    const thumbTop = Math.round(Math.max(0, Math.min(scrollFraction * maxThumbTop, maxThumbTop)));

    return { thumbTop, thumbHeight };
  }

  /**
   * Paint the scrollbar: track + thumb.
   * When subCharacterPrecision is enabled, uses Unicode block elements
   * for 1/8th character precision rendering.
   */
  paint(context: PaintContext, offset: Offset): void {
    const ctx = context as any;
    if (typeof ctx.drawChar !== 'function') return;

    const height = this.size.height;
    const width = this.size.width;

    // Build track and thumb styles
    const trackStyle: any = {};
    const thumbStyle: any = {};
    if (this.trackColor) trackStyle.fg = this.trackColor;
    if (this.thumbColor) thumbStyle.fg = this.thumbColor;

    // Draw track
    if (this.showTrack) {
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          ctx.drawChar(
            offset.col + col,
            offset.row + row,
            this.trackChar,
            this.trackColor ? trackStyle : undefined,
            1,
          );
        }
      }
    }

    if (this.subCharacterPrecision) {
      // Sub-character precision rendering using BLOCK_ELEMENTS
      // Unicode lower block elements (\u2581-\u2588) fill from the BOTTOM of the cell upward.
      //
      // For each character row we determine the overlap with the thumb region:
      //   - Fully covered → full block (█) in thumb color
      //   - Top edge (thumb starts mid-row, covers bottom portion) → lower block in thumb fg
      //   - Bottom edge (thumb covers top portion, stops mid-row) → invert: lower block
      //     representing the UNCOVERED bottom gap drawn with track fg + thumb bg
      //   - No overlap → track char already drawn, skip

      if (!this.scrollInfo || height <= 0) return;

      const totalContentHeight = this.scrollInfo.totalContentHeight;
      const vpHeight = this.scrollInfo.viewportHeight > 0
        ? this.scrollInfo.viewportHeight
        : height;

      // Recompute totalContentHeight when viewportHeight was not originally provided
      const effectiveTotalContent = this.scrollInfo.viewportHeight > 0
        ? totalContentHeight
        : (totalContentHeight > 0 ? totalContentHeight - 1 + vpHeight : 0);
      const scrollOffset = this.scrollInfo.scrollOffset;

      if (effectiveTotalContent <= 0 || effectiveTotalContent <= vpHeight) return;

      const scrollRatio = vpHeight / effectiveTotalContent;
      const maxScrollOffset = effectiveTotalContent - vpHeight;
      const scrollPositionRatio = maxScrollOffset > 0 ? scrollOffset / maxScrollOffset : 0;

      const totalEighths = height * 8;
      // Use Math.floor for thumb size to avoid ±1 jitter across scroll positions
      const thumbEighths = Math.max(8, Math.floor(scrollRatio * totalEighths));
      const maxThumbTopEighths = totalEighths - thumbEighths;
      // Use Math.floor for position to keep it monotonically stable
      const thumbTopEighths = Math.floor(Math.max(0, Math.min(scrollPositionRatio * maxThumbTopEighths, maxThumbTopEighths)));
      const thumbBottomEighths = thumbTopEighths + thumbEighths;

      for (let row = 0; row < height; row++) {
        const rowTopEighths = row * 8;
        const rowBottomEighths = rowTopEighths + 8;

        // Calculate how many eighths of this row are covered by the thumb
        const overlapStart = Math.max(rowTopEighths, thumbTopEighths);
        const overlapEnd = Math.min(rowBottomEighths, thumbBottomEighths);
        const coveredEighths = Math.max(0, overlapEnd - overlapStart);

        if (coveredEighths <= 0) {
          // No overlap — track char already drawn
          continue;
        }

        for (let col = 0; col < width; col++) {
          if (coveredEighths >= 8) {
            // Fully covered by thumb — full block in thumb color
            const style: any = {};
            if (this.thumbColor) { style.fg = this.thumbColor; style.bg = this.thumbColor; }
            ctx.drawChar(
              offset.col + col,
              offset.row + row,
              BLOCK_ELEMENTS[8], // █
              (this.thumbColor) ? style : undefined,
              1,
            );
          } else if (overlapStart > rowTopEighths) {
            // Top edge of thumb: thumb starts mid-row, covers bottom portion.
            // Lower block element fills from bottom in fg color — matches thumb.
            // bg must be set to track color so the UNCOVERED top portion of
            // the cell matches the track appearance instead of showing terminal default.
            const style: any = {};
            if (this.thumbColor) style.fg = this.thumbColor;
            if (this.trackColor) style.bg = this.trackColor;
            if (!this.thumbColor && !this.trackColor) style.inverse = true;
            ctx.drawChar(
              offset.col + col,
              offset.row + row,
              BLOCK_ELEMENTS[coveredEighths],
              style,
              1,
            );
          } else {
            // Bottom edge of thumb: thumb covers top portion, stops mid-row.
            // Lower block elements only fill from bottom, so we invert the approach:
            // draw the UNCOVERED bottom gap as a lower block in track fg color,
            // with thumb color as bg for the covered top portion.
            const gapEighths = 8 - coveredEighths;
            const style: any = {};
            if (this.trackColor) style.fg = this.trackColor;
            if (this.thumbColor) style.bg = this.thumbColor;
            if (!this.trackColor && !this.thumbColor) style.inverse = true;
            ctx.drawChar(
              offset.col + col,
              offset.row + row,
              BLOCK_ELEMENTS[gapEighths],
              style,
              1,
            );
          }
        }
      }
    } else {
      // Standard whole-character rendering
      const metrics = this.computeThumbMetrics(height);
      if (metrics) {
        const { thumbTop, thumbHeight } = metrics;
        for (let row = thumbTop; row < thumbTop + thumbHeight && row < height; row++) {
          for (let col = 0; col < width; col++) {
            ctx.drawChar(
              offset.col + col,
              offset.row + row,
              this.thumbChar,
              this.thumbColor ? thumbStyle : undefined,
              1,
            );
          }
        }
      }
    }
  }
}
