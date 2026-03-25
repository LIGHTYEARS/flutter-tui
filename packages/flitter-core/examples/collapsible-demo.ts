// collapsible-demo.ts — Demonstrates the CollapsibleDrawer widget.
//
// Run with: bun run examples/collapsible-demo.ts
//
// This example demonstrates:
// - CollapsibleDrawer with multiple sections
// - One section initially expanded
// - Nested collapsible sections (sub-sections inside a parent)
// - Spinner animation on an in-progress section
// - maxContentLines truncation with "View all" link
// - Keyboard interaction (Enter/Space to toggle)

import { runApp } from '../src/framework/binding';
import { Column } from '../src/widgets/flex';
import { Expanded } from '../src/widgets/flexible';
import { Text } from '../src/widgets/text';
import { Divider } from '../src/widgets/divider';
import { Padding } from '../src/widgets/padding';
import { CollapsibleDrawer } from '../src/widgets/collapsible-drawer';
import { SingleChildScrollView } from '../src/widgets/scroll-view';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';
import { EdgeInsets } from '../src/layout/edge-insets';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sectionTitle(text: string): Text {
  return new Text({
    text: new TextSpan({
      text,
      style: new TextStyle({ bold: true, foreground: Color.defaultColor }),
    }),
  });
}

function contentLine(text: string, color?: Color): Text {
  return new Text({
    text: new TextSpan({
      text: `  ${text}`,
      style: new TextStyle({ foreground: color ?? Color.defaultColor }),
    }),
  });
}

function dimLine(text: string): Text {
  return new Text({
    text: new TextSpan({
      text: `  ${text}`,
      style: new TextStyle({ dim: true }),
    }),
  });
}

// ---------------------------------------------------------------------------
// Build the collapsible demo
// ---------------------------------------------------------------------------

