// ANSI escape sequence parser — converts ANSI-styled strings into TextSpan trees
// Amp ref: TERM-06 requirement
// Supports SGR codes (bold, dim, italic, underline, strikethrough, colors)
// and OSC 8 hyperlinks.

import { TextSpan } from '../core/text-span';
import { TextStyle } from '../core/text-style';
import { Color } from '../core/color';

// ---------------------------------------------------------------------------
// Hyperlink data extracted from OSC 8
// ---------------------------------------------------------------------------

export interface HyperlinkData {
  uri: string;
  id?: string;
}

// ---------------------------------------------------------------------------
// Internal style state tracker
// ---------------------------------------------------------------------------

interface StyleState {
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  foreground?: Color;
  background?: Color;
}

function styleStateToTextStyle(state: StyleState): TextStyle {
  return new TextStyle({
    bold: state.bold,
    dim: state.dim,
    italic: state.italic,
    underline: state.underline,
    strikethrough: state.strikethrough,
    foreground: state.foreground,
    background: state.background,
  });
}

function isStyleEmpty(state: StyleState): boolean {
  return (
    state.bold === undefined &&
    state.dim === undefined &&
    state.italic === undefined &&
    state.underline === undefined &&
    state.strikethrough === undefined &&
    state.foreground === undefined &&
    state.background === undefined
  );
}

function cloneStyleState(state: StyleState): StyleState {
  return { ...state };
}

// ---------------------------------------------------------------------------
// ESC and control constants
// ---------------------------------------------------------------------------

const ESC = '\x1b';
const BEL = '\x07';

// Named colors for SGR 30-37
const SGR_FG_COLORS: Color[] = [
  Color.named(0), // 30: black
  Color.named(1), // 31: red
  Color.named(2), // 32: green
  Color.named(3), // 33: yellow
  Color.named(4), // 34: blue
  Color.named(5), // 35: magenta
  Color.named(6), // 36: cyan
  Color.named(7), // 37: white
];

// Bright colors for SGR 90-97
const SGR_FG_BRIGHT_COLORS: Color[] = [
  Color.named(8),  // 90: bright black
  Color.named(9),  // 91: bright red
  Color.named(10), // 92: bright green
  Color.named(11), // 93: bright yellow
  Color.named(12), // 94: bright blue
  Color.named(13), // 95: bright magenta
  Color.named(14), // 96: bright cyan
  Color.named(15), // 97: bright white
];

// Background colors for SGR 40-47
const SGR_BG_COLORS: Color[] = [
  Color.named(0), // 40: black
  Color.named(1), // 41: red
  Color.named(2), // 42: green
  Color.named(3), // 43: yellow
  Color.named(4), // 44: blue
  Color.named(5), // 45: magenta
  Color.named(6), // 46: cyan
  Color.named(7), // 47: white
];

// Bright background for SGR 100-107
const SGR_BG_BRIGHT_COLORS: Color[] = [
  Color.named(8),  // 100
  Color.named(9),  // 101
  Color.named(10), // 102
  Color.named(11), // 103
  Color.named(12), // 104
  Color.named(13), // 105
  Color.named(14), // 106
  Color.named(15), // 107
];

// ---------------------------------------------------------------------------
// parseAnsiToTextSpan
// ---------------------------------------------------------------------------

/**
 * Parse a string containing ANSI escape codes into a styled TextSpan tree.
 *
 * Supported sequences:
 * - SGR (Select Graphic Rendition): ESC[...m
 *   0=reset, 1=bold, 2=dim, 3=italic, 4=underline, 9=strikethrough
 *   30-37: foreground, 40-47: background
 *   38;2;R;G;B: RGB foreground, 48;2;R;G;B: RGB background
 *   38;5;N: 256-color foreground, 48;5;N: 256-color background
 *   90-97: bright foreground, 100-107: bright background
 *
 * - OSC 8 hyperlinks: ESC]8;params;URI ST
 *   ST = ESC\ or BEL
 *
 * Returns a TextSpan with children for each styled segment.
 */
