# Input System -- Reverse-Engineered from Amp CLI Binary

Source: `/home/gem/home/tmp/amp-strings.txt`

---

## 1. Low-Level Input Parser: `emitKeys()` Generator

The core escape-sequence parser is a **generator function** that converts raw bytes
from stdin into structured `key` objects. It is the Bun/Node readline `emitKeys`
implementation, found at **line 241761**.

### 1.1 Key Object Shape

```js
// line 241763-241768
let key = {
  sequence: null,   // raw character sequence that produced this event
  name: undefined,  // logical key name ("up", "f1", "backspace", etc.)
  ctrl: false,      // Ctrl modifier
  meta: false,      // Alt/Meta modifier
  shift: false,     // Shift modifier
};
```

**Annotation**: This is the output of the low-level parser. Every keypress event
emitted via `stream.emit("keypress", s, key)` (line 242051) carries this shape.

### 1.2 State Machine: Escape Sequence Parsing

```
                          +--------+
                          | Idle   |  <-- yield, wait for char
                          +---+----+
                              |
                         ch received
                              |
                     +--------v--------+
                     | ch === \x1b ?   |
                     +----+-------+----+
                      yes |       | no
                          v       v
                  +-------+--+  (single char path)
                  | escaped  |
                  | s += yield|
                  +--+----+--+
                     |    |
                 ch=O    ch=[
                 (SS3)   (CSI)
                     |    |
              +------v-+  +-------v--------+
              | SS3    |  | CSI            |
              | mode   |  | [[ prefix?     |
              | 0-9 → |  | digits;digits  |
              | modifier| | trailing letter|
              +--------+  +----------------+
                     |    |
                     v    v
              +------+----+------+
              | code = "O.." or  |
              |   code = "[.."   |
              | modifier decoded |
              +------------------+
                     |
              switch(code) →  key.name mapping
```

**Lines 241770-241804**: The parser handles three prefix modes:
- **Bare escape** (`\x1b` alone) -- sets `escaped = true`, meta modifier
- **SS3 mode** (`\x1b O`) -- Single Shift 3, used by some terminals for F-keys and arrows
- **CSI mode** (`\x1b [`) -- Control Sequence Introducer, the primary escape format

### 1.3 Modifier Decoding (line 241805)

```js
// line 241805
key.ctrl  = !!(modifier & 4);
key.meta  = !!(modifier & 10);   // bits 1+3 = Alt
key.shift = !!(modifier & 1);
```

The `modifier` value comes from the numeric parameter in CSI sequences:
- CSI format: `\x1b [ <num> ; <modifier> <letter>`
- The modifier integer is `(value_from_sequence || 1) - 1`
- Bit layout: `bit0 = Shift, bit1 = Alt, bit2 = Ctrl, bit3 = Meta`

### 1.4 CSI Parameter Parsing (lines 241784-241803)

Two regex patterns extract the code and modifier from CSI sequences:

```js
// line 241795 -- numeric codes with ~ ^ $ terminators
/^(?:(\d\d?)(?:;(\d))?([~^$])|(\d{3}~))$/

// line 241800 -- letter-terminated codes
/^((\d;)?(\d))?([A-Za-z])$/
```

---

## 2. Logical Key Name Mapping Table

Complete escape-code-to-key-name mapping extracted from the giant switch statement
(lines 241805-242030).

### 2.1 Function Keys

| Escape Code(s)                | Key Name | Lines         |
|-------------------------------|----------|---------------|
| `[P`, `OP`, `[11~`, `[[A`    | `f1`     | 241806-241849 |
| `[Q`, `OQ`, `[12~`, `[[B`    | `f2`     | 241809-241852 |
| `[R`, `OR`, `[13~`, `[[C`    | `f3`     | 241812-241855 |
| `[S`, `OS`, `[14~`, `[[D`    | `f4`     | 241815-241858 |
| `[[E`, `[15~`                 | `f5`     | 241860-241864 |
| `[17~`                        | `f6`     | 241866        |
| `[18~`                        | `f7`     | 241869        |
| `[19~`                        | `f8`     | 241872        |
| `[20~`                        | `f9`     | 241875        |
| `[21~`                        | `f10`    | 241878        |
| `[23~`                        | `f11`    | 241881        |
| `[24~`                        | `f12`    | 241884        |

