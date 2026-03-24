// diff-demo.ts — Demonstrates the DiffView widget with computeDiff.
//
// Run with: bun run examples/diff-demo.ts
//
// This example demonstrates:
// - DiffView.computeDiff() to generate unified diffs from two text strings
// - DiffView rendering with showLineNumbers: true
// - Word-level diff highlighting (enabled by default)
// - ignoreWhitespace option for whitespace-insensitive comparison
// - Multiple diff sections with different configurations

import { runApp } from '../src/framework/binding';
import { Column } from '../src/widgets/flex';
import { Expanded } from '../src/widgets/flexible';
import { Text } from '../src/widgets/text';
import { Divider } from '../src/widgets/divider';
import { DiffView } from '../src/widgets/diff-view';
import { SingleChildScrollView } from '../src/widgets/scroll-view';
import { Padding } from '../src/widgets/padding';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';
import { EdgeInsets } from '../src/layout/edge-insets';

// ---------------------------------------------------------------------------
// Sample code snippets for diffing
// ---------------------------------------------------------------------------

const OLD_CODE = `import { Widget } from './widget';
import { Element } from './element';

export class Button extends Widget {
  readonly label: string;
  readonly disabled: boolean;

  constructor(label: string) {
    super();
    this.label = label;
    this.disabled = false;
  }

  createElement(): Element {
    return new ButtonElement(this);
  }

  render(): string {
    return \`[ \${this.label} ]\`;
  }
}`;

const NEW_CODE = `import { Widget } from './widget';
import { Element } from './element';
import { Color } from './color';

export class Button extends Widget {
  readonly label: string;
  readonly disabled: boolean;
  readonly color: Color;

  constructor(label: string, color?: Color) {
    super();
    this.label = label;
    this.disabled = false;
    this.color = color ?? Color.defaultColor;
  }

  createElement(): Element {
    return new ButtonElement(this);
  }

  render(): string {
    const prefix = this.disabled ? '  ' : '> ';
    return \`\${prefix}[ \${this.label} ]\`;
  }
}`;

// ---------------------------------------------------------------------------
// Whitespace-sensitive vs insensitive example
// ---------------------------------------------------------------------------

const WS_OLD = `function greet(name: string) {
    console.log("Hello, " + name);
    return   true;
}`;

const WS_NEW = `function greet(name: string) {
  console.log("Hello, " + name);
  return true;
}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sectionHeading(title: string): Text {
  return new Text({
    text: new TextSpan({
      text: title,
      style: new TextStyle({ bold: true, foreground: Color.cyan }),
    }),
  });
}

function sectionDescription(desc: string): Text {
  return new Text({
    text: new TextSpan({
      text: desc,
      style: new TextStyle({ dim: true }),
    }),
  });
}

// ---------------------------------------------------------------------------
// Build the diff demo
// ---------------------------------------------------------------------------

export function buildDiffDemo() {
  // Compute diffs
  const mainDiff = DiffView.computeDiff(OLD_CODE, NEW_CODE, {
    fileName: 'button.ts',
  });

  const wsDiff = DiffView.computeDiff(WS_OLD, WS_NEW, {
    fileName: 'greet.ts',
    ignoreWhitespace: false,
  });

  const wsIgnoredDiff = DiffView.computeDiff(WS_OLD, WS_NEW, {
    fileName: 'greet.ts',
    ignoreWhitespace: true,
  });

  return new Column({
    mainAxisAlignment: 'start',
    crossAxisAlignment: 'stretch',
    children: [
      // Header
      new Padding({
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: sectionHeading('DiffView Widget Demo'),
      }),
      new Padding({
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: sectionDescription('Unified diff rendering with word-level highlighting'),
      }),
      new Divider(),
      // Scrollable diff content
      new Expanded({
        child: new SingleChildScrollView({
          child: new Column({
            mainAxisSize: 'min',
            crossAxisAlignment: 'stretch',
            children: [
              // Section 1: Standard diff with line numbers and word-level highlighting
              new Padding({
                padding: EdgeInsets.symmetric({ horizontal: 1 }),
                child: sectionHeading('1. Standard Diff (line numbers + word-level)'),
              }),
              new Padding({
                padding: EdgeInsets.symmetric({ horizontal: 1 }),
                child: sectionDescription(
                  'Adding Color import, color property, and updated render method',
                ),
              }),
              new Padding({
                padding: EdgeInsets.symmetric({ horizontal: 1 }),
                child: new DiffView({
                  diff: mainDiff,
                  showLineNumbers: true,
                  wordLevelDiff: true,
                }),
              }),
              new Divider(),

              // Section 2: Whitespace-sensitive diff
              new Padding({
                padding: EdgeInsets.symmetric({ horizontal: 1 }),
                child: sectionHeading('2. Whitespace-Sensitive Diff'),
              }),
              new Padding({
                padding: EdgeInsets.symmetric({ horizontal: 1 }),
                child: sectionDescription(
                  'Indentation change from 4 spaces to 2 spaces (shows as changes)',
                ),
              }),
              new Padding({
                padding: EdgeInsets.symmetric({ horizontal: 1 }),
                child: new DiffView({
                  diff: wsDiff,
                  showLineNumbers: true,
                  wordLevelDiff: true,
                }),
              }),
              new Divider(),

              // Section 3: ignoreWhitespace diff
              new Padding({
                padding: EdgeInsets.symmetric({ horizontal: 1 }),
                child: sectionHeading('3. ignoreWhitespace: true'),
              }),
              new Padding({
                padding: EdgeInsets.symmetric({ horizontal: 1 }),
                child: sectionDescription(
                  'Same indentation change but whitespace is ignored (fewer changes)',
                ),
              }),
              new Padding({
                padding: EdgeInsets.symmetric({ horizontal: 1 }),
                child: wsIgnoredDiff
                  ? new DiffView({
                      diff: wsIgnoredDiff,
                      showLineNumbers: true,
                      wordLevelDiff: true,
                    })
                  : new Text({
                      text: new TextSpan({
                        text: '  (no differences when whitespace is ignored)',
                        style: new TextStyle({ foreground: Color.green, dim: true }),
                      }),
                    }),
              }),
            ],
          }),
        }),
      }),
    ],
  });
}

// Export for testing
export const app = buildDiffDemo();

// Only run the app when executed directly
if (import.meta.main) {
  runApp(app, { output: process.stdout });
}
