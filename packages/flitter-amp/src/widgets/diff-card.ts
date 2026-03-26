// DiffCard — file diff display using flitter-core's DiffView
// Shows a bordered diff with file path header

import { StatelessWidget, Widget, type BuildContext } from 'flitter-core/src/framework/widget';
import { Column } from 'flitter-core/src/widgets/flex';
import { Text } from 'flitter-core/src/widgets/text';
import { TextStyle } from 'flitter-core/src/core/text-style';
import { TextSpan } from 'flitter-core/src/core/text-span';
import { Color } from 'flitter-core/src/core/color';
import { Padding } from 'flitter-core/src/widgets/padding';
import { EdgeInsets } from 'flitter-core/src/layout/edge-insets';
import { DiffView } from 'flitter-core/src/widgets/diff-view';
import { Container } from 'flitter-core/src/widgets/container';
import { BoxDecoration, Border, BorderSide } from 'flitter-core/src/layout/render-decorated';
import { Theme } from 'flitter-core/src/widgets/theme';
import { AmpThemeProvider } from '../themes';

interface DiffCardProps {
  filePath: string;
  diff: string;
}

export class DiffCard extends StatelessWidget {
  private readonly filePath: string;
  private readonly diff: string;

  constructor(props: DiffCardProps) {
    super({});
    this.filePath = props.filePath;
    this.diff = props.diff;
  }

  build(context: BuildContext): Widget {
    const theme = AmpThemeProvider.maybeOf(context);
    const borderColor = theme?.base.border ?? Color.brightBlack;
    const borderSide = new BorderSide({ color: borderColor, width: 1, style: 'rounded' });

    const diffContent = new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'stretch',
      children: [
        new Text({
          text: new TextSpan({
            text: ` ${this.filePath}`,
            style: new TextStyle({
              foreground: theme?.base.mutedForeground ?? Color.brightBlack,
              bold: true,
            }),
          }),
        }),
        new DiffView({
          diff: this.diff,
          showLineNumbers: true,
        }),
      ],
    });

    const coreThemeData = {
      ...Theme.defaultTheme(),
      diffAdded: theme?.app.diffAdded ?? Color.green,
      diffRemoved: theme?.app.diffRemoved ?? Color.red,
    };

    return new Padding({
      padding: EdgeInsets.only({ left: 4, right: 2, top: 0, bottom: 1 }),
      child: new Container({
        decoration: new BoxDecoration({
          border: Border.all(borderSide),
        }),
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: new Theme({
          data: coreThemeData,
          child: diffContent,
        }),
      }),
    });
  }
}