### 2.2 Arrow Keys & Navigation

| Escape Code(s)   | Key Name    | Lines         |
|-------------------|-------------|---------------|
| `[A`, `OA`        | `up`        | 241887, 241908 |
| `[B`, `OB`        | `down`      | 241890, 241911 |
| `[C`, `OC`        | `right`     | 241893, 241914 |
| `[D`, `OD`        | `left`      | 241896, 241917 |
| `[E`, `OE`        | `clear`     | 241899, 241920 |
| `[F`, `OF`        | `end`       | 241902, 241923 |
| `[H`, `OH`        | `home`      | 241905, 241926 |

### 2.3 Editing Keys

| Escape Code(s)                 | Key Name    | Lines         |
|---------------------------------|-------------|---------------|
| `[1~`, `[7~`                    | `home`      | 241929, 241953 |
| `[2~`                           | `insert`    | 241932        |
| `[3~`                           | `delete`    | 241935        |
| `[4~`, `[8~`                    | `end`       | 241938, 241956 |
| `[5~`, `[[5~`                   | `pageup`    | 241941, 241947 |
| `[6~`, `[[6~`                   | `pagedown`  | 241944, 241950 |

### 2.4 Shift Variants (rxvt-style)

| Code   | Key Name   | Shift | Line   |
|--------|------------|-------|--------|
| `[a`   | `up`       | yes   | 241959 |
| `[b`   | `down`     | yes   | 241962 |
| `[c`   | `right`    | yes   | 241965 |
| `[d`   | `left`     | yes   | 241968 |
| `[e`   | `clear`    | yes   | 241971 |
| `[2$`  | `insert`   | yes   | 241974 |
| `[3$`  | `delete`   | yes   | 241977 |
| `[5$`  | `pageup`   | yes   | 241980 |
| `[6$`  | `pagedown` | yes   | 241983 |
| `[7$`  | `home`     | yes   | 241986 |
| `[8$`  | `end`      | yes   | 241989 |

### 2.5 Ctrl Variants (rxvt-style)

| Code   | Key Name   | Ctrl | Line   |
|--------|------------|------|--------|
| `Oa`   | `up`       | yes  | 241992 |
| `Ob`   | `down`     | yes  | 241995 |
| `Oc`   | `right`    | yes  | 241998 |
| `Od`   | `left`     | yes  | 242001 |
| `Oe`   | `clear`    | yes  | 242004 |
| `[2^`  | `insert`   | yes  | 242007 |
| `[3^`  | `delete`   | yes  | 242010 |
| `[5^`  | `pageup`   | yes  | 242013 |
| `[6^`  | `pagedown` | yes  | 242016 |
| `[7^`  | `home`     | yes  | 242019 |
| `[8^`  | `end`      | yes  | 242022 |

### 2.6 Special Keys

| Code    | Key Name       | Line   |
|---------|----------------|--------|
| `[Z`    | `tab` (shift)  | 242025 |
| `[200~` | `paste-start`  | 242842 |
| `[201~` | `paste-end`    | 242845 |

### 2.7 Non-Escape Single Characters (lines 242032-242049)

| Character     | Key Name    | Notes                 | Line   |
|---------------|-------------|-----------------------|--------|
| `\r` (0x0D)   | `return`    | meta if escaped       | 242033 |
| `\n` (0x0A)   | `enter`     | meta if escaped       | 242035 |
| `\t` (0x09)   | `tab`       | meta if escaped       | 242037 |
| `\b` / `\x7F` | `backspace` | meta if escaped       | 242038 |
| `\x1b`        | `escape`    | meta if escaped       | 242041 |
| ` ` (0x20)    | `space`     | meta if escaped       | 242043 |
| 0x01-0x1A     | `a`-`z`     | ctrl=true             | 242044 |
| `[0-9A-Za-z]` | lowercase   | shift if uppercase    | 242046 |

