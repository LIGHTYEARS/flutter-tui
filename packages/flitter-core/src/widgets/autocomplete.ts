import { Key } from '../core/key';
import { Widget, StatefulWidget, State, type BuildContext } from '../framework/widget';
import { Column } from './flex';
import { SelectionList } from './selection-list';
import type { KeyEvent, KeyEventResult } from '../input/events';
import type { SelectionItem } from './selection-list';
import type { TextEditingController } from './text-field';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface AutocompleteOption {
  readonly label: string;
  readonly value: string;
  readonly description?: string;
}

export interface AutocompleteTrigger {
  readonly triggerCharacter: string;
  readonly optionsBuilder: (query: string) => AutocompleteOption[] | Promise<AutocompleteOption[]>;
}

// ---------------------------------------------------------------------------
// Autocomplete Widget
// ---------------------------------------------------------------------------

/**
 * A widget that shows a completion popup when a trigger character is detected
 * in the child's text input.
 *
 * Wraps a child widget (typically a TextField) and overlays a selection list
 * above the input when triggered. Supports multiple trigger characters, async
 * option builders, and custom view builders.
 *
 * Usage:
 *   new Autocomplete({
 *     child: new TextField({ controller, onChanged: ... }),
 *     controller,
 *     triggers: [
 *       { triggerCharacter: '@', optionsBuilder: (q) => fetchUsers(q) },
 *     ],
 *     onSelected: (trigger, option) => { ... },
 *   })
 */
export class Autocomplete extends StatefulWidget {
  readonly child: Widget;
  readonly controller: TextEditingController;
  readonly triggers: readonly AutocompleteTrigger[];
  readonly onSelected?: (trigger: AutocompleteTrigger, option: AutocompleteOption) => void;
  readonly optionsViewBuilder?: (
    options: AutocompleteOption[],
    onSelected: (option: AutocompleteOption) => void,
  ) => Widget;
  readonly maxOptionsVisible?: number;

  constructor(opts: {
    key?: Key;
    child: Widget;
    controller: TextEditingController;
    triggers: readonly AutocompleteTrigger[];
    onSelected?: (trigger: AutocompleteTrigger, option: AutocompleteOption) => void;
    optionsViewBuilder?: (
      options: AutocompleteOption[],
      onSelected: (option: AutocompleteOption) => void,
    ) => Widget;
    maxOptionsVisible?: number;
  }) {
    super(opts.key !== undefined ? { key: opts.key } : undefined);
    this.child = opts.child;
    this.controller = opts.controller;
    this.triggers = opts.triggers;
    this.onSelected = opts.onSelected;
    this.optionsViewBuilder = opts.optionsViewBuilder;
    this.maxOptionsVisible = opts.maxOptionsVisible;
  }

  createState(): State<Autocomplete> {
    return new AutocompleteState();
  }
}

// ---------------------------------------------------------------------------
// AutocompleteState
// ---------------------------------------------------------------------------

class AutocompleteState extends State<Autocomplete> {
  private _options: AutocompleteOption[] = [];
  private _activeTrigger: AutocompleteTrigger | null = null;
  private _triggerStartIndex: number = -1;
  private _isVisible: boolean = false;
  private _pendingAsync: number = 0;

  initState(): void {
    super.initState();
    this.widget.controller.addListener(this._onTextChanged);
  }

  didUpdateWidget(oldWidget: Autocomplete): void {
    if (oldWidget.controller !== this.widget.controller) {
      oldWidget.controller.removeListener(this._onTextChanged);
      this.widget.controller.addListener(this._onTextChanged);
    }
  }

  dispose(): void {
    this.widget.controller.removeListener(this._onTextChanged);
    super.dispose();
  }

  private _onTextChanged = (): void => {
    if (!this.mounted) return;
    this._detectTrigger();
  };

