// GridBorder widget — multi-pane bordered container
// Wraps RenderGridBorder in a MultiChildRenderObjectWidget.
// Amp ref: used by F0H (PromptBar) via GJH custom RenderObject
//
// Usage:
//   new GridBorder({
//     style: 'rounded',
//     borderColor: Color.rgb(128, 128, 128),
//     rightPaneWidth: 10,
//     children: [leftChild, rightChild1, rightChild2],
//   })

import { Key } from '../core/key';
import { Color } from '../core/color';
import { Widget } from '../framework/widget';
import { MultiChildRenderObjectWidget } from '../framework/render-object';
import { RenderGridBorder } from '../layout/render-grid-border';
import type { BoxDrawingStyle } from '../painting/border-painter';

/**
 * A multi-pane bordered container widget.
 *
 * Children interpretation:
 * - children[0]: left pane (fills remaining width)
 * - children[1..n]: right pane (stacked vertically with dividers)
 *
 * If only one child is provided, it fills the entire bordered area
 * (no right pane / vertical divider).
 *
 * Amp ref: GJH custom RenderObject used by F0H (PromptBar)
 */
export class GridBorder extends MultiChildRenderObjectWidget {
  readonly style: BoxDrawingStyle;
  readonly borderColor?: Color;
  readonly rightPaneWidth: number;
  readonly bannerMode: boolean;

  constructor(opts?: {
    key?: Key;
    children?: Widget[];
    style?: BoxDrawingStyle;
    borderColor?: Color;
    rightPaneWidth?: number;
    bannerMode?: boolean;
  }) {
    super({ key: opts?.key, children: opts?.children });
    this.style = opts?.style ?? 'rounded';
    this.borderColor = opts?.borderColor;
    this.rightPaneWidth = opts?.rightPaneWidth ?? 0;
    this.bannerMode = opts?.bannerMode ?? false;
  }

  createRenderObject(): RenderGridBorder {
    return new RenderGridBorder({
      style: this.style,
      borderColor: this.borderColor,
      rightPaneWidth: this.rightPaneWidth,
      bannerMode: this.bannerMode,
    });
  }

  updateRenderObject(renderObject: RenderGridBorder): void {
    renderObject.style = this.style;
    renderObject.borderColor = this.borderColor;
    renderObject.rightPaneWidth = this.rightPaneWidth;
    renderObject.bannerMode = this.bannerMode;
  }
}
