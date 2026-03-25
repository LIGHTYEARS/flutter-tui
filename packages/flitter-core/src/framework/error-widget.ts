// ErrorWidget — displayed when a build fails
// Amp ref: Error handling in buildScopes() — catches errors, logs, continues
// In Flutter, ErrorWidget replaces a failed subtree to show error info.

import { Widget, StatelessWidget, type BuildContext } from './widget';
import { Key } from '../core/key';
import { StatelessElement } from './element';

// ---------------------------------------------------------------------------
// ErrorWidget
//
// A simple widget that represents a build error. When a widget's build()
// method throws, ErrorWidget can replace the failed subtree.
//
// For now, this is a leaf — it returns itself from build().
// Actual rendering (displaying the error message in the terminal) comes
// in Phase 7 when Text/RenderParagraph are available.
// ---------------------------------------------------------------------------

export class ErrorWidget extends StatelessWidget {
  readonly message: string;
  readonly error?: Error;

  constructor(opts: { message: string; error?: Error; key?: Key }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.message = opts.message;
    this.error = opts.error;
  }

  /** Factory: create ErrorWidget from an error */
  static fromError(error: Error): ErrorWidget {
    return new ErrorWidget({ message: error.message, error });
  }

  build(_context: BuildContext): Widget {
    // Returns self — acts as leaf for now.
    // Phase 7 will render the error message with a Text widget.
    return this;
  }

  override createElement(): StatelessElement {
    return new StatelessElement(this);
  }
}
