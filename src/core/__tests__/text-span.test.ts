import { describe, it, expect } from 'bun:test';
import { TextSpan } from '../text-span.js';
import { TextStyle } from '../text-style.js';
import { Color } from '../color.js';

describe('TextSpan', () => {
  describe('constructor', () => {
    it('creates an empty span', () => {
      const span = new TextSpan();
      expect(span.text).toBeUndefined();
      expect(span.style).toBeUndefined();
      expect(span.children).toBeUndefined();
    });

    it('creates a span with text', () => {
      const span = new TextSpan({ text: 'hello' });
      expect(span.text).toBe('hello');
    });

    it('creates a span with style', () => {
      const style = new TextStyle({ bold: true });
      const span = new TextSpan({ style });
      expect(span.style).toBe(style);
    });

    it('creates a span with children (frozen)', () => {
      const child = new TextSpan({ text: 'child' });
      const span = new TextSpan({ children: [child] });
      expect(span.children).toHaveLength(1);
      expect(span.children![0]).toBe(child);
      // children array should be frozen
      expect(Object.isFrozen(span.children)).toBe(true);
    });
  });

  describe('toPlainText', () => {
    it('returns text from a simple span', () => {
      const span = new TextSpan({ text: 'hello world' });
      expect(span.toPlainText()).toBe('hello world');
    });

    it('returns empty string for empty span', () => {
      const span = new TextSpan();
      expect(span.toPlainText()).toBe('');
    });

    it('concatenates text from nested children', () => {
      const span = new TextSpan({
        text: 'hello ',
        children: [
          new TextSpan({ text: 'world' }),
          new TextSpan({ text: '!' }),
        ],
      });
      expect(span.toPlainText()).toBe('hello world!');
    });

    it('handles deeply nested spans', () => {
      const span = new TextSpan({
        children: [
          new TextSpan({
            text: 'a',
            children: [
              new TextSpan({ text: 'b' }),
            ],
          }),
          new TextSpan({ text: 'c' }),
        ],
      });
      expect(span.toPlainText()).toBe('abc');
    });
  });

  describe('visitChildren', () => {
    it('visits simple text span', () => {
      const span = new TextSpan({ text: 'hello' });
      const visited: Array<{ text: string; style: TextStyle }> = [];
      span.visitChildren((text, style) => visited.push({ text, style }));

      expect(visited).toHaveLength(1);
      expect(visited[0]!.text).toBe('hello');
      expect(visited[0]!.style.isEmpty).toBe(true);
    });

    it('visits span with style', () => {
      const boldStyle = new TextStyle({ bold: true });
      const span = new TextSpan({ text: 'bold text', style: boldStyle });
      const visited: Array<{ text: string; style: TextStyle }> = [];
      span.visitChildren((text, style) => visited.push({ text, style }));

      expect(visited).toHaveLength(1);
      expect(visited[0]!.text).toBe('bold text');
      expect(visited[0]!.style.bold).toBe(true);
    });

    it('inherits parent style in children', () => {
      const parentStyle = new TextStyle({ bold: true, foreground: Color.red });
      const span = new TextSpan({
        style: parentStyle,
        children: [
          new TextSpan({ text: 'child' }),
        ],
      });
      const visited: Array<{ text: string; style: TextStyle }> = [];
      span.visitChildren((text, style) => visited.push({ text, style }));

      expect(visited).toHaveLength(1);
      expect(visited[0]!.text).toBe('child');
      // Child should inherit parent's bold and foreground
      expect(visited[0]!.style.bold).toBe(true);
      expect(visited[0]!.style.foreground).toBe(Color.red);
    });

    it('child style overrides parent style', () => {
      const parentStyle = new TextStyle({ bold: true, foreground: Color.red });
      const childStyle = new TextStyle({ foreground: Color.blue });
      const span = new TextSpan({
        style: parentStyle,
        children: [
          new TextSpan({ text: 'child', style: childStyle }),
        ],
      });
      const visited: Array<{ text: string; style: TextStyle }> = [];
      span.visitChildren((text, style) => visited.push({ text, style }));

      expect(visited).toHaveLength(1);
      expect(visited[0]!.text).toBe('child');
      // bold is inherited, foreground is overridden
      expect(visited[0]!.style.bold).toBe(true);
      expect(visited[0]!.style.foreground).toBe(Color.blue);
    });

    it('visits both text and children in order', () => {
      const span = new TextSpan({
        text: 'parent ',
        style: new TextStyle({ bold: true }),
        children: [
          new TextSpan({ text: 'child1 ' }),
          new TextSpan({ text: 'child2' }),
        ],
      });
      const visited: Array<{ text: string; style: TextStyle }> = [];
      span.visitChildren((text, style) => visited.push({ text, style }));

      expect(visited).toHaveLength(3);
      expect(visited[0]!.text).toBe('parent ');
      expect(visited[1]!.text).toBe('child1 ');
      expect(visited[2]!.text).toBe('child2');
      // All should have bold from parent
      expect(visited[0]!.style.bold).toBe(true);
      expect(visited[1]!.style.bold).toBe(true);
      expect(visited[2]!.style.bold).toBe(true);
    });

    it('does not visit empty text segments', () => {
      const span = new TextSpan({
        text: '',
        children: [
          new TextSpan({ text: 'visible' }),
        ],
      });
      const visited: Array<{ text: string }> = [];
      span.visitChildren((text) => visited.push({ text }));

      expect(visited).toHaveLength(1);
      expect(visited[0]!.text).toBe('visible');
    });

    it('uses parentStyle parameter for root-level inheritance', () => {
      const rootStyle = new TextStyle({ italic: true });
      const span = new TextSpan({ text: 'text' });
      const visited: Array<{ text: string; style: TextStyle }> = [];
      span.visitChildren((text, style) => visited.push({ text, style }), rootStyle);

      expect(visited).toHaveLength(1);
      expect(visited[0]!.style.italic).toBe(true);
    });
  });

  describe('computeWidth', () => {
    it('computes width of ASCII text', () => {
      const span = new TextSpan({ text: 'hello' });
      expect(span.computeWidth()).toBe(5);
    });

    it('computes width of CJK characters', () => {
      // Each CJK character is width 2
      const span = new TextSpan({ text: '\u4F60\u597D' }); // "nihao" in Chinese
      expect(span.computeWidth()).toBe(4);
    });

    it('computes width of mixed ASCII and CJK', () => {
      const span = new TextSpan({ text: 'hi\u4F60\u597D' }); // "hi" + 2 CJK chars
      expect(span.computeWidth()).toBe(6); // 2 + 2*2
    });

    it('computes width of nested spans', () => {
      const span = new TextSpan({
        text: 'a',
        children: [
          new TextSpan({ text: 'bc' }),
          new TextSpan({ text: '\u4F60' }), // 1 CJK char = width 2
        ],
      });
      expect(span.computeWidth()).toBe(5); // 1 + 2 + 2
    });

    it('returns 0 for empty span', () => {
      expect(new TextSpan().computeWidth()).toBe(0);
    });

    it('returns 0 for empty string', () => {
      expect(new TextSpan({ text: '' }).computeWidth()).toBe(0);
    });
  });

  describe('toString', () => {
    it('returns TextSpan() for empty span', () => {
      expect(new TextSpan().toString()).toBe('TextSpan()');
    });

    it('includes text in output', () => {
      const str = new TextSpan({ text: 'hi' }).toString();
      expect(str).toContain('text: "hi"');
    });

    it('includes children count', () => {
      const str = new TextSpan({
        children: [new TextSpan({ text: 'a' }), new TextSpan({ text: 'b' })],
      }).toString();
      expect(str).toContain('children: [2]');
    });
  });
});
