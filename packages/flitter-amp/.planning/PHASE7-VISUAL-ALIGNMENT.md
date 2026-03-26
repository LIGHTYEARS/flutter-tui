# Phase 7 — Visual Alignment with Amp CLI

## Goal

Bring flitter-amp's visual presentation in line with the real Amp CLI. This phase touches **no ACP protocol logic** — it's purely UI/layout/color work across 6 existing widget files and 1 new widget.

## Current vs Target Comparison

| Area | flitter-amp (current) | Amp (target) |
|------|----------------------|--------------|
| Welcome screen | Gray `"Type a message below to start."` | Green ASCII art logo + "Welcome to Amp" + `Ctrl+O for help` + quote |
| Input box | Centered, narrow, rounded border, placeholder text | Full-width, flush to bottom, left cursor, no placeholder |
| Bottom status bar | None | `? for shortcuts` (left) + cwd + git branch (right) |
| Mode label | None | Right-bottom corner of input box: `smart` / `A` / `6-skills` |
| Color scheme | Almost entirely gray/dim | Cyan, green, yellow — multi-color accents |
| Top header | `"ACP Agent"` banner at top | No top header — info lives in bottom status bar |
| Message labels | Gray "You" / magenta "Assistant" | Bright "You" (bold) / cyan-green "Agent" with accent colors |

## Implementation Plan — 7 Tasks

### Task 7.1 — Remove HeaderBar, Add StatusBar (bottom)

**Files:** `src/app.ts` (modify), `src/widgets/status-bar.ts` (new), `src/widgets/header-bar.ts` (delete)

**What changes:**
- Remove `HeaderBar` from the Column layout at the top
- Create `StatusBar` widget rendered **below** the InputArea
- StatusBar layout: `Row.spaceBetween`:
  - Left: `? for shortcuts` (dim text)
  - Right: `{cwd short path}` + `{git branch}` (if available)
- Pass `cwd` from `AppConfig` through `AppState` (add `cwd: string` field)
- Git branch: detect at startup via `git rev-parse --abbrev-ref HEAD` in cwd, store in AppState
- Token/cost info can remain accessible via command palette or omitted for now (Amp shows it inline during streaming)

**Widget structure:**
```
Row.spaceBetween([
  Text("? for shortcuts", { dim: true }),
  Row([
    Text(shortCwd, { foreground: Color.brightBlack }),
    Text(" "),
    Text(gitBranch, { foreground: Color.cyan }),
  ]),
])
```

### Task 7.2 — Full-Width Input Box

**File:** `src/widgets/input-area.ts`

**What changes:**
- Remove `ContainerWithOverlays` with its rounded border
- Replace with a bare `TextField` that stretches full width
- Remove placeholder text entirely — Amp shows no placeholder, just a cursor at position 0
- Remove the `⏳ working` border overlay. Processing indicator moves to status bar or inline
- The input area should have minimal padding: `EdgeInsets.only({ left: 1 })` for the cursor offset
- A single top border line (using `Divider` or `Border.only({ top: ... })`) separates input from chat, colored `brightBlack`

**Visual target:**
```
─────────────────────────────────  (thin separator)
│  (cursor here, full width, no border box)
```

### Task 7.3 — Mode Label on Input Area

**File:** `src/widgets/input-area.ts`

**What changes:**
- Overlay a mode label at the bottom-right of the input area (or the separator line)
- Mode text comes from `AppState.currentMode` (already tracked)
- Display: `smart` in dim text, or agent-provided mode string
- When processing: show `⏳` indicator next to mode
- Use `Stack` + `Positioned({ bottom: 0, right: 1 })` to position the label

**Visual target:**
```
────────────────────────────── smart
│  user input here...
```

### Task 7.4 — Welcome Screen (Empty State)

**File:** `src/widgets/chat-view.ts`

**What changes:**
- Replace the current gray `"Type a message below to start."` with Amp's welcome screen
- Amp's welcome layout (centered vertically in the chat area):
  1. ASCII art logo (green, `Color.green`)
  2. "Welcome to Amp" (green, bold)
  3. Blank line
  4. "Ctrl+O for help" (dim)
  5. Blank line
  6. Random inspirational quote (dim, italic)

