/**
 * termshot — ScreenBuffer → SVG serializer for visual regression testing.
 *
 * Reads the committed front buffer from WidgetsBinding after a headless
 * drawFrameSync(), converts Cell[][] to an SVG with per-cell coloring,
 * bold/italic/dim/underline/strikethrough styling, and cursor rendering.
 *
 * The SVG uses a monospace <text> grid. Each styled run (contiguous cells
 * with identical CellStyle) becomes one <text> element to minimize DOM size.
 * Background colors are rendered as <rect> elements behind the text.
 *
 * Usage:
 *   const svg = bufferToSvg(binding.getScreen().getFrontBuffer(), { cols, rows });
 *   fs.writeFileSync('snapshot.svg', svg);
 */

import { type Cell, EMPTY_CELL, type CellStyle } from 'flitter-core/src/terminal/cell';
import { Color } from 'flitter-core/src/core/color';
import type { Buffer as ScreenBufferGrid } from 'flitter-core/src/terminal/screen-buffer';

// ── Theme: Default dark palette (matches Ghostty/Kitty defaults) ─────────

/** Standard 16-color palette → CSS hex. Users can override via SvgConfig.palette. */
const DEFAULT_PALETTE: readonly string[] = [
  '#1d1f21', // 0  black
  '#cc6666', // 1  red
  '#b5bd68', // 2  green
  '#f0c674', // 3  yellow
  '#81a2be', // 4  blue
  '#b294bb', // 5  magenta
  '#8abeb7', // 6  cyan
  '#c5c8c6', // 7  white
  '#969896', // 8  bright black
  '#cc6666', // 9  bright red
  '#b5bd68', // 10 bright green
  '#f0c674', // 11 bright yellow
  '#81a2be', // 12 bright blue
  '#b294bb', // 13 bright magenta
  '#8abeb7', // 14 bright cyan
  '#ffffff', // 15 bright white
];

// ── 256-color → RGB hex lookup ───────────────────────────────────────────

function buildAnsi256Hex(): string[] {
  const table: string[] = [];

  // 0-15: copy from palette
  for (let i = 0; i < 16; i++) {
    table.push(DEFAULT_PALETTE[i]!);
  }

  // 16-231: 6×6×6 color cube
  const cubeValues = [0, 95, 135, 175, 215, 255];
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        table.push(
          `#${hex2(cubeValues[r]!)}${hex2(cubeValues[g]!)}${hex2(cubeValues[b]!)}`,
        );
      }
    }
  }

  // 232-255: grayscale ramp
  for (let i = 0; i < 24; i++) {
    const v = 8 + i * 10;
    table.push(`#${hex2(v)}${hex2(v)}${hex2(v)}`);
  }

  return table;
}

function hex2(n: number): string {
  return n.toString(16).padStart(2, '0');
}

const ANSI256_HEX = buildAnsi256Hex();

// ── SVG Configuration ────────────────────────────────────────────────────

export interface SvgConfig {
  /** Cell width in px. Default 8.4 (matches ~14px monospace at 600dpi). */
  cellWidth?: number;
  /** Cell height in px. Default 18. */
  cellHeight?: number;
  /** Padding around the terminal area in px. Default 12. */
  padding?: number;
  /** Font family. Default "JetBrains Mono, Menlo, monospace". */
  fontFamily?: string;
  /** Font size in px. Default 14. */
  fontSize?: number;
  /** Default background color (CSS). Default "#1a1b26" (Tokyo Night). */
  defaultBg?: string;
  /** Default foreground color (CSS). Default "#c0caf5" (Tokyo Night). */
  defaultFg?: string;
  /** 16-color palette override. Array of 16 CSS color strings. */
  palette?: string[];
  /** Show cursor. Default true. */
  showCursor?: boolean;
  /** Cursor color (CSS). Default "#c0caf5". */
  cursorColor?: string;
  /** Window title to display in title bar. Omit for no title bar. */
  title?: string;
  /** Corner radius for the window frame. Default 8. */
  borderRadius?: number;
}

const DEFAULT_CONFIG: Required<SvgConfig> = {
  cellWidth: 8.4,
  cellHeight: 18,
  padding: 12,
  fontFamily: 'JetBrains Mono, Menlo, Consolas, monospace',
  fontSize: 14,
  defaultBg: '#1a1b26',
  defaultFg: '#c0caf5',
  palette: [...DEFAULT_PALETTE],
  showCursor: true,
  cursorColor: '#c0caf5',
  title: '',
  borderRadius: 8,
};

// ── Color → CSS ──────────────────────────────────────────────────────────