---

## 3. Keypress Event Pipeline

### 3.1 emitKeypressEvents() Wiring (line 242116)

```js
// line 242116-242146
function emitKeypressEvents(stream, iface = {}) {
  stream[KEYPRESS_DECODER] = new StringDecoder("utf8");
  stream[ESCAPE_DECODER] = emitKeys(stream);
  stream[ESCAPE_DECODER].next();   // prime the generator

  var triggerEscape = () => stream[ESCAPE_DECODER].next("");
  var { escapeCodeTimeout = 500 } = iface;

  function onData(input) {
    var string = stream[KEYPRESS_DECODER].write(input);
    for (var character of new SafeStringIterator(string)) {
      stream[ESCAPE_DECODER].next(character);
      // If last char is ESC, set timeout to force emit
      if (length === string.length && character === kEscape)
        timeoutId = setTimeout(triggerEscape, escapeCodeTimeout);
    }
  }
}
```

**Key detail**: An **escape code timeout** of 500ms (line 242115, `ESCAPE_CODE_TIMEOUT`)
handles the ambiguity between a bare ESC keypress and the start of an escape sequence.
If ESC is received and no follow-up byte arrives within 500ms, it is emitted as
a standalone `escape` key.

### 3.2 readline Integration (lines 242147-242224)

The `InterfaceConstructor` wires it all together:
```
stdin --> emitKeypressEvents(stdin) --> "keypress" events
       |
       v
  InterfaceConstructor._ttyWrite(s, key)
       |
       v
  Action dispatch (kDeleteLeft, kWordRight, kHistoryPrev, etc.)
```

Symbols for all editing operations (line 242147):
- `kDeleteLeft`, `kDeleteRight`, `kDeleteWordLeft`, `kDeleteWordRight`
- `kDeleteLineLeft`, `kDeleteLineRight`
- `kHistoryNext`, `kHistoryPrev`
- `kInsertString`, `kLine`
- `kWordLeft`, `kWordRight`
- `kUndo`, `kRedo`
- `kYank`, `kYankPop`
- `kSetRawMode`, `kTtyWrite`

---

## 4. Terminal Raw Mode & Mouse Protocol

### 4.1 Raw Mode Control

Found at **line 242147** (`kSetRawMode` symbol) and **line 242214**:

```js
// line 242214
this[kSetRawMode](true);  // enable raw mode when terminal is active
```

Raw mode disables line buffering and echo so the application receives every
keystroke immediately. The Amp TUI uses `suspend()` / `resume()` to toggle
raw mode when shelling out to an editor (line ~530123).

### 4.2 Mouse Protocol Escape Sequences

Terminal mouse reporting is enabled/disabled via ANSI escape codes found in
the binary strings:

| Escape Sequence   | Protocol               | Line  |
|--------------------|------------------------|-------|
| `\x1b[?1000h`     | Normal mouse tracking  | 1484  |
| `\x1b[?1000l`     | Disable mouse tracking | 1445  |
| `\x1b[?1006h`     | SGR extended mouse     | 1515  |

The Amp TUI enables **SGR extended mouse mode** (`?1006h`) which sends mouse
events in the format: `\x1b[<Cb;Cx;CyM` (press) or `\x1b[<Cb;Cx;Cym` (release).

### 4.3 SGR Mouse Event Parsing

From the TUI layer (line ~530123-530124), the mouse parser decodes SGR sequences:

```
Format: \x1b[< {button} ; {column} ; {row} {M|m}
  - M = button press or motion
  - m = button release
  - button encoding:
    - 0  = left button press
    - 1  = middle button press
    - 2  = right button press
    - 32 = mouse motion (with button held)
    - 64 = scroll up
    - 65 = scroll down
    - 66 = scroll left   (horizontal)
    - 67 = scroll right  (horizontal)
    - +4  = Shift modifier
    - +8  = Meta/Alt modifier
    - +16 = Ctrl modifier
```

---

