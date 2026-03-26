# Phase 6: Polish and Production Features - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase completes the Amp-faithful TUI experience with production-level features: external editor integration for long prompts, prompt history navigation, @file context mentions with fuzzy search, mouse support for cursor/scroll, error boundaries for graceful degradation, and a persistent configuration file.

</domain>

<decisions>
## Implementation Decisions

### $EDITOR Integration (Ctrl+G)
- Ctrl+G suspends the TUI (raw mode off, alt-screen exit), spawns $EDITOR with a temp file
- On editor exit, reads temp file content back as the prompt text
- Resumes TUI (alt-screen re-enter, raw mode on) with the edited text in input field
- Uses Bun's `Bun.spawn` with `stdio: 'inherit'` for editor subprocess

### Prompt History (Ctrl+R)
- In-memory array of previous prompts (no persistence for v1)
- Ctrl+R cycles backward through history, replacing input text
- Ctrl+Shift+R or down arrow cycles forward
- History navigates only when input area is focused

### @File Mentions
- Typing `@` in the input triggers a file completion popup
- Simple glob-based file list from current directory (not deep fuzzy search for v1)
- Selecting a file inserts the path and attaches file content to the next prompt's context
- Implementation: detect `@` in input, show SelectionList overlay with file list

### Mouse Support
- Mouse wheel scrolls the chat view (maps to ScrollController.scrollBy)
- Mouse click in input area positions cursor (TextField handles this if enabled)
- Enable mouse reporting via flitter-core's terminal manager

### Error Boundaries
- Wrap main app in try/catch during build cycle
- Display error text in chat view when errors occur (red text)
- AppState.error field already exists — just need to render it in ChatView
- Never crash the TUI — always show error and allow user to continue

### Configuration
- `~/.flitter-amp/config.json` for persistent settings
- Settings: default agent command, editor path override, color scheme, history size
- Load on startup, apply defaults, provide Ctrl+O command palette entry for settings

### Claude's Discretion
- Exact temp file location for editor integration
- History buffer size (default 100)
- File list depth for @mention completions (default 2 levels)
- Error message formatting

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SelectionList` widget for @file completion popup
- `AppState.error` / `setError()` / `clearError()` already exist
- `ConversationState.clear()` resets all state
- `CommandPalette` pattern for overlay can be reused for file picker

### Established Patterns
- Stack/Positioned overlay pattern from Phase 5 (permission dialog, command palette)
- FocusScope onKey handler for keyboard shortcuts in app.ts
- StatefulWidget + State pattern for interactive widgets
- ScrollController for programmatic scrolling

### Integration Points
- `InputArea` handles text input — needs history integration
- `App.build()` manages overlays — add @file picker
- `startTUI()` entry point — add config loading
- `index.ts` bootstraps the app — add config file reading

</code_context>

<specifics>
## Specific Ideas

- Editor integration should use `process.env.EDITOR || process.env.VISUAL || 'vi'`
- Config file should be optional — app works with all defaults if missing
- @file picker should reuse the same Stack/Positioned overlay pattern
- Error boundary wraps the ChatView, not the entire app (keep header/input functional)

</specifics>

<deferred>
## Deferred Ideas

- Session persistence (save/restore threads) — deferred to v2 (SESS-01..03)
- Syntax highlighting in diffs — deferred to v2
- Custom themes — deferred to v2

</deferred>
