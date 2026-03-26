import { StatefulWidget, State, Widget, type BuildContext } from 'flitter-core/src/framework/widget';
import { EdgeInsets } from 'flitter-core/src/layout/edge-insets';
import { Column } from 'flitter-core/src/widgets/flex';
import { Text } from 'flitter-core/src/widgets/text';
import { TextStyle } from 'flitter-core/src/core/text-style';
import { TextSpan } from 'flitter-core/src/core/text-span';
import { Color } from 'flitter-core/src/core/color';
import { TextField, TextEditingController } from 'flitter-core/src/widgets/text-field';
import { Container } from 'flitter-core/src/widgets/container';
import { BoxConstraints } from 'flitter-core/src/core/box-constraints';
import { Border, BorderSide, BoxDecoration } from 'flitter-core/src/layout/render-decorated';
import { Stack, Positioned } from 'flitter-core/src/widgets/stack';
import { Autocomplete } from 'flitter-core/src/widgets/autocomplete';
import type { AutocompleteTrigger } from 'flitter-core/src/widgets/autocomplete';
import { AmpThemeProvider, agentModeColor } from '../themes/index';

export interface BorderOverlayText {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  child: Widget;
}

interface InputAreaProps {
  onSubmit: (text: string) => void;
  isProcessing: boolean;
  mode: string | null;
  submitWithMeta?: boolean;
  topWidget?: Widget;
  autocompleteTriggers?: AutocompleteTrigger[];
  imageAttachments?: number;
  overlayTexts?: BorderOverlayText[];
}

type ShellMode = 'shell' | 'background' | null;

export class InputArea extends StatefulWidget {
  readonly onSubmit: (text: string) => void;
  readonly isProcessing: boolean;
  readonly mode: string | null;
  readonly submitWithMeta: boolean;
  readonly topWidget?: Widget;
  readonly autocompleteTriggers?: AutocompleteTrigger[];
  readonly imageAttachments: number;
  readonly overlayTexts: BorderOverlayText[];

  constructor(props: InputAreaProps) {
    super({});
    this.onSubmit = props.onSubmit;
    this.isProcessing = props.isProcessing;
    this.mode = props.mode;
    this.submitWithMeta = props.submitWithMeta ?? false;
    this.topWidget = props.topWidget;
    this.autocompleteTriggers = props.autocompleteTriggers;
    this.imageAttachments = props.imageAttachments ?? 0;
    this.overlayTexts = props.overlayTexts ?? [];
  }

  createState(): InputAreaState {
    return new InputAreaState();
  }
}

class InputAreaState extends State<InputArea> {
  private controller = new TextEditingController();
  private currentText = '';

  override initState(): void {
    super.initState();
    this.controller.addListener(this._onTextChanged);
  }

  override dispose(): void {
    this.controller.removeListener(this._onTextChanged);
    super.dispose();
  }

  private _onTextChanged = (): void => {
    const newText = this.controller.text;
    if (newText !== this.currentText) {
      const oldShell = detectShellMode(this.currentText);
      const newShell = detectShellMode(newText);
      this.currentText = newText;
      if (oldShell !== newShell) {
        this.setState(() => {});
      }
    }
  };

  private _handleSubmit = (text: string): void => {
    if (text.trim().length > 0 && !this.widget.isProcessing) {
      this.widget.onSubmit(text.trim());
      this.controller.clear();
    }
  };

  build(context: BuildContext): Widget {
    const isProcessing = this.widget.isProcessing;
    const theme = AmpThemeProvider.maybeOf(context);

    const shellMode = detectShellMode(this.controller.text);

    const borderColor = shellMode
      ? (theme?.app.shellMode ?? Color.cyan)
      : (theme?.base.border ?? Color.brightBlack);

    const border = Border.all(
      new BorderSide({ color: borderColor, width: 1, style: 'rounded' }),
    );

    const textField = new TextField({
      controller: this.controller,
      autofocus: true,
      placeholder: 'Ask a question or $ for shell...',
      style: new TextStyle({ foreground: theme?.base.foreground }),
      maxLines: this.widget.submitWithMeta ? undefined : 1,
      onSubmitted: this.widget.submitWithMeta ? undefined : this._handleSubmit,
      onSubmit: this.widget.submitWithMeta ? this._handleSubmit : undefined,
    });

    const defaultFileTrigger: AutocompleteTrigger = {
      triggerCharacter: '@',
      optionsBuilder: () => [],
    };

    const triggers: AutocompleteTrigger[] = [
      defaultFileTrigger,
      ...(this.widget.autocompleteTriggers ?? []),
    ];

    const autocompleteWrapped = new Autocomplete({
      child: textField,
      controller: this.controller,
      triggers,
    });

    const borderedInput = new Container({
      decoration: new BoxDecoration({ border }),
      padding: EdgeInsets.symmetric({ horizontal: 1 }),
      constraints: new BoxConstraints({ minHeight: 3 }),
      child: autocompleteWrapped,
    });

    const mode = this.widget.mode;
    const shellLabel = shellMode === 'background' ? 'Background shell' : shellMode === 'shell' ? 'Shell mode' : null;
    const effectiveLabel = shellLabel ?? mode;

    const overlays: Widget[] = [];

    if (effectiveLabel) {
      const labelColor = shellLabel
        ? (theme?.app.shellMode ?? Color.cyan)
        : theme
          ? agentModeColor(effectiveLabel, theme)
          : Color.green;

      overlays.push(
        new Positioned({
          top: 0,
          right: 1,
          child: new Text({
            text: new TextSpan({
              text: isProcessing && !shellLabel ? ` ⏳ ${effectiveLabel} ` : ` ${effectiveLabel} `,
              style: new TextStyle({
                foreground: labelColor,
                dim: isProcessing && !shellLabel,
              }),
            }),
          }),
        }),
      );
    }

    if (this.widget.imageAttachments > 0) {
      const badgeColor = theme?.base.info ?? Color.blue;
      overlays.push(
        new Positioned({
          bottom: 0,
          left: 1,
          child: new Text({
            text: new TextSpan({
              text: ` [${this.widget.imageAttachments} image${this.widget.imageAttachments > 1 ? 's' : ''}] `,
              style: new TextStyle({ foreground: badgeColor }),
            }),
          }),
        }),
      );
    }

    for (const overlay of this.widget.overlayTexts) {
      const pos: Record<string, number> = {};
      if (overlay.position.startsWith('top')) pos.top = 0;
      if (overlay.position.startsWith('bottom')) pos.bottom = 0;
      if (overlay.position.endsWith('left')) pos.left = 1;
      if (overlay.position.endsWith('right')) pos.right = 1;

      overlays.push(
        new Positioned({
          ...pos,
          child: overlay.child,
        }),
      );
    }

    let inputWidget: Widget;
    if (overlays.length > 0) {
      inputWidget = new Stack({
        fit: 'passthrough',
        children: [borderedInput, ...overlays],
      });
    } else {
      inputWidget = borderedInput;
    }

    if (this.widget.topWidget) {
      return new Column({
        mainAxisSize: 'min',
        crossAxisAlignment: 'stretch',
        children: [this.widget.topWidget, inputWidget],
      });
    }

    return inputWidget;
  }
}

function detectShellMode(text: string): ShellMode {
  if (text.startsWith('$$')) return 'background';
  if (text.startsWith('$')) return 'shell';
  return null;
}