## 5. TUI-Level Key Event Mapping

The Amp TUI layer translates the low-level key names from `emitKeys()` into
its own higher-level key identifiers used by the widget framework.

### 5.1 High-Level Key Names (from widget event handlers)

Found across the scrollable, text field, and dialog widgets:

| TUI Key Name    | Low-Level Origin           | Usage Context                    |
|-----------------|----------------------------|----------------------------------|
| `ArrowUp`       | `up` from emitKeys         | Scroll, cursor movement          |
| `ArrowDown`     | `down` from emitKeys       | Scroll, cursor movement          |
| `ArrowLeft`     | `left` from emitKeys       | Horizontal scroll, cursor        |
| `ArrowRight`    | `right` from emitKeys      | Horizontal scroll, cursor        |
| `Enter`         | `enter`/`return`           | Submit, confirm                  |
| `Escape`        | `escape`                   | Cancel, dismiss                  |
| `Tab`           | `tab`                      | Focus navigation, selection      |
| `Backspace`     | `backspace`                | Text deletion                    |
| `Delete`        | `delete`                   | Forward text deletion            |
| `Home`          | `home`                     | Scroll to top / line start       |
| `End`           | `end`                      | Scroll to bottom / line end      |
| `PageUp`        | `pageup`                   | Page scroll up                   |
| `PageDown`      | `pagedown`                 | Page scroll down                 |
| Single chars    | `a`-`z`, `0`-`9`          | Vim-style shortcuts (j/k/g/G)   |

### 5.2 KeyEvent Interface (from widget handler signatures)

```typescript
// Reconstructed from handler patterns across the codebase
interface KeyEvent {
  key: string;        // "ArrowUp", "Enter", "a", "Escape", etc.
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

type KeyEventResult = "handled" | "ignored";
```

Handler pattern (from `Focus` widget, line ~530126):
```js
// onKey handler signature
(event: KeyEvent) => KeyEventResult
```

---

## 6. Mouse Event System

### 6.1 Mouse Event Interface

From the `GestureDetector` (`T3`) widget and `Scrollable` classes:

```typescript
// Reconstructed from usage patterns
interface MouseEvent {
  button: number;     // SGR button code (0=left, 1=middle, 2=right, 64-67=scroll)
  x: number;          // column (1-based from SGR, converted to 0-based)
  y: number;          // row
  pressed: boolean;   // true for press (M), false for release (m)
}

interface ScrollEvent {
  direction: "up" | "down" | "left" | "right";
  modifiers: { shift: boolean };
}
```

### 6.2 Mouse Button Codes (from scroll handler, line ~530124)

The `ScrollKeyboardHandler` (class `uH0`) maps scroll wheel events:

```js
// line ~530124 - handleMouseEvent method
case 64: // scroll up (vertical)
  handleScrollDelta(-scrollStep);
case 65: // scroll down (vertical)
  handleScrollDelta(+scrollStep);
case 66: // scroll left (horizontal)
  handleScrollDelta(-scrollStep);
case 67: // scroll right (horizontal)
  handleScrollDelta(+scrollStep);
```

### 6.3 GestureDetector Widget (`T3`)

The `T3` widget provides mouse event handling for any child widget:

```js
// From widget patterns
new T3({
  onClick: (event) => { ... },    // mouse click
  onScroll: (event) => { ... },   // scroll wheel
  onEnter: () => { ... },         // mouse enter (hover)
  onExit: () => { ... },          // mouse exit
  opaque: false,                   // whether to block events
  cursor: "pointer",              // cursor hint
  child: ...
})
```

### 6.4 Global Mouse Release Tracking

The `Pg` (event dispatcher) singleton provides global mouse release callbacks
for drag operations (found in `TextField` state, line ~530681):

```js
Pg.instance.addGlobalReleaseCallback(callback);
Pg.instance.removeGlobalReleaseCallback(callback);
```

---

## 7. Focus System

### 7.1 FocusNode (`D9`)

