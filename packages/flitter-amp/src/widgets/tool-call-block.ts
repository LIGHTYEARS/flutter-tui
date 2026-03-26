// ToolCallBlock — tool call display matching Amp's xD/wQ widgets
// Amp ref: wQ function — [statusIcon] [ToolName bold] [detail dim]
// Status: ✓ done (green), ✗ error (red), ⋯ in-progress (blue), ⋯ queued (yellow)
// Expand/collapse: ▶/▼ toggle (lT widget, mutedForeground)

import { StatelessWidget, Widget } from 'flitter-core/src/framework/widget';
import { Column } from 'flitter-core/src/widgets/flex';
import { Text } from 'flitter-core/src/widgets/text';
import { TextStyle } from 'flitter-core/src/core/text-style';
import { TextSpan } from 'flitter-core/src/core/text-span';
import { Color } from 'flitter-core/src/core/color';
import { Padding } from 'flitter-core/src/widgets/padding';
import { EdgeInsets } from 'flitter-core/src/layout/edge-insets';
import { DiffView } from 'flitter-core/src/widgets/diff-view';
import type { ToolCallItem } from '../acp/types';

interface ToolCallBlockProps {
  item: ToolCallItem;
}

export class ToolCallBlock extends StatelessWidget {
  private readonly item: ToolCallItem;

  constructor(props: ToolCallBlockProps) {
    super({});
    this.item = props.item;
  }

  build(): Widget {
    const { item } = this;

    // Amp ref: rR function — status icons
    // done: ✓ (U+2713), error/cancelled: ✗ (U+2715), in-progress/queued: ⋯ (U+22EF)
    const statusIcon =
      item.status === 'completed' ? '\u2713' :
      item.status === 'failed' ? '\u2715' :
      '\u22EF';

    // Amp ref: j0 function — status colors
    // done: app.toolSuccess (green), error: app.toolError (red),
    // in_progress: app.toolRunning (blue), queued/pending: app.waiting (yellow)
    const statusColor =
      item.status === 'completed' ? Color.green :
      item.status === 'failed' ? Color.red :
      item.status === 'in_progress' ? Color.blue :
      Color.yellow;

    // Amp ref: wQ — header format: [statusIcon] [ToolName bold] [detail dim]
    const headerSpans: TextSpan[] = [
      new TextSpan({
        text: `${statusIcon} `,
        style: new TextStyle({ foreground: statusColor }),
      }),
      new TextSpan({
        text: item.kind,
        style: new TextStyle({ foreground: Color.defaultColor, bold: true }),
      }),
    ];

    // Detail text (path/command) — Amp ref: FkL function extracts from tool input
    if (item.title) {
      headerSpans.push(new TextSpan({
        text: ` ${item.title}`,
        style: new TextStyle({ foreground: Color.defaultColor, dim: true }),
      }));
    }

    const children: Widget[] = [
      new Text({
        text: new TextSpan({ children: headerSpans }),
      }),
    ];

    // If expanded, show details
    if (!item.collapsed) {
      const diff = this.extractDiff();
      if (diff) {
        children.push(
          new Padding({
            padding: EdgeInsets.only({ left: 2, right: 2 }),
            child: new DiffView({ diff }),
          }),
        );
      } else if (item.result) {
        const output = this.extractOutput();
        if (output) {
          children.push(
            new Padding({
              padding: EdgeInsets.only({ left: 2, right: 2 }),
              child: new Text({
                text: new TextSpan({
                  text: output,
                  style: new TextStyle({ foreground: Color.defaultColor, dim: true }),
                }),
              }),
            }),
          );
        }
      }
    }

    return new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'start',
      children,
    });
  }

  private extractDiff(): string | null {
    if (!this.item.result) return null;

    const raw = this.item.result.rawOutput;
    if (raw) {
      const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
      if (rawStr.includes('@@') && (rawStr.includes('---') || rawStr.includes('+++'))) {
        return rawStr;
      }
    }

    if (this.item.result.content) {
      for (const c of this.item.result.content) {
        const text = c.content?.text;
        if (text && text.includes('@@') && (text.includes('---') || text.includes('+++'))) {
          return text;
        }
      }
    }

    return null;
  }

  private extractOutput(): string {
    if (!this.item.result) return '';

    if (this.item.result.rawOutput) {
      return JSON.stringify(this.item.result.rawOutput, null, 2).slice(0, 500);
    }

    return this.item.result.content
      ?.map(c => c.content?.text ?? '')
      .join('\n') ?? '';
  }
}
