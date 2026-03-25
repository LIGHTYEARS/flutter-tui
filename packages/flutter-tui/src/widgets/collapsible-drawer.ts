// CollapsibleDrawer widget — StatefulWidget for collapsible/expandable sections
// Amp ref: cd class — collapsible drawer with title/child, uF0 state management, Vp() truncation

import { Key } from '../core/key';
import { Color } from '../core/color';
import { TextStyle } from '../core/text-style';
import { TextSpan } from '../core/text-span';
import {
  Widget,
  StatefulWidget,
  State,
  type BuildContext,
} from '../framework/widget';
import { Column, Row } from './flex';
import { Expanded } from './flexible';
import { Text } from './text';
import { SizedBox } from './sized-box';
import { ClipRect } from './clip-rect';
import { FocusScope } from './focus-scope';
import { MouseRegion } from './mouse-region';
import { Theme, type ThemeData } from './theme';
import type { KeyEvent, KeyEventResult } from '../input/events';

// ---------------------------------------------------------------------------
// CollapsibleDrawer (Amp: cd)
// ---------------------------------------------------------------------------

/**
 * A StatefulWidget for collapsible/expandable sections with a title bar
 * and expandable content area.
 *
 * Supports keyboard interaction (Enter/Space to toggle), mouse click on
 * the title bar, optional content truncation with "View all" link, and
 * an optional spinner animation indicator.
 *
 * Usage:
 *   new CollapsibleDrawer({
 *     title: new Text({ text: new TextSpan({ text: 'Section Title' }) }),
 *     child: someContentWidget,
 *     expanded: false,
 *     onChanged: (expanded) => console.log('Expanded:', expanded),
 *   })
 *
 * Amp ref: cd class — collapsible drawer with title/child, uF0 state management, Vp() truncation
 */
export class CollapsibleDrawer extends StatefulWidget {
  readonly title: Widget;
  readonly child: Widget;
  readonly expanded: boolean;
  readonly onChanged?: (expanded: boolean) => void;
  readonly maxContentLines?: number;
  readonly showViewAll: boolean;
  readonly spinner: boolean;

  constructor(opts: {
    key?: Key;
    title: Widget;
    child: Widget;
    expanded?: boolean;
    onChanged?: (expanded: boolean) => void;
    maxContentLines?: number;
    showViewAll?: boolean;
    spinner?: boolean;
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.title = opts.title;
    this.child = opts.child;
    this.expanded = opts.expanded ?? false;
    this.onChanged = opts.onChanged;
    this.maxContentLines = opts.maxContentLines;
    this.showViewAll = opts.showViewAll ?? true;
    this.spinner = opts.spinner ?? false;
  }

  createState(): State<CollapsibleDrawer> {
    return new CollapsibleDrawerState();
  }
}

// ---------------------------------------------------------------------------
// CollapsibleDrawerState
// ---------------------------------------------------------------------------

/**
 * State for CollapsibleDrawer. Manages expanded/collapsed state, optional
 * content truncation with "View all" toggle, and spinner animation.
 *
 * Keyboard:
 * - Enter / Space: Toggle expanded state
 *
 * Mouse:
 * - Click on title bar: Toggle expanded state
 * - Click on "View all": Show all content (bypass truncation)
 *
 * Amp ref: uF0 state class — manages cd expanded state, Vp() truncation
 */
export class CollapsibleDrawerState extends State<CollapsibleDrawer> {
  private _expanded: boolean = false;
  private _showAll: boolean = false;
  private _spinnerFrame: number = 0;
  private _spinnerTimer?: ReturnType<typeof setInterval>;

  /** Whether the drawer is currently expanded. */
  get expanded(): boolean {
    return this._expanded;
  }

  /** Toggle the expanded state and notify via onChanged callback. */
  toggle(): void {
    this.setState(() => {
      this._expanded = !this._expanded;
      this.widget.onChanged?.(this._expanded);
    });
  }

  initState(): void {
    super.initState();
    this._expanded = this.widget.expanded;
    if (this.widget.spinner) {
      this._startSpinner();
    }
  }