export function parseAnsiToTextSpan(input: string): TextSpan {
  if (input.length === 0) {
    return new TextSpan({ text: '' });
  }

  const children: TextSpan[] = [];
  let currentStyle: StyleState = {};
  let currentHyperlink: HyperlinkData | undefined;
  let textBuffer = '';
  let i = 0;

  function flushText(): void {
    if (textBuffer.length === 0) return;
    const style = isStyleEmpty(currentStyle) ? undefined : styleStateToTextStyle(currentStyle);
    children.push(new TextSpan({ text: textBuffer, style }));
    textBuffer = '';
  }

  while (i < input.length) {
    const ch = input[i];

    if (ch === ESC && i + 1 < input.length) {
      const next = input[i + 1];

      if (next === '[') {
        // CSI sequence (SGR)
        i += 2; // skip ESC[
        const { params, finalChar, endIndex } = parseCSI(input, i);
        i = endIndex;

        if (finalChar === 'm') {
          // SGR — apply style changes
          flushText();
          applySGR(params, currentStyle);
          // After reset, currentStyle may have changed
        }
        // Ignore non-SGR CSI sequences
        continue;
      }

      if (next === ']') {
        // OSC sequence
        i += 2; // skip ESC]
        const { oscNumber, oscData, endIndex } = parseOSC(input, i);
        i = endIndex;

        if (oscNumber === 8) {
          flushText();
          // OSC 8: hyperlink
          // Format: 8;params;URI
          const parts = oscData.split(';');
          if (parts.length >= 2) {
            const paramStr = parts[0] ?? '';
            const uri = parts.slice(1).join(';');
            if (uri.length > 0) {
              currentHyperlink = { uri };
              // Extract id from params if present
              if (paramStr.length > 0) {
                const paramPairs = paramStr.split(':');
                for (const pair of paramPairs) {
                  const eqIdx = pair.indexOf('=');
                  if (eqIdx >= 0) {
                    const key = pair.slice(0, eqIdx);
                    const value = pair.slice(eqIdx + 1);
                    if (key === 'id') {
                      currentHyperlink.id = value;
                    }
                  }
                }
              }
            } else {
              // Empty URI means end of hyperlink
              currentHyperlink = undefined;
            }
          }
        }
        continue;
      }
    }

    // Regular character — add to text buffer
    textBuffer += ch;
    i++;
  }

  // Flush remaining text
  flushText();

  // If only one child with no style, return it directly
  if (children.length === 0) {
    return new TextSpan({ text: '' });
  }
  if (children.length === 1) {
    return children[0]!;
  }

  return new TextSpan({ children });
}

// ---------------------------------------------------------------------------
// CSI (Control Sequence Introducer) parser
// ---------------------------------------------------------------------------

function parseCSI(
  input: string,
  start: number,
): { params: number[]; finalChar: string; endIndex: number } {
  let i = start;
  let paramStr = '';

  // Collect parameter bytes (0x30-0x3F: digits, semicolons, etc.)
  while (i < input.length) {
    const code = input.charCodeAt(i);
    if (code >= 0x30 && code <= 0x3f) {
      paramStr += input[i];
      i++;
    } else {
      break;
    }
  }

  // Skip intermediate bytes (0x20-0x2F)
  while (i < input.length) {
    const code = input.charCodeAt(i);
    if (code >= 0x20 && code <= 0x2f) {
      i++;
    } else {
      break;
    }
  }

  // Final byte (0x40-0x7E)
  let finalChar = '';
  if (i < input.length) {
    finalChar = input[i]!;
    i++;
  }

  // Parse parameters
  const params: number[] = [];
  if (paramStr.length > 0) {
    const parts = paramStr.split(';');
    for (const part of parts) {
      const n = parseInt(part, 10);
      params.push(isNaN(n) ? 0 : n);
    }
  }

  return { params, finalChar, endIndex: i };
}

// ---------------------------------------------------------------------------
// OSC (Operating System Command) parser
// ---------------------------------------------------------------------------

function parseOSC(
  input: string,
  start: number,
): { oscNumber: number; oscData: string; endIndex: number } {
  let i = start;
  let numberStr = '';

  // Read OSC number (digits)
  while (i < input.length && input[i]! >= '0' && input[i]! <= '9') {
    numberStr += input[i];
    i++;
  }

  const oscNumber = parseInt(numberStr, 10) || 0;

  // Skip the separator (usually ';')
  if (i < input.length && input[i] === ';') {
    i++;
  }

  // Read OSC data until ST (ESC\ or BEL)
  let data = '';
  while (i < input.length) {
    if (input[i] === BEL) {
      i++; // consume BEL
      break;
    }
    if (input[i] === ESC && i + 1 < input.length && input[i + 1] === '\\') {
      i += 2; // consume ESC\
      break;
    }
    data += input[i];
    i++;
  }

  return { oscNumber, oscData: data, endIndex: i };
}

