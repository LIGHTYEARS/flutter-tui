// Tests for Dialog data class
// Verifies construction, default values, copyWith, and all fields

import { describe, test, expect } from 'bun:test';
import { Dialog } from '../dialog';
import type { DialogType, FooterStyle, DialogButton } from '../dialog';
import { StatelessWidget, type BuildContext, type Widget } from '../../framework/widget';

// Minimal widget for body tests
class _DummyWidget extends StatelessWidget {
  build(_context: BuildContext): Widget {
    return this;
  }
}

describe('Dialog', () => {
  test('creates with required title only, defaults applied', () => {
    const dialog = new Dialog({ title: 'Test Dialog' });

    expect(dialog.title).toBe('Test Dialog');
    expect(dialog.type).toBe('info');
    expect(dialog.subtitle).toBeUndefined();
    expect(dialog.body).toBeUndefined();
    expect(dialog.footerStyle).toBe('none');
    expect(dialog.buttons).toBeUndefined();
    expect(dialog.dimensions).toBeUndefined();
    expect(dialog.border).toBe(true);
  });

  test('creates with all properties specified', () => {
    const body = new _DummyWidget();
    const buttons: DialogButton[] = [
      { label: 'OK', value: 'ok' },
      { label: 'Cancel', value: 'cancel', disabled: true },
    ];

    const dialog = new Dialog({
      title: 'Confirm',
      type: 'confirm',
      subtitle: 'Are you sure?',
      body,
      footerStyle: 'buttons',
      buttons,
      dimensions: { width: 40, height: 10 },
      border: false,
    });

    expect(dialog.title).toBe('Confirm');
    expect(dialog.type).toBe('confirm');
    expect(dialog.subtitle).toBe('Are you sure?');
    expect(dialog.body).toBe(body);
    expect(dialog.footerStyle).toBe('buttons');
    expect(dialog.buttons).toHaveLength(2);
    expect(dialog.buttons![0].label).toBe('OK');
    expect(dialog.buttons![0].value).toBe('ok');
    expect(dialog.buttons![1].disabled).toBe(true);
    expect(dialog.dimensions).toEqual({ width: 40, height: 10 });
    expect(dialog.border).toBe(false);
  });

  test('supports all DialogType values', () => {
    const types: DialogType[] = ['info', 'warning', 'error', 'confirm', 'custom'];
    for (const type of types) {
      const dialog = new Dialog({ title: 'Test', type });
      expect(dialog.type).toBe(type);
    }
  });

  test('supports all FooterStyle values', () => {
    const styles: FooterStyle[] = ['buttons', 'text', 'none'];
    for (const footerStyle of styles) {
      const dialog = new Dialog({ title: 'Test', footerStyle });
      expect(dialog.footerStyle).toBe(footerStyle);
    }
  });

  test('buttons array is frozen (immutable)', () => {
    const buttons: DialogButton[] = [
      { label: 'OK', value: 'ok' },
    ];

    const dialog = new Dialog({ title: 'Test', buttons });

    // Buttons array should be frozen
    expect(Object.isFrozen(dialog.buttons)).toBe(true);

    // Original array mutation should not affect dialog
    buttons.push({ label: 'Extra', value: 'extra' });
    expect(dialog.buttons).toHaveLength(1);
  });

  test('dimensions with only width', () => {
    const dialog = new Dialog({
      title: 'Test',
      dimensions: { width: 50 },
    });

    expect(dialog.dimensions?.width).toBe(50);
    expect(dialog.dimensions?.height).toBeUndefined();
  });

  test('dimensions with only height', () => {
    const dialog = new Dialog({
      title: 'Test',
      dimensions: { height: 20 },
    });

    expect(dialog.dimensions?.width).toBeUndefined();
    expect(dialog.dimensions?.height).toBe(20);
  });

  describe('copyWith', () => {
    test('returns new Dialog with overridden title', () => {
      const original = new Dialog({ title: 'Original', type: 'warning' });
      const copy = original.copyWith({ title: 'Changed' });

      expect(copy.title).toBe('Changed');
      expect(copy.type).toBe('warning'); // unchanged
      expect(original.title).toBe('Original'); // original untouched
    });

    test('returns new Dialog with overridden type', () => {
      const original = new Dialog({ title: 'Test', type: 'info' });
      const copy = original.copyWith({ type: 'error' });

      expect(copy.type).toBe('error');
      expect(copy.title).toBe('Test'); // unchanged
    });

    test('returns new Dialog with overridden subtitle', () => {
      const original = new Dialog({ title: 'Test', subtitle: 'Original' });
      const copy = original.copyWith({ subtitle: 'Changed' });

      expect(copy.subtitle).toBe('Changed');
    });

    test('returns new Dialog with overridden buttons', () => {
      const original = new Dialog({
        title: 'Test',
        buttons: [{ label: 'OK', value: 'ok' }],
      });
      const copy = original.copyWith({
        buttons: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
      });

      expect(copy.buttons).toHaveLength(2);
      expect(original.buttons).toHaveLength(1);
    });

    test('returns new Dialog with overridden border', () => {
      const original = new Dialog({ title: 'Test', border: true });
      const copy = original.copyWith({ border: false });

      expect(copy.border).toBe(false);
      expect(original.border).toBe(true);
    });

    test('preserves all fields when no overrides', () => {
      const body = new _DummyWidget();
      const original = new Dialog({
        title: 'Test',
        type: 'confirm',
        subtitle: 'Sub',
        body,
        footerStyle: 'buttons',
        buttons: [{ label: 'OK', value: 'ok' }],
        dimensions: { width: 30, height: 15 },
        border: false,
      });
      const copy = original.copyWith({});

      expect(copy.title).toBe('Test');
      expect(copy.type).toBe('confirm');
      expect(copy.subtitle).toBe('Sub');
      expect(copy.body).toBe(body);
      expect(copy.footerStyle).toBe('buttons');
      expect(copy.buttons).toHaveLength(1);
      expect(copy.dimensions).toEqual({ width: 30, height: 15 });
      expect(copy.border).toBe(false);
    });
  });

  test('toString returns descriptive string', () => {
    const dialog = new Dialog({ title: 'Hello', type: 'warning', footerStyle: 'buttons' });
    const str = dialog.toString();

    expect(str).toContain('Dialog');
    expect(str).toContain('Hello');
    expect(str).toContain('warning');
    expect(str).toContain('buttons');
  });
});
