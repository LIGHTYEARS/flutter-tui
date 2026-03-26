// Amp Theme System — barrel export, AmpThemeProvider InheritedWidget, and helpers.
// Provides the AmpThemeProvider widget that propagates AmpTheme data down the tree,
// a deriveAppColors() helper to compute app-specific semantic colors from a base theme,
// and a registry of all built-in themes.

import { Color } from 'flitter-core/src/core/color';
import { Key } from 'flitter-core/src/core/key';
import { Widget, InheritedWidget, BuildContext } from 'flitter-core/src/framework/widget';
import type { AmpBaseTheme, AmpAppColors, AmpTheme } from './amp-theme-data';
import { darkTheme } from './dark';
import { lightTheme } from './light';
import { catppuccinMochaTheme } from './catppuccin-mocha';
import { solarizedDarkTheme } from './solarized-dark';
import { solarizedLightTheme } from './solarized-light';
import { gruvboxDarkTheme } from './gruvbox-dark';
import { nordTheme } from './nord';

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { AmpBaseTheme, AmpAppColors, AmpTheme, AmpSyntaxHighlight } from './amp-theme-data';
export { darkTheme } from './dark';
export { lightTheme } from './light';
export { catppuccinMochaTheme } from './catppuccin-mocha';
export { solarizedDarkTheme } from './solarized-dark';
export { solarizedLightTheme } from './solarized-light';
export { gruvboxDarkTheme } from './gruvbox-dark';
export { nordTheme } from './nord';

// ---------------------------------------------------------------------------
// Theme registry — maps theme names to their AmpBaseTheme definitions
// ---------------------------------------------------------------------------

/**
 * Registry of all built-in themes keyed by name.
 * Used for theme selection by name (e.g. from CLI flags or config files).
 */
export const ampThemes: Readonly<Record<string, AmpBaseTheme>> = {
  'dark': darkTheme,
  'light': lightTheme,
  'catppuccin-mocha': catppuccinMochaTheme,
  'solarized-dark': solarizedDarkTheme,
  'solarized-light': solarizedLightTheme,
  'gruvbox-dark': gruvboxDarkTheme,
  'nord': nordTheme,
};

// ---------------------------------------------------------------------------
// deriveAppColors — compute AmpAppColors from an AmpBaseTheme
// ---------------------------------------------------------------------------

/**
 * Derives application-specific semantic colors from a base theme.
 * Maps base palette colors to their semantic roles in the Amp UI:
 *   toolName → foreground, toolSuccess → success, toolError → destructive,
 *   toolCancelled → warning, fileReference → primary, command → warning,
 *   keybind → info, link → primary, recommendation → info,
 *   shellMode → info, handoffMode → secondary, queueMode → info,
 *   scrollbarThumb → foreground, scrollbarTrack → ansi256(8),
 *   toolRunning → info, userMessage → success,
 *   smartModeColor → conditional green, rushModeColor → conditional gold,
 *   diffAdded → success, diffRemoved → destructive, diffContext → mutedForeground,
 *   waiting → warning.
 */
export function deriveAppColors(base: AmpBaseTheme): AmpAppColors {
  return {
    toolName: base.foreground,
    toolSuccess: base.success,
    toolError: base.destructive,
    toolCancelled: base.warning,
    fileReference: base.primary,
    command: base.warning,
    keybind: base.info,
    link: base.primary,
    recommendation: base.info,
    shellMode: base.info,
    handoffMode: base.secondary,
    queueMode: base.info,
    scrollbarThumb: base.foreground,
    scrollbarTrack: Color.ansi256(8),
    toolRunning: base.info,
    userMessage: base.success,
    smartModeColor: base.isLight ? Color.rgb(0, 140, 70) : Color.rgb(0, 255, 136),
    rushModeColor: base.isLight ? Color.rgb(180, 100, 0) : Color.rgb(255, 215, 0),
    diffAdded: base.success,
    diffRemoved: base.destructive,
    diffContext: base.mutedForeground,
    waiting: base.warning,
  };
}

// ---------------------------------------------------------------------------
// createAmpTheme — build a complete AmpTheme from an AmpBaseTheme
// ---------------------------------------------------------------------------

/**
 * Creates a complete AmpTheme by combining a base theme with derived app colors.
 */
export function createAmpTheme(base: AmpBaseTheme): AmpTheme {
  return {
    base,
    app: deriveAppColors(base),
  };
}

/**
 * Returns the Color associated with the given agent mode name.
 */
export function agentModeColor(mode: string, theme: AmpTheme): Color {
  if (mode === 'smart') return theme.app.smartModeColor;
  if (mode === 'rush') return theme.app.rushModeColor;
  return theme.base.foreground;
}

// ---------------------------------------------------------------------------
// AmpThemeProvider — InheritedWidget that propagates AmpTheme down the tree
// ---------------------------------------------------------------------------

/**
 * An InheritedWidget that propagates AmpTheme data to descendant widgets.
 *
 * Usage:
 *   new AmpThemeProvider({
 *     theme: createAmpTheme(darkTheme),
 *     child: appRoot,
 *   })
 *
 * Descendants read the theme via:
 *   AmpThemeProvider.of(context)      // throws if not found
 *   AmpThemeProvider.maybeOf(context)  // returns undefined if not found
 */
