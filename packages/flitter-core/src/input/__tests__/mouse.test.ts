// Tests for MouseButton constants and SGR parsing helpers
import { describe, test, expect } from 'bun:test';
import {
  MouseButton,
  MouseModifier,
  extractMouseModifiers,
  extractBaseButton,
  determineMouseAction,
  isScrollButton,
} from '../mouse';

describe('MouseButton constants', () => {
  test('standard buttons', () => {
    expect(MouseButton.Left).toBe(0);
    expect(MouseButton.Middle).toBe(1);
    expect(MouseButton.Right).toBe(2);
  });

  test('scroll buttons', () => {
    expect(MouseButton.ScrollUp).toBe(64);
    expect(MouseButton.ScrollDown).toBe(65);
    expect(MouseButton.ScrollLeft).toBe(66);
    expect(MouseButton.ScrollRight).toBe(67);
  });
});

describe('MouseModifier constants', () => {
  test('modifier bit values', () => {
    expect(MouseModifier.Shift).toBe(4);
    expect(MouseModifier.Alt).toBe(8);
    expect(MouseModifier.Ctrl).toBe(16);
    expect(MouseModifier.Motion).toBe(32);
  });
});

describe('extractMouseModifiers', () => {
  test('no modifiers', () => {
    const mods = extractMouseModifiers(0);
    expect(mods.shift).toBe(false);
    expect(mods.alt).toBe(false);
    expect(mods.ctrl).toBe(false);
    expect(mods.motion).toBe(false);
  });

  test('shift modifier (bit 2 = value 4)', () => {
    const mods = extractMouseModifiers(4);
    expect(mods.shift).toBe(true);
    expect(mods.alt).toBe(false);
    expect(mods.ctrl).toBe(false);
  });

  test('alt modifier (bit 3 = value 8)', () => {
    const mods = extractMouseModifiers(8);
    expect(mods.shift).toBe(false);
    expect(mods.alt).toBe(true);
    expect(mods.ctrl).toBe(false);
  });

  test('ctrl modifier (bit 4 = value 16)', () => {
    const mods = extractMouseModifiers(16);
    expect(mods.shift).toBe(false);
    expect(mods.alt).toBe(false);
    expect(mods.ctrl).toBe(true);
  });

  test('motion flag (bit 5 = value 32)', () => {
    const mods = extractMouseModifiers(32);
    expect(mods.motion).toBe(true);
  });

  test('combined modifiers', () => {
    // Ctrl + Shift = 16 + 4 = 20
    const mods = extractMouseModifiers(20);
    expect(mods.shift).toBe(true);
    expect(mods.alt).toBe(false);
    expect(mods.ctrl).toBe(true);
    expect(mods.motion).toBe(false);
  });

  test('all modifiers plus button', () => {
    // Left button (0) + Shift (4) + Alt (8) + Ctrl (16) + Motion (32) = 60
    const mods = extractMouseModifiers(60);
    expect(mods.shift).toBe(true);
    expect(mods.alt).toBe(true);
    expect(mods.ctrl).toBe(true);
    expect(mods.motion).toBe(true);
  });

  test('modifiers with scroll button', () => {
    // ScrollUp (64) + Ctrl (16) = 80
    const mods = extractMouseModifiers(80);
    expect(mods.ctrl).toBe(true);
    expect(mods.shift).toBe(false);
    expect(mods.alt).toBe(false);
  });
});

describe('extractBaseButton', () => {
  test('standard buttons without modifiers', () => {
    expect(extractBaseButton(0)).toBe(0);  // Left
    expect(extractBaseButton(1)).toBe(1);  // Middle
    expect(extractBaseButton(2)).toBe(2);  // Right
  });

  test('strips shift modifier', () => {
    expect(extractBaseButton(0 + 4)).toBe(0);  // Left + Shift
    expect(extractBaseButton(1 + 4)).toBe(1);  // Middle + Shift
  });

  test('strips alt modifier', () => {
    expect(extractBaseButton(0 + 8)).toBe(0);  // Left + Alt
  });

  test('strips ctrl modifier', () => {
    expect(extractBaseButton(0 + 16)).toBe(0);  // Left + Ctrl
  });

  test('strips motion flag', () => {
    expect(extractBaseButton(0 + 32)).toBe(0);  // Left + Motion
    expect(extractBaseButton(32)).toBe(0);       // Motion only (no button)
  });

  test('scroll buttons', () => {
    expect(extractBaseButton(64)).toBe(64);   // ScrollUp
    expect(extractBaseButton(65)).toBe(65);   // ScrollDown
    expect(extractBaseButton(66)).toBe(66);   // ScrollLeft
    expect(extractBaseButton(67)).toBe(67);   // ScrollRight
  });

  test('scroll button with modifiers', () => {
    expect(extractBaseButton(64 + 16)).toBe(64);  // ScrollUp + Ctrl
  });
});

describe('determineMouseAction', () => {
  test('press on M final', () => {
    expect(determineMouseAction(0, 'M')).toBe('press');
    expect(determineMouseAction(1, 'M')).toBe('press');
    expect(determineMouseAction(2, 'M')).toBe('press');
  });

  test('release on m final', () => {
    expect(determineMouseAction(0, 'm')).toBe('release');
    expect(determineMouseAction(1, 'm')).toBe('release');
  });

  test('move when motion bit is set', () => {
    expect(determineMouseAction(32, 'M')).toBe('move');
    expect(determineMouseAction(32 + 0, 'M')).toBe('move');  // Left + Motion
  });

  test('scroll for scroll buttons', () => {
    expect(determineMouseAction(64, 'M')).toBe('scroll');
    expect(determineMouseAction(65, 'M')).toBe('scroll');
    expect(determineMouseAction(66, 'M')).toBe('scroll');
    expect(determineMouseAction(67, 'M')).toBe('scroll');
  });
});

describe('isScrollButton', () => {
  test('identifies scroll buttons', () => {
    expect(isScrollButton(64)).toBe(true);
    expect(isScrollButton(65)).toBe(true);
    expect(isScrollButton(66)).toBe(true);
    expect(isScrollButton(67)).toBe(true);
  });

  test('rejects non-scroll buttons', () => {
    expect(isScrollButton(0)).toBe(false);
    expect(isScrollButton(1)).toBe(false);
    expect(isScrollButton(2)).toBe(false);
    expect(isScrollButton(32)).toBe(false);
  });

  test('scroll button with modifiers', () => {
    expect(isScrollButton(64 + 16)).toBe(true);  // ScrollUp + Ctrl
  });
});
