# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
/home/gem/workspace/
├── packages/                 # Monorepo packages
│   ├── flitter-core/        # Core TUI framework
│   │   ├── src/             # Source code
│   │   ├── test/            # Tests
│   │   ├── dist/            # Build output
│   │   ├── docs/            # Documentation (VitePress)
│   │   ├── examples/        # Example applications
│   │   ├── .planning/       # Planning documents
│   │   └── package.json     # Package config
│   └── flitter-amp/         # ACP client TUI
│       ├── src/             # Source code
│       ├── test/            # Tests
│       └── package.json     # Package config
├── .planning/               # Root planning directory
│   └── codebase/            # Codebase analysis documents
├── pnpm-workspace.yaml      # Monorepo configuration
└── package.json             # Root package config
```

## Directory Purposes

**packages/flitter-core/src/core:**
- Purpose: Foundation types and utilities
- Contains: Types (Offset, Size, Rect), Color, TextStyle, TextSpan, BoxConstraints, Key
- Key files: `types.ts`, `color.ts`, `text-style.ts`, `text-span.ts`, `box-constraints.ts`, `key.ts`

**packages/flitter-core/src/framework:**
- Purpose: Widget lifecycle and element management
- Contains: Widget, Element, RenderObject hierarchies, BuildOwner, PipelineOwner, WidgetsBinding
- Key files: `widget.ts`, `element.ts`, `render-object.ts`, `binding.ts`, `build-owner.ts`

**packages/flitter-core/src/layout:**
- Purpose: Layout calculation system
- Contains: Layout managers (flex, box), layout helpers
- Key files: `flex-layout.ts`, `box-layout.ts`, `layout-helpers.ts`

**packages/flitter-core/src/terminal:**
- Purpose: Terminal rendering and screen buffer management
- Contains: ScreenBuffer, TerminalManager, ANSI output
- Key files: `screen-buffer.ts`, `terminal-manager.ts`

**packages/flitter-core/src/scheduler:**
- Purpose: Frame scheduling and pipeline execution
- Contains: FrameScheduler, timing and animation
- Key files: `frame-scheduler.ts`

**packages/flitter-core/src/input:**
- Purpose: Keyboard and mouse input handling
- Contains: Input parsing, FocusManager, event dispatch
- Key files: `input-bridge.ts`, `focus-manager.ts`, `input-events.ts`

**packages/flitter-core/src/widgets:**
- Purpose: UI components
- Contains: Built-in widgets (Text, Container, Flex, ScrollView, Dialog, etc.)
- Key files: `text.ts`, `container.ts`, `flex.ts`, `scroll-view.ts`, `dialog.ts`, `image-preview.ts`

**packages/flitter-core/src/diagnostics:**
- Purpose: Debugging and performance tools
- Contains: DebugInspector, PerformanceOverlay
- Key files: `debug-inspector.ts`, `perf-overlay.ts`

**packages/flitter-amp/src/acp:**
- Purpose: ACP (Agent Client Protocol) communication
- Contains: Client, connection, session management
- Key files: `client.ts`, `connection.ts`, `session.ts`, `types.ts`

**packages/flitter-amp/src/state:**
- Purpose: Application state management
- Contains: AppState, conversation state, config
- Key files: `app-state.ts`, `conversation.ts`, `config.ts`

**packages/flitter-amp/src/widgets:**
- Purpose: ACP client specific UI components
- Contains: ChatView, DiffCard, HeaderBar, InputArea, PlanView, etc.
- Key files: `chat-view.ts`, `diff-card.ts`, `header-bar.ts`, `input-area.ts`, `plan-view.ts`

## Key File Locations

**Entry Points:**
- `packages/flitter-core/src/index.ts`: Public API re-exports
- `packages/flitter-core/src/framework/binding.ts`: WidgetsBinding.runApp()
- `packages/flitter-amp/src/index.ts`: CLI entry point

**Configuration:**
- `packages/flitter-core/package.json`: Core package config
- `packages/flitter-amp/package.json`: ACP client package config
- `tsconfig.json`: TypeScript configuration

**Core Logic:**
- `packages/flitter-core/src/framework/binding.ts`: Central framework singleton
- `packages/flitter-core/src/terminal/screen-buffer.ts`: Screen buffer and diff algorithm
- `packages/flitter-core/src/scheduler/frame-scheduler.ts`: Frame scheduling

**Testing:**
- `packages/flitter-core/test/`: Core framework tests
- `packages/flitter-amp/test/`: ACP client tests

## Naming Conventions

**Files:**
- `.ts` extension for TypeScript files
- Lowercase with hyphen separators: `box-constraints.ts`, `screen-buffer.ts`
- Plural for directories: `widgets/`, `examples/`, `docs/`

**Directories:**
- Feature-based grouping (core, framework, widgets, etc.)
- Lowercase with hyphen separators

## Where to Add New Code

**New Widget in flitter-core:**
- Primary code: `packages/flitter-core/src/widgets/[widget-name].ts`
- Tests: `packages/flitter-core/test/widgets/[widget-name].test.ts`
- Export from: `packages/flitter-core/src/index.ts`

**New Feature in flitter-amp:**
- Primary code: `packages/flitter-amp/src/[feature]/[file].ts`
- Tests: `packages/flitter-amp/test/[feature]/[file].test.ts`

**New Core Primitive:**
- Location: `packages/flitter-core/src/core/[type].ts`
- Must maintain zero transitive runtime dependencies

## Special Directories

**packages/flitter-core/dist:**
- Purpose: Compiled output (Bun build)
- Generated: Yes
- Committed: Yes (build artifacts)

**packages/flitter-core/.planning:**
- Purpose: Project planning documents (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
- Generated: No
- Committed: Yes

**packages/flitter-core/docs:**
- Purpose: VitePress documentation
- Generated: No (hand-written)
- Committed: Yes

**packages/flitter-core.examples:**
- Purpose: Example applications demonstrating framework usage
- Generated: No (hand-written)
- Committed: Yes

---

*Structure analysis: 2026-03-26*