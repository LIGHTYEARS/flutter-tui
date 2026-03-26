# Amp CLI TUI — Reverse Engineering Report

**Source:** Amp CLI v0.0.1774500280-gae8248 (linux-x64, Bun standalone binary)
**Extracted:** 8.7MB JS bundle from `/home/gem/home/tmp/amp-js-strings.txt`
**Date:** 2026-03-26

---

## Table of Contents

1. [Widget System & Class Mapping](#1-widget-system--class-mapping)
2. [Theme System](#2-theme-system)
3. [Welcome/Splash Screen](#3-welcomesplash-screen)
4. [Chat Messages — User & Assistant](#4-chat-messages--user--assistant)
5. [Tool Call Display](#5-tool-call-display)
6. [Thinking Blocks](#6-thinking-blocks)
7. [Input Area / Prompt Bar](#7-input-area--prompt-bar)
8. [Status Bar / Footer](#8-status-bar--footer)
9. [Scrollbar & Layout](#9-scrollbar--layout)
10. [Keyboard Navigation](#10-keyboard-navigation)
11. [Animations & Spinners](#11-animations--spinners)
12. [Easter Eggs](#12-easter-eggs)
13. [Comparison: flitter-amp vs Real Amp](#13-comparison-flitter-amp-vs-real-amp)

---

## 1. Widget System & Class Mapping

Amp uses a custom Flutter-like TUI framework (same architecture as flitter-core). Key class mappings:

| Amp Symbol | Role |
|------------|------|
| `q$` | StatefulWidget |
| `R$` | State |
| `$A` | StatelessWidget |
| `s$` / `Column` | Column |
| `Y$` / `Row` | Row |
| `m$` / `mH` | Container (with decoration, padding, constraints) |
| `hL` | Expanded |
| `a$` | Padding |
| `H$` | EdgeInsets |
| `GI` | SingleChildScrollView |
| `Uu` | Scrollbar |
| `dH` | Text |
| `z` | TextSpan |
| `BH` | TextStyle |
| `gH` | Color |
| `ht` | Markdown |
| `YH` | SizedBox |
| `ZL` | Border |
| `yL` | BorderSide |
| `AI` | BoxDecoration |
| `GL` | MouseRegion |
| `xI` | FocusScope |
| `wL` | Center |
| `uI` | FocusNode |
| `i9` | LeafRenderObjectWidget |
| `Qt` | ThemeContainer (holds base + app themes) |
| `YB` | BaseTheme (holds colorScheme) |
| `wd` | ColorScheme |
| `x1` | AppTheme (50+ app-specific color fields) |
| `_$` | AppTheme accessor (`_$.of(context)`) |
| `YL` | BaseTheme accessor (`YL.of(context)`) |

---

## 2. Theme System

### 2.1 ColorScheme (`wd` class)

```
class wd {
  foreground, mutedForeground, background, cursor,
  primary, secondary, accent, border,
  success, warning, info, destructive,
  selection, copyHighlight, tableBorder
}
```

**Default (ANSI fallback):**

| Field | Value |
|-------|-------|
| `foreground` | `gH.default()` (terminal default) |
| `mutedForeground` | `gH.default()` |
| `background` | `gH.none()` (transparent) |
| `cursor` | `gH.default()` |
| `primary` | `gH.blue` |
| `secondary` | `gH.cyan` |
| `accent` | `gH.magenta` |
| `border` | `gH.default()` |
| `success` | `gH.green` |
| `warning` | `gH.yellow` |
| `info` | `gH.index(12)` (bright blue) |
| `destructive` | `gH.red` |
| `selection` | `gH.index(8)` (bright black / dark gray) |
| `copyHighlight` | `gH.yellow` |
| `tableBorder` | `gH.default()` |

**"Terminal" theme RGB override (`DSH`):**

| Field | RGB Value |
|-------|-----------|
| `background` | `rgb(11, 13, 11)` |
| `foreground` | `rgb(246, 255, 245)` |
| `mutedForeground` | `rgb(156, 156, 156)` |
| `border` | `rgb(135, 139, 134)` |
| `selection` | `rgb(135, 139, 134, 0.35)` |
| `primary` | `rgb(27, 135, 243)` (blue) |
| `secondary` | `rgb(24, 144, 154)` (teal) |
| `accent` | `rgb(234, 123, 188)` (pink) |
| `success` | `rgb(43, 161, 43)` (green) |
| `warning` | `rgb(255, 183, 27)` (amber) |
| `info` | `rgb(66, 161, 25...)` |
| `destructive` | `rgb(189, 43, 43)` (red) |

### 2.2 AppTheme (`x1` class)

**`x1.default("dark")` — all 50+ fields:**

| Field | Value | Notes |
|-------|-------|-------|
| `toolRunning` | `gH.blue` | |
| `toolSuccess` | `gH.green` | |
| `toolError` | `gH.red` | |
| `toolCancelled` | `gH.yellow` | |
| `toolName` | `gH.default()` | Bold foreground |
| `userMessage` | `gH.cyan` | Unused for color — uses `success` instead |
| `assistantMessage` | `gH.default()` | |
| `systemMessage` | `gH.index(8)` | Dim/muted |
| `codeBlock` | `gH.default()` | |
| `inlineCode` | `gH.yellow` | |
| `syntaxHighlight.keyword` | `gH.blue` | |
| `syntaxHighlight.string` | `gH.green` | |
| `syntaxHighlight.number` | `gH.yellow` | |
| `syntaxHighlight.comment` | `gH.index(8)` | |
| `syntaxHighlight.function` | `gH.cyan` | |
| `syntaxHighlight.variable` | `gH.default()` | |
| `syntaxHighlight.type` | `gH.magenta` | |
| `syntaxHighlight.operator` | `gH.default()` | |
| `fileReference` | `gH.cyan` | |
| `processing` | `gH.blue` | |
| `waiting` | `gH.yellow` | |
| `completed` | `gH.green` | |
| `cancelled` | `gH.index(8)` | |
| `recommendation` | `gH.blue` | |
| `suggestion` | `gH.magenta` | |
| `command` | `gH.yellow` | |
| `filename` | `gH.cyan` | |
| `keybind` | `gH.blue` | |
| `button` | `gH.cyan` | |
| `link` | `gH.blue` | |
| `shellMode` | `gH.blue` | |
| `shellModeHidden` | `gH.index(8)` | |
| `handoffMode` | `gH.magenta` | |
| `handoffModeDim` | `gH.rgb(128,0,128)` | |
| `queueMode` | `gH.rgb(160,160,160)` | |
| `diffAdded` | `gH.green` | |
| `diffRemoved` | `gH.red` | |
| `diffChanged` | `gH.yellow` | |
| `diffContext` | `gH.index(8)` | |
| `ideConnected` | `gH.green` | |
| `ideDisconnected` | `gH.red` | |
| `ideWarning` | `gH.yellow` | |
| `scrollbarThumb` | `gH.default()` | = foreground |
| `scrollbarTrack` | `gH.index(8)` | = bright black |
| `tableBorder` | `gH.index(8)` | |
| `selectionBackground` | `gH.yellow` | |
| `selectionForeground` | `gH.black` | |
| `selectedMessage` | `gH.green` | |
| `smartModeColor` | `gH.rgb(0,255,136)` | Bright green |
| `rushModeColor` | `gH.rgb(255,215,0)` | Gold |
| `threadGraphNode` | `gH.blue` | |
| `threadGraphNodeSelected` | `gH.yellow` | |
| `threadGraphConnector` | `gH.default()` | |

### 2.3 RGB-Themed Mapping (`PC` function)

When using RGB themes (e.g., DSH), colors are mapped through `PC()`:

| AppTheme field | Maps to |
|----------------|---------|
| `toolRunning` | `colors.primary` (blue) |
| `toolSuccess` | `colors.success` (green) |
| `toolError` | `colors.destructive` (red) |
| `toolName` | `colors.foreground` |
| `userMessage` | `colors.secondary` (teal) |
| `assistantMessage` | `colors.foreground` |
| `selectedMessage` | `colors.success` (green) |
| `keybind` | `colors.primary` (blue) |
| `command` | `colors.warning` (amber) |
| `filename` | `colors.secondary` (teal) |
| `scrollbarThumb` | `colors.foreground` |
| `scrollbarTrack` | `colors.mutedForeground` |

### 2.4 Agent Mode Colors (`Ym` / `ZKH`)

| Mode | Primary RGB | Secondary RGB |
|------|-------------|---------------|
| smart (default) | `{r:0, g:55, b:0}` | `{r:0, g:255, b:136}` |
| rush | gold variant | gold variant |
| internal | `{r:140, g:38, b:0}` | `{r:255, g:225, b:102}` |

---

## 3. Welcome/Splash Screen

### Widget: `mJH` (StatefulWidget) + `bJH` (State)

**Layout:** Horizontal Row — `[Orb, 2-spacer, Text Column]`

### 3.1 Animated Orb (`$XH`)

- Size: 40x40 characters (`Lb=40, Ab=40`)
- Uses Perlin noise (`kd` class, `makeNoise2D`) for glow patterns
- Mode-specific colors: green (smart), gold (rush), amber (internal)
- Renders as custom LeafRenderObjectWidget with per-cell color blending
- Supports shockwave effects on click:
  - `Rd=1` — shockwave duration (seconds)
  - `HXH=30` — propagation speed
  - `$l=3` — effect radius
- **Explodes after 5 clicks** (`Hq=5`) — replaced with empty SizedBox

### 3.2 Glow Text (`_Q`)

- "Welcome to Amp" rendered with Perlin noise glow animation
- Each character blended between base color and glow colors
- `glowIntensity: 0.4` default
- Falls back to plain `dH` (Text) when animation support is "disabled"

### 3.3 Quotes/Suggestions (`gSH` array)

30+ entries with types:
- `"command"` — CLI examples: `amp -x "What package manager do we use here?"`
- `"hint"` — UI tips: `"Use Ctrl+O to open the command palette"`
- `"prompt"` — Prompt examples: `"Do not write any code yet. Plan first."`
- `"quote"` — Inspirational quotes (can be disabled with `NO_SPLASH_QUOTE=1`)

**Type-dependent styling:**
- `quote` / `news` → foreground, dim
- `hint` → secondary color; backtick-wrapped text in `command` (yellow) color
- `prompt` / `note` → primary color
- other → warning color

### 3.4 "Ctrl+O for help" Line

Rendered as two spans:
- `"Ctrl+O"` in `app.keybind` color (blue)
- `" for help"` in `app.command` color (yellow)

### 3.5 Mystery Sequence

`mSH = ["ctrl+x", "y", "z"]` — Secret key combination to unlock a "mysterious message" easter egg. Progress shown as matched keys in bold primary color.

### 3.6 Text Morph Animation

Duration: `bSH = 1.5` seconds. Uses `hFL()` function for character-by-character morphing between strings.

---

## 4. Chat Messages — User & Assistant

### **CRITICAL FINDING: NO "You" or "Agent" text labels!**

Amp does NOT display labels like "You" or "Agent" above messages. Messages are differentiated entirely by **border styling and text color/style**.

### 4.1 User Messages (`Sa` widget)

```
┃ User's message text here (italic, green)
┃ More text...
```

- **Border:** Left side only, 2px thick, solid, `colors.success` (green)
- **Text style:** italic, `colors.success` (green)
- **Padding:** 1 char left (after border)
- **Interrupted messages:** `colors.warning` (amber) instead of green
- **No header/label**

### 4.2 Selected User Messages (`RQ` widget)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ User's message text here     ┃  e to edit
┃ More text...                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

- **Border:** ALL 4 sides, 2px, solid, `colors.success` (green)
- **"e to edit" hint:** `e` in `app.keybind` (blue), `" to edit"` dim

### 4.3 Assistant Messages

```
Markdown content renders here with no border, no label.
Just the text, rendered as Markdown.
```

- **Border:** None
- **Text style:** Normal foreground, standard Markdown rendering
- **No header/label** — just markdown content directly
- **Easter egg:** Text starting with "You're absolutely right" gets rainbow color animation

### 4.4 Message Spacing

- **Between messages:** 1 line gap (`SizedBox({height: 1})`)
- **Outer padding:** 2 chars left, 2-3 chars right (3 when scrollbar visible), 1 line bottom

---

## 5. Tool Call Display

### 5.1 Tool Header (`xD` widget + `wQ` function)

Format: `[status_icon] [ToolName] [detail_text]`

```
⠿ ReadFile src/app.ts
✓ EditFile src/widgets/input-area.ts
✗ Bash npm run build
```

- **Status icon:**
  - In-progress: Braille spinner (animated cellular automaton, `Af` class)
  - Done: `✓` (U+2713)
  - Error/cancelled: `✗` (U+2715)
  - Queued: `⋯` (U+22EF)
- **Tool name:** Bold, foreground color (`app.toolName` = `colors.foreground`)
- **Detail text:** Dim foreground — shows path/query/command depending on tool type

### 5.2 Status Colors (`j0` function)

| Status | Color |
|--------|-------|
| done | `app.toolSuccess` (green) |
| error | `app.toolError` (red) |
| cancelled / rejected-by-user | `app.toolCancelled` (yellow) |
| in-progress | `app.toolRunning` (blue) |
| queued | `app.waiting` (yellow) |

### 5.3 Expand/Collapse (`lT` widget)

- **Collapsed:** `▶` (U+25B6, right-pointing triangle, muted foreground)
- **Expanded:** `▼` (U+25BC, down-pointing triangle, muted foreground)
- Click toggles state

### 5.4 Diff View (`TC` class)

- Added lines: `+` prefix, success color (green)
- Removed lines: `-` prefix, destructive color (red)
- Context lines: dim foreground
- Chunk headers: `  ...` in dim
- Line numbers: left-aligned, dim foreground

### 5.5 Dense View (`LL$`)

Multiple tool calls collapsed into summary action rows with:
- Active: braille spinner in `toolRunning` (blue)
- Cancelled: `✗` in `toolCancelled` (yellow)
- Completed: `✓` in `toolSuccess` (green)

### 5.6 Tool-Specific Widgets

| Tool Name | Widget Class | Special Behavior |
|-----------|-------------|-----------------|
| Bash | `jL$` | Shell command progress display |
| shell_command | `GL$` | Similar to Bash |
| Task (Subagent) | `Q0H` | Shows subagent prompt/result |
| apply_patch | `ykL` | Shows file count, additions/deletions |
| WebFetch | n/a | Shows URL as hyperlink in accent color |
| Mermaid | n/a | Shows "View on mermaid.live" link |

---

## 6. Thinking Blocks (`zk` widget)

| State | Icon | Color | Label |
|-------|------|-------|-------|
| Streaming | Braille spinner | `accent` (pink/magenta) | "Thinking" (dim) |
| Done | `✓` | `success` (green) | "Thinking" (dim) |
| Cancelled | (none) | `warning` (amber) | "Thinking (interrupted)" (italic) |

- **Content:** Dim, italic text when expanded
- **Collapsible:** Same triangle expand/collapse as tool calls
- **Header extracted:** If thinking content contains structured header, uses it instead of "Thinking"

---

## 7. Input Area / Prompt Bar

### Widget: `F0H` (StatefulWidget)

### 7.1 Border Behavior

```js
borderColor: isTextfieldAndAutocompleteFocused ? A.border : void 0
borderStyle: "rounded"
```

- **Focused:** Rounded border in `colors.border` color
- **Unfocused:** No border (`void 0`)
- This is different from flitter-amp which uses a Divider (horizontal line)

### 7.2 Autocomplete (`rA$` class)

The text input supports autocomplete with `@` trigger:
- `@` → file completion popup
- `@@` → double-at trigger for special commands
- `@:` → commit mode
- Image paste detection (`E4L()`)
- Open in `$EDITOR` via Ctrl+G

### 7.3 Footer Text (`getFooterText()`)

Contextual status messages computed by `dy()` function:

| Condition | Message |
|-----------|---------|
| Executing command | `"Executing /${command}..."` |
| Running bash | `"Running shell command..."` |
| Compacting | `"Auto-compacting..."` |
| Submitting | `"Submitting message..."` |
| Waiting for approval | `"Waiting for approval..."` |
| Handing off | `"Handing off to new thread..."` |
| Running N tools | `"Running N tools..."` |
| Stream retry | `"Stream interrupted, retrying..."` |
| Streaming | `"Streaming response..."` |
| Waiting for response | `"Waiting for response..."` |
| Cancelled | `"Cancelled"` (italic) |
| Context warning | `"High context usage. Use thread:handoff or thread:new..."` |
| Idle | (none) |

---

## 8. Status Bar / Footer

### 8.1 Layout

The footer is a composite of multiple widgets:

**Bottom-right overlay:** `cwd + gitBranch`
```js
buildDisplayText(shortCwd, currentGitBranch, availableWidth, colors)
// Displays: shortened path + " " + branch name
// Style: foreground, dim: true
```

**Bottom-left / inline:** Status row containing:
1. Status widget (`iJH` / `g0H`) — animated spinner + contextual message
2. Flexible spacer
3. Token usage info: `"X% of Yk"` (colored by threshold)
4. Cost info: `"$0.XX (free)"` or `"$0.XX (free) + $0.YY"`
5. Elapsed time (deep mode only): formatted duration

### 8.2 Status Widget (`iJH` class)

Animated spinner using wave characters: `[" ", "∼", "≈", "≋", "≈", "∼"]` at 200ms interval

**Spinner color logic:**
- Submitting prompt → `colors.primary` (blue)
- Active inference running → `colors.primary` (blue)
- Default → `colors.mutedForeground` (gray)

**Status text styling varies by type:**
- `"executing"`: Dim foreground + command in `app.command` (yellow)
- `"context-warning"`: Threshold color (blue/yellow/red) + commands in `app.command`
- `"simple"`: Foreground, optional italic

### 8.3 Token Usage Display

Shown in the bottom-left inline area:
```
X% of Yk · $0.XX · 1m 23s
```
- Percentage colored by threshold: `recommendation` → blue, `warning` → yellow, `danger` → red
- Cost from `UBH()` function: formats USD amounts with `sa()` formatter
- Timer: only shown in "deep" agent mode

---

## 9. Scrollbar & Layout

### Scrollbar (`Uu`)

```js
new Uu({
    controller: this._controller,
    thickness: 1,
    thumbColor: app.scrollbarThumb,  // = foreground (default fg color)
    trackColor: app.scrollbarTrack,  // = index(8) / mutedForeground
})
```

### Overall Chat Layout

```
Column (mainAxisSize: max)
  ├── Expanded
  │   └── [padding: left=2, right=2-3, bottom=1]
  │       └── ScrollView (position: "bottom")
  │           └── Column (items with 1-line spacers)
  │       + Scrollbar (1 char wide, right: 1)
  ├── PromptBar (F0H — rounded border when focused)
  └── Footer Row (status + spacer + token info + cost + time)
      └── Overlays: cwd + branch (bottom-right, dim)
```

---

## 10. Keyboard Navigation

### Message Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate up to previous user message |
| `Shift+Tab` | Navigate down to next user message |
| `ArrowUp` | Navigate up (non-macOS) |
| `ArrowDown` | Navigate down (non-macOS) |
| `j` | Scroll down (when message selected) |
| `k` | Scroll up (when message selected) |
| `e` | Edit selected message |
| `r` | Restore/delete from selected message |
| `Escape` | Cancel selection/editing |

### Global Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+O` | Command palette |
| `Ctrl+C` | Cancel current operation |
| `Ctrl+L` | Clear conversation |
| `Ctrl+G` | Open prompt in $EDITOR |
| `Ctrl+R` | Prompt history (backward) |
| `Alt+T` | Toggle tool call expansion |

---

## 11. Animations & Spinners

### 11.1 Braille Spinner (`Af` class)

A **cellular automaton** — NOT a simple rotating frame set.

- 8-cell state mapped to Unicode Braille character (U+2800 range)
- Rules: Conway-like (survive with 2-3 neighbors, born with 3 or 6)
- Stepped every 200ms in tool headers, thinking blocks, etc.
- Produces organic-looking animated patterns

### 11.2 Wave Spinner (Status Bar)

Characters: `[" ", "∼", "≈", "≋", "≈", "∼"]` cycling at 200ms

### 11.3 Scanning Bar (`q$$`)

Horizontal animated line using `━` (U+2501) with trailing opacity gradient: `[1, 0.7, 0.5, 0.35, 0.25, 0.15]`

### 11.4 Orb Glow (Splash Screen)

Perlin noise-based per-character glow with time-varying parameters

---

## 12. Easter Eggs

1. **Rainbow "You're absolutely right"** (`EA$` widget): When assistant text starts with "You're absolutely right", text cycles through rainbow colors: foreground → warning → success → secondary → primary → accent

2. **Orb Explosion**: 5 clicks on the splash orb triggers explosion animation + `onOrbExplode` callback

3. **Mystery Sequence**: Pressing `Ctrl+X, Y, Z` (in order) on the splash screen triggers a hidden "mysterious message" modal

---

## 13. Comparison: flitter-amp vs Real Amp

### Critical Discrepancies

| Area | flitter-amp (current Phase 7) | Real Amp | Priority |
|------|------|----------|----------|
| **Message labels** | Shows "You" (bold white) and agent name (cyan bold) | **NO labels at all** — differentiated by border/style only | **HIGH** |
| **User message border** | No border, just padded text | Left-only border, 2px, success/green, italic green text | **HIGH** |
| **Assistant message style** | Cyan agent label + markdown below | No label, no border, just markdown directly | **HIGH** |
| **Input area** | Divider (horizontal line) + TextField | Rounded border that shows/hides based on focus state | **MEDIUM** |
| **Scrollbar thumb** | `Color.brightBlack` | `foreground` (terminal default white) | **MEDIUM** |
| **Scrollbar track** | `Color.defaultColor` (transparent) | `index(8)` / `mutedForeground` | **MEDIUM** |
| **Status bar footer** | Simple "? for shortcuts" + cwd + branch | Complex composite: spinner + status message + token% + cost + time | **MEDIUM** |
| **Tool call status icon** | Static emoji: `✓ ✗ ⏳ ◌` | Braille cellular automaton spinner for in-progress, static `✓`/`✗` for done/error | **MEDIUM** |
| **Tool call layout** | `chevron + kind + title + statusIcon` | `statusIcon + ToolName(bold) + detail(dim)` — no chevron in header line | **MEDIUM** |
| **Welcome screen** | ASCII art + 5 hardcoded quotes | Animated orb (40x40) + glow text + 30+ typed suggestions | **LOW** |
| **Thinking blocks** | Uses accent color while streaming | Same pattern but with braille spinner | **LOW** |

### What flitter-amp Gets Right

| Area | Status |
|------|--------|
| Overall layout: Column > Expanded(chat) > Input > StatusBar | Correct structure |
| Welcome screen has quotes and "Ctrl+O for help" | Matches intent |
| Status bar position (bottom) with cwd + branch | Correct |
| Command palette on Ctrl+O | Correct |
| Agent name display | Correct (Amp uses agent name too) |
| Mode label on separator | Partially correct (Amp uses rounded border) |
| Color assignments (green=success, yellow=warning, etc.) | Mostly correct |

### Recommended Phase 8 Changes (sorted by impact)

1. **Remove message labels** — Remove "You" and agent name labels. Instead:
   - User messages: left-border only (2px, green), italic green text
   - Assistant messages: no border, no label, plain markdown

2. **Input area border** — Replace Divider with BoxDecoration + Border.all + rounded style, toggle visibility on focus

3. **Scrollbar colors** — thumb: `foreground` (not brightBlack), track: `index(8)` (not transparent)

4. **Tool call header format** — Change to: `[statusIcon] [ToolName bold] [detail dim]` (remove chevron from header, move expand/collapse to separate control)

5. **Status bar enhancement** — Add animated spinner, contextual status messages, token usage percentage

6. **Braille spinner** — Replace static emoji spinners with `Af`-style cellular automaton braille animation

7. **User message selection** — Add Tab/Shift-Tab navigation with full-border selection highlight and "e to edit" hint

---

## Appendix: Raw Minified Identifiers Reference

For future reverse engineering sessions, key identifiers to search:

| Search Pattern | What It Is |
|----------------|-----------|
| `gSH=` | Splash quotes array |
| `mSH=` | Mystery key sequence |
| `x1.default` | AppTheme default colors |
| `wd.default` | ColorScheme default |
| `DSH=` | Terminal theme RGB colors |
| `AZH=` | Terminal theme definition |
| `class Sa ` | User message widget |
| `class RQ ` | Selected user message |
| `class $uH` | Thread/conversation view |
| `class xD ` | Tool call header |
| `class lT ` | Expand/collapse toggle |
| `class zk ` | Thinking block |
| `class Af` | Braille spinner |
| `class F0H` | Prompt bar widget |
| `class iJH` | Status bar state |
| `dy(` | Footer status computation |
| `wQ(` | Tool header builder |
| `j0(` | Tool status color |
| `rR(` | Tool status icon |
| `PC(` | RGB theme color mapping |
| `ZKH(` | Agent mode colors |
| `dFL(` | Orb mode colors |
| `UBH(` | Cost info formatting |
