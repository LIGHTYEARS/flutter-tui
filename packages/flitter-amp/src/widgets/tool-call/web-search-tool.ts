// WebSearchTool — search query + result links display
// Amp ref: WebSearch/read_web_page — shows query and result links

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

interface WebSearchToolProps {
  toolCall: ToolCallItem;
  isExpanded: boolean;
}

/**
 * Renders a WebSearch / read_web_page tool call.
 * Header shows the search query. When expanded, shows result URLs/content.
 */
export class WebSearchTool extends StatelessWidget {
  private readonly toolCall: ToolCallItem;
  private readonly isExpanded: boolean;

  constructor(props: WebSearchToolProps) {
    super({});
    this.toolCall = props.toolCall;
    this.isExpanded = props.isExpanded;
  }

  build(context: BuildContext): Widget {
    const theme = AmpThemeProvider.maybeOf(context);
    const input = this.toolCall.rawInput ?? {};

    const query = (input['query'] ?? input['url'] ?? '') as string;

    const header = new ToolHeader({
      name: this.toolCall.kind,
      status: this.toolCall.status,
      details: query ? [query] : [],
    });

    if (!this.isExpanded) {
      return header;
    }

    const bodyChildren: Widget[] = [];
    const links = this.extractLinks();

    if (links.length > 0) {
      for (const link of links) {
        bodyChildren.push(
          new Padding({
            padding: EdgeInsets.only({ left: 2 }),
            child: new Text({
              text: new TextSpan({
                text: `→ ${link}`,
                style: new TextStyle({
                  foreground: theme?.app.link ?? Color.cyan,
                }),
              }),
            }),
          }),
        );
      }
    } else {
      const output = this.extractOutput();
      if (output) {
        bodyChildren.push(
          new Padding({
            padding: EdgeInsets.only({ left: 2, right: 2 }),
            child: new Text({
              text: new TextSpan({
                text: output.length > 1000 ? output.slice(0, 1000) + '\n…(truncated)' : output,
                style: new TextStyle({
                  foreground: theme?.base.mutedForeground ?? Color.brightBlack,
                  dim: true,
                }),
              }),
            }),
          }),
        );
      }
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
   * Extracts URLs from the tool result.
   */
  private extractLinks(): string[] {
    const raw = this.toolCall.result?.rawOutput;
    if (!raw || typeof raw !== 'object') return [];

    const results = (raw['results'] ?? raw['links'] ?? []) as Array<Record<string, unknown>>;
    if (!Array.isArray(results)) return [];

    return results
      .map(r => (r['url'] ?? r['link'] ?? r['href'] ?? '') as string)
      .filter(Boolean)
      .slice(0, 10);
  }

  /**
   * Extracts text output from the result.
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