function colorToCss(
  color: Color | undefined,
  palette: string[],
  fallback: string,
): string {
  if (!color) return fallback;

  switch (color.mode) {
    case 'named': {
      if (color.value === -1) return fallback; // default color
      if (color.value >= 0 && color.value < 16) return palette[color.value] ?? fallback;
      return fallback;
    }
    case 'ansi256': {
      // Use palette for 0-15, lookup table for 16-255
      if (color.value < 16) return palette[color.value] ?? fallback;
      return ANSI256_HEX[color.value] ?? fallback;
    }
    case 'rgb': {
      const r = (color.value >> 16) & 0xff;
      const g = (color.value >> 8) & 0xff;
      const b = color.value & 0xff;
      if (color.alpha < 1.0) {
        return `rgba(${r},${g},${b},${color.alpha.toFixed(2)})`;
      }
      return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
    }
  }
}

// ── XML escaping ─────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Styled run: contiguous cells with same style ─────────────────────────

interface StyledRun {
  col: number;       // starting column
  text: string;      // concatenated graphemes
  style: CellStyle;  // shared style for all cells in this run
  cellCount: number; // number of columns consumed (includes wide chars)
}

/**
 * Group cells in a row into StyledRuns — contiguous cells with identical
 * CellStyle are merged into a single run. Trailing spaces are included
 * (they may have background color).
 */
function rowToRuns(buffer: ScreenBufferGrid, row: number): StyledRun[] {
  const runs: StyledRun[] = [];
  const width = buffer.width;

  let currentRun: StyledRun | null = null;

  for (let col = 0; col < width; ) {
    const cell = buffer.getCell(col, row);

    // Skip continuation cells (width === 0, trailing part of wide char)
    if (cell.width === 0) {
      col++;
      continue;
    }

    if (currentRun && stylesMatch(currentRun.style, cell.style)) {
      // Extend current run
      currentRun.text += cell.char;
      currentRun.cellCount += Math.max(1, cell.width);
    } else {
      // Start new run
      if (currentRun) runs.push(currentRun);
      currentRun = {
        col,
        text: cell.char,
        style: cell.style,
        cellCount: Math.max(1, cell.width),
      };
    }

    col += Math.max(1, cell.width);
  }

  if (currentRun) runs.push(currentRun);
  return runs;
}

function stylesMatch(a: CellStyle, b: CellStyle): boolean {
  // Quick identity check
  if (a === b) return true;

  return (
    colorEquals(a.fg, b.fg) &&
    colorEquals(a.bg, b.bg) &&
    (a.bold ?? false) === (b.bold ?? false) &&
    (a.italic ?? false) === (b.italic ?? false) &&
    (a.underline ?? false) === (b.underline ?? false) &&
    (a.strikethrough ?? false) === (b.strikethrough ?? false) &&
    (a.dim ?? false) === (b.dim ?? false) &&
    (a.inverse ?? false) === (b.inverse ?? false)
  );
}

function colorEquals(
  a: Color | undefined,
  b: Color | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.equals(b);
}

// ── Title bar rendering ──────────────────────────────────────────────────

function renderTitleBar(
  cfg: Required<SvgConfig>,
  totalWidth: number,
): { svg: string; height: number } {
  if (!cfg.title) return { svg: '', height: 0 };

  const barHeight = 36;
  const circleY = barHeight / 2;
  const circleR = 6;

  let svg = '';

  // Title bar background
  svg += `<rect x="0" y="0" width="${totalWidth}" height="${barHeight}" fill="#2a2a3a" rx="${cfg.borderRadius}" ry="${cfg.borderRadius}"/>`;
  // Bottom cover (sharp bottom corners for the title bar)
  svg += `<rect x="0" y="${barHeight / 2}" width="${totalWidth}" height="${barHeight / 2}" fill="#2a2a3a"/>`;

  // Traffic light buttons
  svg += `<circle cx="20" cy="${circleY}" r="${circleR}" fill="#ff5f57"/>`;
  svg += `<circle cx="40" cy="${circleY}" r="${circleR}" fill="#febc2e"/>`;
  svg += `<circle cx="60" cy="${circleY}" r="${circleR}" fill="#28c840"/>`;

  // Title text
  svg += `<text x="${totalWidth / 2}" y="${circleY + 5}" text-anchor="middle" font-family="${cfg.fontFamily}" font-size="12" fill="#888">${escapeXml(cfg.title)}</text>`;

  return { svg, height: barHeight };
}

// ── Main export: bufferToSvg ─────────────────────────────────────────────

