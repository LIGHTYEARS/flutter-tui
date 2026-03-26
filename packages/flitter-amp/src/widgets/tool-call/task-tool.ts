// TaskTool — sub-agent recursive rendering using GenericToolCard
// Amp ref: Task/oracle tool — recursively renders nested tool calls

import { StatelessWidget, Widget, BuildContext } from 'flitter-core/src/framework/widget';
import { GenericToolCard } from './generic-tool-card';
import type { ToolCallItem } from '../../acp/types';

interface TaskToolProps {
  toolCall: ToolCallItem;
  isExpanded: boolean;
}

/**
 * Renders a Task / oracle sub-agent tool call.
 * Delegates to GenericToolCard which supports recursive nested tool call rendering.
 */
export class TaskTool extends StatelessWidget {
  private readonly toolCall: ToolCallItem;
  private readonly isExpanded: boolean;

  constructor(props: TaskToolProps) {
    super({});
    this.toolCall = props.toolCall;
    this.isExpanded = props.isExpanded;
  }

  build(_context: BuildContext): Widget {
    return new GenericToolCard({
      toolCall: this.toolCall,
      isExpanded: this.isExpanded,
    });
  }
}
