// EditFileTool — file edit display wrapping DiffView from flitter-core
// Amp ref: edit_file tool — shows file path + diff of changes

import { StatelessWidget, Widget, BuildContext } from 'flitter-core/src/framework/widget';
import { Column } from 'flitter-core/src/widgets/flex';
import { Text } from 'flitter-core/src/widgets/text';
import { TextStyle } from 'flitter-core/src/core/text-style';
import { TextSpan } from 'flitter-core/src/core/text-span';
import { Color } from 'flitter-core/src/core/color';
import { Padding } from 'flitter-core/src/widgets/padding';
import { EdgeInsets } from 'flitter-core/src/layout/edge-insets';
import { DiffView } from 'flitter-core/src/widgets/diff-view';
import { ToolHeader } from './tool-header';
import { AmpThemeProvider } from '../../themes/index';
import type { ToolCallItem } from '../../acp/types';

interface EditFileToolProps {
  toolCall: ToolCallItem;
  isExpanded: boolean;
}

/**
 * Renders an edit_file / apply_patch / undo_edit tool call.
 * Shows the file path in the header and a DiffView when expanded.
 */
export class EditFileTool extends StatelessWidget {
  private readonly toolCall: ToolCallItem;
  private readonly isExpanded: boolean;

  constructor(props: EditFileToolProps) {
    super({});
    this.toolCall = props.toolCall;
    this.isExpanded = props.isExpanded;
  }

  build(context: BuildContext): Widget {
    const theme = AmpThemeProvider.maybeOf(context);
    const input = this.toolCall.rawInput ?? {};
    const filePath = (input['file_path'] ?? input['path'] ?? '') as string;

    const header = new ToolHeader({
      name: this.toolCall.kind,
      status: this.toolCall.status,
      details: filePath ? [filePath] : [],
    });

    if (!this.isExpanded) {
      return header;
    }

    const diff = this.extractDiff();
    const bodyChildren: Widget[] = [];

    if (diff) {
      bodyChildren.push(
        new Padding({
          padding: EdgeInsets.only({ left: 2, right: 2 }),
          child: new DiffView({ diff, showLineNumbers: true }),
        }),
      );
    } else {
      const summary = this.extractSummary();
      if (summary) {
        bodyChildren.push(
          new Padding({
            padding: EdgeInsets.only({ left: 2, right: 2 }),
            child: new Text({
              text: new TextSpan({
                text: summary,
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
   * Extracts a unified diff from the tool result or rawInput.
   */
  private extractDiff(): string | null {
    const checkDiff = (s: string): string | null =>
      (s.includes('@@') && (s.includes('---') || s.includes('+++'))) ? s : null;

    if (this.toolCall.result?.rawOutput) {
      const raw = this.toolCall.result.rawOutput;
      const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
      const d = checkDiff(rawStr);
      if (d) return d;
    }

    if (this.toolCall.result?.content) {
      for (const c of this.toolCall.result.content) {
        const text = c.content?.text;
        if (text) {
          const d = checkDiff(text);
          if (d) return d;
        }
      }
    }

    const input = this.toolCall.rawInput;
    if (input) {
      const oldStr = input['old_str'] as string | undefined;
      const newStr = input['new_str'] as string | undefined;
      if (oldStr !== undefined && newStr !== undefined) {
        return `--- a\n+++ b\n@@ @@\n${oldStr.split('\n').map(l => `-${l}`).join('\n')}\n${newStr.split('\n').map(l => `+${l}`).join('\n')}`;
      }
    }

    return null;
  }

  /**
   * Extracts a text summary when no diff is available.
   */
  private extractSummary(): string {
    if (!this.toolCall.result) return '';
    if (this.toolCall.result.rawOutput) {
      return JSON.stringify(this.toolCall.result.rawOutput, null, 2).slice(0, 500);
    }
    return this.toolCall.result.content
      ?.map(c => c.content?.text ?? '')
      .join('\n')
      .slice(0, 500) ?? '';
  }
}
