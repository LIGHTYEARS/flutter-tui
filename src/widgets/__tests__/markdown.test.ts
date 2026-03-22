// Tests for Markdown widget
// Verifies markdown parsing, inline formatting, block types, and widget construction

import { describe, test, expect } from 'bun:test';
import { Markdown } from '../markdown';

// ---------------------------------------------------------------------------
// Block parsing tests
// ---------------------------------------------------------------------------

describe('Markdown.parseMarkdown', () => {
  test('parses heading level 1', () => {
    const blocks = Markdown.parseMarkdown('# Hello World');
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.type).toBe('heading1');
    expect(blocks[0]!.content).toBe('Hello World');
  });

  test('parses heading level 2', () => {
    const blocks = Markdown.parseMarkdown('## Subtitle');
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.type).toBe('heading2');
    expect(blocks[0]!.content).toBe('Subtitle');
  });

  test('parses heading level 3', () => {
    const blocks = Markdown.parseMarkdown('### Section');
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.type).toBe('heading3');
    expect(blocks[0]!.content).toBe('Section');
  });

  test('parses bullet items with dash', () => {
    const blocks = Markdown.parseMarkdown('- item one\n- item two');
    expect(blocks.length).toBe(2);
    expect(blocks[0]!.type).toBe('bullet');
    expect(blocks[0]!.content).toBe('item one');
    expect(blocks[1]!.type).toBe('bullet');
    expect(blocks[1]!.content).toBe('item two');
  });

  test('parses bullet items with asterisk', () => {
    const blocks = Markdown.parseMarkdown('* first\n* second');
    expect(blocks.length).toBe(2);
    expect(blocks[0]!.type).toBe('bullet');
    expect(blocks[0]!.content).toBe('first');
  });

  test('parses code blocks', () => {
    const md = '```typescript\nconst x = 1;\nconst y = 2;\n```';
    const blocks = Markdown.parseMarkdown(md);
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.type).toBe('code-block');
    expect(blocks[0]!.content).toBe('const x = 1;\nconst y = 2;');
    expect(blocks[0]!.language).toBe('typescript');
  });

  test('parses code blocks without language hint', () => {
    const md = '```\nhello\n```';
    const blocks = Markdown.parseMarkdown(md);
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.type).toBe('code-block');
    expect(blocks[0]!.content).toBe('hello');
    expect(blocks[0]!.language).toBeUndefined();
  });

  test('parses regular paragraphs', () => {
    const blocks = Markdown.parseMarkdown('Just some text.');
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.type).toBe('paragraph');
    expect(blocks[0]!.content).toBe('Just some text.');
  });

  test('skips empty lines', () => {
    const blocks = Markdown.parseMarkdown('# Title\n\nParagraph');
    expect(blocks.length).toBe(2);
    expect(blocks[0]!.type).toBe('heading1');
    expect(blocks[1]!.type).toBe('paragraph');
  });

  test('handles mixed block types', () => {
    const md = `# Title

Some paragraph.

- bullet one
- bullet two

## Subtitle

\`\`\`
code here
\`\`\`

More text.`;
    const blocks = Markdown.parseMarkdown(md);
    expect(blocks.length).toBe(7);
    expect(blocks[0]!.type).toBe('heading1');
    expect(blocks[1]!.type).toBe('paragraph');
    expect(blocks[2]!.type).toBe('bullet');
    expect(blocks[3]!.type).toBe('bullet');
    expect(blocks[4]!.type).toBe('heading2');
    expect(blocks[5]!.type).toBe('code-block');
    expect(blocks[6]!.type).toBe('paragraph');
  });

  test('handles empty input', () => {
    const blocks = Markdown.parseMarkdown('');
    expect(blocks.length).toBe(0);
  });

  test('handles code block at end of input (no closing ```)', () => {
    const md = '```\nsome code';
    const blocks = Markdown.parseMarkdown(md);
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.type).toBe('code-block');
    expect(blocks[0]!.content).toBe('some code');
  });
});

// ---------------------------------------------------------------------------
// Inline parsing tests
// ---------------------------------------------------------------------------

