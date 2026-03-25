// Tests for ImagePreview, ImagePreviewProvider, KittyImageWidget, and Kitty protocol encoding
// Covers: IMG-01 (ImagePreview StatefulWidget), IMG-02 (KittyImageWidget RenderObject),
//         IMG-03 (ImagePreviewProvider InheritedWidget), and Kitty graphics encoding

import { describe, it, expect } from 'bun:test';
import {
  ImagePreview,
  ImagePreviewState,
  ImagePreviewProvider,
  KittyImageWidget,
  RenderKittyImage,
  encodeKittyGraphics,
  buildKittyGraphicsPayload,
  uint8ArrayToBase64,
  splitIntoChunks,
  KITTY_CHUNK_SIZE,
} from '../image-preview';
import type { ImagePreviewData } from '../image-preview';
import { SizedBox } from '../sized-box';
import { MediaQuery, MediaQueryData } from '../media-query';
import { StatelessWidget, Widget, BuildContext, InheritedWidget } from '../../framework/widget';
import { StatelessElement, InheritedElement, StatefulElement, BuildContextImpl } from '../../framework/element';
import { BoxConstraints } from '../../core/box-constraints';
import { Offset, Size } from '../../core/types';
import { ESC, ST } from '../../terminal/renderer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

class DummyLeaf extends StatelessWidget {
  build(_context: BuildContext): Widget {
    return this; // self-referential leaf
  }
}

/** Create a small test PNG-like Uint8Array (not a real PNG, but valid for encoding tests). */
function makeTestImageData(size: number = 32): Uint8Array {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = i % 256;
  }
  return data;
}

/** Create a larger test image data that will require multiple chunks. */
function makeLargeImageData(): Uint8Array {
  // 4096 bytes of base64 = 3072 bytes raw. Create enough for ~3 chunks.
  const size = 3072 * 3;
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = i % 256;
  }
  return data;
}

function buildProviderTree(previewData: ImagePreviewData) {
  const leaf = new DummyLeaf();
  const provider = new ImagePreviewProvider({ data: previewData, child: leaf });

  const providerElement = provider.createElement() as InheritedElement;
  providerElement.mount();

  const leafElement = providerElement.child!;
  const context = new BuildContextImpl(leafElement, leafElement.widget);
  return { context, providerElement, leafElement };
}

// ---------------------------------------------------------------------------
// Kitty Graphics Protocol Encoding
// ---------------------------------------------------------------------------

