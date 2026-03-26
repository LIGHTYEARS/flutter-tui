// AmpThemeData — Interfaces and type definitions for Amp CLI's RGB true-color theme system.
// Defines three layers: AmpBaseTheme (core palette), AmpAppColors (app-specific semantic
// colors), and AmpTheme (the combined theme object).

import { Color } from 'flitter-core/src/core/color';

/**
 * Syntax highlighting color configuration for code blocks.
 * Each field maps a token type to an RGB Color.
 */
export interface AmpSyntaxHighlight {
  readonly keyword: Color;
  readonly string: Color;
  readonly number: Color;
  readonly comment: Color;
  readonly function: Color;
  readonly variable: Color;
  readonly type: Color;
  readonly operator: Color;
}

/**
 * Base theme defining the core palette for the entire UI.
 * All colors use RGB true-color (Color.rgb()) for precise rendering.
 */
export interface AmpBaseTheme {
  readonly background: Color;
  readonly foreground: Color;
  readonly mutedForeground: Color;
  readonly border: Color;
  readonly selection: Color;
  readonly primary: Color;
  readonly secondary: Color;
  readonly accent: Color;
  readonly success: Color;
  readonly warning: Color;
  readonly info: Color;
  readonly destructive: Color;
  readonly copyHighlight: Color;
  readonly tableBorder: Color;
  readonly cursor: Color;
  readonly isLight: boolean;
  readonly syntaxHighlight: AmpSyntaxHighlight;
}

/**
 * Application-specific semantic colors derived from the base theme.
 * These map to specific UI roles in the Amp CLI interface.
 */
export interface AmpAppColors {
  readonly toolName: Color;
  readonly toolSuccess: Color;
  readonly toolError: Color;
  readonly toolCancelled: Color;
  readonly fileReference: Color;
  readonly command: Color;
  readonly keybind: Color;
  readonly link: Color;
  readonly recommendation: Color;
  readonly shellMode: Color;
  readonly handoffMode: Color;
  readonly queueMode: Color;
  readonly scrollbarThumb: Color;
  readonly scrollbarTrack: Color;
  readonly toolRunning: Color;
  readonly userMessage: Color;
  readonly smartModeColor: Color;
  readonly rushModeColor: Color;
  readonly diffAdded: Color;
  readonly diffRemoved: Color;
  readonly diffContext: Color;
  readonly waiting: Color;
}

/**
 * The combined Amp theme object containing both base palette and app-specific colors.
 */
export interface AmpTheme {
  readonly base: AmpBaseTheme;
  readonly app: AmpAppColors;
}
