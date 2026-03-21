import { describe, expect, it } from 'bun:test';
import { Color } from '../color';

// ============================================================
// Named color constants
// ============================================================
describe('Color named constants', () => {
  it('has all 16 named colors', () => {
    expect(Color.black.mode).toBe('named');
    expect(Color.black.value).toBe(0);
    expect(Color.red.value).toBe(1);
    expect(Color.green.value).toBe(2);
    expect(Color.yellow.value).toBe(3);
    expect(Color.blue.value).toBe(4);
    expect(Color.magenta.value).toBe(5);
    expect(Color.cyan.value).toBe(6);
    expect(Color.white.value).toBe(7);
    expect(Color.brightBlack.value).toBe(8);
    expect(Color.brightRed.value).toBe(9);
    expect(Color.brightGreen.value).toBe(10);
    expect(Color.brightYellow.value).toBe(11);
    expect(Color.brightBlue.value).toBe(12);
    expect(Color.brightMagenta.value).toBe(13);
    expect(Color.brightCyan.value).toBe(14);
    expect(Color.brightWhite.value).toBe(15);
  });

  it('defaultColor is a named color sentinel', () => {
    expect(Color.defaultColor.mode).toBe('named');
    expect(Color.defaultColor.value).toBe(-1);
  });
});

// ============================================================
// Factory constructors
// ============================================================
describe('Color factories', () => {
  it('Color.named creates named color', () => {
    const c = Color.named(5);
    expect(c.mode).toBe('named');
    expect(c.value).toBe(5);
  });

  it('Color.named throws for out-of-range', () => {
    expect(() => Color.named(-1)).toThrow(RangeError);
    expect(() => Color.named(16)).toThrow(RangeError);
  });

  it('Color.ansi256 creates ansi256 color', () => {
    const c = Color.ansi256(123);
    expect(c.mode).toBe('ansi256');
    expect(c.value).toBe(123);
  });

  it('Color.ansi256 throws for out-of-range', () => {
    expect(() => Color.ansi256(-1)).toThrow(RangeError);
    expect(() => Color.ansi256(256)).toThrow(RangeError);
  });

  it('Color.rgb creates rgb color', () => {
    const c = Color.rgb(255, 128, 0);
    expect(c.mode).toBe('rgb');
    expect(c.r).toBe(255);
    expect(c.g).toBe(128);
    expect(c.b).toBe(0);
  });

  it('Color.rgb clamps values to 0-255', () => {
    const c = Color.rgb(-10, 300, 128);
    expect(c.r).toBe(0);
    expect(c.g).toBe(255);
    expect(c.b).toBe(128);
  });

  it('Color.rgb rounds fractional values', () => {
    const c = Color.rgb(127.6, 63.4, 200.5);
    expect(c.r).toBe(128);
    expect(c.g).toBe(63);
    expect(c.b).toBe(201);
  });
});

// ============================================================
// SGR output — Named colors
// ============================================================
describe('Color SGR named', () => {
  it('standard fg colors use 30-37', () => {
    expect(Color.black.toSgrFg()).toBe('30');
    expect(Color.red.toSgrFg()).toBe('31');
    expect(Color.green.toSgrFg()).toBe('32');
    expect(Color.yellow.toSgrFg()).toBe('33');
    expect(Color.blue.toSgrFg()).toBe('34');
    expect(Color.magenta.toSgrFg()).toBe('35');
    expect(Color.cyan.toSgrFg()).toBe('36');
    expect(Color.white.toSgrFg()).toBe('37');
  });

  it('standard bg colors use 40-47', () => {
    expect(Color.black.toSgrBg()).toBe('40');
    expect(Color.red.toSgrBg()).toBe('41');
    expect(Color.green.toSgrBg()).toBe('42');
    expect(Color.yellow.toSgrBg()).toBe('43');
    expect(Color.blue.toSgrBg()).toBe('44');
    expect(Color.magenta.toSgrBg()).toBe('45');
    expect(Color.cyan.toSgrBg()).toBe('46');
    expect(Color.white.toSgrBg()).toBe('47');
  });

  it('bright fg colors use 90-97', () => {
    expect(Color.brightBlack.toSgrFg()).toBe('90');
    expect(Color.brightRed.toSgrFg()).toBe('91');
    expect(Color.brightGreen.toSgrFg()).toBe('92');
    expect(Color.brightYellow.toSgrFg()).toBe('93');
    expect(Color.brightBlue.toSgrFg()).toBe('94');
    expect(Color.brightMagenta.toSgrFg()).toBe('95');
    expect(Color.brightCyan.toSgrFg()).toBe('96');
    expect(Color.brightWhite.toSgrFg()).toBe('97');
  });

  it('bright bg colors use 100-107', () => {
    expect(Color.brightBlack.toSgrBg()).toBe('100');
    expect(Color.brightRed.toSgrBg()).toBe('101');
    expect(Color.brightGreen.toSgrBg()).toBe('102');
    expect(Color.brightYellow.toSgrBg()).toBe('103');
    expect(Color.brightBlue.toSgrBg()).toBe('104');
    expect(Color.brightMagenta.toSgrBg()).toBe('105');
    expect(Color.brightCyan.toSgrBg()).toBe('106');
    expect(Color.brightWhite.toSgrBg()).toBe('107');
  });

  it('default color uses 39/49', () => {
    expect(Color.defaultColor.toSgrFg()).toBe('39');
    expect(Color.defaultColor.toSgrBg()).toBe('49');
  });
});