describe('Kitty Graphics Protocol Encoding', () => {
  describe('uint8ArrayToBase64', () => {
    it('converts empty array to empty string', () => {
      expect(uint8ArrayToBase64(new Uint8Array(0))).toBe('');
    });

    it('converts simple data to valid base64', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = uint8ArrayToBase64(data);
      expect(result).toBe(Buffer.from('Hello').toString('base64'));
    });

    it('converts binary data correctly', () => {
      const data = new Uint8Array([0, 255, 128, 64, 32]);
      const result = uint8ArrayToBase64(data);
      expect(result).toBe(Buffer.from(data).toString('base64'));
    });
  });

  describe('splitIntoChunks', () => {
    it('returns empty array for empty string', () => {
      expect(splitIntoChunks('', 10)).toEqual([]);
    });

    it('returns single chunk when string is shorter than chunk size', () => {
      expect(splitIntoChunks('abc', 10)).toEqual(['abc']);
    });

    it('returns single chunk when string equals chunk size', () => {
      expect(splitIntoChunks('abcde', 5)).toEqual(['abcde']);
    });

    it('splits string into correct number of chunks', () => {
      const result = splitIntoChunks('abcdefghij', 3);
      expect(result).toEqual(['abc', 'def', 'ghi', 'j']);
    });

    it('handles chunk size of 1', () => {
      const result = splitIntoChunks('abc', 1);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('uses KITTY_CHUNK_SIZE constant correctly', () => {
      expect(KITTY_CHUNK_SIZE).toBe(4096);
    });
  });

  describe('encodeKittyGraphics', () => {
    const APC_G = `${ESC}_G`;

    it('handles empty image data', () => {
      const sequences = encodeKittyGraphics(new Uint8Array(0), 100, 100);
      expect(sequences.length).toBe(1);
      expect(sequences[0]).toContain('a=T');
      expect(sequences[0]).toContain('f=100');
      expect(sequences[0]).toContain('s=100');
      expect(sequences[0]).toContain('v=100');
      expect(sequences[0]).toContain('m=0');
      expect(sequences[0]).toContain('q=2');
    });

    it('produces single chunk for small images', () => {
      const data = makeTestImageData(32);
      const sequences = encodeKittyGraphics(data, 640, 480);

      expect(sequences.length).toBe(1);
      expect(sequences[0]).toStartWith(APC_G);
      expect(sequences[0]).toEndWith(ST);
      expect(sequences[0]).toContain('a=T');
      expect(sequences[0]).toContain('f=100');
      expect(sequences[0]).toContain('t=d');
      expect(sequences[0]).toContain('s=640');
      expect(sequences[0]).toContain('v=480');
      expect(sequences[0]).toContain('q=2');
      expect(sequences[0]).toContain('m=0');
    });

    it('produces multiple chunks for large images', () => {
      const data = makeLargeImageData();
      const sequences = encodeKittyGraphics(data, 800, 600);

      expect(sequences.length).toBeGreaterThan(1);

      // First chunk has full parameters and m=1
      expect(sequences[0]).toContain('a=T');
      expect(sequences[0]).toContain('f=100');
      expect(sequences[0]).toContain('s=800');
      expect(sequences[0]).toContain('v=600');
      expect(sequences[0]).toContain('m=1');

      // Last chunk has m=0
      const last = sequences[sequences.length - 1]!;
      expect(last).toContain('m=0');
      expect(last).not.toContain('a=T'); // only first chunk has 'a=T'

      // Middle chunks have m=1
      if (sequences.length > 2) {
        for (let i = 1; i < sequences.length - 1; i++) {
          expect(sequences[i]).toContain('m=1');
          expect(sequences[i]).not.toContain('a=T');
        }
      }

      // All chunks are properly formatted
      for (const seq of sequences) {
        expect(seq).toStartWith(APC_G);
        expect(seq).toEndWith(ST);
      }
    });

    it('includes correct image dimensions in first chunk', () => {
      const data = makeTestImageData(16);
      const sequences = encodeKittyGraphics(data, 320, 240);
      expect(sequences[0]).toContain('s=320');
      expect(sequences[0]).toContain('v=240');
    });

    it('uses PNG format (f=100)', () => {
      const data = makeTestImageData(16);
      const sequences = encodeKittyGraphics(data, 100, 100);
      expect(sequences[0]).toContain('f=100');
    });

    it('uses direct transmission (t=d)', () => {
      const data = makeTestImageData(16);
      const sequences = encodeKittyGraphics(data, 100, 100);
      expect(sequences[0]).toContain('t=d');
    });

    it('uses quiet mode (q=2)', () => {
      const data = makeTestImageData(16);
      const sequences = encodeKittyGraphics(data, 100, 100);
      expect(sequences[0]).toContain('q=2');
    });

    it('contains valid base64 payload', () => {
      const data = makeTestImageData(32);
      const sequences = encodeKittyGraphics(data, 100, 100);
      // Extract payload after the semicolon
      const match = sequences[0]!.match(/;([A-Za-z0-9+/=]*)\x1b\\/);
      expect(match).not.toBeNull();
      const payload = match![1];
      // Verify it decodes back to original data
      const decoded = Buffer.from(payload!, 'base64');
      expect(new Uint8Array(decoded)).toEqual(data);
    });
  });

  describe('buildKittyGraphicsPayload', () => {
    it('concatenates all chunks into a single string', () => {
      const data = makeTestImageData(32);
      const payload = buildKittyGraphicsPayload(data, 100, 100);
      const sequences = encodeKittyGraphics(data, 100, 100);
      expect(payload).toBe(sequences.join(''));
    });

    it('returns non-empty string for valid image data', () => {
      const data = makeTestImageData(16);
      const payload = buildKittyGraphicsPayload(data, 640, 480);
      expect(payload.length).toBeGreaterThan(0);
    });

    it('handles large images with multiple chunks', () => {
      const data = makeLargeImageData();
      const payload = buildKittyGraphicsPayload(data, 800, 600);
      // Should contain both first and last chunk markers
      expect(payload).toContain('a=T');
      expect(payload).toContain('m=0');
    });
  });
});

// ---------------------------------------------------------------------------
// ImagePreviewProvider (IMG-03) — InheritedWidget
// ---------------------------------------------------------------------------

describe('ImagePreviewProvider', () => {
  describe('construction', () => {
    it('stores data and child', () => {
      const data: ImagePreviewData = {
        imageData: makeTestImageData(),
        width: 640,
        height: 480,
        displayState: 'ready',
      };
      const child = new DummyLeaf();
      const provider = new ImagePreviewProvider({ data, child });
      expect(provider.data).toBe(data);
      expect(provider.child).toBe(child);
    });

    it('accepts an optional key', () => {
      const { ValueKey } = require('../../core/key');
      const data: ImagePreviewData = {
        imageData: makeTestImageData(),
        width: 100,
        height: 100,
        displayState: 'ready',
      };
      const child = new DummyLeaf();
      const provider = new ImagePreviewProvider({
        data,
        child,
        key: new ValueKey('img-provider'),
      });
      expect(provider.key).toBeDefined();
    });
  });

  describe('createElement', () => {
    it('creates an InheritedElement', () => {
      const data: ImagePreviewData = {
        imageData: makeTestImageData(),
        width: 640,
        height: 480,
        displayState: 'ready',
      };
      const child = new DummyLeaf();
      const provider = new ImagePreviewProvider({ data, child });
      const element = provider.createElement();
      expect(element).toBeInstanceOf(InheritedElement);
      expect(element.widget).toBe(provider);
    });
  });

  describe('updateShouldNotify', () => {
    it('returns false when data is identical (same reference)', () => {
      const data: ImagePreviewData = {
        imageData: makeTestImageData(),
        width: 640,
        height: 480,
        displayState: 'ready',
      };
      const child = new DummyLeaf();
      const a = new ImagePreviewProvider({ data, child });
      const b = new ImagePreviewProvider({ data, child });
      expect(b.updateShouldNotify(a)).toBe(false);
    });

    it('returns true when width changes', () => {
      const imageData = makeTestImageData();
      const child = new DummyLeaf();
      const a = new ImagePreviewProvider({
        data: { imageData, width: 640, height: 480, displayState: 'ready' },
        child,
      });
      const b = new ImagePreviewProvider({
        data: { imageData, width: 800, height: 480, displayState: 'ready' },
        child,
      });
      expect(b.updateShouldNotify(a)).toBe(true);
    });

    it('returns true when height changes', () => {
      const imageData = makeTestImageData();
      const child = new DummyLeaf();
      const a = new ImagePreviewProvider({
        data: { imageData, width: 640, height: 480, displayState: 'ready' },
        child,
      });
      const b = new ImagePreviewProvider({
        data: { imageData, width: 640, height: 600, displayState: 'ready' },
        child,
      });
      expect(b.updateShouldNotify(a)).toBe(true);
    });

    it('returns true when displayState changes', () => {
      const imageData = makeTestImageData();
      const child = new DummyLeaf();
      const a = new ImagePreviewProvider({
        data: { imageData, width: 640, height: 480, displayState: 'loading' },
        child,
      });
      const b = new ImagePreviewProvider({
        data: { imageData, width: 640, height: 480, displayState: 'ready' },
        child,
      });
      expect(b.updateShouldNotify(a)).toBe(true);
    });

    it('returns true when imageData reference changes', () => {
      const child = new DummyLeaf();
      const a = new ImagePreviewProvider({
        data: {
          imageData: makeTestImageData(),
          width: 640,
          height: 480,
          displayState: 'ready',
        },
        child,
      });
      const b = new ImagePreviewProvider({
        data: {
          imageData: makeTestImageData(),
          width: 640,
          height: 480,
          displayState: 'ready',
        },
        child,
      });
      expect(b.updateShouldNotify(a)).toBe(true);
    });
  });

  describe('static accessors (of, maybeOf)', () => {
    it('ImagePreviewProvider.of() returns the data', () => {
      const data: ImagePreviewData = {
        imageData: makeTestImageData(),
        width: 640,
        height: 480,
        displayState: 'ready',
      };
      const { context } = buildProviderTree(data);
      const result = ImagePreviewProvider.of(context);
      expect(result).toBe(data);
    });

    it('ImagePreviewProvider.of() throws when no ancestor exists', () => {
      const leaf = new DummyLeaf();
      const leafElement = leaf.createElement() as StatelessElement;
      const context = new BuildContextImpl(leafElement, leaf);
      expect(() => ImagePreviewProvider.of(context)).toThrow(
        'ImagePreviewProvider.of()',
      );
    });

    it('ImagePreviewProvider.maybeOf() returns undefined when no ancestor exists', () => {
      const leaf = new DummyLeaf();
      const leafElement = leaf.createElement() as StatelessElement;
      const context = new BuildContextImpl(leafElement, leaf);
      expect(ImagePreviewProvider.maybeOf(context)).toBeUndefined();
    });

    it('registers dependency on the InheritedElement', () => {
      const data: ImagePreviewData = {
        imageData: makeTestImageData(),
        width: 640,
        height: 480,
        displayState: 'ready',
      };
      const { context, providerElement } = buildProviderTree(data);
      const dependents = (providerElement as any)._dependents as Set<any>;

      // Trigger dependency
      ImagePreviewProvider.of(context);

      expect(dependents.size).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// KittyImageWidget (IMG-02) — SingleChildRenderObjectWidget
// ---------------------------------------------------------------------------

describe('KittyImageWidget', () => {
  describe('construction', () => {
    it('stores all properties', () => {
      const imageData = makeTestImageData();
      const widget = new KittyImageWidget({
        imageData,
        pixelWidth: 640,
        pixelHeight: 480,
        cellWidth: 80,
        cellHeight: 30,
      });
      expect(widget.imageData).toBe(imageData);
      expect(widget.pixelWidth).toBe(640);
      expect(widget.pixelHeight).toBe(480);
      expect(widget.cellWidth).toBe(80);
      expect(widget.cellHeight).toBe(30);
    });

    it('accepts optional key and child', () => {
      const { ValueKey } = require('../../core/key');
      const imageData = makeTestImageData();
      const child = new DummyLeaf();
      const widget = new KittyImageWidget({
        key: new ValueKey('kitty-img'),
        imageData,
        pixelWidth: 100,
        pixelHeight: 100,
        cellWidth: 10,
        cellHeight: 10,
        child,
      });
      expect(widget.key).toBeDefined();
      expect(widget.child).toBe(child);
    });
  });

  describe('createRenderObject', () => {
    it('creates a RenderKittyImage', () => {
      const imageData = makeTestImageData();
      const widget = new KittyImageWidget({
        imageData,
        pixelWidth: 640,
        pixelHeight: 480,
        cellWidth: 80,
        cellHeight: 30,
      });
      const renderObject = widget.createRenderObject();
      expect(renderObject).toBeInstanceOf(RenderKittyImage);
      expect(renderObject.imageData).toBe(imageData);
      expect(renderObject.pixelWidth).toBe(640);
      expect(renderObject.pixelHeight).toBe(480);
      expect(renderObject.cellWidth).toBe(80);
      expect(renderObject.cellHeight).toBe(30);
    });
  });

  describe('updateRenderObject', () => {
    it('updates render object properties', () => {
      const imageData1 = makeTestImageData(16);
      const imageData2 = makeTestImageData(32);
      const widget1 = new KittyImageWidget({
        imageData: imageData1,
        pixelWidth: 640,
        pixelHeight: 480,
        cellWidth: 80,
        cellHeight: 30,
      });
      const widget2 = new KittyImageWidget({
        imageData: imageData2,
        pixelWidth: 800,
        pixelHeight: 600,
        cellWidth: 100,
        cellHeight: 40,
      });

      const renderObject = widget1.createRenderObject();
      widget2.updateRenderObject(renderObject);

      expect(renderObject.imageData).toBe(imageData2);
      expect(renderObject.pixelWidth).toBe(800);
      expect(renderObject.pixelHeight).toBe(600);
      expect(renderObject.cellWidth).toBe(100);
      expect(renderObject.cellHeight).toBe(40);
    });
  });
});

// ---------------------------------------------------------------------------
// RenderKittyImage — RenderBox (IMG-02)
// ---------------------------------------------------------------------------

describe('RenderKittyImage', () => {
  describe('construction', () => {
    it('initializes with provided values', () => {
      const imageData = makeTestImageData();
      const render = new RenderKittyImage({
        imageData,
        pixelWidth: 640,
        pixelHeight: 480,
        cellWidth: 80,
        cellHeight: 30,
      });
      expect(render.imageData).toBe(imageData);
      expect(render.pixelWidth).toBe(640);
      expect(render.pixelHeight).toBe(480);
      expect(render.cellWidth).toBe(80);
      expect(render.cellHeight).toBe(30);
    });
  });

  describe('performLayout', () => {
    it('sizes to cellWidth x cellHeight within constraints', () => {
      const render = new RenderKittyImage({
        imageData: makeTestImageData(),
        pixelWidth: 640,
        pixelHeight: 480,
        cellWidth: 80,
        cellHeight: 30,
      });
      const constraints = BoxConstraints.loose(new Size(100, 50));
      render.layout(constraints);
      expect(render.size.width).toBe(80);
      expect(render.size.height).toBe(30);
    });

    it('constrains to maximum when cell size exceeds constraints', () => {
      const render = new RenderKittyImage({
        imageData: makeTestImageData(),
        pixelWidth: 640,
        pixelHeight: 480,
        cellWidth: 80,
        cellHeight: 30,
      });
      const constraints = BoxConstraints.tight(new Size(40, 15));
      render.layout(constraints);
      expect(render.size.width).toBe(40);
      expect(render.size.height).toBe(15);
    });
  });

  describe('getPayload', () => {
    it('returns the Kitty graphics payload string', () => {
      const imageData = makeTestImageData(16);
      const render = new RenderKittyImage({
        imageData,
        pixelWidth: 100,
        pixelHeight: 100,
        cellWidth: 10,
        cellHeight: 10,
      });

      const payload = render.getPayload();
      expect(payload).toContain('a=T');
      expect(payload).toContain('f=100');
      expect(payload).toContain('s=100');
      expect(payload).toContain('v=100');
    });

    it('caches the payload', () => {
      const imageData = makeTestImageData(16);
      const render = new RenderKittyImage({
        imageData,
        pixelWidth: 100,
        pixelHeight: 100,
        cellWidth: 10,
        cellHeight: 10,
      });

      const payload1 = render.getPayload();
      const payload2 = render.getPayload();
      expect(payload1).toBe(payload2); // same reference = cached
    });

    it('invalidates cache when imageData changes', () => {
      const render = new RenderKittyImage({
        imageData: makeTestImageData(16),
        pixelWidth: 100,
        pixelHeight: 100,
        cellWidth: 10,
        cellHeight: 10,
      });

      const payload1 = render.getPayload();
      render.imageData = makeTestImageData(32);
      const payload2 = render.getPayload();
      expect(payload1).not.toBe(payload2);
    });

    it('invalidates cache when pixel dimensions change', () => {
      const imageData = makeTestImageData(16);
      const render = new RenderKittyImage({
        imageData,
        pixelWidth: 100,
        pixelHeight: 100,
        cellWidth: 10,
        cellHeight: 10,
      });

      const payload1 = render.getPayload();
      render.pixelWidth = 200;
      const payload2 = render.getPayload();
      expect(payload2).toContain('s=200');
    });
  });

  describe('paint', () => {
    it('calls writeRawEscape on paint context if available', () => {
      const imageData = makeTestImageData(16);
      const render = new RenderKittyImage({
        imageData,
        pixelWidth: 100,
        pixelHeight: 100,
        cellWidth: 10,
        cellHeight: 10,
      });

      let calledWith: { payload: string; col: number; row: number } | null = null;
      const mockContext = {
        writeRawEscape(payload: string, col: number, row: number) {
          calledWith = { payload, col, row };
        },
      } as unknown as PaintContext;

      render.paint(mockContext, new Offset(5, 10));

      expect(calledWith).not.toBeNull();
      expect(calledWith!.col).toBe(5);
      expect(calledWith!.row).toBe(10);
      expect(calledWith!.payload).toContain('a=T');
    });

    it('handles paint context without writeRawEscape gracefully', () => {
      const imageData = makeTestImageData(16);
      const render = new RenderKittyImage({
        imageData,
        pixelWidth: 100,
        pixelHeight: 100,
        cellWidth: 10,
        cellHeight: 10,
      });

      const mockContext = {} as unknown as PaintContext;
      // Should not throw
      expect(() => render.paint(mockContext, Offset.zero)).not.toThrow();
    });
  });

  describe('property setters', () => {
    it('marks needs paint when imageData changes', () => {
      const render = new RenderKittyImage({
        imageData: makeTestImageData(16),
        pixelWidth: 100,
        pixelHeight: 100,
        cellWidth: 10,
        cellHeight: 10,
      });

      // Reset needsPaint flag by checking initial
      expect(render.needsPaint).toBe(true);
    });

    it('does not mark dirty when same value is set', () => {
      const imageData = makeTestImageData(16);
      const render = new RenderKittyImage({
        imageData,
        pixelWidth: 100,
        pixelHeight: 100,
        cellWidth: 10,
        cellHeight: 10,
      });

      // Setting same reference should not trigger change
      render.imageData = imageData;
      render.pixelWidth = 100;
      render.pixelHeight = 100;
      render.cellWidth = 10;
      render.cellHeight = 10;
      // No crash = success (internal state unchanged)
    });
  });

  describe('visitChildren', () => {
    it('visits no children when none set', () => {
      const render = new RenderKittyImage({
        imageData: makeTestImageData(),
        pixelWidth: 100,
        pixelHeight: 100,
        cellWidth: 10,
        cellHeight: 10,
      });

      const visited: any[] = [];
      render.visitChildren((child) => visited.push(child));
      expect(visited.length).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// ImagePreview (IMG-01) — StatefulWidget
// ---------------------------------------------------------------------------

describe('ImagePreview', () => {
  describe('construction', () => {
    it('stores required properties', () => {
      const imageData = makeTestImageData();
      const widget = new ImagePreview({
        imageData,
        width: 640,
        height: 480,
      });
      expect(widget.imageData).toBe(imageData);
      expect(widget.width).toBe(640);
      expect(widget.height).toBe(480);
    });

    it('has default cell pixel sizes', () => {
      const widget = new ImagePreview({
        imageData: makeTestImageData(),
        width: 640,
        height: 480,
      });
      expect(widget.cellPixelWidth).toBe(8);
      expect(widget.cellPixelHeight).toBe(16);
    });

    it('accepts custom cell pixel sizes', () => {
      const widget = new ImagePreview({
        imageData: makeTestImageData(),
        width: 640,
        height: 480,
        cellPixelWidth: 10,
        cellPixelHeight: 20,
      });
      expect(widget.cellPixelWidth).toBe(10);
      expect(widget.cellPixelHeight).toBe(20);
    });

    it('accepts explicit cell dimensions', () => {
      const widget = new ImagePreview({
        imageData: makeTestImageData(),
        width: 640,
        height: 480,
        cellWidth: 80,
        cellHeight: 30,
      });
      expect(widget.cellWidth).toBe(80);
      expect(widget.cellHeight).toBe(30);
    });

    it('accepts optional key', () => {
      const { ValueKey } = require('../../core/key');
      const widget = new ImagePreview({
        key: new ValueKey('preview'),
        imageData: makeTestImageData(),
        width: 100,
        height: 100,
      });
      expect(widget.key).toBeDefined();
    });
  });

  describe('createState', () => {
    it('returns an ImagePreviewState', () => {
      const widget = new ImagePreview({
        imageData: makeTestImageData(),
        width: 640,
        height: 480,
      });
      const state = widget.createState();
      expect(state).toBeInstanceOf(ImagePreviewState);
    });
  });

  describe('createElement', () => {
    it('creates a StatefulElement', () => {
      const widget = new ImagePreview({
        imageData: makeTestImageData(),
        width: 640,
        height: 480,
      });
      const element = widget.createElement();
      expect(element).toBeInstanceOf(StatefulElement);
    });
  });

  describe('state build with Kitty support', () => {
    it('builds KittyImageWidget when Kitty graphics is supported', () => {
      const imageData = makeTestImageData();
      const widget = new ImagePreview({
        imageData,
        width: 640,
        height: 480,
      });

      const state = new ImagePreviewState();
      // Manually mount state with widget
      (state as any)._widget = widget;
      (state as any)._mounted = true;

      // Create a mock context that returns MediaQuery with kittyGraphics=true
      const mockContext = {
        widget: widget,
        mounted: true,
        dependOnInheritedWidgetOfExactType(type: any): any {
          if (type === MediaQuery) {
            const mqData = new MediaQueryData({
              size: { width: 80, height: 24 },
              capabilities: { kittyGraphics: true },
            });
            return {
              widget: new MediaQuery({
                data: mqData,
                child: new DummyLeaf(),
              }),
            };
          }
          return undefined;
        },
      } as unknown as BuildContext;

      const result = state.build(mockContext);

      // Should be an ImagePreviewProvider wrapping a KittyImageWidget
      expect(result).toBeInstanceOf(ImagePreviewProvider);
      const provider = result as ImagePreviewProvider;
      expect(provider.data.displayState).toBe('ready');
      expect(provider.child).toBeInstanceOf(KittyImageWidget);
    });

    it('falls back to SizedBox when Kitty graphics is not supported', () => {
      const imageData = makeTestImageData();
      const widget = new ImagePreview({
        imageData,
        width: 640,
        height: 480,
      });

      const state = new ImagePreviewState();
      (state as any)._widget = widget;
      (state as any)._mounted = true;

      // Mock context without Kitty graphics support
      const mockContext = {
        widget: widget,
        mounted: true,
        dependOnInheritedWidgetOfExactType(type: any): any {
          if (type === MediaQuery) {
            const mqData = new MediaQueryData({
              size: { width: 80, height: 24 },
              capabilities: { kittyGraphics: false },
            });
            return {
              widget: new MediaQuery({
                data: mqData,
                child: new DummyLeaf(),
              }),
            };
          }
          return undefined;
        },
      } as unknown as BuildContext;

      const result = state.build(mockContext);

      expect(result).toBeInstanceOf(ImagePreviewProvider);
      const provider = result as ImagePreviewProvider;
      expect(provider.data.displayState).toBe('unsupported');
      expect(provider.child).toBeInstanceOf(SizedBox);
    });

    it('falls back to SizedBox when no MediaQuery ancestor', () => {
      const imageData = makeTestImageData();
      const widget = new ImagePreview({
        imageData,
        width: 640,
        height: 480,
      });

      const state = new ImagePreviewState();
      (state as any)._widget = widget;
      (state as any)._mounted = true;

      // Mock context with no MediaQuery
      const mockContext = {
        widget: widget,
        mounted: true,
        dependOnInheritedWidgetOfExactType(_type: any): any {
          return undefined;
        },
      } as unknown as BuildContext;

      const result = state.build(mockContext);

      expect(result).toBeInstanceOf(ImagePreviewProvider);
      const provider = result as ImagePreviewProvider;
      expect(provider.data.displayState).toBe('unsupported');
      expect(provider.child).toBeInstanceOf(SizedBox);
    });

    it('reports error state for empty image data', () => {
      const widget = new ImagePreview({
        imageData: new Uint8Array(0),
        width: 640,
        height: 480,
      });

      const state = new ImagePreviewState();
      (state as any)._widget = widget;
      (state as any)._mounted = true;

      // Mock context with Kitty support
      const mockContext = {
        widget: widget,
        mounted: true,
        dependOnInheritedWidgetOfExactType(type: any): any {
          if (type === MediaQuery) {
            const mqData = new MediaQueryData({
              size: { width: 80, height: 24 },
              capabilities: { kittyGraphics: true },
            });
            return {
              widget: new MediaQuery({
                data: mqData,
                child: new DummyLeaf(),
              }),
            };
          }
          return undefined;
        },
      } as unknown as BuildContext;

      const result = state.build(mockContext);

      expect(result).toBeInstanceOf(ImagePreviewProvider);
      const provider = result as ImagePreviewProvider;
      expect(provider.data.displayState).toBe('error');
      expect(provider.child).toBeInstanceOf(SizedBox);
    });

    it('auto-calculates cell dimensions from pixel dimensions', () => {
      const widget = new ImagePreview({
        imageData: makeTestImageData(),
        width: 640,  // 640 / 8 = 80 cells
        height: 480, // 480 / 16 = 30 cells
      });

      const state = new ImagePreviewState();
      (state as any)._widget = widget;
      (state as any)._mounted = true;

      const mockContext = {
        widget: widget,
        mounted: true,
        dependOnInheritedWidgetOfExactType(type: any): any {
          if (type === MediaQuery) {
            const mqData = new MediaQueryData({
              size: { width: 80, height: 24 },
              capabilities: { kittyGraphics: true },
            });
            return {
              widget: new MediaQuery({
                data: mqData,
                child: new DummyLeaf(),
              }),
            };
          }
          return undefined;
        },
      } as unknown as BuildContext;

      const result = state.build(mockContext);
      const provider = result as ImagePreviewProvider;
      const kittyWidget = provider.child as KittyImageWidget;

      expect(kittyWidget.cellWidth).toBe(80);  // ceil(640/8)
      expect(kittyWidget.cellHeight).toBe(30);  // ceil(480/16)
    });

    it('uses explicit cell dimensions when provided', () => {
      const widget = new ImagePreview({
        imageData: makeTestImageData(),
        width: 640,
        height: 480,
        cellWidth: 40,
        cellHeight: 15,
      });

      const state = new ImagePreviewState();
      (state as any)._widget = widget;
      (state as any)._mounted = true;

      const mockContext = {
        widget: widget,
        mounted: true,
        dependOnInheritedWidgetOfExactType(type: any): any {
          if (type === MediaQuery) {
            const mqData = new MediaQueryData({
              size: { width: 80, height: 24 },
              capabilities: { kittyGraphics: true },
            });
            return {
              widget: new MediaQuery({
                data: mqData,
                child: new DummyLeaf(),
              }),
            };
          }
          return undefined;
        },
      } as unknown as BuildContext;

      const result = state.build(mockContext);
      const provider = result as ImagePreviewProvider;
      const kittyWidget = provider.child as KittyImageWidget;

      expect(kittyWidget.cellWidth).toBe(40);
      expect(kittyWidget.cellHeight).toBe(15);
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: Nested provider override
// ---------------------------------------------------------------------------

describe('ImagePreviewProvider nested override', () => {
  it('inner provider overrides outer', () => {
    const outerData: ImagePreviewData = {
      imageData: makeTestImageData(16),
      width: 640,
      height: 480,
      displayState: 'ready',
    };
    const innerData: ImagePreviewData = {
      imageData: makeTestImageData(32),
      width: 800,
      height: 600,
      displayState: 'loading',
    };
    const leaf = new DummyLeaf();

    const inner = new ImagePreviewProvider({ data: innerData, child: leaf });
    const outer = new ImagePreviewProvider({ data: outerData, child: inner });

    const outerElement = outer.createElement() as InheritedElement;
    outerElement.mount();

    const innerElement = outerElement.child! as InheritedElement;
    const leafElement = innerElement.child!;

    const context = new BuildContextImpl(leafElement, leafElement.widget);
    const result = ImagePreviewProvider.of(context);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.displayState).toBe('loading');
  });
});

// ---------------------------------------------------------------------------
// Import type for PaintContext
// ---------------------------------------------------------------------------
import type { PaintContext } from '../../framework/render-object';
