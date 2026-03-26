// ReadTool — file read display: file path + optional line range
// Amp ref: Read tool — shows file path and line range as details

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

interface ReadToolProps {
  toolCall: ToolCallItem;
  isExpanded: boolean;
}

/**
 * Renders a Read tool call showing the file path and optional line range.
 * When expanded, displays the file content from the result.
 */
export class ReadTool extends StatelessWidget {
  private readonly toolCall: ToolCallItem;
  private readonly isExpanded: boolean;

  constructor(props: ReadToolProps) {
    super({});
    this.toolCall = props.toolCall;
    this.isExpanded = props.isExpanded;
  }

  build(context: BuildContext): Widget {
    const theme = AmpThemeProvider.maybeOf(context);
    const input = this.toolCall.rawInput ?? {};

    const filePath = (input['file_path'] ?? input['path'] ?? '') as string;
    const offset = input['offset'] as number | undefined;
    const limit = input['limit'] as number | undefined;

    const details: string[] = [];
    if (filePath) details.push(filePath);
    if (offset !== undefined && limit !== undefined) {
      details.push(`L${offset}-${offset + limit}`);
    } else if (offset !== undefined) {
      details.push(`L${offset}`);
    }

    const header = new ToolHeader({
      name: 'Read',
      status: this.toolCall.status,
      details,
    });

    if (!this.isExpanded) {
      return header;
    }

    const outputText = this.extractOutput();
    const bodyChildren: Widget[] = [];

    if (outputText) {
      bodyChildren.push(
        new Padding({
          padding: EdgeInsets.only({ left: 2, right: 2 }),
          child: new Text({
            text: new TextSpan({
              text: outputText.length > 1000 ? outputText.slice(0, 1000) + '\n…(truncated)' : outputText,
              style: new TextStyle({
                foreground: theme?.base.mutedForeground ?? Color.brightBlack,
                dim: true,
              }),
            }),
          }),
        }),
      );
    }

    if (bodyChildren.length === 0) {
      return header;
    }

    return new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'stretch',
      children: [header, ...bodyChildren],
    });
  }

  /**
   * Extracts file content text from the tool result.
   */
  private extractOutput(): string {
    if (!this.toolCall.result) return '';
    if (this.toolCall.result.rawOutput) {
      return JSON.stringify(this.toolCall.result.rawOutput, null, 2);
    }
    return this.toolCall.result.content
      ?.map(c => c.content?.text ?? '')
      .join('\n') ?? '';
  }
}
