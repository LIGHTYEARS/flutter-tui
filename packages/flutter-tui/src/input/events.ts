// Input event types — discriminated union for terminal input events
// Amp ref: input-system.md Section 5.2, Section 6.1

/**
 * Key event from the escape sequence parser (emitKeys).
 * Amp ref: amp-strings.txt:241763-241768
 */
export interface KeyEvent {
  readonly type: 'key';
  /** Logical key name: "ArrowUp", "Enter", "a", "Escape", "f1", etc. */
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
  readonly metaKey: boolean;
  /** Raw escape sequence that produced this event */
  readonly sequence?: string;
}

/**
 * Mouse event from SGR mouse protocol.
 * Amp ref: input-system.md Section 4.3
 */
export interface MouseEvent {
  readonly type: 'mouse';
  readonly action: 'press' | 'release' | 'move' | 'scroll';
  /**
   * Button code: 0=left, 1=middle, 2=right,
   * 64=scrollUp, 65=scrollDown, 66=scrollLeft, 67=scrollRight
   */
  readonly button: number;
  /** Column, 0-based */
  readonly x: number;
  /** Row, 0-based */
  readonly y: number;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
}

/**
 * Terminal resize event (SIGWINCH).
 * Amp ref: input-system.md Section 10
 */
export interface ResizeEvent {
  readonly type: 'resize';
  readonly width: number;
  readonly height: number;
}

/**
 * Terminal focus tracking event.
 * Enabled via \x1b[?1004h, disabled via \x1b[?1004l.
 */
export interface FocusEvent {
  readonly type: 'focus';
  readonly focused: boolean;
}

/**
 * Bracketed paste event.
 * Amp ref: input-system.md Section 11
 */
export interface PasteEvent {
  readonly type: 'paste';
  readonly text: string;
}

/**
 * Discriminated union of all terminal input events.
 * Use the `type` field for narrowing.
 */
export type InputEvent = KeyEvent | MouseEvent | ResizeEvent | FocusEvent | PasteEvent;

/**
 * Result of a key event handler in the focus system.
 * "handled" stops propagation, "ignored" bubbles up.
 * Amp ref: input-system.md Section 5.2
 */
export type KeyEventResult = 'handled' | 'ignored';

// -- Factory helpers for creating events --

export function createKeyEvent(
  key: string,
  options?: {
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    sequence?: string;
  },
): KeyEvent {
  return {
    type: 'key',
    key,
    ctrlKey: options?.ctrlKey ?? false,
    altKey: options?.altKey ?? false,
    shiftKey: options?.shiftKey ?? false,
    metaKey: options?.metaKey ?? false,
    sequence: options?.sequence,
  };
}

export function createMouseEvent(
  action: MouseEvent['action'],
  button: number,
  x: number,
  y: number,
  options?: {
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
  },
): MouseEvent {
  return {
    type: 'mouse',
    action,
    button,
    x,
    y,
    ctrlKey: options?.ctrlKey ?? false,
    altKey: options?.altKey ?? false,
    shiftKey: options?.shiftKey ?? false,
  };
}

export function createResizeEvent(width: number, height: number): ResizeEvent {
  return { type: 'resize', width, height };
}

export function createFocusEvent(focused: boolean): FocusEvent {
  return { type: 'focus', focused };
}

export function createPasteEvent(text: string): PasteEvent {
  return { type: 'paste', text };
}
