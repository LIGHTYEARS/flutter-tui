// Solarized Light theme — Ethan Schoonover's Solarized palette (light variant).
// Missing fields are derived from existing base values.

import { Color } from 'flitter-core/src/core/color';
import type { AmpBaseTheme } from './amp-theme-data';

/**
 * Solarized Light theme. Uses the official Solarized palette mapped
 * to Amp's theme structure. Missing values are derived from the base palette.
 */
export const solarizedLightTheme: AmpBaseTheme = {
  background: Color.rgb(253, 246, 227),
  foreground: Color.rgb(101, 123, 131),
  mutedForeground: Color.rgb(147, 161, 161),
  border: Color.rgb(147, 161, 161),
  selection: Color.rgb(238, 232, 213).withAlpha(0.7),
  primary: Color.rgb(38, 139, 210),
  secondary: Color.rgb(42, 161, 152),
  accent: Color.rgb(181, 137, 0),
  success: Color.rgb(133, 153, 0),
  warning: Color.rgb(181, 137, 0),
  info: Color.rgb(38, 139, 210),
  destructive: Color.rgb(220, 50, 47),
  copyHighlight: Color.rgb(181, 137, 0),
  tableBorder: Color.rgb(147, 161, 161),
  cursor: Color.rgb(101, 123, 131),
  isLight: true,
  syntaxHighlight: {
    keyword: Color.rgb(133, 153, 0),
    string: Color.rgb(42, 161, 152),
    number: Color.rgb(211, 54, 130),
    comment: Color.rgb(147, 161, 161),
    function: Color.rgb(38, 139, 210),
    variable: Color.rgb(101, 123, 131),
    type: Color.rgb(181, 137, 0),
    operator: Color.rgb(101, 123, 131),
  },
};
