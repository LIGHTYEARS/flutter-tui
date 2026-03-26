// CreateFileTool — file creation card showing the file path
// Amp ref: create_file tool — shows the created file path

import { StatelessWidget, Widget, BuildContext } from 'flitter-core/src/framework/widget';
import { Column } from 'flitter-core/src/widgets/flex';
import { Text } from 'flitter-core/src/widgets/text';
import { TextStyle } from 'flitter-core/src/core/text-style';
import { TextSpan } from 'flitter-core/src/core/text-span';
import { Color } from 'flitter-core/src/core/color';
import { Padding } from 'flitter-core/src/widgets/padding';
import { EdgeInsets } from 'flitter-core/src/layout/edge-insets';
import { ToolHeader } from './tool-header';
import { AmpThemeProvider } from '../../themes/index';
import type { ToolCallItem } from '../../acp/types';

interface CreateFileToolProps {
  toolCall: ToolCallItem;
  isExpanded: boolean;
}

/**
 * Renders a create_file tool call showing the file path being created.
 * When expanded, shows file content preview or creation result.
 */
export class CreateFileTool extends StatelessWidget {
  private readonly toolCall: ToolCallItem;
  private readonly isExpanded: boolean;

  constructor(props: CreateFileToolProps) {
    super({});
    this.toolCall = props.toolCall;
    this.isExpanded = props.isExpanded;
  }

  build(context: BuildContext): Widget {
    const theme = AmpThemeProvider.maybeOf(context);
    const input = this.toolCall.rawInput ?? {};
    const filePath = (input['file_path'] ?? input['path'] ?? '') as string;

    const header = new ToolHeader({
      name: 'CreateFile',
      status: this.toolCall.status,
      details: filePath ? [filePath] : [],
    });

    if (!this.isExpanded) {
      return header;
    }

    const content = (input['content'] ?? '') as string;
    if (!content) {
      return header;
    }

    const preview = content.length > 500 ? content.slice(0, 500) + '\n…(truncated)' : content;

    return new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'stretch',
      children: [
        header,
        new Padding({
          padding: EdgeInsets.only({ left: 2, right: 2 }),
          child: new Text({
            text: new TextSpan({
              text: preview,
              style: new TextStyle({
                foreground: theme?.base.mutedForeground ?? Color.brightBlack,
                dim: true,
              }),
            }),
          }),
        }),
      ],
    });
  }
}