describe('Markdown.parseInline', () => {
  test('parses plain text', () => {
    const segments = Markdown.parseInline('hello world');
    expect(segments.length).toBe(1);
    expect(segments[0]!.text).toBe('hello world');
    expect(segments[0]!.bold).toBeUndefined();
    expect(segments[0]!.italic).toBeUndefined();
  });

  test('parses bold text', () => {
    const segments = Markdown.parseInline('hello **bold** world');
    expect(segments.length).toBe(3);
    expect(segments[0]!.text).toBe('hello ');
    expect(segments[1]!.text).toBe('bold');
    expect(segments[1]!.bold).toBe(true);
    expect(segments[2]!.text).toBe(' world');
  });

  test('parses italic text', () => {
    const segments = Markdown.parseInline('hello *italic* world');
    expect(segments.length).toBe(3);
    expect(segments[0]!.text).toBe('hello ');
    expect(segments[1]!.text).toBe('italic');
    expect(segments[1]!.italic).toBe(true);
    expect(segments[2]!.text).toBe(' world');
  });

  test('parses inline code', () => {
    const segments = Markdown.parseInline('use `console.log` here');
    expect(segments.length).toBe(3);
    expect(segments[0]!.text).toBe('use ');
    expect(segments[1]!.text).toBe('console.log');
    expect(segments[1]!.code).toBe(true);
    expect(segments[2]!.text).toBe(' here');
  });

  test('parses links', () => {
    const segments = Markdown.parseInline('click [here](https://example.com) now');
    expect(segments.length).toBe(3);
    expect(segments[0]!.text).toBe('click ');
    expect(segments[1]!.text).toBe('here');
    expect(segments[1]!.linkUrl).toBe('https://example.com');
    expect(segments[1]!.linkText).toBe('here');
    expect(segments[2]!.text).toBe(' now');
  });

  test('parses multiple inline styles in sequence', () => {
    const segments = Markdown.parseInline('**bold** and *italic* and `code`');
    expect(segments.length).toBe(5);
    expect(segments[0]!.bold).toBe(true);
    expect(segments[1]!.text).toBe(' and ');
    expect(segments[2]!.italic).toBe(true);
    expect(segments[3]!.text).toBe(' and ');
    expect(segments[4]!.code).toBe(true);
  });

  test('handles text with no special formatting', () => {
    const segments = Markdown.parseInline('just plain text');
    expect(segments.length).toBe(1);
    expect(segments[0]!.text).toBe('just plain text');
  });

  test('handles empty string', () => {
    const segments = Markdown.parseInline('');
    expect(segments.length).toBe(0);
  });

  test('handles lone asterisk without matching pair', () => {
    const segments = Markdown.parseInline('foo * bar');
    // Should consume as plain text since no matching asterisk pair
    expect(segments.length).toBeGreaterThanOrEqual(1);
    const fullText = segments.map((s) => s.text).join('');
    expect(fullText).toBe('foo * bar');
  });

  test('handles lone backtick without matching pair', () => {
    const segments = Markdown.parseInline('foo ` bar');
    const fullText = segments.map((s) => s.text).join('');
    expect(fullText).toBe('foo ` bar');
  });

  test('preserves original text content through parsing', () => {
    const input = 'Hello **world** this is *a* test with `code` and [link](url)';
    const segments = Markdown.parseInline(input);
    const reconstructed = segments.map((s) => s.text).join('');
    expect(reconstructed).toBe('Hello world this is a test with code and link');
  });
});

// ---------------------------------------------------------------------------
// Widget construction tests
// ---------------------------------------------------------------------------

describe('Markdown widget', () => {
  test('constructs with required markdown prop', () => {
    const md = new Markdown({ markdown: '# Hello' });
    expect(md.markdown).toBe('# Hello');
    expect(md.textAlign).toBe('left');
    expect(md.maxLines).toBeUndefined();
    expect(md.overflow).toBe('clip');
  });

  test('constructs with all options', () => {
    const md = new Markdown({
      markdown: '# Hello',
      textAlign: 'center',
      maxLines: 5,
      overflow: 'ellipsis',
    });
    expect(md.textAlign).toBe('center');
    expect(md.maxLines).toBe(5);
    expect(md.overflow).toBe('ellipsis');
  });

  test('is a StatelessWidget with build method', () => {
    const md = new Markdown({ markdown: 'text' });
    expect(md).toBeInstanceOf(Markdown);
    expect(typeof md.build).toBe('function');
  });

  test('handles empty markdown', () => {
    const md = new Markdown({ markdown: '' });
    expect(md.markdown).toBe('');
    expect(Markdown.parseMarkdown(md.markdown).length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Edge case tests
// ---------------------------------------------------------------------------

describe('Markdown edge cases', () => {
  test('heading without space after # is paragraph', () => {
    const blocks = Markdown.parseMarkdown('#NoSpace');
    // '#NoSpace' does not match '# ' prefix, so it's a paragraph
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.type).toBe('paragraph');
  });

  test('nested code block content is preserved literally', () => {
    const md = '```\n**not bold**\n*not italic*\n```';
    const blocks = Markdown.parseMarkdown(md);
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.content).toBe('**not bold**\n*not italic*');
  });

  test('multiple empty lines collapse to nothing', () => {
    const blocks = Markdown.parseMarkdown('\n\n\n');
    expect(blocks.length).toBe(0);
  });

  test('bullet with inline formatting', () => {
    const blocks = Markdown.parseMarkdown('- a **bold** item');
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.type).toBe('bullet');
    expect(blocks[0]!.content).toBe('a **bold** item');
    // Verify inline parsing of the bullet content
    const segments = Markdown.parseInline(blocks[0]!.content);
    expect(segments.length).toBe(3);
    expect(segments[1]!.bold).toBe(true);
  });

  test('multiple headings at different levels', () => {
    const md = '# H1\n## H2\n### H3';
    const blocks = Markdown.parseMarkdown(md);
    expect(blocks.length).toBe(3);
    expect(blocks[0]!.type).toBe('heading1');
    expect(blocks[1]!.type).toBe('heading2');
    expect(blocks[2]!.type).toBe('heading3');
  });

  test('code block with empty content', () => {
    const md = '```\n```';
    const blocks = Markdown.parseMarkdown(md);
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.type).toBe('code-block');
    expect(blocks[0]!.content).toBe('');
  });

  test('link with complex URL', () => {
    const segments = Markdown.parseInline('[docs](https://example.com/path?q=1&r=2#anchor)');
    expect(segments.length).toBe(1);
    expect(segments[0]!.linkUrl).toBe('https://example.com/path?q=1&r=2#anchor');
    expect(segments[0]!.linkText).toBe('docs');
  });
});
