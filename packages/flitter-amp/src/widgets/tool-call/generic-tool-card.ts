// GenericToolCard — default tool call card with StickyHeader, ToolHeader, and expandable body
// Amp ref: xD widget — header (ToolHeader) + body (input/thinking/nested tools/output)
// Body sections rendered when expanded: inputSection, thinkingBlocks, nested toolCalls, outputSection

import { StatelessWidget, Widget, BuildContext } from 'flitter-core/src/framework/widget';
import { Column } from 'flitter-core/src/widgets/flex';
import { Text } from 'flitter-core/src/widgets/text';
import { TextStyle } from 'flitter-core/src/core/text-style';
import { TextSpan } from 'flitter-core/src/core/text-span';
import { Color } from 'flitter-core/src/core/color';
import { Padding } from 'flitter-core/src/widgets/padding';
import { EdgeInsets } from 'flitter-core/src/layout/edge-insets';
import { StickyHeader } from 'flitter-core/src/widgets/sticky-header';
import { Markdown } from 'flitter-core/src/widgets/markdown';
import { DiffView } from 'flitter-core/src/widgets/diff-view';
import { SizedBox } from 'flitter-core/src/widgets/sized-box';
import { ToolHeader } from './tool-header';
import { AmpThemeProvider } from '../../themes/index';
import type { ToolCallItem } from '../../acp/types';

interface GenericToolCardProps {
  toolCall: ToolCallItem;
  isExpanded: boolean;
  onToggle?: () => void;
  hideHeader?: boolean;
  children?: Widget[];
}

/**
 * A generic tool call card used as the default renderer for all tool types.
 *
 * Layout:
 *   StickyHeader
 *     header: ToolHeader (status + name + details)
 *     body: Column
 *       - inputSection (Markdown of rawInput)
 *       - outputSection (Markdown of result content, or DiffView for diffs)
 *       - children (optional extra widgets injected by specific tools)
 */
export class GenericToolCard extends StatelessWidget {
  private readonly toolCall: ToolCallItem;
  private readonly isExpanded: boolean;
  private readonly hideHeader: boolean;
  private readonly extraChildren: Widget[];

  constructor(props: GenericToolCardProps) {
    super({});
    this.toolCall = props.toolCall;
    this.isExpanded = props.isExpanded;
    this.hideHeader = props.hideHeader ?? false;
    this.extraChildren = props.children ?? [];
  }

  build(context: BuildContext): Widget {
    const theme = AmpThemeProvider.maybeOf(context);
    const details = this.extractDetails();
    const header = this.hideHeader
      ? new SizedBox({})
      : new ToolHeader({
          name: this.toolCall.kind,
          status: this.toolCall.status,
          details,
        });

    if (!this.isExpanded) {
      return header;
    }

    const bodyChildren: Widget[] = [];

    const inputText = this.extractInputText();
    if (inputText) {
      bodyChildren.push(
        new Padding({
          padding: EdgeInsets.only({ left: 2 }),
          child: new Text({
            text: new TextSpan({
              text: inputText,
              style: new TextStyle({
                foreground: theme?.base.mutedForeground ?? Color.brightBlack,
                dim: true,
              }),
            }),
          }),
        }),
      );
    }

    const diff = this.extractDiff();
    if (diff) {
      bodyChildren.push(
        new Padding({
          padding: EdgeInsets.only({ left: 2, right: 2 }),
          child: new DiffView({ diff }),
        }),
      );
    } else {
      const outputText = this.extractOutputText();
      if (outputText) {
        bodyChildren.push(
          new Padding({
            padding: EdgeInsets.only({ left: 2, right: 2 }),
            child: new Markdown({ markdown: outputText }),
          }),
        );
      }
    }

    for (const child of this.extraChildren) {
      bodyChildren.push(child);
    }

    if (bodyChildren.length === 0) {
      return header;
    }

    const body = new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'stretch',
      children: bodyChildren,
    });

    return new StickyHeader({
      header,
      body,
    });
  }

  /**
   * Extracts human-readable detail strings from the tool call (e.g. file path, command).
   */
  private extractDetails(): string[] {
    const details: string[] = [];
    if (this.toolCall.title) {
      details.push(this.toolCall.title);
    }
    return details;
  }

  /**
   * Builds a compact input summary from rawInput for display in the body.
   */
  private extractInputText(): string {
    if (!this.toolCall.rawInput) return '';
    const keys = Object.keys(this.toolCall.rawInput);
    if (keys.length === 0) return '';

    const parts: string[] = [];
    for (const key of keys) {
      const val = this.toolCall.rawInput[key];
      if (typeof val === 'string') {
        parts.push(`${key}: ${val.length > 120 ? val.slice(0, 120) + '…' : val}`);
      } else if (val !== undefined && val !== null) {
        const s = JSON.stringify(val);
        parts.push(`${key}: ${s.length > 120 ? s.slice(0, 120) + '…' : s}`);
      }
    }
    return parts.join('\n');
  }

  /**
   * Attempts to extract a unified diff string from the tool result.
   */
  private extractDiff(): string | null {
    if (!this.toolCall.result) return null;

    const raw = this.toolCall.result.rawOutput;
    if (raw) {
      const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
      if (rawStr.includes('@@') && (rawStr.includes('---') || rawStr.includes('+++'))) {
        return rawStr;
      }
    }

    if (this.toolCall.result.content) {
      for (const c of this.toolCall.result.content) {
        const text = c.content?.text;
        if (text && text.includes('@@') && (text.includes('---') || text.includes('+++'))) {
          return text;
        }
      }
    }

    return null;
  }

  /**
   * Extracts plain text output from the tool result for display.
   */
  private extractOutputText(): string {
    if (!this.toolCall.result) return '';

    if (this.toolCall.result.rawOutput) {
      const s = JSON.stringify(this.toolCall.result.rawOutput, null, 2);
      return s.length > 2000 ? s.slice(0, 2000) + '\n…(truncated)' : s;
    }

    return this.toolCall.result.content
      ?.map(c => c.content?.text ?? '')
      .join('\n') ?? '';
  }
}
