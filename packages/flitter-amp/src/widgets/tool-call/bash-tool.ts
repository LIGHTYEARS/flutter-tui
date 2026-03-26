// BashTool — shell command display with $ prefix + output + exit code
// Amp ref: Bash/shell_command tool — "$ command" header, spinner during exec, output + exit code

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

interface BashToolProps {
  toolCall: ToolCallItem;
  isExpanded: boolean;
}

/**
 * Renders a Bash / shell_command tool call.
 * Header shows "$ command" with accent coloring.
 * When expanded, shows stdout/stderr output and exit code.
 */
export class BashTool extends StatelessWidget {
  private readonly toolCall: ToolCallItem;
  private readonly isExpanded: boolean;

  constructor(props: BashToolProps) {
    super({});
    this.toolCall = props.toolCall;
    this.isExpanded = props.isExpanded;
  }

  build(context: BuildContext): Widget {
    const theme = AmpThemeProvider.maybeOf(context);
    const input = this.toolCall.rawInput ?? {};
    const command = (input['command'] ?? input['cmd'] ?? '') as string;

    const details: string[] = [];
    if (command) {
      const shortCmd = command.length > 80 ? command.slice(0, 80) + '…' : command;
      details.push(`$ ${shortCmd}`);
    }

    const header = new ToolHeader({
      name: this.toolCall.kind,
      status: this.toolCall.status,
      details,
    });

    if (!this.isExpanded) {
      return header;
    }

    const bodyChildren: Widget[] = [];

    const output = this.extractOutput();
    if (output) {
      bodyChildren.push(
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
      );
    }

    const exitCode = this.extractExitCode();
    if (exitCode !== null) {
      const exitColor = exitCode === 0
        ? (theme?.app.toolSuccess ?? Color.green)
        : (theme?.base.destructive ?? Color.red);
      bodyChildren.push(
        new Padding({
          padding: EdgeInsets.only({ left: 2 }),
          child: new Text({
            text: new TextSpan({
              text: `exit code: ${exitCode}`,
              style: new TextStyle({ foreground: exitColor, dim: true }),
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
   * Extracts stdout/stderr output from the result.
   */
  private extractOutput(): string {
    if (!this.toolCall.result) return '';
    if (this.toolCall.result.rawOutput) {
      const raw = this.toolCall.result.rawOutput;
      if (typeof raw === 'string') return raw;
      const stdout = (raw['stdout'] ?? '') as string;
      const stderr = (raw['stderr'] ?? '') as string;
      if (stdout || stderr) return [stdout, stderr].filter(Boolean).join('\n');
      return JSON.stringify(raw, null, 2);
    }
    return this.toolCall.result.content
      ?.map(c => c.content?.text ?? '')
      .join('\n') ?? '';
  }

  /**
   * Extracts the exit code from the result.
   */
  private extractExitCode(): number | null {
    const raw = this.toolCall.result?.rawOutput;
    if (raw && typeof raw === 'object' && 'exit_code' in raw) {
      return raw['exit_code'] as number;
    }
    return null;
  }
}
