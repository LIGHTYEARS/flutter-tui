// ThinkingBlock — collapsible thinking/reasoning display
// Amp ref: zk widget
// Streaming: accent (magenta) with braille spinner ●
// Done: success (green) with ✓
// Cancelled: warning (yellow) with "(interrupted)"
// Content: dim, italic when expanded

import { StatelessWidget, Widget } from 'flitter-core/src/framework/widget';
import { Column } from 'flitter-core/src/widgets/flex';
import { Text } from 'flitter-core/src/widgets/text';
import { TextStyle } from 'flitter-core/src/core/text-style';
import { TextSpan } from 'flitter-core/src/core/text-span';
import { Color } from 'flitter-core/src/core/color';
import { Padding } from 'flitter-core/src/widgets/padding';
import { EdgeInsets } from 'flitter-core/src/layout/edge-insets';
import type { ThinkingItem } from '../acp/types';

interface ThinkingBlockProps {
  item: ThinkingItem;
}

export class ThinkingBlock extends StatelessWidget {
  private readonly item: ThinkingItem;

  constructor(props: ThinkingBlockProps) {
    super({});
    this.item = props.item;
  }

  build(): Widget {
    const { item } = this;

    // Amp ref: zk widget — state-dependent icon and color
    let icon: string;
    let color: Color;
    let suffix = '';

    if (item.isStreaming) {
      // Streaming: accent (magenta) with ● indicator
      icon = '● ';
      color = Color.magenta;
    } else if (item.text.length > 0) {
      // Done: success (green) with ✓
      icon = '\u2713 ';
      color = Color.green;
    } else {
      // Cancelled/empty: warning (yellow)
      icon = '';
      color = Color.yellow;
      suffix = ' (interrupted)';
    }

    // Amp ref: expand/collapse uses ▶/▼ (lT widget, mutedForeground)
    const chevron = item.collapsed ? '\u25B6' : '\u25BC';

    const labelSpans: TextSpan[] = [
      new TextSpan({
        text: `${chevron} `,
        style: new TextStyle({ foreground: Color.brightBlack }),
      }),
      new TextSpan({
        text: icon,
        style: new TextStyle({ foreground: color }),
      }),
      new TextSpan({
        text: 'Thinking',
        style: new TextStyle({ foreground: color, dim: true }),
      }),
    ];

    if (suffix) {
      labelSpans.push(new TextSpan({
        text: suffix,
        style: new TextStyle({ foreground: Color.yellow, italic: true }),
      }));
    }

    const children: Widget[] = [
      new Text({
        text: new TextSpan({ children: labelSpans }),
      }),
    ];

    // Amp ref: expanded content is dim, italic
    if (!item.collapsed && item.text.length > 0) {
      const displayText = item.text.length > 500
        ? item.text.slice(0, 500) + '...'
        : item.text;

      children.push(
        new Padding({
          padding: EdgeInsets.only({ left: 2, right: 2 }),
          child: new Text({
            text: new TextSpan({
              text: displayText,
              style: new TextStyle({
                foreground: Color.defaultColor,
                dim: true,
                italic: true,
              }),
            }),
          }),
        }),
      );
    }

    return new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'start',
      children,
    });
  }
}
