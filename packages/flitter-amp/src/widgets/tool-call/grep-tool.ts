// GrepTool — search result display with pattern + path + match count
// Amp ref: Grep/glob/Glob/Search tools — pattern and match summary

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

interface GrepToolProps {
  toolCall: ToolCallItem;
  isExpanded: boolean;
}

/**
 * Renders a Grep / glob / Glob / Search tool call.
 * Header shows the search pattern and path.
 * When expanded, shows match results summary.
 */
export class GrepTool extends StatelessWidget {
  private readonly toolCall: ToolCallItem;
  private readonly isExpanded: boolean;

  constructor(props: GrepToolProps) {
    super({});
    this.toolCall = props.toolCall;
    this.isExpanded = props.isExpanded;
  }

  build(context: BuildContext): Widget {
    const theme = AmpThemeProvider.maybeOf(context);
    const input = this.toolCall.rawInput ?? {};

    const pattern = (input['pattern'] ?? input['query'] ?? input['glob'] ?? '') as string;
    const path = (input['path'] ?? '') as string;

    const details: string[] = [];
    if (pattern) details.push(`/${pattern}/`);
    if (path) details.push(path);

    const matchCount = this.extractMatchCount();
    if (matchCount !== null) {
      details.push(`(${matchCount} matches)`);
    }

    const header = new ToolHeader({
      name: this.toolCall.kind,
      status: this.toolCall.status,
      details,
    });

    if (!this.isExpanded) {
      return header;
    }

    const output = this.extractOutput();
    if (!output) {
      return header;
    }

    return new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'stretch',
      children: [
        header,
        new Padding({
          padding: EdgeInsets.only({ left: 2, right: 2 }),
          child: new Text({
            text: new TextSpan({
              text: output.length > 2000 ? output.slice(0, 2000) + '\n…(truncated)' : output,
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

  /**
   * Attempts to extract match count from the result metadata.
   */
  private extractMatchCount(): number | null {
    const raw = this.toolCall.result?.rawOutput;
    if (raw && typeof raw === 'object') {
      if ('count' in raw) return raw['count'] as number;
      if ('matchCount' in raw) return raw['matchCount'] as number;
      if ('total' in raw) return raw['total'] as number;
    }
    return null;
  }

  /**
   * Extracts search result text from the tool result.
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
