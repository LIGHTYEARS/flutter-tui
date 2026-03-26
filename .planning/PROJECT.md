# flitter-amp

## What This Is

A TUI ACP (Agent Client Protocol) client that reverse-engineers Amp CLI's visual interface. It spawns external ACP-compatible agents (Claude Code, Gemini CLI, Codex, etc.) as subprocesses, communicates via JSON-RPC over stdio, and renders the agent's streaming responses in a rich terminal UI built on `flitter-core`. It is NOT an LLM provider or agent — it is a client that talks to agents.

## Core Value

The chat TUI must strictly replicate Amp CLI's visual effects and interaction patterns — same layout, same collapsible tool calls, same permission dialogs, same keyboard shortcuts.

## Requirements

### Validated

- ACP client connection — spawns agent subprocess, initializes via ACP protocol, creates sessions (Phase 1)
- Full-screen TUI shell — header bar, scrollable chat area, scrollbar, bordered input field (Phase 2)
- ACP-to-TUI wiring — streaming text, tool call events, plan updates flow from agent to widgets (Phase 3)
- Tool call rendering — collapsible blocks with status icons, inline diff display (Phase 4)
- Thinking block rendering — collapsible streaming thinking/reasoning display (Phase 4)
- Plan view — checklist display from agent plan updates (Phase 4)
- Diff card — bordered unified diff display using flitter-core's DiffView (Phase 4)

### Active

- [ ] Permission dialog — SelectionList-based overlay for agent permission requests
- [ ] Command palette — Ctrl+O opens searchable command list
- [ ] $EDITOR integration — Ctrl+G opens prompt in external editor
- [ ] Prompt history — Ctrl+R navigates previous prompts
- [ ] @file mentions — fuzzy file search for context attachment
- [ ] Mouse support — click to position cursor, wheel to scroll
- [ ] Configuration file — ~/.flitter-amp/config.json for persistent settings
- [ ] Error boundaries — graceful error display in TUI
- [ ] Session persistence — save/restore conversation threads

### Out of Scope

- LLM API calls — the ACP agent handles all LLM communication
- Agent implementation — we only implement the client side
- Mobile/web UI — terminal only
- Plugin system — direct implementation, no extensibility layer for v1
- Image rendering — terminal text only (no Kitty graphics protocol for v1)

## Context

This is a brownfield project within the `flitter` pnpm monorepo. `flitter-core` provides a Flutter-faithful TUI framework with three-tree architecture (Widget/Element/RenderObject), box-constraint layout, 60fps cell-level diff rendering, and a rich widget library (Text, Container, Flex, ScrollView, Dialog, TextField, SelectionList, DiffView, Scrollbar, etc.).

The ACP SDK (`@agentclientprotocol/sdk` v0.16.0) provides `ClientSideConnection`, JSON-RPC streaming, and typed interfaces for the protocol. The client implements `acp.Client` to handle agent callbacks (sessionUpdate, requestPermission, readTextFile, writeTextFile, createTerminal).

Phases 1-4 are already implemented with 17 source files covering: ACP connection, TUI shell, streaming wiring, and tool call/diff/thinking rendering.

## Constraints

- **Runtime**: Bun-first (uses Bun-specific APIs via platform.ts adapter)
- **UI Framework**: Must use flitter-core widgets — no direct terminal escape sequences
- **Protocol**: ACP SDK v0.16.x — must track upstream protocol changes
- **Visual Fidelity**: Must match Amp CLI's layout and interaction patterns
- **No Direct LLM**: Zero LLM dependencies — all intelligence comes from the spawned agent

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use `@agentclientprotocol/sdk` | Standard protocol, multi-agent support | — Pending |
| Build on flitter-core widgets | Consistent with monorepo, Flutter-faithful architecture | Good |
| Spawn agent as subprocess | Clean separation, agent manages its own state | Good |
| Ctrl+Enter to submit (multi-line default) | Matches Amp CLI behavior | Good |
| InheritedWidget for AppState | Flutter-faithful state propagation | Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? Move to Out of Scope with reason
2. Requirements validated? Move to Validated with phase reference
3. New requirements emerged? Add to Active
4. Decisions to log? Add to Key Decisions
5. "What This Is" still accurate? Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after initialization*
