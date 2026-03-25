// Mouse button constants and SGR mouse parsing helpers
// Amp ref: input-system.md Section 4.3, Section 6.2

/**
 * Mouse button codes matching SGR protocol.
 * Amp ref: input-system.md Section 4.3
 */
export const MouseButton = {
  Left: 0,
  Middle: 1,
  Right: 2,
  ScrollUp: 64,
  ScrollDown: 65,
  ScrollLeft: 66,
  ScrollRight: 67,
} as const;

export type MouseButtonCode = (typeof MouseButton)[keyof typeof MouseButton];

/**
 * Modifier bits in the SGR button code.
 * Amp ref: input-system.md Section 4.3
 *   +4  = Shift modifier
 *   +8  = Meta/Alt modifier
 *   +16 = Ctrl modifier
 *   +32 = Motion (mouse moved with button held)
 */
export const MouseModifier = {
  Shift: 4,
  Alt: 8,
  Ctrl: 16,
  Motion: 32,
} as const;

/**
 * Extract modifier flags from an SGR button code.
 * The button code contains both the button identity and modifier bits.
 */
export function extractMouseModifiers(buttonCode: number): {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
  motion: boolean;
} {
  return {
    shift: !!(buttonCode & MouseModifier.Shift),
    alt: !!(buttonCode & MouseModifier.Alt),
    ctrl: !!(buttonCode & MouseModifier.Ctrl),
    motion: !!(buttonCode & MouseModifier.Motion),
  };
}

/**
 * Extract the base button identity (without modifier bits) from an SGR button code.
 * Strips the modifier bits (4, 8, 16) and motion bit (32) from the code.
 *
 * Button encoding:
 *   0-2 = standard buttons (left, middle, right)
 *   3   = release (in X10 mode, not SGR)
 *   64-67 = scroll buttons
 */
export function extractBaseButton(buttonCode: number): number {
  // Scroll events use bits 6-7 (value 64+), keep those
  // Standard buttons use bits 0-1 (value 0-2)
  // Modifier bits: 2 (shift=4), 3 (alt=8), 4 (ctrl=16), 5 (motion=32)
  const stripped = buttonCode & ~(MouseModifier.Shift | MouseModifier.Alt | MouseModifier.Ctrl | MouseModifier.Motion);
  return stripped;
}

/**
 * Determine the mouse action from button code and final character.
 * Amp ref: input-system.md Section 4.3
 *   M = press/motion
 *   m = release
 */
export function determineMouseAction(
  buttonCode: number,
  final: string,
): 'press' | 'release' | 'move' | 'scroll' {
  // Release is indicated by lowercase 'm'
  if (final === 'm') {
    return 'release';
  }

  const baseButton = extractBaseButton(buttonCode);

  // Scroll events (button codes 64-67)
  if (baseButton >= 64 && baseButton <= 67) {
    return 'scroll';
  }

  // Motion bit set = mouse move
  if (buttonCode & MouseModifier.Motion) {
    return 'move';
  }

  return 'press';
}

/**
 * Check if a button code represents a scroll event.
 */
export function isScrollButton(buttonCode: number): boolean {
  const base = extractBaseButton(buttonCode);
  return base >= 64 && base <= 67;
}
