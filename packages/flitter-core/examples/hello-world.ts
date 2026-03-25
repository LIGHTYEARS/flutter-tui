// hello-world.ts — The simplest possible flitter-core app.
//
// Displays centered colored text on the terminal.
// Run with: bun run examples/hello-world.ts
//
// This example demonstrates:
// - runApp() to start the application
// - Center widget to center content in the terminal
// - Text widget with styled TextSpan
// - Color and TextStyle for visual styling

import { runApp, WidgetsBinding } from '../src/framework/binding';
import { Center } from '../src/widgets/center';
import { Text } from '../src/widgets/text';
import { TextSpan } from '../src/core/text-span';
import { TextStyle } from '../src/core/text-style';
import { Color } from '../src/core/color';

// Build the widget tree:
// Center wraps its child to fill available space and positions the child
// at the center of the terminal viewport.
const app = new Center({
  child: new Text({
    text: new TextSpan({
      text: 'Hello, Flitter!',
      style: new TextStyle({
        bold: true,
        foreground: Color.rgb(100, 200, 255),
      }),
    }),
  }),
});

// Export the widget tree for testing (allows importing without side effects)
export { app };

// Only run the app when executed directly (not when imported for tests)
if (import.meta.main) {
  runApp(app, { output: process.stdout });
}