/**
 * Convert a ScreenBuffer's Buffer (front or back) to an SVG string.
 *
 * @param buffer - The Buffer grid to render (typically getFrontBuffer() after drawFrameSync+present)
 * @param config - Optional SVG rendering configuration
 * @param cursor - Optional cursor position { x, y } to render
 */
export function bufferToSvg(
  buffer: ScreenBufferGrid,
  config?: SvgConfig,
  cursor?: { x: number; y: number; visible?: boolean },
): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const palette = cfg.palette.length >= 16 ? cfg.palette : [...DEFAULT_PALETTE];

  const cols = buffer.width;
  const rows = buffer.height;

  const termWidth = cols * cfg.cellWidth;
  const termHeight = rows * cfg.cellHeight;
  const totalWidth = termWidth + cfg.padding * 2;

  // Title bar
  const titleBar = renderTitleBar(cfg, totalWidth);
  const totalHeight = termHeight + cfg.padding * 2 + titleBar.height;

  // Content area offset
  const ox = cfg.padding;
  const oy = cfg.padding + titleBar.height;

  const parts: string[] = [];

  // SVG header
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">`,
  );

  // Embedded font hint (browser will use fallback if not available)
  parts.push('<defs>');
  parts.push(`<style>text { font-family: ${cfg.fontFamily}; font-size: ${cfg.fontSize}px; }</style>`);
  parts.push('</defs>');

  // Window background with rounded corners
  parts.push(
    `<rect width="${totalWidth}" height="${totalHeight}" fill="${cfg.defaultBg}" rx="${cfg.borderRadius}" ry="${cfg.borderRadius}"/>`,
  );

  // Title bar
  if (titleBar.svg) {
    parts.push(titleBar.svg);
  }

  // Render each row
  for (let row = 0; row < rows; row++) {
    const runs = rowToRuns(buffer, row);
    const y = oy + row * cfg.cellHeight;
    const textY = y + cfg.cellHeight * 0.78; // baseline approximation

    for (const run of runs) {
      const x = ox + run.col * cfg.cellWidth;
      const w = run.cellCount * cfg.cellWidth;

      const style = run.style;
      const inverse = style.inverse ?? false;

      // Resolve colors (handle inverse)
      let fgCss = colorToCss(
        inverse ? style.bg : style.fg,
        palette,
        inverse ? cfg.defaultBg : cfg.defaultFg,
      );
      const bgCss = colorToCss(
        inverse ? style.fg : style.bg,
        palette,
        '', // empty = no background rect
      );

      // Dim: reduce opacity
      const dimOpacity = (style.dim ?? false) ? 0.5 : 1.0;

      // Background rect (only if non-default bg or inverse)
      if (bgCss) {
        parts.push(
          `<rect x="${x}" y="${y}" width="${w}" height="${cfg.cellHeight}" fill="${bgCss}"/>`,
        );
      }

      // Skip if text is all spaces and no special styling
      const trimmed = run.text.replace(/ /g, '');
      if (!trimmed) continue;

      // Build text element attributes
      const attrs: string[] = [];
      attrs.push(`x="${x}"`);
      attrs.push(`y="${textY}"`);

      // Build style string
      const styleAttrs: string[] = [];
      styleAttrs.push(`fill:${fgCss}`);

      if (dimOpacity < 1) {
        styleAttrs.push(`opacity:${dimOpacity}`);
      }
      if (style.bold) {
        styleAttrs.push('font-weight:bold');
      }
      if (style.italic) {
        styleAttrs.push('font-style:italic');
      }

      // Underline + strikethrough via text-decoration
      const decorations: string[] = [];
      if (style.underline) decorations.push('underline');
      if (style.strikethrough) decorations.push('line-through');
      if (decorations.length > 0) {
        styleAttrs.push(`text-decoration:${decorations.join(' ')}`);
      }

      attrs.push(`style="${styleAttrs.join(';')}"`);

      // xml:space="preserve" keeps whitespace
      attrs.push('xml:space="preserve"');

      parts.push(`<text ${attrs.join(' ')}>${escapeXml(run.text)}</text>`);
    }
  }

  // Cursor
  if (cfg.showCursor && cursor && cursor.visible !== false) {
    const cx = ox + cursor.x * cfg.cellWidth;
    const cy = oy + cursor.y * cfg.cellHeight;
    parts.push(
      `<rect x="${cx}" y="${cy}" width="${cfg.cellWidth}" height="${cfg.cellHeight}" fill="${cfg.cursorColor}" opacity="0.7"/>`,
    );
  }

  parts.push('</svg>');
  return parts.join('\n');
}
