// Markdown rendering TDD tests
//
// Amp ref: XkL (assistant msg) uses Column(crossAxisAlignment:'stretch', mainAxisSize:'min')
// The Markdown widget's internal Column MUST use crossAxisAlignment:'stretch'
// so code blocks, blockquotes, and horizontal rules fill the available width.
//
// Key invariants:
// 1. Markdown.build() returns a Column with crossAxisAlignment:'stretch'
// 2. Markdown.build() returns a Column with mainAxisSize:'min' (for scrollable content)
// 3. Empty markdown renders a single empty Text widget inside Column

import { describe, it, expect } from 'bun:test';
import { Markdown } from 'flitter-core/src/widgets/markdown';
import { Column } from 'flitter-core/src/widgets/flex';

describe('Markdown: Internal Column Properties', () => {

  it('Markdown.build() returns a Column widget', () => {
    const md = new Markdown({ markdown: 'Hello world' });
    const widget = md.build({} as any);
    expect(widget.constructor.name).toBe('Column');
  });

  it('Markdown Column uses crossAxisAlignment:stretch', () => {
    const md = new Markdown({ markdown: 'Hello world' });
    const widget = md.build({} as any) as any;
    expect(widget.crossAxisAlignment).toBe('stretch');
  });

  it('Markdown Column uses mainAxisSize:min for scrollable content', () => {
    const md = new Markdown({ markdown: 'Hello world' });
    const widget = md.build({} as any) as any;
    expect(widget.mainAxisSize).toBe('min');
  });

  it('empty markdown renders Column with one child', () => {
    const md = new Markdown({ markdown: '' });
    const widget = md.build({} as any) as any;
    const children = widget.children ?? widget._children ?? [];
    expect(children.length).toBe(1);
  });

  it('multi-block markdown renders correct number of children', () => {
    const md = new Markdown({ markdown: 'Paragraph 1\n\nParagraph 2\n\n```js\ncode\n```' });
    const widget = md.build({} as any) as any;
    const children = widget.children ?? widget._children ?? [];
    expect(children.length).toBeGreaterThanOrEqual(3);
  });
});
