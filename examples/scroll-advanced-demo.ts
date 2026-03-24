// scroll-advanced-demo.ts — Demonstrates enhanced ScrollView features.
//
// Run with: bun run examples/scroll-advanced-demo.ts
//
// This example demonstrates:
// - Sub-character precision scrollbar (via Scrollbar widget)
// - Vim keyboard navigation (j/k/g/G)
// - Mouse wheel scrolling
// - ScrollController shared between ScrollView and Scrollbar
// - Row layout: Expanded(ScrollView) + Scrollbar
// - 100 items to make scrollbar precision visible
// - Help text at bottom with keyboard shortcuts

import { runApp } from '../src/framework/binding';
import { Column, Row } from '../src/widgets/flex';
import { Expanded } from '../src/widgets/flexible';
import { Text } from '../src/widgets/text';
import { Divider } from '../src/widgets/divider';
import { SingleChildScrollView } from '../src/widgets/scroll-view';
import { ScrollController } from '../src/widgets/scroll-controller';
import { Scrollbar } from '../src/widgets/scrollbar';
import { Padding } from '../src/widgets/padding';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';
import { EdgeInsets } from '../src/layout/edge-insets';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ITEM_COUNT = 100;

// Rotating colors for visual distinction across items
const ITEM_COLORS = [
  Color.green,
  Color.cyan,
  Color.yellow,
  Color.magenta,
  Color.blue,
  Color.defaultColor,
];

// Category labels to make list items more interesting
const CATEGORIES = [
  'network',
  'storage',
  'compute',
  'memory',
  'display',
  'input',
  'audio',
  'security',
  'logging',
  'config',
];

// ---------------------------------------------------------------------------
// Build the advanced scroll demo
// ---------------------------------------------------------------------------

export function buildScrollAdvancedDemo() {
  // Shared scroll controller for synchronizing scroll view and scrollbar
  const controller = new ScrollController();

  // Generate 100 list items with varied content
  const items = Array.from({ length: ITEM_COUNT }, (_, i) => {
    const index = i + 1;
    const color = ITEM_COLORS[i % ITEM_COLORS.length]!;
    const category = CATEGORIES[i % CATEGORIES.length]!;

    return new Padding({
      padding: EdgeInsets.symmetric({ horizontal: 1 }),
      child: new Row({
        mainAxisAlignment: 'start',
        children: [
          // Line number
          new Text({
            text: new TextSpan({
              text: `${String(index).padStart(4, ' ')}.`,
              style: new TextStyle({ dim: true }),
            }),
          }),
          // Category tag
          new Text({
            text: new TextSpan({
              text: ` [${category.padEnd(8)}]`,
              style: new TextStyle({ foreground: Color.brightBlack }),
            }),
          }),
          // Item content with color
          new Text({
            text: new TextSpan({
              text: ` Process #${index} - ${category} subsystem event handler`,
              style: new TextStyle({ foreground: color }),
            }),
          }),
        ],
      }),
    });
  });

  return new Column({
    mainAxisAlignment: 'start',
    crossAxisAlignment: 'stretch',
    children: [
      // Header
      new Padding({
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: new Text({
          text: new TextSpan({
            text: 'Advanced Scroll Demo',
            style: new TextStyle({ bold: true, foreground: Color.cyan }),
          }),
        }),
      }),
      new Padding({
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: new Text({
          text: new TextSpan({
            text: `${ITEM_COUNT} items with sub-character precision scrollbar`,
            style: new TextStyle({ dim: true }),
          }),
        }),
      }),
      new Divider(),
      // Main content: ScrollView + Scrollbar in a Row
      new Expanded({
        child: new Row({
          crossAxisAlignment: 'stretch',
          children: [
            // Scrollable content fills available width
            new Expanded({
              child: new SingleChildScrollView({
                controller,
                enableKeyboardScroll: true,
                enableMouseScroll: true,
                child: new Column({
                  mainAxisSize: 'min',
                  crossAxisAlignment: 'start',
                  children: items,
                }),
              }),
            }),
            // Scrollbar synced to the same controller
            new Scrollbar({
              controller,
              subCharacterPrecision: true,
              thumbColor: Color.cyan,
              trackColor: Color.brightBlack,
            }),
          ],
        }),
      }),
      new Divider(),
      // Help text at bottom
      new Padding({
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: new Text({
          text: new TextSpan({
            children: [
              new TextSpan({
                text: 'j/k',
                style: new TextStyle({ foreground: Color.cyan, bold: true }),
              }),
              new TextSpan({
                text: ': scroll  ',
                style: new TextStyle({ dim: true }),
              }),
              new TextSpan({
                text: 'g/G',
                style: new TextStyle({ foreground: Color.cyan, bold: true }),
              }),
              new TextSpan({
                text: ': top/bottom  ',
                style: new TextStyle({ dim: true }),
              }),
              new TextSpan({
                text: 'PgUp/PgDn',
                style: new TextStyle({ foreground: Color.cyan, bold: true }),
              }),
              new TextSpan({
                text: ': page scroll  ',
                style: new TextStyle({ dim: true }),
              }),
              new TextSpan({
                text: 'Mouse wheel',
                style: new TextStyle({ foreground: Color.cyan, bold: true }),
              }),
              new TextSpan({
                text: ': scroll  ',
                style: new TextStyle({ dim: true }),
              }),
              new TextSpan({
                text: 'Ctrl+q',
                style: new TextStyle({ foreground: Color.cyan, bold: true }),
              }),
              new TextSpan({
                text: ': quit',
                style: new TextStyle({ dim: true }),
              }),
            ],
          }),
        }),
      }),
    ],
  });
}

// Export for testing
export const app = buildScrollAdvancedDemo();

// Only run the app when executed directly
if (import.meta.main) {
  runApp(app, { output: process.stdout });
}