// ============================================================
// SGR output — Ansi256
// ============================================================
describe('Color SGR ansi256', () => {
  it('foreground uses 38;5;N format', () => {
    expect(Color.ansi256(123).toSgrFg()).toBe('38;5;123');
    expect(Color.ansi256(0).toSgrFg()).toBe('38;5;0');
    expect(Color.ansi256(255).toSgrFg()).toBe('38;5;255');
  });

  it('background uses 48;5;N format', () => {
    expect(Color.ansi256(123).toSgrBg()).toBe('48;5;123');
    expect(Color.ansi256(0).toSgrBg()).toBe('48;5;0');
    expect(Color.ansi256(255).toSgrBg()).toBe('48;5;255');
  });
});

// ============================================================
// SGR output — RGB
// ============================================================
describe('Color SGR rgb', () => {
  it('foreground uses 38;2;R;G;B format', () => {
    expect(Color.rgb(255, 128, 0).toSgrFg()).toBe('38;2;255;128;0');
  });

  it('background uses 48;2;R;G;B format', () => {
    expect(Color.rgb(255, 128, 0).toSgrBg()).toBe('48;2;255;128;0');
  });

  it('handles zero RGB values', () => {
    expect(Color.rgb(0, 0, 0).toSgrFg()).toBe('38;2;0;0;0');
    expect(Color.rgb(0, 0, 0).toSgrBg()).toBe('48;2;0;0;0');
  });
});

// ============================================================
// RGB component accessors
// ============================================================
describe('Color RGB accessors', () => {
  it('r, g, b return correct components', () => {
    const c = Color.rgb(100, 200, 50);
    expect(c.r).toBe(100);
    expect(c.g).toBe(200);
    expect(c.b).toBe(50);
  });

  it('r, g, b throw for non-rgb colors', () => {
    expect(() => Color.red.r).toThrow();
    expect(() => Color.ansi256(42).g).toThrow();
  });
});

// ============================================================
// Conversion: Ansi256 -> RGB
// ============================================================
describe('Color ansi256 to RGB conversion', () => {
  it('converts standard colors', () => {
    // Index 0 (black) -> (0,0,0)
    const black = Color.ansi256(0).toRgb();
    expect(black.r).toBe(0);
    expect(black.g).toBe(0);
    expect(black.b).toBe(0);
  });

  it('converts bright colors', () => {
    // Index 15 (bright white) -> (255,255,255)
    const white = Color.ansi256(15).toRgb();
    expect(white.r).toBe(255);
    expect(white.g).toBe(255);
    expect(white.b).toBe(255);
  });

  it('converts color cube entries', () => {
    // Index 16 = cube (0,0,0) -> rgb(0,0,0)
    const c16 = Color.ansi256(16).toRgb();
    expect(c16.r).toBe(0);
    expect(c16.g).toBe(0);
    expect(c16.b).toBe(0);

    // Index 196 = cube (5,0,0) -> rgb(255,0,0)
    const c196 = Color.ansi256(196).toRgb();
    expect(c196.r).toBe(255);
    expect(c196.g).toBe(0);
    expect(c196.b).toBe(0);

    // Index 21 = cube (0,0,5) -> rgb(0,0,255)
    const c21 = Color.ansi256(21).toRgb();
    expect(c21.r).toBe(0);
    expect(c21.g).toBe(0);
    expect(c21.b).toBe(255);
  });

  it('converts grayscale entries', () => {
    // Index 232 = grayscale first -> rgb(8,8,8)
    const g232 = Color.ansi256(232).toRgb();
    expect(g232.r).toBe(8);
    expect(g232.g).toBe(8);
    expect(g232.b).toBe(8);

    // Index 255 = grayscale last -> rgb(238,238,238)
    const g255 = Color.ansi256(255).toRgb();
    expect(g255.r).toBe(238);
    expect(g255.g).toBe(238);
    expect(g255.b).toBe(238);
  });

  it('named colors convert to RGB via lookup table', () => {
    // Named red (index 1) -> rgb(128,0,0) per standard palette
    const red = Color.red.toRgb();
    expect(red.mode).toBe('rgb');
    expect(red.r).toBe(128);
    expect(red.g).toBe(0);
    expect(red.b).toBe(0);
  });

  it('default color toRgb returns self', () => {
    const c = Color.defaultColor.toRgb();
    expect(c.equals(Color.defaultColor)).toBe(true);
  });

  it('rgb toRgb returns self', () => {
    const c = Color.rgb(100, 200, 50);
    expect(c.toRgb()).toBe(c);
  });
});