```typescript
// Reconstructed from constructor options and usage
class D9 /* FocusNode */ {
  constructor(options?: {
    canRequestFocus?: boolean;
    skipTraversal?: boolean;
    onKey?: (event: KeyEvent) => KeyEventResult;
    onPaste?: (text: string) => void;
    debugLabel?: string;
  });

  requestFocus(): void;
  addKeyHandler(handler: (event: KeyEvent) => KeyEventResult): void;
  removeKeyHandler(handler: (event: KeyEvent) => KeyEventResult): void;
  addListener(callback: (node: D9) => void): void;
  removeListener(callback: (node: D9) => void): void;
  dispose(): void;

  hasFocus: boolean;
  onPaste: ((text: string) => void) | null;
}
```

### 7.2 FocusManager (`er`)

The singleton focus manager maintains a tree of focus nodes:

```js
// line ~530126
er.instance.registerNode(focusNode, parentFocusNode);
er.instance.unregisterNode(focusNode);
```

### 7.3 Focus Widget (`t4`)

The `Focus` widget (`t4`) wraps a child and manages a focus node in the tree:

```typescript
// Reconstructed from class definition (line ~530126)
class t4 /* Focus */ extends StatefulWidget {
  focusNode?: FocusNode;
  child: Widget;
  autofocus: boolean;        // default: false
  canRequestFocus: boolean;  // default: true
  skipTraversal: boolean;    // default: false
  onKey?: (event: KeyEvent) => KeyEventResult;
  onPaste?: (text: string) => void;
  onFocusChange?: (hasFocus: boolean) => void;
  debugLabel?: string;
}
```

### 7.4 Focus Lifecycle

From the `Focus` state class (`KJ`, found at line ~530126):

1. `initState()`:
   - Creates internal `FocusNode` if none provided
   - Registers key handler and paste handler
   - Registers node with `FocusManager` under parent focus node
   - If `autofocus`, queues `requestFocus()` via microtask

2. `dispose()`:
   - Removes key handler
   - Unregisters from `FocusManager`
   - Disposes internal focus node

### 7.5 Focus Tree Navigation

Focus traversal is done by finding ancestor `Focus` states:

```js
// line ~530126 -- finding parent focus node
let parent = this.context.findAncestorStateOfType(KJ)?.effectiveFocusNode || null;
er.instance.registerNode(this.effectiveFocusNode, parent);
```

Tab navigation between focusable widgets uses `skipTraversal` to exclude
certain nodes from the tab order.

---

## 8. Shortcut Binding System

### 8.1 Key Matching Pattern

Throughout the codebase, shortcut matching is done via inline comparison:

```js
// Common pattern from SelectionList (line ~530127)
let matchKey = (targetKey, modifiers) => {
  return event.key === targetKey
    && event.shiftKey === (modifiers?.shift ?? false)
    && event.ctrlKey  === (modifiers?.ctrl ?? false)
    && event.altKey   === (modifiers?.alt ?? false)
    && event.metaKey  === (modifiers?.meta ?? false);
};
```

### 8.2 Registered Keyboard Shortcuts (from Help screen, line ~530811)

**Editor Shortcuts** (for the input text field):

| Shortcut               | Action                          |
|-------------------------|---------------------------------|
| `Up` / `Down`           | Move cursor up/down             |
| `Shift+Enter`           | Insert newline                  |
| `Cmd+Enter`             | Submit message                  |
| `Escape`                | Clear input                     |
| `Ctrl+G`                | Edit prompt in $EDITOR          |
| `Ctrl+P` / `Ctrl+N`    | Navigate history (prev/next)    |
| `Cmd+Left` / `Ctrl+A`  | Jump to start of line           |
| `Cmd+Right` / `Ctrl+E` | Jump to end of line             |
| `Alt+Left`              | Jump to previous word           |
| `Alt+Right`             | Jump to next word               |
| `Backspace`             | Delete character backward       |
| `Alt+Backspace` / `Ctrl+W` | Delete word backward        |
| `Delete`                | Delete character forward        |
| `Ctrl+D`                | Delete word forward             |
| `Cmd+Backspace` / `Ctrl+U` | Delete to start of line     |
| `Ctrl+K`                | Delete to end of line           |
| `Ctrl+Y`                | Yank (paste deleted text)       |
| `Ctrl+V`                | Paste image from clipboard      |
| `Ctrl+S`                | Switch agent mode               |
| `Alt+D`                 | Toggle deep reasoning effort    |
| `Ctrl+O`                | Open command palette            |
| `@`                     | Mention files                   |
| `Ctrl+R`                | Show prompt history             |
| `Alt+T`                 | Toggle thinking/dense view      |

