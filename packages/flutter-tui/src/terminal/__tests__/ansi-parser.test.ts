// Tests for ANSI escape sequence parser
// Plan 07-02: ANSI Parser (TERM-06)

import { describe, test, expect } from 'bun:test';
import { parseAnsiToTextSpan } from '../ansi-parser';
import { TextSpan } from '../../core/text-span';
import { TextStyle } from '../../core/text-style';
import { Color } from '../../core/color';

const ESC = '\x1b';
const BEL = '\x07';

// ---------------------------------------------------------------------------
// Helper: extract all text+style pairs from a TextSpan
// ---------------------------------------------------------------------------

function collectSegments(span: TextSpan): Array<{ text: string; style: TextStyle }> {
  const result: Array<{ text: string; style: TextStyle }> = [];
  span.visitChildren((text, style) => {
    result.push({ text, style });
  });
  return result;
}

// ============================================================================
// Plain text (no escapes)
// ============================================================================

describe('ANSI parser: plain text', () => {
  test('empty string', () => {
    const span = parseAnsiToTextSpan('');
    expect(span.toPlainText()).toBe('');
  });

  test('simple text without escapes', () => {
    const span = parseAnsiToTextSpan('Hello, World!');
    expect(span.toPlainText()).toBe('Hello, World!');
  });

  test('multi-word text preserved exactly', () => {
    const input = 'The quick brown fox jumps over the lazy dog.';
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe(input);
  });
});

// ============================================================================
// Bold text
// ============================================================================

