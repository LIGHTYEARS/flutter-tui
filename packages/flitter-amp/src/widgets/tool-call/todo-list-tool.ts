// TodoListTool — todo list display with status icons
// Amp ref: todo_list/todo_write/todo_read tools
// Status icons: ○ pending, ◐ in-progress, ● completed, ∅ cancelled

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

interface TodoListToolProps {
  toolCall: ToolCallItem;
  isExpanded: boolean;
}

interface TodoEntry {
  content: string;
  status: string;
  priority?: string;
}

/**
 * Renders a todo_list / todo_write / todo_read tool call.
 * Shows a checklist with status icons:
 *   ○ pending, ◐ in-progress, ● completed, ∅ cancelled
 */
export class TodoListTool extends StatelessWidget {
  private readonly toolCall: ToolCallItem;
  private readonly isExpanded: boolean;

  constructor(props: TodoListToolProps) {
    super({});
    this.toolCall = props.toolCall;
    this.isExpanded = props.isExpanded;
  }

  build(context: BuildContext): Widget {
    const theme = AmpThemeProvider.maybeOf(context);

    const header = new ToolHeader({
      name: this.toolCall.kind,
      status: this.toolCall.status,
      details: this.toolCall.title ? [this.toolCall.title] : [],
    });

    if (!this.isExpanded) {
      return header;
    }

    const entries = this.extractTodoEntries();
    if (entries.length === 0) {
      return header;
    }

    const entryWidgets: Widget[] = entries.map(entry => {
      const { icon, color } = this.getStatusDisplay(entry.status, theme);
      return new Text({
        text: new TextSpan({
          children: [
            new TextSpan({
              text: `  ${icon} `,
              style: new TextStyle({ foreground: color }),
            }),
            new TextSpan({
              text: entry.content,
              style: new TextStyle({
                foreground: entry.status === 'completed'
                  ? (theme?.base.mutedForeground ?? Color.brightBlack)
                  : (theme?.base.foreground ?? Color.defaultColor),
                dim: entry.status === 'completed',
              }),
            }),
          ],
        }),
      });
    });

    return new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'stretch',
      children: [
        header,
        new Padding({
          padding: EdgeInsets.only({ left: 2 }),
          child: new Column({
            mainAxisSize: 'min',
            crossAxisAlignment: 'stretch',
            children: entryWidgets,
          }),
        }),
      ],
    });
  }

  /**
   * Returns the status icon and color for a todo entry.
   */
  private getStatusDisplay(status: string, theme: ReturnType<typeof AmpThemeProvider.maybeOf>): { icon: string; color: Color } {
    switch (status) {
      case 'pending':
        return { icon: '○', color: theme?.base.mutedForeground ?? Color.brightBlack };
      case 'in_progress':
        return { icon: '◐', color: theme?.base.warning ?? Color.yellow };
      case 'completed':
        return { icon: '●', color: theme?.app.toolSuccess ?? Color.green };
      case 'cancelled':
        return { icon: '∅', color: theme?.base.mutedForeground ?? Color.brightBlack };
      default:
        return { icon: '○', color: theme?.base.mutedForeground ?? Color.brightBlack };
    }
  }

  /**
   * Extracts todo entries from the tool's rawInput or result.
   */
  private extractTodoEntries(): TodoEntry[] {
    const input = this.toolCall.rawInput;
    if (input) {
      const todos = input['todos'] as TodoEntry[] | undefined;
      if (Array.isArray(todos)) {
        return todos.map(t => ({
          content: (t.content ?? '') as string,
          status: (t.status ?? 'pending') as string,
          priority: t.priority as string | undefined,
        }));
      }
    }

    const raw = this.toolCall.result?.rawOutput;
    if (raw && typeof raw === 'object') {
      const todos = (raw['todos'] ?? raw['items'] ?? []) as TodoEntry[];
      if (Array.isArray(todos)) {
        return todos.map(t => ({
          content: (t.content ?? '') as string,
          status: (t.status ?? 'pending') as string,
          priority: t.priority as string | undefined,
        }));
      }
    }

    return [];
  }
}