export function buildCollapsibleDemo() {
  // Section 1: Project Overview (initially expanded)
  const projectOverview = new CollapsibleDrawer({
    title: sectionTitle('Project Overview'),
    expanded: true,
    child: new Padding({
      padding: EdgeInsets.only({ left: 2 }),
      child: new Column({
        mainAxisSize: 'min',
        crossAxisAlignment: 'start',
        children: [
          contentLine('Name: flitter-core', Color.cyan),
          contentLine('Version: 0.1.0', Color.cyan),
          contentLine('Runtime: Bun', Color.cyan),
          contentLine('Language: TypeScript (strict)', Color.cyan),
          dimLine('A terminal UI framework inspired by Flutter rendering.'),
        ],
      }),
    }),
  });

  // Section 2: Build Status (with spinner = in-progress)
  const buildStatus = new CollapsibleDrawer({
    title: sectionTitle('Build Status'),
    expanded: true,
    spinner: true,
    child: new Padding({
      padding: EdgeInsets.only({ left: 2 }),
      child: new Column({
        mainAxisSize: 'min',
        crossAxisAlignment: 'start',
        children: [
          contentLine('Compiling src/widgets/markdown.ts...', Color.yellow),
          contentLine('Compiling src/widgets/diff-view.ts...', Color.yellow),
          contentLine('Compiling src/widgets/collapsible-drawer.ts...', Color.yellow),
          dimLine('3 of 47 modules compiled'),
        ],
      }),
    }),
  });

  // Section 3: Test Results (with maxContentLines truncation)
  const testResults = new CollapsibleDrawer({
    title: sectionTitle('Test Results (42 tests)'),
    expanded: true,
    maxContentLines: 5,
    child: new Padding({
      padding: EdgeInsets.only({ left: 2 }),
      child: new Column({
        mainAxisSize: 'min',
        crossAxisAlignment: 'start',
        children: [
          contentLine('PASS  core/color.test.ts (12 tests)', Color.green),
          contentLine('PASS  core/text-span.test.ts (8 tests)', Color.green),
          contentLine('PASS  layout/edge-insets.test.ts (6 tests)', Color.green),
          contentLine('PASS  widgets/text.test.ts (5 tests)', Color.green),
          contentLine('PASS  widgets/flex.test.ts (4 tests)', Color.green),
          contentLine('PASS  widgets/markdown.test.ts (3 tests)', Color.green),
          contentLine('PASS  widgets/diff-view.test.ts (2 tests)', Color.green),
          contentLine('PASS  widgets/scroll-view.test.ts (2 tests)', Color.green),
          dimLine('All 42 tests passed in 1.23s'),
        ],
      }),
    }),
  });

  // Section 4: Nested collapsible sections
  const subSectionA = new CollapsibleDrawer({
    title: new Text({
      text: new TextSpan({
        text: 'Widgets',
        style: new TextStyle({ foreground: Color.defaultColor }),
      }),
    }),
    expanded: false,
    child: new Padding({
      padding: EdgeInsets.only({ left: 2 }),
      child: new Column({
        mainAxisSize: 'min',
        crossAxisAlignment: 'start',
        children: [
          contentLine('Text, Padding, Column, Row', Color.cyan),
          contentLine('Container, SizedBox, Spacer', Color.cyan),
          contentLine('Markdown, DiffView, CollapsibleDrawer', Color.cyan),
        ],
      }),
    }),
  });

  const subSectionB = new CollapsibleDrawer({
    title: new Text({
      text: new TextSpan({
        text: 'Core',
        style: new TextStyle({ foreground: Color.defaultColor }),
      }),
    }),
    expanded: false,
    child: new Padding({
      padding: EdgeInsets.only({ left: 2 }),
      child: new Column({
        mainAxisSize: 'min',
        crossAxisAlignment: 'start',
        children: [
          contentLine('Color, TextStyle, TextSpan', Color.cyan),
          contentLine('BoxConstraints, EdgeInsets', Color.cyan),
          contentLine('Key, Size, Offset', Color.cyan),
        ],
      }),
    }),
  });

  const subSectionC = new CollapsibleDrawer({
    title: new Text({
      text: new TextSpan({
        text: 'Framework',
        style: new TextStyle({ foreground: Color.defaultColor }),
      }),
    }),
    expanded: false,
    child: new Padding({
      padding: EdgeInsets.only({ left: 2 }),
      child: new Column({
        mainAxisSize: 'min',
        crossAxisAlignment: 'start',
        children: [
          contentLine('Widget, Element, RenderObject', Color.cyan),
          contentLine('BuildOwner, PipelineOwner', Color.cyan),
          contentLine('WidgetsBinding, FrameScheduler', Color.cyan),
        ],
      }),
    }),
  });

  const moduleIndex = new CollapsibleDrawer({
    title: sectionTitle('Module Index (nested)'),
    expanded: true,
    child: new Padding({
      padding: EdgeInsets.only({ left: 2 }),
      child: new Column({
        mainAxisSize: 'min',
        crossAxisAlignment: 'start',
        children: [subSectionA, subSectionB, subSectionC],
      }),
    }),
  });

  // Section 5: Changelog (collapsed by default)
  const changelog = new CollapsibleDrawer({
    title: sectionTitle('Changelog'),
    expanded: false,
    child: new Padding({
      padding: EdgeInsets.only({ left: 2 }),
      child: new Column({
        mainAxisSize: 'min',
        crossAxisAlignment: 'start',
        children: [
          contentLine('v0.1.0 - Initial release with core widgets'),
          contentLine('v0.0.9 - Added Markdown and DiffView'),
          contentLine('v0.0.8 - Added CollapsibleDrawer'),
          contentLine('v0.0.7 - Scrollbar with sub-character precision'),
          contentLine('v0.0.6 - SingleChildScrollView improvements'),
        ],
      }),
    }),
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
            text: 'CollapsibleDrawer Demo',
            style: new TextStyle({ bold: true, foreground: Color.cyan }),
          }),
        }),
      }),
      new Padding({
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: new Text({
          text: new TextSpan({
            text: 'Expandable sections with nesting, spinner, and truncation',
            style: new TextStyle({ dim: true }),
          }),
        }),
      }),
      new Divider(),
      // Scrollable collapsible content
      new Expanded({
        child: new SingleChildScrollView({
          child: new Padding({
            padding: EdgeInsets.symmetric({ horizontal: 1 }),
            child: new Column({
              mainAxisSize: 'min',
              crossAxisAlignment: 'stretch',
              children: [
                projectOverview,
                new Divider(),
                buildStatus,
                new Divider(),
                testResults,
                new Divider(),
                moduleIndex,
                new Divider(),
                changelog,
              ],
            }),
          }),
        }),
      }),
      new Divider(),
      // Help text
      new Padding({
        padding: EdgeInsets.symmetric({ horizontal: 1 }),
        child: new Text({
          text: new TextSpan({
            children: [
              new TextSpan({
                text: 'Enter/Space',
                style: new TextStyle({ foreground: Color.cyan, bold: true }),
              }),
              new TextSpan({
                text: ': toggle  ',
                style: new TextStyle({ dim: true }),
              }),
              new TextSpan({
                text: 'Click',
                style: new TextStyle({ foreground: Color.cyan, bold: true }),
              }),
              new TextSpan({
                text: ': expand/collapse  ',
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
export const app = buildCollapsibleDemo();

// Only run the app when executed directly
if (import.meta.main) {
  runApp(app, { output: process.stdout });
}
