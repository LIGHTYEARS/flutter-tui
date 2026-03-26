// @deprecated — Use ToolCallWidget from './tool-call/tool-call-widget' instead.
// This file is kept for backward compatibility only.
// The new dispatch-based ToolCallWidget provides 35+ tool type-specific renderers.

import { StatelessWidget, Widget } from 'flitter-core/src/framework/widget';
import { ToolCallWidget } from './tool-call/tool-call-widget';
import type { ToolCallItem } from '../acp/types';

interface ToolCallBlockProps {
  item: ToolCallItem;
}

/**
 * @deprecated Use {@link ToolCallWidget} for the new dispatch-based tool rendering.
 * This wrapper delegates to ToolCallWidget for backward compatibility.
 */
export class ToolCallBlock extends StatelessWidget {
  private readonly item: ToolCallItem;

  constructor(props: ToolCallBlockProps) {
    super({});
    this.item = props.item;
  }

  build(): Widget {
    return new ToolCallWidget({
      toolCall: this.item,
      isExpanded: !this.item.collapsed,
    });
  }
}