  didUpdateWidget(oldWidget: CollapsibleDrawer): void {
    if (oldWidget.expanded !== this.widget.expanded) {
      this._expanded = this.widget.expanded;
    }
    // Handle spinner lifecycle
    if (this.widget.spinner && !this._spinnerTimer) {
      this._startSpinner();
    } else if (!this.widget.spinner && this._spinnerTimer) {
      this._stopSpinner();
    }
  }

  dispose(): void {
    this._stopSpinner();
    super.dispose();
  }

  build(context: BuildContext): Widget {
    const themeData = Theme.maybeOf(context);

    // Spinner frames: braille characters for rotation animation
    const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

    // Build indicator
    const indicator = this._expanded ? '▼' : '▶';
    const indicatorColor = themeData?.textSecondary ?? Color.brightBlack;

    // Build title bar children
    const titleChildren: Widget[] = [];

    if (this.widget.spinner) {
      titleChildren.push(new Text({
        text: new TextSpan({
          text: SPINNER_FRAMES[this._spinnerFrame % SPINNER_FRAMES.length] + ' ',
          style: new TextStyle({ foreground: themeData?.info ?? Color.cyan }),
        }),
      }));
    }

    titleChildren.push(new Text({
      text: new TextSpan({
        text: indicator + ' ',
        style: new TextStyle({ foreground: indicatorColor }),
      }),
    }));

    titleChildren.push(new Expanded({ child: this.widget.title }));

    const titleBar = new MouseRegion({
      onClick: () => this.toggle(),
      child: new Row({ children: titleChildren }),
    });

    // Wrap with FocusScope for keyboard interaction
    const focusedTitleBar = new FocusScope({
      onKey: this._handleKey,
      child: titleBar,
    });

    // If collapsed, only show the title bar
    if (!this._expanded) {
      return focusedTitleBar;
    }

    // Build content with optional truncation
    const content = this._buildContent(themeData);

    return new Column({
      mainAxisSize: 'min',
      children: [focusedTitleBar, content],
    });
  }

  // -- Private helpers --

  /**
   * Build the content area, optionally truncated with a "View all" link.
   * If maxContentLines is not set or _showAll is true, renders the child directly.
   * Otherwise wraps the child in a SizedBox+ClipRect to truncate visible lines.
   */
  private _buildContent(themeData?: ThemeData): Widget {
    // If no maxContentLines or showAll mode, render child directly
    if (this.widget.maxContentLines === undefined || this._showAll) {
      return this.widget.child;
    }

    // Wrap child in a SizedBox with max height = maxContentLines
    // Then show optional truncation "View all" indicator
    const children: Widget[] = [
      new SizedBox({
        height: this.widget.maxContentLines,
        child: new ClipRect({ child: this.widget.child }),
      }),
    ];

    if (this.widget.showViewAll) {
      children.push(
        new MouseRegion({
          onClick: () => {
            this.setState(() => { this._showAll = true; });
          },
          child: new Text({
            text: new TextSpan({
              text: '  [View all]',
              style: new TextStyle({
                foreground: themeData?.primary ?? Color.cyan,
                underline: true,
              }),
            }),
          }),
        }),
      );
    }

    return new Column({
      mainAxisSize: 'min',
      children,
    });
  }

  /**
   * Handle keyboard events for toggling the drawer.
   * Enter or Space toggles the expanded state.
   */
  private _handleKey = (event: KeyEvent): KeyEventResult => {
    if (event.key === 'Enter' || event.key === ' ') {
      this.toggle();
      return 'handled';
    }
    return 'ignored';
  };

  /**
   * Start the spinner animation timer.
   * Increments the spinner frame index every 200ms.
   */
  private _startSpinner(): void {
    this._spinnerTimer = setInterval(() => {
      this.setState(() => {
        this._spinnerFrame++;
      });
    }, 200);
  }

  /**
   * Stop the spinner animation timer and clean up.
   */
  private _stopSpinner(): void {
    if (this._spinnerTimer) {
      clearInterval(this._spinnerTimer);
      this._spinnerTimer = undefined;
    }
  }
}
