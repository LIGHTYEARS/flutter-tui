// Tests for InputEvent discriminated union and factory functions
import { describe, test, expect } from 'bun:test';
import {
  createKeyEvent,
  createMouseEvent,
  createResizeEvent,
  createFocusEvent,
  createPasteEvent,
} from '../events';
import type {
  InputEvent,
  KeyEvent,
  MouseEvent,
  ResizeEvent,
  FocusEvent,
  PasteEvent,
  KeyEventResult,
} from '../events';

describe('InputEvent types', () => {
  describe('KeyEvent', () => {
    test('can be created with factory function', () => {
      const event = createKeyEvent('a');
      expect(event.type).toBe('key');
      expect(event.key).toBe('a');
      expect(event.ctrlKey).toBe(false);
      expect(event.altKey).toBe(false);
      expect(event.shiftKey).toBe(false);
      expect(event.metaKey).toBe(false);
      expect(event.sequence).toBeUndefined();
    });

    test('supports modifier flags', () => {
      const event = createKeyEvent('c', {
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
        metaKey: true,
        sequence: '\x03',
      });
      expect(event.ctrlKey).toBe(true);
      expect(event.altKey).toBe(true);
      expect(event.shiftKey).toBe(true);
      expect(event.metaKey).toBe(true);
      expect(event.sequence).toBe('\x03');
    });

    test('type field narrows to KeyEvent', () => {
      const event: InputEvent = createKeyEvent('Enter');
      if (event.type === 'key') {
        // TypeScript narrows to KeyEvent here
        const _key: string = event.key;
        const _ctrl: boolean = event.ctrlKey;
        expect(_key).toBe('Enter');
        expect(_ctrl).toBe(false);
      } else {
        throw new Error('Expected key event');
      }
    });
  });

  describe('MouseEvent', () => {
    test('can be created with factory function', () => {
      const event = createMouseEvent('press', 0, 10, 5);
      expect(event.type).toBe('mouse');
      expect(event.action).toBe('press');
      expect(event.button).toBe(0);
      expect(event.x).toBe(10);
      expect(event.y).toBe(5);
      expect(event.ctrlKey).toBe(false);
      expect(event.altKey).toBe(false);
      expect(event.shiftKey).toBe(false);
    });

    test('supports modifier flags', () => {
      const event = createMouseEvent('press', 0, 10, 5, {
        ctrlKey: true,
        altKey: true,
      });
      expect(event.ctrlKey).toBe(true);
      expect(event.altKey).toBe(true);
      expect(event.shiftKey).toBe(false);
    });

    test('supports all action types', () => {
      expect(createMouseEvent('press', 0, 0, 0).action).toBe('press');
      expect(createMouseEvent('release', 0, 0, 0).action).toBe('release');
      expect(createMouseEvent('move', 0, 0, 0).action).toBe('move');
      expect(createMouseEvent('scroll', 64, 0, 0).action).toBe('scroll');
    });

    test('type field narrows to MouseEvent', () => {
      const event: InputEvent = createMouseEvent('press', 0, 10, 5);
      if (event.type === 'mouse') {
        const _x: number = event.x;
        const _y: number = event.y;
        expect(_x).toBe(10);
        expect(_y).toBe(5);
      } else {
        throw new Error('Expected mouse event');
      }
    });
  });

  describe('ResizeEvent', () => {
    test('can be created with factory function', () => {
      const event = createResizeEvent(80, 24);
      expect(event.type).toBe('resize');
      expect(event.width).toBe(80);
      expect(event.height).toBe(24);
    });

    test('type field narrows to ResizeEvent', () => {
      const event: InputEvent = createResizeEvent(120, 40);
      if (event.type === 'resize') {
        const _w: number = event.width;
        const _h: number = event.height;
        expect(_w).toBe(120);
        expect(_h).toBe(40);
      } else {
        throw new Error('Expected resize event');
      }
    });
  });

  describe('FocusEvent', () => {
    test('can be created with factory function', () => {
      const event = createFocusEvent(true);
      expect(event.type).toBe('focus');
      expect(event.focused).toBe(true);
    });

    test('supports focus out', () => {
      const event = createFocusEvent(false);
      expect(event.focused).toBe(false);
    });

    test('type field narrows to FocusEvent', () => {
      const event: InputEvent = createFocusEvent(true);
      if (event.type === 'focus') {
        const _f: boolean = event.focused;
        expect(_f).toBe(true);
      } else {
        throw new Error('Expected focus event');
      }
    });
  });

  describe('PasteEvent', () => {
    test('can be created with factory function', () => {
      const event = createPasteEvent('hello world');
      expect(event.type).toBe('paste');
      expect(event.text).toBe('hello world');
    });

    test('supports multiline text', () => {
      const event = createPasteEvent('line1\nline2\nline3');
      expect(event.text).toBe('line1\nline2\nline3');
    });

    test('type field narrows to PasteEvent', () => {
      const event: InputEvent = createPasteEvent('test');
      if (event.type === 'paste') {
        const _t: string = event.text;
        expect(_t).toBe('test');
      } else {
        throw new Error('Expected paste event');
      }
    });
  });

  describe('discriminated union', () => {
    test('each event type has a unique type field', () => {
      const events: InputEvent[] = [
        createKeyEvent('a'),
        createMouseEvent('press', 0, 0, 0),
        createResizeEvent(80, 24),
        createFocusEvent(true),
        createPasteEvent('text'),
      ];

      const types = events.map(e => e.type);
      expect(types).toEqual(['key', 'mouse', 'resize', 'focus', 'paste']);
    });

    test('switch on type field works correctly', () => {
      const events: InputEvent[] = [
        createKeyEvent('a'),
        createMouseEvent('press', 0, 0, 0),
        createResizeEvent(80, 24),
        createFocusEvent(true),
        createPasteEvent('text'),
      ];

      const results: string[] = [];
      for (const event of events) {
        switch (event.type) {
          case 'key':
            results.push(`key:${event.key}`);
            break;
          case 'mouse':
            results.push(`mouse:${event.action}`);
            break;
          case 'resize':
            results.push(`resize:${event.width}x${event.height}`);
            break;
          case 'focus':
            results.push(`focus:${event.focused}`);
            break;
          case 'paste':
            results.push(`paste:${event.text}`);
            break;
        }
      }

      expect(results).toEqual([
        'key:a',
        'mouse:press',
        'resize:80x24',
        'focus:true',
        'paste:text',
      ]);
    });
  });

  describe('KeyEventResult', () => {
    test('accepts valid result values', () => {
      const handled: KeyEventResult = 'handled';
      const ignored: KeyEventResult = 'ignored';
      expect(handled).toBe('handled');
      expect(ignored).toBe('ignored');
    });
  });
});
