// Tests for EdgeInsets
// Covers: all(), symmetric(), horizontal(), vertical(), only(),
//         totalHorizontal/totalVertical getters, equals(), toString()

import { describe, expect, test } from 'bun:test';
import { EdgeInsets } from '../edge-insets';

describe('EdgeInsets', () => {
  describe('constructor', () => {
    test('stores all four edge values', () => {
      const e = new EdgeInsets(1, 2, 3, 4);
      expect(e.left).toBe(1);
      expect(e.top).toBe(2);
      expect(e.right).toBe(3);
      expect(e.bottom).toBe(4);
    });

    test('rounds values to integers', () => {
      const e = new EdgeInsets(1.4, 2.6, 3.5, 4.1);
      expect(e.left).toBe(1);
      expect(e.top).toBe(3);
      expect(e.right).toBe(4);
      expect(e.bottom).toBe(4);
    });
  });

  describe('zero', () => {
    test('EdgeInsets.zero has all zeros', () => {
      expect(EdgeInsets.zero.left).toBe(0);
      expect(EdgeInsets.zero.top).toBe(0);
      expect(EdgeInsets.zero.right).toBe(0);
      expect(EdgeInsets.zero.bottom).toBe(0);
    });
  });

  describe('all()', () => {
    test('sets all four edges to the same value', () => {
      const e = EdgeInsets.all(8);
      expect(e.left).toBe(8);
      expect(e.top).toBe(8);
      expect(e.right).toBe(8);
      expect(e.bottom).toBe(8);
    });

    test('all(0) equals zero', () => {
      expect(EdgeInsets.all(0).equals(EdgeInsets.zero)).toBe(true);
    });
  });

  describe('symmetric()', () => {
    test('symmetric with horizontal and vertical', () => {
      const e = EdgeInsets.symmetric({ horizontal: 10, vertical: 5 });
      expect(e.left).toBe(10);
      expect(e.right).toBe(10);
      expect(e.top).toBe(5);
      expect(e.bottom).toBe(5);
    });

    test('symmetric with only horizontal', () => {
      const e = EdgeInsets.symmetric({ horizontal: 10 });
      expect(e.left).toBe(10);
      expect(e.right).toBe(10);
      expect(e.top).toBe(0);
      expect(e.bottom).toBe(0);
    });

    test('symmetric with only vertical', () => {
      const e = EdgeInsets.symmetric({ vertical: 5 });
      expect(e.left).toBe(0);
      expect(e.right).toBe(0);
      expect(e.top).toBe(5);
      expect(e.bottom).toBe(5);
    });

    test('symmetric with no args defaults to zero', () => {
      const e = EdgeInsets.symmetric();
      expect(e.equals(EdgeInsets.zero)).toBe(true);
    });
  });

  describe('horizontal()', () => {
    test('sets left and right, top and bottom are 0', () => {
      const e = EdgeInsets.horizontal(12);
      expect(e.left).toBe(12);
      expect(e.right).toBe(12);
      expect(e.top).toBe(0);
      expect(e.bottom).toBe(0);
    });
  });

  describe('vertical()', () => {
    test('sets top and bottom, left and right are 0', () => {
      const e = EdgeInsets.vertical(7);
      expect(e.left).toBe(0);
      expect(e.right).toBe(0);
      expect(e.top).toBe(7);
      expect(e.bottom).toBe(7);
    });
  });

  describe('only()', () => {
    test('sets specified edges, others default to 0', () => {
      const e = EdgeInsets.only({ left: 10, bottom: 5 });
      expect(e.left).toBe(10);
      expect(e.top).toBe(0);
      expect(e.right).toBe(0);
      expect(e.bottom).toBe(5);
    });

    test('all edges specified', () => {
      const e = EdgeInsets.only({ left: 1, top: 2, right: 3, bottom: 4 });
      expect(e.left).toBe(1);
      expect(e.top).toBe(2);
      expect(e.right).toBe(3);
      expect(e.bottom).toBe(4);
    });

    test('no args defaults to zero', () => {
      const e = EdgeInsets.only();
      expect(e.equals(EdgeInsets.zero)).toBe(true);
    });
  });

  describe('totalHorizontal / totalVertical', () => {
    test('totalHorizontal returns left + right', () => {
      const e = new EdgeInsets(3, 5, 7, 11);
      expect(e.totalHorizontal).toBe(10);
    });

    test('totalVertical returns top + bottom', () => {
      const e = new EdgeInsets(3, 5, 7, 11);
      expect(e.totalVertical).toBe(16);
    });

    test('zero insets have zero totals', () => {
      expect(EdgeInsets.zero.totalHorizontal).toBe(0);
      expect(EdgeInsets.zero.totalVertical).toBe(0);
    });
  });

  describe('equals()', () => {
    test('equal insets', () => {
      const a = new EdgeInsets(1, 2, 3, 4);
      const b = new EdgeInsets(1, 2, 3, 4);
      expect(a.equals(b)).toBe(true);
    });

    test('unequal insets', () => {
      const a = new EdgeInsets(1, 2, 3, 4);
      const b = new EdgeInsets(1, 2, 3, 5);
      expect(a.equals(b)).toBe(false);
    });

    test('zero equals zero', () => {
      expect(EdgeInsets.zero.equals(new EdgeInsets(0, 0, 0, 0))).toBe(true);
    });
  });

  describe('toString()', () => {
    test('all-same value uses all() format', () => {
      expect(EdgeInsets.all(8).toString()).toBe('EdgeInsets.all(8)');
    });

    test('symmetric value uses symmetric() format', () => {
      expect(EdgeInsets.symmetric({ horizontal: 10, vertical: 5 }).toString())
        .toBe('EdgeInsets.symmetric(h: 10, v: 5)');
    });

    test('non-symmetric value uses full format', () => {
      expect(new EdgeInsets(1, 2, 3, 4).toString())
        .toBe('EdgeInsets(1, 2, 3, 4)');
    });
  });
});
