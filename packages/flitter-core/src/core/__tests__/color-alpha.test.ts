import { describe, expect, it } from 'bun:test';
import { Color, blendColor } from '../color';

// ============================================================
// Alpha property
// ============================================================
describe('Color alpha property', () => {
  it('default alpha is 1.0 for named colors', () => {
    expect(Color.red.alpha).toBe(1.0);
    expect(Color.black.alpha).toBe(1.0);
    expect(Color.defaultColor.alpha).toBe(1.0);
  });

  it('default alpha is 1.0 for factory-created colors', () => {
    expect(Color.named(5).alpha).toBe(1.0);
    expect(Color.ansi256(100).alpha).toBe(1.0);
    expect(Color.rgb(128, 64, 32).alpha).toBe(1.0);
  });

  it('default alpha does not break existing static constants', () => {
    // All 16 named color statics should have alpha 1.0
    const statics = [
      Color.black, Color.red, Color.green, Color.yellow,
      Color.blue, Color.magenta, Color.cyan, Color.white,
      Color.brightBlack, Color.brightRed, Color.brightGreen, Color.brightYellow,
      Color.brightBlue, Color.brightMagenta, Color.brightCyan, Color.brightWhite,
    ];
    for (const c of statics) {
      expect(c.alpha).toBe(1.0);
    }
  });
});

// ============================================================
// withAlpha method
// ============================================================
describe('Color.withAlpha()', () => {
  it('creates new color with specified alpha', () => {
    const c = Color.rgb(255, 128, 0);
    const withHalf = c.withAlpha(0.5);
    expect(withHalf.alpha).toBe(0.5);
    expect(withHalf.r).toBe(255);
    expect(withHalf.g).toBe(128);
    expect(withHalf.b).toBe(0);
    expect(withHalf.mode).toBe('rgb');
  });

  it('clamps alpha to 0-1 range', () => {
    const c = Color.rgb(100, 100, 100);
    expect(c.withAlpha(-0.5).alpha).toBe(0);
    expect(c.withAlpha(1.5).alpha).toBe(1);
  });

  it('preserves named color mode and value', () => {
    const c = Color.red.withAlpha(0.3);
    expect(c.mode).toBe('named');
    expect(c.value).toBe(1);
    expect(c.alpha).toBe(0.3);
  });

  it('preserves ansi256 color mode and value', () => {
    const c = Color.ansi256(200).withAlpha(0.7);
    expect(c.mode).toBe('ansi256');
    expect(c.value).toBe(200);
    expect(c.alpha).toBeCloseTo(0.7);
  });

  it('does not modify original color', () => {
    const original = Color.rgb(10, 20, 30);
    original.withAlpha(0.1);
    expect(original.alpha).toBe(1.0);
  });
});

// ============================================================
// equals with alpha
// ============================================================
describe('Color.equals() with alpha', () => {
  it('colors with different alpha are not equal', () => {
    const a = Color.rgb(100, 200, 50);
    const b = Color.rgb(100, 200, 50).withAlpha(0.5);
    expect(a.equals(b)).toBe(false);
  });

  it('colors with same alpha are equal', () => {
    const a = Color.rgb(100, 200, 50).withAlpha(0.5);
    const b = Color.rgb(100, 200, 50).withAlpha(0.5);
    expect(a.equals(b)).toBe(true);
  });

  it('existing colors (alpha=1.0) remain equal', () => {
    expect(Color.red.equals(Color.named(1))).toBe(true);
    expect(Color.rgb(10, 20, 30).equals(Color.rgb(10, 20, 30))).toBe(true);
  });
});

// ============================================================
// toString with alpha
// ============================================================
describe('Color.toString() with alpha', () => {
  it('alpha=1.0 does not include alpha suffix', () => {
    expect(Color.rgb(255, 128, 0).toString()).toBe('Color(rgb:255,128,0)');
    expect(Color.red.toString()).toBe('Color(named:1)');
    expect(Color.defaultColor.toString()).toBe('Color(default)');
  });

  it('alpha<1.0 includes alpha suffix', () => {
    expect(Color.rgb(255, 128, 0).withAlpha(0.5).toString()).toBe('Color(rgb:255,128,0,a=0.50)');
    expect(Color.red.withAlpha(0.3).toString()).toBe('Color(named:1,a=0.30)');
  });
});

// ============================================================
// blendColor function
// ============================================================
describe('blendColor()', () => {
  it('alpha=1.0 returns front unchanged', () => {
    const front = Color.rgb(255, 0, 0);
    const back = Color.rgb(0, 255, 0);
    const result = blendColor(front, back);
    expect(result).toBe(front); // same reference
  });

  it('alpha=0.0 returns back unchanged', () => {
    const front = Color.rgb(255, 0, 0).withAlpha(0);
    const back = Color.rgb(0, 255, 0);
    const result = blendColor(front, back);
    expect(result).toBe(back); // same reference
  });

  it('alpha=0.5 blends 50/50', () => {
    const front = Color.rgb(255, 0, 0).withAlpha(0.5);
    const back = Color.rgb(0, 255, 0);
    const result = blendColor(front, back);
    expect(result.mode).toBe('rgb');
    // result = 255*0.5 + 0*0.5 = 128 for r
    // result = 0*0.5 + 255*0.5 = 128 for g
    expect(result.r).toBe(128);
    expect(result.g).toBe(128);
    expect(result.b).toBe(0);
    expect(result.alpha).toBe(1.0); // blended result is fully opaque
  });

  it('alpha=0.25 blends 25/75', () => {
    const front = Color.rgb(200, 100, 0).withAlpha(0.25);
    const back = Color.rgb(0, 0, 200);
    const result = blendColor(front, back);
    expect(result.mode).toBe('rgb');
    // r = 200*0.25 + 0*0.75 = 50
    expect(result.r).toBe(50);
    // g = 100*0.25 + 0*0.75 = 25
    expect(result.g).toBe(25);
    // b = 0*0.25 + 200*0.75 = 150
    expect(result.b).toBe(150);
  });

  it('blends ansi256 colors by converting to RGB', () => {
    const front = Color.ansi256(196).withAlpha(0.5); // pure red (255,0,0)
    const back = Color.ansi256(46); // pure green (0,255,0)
    const result = blendColor(front, back);
    expect(result.mode).toBe('rgb');
    expect(result.r).toBe(128);
    expect(result.g).toBe(128);
    expect(result.b).toBe(0);
  });

  it('blends named colors by converting to RGB', () => {
    // Named colors have standard palette RGB values
    const front = Color.red.withAlpha(0.5);
    const back = Color.blue;
    const result = blendColor(front, back);
    expect(result.mode).toBe('rgb');
    // red = rgb(128,0,0), blue = rgb(0,0,128)
    // r = 128*0.5 + 0*0.5 = 64
    expect(result.r).toBe(64);
    // b = 0*0.5 + 128*0.5 = 64
    expect(result.b).toBe(64);
  });

  it('handles defaultColor as front (cannot convert to RGB)', () => {
    const front = Color.defaultColor.withAlpha(0.5);
    const back = Color.rgb(100, 100, 100);
    const result = blendColor(front, back);
    // defaultColor toRgb returns self (still named mode), so blend returns front
    expect(result).toBe(front);
  });
});
