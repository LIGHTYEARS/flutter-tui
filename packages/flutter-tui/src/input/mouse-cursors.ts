// SystemMouseCursors — standard cursor shapes for TUI
// Amp ref: gg class — cursor shape constants and ANSI escape mapping
//
// In terminal environments, cursor shape is controlled via DECSCUSR
// (DEC Set Cursor Style) escape sequences: \x1b[N q
// where N is the style number.

/**
 * Standard system mouse cursor constants.
 * Amp ref: gg class (cursor shape registry)
 */
export const SystemMouseCursors = {
  /** Normal arrow/block cursor */
  DEFAULT: 'default',
  /** Hand/link cursor (pointer for clickable elements) */
  POINTER: 'pointer',
  /** I-beam cursor (text selection) */
  TEXT: 'text',
  /** Hidden cursor */
  NONE: 'none',
} as const;

export type SystemMouseCursorType =
  (typeof SystemMouseCursors)[keyof typeof SystemMouseCursors];

/**
 * Map a cursor string to a terminal ANSI escape sequence (DECSCUSR).
 *
 * Terminal cursor shapes via DECSCUSR (\x1b[N q):
 *   0 = default (blinking block)
 *   1 = blinking block
 *   2 = steady block
 *   3 = blinking underline
 *   4 = steady underline
 *   5 = blinking bar (I-beam)
 *   6 = steady bar (I-beam)
 *
 * For 'none', we use DECTCEM hide (\x1b[?25l).
 * For 'default', we restore with DECTCEM show (\x1b[?25h) + reset shape.
 *
 * Amp ref: gg cursorToAnsi
 *
 * @param cursor Cursor name string (from SystemMouseCursors or custom)
 * @returns ANSI escape sequence string, or empty string if unknown
 */
export function cursorToAnsi(cursor: string): string {
  switch (cursor) {
    case SystemMouseCursors.DEFAULT:
      // Show cursor + default shape (blinking block)
      return '\x1b[?25h\x1b[0 q';
    case SystemMouseCursors.POINTER:
      // Show cursor + steady block (closest to "hand" in terminal)
      return '\x1b[?25h\x1b[2 q';
    case SystemMouseCursors.TEXT:
      // Show cursor + steady bar (I-beam)
      return '\x1b[?25h\x1b[6 q';
    case SystemMouseCursors.NONE:
      // Hide cursor
      return '\x1b[?25l';
    default:
      // Unknown cursor — return empty string (no change)
      return '';
  }
}
