// Dialog data class — holds configuration for rendering dialogs
// Amp ref: ab class — dialog configuration used by application shell
// NOT a widget — a plain data class consumed by the shell layer

import type { Widget } from '../framework/widget';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Categorizes the dialog's purpose for styling and behavior.
 * - 'info': Informational message
 * - 'warning': Warning/caution message
 * - 'error': Error/failure message
 * - 'confirm': Requires user confirmation
 * - 'custom': Application-defined styling
 */
export type DialogType = 'info' | 'warning' | 'error' | 'confirm' | 'custom';

/**
 * How the dialog footer is rendered.
 * - 'buttons': Render action buttons
 * - 'text': Render text-only footer
 * - 'none': No footer
 */
export type FooterStyle = 'buttons' | 'text' | 'none';

/**
 * Configuration for a dialog button.
 */
export interface DialogButton {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

/**
 * Optional explicit dimensions for the dialog.
 */
export interface DialogDimensions {
  readonly width?: number;
  readonly height?: number;
}

// ---------------------------------------------------------------------------
// Dialog (Amp: ab)
// ---------------------------------------------------------------------------

/**
 * A data class that holds dialog configuration.
 *
 * This is NOT a widget. It is consumed by the application shell to render
 * overlay dialogs. The shell reads these properties and constructs the
 * appropriate widget tree for display.
 *
 * Usage:
 *   const dialog = new Dialog({
 *     title: 'Confirm Delete',
 *     type: 'confirm',
 *     subtitle: 'This action cannot be undone.',
 *     footerStyle: 'buttons',
 *     buttons: [
 *       { label: 'Cancel', value: 'cancel' },
 *       { label: 'Delete', value: 'delete' },
 *     ],
 *   });
 *
 * Amp ref: ab class — dialog data holder
 */
export class Dialog {
  readonly title: string;
  readonly type: DialogType;
  readonly subtitle?: string;
  readonly body?: Widget;
  readonly footerStyle: FooterStyle;
  readonly buttons?: readonly DialogButton[];
  readonly dimensions?: DialogDimensions;
  readonly border: boolean;

  constructor(opts: {
    title: string;
    type?: DialogType;
    subtitle?: string;
    body?: Widget;
    footerStyle?: FooterStyle;
    buttons?: DialogButton[];
    dimensions?: DialogDimensions;
    border?: boolean;
  }) {
    this.title = opts.title;
    this.type = opts.type ?? 'info';
    this.subtitle = opts.subtitle;
    this.body = opts.body;
    this.footerStyle = opts.footerStyle ?? 'none';
    this.buttons = opts.buttons ? Object.freeze([...opts.buttons]) : undefined;
    this.dimensions = opts.dimensions;
    this.border = opts.border ?? true;
  }

  /**
   * Create a copy of this dialog with some fields overridden.
   */
  copyWith(overrides: {
    title?: string;
    type?: DialogType;
    subtitle?: string;
    body?: Widget;
    footerStyle?: FooterStyle;
    buttons?: DialogButton[];
    dimensions?: DialogDimensions;
    border?: boolean;
  }): Dialog {
    return new Dialog({
      title: overrides.title ?? this.title,
      type: overrides.type ?? this.type,
      subtitle: overrides.subtitle !== undefined ? overrides.subtitle : this.subtitle,
      body: overrides.body !== undefined ? overrides.body : this.body,
      footerStyle: overrides.footerStyle ?? this.footerStyle,
      buttons: overrides.buttons ?? (this.buttons ? [...this.buttons] : undefined),
      dimensions: overrides.dimensions !== undefined ? overrides.dimensions : this.dimensions,
      border: overrides.border ?? this.border,
    });
  }

  toString(): string {
    return `Dialog(title: "${this.title}", type: ${this.type}, footerStyle: ${this.footerStyle})`;
  }
}