- ASCII art for "Amp" (simplified version — can be adjusted later):
```
    _    __  __ ____
   / \  |  \/  |  _ \
  / _ \ | |\/| | |_) |
 / ___ \| |  | |  __/
/_/   \_\_|  |_|_|
```

- The entire block should be wrapped in `Center` or use vertical `Spacer`s to push it to the middle

### Task 7.5 — Color Scheme Overhaul

**Files:** All widget files in `src/widgets/`

**Specific color changes:**

| Element | Current | Target |
|---------|---------|--------|
| User label "You" | `brightWhite, bold` | Keep (good) |
| User message text | `brightWhite` | Keep (good) |
| Assistant label | `magenta, bold` | `Color.cyan, bold` |
| Streaming indicator ● | magenta (inherits from label) | `Color.green` (separate span) |
| Tool call chevron | (current color) | `Color.brightBlack` |
| Tool call title | (current color) | `Color.brightWhite` |
| Tool completed ✓ | `Color.green` | Keep |
| Tool failed ✗ | `Color.red` | Keep |
| Tool pending/running | `Color.yellow` | Keep |
| Plan label | `Color.blue, bold` | `Color.cyan, bold` |
| Error banner | `Color.red, bold` | Keep |
| Scroll thumb | `Color.white` | `Color.brightBlack` |
| Scroll track | `Color.black` | `Color.defaultColor` (transparent) |
| Input border | `brightBlack` / `yellow` | Remove border (Task 7.2) |
| Processing indicator | Yellow `⏳ working` in border | Dim `⏳` in status bar |

### Task 7.6 — Refine Chat Message Layout

**File:** `src/widgets/chat-view.ts`

**What changes:**
- Assistant label: change from `"Assistant"` to the agent name (from AppState) or `"Agent"`
- Tighten padding between messages (Amp uses compact spacing)
- User messages: reduce left padding from 2 to 1
- Remove double-space prefix (`"  "`) from text content — this was a workaround for the old layout
- Markdown content should have left padding of 2 (indent under label)

### Task 7.7 — App Layout Restructure

**File:** `src/app.ts`

**What changes:**
- Remove `HeaderBar` import and usage
- Add `StatusBar` below `InputArea` in the Column:
  ```
  Column (mainAxisSize: max)
    ├── Expanded
    │   └── Row (chat + scrollbar)
    ├── InputArea (full-width, top separator)
    └── StatusBar (? for shortcuts + cwd + branch)
  ```
- Pass new props to InputArea: `mode` string for the mode label
- Pass new props to StatusBar: `cwd`, `gitBranch`, `isProcessing`
- Pass `agentName` to ChatView for the assistant message label
- Add `gitBranch` to AppState (set at startup from `git rev-parse`)
- Add `cwd` to AppState (set from config at startup)

## Execution Order

The tasks should be done in this order to minimize breakage:

1. **7.1** — StatusBar + remove HeaderBar (structural change)
2. **7.7** — App layout restructure (connects StatusBar)
3. **7.2** — Full-width input box
4. **7.3** — Mode label on input
5. **7.4** — Welcome screen
6. **7.5** — Color scheme overhaul
7. **7.6** — Chat message layout refinements

Tasks 7.4, 7.5, and 7.6 are independent of each other and could be done in parallel.

## Files Modified Summary

| File | Change Type |
|------|-------------|
| `src/widgets/status-bar.ts` | **New** |
| `src/widgets/header-bar.ts` | **Delete** |
| `src/widgets/input-area.ts` | Major rewrite |
| `src/widgets/chat-view.ts` | Moderate changes |
| `src/app.ts` | Major restructure |
| `src/state/app-state.ts` | Add `cwd`, `gitBranch` fields |
| `src/index.ts` | Pass cwd/branch to AppState |
| `src/widgets/tool-call-block.ts` | Minor color tweaks |
| `src/widgets/thinking-block.ts` | Minor color tweaks |
| `src/widgets/plan-view.ts` | Minor color tweak (blue → cyan) |

## Non-Goals (out of scope for Phase 7)

- Keyboard shortcut help overlay (Amp shows `?` → full keybinding list). Can be a Phase 8 task.
- Multiple input modes (Plan/Act/Smart). Mode *display* is in scope; mode *switching* is not.
- Token cost display during streaming (currently shown in HeaderBar, moving it to streaming inline is complex).