describe('ANSI parser: bold', () => {
  test('bold text', () => {
    const input = `${ESC}[1mBold text${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('Bold text');

    const segments = collectSegments(span);
    const boldSegment = segments.find(s => s.text === 'Bold text');
    expect(boldSegment).toBeDefined();
    expect(boldSegment!.style.bold).toBe(true);
  });

  test('bold with text before and after', () => {
    const input = `normal ${ESC}[1mbold${ESC}[0m normal`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('normal bold normal');

    const segments = collectSegments(span);
    expect(segments.length).toBeGreaterThanOrEqual(3);
  });
});

// ============================================================================
// Foreground colors (30-37, 90-97)
// ============================================================================

describe('ANSI parser: foreground colors', () => {
  test('standard foreground color (red = 31)', () => {
    const input = `${ESC}[31mred text${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('red text');

    const segments = collectSegments(span);
    const colored = segments.find(s => s.text === 'red text');
    expect(colored).toBeDefined();
    expect(colored!.style.foreground).toBeDefined();
    expect(colored!.style.foreground!.mode).toBe('named');
    expect(colored!.style.foreground!.value).toBe(1); // red
  });

  test('all standard colors (30-37)', () => {
    for (let code = 30; code <= 37; code++) {
      const input = `${ESC}[${code}mcolor${ESC}[0m`;
      const span = parseAnsiToTextSpan(input);
      const segments = collectSegments(span);
      const seg = segments.find(s => s.text === 'color');
      expect(seg).toBeDefined();
      expect(seg!.style.foreground!.value).toBe(code - 30);
    }
  });

  test('bright foreground color (bright red = 91)', () => {
    const input = `${ESC}[91mbright red${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);

    const segments = collectSegments(span);
    const colored = segments.find(s => s.text === 'bright red');
    expect(colored).toBeDefined();
    expect(colored!.style.foreground!.value).toBe(9); // bright red = named index 9
  });

  test('all bright colors (90-97)', () => {
    for (let code = 90; code <= 97; code++) {
      const input = `${ESC}[${code}mbright${ESC}[0m`;
      const span = parseAnsiToTextSpan(input);
      const segments = collectSegments(span);
      const seg = segments.find(s => s.text === 'bright');
      expect(seg).toBeDefined();
      expect(seg!.style.foreground!.value).toBe(code - 90 + 8);
    }
  });
});

// ============================================================================
// RGB foreground (38;2;R;G;B)
// ============================================================================

describe('ANSI parser: RGB foreground', () => {
  test('parse RGB foreground', () => {
    const input = `${ESC}[38;2;255;128;0mOrange${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('Orange');

    const segments = collectSegments(span);
    const seg = segments.find(s => s.text === 'Orange');
    expect(seg).toBeDefined();
    expect(seg!.style.foreground).toBeDefined();
    expect(seg!.style.foreground!.mode).toBe('rgb');
    expect(seg!.style.foreground!.r).toBe(255);
    expect(seg!.style.foreground!.g).toBe(128);
    expect(seg!.style.foreground!.b).toBe(0);
  });

  test('parse RGB background', () => {
    const input = `${ESC}[48;2;0;255;0mbg${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);

    const segments = collectSegments(span);
    const seg = segments.find(s => s.text === 'bg');
    expect(seg).toBeDefined();
    expect(seg!.style.background).toBeDefined();
    expect(seg!.style.background!.mode).toBe('rgb');
    expect(seg!.style.background!.r).toBe(0);
    expect(seg!.style.background!.g).toBe(255);
    expect(seg!.style.background!.b).toBe(0);
  });
});

// ============================================================================
// 256-color (38;5;N)
// ============================================================================

describe('ANSI parser: 256-color', () => {
  test('parse 256-color foreground', () => {
    const input = `${ESC}[38;5;196mcolor256${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('color256');

    const segments = collectSegments(span);
    const seg = segments.find(s => s.text === 'color256');
    expect(seg).toBeDefined();
    expect(seg!.style.foreground).toBeDefined();
    expect(seg!.style.foreground!.mode).toBe('ansi256');
    expect(seg!.style.foreground!.value).toBe(196);
  });

  test('parse 256-color background', () => {
    const input = `${ESC}[48;5;27mbg256${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);

    const segments = collectSegments(span);
    const seg = segments.find(s => s.text === 'bg256');
    expect(seg).toBeDefined();
    expect(seg!.style.background).toBeDefined();
    expect(seg!.style.background!.mode).toBe('ansi256');
    expect(seg!.style.background!.value).toBe(27);
  });
});

// ============================================================================
// Background colors (40-47, 48;2;R;G;B)
// ============================================================================

describe('ANSI parser: background colors', () => {
  test('standard background color (green bg = 42)', () => {
    const input = `${ESC}[42mgreen bg${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);

    const segments = collectSegments(span);
    const seg = segments.find(s => s.text === 'green bg');
    expect(seg).toBeDefined();
    expect(seg!.style.background).toBeDefined();
    expect(seg!.style.background!.mode).toBe('named');
    expect(seg!.style.background!.value).toBe(2); // green
  });

  test('all standard background colors (40-47)', () => {
    for (let code = 40; code <= 47; code++) {
      const input = `${ESC}[${code}mbg${ESC}[0m`;
      const span = parseAnsiToTextSpan(input);
      const segments = collectSegments(span);
      const seg = segments.find(s => s.text === 'bg');
      expect(seg).toBeDefined();
      expect(seg!.style.background!.value).toBe(code - 40);
    }
  });
});

// ============================================================================
// Mixed styles
// ============================================================================

describe('ANSI parser: mixed styles', () => {
  test('bold + red foreground', () => {
    const input = `${ESC}[1;31mBold Red${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('Bold Red');

    const segments = collectSegments(span);
    const seg = segments.find(s => s.text === 'Bold Red');
    expect(seg).toBeDefined();
    expect(seg!.style.bold).toBe(true);
    expect(seg!.style.foreground!.value).toBe(1); // red
  });

  test('italic + underline + blue bg', () => {
    const input = `${ESC}[3;4;44mStyled${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);

    const segments = collectSegments(span);
    const seg = segments.find(s => s.text === 'Styled');
    expect(seg).toBeDefined();
    expect(seg!.style.italic).toBe(true);
    expect(seg!.style.underline).toBe(true);
    expect(seg!.style.background!.value).toBe(4); // blue
  });

  test('sequential styles: bold then italic', () => {
    const input = `${ESC}[1mBold${ESC}[3m+Italic${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('Bold+Italic');

    const segments = collectSegments(span);
    // "Bold" should be bold only
    const boldSeg = segments.find(s => s.text === 'Bold');
    expect(boldSeg).toBeDefined();
    expect(boldSeg!.style.bold).toBe(true);

    // "+Italic" should be bold + italic
    const italicSeg = segments.find(s => s.text === '+Italic');
    expect(italicSeg).toBeDefined();
    expect(italicSeg!.style.bold).toBe(true);
    expect(italicSeg!.style.italic).toBe(true);
  });

  test('dim + strikethrough', () => {
    const input = `${ESC}[2;9mDimStrike${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);

    const segments = collectSegments(span);
    const seg = segments.find(s => s.text === 'DimStrike');
    expect(seg).toBeDefined();
    expect(seg!.style.dim).toBe(true);
    expect(seg!.style.strikethrough).toBe(true);
  });
});

// ============================================================================
// Reset (SGR 0)
// ============================================================================

describe('ANSI parser: reset', () => {
  test('reset clears all styles', () => {
    const input = `${ESC}[1;31mBold Red${ESC}[0mPlain`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('Bold RedPlain');

    const segments = collectSegments(span);
    const plainSeg = segments.find(s => s.text === 'Plain');
    expect(plainSeg).toBeDefined();
    // After reset, no styling should be applied
    expect(plainSeg!.style.bold).toBeUndefined();
    expect(plainSeg!.style.foreground).toBeUndefined();
  });

  test('ESC[m without params acts as reset', () => {
    const input = `${ESC}[1mBold${ESC}[mNormal`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('BoldNormal');

    const segments = collectSegments(span);
    const normalSeg = segments.find(s => s.text === 'Normal');
    expect(normalSeg).toBeDefined();
    expect(normalSeg!.style.bold).toBeUndefined();
  });
});

// ============================================================================
// OSC 8 hyperlinks
// ============================================================================

describe('ANSI parser: OSC 8 hyperlinks', () => {
  test('parse hyperlink with BEL terminator', () => {
    const input = `${ESC}]8;;https://example.com${BEL}Link Text${ESC}]8;;${BEL}`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('Link Text');
  });

  test('parse hyperlink with ESC\\ terminator', () => {
    const input = `${ESC}]8;;https://example.com${ESC}\\Link Text${ESC}]8;;${ESC}\\`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('Link Text');
  });

  test('hyperlink with id parameter', () => {
    const input = `Before${ESC}]8;id=mylink;https://example.com${BEL}Link${ESC}]8;;${BEL}After`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('BeforeLinkAfter');
  });
});

// ============================================================================
// Roundtrip: parse ANSI string, extract plain text
// ============================================================================

describe('ANSI parser: roundtrip plain text', () => {
  test('complex styled string yields correct plain text', () => {
    const input = [
      `${ESC}[1mBold${ESC}[0m `,
      `${ESC}[31mRed${ESC}[0m `,
      `${ESC}[3;4mItalic Underline${ESC}[0m `,
      `${ESC}[38;2;100;200;50mRGB${ESC}[0m `,
      `${ESC}[38;5;196m256color${ESC}[0m `,
      `Normal`,
    ].join('');

    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe(
      'Bold Red Italic Underline RGB 256color Normal',
    );
  });

  test('no escape sequences returns original text', () => {
    const original = 'Just plain text with no ANSI codes at all.';
    const span = parseAnsiToTextSpan(original);
    expect(span.toPlainText()).toBe(original);
  });

  test('escape codes produce zero-width in plain text', () => {
    // All escape sequences should be stripped, leaving only visible text
    const input = `${ESC}[1;31;42mHello${ESC}[0m`;
    const span = parseAnsiToTextSpan(input);
    expect(span.toPlainText()).toBe('Hello');
  });
});