export class AmpThemeProvider extends InheritedWidget {
  readonly theme: AmpTheme;

  constructor(opts: { theme: AmpTheme; child: Widget; key?: Key }) {
    super({ key: opts.key, child: opts.child });
    this.theme = opts.theme;
  }

  /**
   * Look up the nearest ancestor AmpThemeProvider and return its AmpTheme.
   * Throws if no AmpThemeProvider ancestor is found.
   */
  static of(context: BuildContext): AmpTheme {
    const result = AmpThemeProvider.maybeOf(context);
    if (result === undefined) {
      throw new Error(
        'AmpThemeProvider.of() called with a context that does not contain an ' +
          'AmpThemeProvider ancestor. Ensure an AmpThemeProvider widget is an ' +
          'ancestor of this widget.',
      );
    }
    return result;
  }

  /**
   * Look up the nearest ancestor AmpThemeProvider and return its AmpTheme,
   * or undefined if none is found.
   */
  static maybeOf(context: BuildContext): AmpTheme | undefined {
    const ctx = context as any;
    if (typeof ctx.dependOnInheritedWidgetOfExactType === 'function') {
      const element = ctx.dependOnInheritedWidgetOfExactType(AmpThemeProvider);
      if (element) {
        const widget = element.widget as AmpThemeProvider;
        return widget.theme;
      }
    }
    return undefined;
  }

  updateShouldNotify(oldWidget: InheritedWidget): boolean {
    const old = oldWidget as AmpThemeProvider;
    return !ampThemeEquals(this.theme, old.theme);
  }
}

// ---------------------------------------------------------------------------
// Equality helpers
// ---------------------------------------------------------------------------

/**
 * Deep equality check for AmpTheme — compares base and app color fields.
 */
function ampThemeEquals(a: AmpTheme, b: AmpTheme): boolean {
  return ampBaseThemeEquals(a.base, b.base) && ampAppColorsEquals(a.app, b.app);
}

/**
 * Deep equality check for AmpBaseTheme.
 */
function ampBaseThemeEquals(a: AmpBaseTheme, b: AmpBaseTheme): boolean {
  return (
    a.isLight === b.isLight &&
    a.background.equals(b.background) &&
    a.foreground.equals(b.foreground) &&
    a.mutedForeground.equals(b.mutedForeground) &&
    a.border.equals(b.border) &&
    a.selection.equals(b.selection) &&
    a.primary.equals(b.primary) &&
    a.secondary.equals(b.secondary) &&
    a.accent.equals(b.accent) &&
    a.success.equals(b.success) &&
    a.warning.equals(b.warning) &&
    a.info.equals(b.info) &&
    a.destructive.equals(b.destructive) &&
    a.copyHighlight.equals(b.copyHighlight) &&
    a.tableBorder.equals(b.tableBorder) &&
    a.cursor.equals(b.cursor) &&
    a.syntaxHighlight.keyword.equals(b.syntaxHighlight.keyword) &&
    a.syntaxHighlight.string.equals(b.syntaxHighlight.string) &&
    a.syntaxHighlight.number.equals(b.syntaxHighlight.number) &&
    a.syntaxHighlight.comment.equals(b.syntaxHighlight.comment) &&
    a.syntaxHighlight.function.equals(b.syntaxHighlight.function) &&
    a.syntaxHighlight.variable.equals(b.syntaxHighlight.variable) &&
    a.syntaxHighlight.type.equals(b.syntaxHighlight.type) &&
    a.syntaxHighlight.operator.equals(b.syntaxHighlight.operator)
  );
}

/**
 * Deep equality check for AmpAppColors.
 */
function ampAppColorsEquals(a: AmpAppColors, b: AmpAppColors): boolean {
  return (
    a.toolName.equals(b.toolName) &&
    a.toolSuccess.equals(b.toolSuccess) &&
    a.toolError.equals(b.toolError) &&
    a.toolCancelled.equals(b.toolCancelled) &&
    a.fileReference.equals(b.fileReference) &&
    a.command.equals(b.command) &&
    a.keybind.equals(b.keybind) &&
    a.link.equals(b.link) &&
    a.recommendation.equals(b.recommendation) &&
    a.shellMode.equals(b.shellMode) &&
    a.handoffMode.equals(b.handoffMode) &&
    a.queueMode.equals(b.queueMode) &&
    a.scrollbarThumb.equals(b.scrollbarThumb) &&
    a.scrollbarTrack.equals(b.scrollbarTrack) &&
    a.toolRunning.equals(b.toolRunning) &&
    a.userMessage.equals(b.userMessage) &&
    a.smartModeColor.equals(b.smartModeColor) &&
    a.rushModeColor.equals(b.rushModeColor) &&
    a.diffAdded.equals(b.diffAdded) &&
    a.diffRemoved.equals(b.diffRemoved) &&
    a.diffContext.equals(b.diffContext) &&
    a.waiting.equals(b.waiting)
  );
}
