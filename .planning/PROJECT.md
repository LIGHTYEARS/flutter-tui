# flitter-amp

## What This Is

A TUI ACP (Agent Client Protocol) client that reverse-engineers Amp CLI's visual interface. It spawns external ACP-compatible agents (Claude Code, Gemini CLI, Codex, etc.) as subprocesses, communicates via JSON-RPC over stdio, and renders the agent's streaming responses in a rich terminal UI built on `flitter-core`. It is NOT an LLM provider or agent — it is a client that talks to agents.

## Core Value

A truly functional ACP TUI client that correctly communicates with any ACP agent, renders all protocol messages faithfully, and provides a usable chat experience — not just a visual clone of Amp's layout.

## Milestones

### v0.1.0 — Visual Prototype (COMPLETED 2026-03-27)
Built the UI shell: widget tree matching Amp's layout, 7 themes, 10 specialized tool renderers, welcome screen, density orb, input area. Established flitter-core rendering pipeline.

**Known debt carried into v0.2.0:**
- 4 ACP sessionUpdate event names wrong (thinking/usage/mode/session_info never worked)
- Scroll infrastructure broken (3 independent bugs: no controller listener, no followMode disable, no keyboard scroll)
- Tool names hardcoded to Amp convention only
- No connection drop detection

### v0.2.0 — Make It Actually Work (CURRENT)
Fix all 5 layers of structural defects found in the full E2E audit. Goal: connect to any ACP agent, correctly handle all protocol events, render streaming content reliably, provide working scroll and keyboard interaction.

**Guardrail:** If 3+ consecutive fixes fail to align with Amp CLI chat view behavior, trigger deep research to find remaining implementation gaps before continuing.

## Requirements

### Validated (v0.1.0)

- ACP client connection — spawns agent subprocess, initializes via ACP protocol, creates sessions
- Full-screen TUI shell — scrollable chat area, scrollbar, bordered input field, bottom grid
- ACP-to-TUI wiring — streaming text and tool call events flow from agent to widgets
- Tool call rendering — collapsible blocks with status icons, inline diff display
- Thinking block rendering — collapsible streaming thinking/reasoning display
- Plan view — checklist display from agent plan updates
- 7 built-in themes with InheritedWidget propagation

### Active (v0.2.0)

#### Protocol Correctness
- [ ] **PROTO-01**: Fix 4 sessionUpdate event names to match ACP SDK schema
- [ ] **PROTO-02**: Fix usage_update field mapping (size/used/cost, not input_tokens/output_tokens)
- [ ] **PROTO-03**: Declare clientCapabilities in initialize (fs, terminal)
- [ ] **PROTO-04**: Monitor connection.signal/connection.closed for agent crash detection
- [ ] **PROTO-05**: Fix terminalOutput listener leak and return type mismatch
- [ ] **PROTO-06**: Fix waitForTerminalExit return type to match SDK
- [ ] **PROTO-07**: Fix handleSubmit error path to call notifyListeners()

#### Scroll Infrastructure
- [ ] **SCROLL-01**: RenderScrollViewport must addListener on ScrollController and markNeedsPaint
- [ ] **SCROLL-02**: User scroll-up must call disableFollowMode()
- [ ] **SCROLL-03**: enableFollowMode() must be conditional (only when user hasn't scrolled away)
- [ ] **SCROLL-04**: Pass enableKeyboardScroll: true to chat ScrollView

#### Streaming Experience
- [ ] **STREAM-01**: Add streaming cursor/indicator to assistant messages
- [ ] **STREAM-02**: Throttle setState during streaming (batch chunks)
- [ ] **STREAM-03**: Handle non-text content types (image, tool_result) gracefully
- [ ] **STREAM-04**: Remove ThinkingBlock 500-char truncation (or raise significantly)

#### Tool Compatibility
- [ ] **TOOL-01**: Normalize tool names — map common variants (read_file→Read, execute_command→Bash, etc.)
- [ ] **TOOL-02**: Fix ToolCallResult.content to handle both nested and flat structures
- [ ] **TOOL-03**: Use actual tool name in headers instead of hardcoded strings
- [ ] **TOOL-04**: Make rawInput field extraction resilient to different agent formats

#### UX Polish
- [ ] **UX-01**: Add background mask to Permission Dialog
- [ ] **UX-02**: Remove all console.error debug logs from production code
- [ ] **UX-03**: Use agentInfo.name from initialize response
- [ ] **UX-04**: Fix Markdown paragraph merging (consecutive non-empty lines)
- [ ] **UX-05**: Fix Markdown heading prefix (currently all empty strings)

### Deferred (v0.3.0+)

- $EDITOR integration (Ctrl+G) — requires WidgetsBinding.suspend()/resume()
- Prompt history injection (Ctrl+R) — requires TextEditingController exposure
- @file mentions / FilePicker — requires file list data source
- Session persistence — save/restore conversation threads
- Reconnection on agent crash
- authenticate() flow for agents that require auth
- Virtual list for long conversations (performance)
- StickyHeader stack coordination (multiple headers overlapping)

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
*Last updated: 2026-03-27 after v0.2.0 milestone initialization (full E2E audit)*