// ---------------------------------------------------------------------------
// SGR (Select Graphic Rendition) applier
// ---------------------------------------------------------------------------

function applySGR(params: number[], state: StyleState): void {
  if (params.length === 0) {
    // ESC[m with no params is equivalent to reset
    resetStyle(state);
    return;
  }

  let i = 0;
  while (i < params.length) {
    const code = params[i]!;

    switch (code) {
      case 0: // Reset
        resetStyle(state);
        break;
      case 1: // Bold
        state.bold = true;
        break;
      case 2: // Dim
        state.dim = true;
        break;
      case 3: // Italic
        state.italic = true;
        break;
      case 4: // Underline
        state.underline = true;
        break;
      case 9: // Strikethrough
        state.strikethrough = true;
        break;
      case 22: // Normal intensity (not bold, not dim)
        state.bold = undefined;
        state.dim = undefined;
        break;
      case 23: // Not italic
        state.italic = undefined;
        break;
      case 24: // Not underline
        state.underline = undefined;
        break;
      case 29: // Not strikethrough
        state.strikethrough = undefined;
        break;

      // Foreground colors 30-37
      case 30: case 31: case 32: case 33:
      case 34: case 35: case 36: case 37:
        state.foreground = SGR_FG_COLORS[code - 30];
        break;

      case 38: {
        // Extended foreground color
        const result = parseExtendedColor(params, i + 1);
        if (result.color) state.foreground = result.color;
        i = result.nextIndex - 1; // -1 because loop will i++
        break;
      }

      case 39: // Default foreground
        state.foreground = undefined;
        break;

      // Background colors 40-47
      case 40: case 41: case 42: case 43:
      case 44: case 45: case 46: case 47:
        state.background = SGR_BG_COLORS[code - 40];
        break;

      case 48: {
        // Extended background color
        const result = parseExtendedColor(params, i + 1);
        if (result.color) state.background = result.color;
        i = result.nextIndex - 1;
        break;
      }

      case 49: // Default background
        state.background = undefined;
        break;

      // Bright foreground colors 90-97
      case 90: case 91: case 92: case 93:
      case 94: case 95: case 96: case 97:
        state.foreground = SGR_FG_BRIGHT_COLORS[code - 90];
        break;

      // Bright background colors 100-107
      case 100: case 101: case 102: case 103:
      case 104: case 105: case 106: case 107:
        state.background = SGR_BG_BRIGHT_COLORS[code - 100];
        break;

      default:
        // Unknown code — ignore
        break;
    }

    i++;
  }
}

function resetStyle(state: StyleState): void {
  state.bold = undefined;
  state.dim = undefined;
  state.italic = undefined;
  state.underline = undefined;
  state.strikethrough = undefined;
  state.foreground = undefined;
  state.background = undefined;
}

function parseExtendedColor(
  params: number[],
  startIndex: number,
): { color: Color | undefined; nextIndex: number } {
  if (startIndex >= params.length) {
    return { color: undefined, nextIndex: startIndex };
  }

  const mode = params[startIndex]!;

  if (mode === 5) {
    // 256-color: 38;5;N or 48;5;N
    if (startIndex + 1 < params.length) {
      const colorIndex = params[startIndex + 1]!;
      if (colorIndex >= 0 && colorIndex <= 255) {
        return { color: Color.ansi256(colorIndex), nextIndex: startIndex + 2 };
      }
    }
    return { color: undefined, nextIndex: startIndex + 2 };
  }

  if (mode === 2) {
    // RGB: 38;2;R;G;B or 48;2;R;G;B
    if (startIndex + 3 < params.length) {
      const r = params[startIndex + 1]!;
      const g = params[startIndex + 2]!;
      const b = params[startIndex + 3]!;
      return { color: Color.rgb(r, g, b), nextIndex: startIndex + 4 };
    }
    return { color: undefined, nextIndex: startIndex + 4 };
  }

  return { color: undefined, nextIndex: startIndex + 1 };
}