// ============================================================
// Conversion: RGB -> Ansi256 (nearest match)
// ============================================================
describe('Color RGB to Ansi256 conversion', () => {
  it('pure red finds nearest in color cube', () => {
    const c = Color.rgb(255, 0, 0).toAnsi256();
    expect(c.mode).toBe('ansi256');
    // Should map to index 196 (cube 5,0,0)
    expect(c.value).toBe(196);
  });

  it('pure green finds nearest in color cube', () => {
    const c = Color.rgb(0, 255, 0).toAnsi256();
    expect(c.mode).toBe('ansi256');
    // Should map to index 46 (cube 0,5,0)
    expect(c.value).toBe(46);
  });

  it('pure blue finds nearest in color cube', () => {
    const c = Color.rgb(0, 0, 255).toAnsi256();
    expect(c.mode).toBe('ansi256');
    // Should map to index 21 (cube 0,0,5)
    expect(c.value).toBe(21);
  });

  it('gray finds nearest in grayscale ramp', () => {
    // rgb(128,128,128) -> should map to a grayscale entry
    const c = Color.rgb(128, 128, 128).toAnsi256();
    expect(c.mode).toBe('ansi256');
    // Nearest gray in ramp: 8 + n*10 closest to 128 -> n=12 -> value=128, index=232+12=244
    expect(c.value).toBe(244);
  });

  it('named color toAnsi256 maps directly', () => {
    const c = Color.red.toAnsi256();
    expect(c.mode).toBe('ansi256');
    expect(c.value).toBe(1);
  });

  it('ansi256 toAnsi256 returns self', () => {
    const c = Color.ansi256(100);
    expect(c.toAnsi256()).toBe(c);
  });

  it('default color toAnsi256 returns defaultColor', () => {
    const c = Color.defaultColor.toAnsi256();
    expect(c.equals(Color.defaultColor)).toBe(true);
  });

  it('round-trip RGB -> Ansi256 -> RGB produces approximate match', () => {
    // Start with a color cube entry's exact RGB
    const original = Color.rgb(175, 135, 255); // cube (3,2,5) = index 141
    const ansi = original.toAnsi256();
    const backToRgb = ansi.toRgb();
    // Should be close to original (exact for cube colors)
    expect(Math.abs(backToRgb.r - original.r)).toBeLessThanOrEqual(40);
    expect(Math.abs(backToRgb.g - original.g)).toBeLessThanOrEqual(40);
    expect(Math.abs(backToRgb.b - original.b)).toBeLessThanOrEqual(40);
  });
});

// ============================================================
// Equality
// ============================================================
describe('Color equality', () => {
  it('same named colors are equal', () => {
    expect(Color.red.equals(Color.named(1))).toBe(true);
  });

  it('different named colors are not equal', () => {
    expect(Color.red.equals(Color.blue)).toBe(false);
  });

  it('same ansi256 colors are equal', () => {
    expect(Color.ansi256(42).equals(Color.ansi256(42))).toBe(true);
  });

  it('different ansi256 colors are not equal', () => {
    expect(Color.ansi256(42).equals(Color.ansi256(43))).toBe(false);
  });

  it('same rgb colors are equal', () => {
    expect(Color.rgb(100, 200, 50).equals(Color.rgb(100, 200, 50))).toBe(true);
  });

  it('different rgb colors are not equal', () => {
    expect(Color.rgb(100, 200, 50).equals(Color.rgb(100, 200, 51))).toBe(false);
  });

  it('different modes are not equal even if similar', () => {
    // named(1) and ansi256(1) have same value but different mode
    expect(Color.named(1).equals(Color.ansi256(1))).toBe(false);
  });
});

// ============================================================
// toString
// ============================================================
describe('Color toString', () => {
  it('named color', () => {
    expect(Color.red.toString()).toBe('Color(named:1)');
  });

  it('default color', () => {
    expect(Color.defaultColor.toString()).toBe('Color(default)');
  });

  it('ansi256 color', () => {
    expect(Color.ansi256(123).toString()).toBe('Color(ansi256:123)');
  });

  it('rgb color', () => {
    expect(Color.rgb(255, 128, 0).toString()).toBe('Color(rgb:255,128,0)');
  });
});
