// Tests for Scrollbar widget and RenderScrollbar
// Verifies thumb/track rendering, scroll sync, layout, and edge cases

import { describe, test, expect } from 'bun:test';
import { Scrollbar, RenderScrollbar } from '../scrollbar';
import { ScrollController } from '../scroll-controller';
import { RenderBox, type PaintContext } from '../../framework/render-object';
import { Offset, Size } from '../../core/types';
import { BoxConstraints } from '../../core/box-constraints';
import { Color } from '../../core/color';

// Mock PaintContext that records drawChar calls
class MockPaintContext {
  drawn: Array<{ x: number; y: number; char: string; style?: any; width?: number }> = [];

  drawChar(x: number, y: number, char: string, style?: any, width?: number): void {
    this.drawn.push({ x, y, char, style, width });
  }
}

describe('Scrollbar widget', () => {
  test('creates with default options', () => {
    const scrollbar = new Scrollbar({});
    expect(scrollbar.thickness).toBe(1);
    expect(scrollbar.trackChar).toBe('\u2591');
    expect(scrollbar.thumbChar).toBe('\u2588');
    expect(scrollbar.showTrack).toBe(true);
    expect(scrollbar.controller).toBeUndefined();
    expect(scrollbar.thumbColor).toBeUndefined();
    expect(scrollbar.trackColor).toBeUndefined();
  });

  test('creates with custom options', () => {
    const ctrl = new ScrollController();
    const thumbColor = Color.green;
    const trackColor = Color.brightBlack;
    const scrollbar = new Scrollbar({
      controller: ctrl,
      thickness: 2,
      trackChar: '|',
      thumbChar: '#',
      showTrack: false,
      thumbColor,
      trackColor,
    });
    expect(scrollbar.controller).toBe(ctrl);
    expect(scrollbar.thickness).toBe(2);
    expect(scrollbar.trackChar).toBe('|');
    expect(scrollbar.thumbChar).toBe('#');
    expect(scrollbar.showTrack).toBe(false);
    expect(scrollbar.thumbColor).toBe(thumbColor);
    expect(scrollbar.trackColor).toBe(trackColor);
  });

  test('creates with getScrollInfo callback', () => {
    const getScrollInfo = () => ({
      totalContentHeight: 100,
      viewportHeight: 20,
      scrollOffset: 0,
    });
    const scrollbar = new Scrollbar({ getScrollInfo });
    expect(scrollbar.getScrollInfo).toBe(getScrollInfo);
  });

  test('createState returns a State', () => {
    const scrollbar = new Scrollbar({});
    const state = scrollbar.createState();
    expect(state).toBeDefined();
  });
});