**Scrolling Shortcuts**:

| Shortcut              | Action                        |
|-----------------------|-------------------------------|
| `PageUp` / `PageDown` | Page scroll                   |
| `Alt+K` / `Alt+J`     | Half-page scroll              |
| Mouse Wheel            | Mouse wheel scroll            |
| `Home`                 | Jump to first message         |
| `End`                  | Jump to bottom of screen      |
| `Tab` / `Shift+Tab`   | Navigate to previous messages |

### 8.3 Scrollable Key Handler (class `uH0`, from line ~530124)

The `ScrollKeyboardHandler` handles both keyboard and mouse-wheel scrolling:

```js
// Vertical scrolling key bindings
"ArrowUp"  -> scrollDelta(-scrollStep)
"ArrowDown"-> scrollDelta(+scrollStep)
"k"        -> scrollDelta(-scrollStep)   // Vim up
"j"        -> scrollDelta(+scrollStep)   // Vim down
"PageUp"   -> scrollDelta(-pageStep)
"PageDown" -> scrollDelta(+pageStep)
"Ctrl+u"   -> scrollDelta(-pageStep)     // Vim half-page up
"Ctrl+d"   -> scrollDelta(+pageStep)     // Vim half-page down
"Home"     -> scrollToTop()
"End"      -> scrollToBottom()
"g"        -> scrollToTop()              // Vim top
"G" (shift+g) -> scrollToBottom()        // Vim bottom

// Horizontal scrolling key bindings
"ArrowLeft"  -> scrollDelta(-scrollStep)
"ArrowRight" -> scrollDelta(+scrollStep)
"h"          -> scrollDelta(-scrollStep) // Vim left
"l"          -> scrollDelta(+scrollStep) // Vim right
```

---

## 9. Event Dispatch Pipeline

### 9.1 Overall Flow

```
stdin (raw bytes)
    |
    v
StringDecoder("utf8")          -- byte -> Unicode characters
    |
    v
emitKeys() generator           -- characters -> key objects
    |                             (escape sequence state machine)
    v
stream.emit("keypress", s, key)
    |
    v
TUI Input Adapter              -- "keypress" -> KeyEvent / MouseEvent
    |                             (translates key names, parses SGR mouse)
    v
FocusManager.dispatch(event)   -- routes to focused node
    |
    v
FocusNode.onKey(event)         -- widget-level handler
    |
    v
"handled" / "ignored"          -- event bubbling control
```

### 9.2 Event Routing

1. Key events are dispatched to the **currently focused** `FocusNode`
2. If the handler returns `"handled"`, propagation stops
3. If `"ignored"`, the event bubbles up to parent focus nodes
4. Mouse events are dispatched based on **position** (hit-testing)
5. Scroll events can be consumed by scrollable containers or bubble up

### 9.3 suspend/resume for External Editors

When launching an external editor (e.g., `$AMP_EDITOR`), the TUI suspends:

```js
// line ~530123
J3.instance.tuiInstance.suspend();   // exit raw mode, restore terminal
// ... spawn editor ...
process.stdout.write("\x1b[?25l");   // hide cursor after return
J3.instance.tuiInstance.resume();    // re-enter raw mode
J3.instance.tuiInstance.render();    // repaint
```

---

## 10. Resize Event Handling

### 10.1 SIGWINCH

The terminal `output` stream emits `"resize"` events when the window is resized
(triggered by the SIGWINCH signal). From the readline integration (line 242153):

