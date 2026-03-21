// Tests for Key system
// Covers: ValueKey equality, UniqueKey uniqueness, GlobalKey, toString

import { describe, expect, test } from 'bun:test';
import { ValueKey, UniqueKey, GlobalKey, Key } from '../key';

describe('ValueKey', () => {
  test('equal when same value', () => {
    const a = new ValueKey('hello');
    const b = new ValueKey('hello');
    expect(a.equals(b)).toBe(true);
  });

  test('not equal when different value', () => {
    const a = new ValueKey('hello');
    const b = new ValueKey('world');
    expect(a.equals(b)).toBe(false);
  });

  test('not equal when different types (string vs number)', () => {
    const a = new ValueKey<string | number>('42');
    const b = new ValueKey<string | number>(42);
    expect(a.equals(b)).toBe(false);
  });

  test('equal with number values', () => {
    const a = new ValueKey(7);
    const b = new ValueKey(7);
    expect(a.equals(b)).toBe(true);
  });

  test('not equal to UniqueKey', () => {
    const vk = new ValueKey('test');
    const uk = new UniqueKey();
    expect(vk.equals(uk)).toBe(false);
  });

  test('not equal to GlobalKey', () => {
    const vk = new ValueKey('test');
    const gk = new GlobalKey();
    expect(vk.equals(gk)).toBe(false);
  });

  test('stores value', () => {
    const key = new ValueKey('myValue');
    expect(key.value).toBe('myValue');
  });

  test('toString', () => {
    expect(new ValueKey('hello').toString()).toBe('ValueKey(hello)');
    expect(new ValueKey(42).toString()).toBe('ValueKey(42)');
  });
});

describe('UniqueKey', () => {
  test('two instances are not equal', () => {
    const a = new UniqueKey();
    const b = new UniqueKey();
    expect(a.equals(b)).toBe(false);
  });

  test('same instance is equal to itself', () => {
    const a = new UniqueKey();
    expect(a.equals(a)).toBe(true);
  });

  test('has incrementing _id', () => {
    const a = new UniqueKey();
    const b = new UniqueKey();
    expect(b._id).toBe(a._id + 1);
  });

  test('not equal to ValueKey', () => {
    const uk = new UniqueKey();
    const vk = new ValueKey('test');
    expect(uk.equals(vk)).toBe(false);
  });

  test('toString contains id', () => {
    const key = new UniqueKey();
    expect(key.toString()).toBe(`UniqueKey(#${key._id})`);
  });
});

describe('GlobalKey', () => {
  test('two instances are not equal', () => {
    const a = new GlobalKey();
    const b = new GlobalKey();
    expect(a.equals(b)).toBe(false);
  });

  test('same instance is equal to itself', () => {
    const a = new GlobalKey();
    expect(a.equals(a)).toBe(true);
  });

  test('has incrementing _id', () => {
    const a = new GlobalKey();
    const b = new GlobalKey();
    expect(b._id).toBe(a._id + 1);
  });

  test('not equal to UniqueKey', () => {
    const gk = new GlobalKey();
    const uk = new UniqueKey();
    expect(gk.equals(uk)).toBe(false);
  });

  test('not equal to ValueKey', () => {
    const gk = new GlobalKey();
    const vk = new ValueKey('test');
    expect(gk.equals(vk)).toBe(false);
  });

  test('toString contains id', () => {
    const key = new GlobalKey();
    expect(key.toString()).toBe(`GlobalKey(#${key._id})`);
  });
});

describe('Key (abstract base)', () => {
  test('ValueKey is instanceof Key', () => {
    expect(new ValueKey('x')).toBeInstanceOf(Key);
  });

  test('UniqueKey is instanceof Key', () => {
    expect(new UniqueKey()).toBeInstanceOf(Key);
  });

  test('GlobalKey is instanceof Key', () => {
    expect(new GlobalKey()).toBeInstanceOf(Key);
  });
});