describe('RenderScrollbar', () => {
  test('creates with default values', () => {
    const render = new RenderScrollbar();
    expect(render.thickness).toBe(1);
    expect(render.trackChar).toBe('\u2591');
    expect(render.thumbChar).toBe('\u2588');
    expect(render.showTrack).toBe(true);
    expect(render.scrollInfo).toBeUndefined();
  });

  test('layout sizes to thickness x max height', () => {
    const render = new RenderScrollbar();
    render.thickness = 1;

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 80,
      minHeight: 0,
      maxHeight: 24,
    });

    render.layout(constraints);

    expect(render.size.width).toBe(1);
    expect(render.size.height).toBe(24);
  });

  test('layout respects thickness', () => {
    const render = new RenderScrollbar();
    render.thickness = 2;

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 80,
      minHeight: 0,
      maxHeight: 30,
    });

    render.layout(constraints);

    expect(render.size.width).toBe(2);
    expect(render.size.height).toBe(30);
  });

  test('intrinsic width returns thickness', () => {
    const render = new RenderScrollbar();
    render.thickness = 3;
    expect(render.getMinIntrinsicWidth(100)).toBe(3);
    expect(render.getMaxIntrinsicWidth(100)).toBe(3);
  });

  test('computeThumbMetrics returns null when no scrollInfo', () => {
    const render = new RenderScrollbar();
    expect(render.computeThumbMetrics(20)).toBeNull();
  });

  test('computeThumbMetrics returns null when viewport is zero', () => {
    const render = new RenderScrollbar();
    render.scrollInfo = {
      totalContentHeight: 100,
      viewportHeight: 20,
      scrollOffset: 0,
    };
    expect(render.computeThumbMetrics(0)).toBeNull();
  });

  test('computeThumbMetrics returns null when content fits in viewport', () => {
    const render = new RenderScrollbar();
    render.scrollInfo = {
      totalContentHeight: 10,
      viewportHeight: 20,
      scrollOffset: 0,
    };
    expect(render.computeThumbMetrics(20)).toBeNull();
  });

  test('computeThumbMetrics calculates correct thumb for top position', () => {
    const render = new RenderScrollbar();
    render.scrollInfo = {
      totalContentHeight: 100,
      viewportHeight: 20,
      scrollOffset: 0,
    };

    const metrics = render.computeThumbMetrics(20);
    expect(metrics).not.toBeNull();
    expect(metrics!.thumbTop).toBe(0);
    // thumbHeight = max(1, round((20 / 100) * 20)) = max(1, 4) = 4
    expect(metrics!.thumbHeight).toBe(4);
  });

  test('computeThumbMetrics calculates correct thumb for middle position', () => {
    const render = new RenderScrollbar();
    render.scrollInfo = {
      totalContentHeight: 100,
      viewportHeight: 20,
      scrollOffset: 40, // 50% of (100-20)=80
    };

    const metrics = render.computeThumbMetrics(20);
    expect(metrics).not.toBeNull();
    // thumbHeight = 4
    // maxThumbTop = 20 - 4 = 16
    // scrollFraction = 40 / 80 = 0.5
    // thumbTop = round(0.5 * 16) = 8
    expect(metrics!.thumbHeight).toBe(4);
    expect(metrics!.thumbTop).toBe(8);
  });

  test('computeThumbMetrics calculates correct thumb for bottom position', () => {
    const render = new RenderScrollbar();
    render.scrollInfo = {
      totalContentHeight: 100,
      viewportHeight: 20,
      scrollOffset: 80, // 100% of (100-20)=80
    };

    const metrics = render.computeThumbMetrics(20);
    expect(metrics).not.toBeNull();
    // thumbHeight = 4
    // maxThumbTop = 16
    // scrollFraction = 80 / 80 = 1.0
    // thumbTop = round(1.0 * 16) = 16
    expect(metrics!.thumbHeight).toBe(4);
    expect(metrics!.thumbTop).toBe(16);
  });

  test('computeThumbMetrics ensures minimum thumb height of 1', () => {
    const render = new RenderScrollbar();
    render.scrollInfo = {
      totalContentHeight: 10000,
      viewportHeight: 5,
      scrollOffset: 0,
    };

    const metrics = render.computeThumbMetrics(5);
    expect(metrics).not.toBeNull();
    // thumbHeight = max(1, round((5 / 10000) * 5)) = max(1, 0) = 1
    expect(metrics!.thumbHeight).toBe(1);
  });

  test('paint draws track when showTrack is true', () => {
    const render = new RenderScrollbar();
    render.showTrack = true;
    render.trackChar = '|';

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 80,
      minHeight: 0,
      maxHeight: 5,
    });
    render.layout(constraints);

    const ctx = new MockPaintContext();
    render.paint(ctx as any, new Offset(10, 5));

    // Should have 5 track chars (height=5, width=1)
    const trackChars = ctx.drawn.filter((d) => d.char === '|');
    expect(trackChars.length).toBe(5);
    expect(trackChars[0]).toEqual({ x: 10, y: 5, char: '|', style: undefined, width: 1 });
    expect(trackChars[4]).toEqual({ x: 10, y: 9, char: '|', style: undefined, width: 1 });
  });

  test('paint does not draw track when showTrack is false', () => {
    const render = new RenderScrollbar();
    render.showTrack = false;
    render.trackChar = '|';

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 80,
      minHeight: 0,
      maxHeight: 5,
    });
    render.layout(constraints);

    const ctx = new MockPaintContext();
    render.paint(ctx as any, new Offset(0, 0));

    const trackChars = ctx.drawn.filter((d) => d.char === '|');
    expect(trackChars.length).toBe(0);
  });

  test('paint draws thumb at correct position', () => {
    const render = new RenderScrollbar();
    render.showTrack = true;
    render.trackChar = '.';
    render.thumbChar = '#';
    render.scrollInfo = {
      totalContentHeight: 100,
      viewportHeight: 20,
      scrollOffset: 0, // top
    };

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 80,
      minHeight: 0,
      maxHeight: 20,
    });
    render.layout(constraints);

    const ctx = new MockPaintContext();
    render.paint(ctx as any, new Offset(0, 0));

    const thumbChars = ctx.drawn.filter((d) => d.char === '#');
    // thumbHeight = max(1, round((20/100) * 20)) = 4
    expect(thumbChars.length).toBe(4);
    // Thumb should start at row 0 (scrollOffset = 0)
    expect(thumbChars[0].y).toBe(0);
    expect(thumbChars[3].y).toBe(3);
  });

  test('paint draws thumb at bottom when scrolled to end', () => {
    const render = new RenderScrollbar();
    render.showTrack = false;
    render.thumbChar = '#';
    render.scrollInfo = {
      totalContentHeight: 100,
      viewportHeight: 20,
      scrollOffset: 80, // bottom (100 - 20)
    };

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 80,
      minHeight: 0,
      maxHeight: 20,
    });
    render.layout(constraints);

    const ctx = new MockPaintContext();
    render.paint(ctx as any, new Offset(0, 0));

    const thumbChars = ctx.drawn.filter((d) => d.char === '#');
    // thumbHeight = 4, maxThumbTop = 16
    expect(thumbChars.length).toBe(4);
    expect(thumbChars[0].y).toBe(16);
    expect(thumbChars[3].y).toBe(19);
  });

  test('paint applies thumb color', () => {
    const render = new RenderScrollbar();
    render.showTrack = false;
    render.thumbChar = '#';
    render.thumbColor = Color.green;
    render.scrollInfo = {
      totalContentHeight: 100,
      viewportHeight: 10,
      scrollOffset: 0,
    };

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 80,
      minHeight: 0,
      maxHeight: 10,
    });
    render.layout(constraints);

    const ctx = new MockPaintContext();
    render.paint(ctx as any, new Offset(0, 0));

    const thumbChars = ctx.drawn.filter((d) => d.char === '#');
    expect(thumbChars.length).toBeGreaterThan(0);
    expect(thumbChars[0].style).toEqual({ fg: Color.green });
  });

  test('paint applies track color', () => {
    const render = new RenderScrollbar();
    render.showTrack = true;
    render.trackChar = '.';
    render.trackColor = Color.brightBlack;

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 80,
      minHeight: 0,
      maxHeight: 3,
    });
    render.layout(constraints);

    const ctx = new MockPaintContext();
    render.paint(ctx as any, new Offset(0, 0));

    const trackChars = ctx.drawn.filter((d) => d.char === '.');
    expect(trackChars.length).toBe(3);
    expect(trackChars[0].style).toEqual({ fg: Color.brightBlack });
  });

  test('paint does nothing with non-PaintContext', () => {
    const render = new RenderScrollbar();
    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 80,
      minHeight: 0,
      maxHeight: 10,
    });
    render.layout(constraints);

    // Should not throw with a plain object that has no drawChar
    render.paint({} as any, Offset.zero);
  });

  test('paint with thickness 2 draws two columns', () => {
    const render = new RenderScrollbar();
    render.showTrack = true;
    render.trackChar = '.';
    render.thickness = 2;

    const constraints = new BoxConstraints({
      minWidth: 0,
      maxWidth: 80,
      minHeight: 0,
      maxHeight: 3,
    });
    render.layout(constraints);

    const ctx = new MockPaintContext();
    render.paint(ctx as any, new Offset(5, 0));

    const trackChars = ctx.drawn.filter((d) => d.char === '.');
    // 3 rows x 2 cols = 6
    expect(trackChars.length).toBe(6);
    // Check both columns are drawn
    const xValues = new Set(trackChars.map((d) => d.x));
    expect(xValues.has(5)).toBe(true);
    expect(xValues.has(6)).toBe(true);
  });

  test('computeThumbMetrics with zero viewportHeight in scrollInfo uses render height', () => {
    const render = new RenderScrollbar();
    // Simulates controller-derived scrollInfo where viewportHeight is 0
    render.scrollInfo = {
      totalContentHeight: 81, // maxScrollExtent(80) + 1 approximation
      viewportHeight: 0,
      scrollOffset: 0,
    };

    // The render height is 20
    const metrics = render.computeThumbMetrics(20);
    expect(metrics).not.toBeNull();
    // After adjustment: totalContentHeight = 81 - 1 + 20 = 100
    // thumbHeight = max(1, round((20 / 100) * 20)) = 4
    expect(metrics!.thumbHeight).toBe(4);
    expect(metrics!.thumbTop).toBe(0);
  });
});
