import { describe, it, expect } from 'bun:test';
import { TextStyle } from '../text-style.js';
import { Color } from '../color.js';

describe('TextStyle', () => {
  describe('constructor', () => {
    it('creates an empty style with no arguments', () => {
      const style = new TextStyle();
      expect(style.bold).toBeUndefined();
      expect(style.dim).toBeUndefined();
      expect(style.italic).toBeUndefined();
      expect(style.underline).toBeUndefined();
      expect(style.strikethrough).toBeUndefined();
      expect(style.inverse).toBeUndefined();
      expect(style.hidden).toBeUndefined();
      expect(style.foreground).toBeUndefined();
      expect(style.background).toBeUndefined();
    });

    it('creates a style with specified attributes', () => {
      const fg = Color.red;
      const bg = Color.blue;
      const style = new TextStyle({
        bold: true,
        italic: true,
        foreground: fg,
        background: bg,
      });
      expect(style.bold).toBe(true);
      expect(style.italic).toBe(true);
      expect(style.foreground).toBe(fg);
      expect(style.background).toBe(bg);
      expect(style.dim).toBeUndefined();
    });
  });

  describe('isEmpty', () => {
    it('returns true for empty style', () => {
      expect(new TextStyle().isEmpty).toBe(true);
    });

    it('returns false when bold is set', () => {
      expect(new TextStyle({ bold: true }).isEmpty).toBe(false);
    });

    it('returns false when bold is explicitly false', () => {
      expect(new TextStyle({ bold: false }).isEmpty).toBe(false);
    });

    it('returns false when foreground is set', () => {
      expect(new TextStyle({ foreground: Color.red }).isEmpty).toBe(false);
    });

    it('returns false when background is set', () => {
      expect(new TextStyle({ background: Color.green }).isEmpty).toBe(false);
    });
  });

  describe('toSgr', () => {
    it('returns empty string for empty style', () => {
      expect(new TextStyle().toSgr()).toBe('');
    });

    it('returns "1" for bold', () => {
      expect(new TextStyle({ bold: true }).toSgr()).toBe('1');
    });

    it('returns "2" for dim', () => {
      expect(new TextStyle({ dim: true }).toSgr()).toBe('2');
    });

    it('returns "3" for italic', () => {
      expect(new TextStyle({ italic: true }).toSgr()).toBe('3');
    });

    it('returns "4" for underline', () => {
      expect(new TextStyle({ underline: true }).toSgr()).toBe('4');
    });

    it('returns "7" for inverse', () => {
      expect(new TextStyle({ inverse: true }).toSgr()).toBe('7');
    });

    it('returns "8" for hidden', () => {
      expect(new TextStyle({ hidden: true }).toSgr()).toBe('8');
    });

    it('returns "9" for strikethrough', () => {
      expect(new TextStyle({ strikethrough: true }).toSgr()).toBe('9');
    });

    it('returns foreground SGR for named color', () => {
      // Color.red is named(1), toSgrFg() returns "31"
      const style = new TextStyle({ foreground: Color.red });
      expect(style.toSgr()).toBe('31');
    });

    it('returns background SGR for named color', () => {
      // Color.green is named(2), toSgrBg() returns "42"
      const style = new TextStyle({ background: Color.green });
      expect(style.toSgr()).toBe('42');
    });

    it('returns foreground SGR for RGB color', () => {
      const style = new TextStyle({ foreground: Color.rgb(255, 128, 0) });
      expect(style.toSgr()).toBe('38;2;255;128;0');
    });

    it('combines multiple attributes with semicolons', () => {
      const style = new TextStyle({
        bold: true,
        foreground: Color.red,
        background: Color.green,
      });
      // bold=1, fg=31 (red named 1), bg=42 (green named 2)
      expect(style.toSgr()).toBe('1;31;42');
    });

    it('includes all boolean attributes in correct order', () => {
      const style = new TextStyle({
        bold: true,
        dim: true,
        italic: true,
        underline: true,
        inverse: true,
        hidden: true,
        strikethrough: true,
      });
      expect(style.toSgr()).toBe('1;2;3;4;7;8;9');
    });

    it('does not include false boolean attributes', () => {
      const style = new TextStyle({ bold: false, italic: true });
      expect(style.toSgr()).toBe('3');
    });
  });

  describe('merge', () => {
    it('other overrides this for defined fields', () => {
      const base = new TextStyle({ bold: true, italic: true, foreground: Color.red });
      const override = new TextStyle({ bold: false, foreground: Color.blue });
      const merged = base.merge(override);

      expect(merged.bold).toBe(false);
      expect(merged.italic).toBe(true); // kept from base
      expect(merged.foreground).toBe(Color.blue); // overridden
    });

    it('merge with empty style does not change anything', () => {
      const base = new TextStyle({
        bold: true,
        foreground: Color.red,
        background: Color.blue,
      });
      const merged = base.merge(new TextStyle());

      expect(merged.bold).toBe(true);
      expect(merged.foreground).toBe(Color.red);
      expect(merged.background).toBe(Color.blue);
    });

    it('merge empty with styled returns styled', () => {
      const override = new TextStyle({
        bold: true,
        foreground: Color.red,
      });
      const merged = new TextStyle().merge(override);

      expect(merged.bold).toBe(true);
      expect(merged.foreground).toBe(Color.red);
    });

    it('merge preserves all attributes from base when other has none', () => {
      const base = new TextStyle({
        bold: true,
        dim: true,
        italic: true,
        underline: true,
        strikethrough: true,
        inverse: true,
        hidden: true,
        foreground: Color.red,
        background: Color.blue,
      });
      const merged = base.merge(new TextStyle());
      expect(merged.equals(base)).toBe(true);
    });
  });

  describe('equals', () => {
    it('two empty styles are equal', () => {
      expect(new TextStyle().equals(new TextStyle())).toBe(true);
    });

    it('same attributes are equal', () => {
      const a = new TextStyle({ bold: true, foreground: Color.red });
      const b = new TextStyle({ bold: true, foreground: Color.red });
      expect(a.equals(b)).toBe(true);
    });

    it('different bold are not equal', () => {
      const a = new TextStyle({ bold: true });
      const b = new TextStyle({ bold: false });
      expect(a.equals(b)).toBe(false);
    });

    it('undefined vs defined are not equal', () => {
      const a = new TextStyle({ bold: true });
      const b = new TextStyle();
      expect(a.equals(b)).toBe(false);
    });

    it('different colors are not equal', () => {
      const a = new TextStyle({ foreground: Color.red });
      const b = new TextStyle({ foreground: Color.blue });
      expect(a.equals(b)).toBe(false);
    });

    it('one has foreground, other does not', () => {
      const a = new TextStyle({ foreground: Color.red });
      const b = new TextStyle();
      expect(a.equals(b)).toBe(false);
    });

    it('one has background, other does not', () => {
      const a = new TextStyle({ background: Color.green });
      const b = new TextStyle();
      expect(a.equals(b)).toBe(false);
    });

    it('same RGB colors are equal', () => {
      const a = new TextStyle({ foreground: Color.rgb(100, 200, 50) });
      const b = new TextStyle({ foreground: Color.rgb(100, 200, 50) });
      expect(a.equals(b)).toBe(true);
    });
  });

  describe('toString', () => {
    it('empty style returns TextStyle()', () => {
      expect(new TextStyle().toString()).toBe('TextStyle()');
    });

    it('includes set attributes', () => {
      const str = new TextStyle({ bold: true }).toString();
      expect(str).toContain('bold: true');
    });
  });
});