  /**
   * Scan text behind cursor for the longest matching trigger character.
   * A trigger is active when the trigger string appears with no whitespace
   * between it and the cursor position.
   */
  private _detectTrigger(): void {
    const text = this.widget.controller.text;
    const cursorPos = this.widget.controller.cursorPosition;
    const textBeforeCursor = text.slice(0, cursorPos);

    let bestTrigger: AutocompleteTrigger | null = null;
    let bestTriggerIndex = -1;

    for (const trigger of this.widget.triggers) {
      const tc = trigger.triggerCharacter;
      const searchFrom = Math.max(0, cursorPos - 100);
      const searchText = textBeforeCursor.slice(searchFrom);
      const lastIndex = searchText.lastIndexOf(tc);
      if (lastIndex < 0) continue;

      const absoluteIndex = searchFrom + lastIndex;
      const queryPart = textBeforeCursor.slice(absoluteIndex + tc.length);

      if (/\s/.test(queryPart) && queryPart.trim().includes(' ')) continue;

      if (bestTrigger === null || tc.length > bestTrigger.triggerCharacter.length) {
        bestTrigger = trigger;
        bestTriggerIndex = absoluteIndex;
      }
    }

    if (bestTrigger) {
      const query = textBeforeCursor.slice(bestTriggerIndex + bestTrigger.triggerCharacter.length);
      this._activeTrigger = bestTrigger;
      this._triggerStartIndex = bestTriggerIndex;
      this._buildOptions(bestTrigger, query);
    } else {
      this._dismiss();
    }
  }

  private _buildOptions(trigger: AutocompleteTrigger, query: string): void {
    const result = trigger.optionsBuilder(query);

    if (result instanceof Promise) {
      const asyncId = ++this._pendingAsync;
      result.then((options) => {
        if (!this.mounted) return;
        if (asyncId !== this._pendingAsync) return;
        this._applyOptions(options, query);
      });
    } else {
      this._applyOptions(result, query);
    }
  }

  private _applyOptions(options: AutocompleteOption[], query: string): void {
    const filtered = query.length > 0
      ? options.filter((o) => fuzzyMatch(query, o.label) || fuzzyMatch(query, o.value))
      : options;

    const max = this.widget.maxOptionsVisible ?? 10;
    const capped = filtered.slice(0, max);

    this.setState(() => {
      this._options = capped;
      this._isVisible = capped.length > 0;
    });
  }

  private _dismiss(): void {
    if (!this._isVisible && this._activeTrigger === null) return;
    this.setState(() => {
      this._options = [];
      this._activeTrigger = null;
      this._triggerStartIndex = -1;
      this._isVisible = false;
    });
  }

  private _selectOption = (option: AutocompleteOption): void => {
    if (!this._activeTrigger) return;

    const controller = this.widget.controller;
    const trigger = this._activeTrigger;
    const replaceStart = this._triggerStartIndex;
    const replaceEnd = controller.cursorPosition;

    const before = controller.text.slice(0, replaceStart);
    const after = controller.text.slice(replaceEnd);
    const replacement = trigger.triggerCharacter + option.value;

    controller.text = before + replacement + after;
    controller.cursorPosition = replaceStart + replacement.length;

    this.widget.onSelected?.(trigger, option);
    this._dismiss();
  };

  private _handleKeyEvent = (event: KeyEvent): KeyEventResult => {
    if (!this._isVisible) return 'ignored';

    switch (event.key) {
      case 'Escape':
        this._dismiss();
        return 'handled';
      case 'ArrowUp':
      case 'ArrowDown':
      case 'Enter':
        return 'ignored';
      default:
        return 'ignored';
    }
  };

  build(_context: BuildContext): Widget {
    if (!this._isVisible || this._options.length === 0) {
      return this.widget.child;
    }

    const onSelected = (option: AutocompleteOption) => {
      this._selectOption(option);
    };

    let optionsView: Widget;
    if (this.widget.optionsViewBuilder) {
      optionsView = this.widget.optionsViewBuilder(this._options, onSelected);
    } else {
      optionsView = this._buildDefaultOptionsView(onSelected);
    }

    return new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'start',
      children: [
        optionsView,
        this.widget.child,
      ],
    });
  }

  private _buildDefaultOptionsView(
    onSelected: (option: AutocompleteOption) => void,
  ): Widget {
    const items: SelectionItem[] = this._options.map((o) => ({
      label: o.label,
      value: o.value,
      description: o.description,
    }));

    return new SelectionList({
      items,
      onSelect: (value: string) => {
        const option = this._options.find((o) => o.value === value);
        if (option) {
          onSelected(option);
        }
      },
      onCancel: () => {
        this._dismiss();
      },
      showDescription: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Fuzzy matching helper
// ---------------------------------------------------------------------------

/**
 * Simple subsequence fuzzy match. Returns true if all characters of `query`
 * appear in `text` in order (case-insensitive).
 */
function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
    }
  }
  return qi === q.length;
}