```js
// line 242215
output.on("resize", this[kOnResize]);

// line 242176
function onResize() {
  this[kRefreshLine]();
}
```

### 10.2 TUI-Level Resize

The Amp TUI framework queries terminal dimensions via `process.stdout.columns`
and `process.stdout.rows` and uses them for layout constraints. The `MediaQuery`
widget (`Q3`) provides size information to the widget tree:

```js
// Usage pattern found throughout
let size = Q3.sizeOf(context);
let width = size.width;
let height = size.height;
```

### 10.3 Terminal Capabilities Detection

The TUI detects terminal capabilities including:
- **Kitty graphics protocol** support (for inline images)
- **Emoji width** measurement support
- **Scroll step** size (default: 3 lines)

```js
// From capability usage patterns
let capabilities = Q3.capabilitiesOf(context);
capabilities.kittyGraphics    // boolean
capabilities.scrollStep()     // number (default 3)
```

---

## 11. Bracketed Paste Mode

### 11.1 Paste Sequence Detection

The `emitKeys()` parser recognizes bracketed paste markers:

| Escape Code | Key Name       | Purpose     | Line   |
|-------------|----------------|-------------|--------|
| `\x1b[200~`| `paste-start`  | Begin paste | 242842 |
| `\x1b[201~`| `paste-end`    | End paste   | 242845 |

### 11.2 Paste Handler on FocusNode

The `FocusNode` (`D9`) has an `onPaste` callback:

```js
// line ~530126
focusNode.onPaste = (text: string) => { ... };
```

The `Focus` widget wires this:
```js
if (this.widget.onPaste)
  this.effectiveFocusNode.onPaste = this.widget.onPaste;
```

---

## 12. TextField Input Handling

### 12.1 Submit Key Configuration

The `TextField` (`_n`) supports configurable submit keys:

```js
// line ~530681
this.submitKey = submitKey ?? {
  character: "Enter",
  modifiers: maxLines === 1 ? {} : { ctrl: true }
};
```

For single-line fields, Enter submits. For multi-line fields, Ctrl+Enter submits.

### 12.2 TextField Key Handler (line ~530681)

The handler checks for:
1. **Submit key** match (character + modifiers)
2. **Backslash-Enter** for literal newline (when `\` precedes Enter at submit)
3. **Shift+Enter** or **Alt+Enter** for newline insertion in multiline
4. Ctrl+meta variant of submit key (macOS Cmd mapped to Ctrl)
5. All standard text editing operations (cursor movement, deletion, selection)

### 12.3 Mouse Interaction in TextField

- Click to position cursor
- Double-click for word selection
- Click-and-drag for character/word selection
- Global mouse release tracking for drag completion
- Auto-copy selection to clipboard (with 500ms delay, 300ms highlight)

---

## Summary of Key Classes

| Minified Name | Reconstructed Name       | Purpose                           |
|---------------|--------------------------|-----------------------------------|
| `D9`          | `FocusNode`              | Focus tree node                   |
| `er`          | `FocusManager`           | Singleton focus tree manager      |
| `t4`          | `Focus`                  | Focus widget wrapper              |
| `KJ`          | `FocusState`             | State for Focus widget            |
| `T3`          | `GestureDetector`        | Mouse event widget                |
| `Pg`          | `EventDispatcher`        | Global event dispatch singleton   |
| `uH0`         | `ScrollKeyboardHandler`  | Keyboard/mouse scroll logic       |
| `_n`          | `TextField`              | Text input widget                 |
| `Ny`          | `TextFieldState`         | State for TextField               |
| `rp`          | `TextEditingController`  | Text buffer + cursor management   |
| `Lg`          | `ScrollController`       | Scroll position management        |
| `ap`          | `SelectionList`          | Keyboard-navigable option list    |
| `R4`          | `SingleChildScrollView`  | Scrollable container              |
| `FF`          | `Viewport`               | Scroll viewport render object     |
| `Q3`          | `MediaQuery`             | Terminal size/capabilities        |
| `J3`          | `TuiBinding`             | Top-level TUI orchestrator        |
