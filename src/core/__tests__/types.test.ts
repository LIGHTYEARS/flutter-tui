import { describe, expect, it } from 'bun:test';
import { Offset, Size, Rect } from '../types';

// ============================================================
// Offset
// ============================================================
describe('Offset', () => {
  it('creates with integer-rounded col and row', () => {
    const o = new Offset(3, 7);
    expect(o.col).toBe(3);
    expect(o.row).toBe(7);
  });

  it('rounds fractional values to integers', () => {
    const o = new Offset(3.7, 7.2);
    expect(o.col).toBe(4);
    expect(o.row).toBe(7);
  });

  it('rounds .5 up (Math.round)', () => {
    const o = new Offset(2.5, 3.5);
    expect(o.col).toBe(3);
    expect(o.row).toBe(4);
  });

  it('Offset.zero is (0, 0)', () => {
    expect(Offset.zero.col).toBe(0);
    expect(Offset.zero.row).toBe(0);
  });

  it('add returns new Offset with summed components', () => {
    const a = new Offset(1, 2);
    const b = new Offset(3, 4);
    const result = a.add(b);
    expect(result.col).toBe(4);
    expect(result.row).toBe(6);
  });

  it('subtract returns new Offset with difference', () => {
    const a = new Offset(5, 10);
    const b = new Offset(2, 3);
    const result = a.subtract(b);
    expect(result.col).toBe(3);
    expect(result.row).toBe(7);
  });

  it('add and subtract produce integer results', () => {
    // Even though add/subtract use Offset constructor which rounds
    const a = new Offset(1, 2);
    const b = new Offset(3, 4);
    const sum = a.add(b);
    expect(Number.isInteger(sum.col)).toBe(true);
    expect(Number.isInteger(sum.row)).toBe(true);
  });

  it('equals returns true for same values', () => {
    const a = new Offset(5, 10);
    const b = new Offset(5, 10);
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false for different values', () => {
    const a = new Offset(5, 10);
    expect(a.equals(new Offset(5, 11))).toBe(false);
    expect(a.equals(new Offset(6, 10))).toBe(false);
  });

  it('toString returns formatted string', () => {
    expect(new Offset(3, 7).toString()).toBe('Offset(3, 7)');
  });

  it('handles negative coordinates', () => {
    const o = new Offset(-3, -7);
    expect(o.col).toBe(-3);
    expect(o.row).toBe(-7);
  });
});

// ============================================================
// Size
// ============================================================
describe('Size', () => {
  it('creates with integer-rounded width and height', () => {
    const s = new Size(80, 24);
    expect(s.width).toBe(80);
    expect(s.height).toBe(24);
  });

  it('rounds fractional values', () => {
    const s = new Size(79.6, 23.4);
    expect(s.width).toBe(80);
    expect(s.height).toBe(23);
  });

  it('Size.zero is (0, 0)', () => {
    expect(Size.zero.width).toBe(0);
    expect(Size.zero.height).toBe(0);
  });

  it('contains returns true for offsets within bounds', () => {
    const s = new Size(10, 5);
    expect(s.contains(new Offset(0, 0))).toBe(true);
    expect(s.contains(new Offset(9, 4))).toBe(true);
    expect(s.contains(new Offset(5, 2))).toBe(true);
  });

  it('contains returns false for offsets at or beyond boundaries', () => {
    const s = new Size(10, 5);
    // At boundary (exclusive upper bound)
    expect(s.contains(new Offset(10, 0))).toBe(false);
    expect(s.contains(new Offset(0, 5))).toBe(false);
    expect(s.contains(new Offset(10, 5))).toBe(false);
  });

  it('contains returns false for negative offsets', () => {
    const s = new Size(10, 5);
    expect(s.contains(new Offset(-1, 0))).toBe(false);
    expect(s.contains(new Offset(0, -1))).toBe(false);
  });

  it('contains returns false for zero-size', () => {
    expect(Size.zero.contains(new Offset(0, 0))).toBe(false);
  });

  it('equals returns true for same dimensions', () => {
    expect(new Size(10, 20).equals(new Size(10, 20))).toBe(true);
  });

  it('equals returns false for different dimensions', () => {
    expect(new Size(10, 20).equals(new Size(10, 21))).toBe(false);
    expect(new Size(10, 20).equals(new Size(11, 20))).toBe(false);
  });

  it('toString returns formatted string', () => {
    expect(new Size(80, 24).toString()).toBe('Size(80, 24)');
  });
});

