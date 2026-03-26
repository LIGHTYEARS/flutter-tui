// InputArea — prompt bar matching Amp's F0H widget
// Amp ref: F0H with rounded border, borderColor: focused ? A.border : void 0
// Contains text field with autocomplete, mode label in footer

import { StatefulWidget, State, Widget } from 'flitter-core/src/framework/widget';
import { EdgeInsets } from 'flitter-core/src/layout/edge-insets';
import { Column } from 'flitter-core/src/widgets/flex';
import { Text } from 'flitter-core/src/widgets/text';
import { TextStyle } from 'flitter-core/src/core/text-style';
import { TextSpan } from 'flitter-core/src/core/text-span';
import { Color } from 'flitter-core/src/core/color';
import { TextField, TextEditingController } from 'flitter-core/src/widgets/text-field';
import { Container } from 'flitter-core/src/widgets/container';
import { Border, BorderSide, BoxDecoration } from 'flitter-core/src/layout/render-decorated';

interface InputAreaProps {
  onSubmit: (text: string) => void;
  isProcessing: boolean;
  mode: string | null;
}

export class InputArea extends StatefulWidget {
  readonly onSubmit: (text: string) => void;
  readonly isProcessing: boolean;
  readonly mode: string | null;

  constructor(props: InputAreaProps) {
    super({});
    this.onSubmit = props.onSubmit;
    this.isProcessing = props.isProcessing;
    this.mode = props.mode;
  }

  createState(): InputAreaState {
    return new InputAreaState();
  }
}

class InputAreaState extends State<InputArea> {
  private controller = new TextEditingController();

  build(): Widget {
    const isProcessing = this.widget.isProcessing;

    // Amp ref: F0H — rounded border, borderColor: focused ? A.border : void 0
    // We always show the border since the input is always the focused element
    // Amp uses colors.border = rgb(135,139,134) ≈ brightBlack in ANSI
    const border = Border.all(
      new BorderSide({ color: Color.brightBlack, width: 1, style: 'rounded' }),
    );

    const children: Widget[] = [
      // Bordered text field container
      new Container({
        decoration: new BoxDecoration({ border }),
        padding: EdgeInsets.only({ left: 1 }),
        child: new TextField({
          controller: this.controller,
          onSubmitted: (text: string) => {
            if (text.trim().length > 0 && !isProcessing) {
              this.widget.onSubmit(text.trim());
              this.controller.clear();
            }
          },
        }),
      }),
    ];

    // Amp ref: mode label shown as footer text below the input
    const mode = this.widget.mode;
    if (mode) {
      const modeText = isProcessing ? `⏳ ${mode}` : mode;
      children.push(
        new Text({
          text: new TextSpan({
            text: `  ${modeText}`,
            style: new TextStyle({
              foreground: isProcessing ? Color.yellow : Color.brightBlack,
              dim: !isProcessing,
            }),
          }),
        }),
      );
    }

    return new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'stretch',
      children,
    });
  }
}
