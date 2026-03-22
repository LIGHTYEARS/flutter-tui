// SelectionList widget — interactive selection dialog with keyboard/mouse support
// Amp ref: ap class — StatefulWidget for item selection
// Source: .reference/widgets-catalog.md

import { Key } from '../core/key';
import { TextStyle } from '../core/text-style';
import { TextSpan } from '../core/text-span';
import {
  Widget,
  StatefulWidget,
  State,
  type BuildContext,
} from '../framework/widget';
import { Column } from './flex';
import { Text } from './text';
import { FocusScope } from './focus-scope';
import type { KeyEvent, KeyEventResult } from '../input/events';

// ---------------------------------------------------------------------------
// SelectionItem
// ---------------------------------------------------------------------------

/**
 * An item in a SelectionList.
 */
export interface SelectionItem {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly description?: string;
}

// ---------------------------------------------------------------------------
// SelectionList (Amp: ap)
// ---------------------------------------------------------------------------

/**
 * A StatefulWidget for interactive selection dialogs.
 *
 * Supports keyboard navigation (ArrowUp/ArrowDown/j/k, Tab to cycle,
 * Enter to confirm, Escape to cancel) and optional mouse interaction.
 *
 * Usage:
 *   new SelectionList({
 *     items: [
 *       { label: 'Option A', value: 'a' },
 *       { label: 'Option B', value: 'b', description: 'Second option' },
 *       { label: 'Option C', value: 'c', disabled: true },
 *     ],
 *     onSelect: (value) => console.log('Selected:', value),
 *     onCancel: () => console.log('Cancelled'),
 *   })
 *
 * Amp ref: ap class — selection list widget
 */
export class SelectionList extends StatefulWidget {
  readonly items: readonly SelectionItem[];
  readonly onSelect: (value: string) => void;
  readonly onCancel?: () => void;
  readonly initialIndex?: number;
  readonly enableMouseInteraction: boolean;
  readonly showDescription: boolean;

  constructor(opts: {
    key?: Key;
    items: readonly SelectionItem[];
    onSelect: (value: string) => void;
    onCancel?: () => void;
    initialIndex?: number;
    enableMouseInteraction?: boolean;
    showDescription?: boolean;
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.items = opts.items;
    this.onSelect = opts.onSelect;
    this.onCancel = opts.onCancel;
    this.initialIndex = opts.initialIndex;
    this.enableMouseInteraction = opts.enableMouseInteraction ?? true;
    this.showDescription = opts.showDescription ?? true;
  }

  createState(): State<SelectionList> {
    return new SelectionListState();
  }
}

// ---------------------------------------------------------------------------
// SelectionListState
// ---------------------------------------------------------------------------

/**
 * State for SelectionList. Manages selected index and keyboard/mouse input.
 *
 * Navigation:
 * - ArrowUp / k: Move selection up (wraps, skips disabled)
 * - ArrowDown / j: Move selection down (wraps, skips disabled)
 * - Tab: Cycle forward through items (wraps, skips disabled)
 * - Enter: Confirm selection -> calls onSelect
 * - Escape: Cancel -> calls onCancel
 *
 * Mouse (when enableMouseInteraction is true):
 * - Click on an item -> select + confirm (calls onSelect)
 */
export class SelectionListState extends State<SelectionList> {
  private _selectedIndex: number = 0;

  /** Current selected index (0-based). */
  get selectedIndex(): number {
    return this._selectedIndex;
  }

  initState(): void {
    super.initState();
    const items = this.widget.items;

    if (this.widget.initialIndex !== undefined) {
      // Use the provided initial index, clamped to bounds
      this._selectedIndex = Math.max(0, Math.min(this.widget.initialIndex, items.length - 1));
    }

    // If the current index points to a disabled item, advance to next enabled
    if (items.length > 0 && items[this._selectedIndex]?.disabled) {
      this._moveToNextEnabled(1);
    }
  }