// ============================================================
// Rect
// ============================================================
describe('Rect', () => {
  it('creates with integer-rounded values', () => {
    const r = new Rect(1, 2, 10, 20);
    expect(r.left).toBe(1);
    expect(r.top).toBe(2);
    expect(r.width).toBe(10);
    expect(r.height).toBe(20);
  });

  it('rounds fractional values', () => {
    const r = new Rect(1.3, 2.7, 9.5, 19.5);
    expect(r.left).toBe(1);
    expect(r.top).toBe(3);
    expect(r.width).toBe(10);
    expect(r.height).toBe(20);
  });

  it('Rect.zero is all zeros', () => {
    const r = Rect.zero;
    expect(r.left).toBe(0);
    expect(r.top).toBe(0);
    expect(r.width).toBe(0);
    expect(r.height).toBe(0);
  });

  it('fromLTRB creates rect from left/top/right/bottom', () => {
    const r = Rect.fromLTRB(5, 10, 25, 30);
    expect(r.left).toBe(5);
    expect(r.top).toBe(10);
    expect(r.width).toBe(20);
    expect(r.height).toBe(20);
  });

  it('right and bottom getters', () => {
    const r = new Rect(5, 10, 20, 15);
    expect(r.right).toBe(25);
    expect(r.bottom).toBe(25);
  });

  it('size getter returns Size', () => {
    const r = new Rect(5, 10, 20, 15);
    const s = r.size;
    expect(s.width).toBe(20);
    expect(s.height).toBe(15);
  });

  it('topLeft returns Offset at (left, top)', () => {
    const r = new Rect(5, 10, 20, 15);
    const tl = r.topLeft;
    expect(tl.col).toBe(5);
    expect(tl.row).toBe(10);
  });

  it('bottomRight returns Offset at (right, bottom)', () => {
    const r = new Rect(5, 10, 20, 15);
    const br = r.bottomRight;
    expect(br.col).toBe(25);
    expect(br.row).toBe(25);
  });

  it('contains returns true for offsets inside rect', () => {
    const r = new Rect(5, 10, 20, 15);
    expect(r.contains(new Offset(5, 10))).toBe(true);
    expect(r.contains(new Offset(24, 24))).toBe(true);
    expect(r.contains(new Offset(15, 17))).toBe(true);
  });

  it('contains returns false for offsets outside rect', () => {
    const r = new Rect(5, 10, 20, 15);
    // At boundary (exclusive)
    expect(r.contains(new Offset(25, 10))).toBe(false);
    expect(r.contains(new Offset(5, 25))).toBe(false);
    // Before
    expect(r.contains(new Offset(4, 10))).toBe(false);
    expect(r.contains(new Offset(5, 9))).toBe(false);
  });

  it('intersect returns overlap of two rects', () => {
    const a = new Rect(0, 0, 10, 10);
    const b = new Rect(5, 5, 10, 10);
    const i = a.intersect(b);
    expect(i.left).toBe(5);
    expect(i.top).toBe(5);
    expect(i.width).toBe(5);
    expect(i.height).toBe(5);
  });

  it('intersect returns zero-area rect when no overlap', () => {
    const a = new Rect(0, 0, 5, 5);
    const b = new Rect(10, 10, 5, 5);
    const i = a.intersect(b);
    expect(i.width).toBe(0);
    expect(i.height).toBe(0);
  });

  it('intersect handles adjacent rects (touching edges)', () => {
    const a = new Rect(0, 0, 10, 10);
    const b = new Rect(10, 0, 10, 10);
    const i = a.intersect(b);
    expect(i.width).toBe(0);
    expect(i.height).toBe(0);
  });

  it('intersect with containment returns inner rect', () => {
    const outer = new Rect(0, 0, 20, 20);
    const inner = new Rect(5, 5, 5, 5);
    const i = outer.intersect(inner);
    expect(i.equals(inner)).toBe(true);
  });

  it('equals returns true for same rect', () => {
    expect(new Rect(1, 2, 3, 4).equals(new Rect(1, 2, 3, 4))).toBe(true);
  });

  it('equals returns false for different rect', () => {
    const r = new Rect(1, 2, 3, 4);
    expect(r.equals(new Rect(0, 2, 3, 4))).toBe(false);
    expect(r.equals(new Rect(1, 0, 3, 4))).toBe(false);
    expect(r.equals(new Rect(1, 2, 0, 4))).toBe(false);
    expect(r.equals(new Rect(1, 2, 3, 0))).toBe(false);
  });

  it('toString returns formatted string', () => {
    expect(new Rect(1, 2, 10, 20).toString()).toBe('Rect(1, 2, 10, 20)');
  });
});
