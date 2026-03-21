// Vendored wcwidth implementation for terminal column width calculation.
// No external dependencies.

/**
 * Returns the display width of a Unicode code point in terminal columns.
 * - 0 for control characters and zero-width characters
 * - 2 for CJK, fullwidth, and wide characters
 * - 1 for everything else
 */
export function wcwidth(codePoint: number): number {
  // Control characters: 0x00-0x1F (except 0x00 which we treat as 0), 0x7F-0x9F
  if (codePoint < 0x20) return 0;
  if (codePoint >= 0x7F && codePoint <= 0x9F) return 0;

  // Zero-width characters
  if (isZeroWidth(codePoint)) return 0;

  // Wide / fullwidth characters
  if (isWide(codePoint)) return 2;

  return 1;
}

/**
 * Compute the total display width of a string by iterating over its codepoints.
 */
export function stringWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    const cp = char.codePointAt(0)!;
    width += wcwidth(cp);
  }
  return width;
}

function isZeroWidth(cp: number): boolean {
  // Combining diacritical marks and similar zero-width characters
  if (cp === 0x200B) return true; // Zero Width Space
  if (cp === 0x200C) return true; // Zero Width Non-Joiner
  if (cp === 0x200D) return true; // Zero Width Joiner
  if (cp === 0xFEFF) return true; // Zero Width No-Break Space (BOM)
  if (cp === 0x2060) return true; // Word Joiner
  if (cp === 0x00AD) return true; // Soft Hyphen

  // Combining Diacritical Marks
  if (cp >= 0x0300 && cp <= 0x036F) return true;
  // Combining Diacritical Marks Extended
  if (cp >= 0x1AB0 && cp <= 0x1AFF) return true;
  // Combining Diacritical Marks Supplement
  if (cp >= 0x1DC0 && cp <= 0x1DFF) return true;
  // Combining Diacritical Marks for Symbols
  if (cp >= 0x20D0 && cp <= 0x20FF) return true;
  // Combining Half Marks
  if (cp >= 0xFE20 && cp <= 0xFE2F) return true;

  // Variation selectors
  if (cp >= 0xFE00 && cp <= 0xFE0F) return true;
  // Variation Selectors Supplement
  if (cp >= 0xE0100 && cp <= 0xE01EF) return true;

  return false;
}

function isWide(cp: number): boolean {
  // Hangul Jamo
  if (cp >= 0x1100 && cp <= 0x115F) return true;

  // CJK Radicals Supplement, Kangxi Radicals, CJK Symbols and Punctuation
  if (cp >= 0x2E80 && cp <= 0x303E) return true;

  // Hiragana, Katakana, Bopomofo, Hangul Compatibility Jamo,
  // Kanbun, Bopomofo Extended, CJK Strokes, Katakana Phonetic Ext,
  // Enclosed CJK, CJK Compatibility
  if (cp >= 0x3040 && cp <= 0x33FF) return true;

  // CJK Unified Ideographs Extension A
  if (cp >= 0x3400 && cp <= 0x4DBF) return true;

  // CJK Unified Ideographs
  if (cp >= 0x4E00 && cp <= 0x9FFF) return true;

  // Yi Syllables, Yi Radicals
  if (cp >= 0xA000 && cp <= 0xA4CF) return true;

  // Hangul Jamo Extended-A
  if (cp >= 0xA960 && cp <= 0xA97F) return true;

  // Hangul Syllables
  if (cp >= 0xAC00 && cp <= 0xD7AF) return true;

  // CJK Compatibility Ideographs
  if (cp >= 0xF900 && cp <= 0xFAFF) return true;

  // CJK Compatibility Forms, Small Form Variants
  if (cp >= 0xFE10 && cp <= 0xFE6F) return true;

  // Fullwidth Forms (excluding halfwidth range FF61-FFDC)
  if (cp >= 0xFF01 && cp <= 0xFF60) return true;

  // Fullwidth Signs
  if (cp >= 0xFFE0 && cp <= 0xFFE6) return true;

  // Emoji (various blocks treated as width 2)
  if (cp >= 0x1F000 && cp <= 0x1F9FF) return true;

  // Additional emoji blocks
  if (cp >= 0x1FA00 && cp <= 0x1FA6F) return true;
  if (cp >= 0x1FA70 && cp <= 0x1FAFF) return true;

  // CJK Extension B and beyond
  if (cp >= 0x20000 && cp <= 0x2FFFF) return true;

  // CJK Extension G and beyond
  if (cp >= 0x30000 && cp <= 0x3FFFF) return true;

  return false;
}