  didUpdateWidget(oldWidget: SelectionList): void {
    // If items changed, ensure selected index is still valid
    if (this._selectedIndex >= this.widget.items.length) {
      this._selectedIndex = Math.max(0, this.widget.items.length - 1);
    }
    // If current item is disabled, move to next enabled
    if (this.widget.items.length > 0 && this.widget.items[this._selectedIndex]?.disabled) {
      this._moveToNextEnabled(1);
    }
  }

  /**
   * Handle a key event for selection navigation.
   * Returns 'handled' if the key was consumed, 'ignored' otherwise.
   */
  handleKeyEvent(event: KeyEvent): KeyEventResult {
    const key = event.key;

    switch (key) {
      case 'ArrowUp':
      case 'k':
        this._movePrevious();
        return 'handled';

      case 'ArrowDown':
      case 'j':
        this._moveNext();
        return 'handled';

      case 'Tab':
        this._moveNext();
        return 'handled';

      case 'Enter':
        this._confirmSelection();
        return 'handled';

      case 'Escape':
        this.widget.onCancel?.();
        return 'handled';

      default:
        return 'ignored';
    }
  }

  /**
   * Handle mouse click at a given item index.
   * Selects the item and confirms immediately.
   */
  handleMouseClick(index: number): void {
    if (!this.widget.enableMouseInteraction) return;
    if (index < 0 || index >= this.widget.items.length) return;
    if (this.widget.items[index]?.disabled) return;

    this.setState(() => {
      this._selectedIndex = index;
    });
    this._confirmSelection();
  }

  build(_context: BuildContext): Widget {
    const items = this.widget.items;
    const children: Widget[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const isSelected = i === this._selectedIndex;
      const isDisabled = item.disabled === true;

      // Build label text with styling
      let labelText = isSelected ? `> ${item.label}` : `  ${item.label}`;
      if (this.widget.showDescription && item.description) {
        labelText += ` - ${item.description}`;
      }

      const style = this._getItemStyle(isSelected, isDisabled);
      children.push(
        new Text({
          text: new TextSpan({ text: labelText, style }),
        }),
      );
    }

    const column = new Column({
      children,
      crossAxisAlignment: 'start',
      mainAxisSize: 'min',
    });

    // Wrap with FocusScope for keyboard handling
    return new FocusScope({
      autofocus: true,
      onKey: (event: KeyEvent): KeyEventResult => {
        return this.handleKeyEvent(event);
      },
      child: column,
    });
  }

  // -- Private helpers --

  /**
   * Move selection to the previous enabled item, wrapping around.
   */
  private _movePrevious(): void {
    this.setState(() => {
      this._moveToNextEnabled(-1);
    });
  }

  /**
   * Move selection to the next enabled item, wrapping around.
   */
  private _moveNext(): void {
    this.setState(() => {
      this._moveToNextEnabled(1);
    });
  }

  /**
   * Confirm the current selection by calling onSelect with the selected value.
   */
  private _confirmSelection(): void {
    const items = this.widget.items;
    if (items.length === 0) return;

    const selectedItem = items[this._selectedIndex];
    if (selectedItem && !selectedItem.disabled) {
      this.widget.onSelect(selectedItem.value);
    }
  }

  /**
   * Move the selected index in the given direction (+1 or -1),
   * skipping disabled items and wrapping around.
   * If all items are disabled, stays at the current position.
   */
  private _moveToNextEnabled(direction: 1 | -1): void {
    const items = this.widget.items;
    if (items.length === 0) return;

    let candidate = this._selectedIndex;
    for (let attempts = 0; attempts < items.length; attempts++) {
      candidate = (candidate + direction + items.length) % items.length;
      if (!items[candidate]?.disabled) {
        this._selectedIndex = candidate;
        return;
      }
    }
    // All items disabled — stay at current index
  }

  /**
   * Get the TextStyle for an item based on selection and disabled state.
   */
  private _getItemStyle(isSelected: boolean, isDisabled: boolean): TextStyle {
    if (isDisabled) {
      return new TextStyle({ dim: true });
    }
    if (isSelected) {
      return new TextStyle({ bold: true, inverse: true });
    }
    return new TextStyle();
  }
}
