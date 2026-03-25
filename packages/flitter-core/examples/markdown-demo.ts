// markdown-demo.ts — Demonstrates the Markdown widget with all supported features.
//
// Run with: bun run examples/markdown-demo.ts
//
// This example demonstrates:
// - H1, H2, H3, H4 headings (H1/H3 primary color, H2/H4 secondary color)
// - Bullet lists (- item)
// - Numbered lists (1. item, 2. item)
// - **bold**, *italic*, ***bold italic***, ~~strikethrough~~, `inline code`
// - [links](url) with OSC 8 hyperlinks
// - > Blockquote with left border
// - Horizontal rule (---)
// - Code block with language hint (```typescript ... ```)
// - GFM table (| col1 | col2 |)

import { runApp } from '../src/framework/binding';
import { Column } from '../src/widgets/flex';
import { Expanded } from '../src/widgets/flexible';
import { Text } from '../src/widgets/text';
import { Divider } from '../src/widgets/divider';
import { Markdown } from '../src/widgets/markdown';
import { SingleChildScrollView } from '../src/widgets/scroll-view';
import { Padding } from '../src/widgets/padding';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';
import { EdgeInsets } from '../src/layout/edge-insets';

// ---------------------------------------------------------------------------
// Markdown content exercising all supported features
// ---------------------------------------------------------------------------

const MARKDOWN_CONTENT = `# Markdown Widget Demo

This paragraph demonstrates the **Markdown** widget rendering capabilities.
It supports a full range of common markdown features for terminal display.

## Heading Levels

H1 and H3 headings use the *primary* color, while H2 and H4 use *secondary*.

### Third-Level Heading (Primary)

#### Fourth-Level Heading (Secondary)

## Inline Formatting

Here is **bold text**, *italic text*, and ***bold italic text*** together.
You can also use ~~strikethrough~~ and \`inline code\` within a paragraph.
Links are rendered with OSC 8: [Bun Runtime](https://bun.sh) and [TypeScript](https://typescriptlang.org).

## Bullet Lists

- First bullet item with **bold** emphasis
- Second item with *italic* styling
- Third item with \`inline code\` snippet
- Fourth item with a [link](https://example.com)

## Numbered Lists

1. Clone the repository
2. Run \`bun install\` to install dependencies
3. Execute \`bun test\` to verify everything works
4. Start building with \`bun run examples/markdown-demo.ts\`

## Blockquote

> This is a blockquote with a left border.
> It can span multiple lines and supports
> **inline** formatting as well.

## Horizontal Rule

Below is a horizontal rule rendered as a Divider:

---

## Code Block

\`\`\`typescript
interface Widget {
  readonly key?: Key;
  createElement(): Element;
}

class Text extends StatelessWidget {
  readonly text: TextSpan;

  build(context: BuildContext): Widget {
    return new RichText({ text: this.text });
  }
}
\`\`\`

## GFM Table

| Feature         | Status    | Notes                  |
| --------------- | --------- | ---------------------- |
| Headings        | Done      | H1-H4 with colors     |
| Inline styles   | Done      | Bold, italic, code     |
| Lists           | Done      | Bullet and numbered    |
| Blockquotes     | Done      | With left border       |
| Code blocks     | Done      | With language hint     |
| Tables          | Done      | Header and data rows   |
| Links           | Done      | OSC 8 hyperlinks       |

## Combined Features

A paragraph with **bold**, *italic*, \`code\`, ~~strikethrough~~, and
a [hyperlink](https://github.com) all on the same line. This demonstrates
that inline parsing handles multiple format types seamlessly.

---

*End of Markdown demo.*
`;

// ---------------------------------------------------------------------------
// Build the markdown demo
// ---------------------------------------------------------------------------

export function buildMarkdownDemo() {
  return new Column({
    mainAxisAlignment: 'start',
    crossAxisAlignment: 'stretch',
    children: [
      // Header
      new Padding({
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: new Text({
          text: new TextSpan({
            text: 'Markdown Widget Demo',
            style: new TextStyle({ bold: true, foreground: Color.cyan }),
          }),
        }),
      }),
      new Padding({
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: new Text({
          text: new TextSpan({
            text: 'All supported markdown features in one view',
            style: new TextStyle({ dim: true }),
          }),
        }),
      }),
      new Divider(),
      // Scrollable markdown content
      new Expanded({
        child: new SingleChildScrollView({
          child: new Padding({
            padding: EdgeInsets.symmetric({ horizontal: 1 }),
            child: new Markdown({ markdown: MARKDOWN_CONTENT }),
          }),
        }),
      }),
    ],
  });
}

// Export for testing
export const app = buildMarkdownDemo();

// Only run the app when executed directly
if (import.meta.main) {
  runApp(app, { output: process.stdout });
}
