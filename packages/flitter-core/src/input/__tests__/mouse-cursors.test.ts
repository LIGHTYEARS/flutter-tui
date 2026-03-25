// Tests for SystemMouseCursors and cursorToAnsi
import { describe, test, expect } from 'bun:test';
import { SystemMouseCursors, cursorToAnsi } from '../mouse-cursors';

describe('SystemMouseCursors', () => {
  test('DEFAULT is "default"', () => {
    expect(SystemMouseCursors.DEFAULT).toBe('default');
  });

  test('POINTER is "pointer"', () => {
    expect(SystemMouseCursors.POINTER).toBe('pointer');
  });

  test('TEXT is "text"', () => {
    expect(SystemMouseCursors.TEXT).toBe('text');
  });

  test('NONE is "none"', () => {
    expect(SystemMouseCursors.NONE).toBe('none');
  });

  test('constants are distinct', () => {
    const values = Object.values(SystemMouseCursors);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('cursorToAnsi', () => {
  test('DEFAULT returns show cursor + default shape', () => {
    const ansi = cursorToAnsi('default');
    // Should contain DECTCEM show (\x1b[?25h) and reset shape (\x1b[0 q)
    expect(ansi).toContain('\x1b[?25h');
    expect(ansi).toContain('\x1b[0 q');
  });

  test('POINTER returns show cursor + steady block', () => {
    const ansi = cursorToAnsi('pointer');
    expect(ansi).toContain('\x1b[?25h');
    expect(ansi).toContain('\x1b[2 q');
  });

  test('TEXT returns show cursor + steady bar (I-beam)', () => {
    const ansi = cursorToAnsi('text');
    expect(ansi).toContain('\x1b[?25h');
    expect(ansi).toContain('\x1b[6 q');
  });

  test('NONE returns hide cursor', () => {
    const ansi = cursorToAnsi('none');
    expect(ansi).toBe('\x1b[?25l');
    // Should NOT contain show cursor
    expect(ansi).not.toContain('\x1b[?25h');
  });

  test('unknown cursor returns empty string', () => {
    expect(cursorToAnsi('unknown')).toBe('');
    expect(cursorToAnsi('custom-cursor')).toBe('');
    expect(cursorToAnsi('')).toBe('');
  });

  test('all SystemMouseCursors produce non-empty ANSI (except unknown)', () => {
    for (const cursor of Object.values(SystemMouseCursors)) {
      expect(cursorToAnsi(cursor).length).toBeGreaterThan(0);
    }
  });

  test('NONE hides and DEFAULT shows cursor (toggle pair)', () => {
    const hide = cursorToAnsi('none');
    const show = cursorToAnsi('default');
    // hide uses DECTCEM hide
    expect(hide).toContain('\x1b[?25l');
    // show uses DECTCEM show
    expect(show).toContain('\x1b[?25h');
  });
});
