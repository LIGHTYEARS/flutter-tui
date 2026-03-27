# Requirements: flitter-amp v0.2.0

**Defined:** 2026-03-27
**Core Value:** A truly functional ACP TUI client that correctly communicates with any ACP agent, renders all protocol messages faithfully, and provides a usable chat experience.

## v0.2.0 Requirements

### Protocol Correctness

- [ ] **PROTO-01**: Fix 4 sessionUpdate event names to match ACP SDK schema (`agent_thought_chunk`, `usage_update`, `current_mode_update`, `session_info_update`)
- [ ] **PROTO-02**: Fix usage_update field mapping to use SDK's `{size, used, cost}` structure
- [ ] **PROTO-03**: Declare `clientCapabilities` in initialize request (fs.readTextFile, fs.writeTextFile, terminal)
- [ ] **PROTO-04**: Monitor `connection.signal`/`connection.closed` for agent crash — display error in UI and exit processing state
- [ ] **PROTO-05**: Fix terminalOutput: collect output continuously from createTerminal, stop leaking listeners, match SDK `TerminalOutputResponse` shape
- [ ] **PROTO-06**: Fix waitForTerminalExit return type to match SDK `WaitForTerminalExitResponse`
- [ ] **PROTO-07**: Fix handleSubmit error path — call `notifyListeners()` and `finalizeAssistantMessage()`

### Scroll Infrastructure

- [ ] **SCROLL-01**: `RenderScrollViewport` must `addListener` on ScrollController and call `markNeedsPaint()` on scroll offset change
- [ ] **SCROLL-02**: User scroll-up (keyboard or mouse) must call `disableFollowMode()`
- [ ] **SCROLL-03**: `enableFollowMode()` in stateListener must be conditional — only when user hasn't manually scrolled away from bottom
- [ ] **SCROLL-04**: Pass `enableKeyboardScroll: true` to the chat area's SingleChildScrollView

### Streaming Experience

- [ ] **STREAM-01**: Show streaming cursor/indicator on in-progress assistant messages (use `_isStreaming` param)
- [ ] **STREAM-02**: Throttle/batch setState during streaming to reduce full-tree rebuilds
- [ ] **STREAM-03**: Handle non-text content types in `agent_message_chunk` gracefully (log + placeholder widget)
- [ ] **STREAM-04**: Raise ThinkingBlock content display limit from 500 to 5000+ characters

### Tool Compatibility

- [ ] **TOOL-01**: Normalize tool names — map common agent variants to specialized renderers (e.g., `read_file`→ReadTool, `execute_command`/`shell`→BashTool, `search`/`grep`→GrepTool)
- [ ] **TOOL-02**: Fix ToolCallResult.content to handle both nested `{type, content: {type, text}}` and flat `{type, text}` structures
- [ ] **TOOL-03**: Use actual `toolCall.kind` in tool headers instead of hardcoded strings
- [ ] **TOOL-04**: Make rawInput field extraction resilient — try multiple field name variants for command, file_path, etc.

### UX Polish

- [ ] **UX-01**: Add full-screen semi-transparent background mask to Permission Dialog
- [ ] **UX-02**: Remove all `console.error` debug logs from production code (app.ts, binding.ts)
- [ ] **UX-03**: Display `agentInfo.name`/`agentInfo.title` from initialize response in BottomGrid
- [ ] **UX-04**: Fix Markdown paragraph merging — consecutive non-empty lines form one paragraph
- [ ] **UX-05**: Fix Markdown heading prefix rendering (currently all empty strings)

## Deferred (v0.3.0+)

- **DEFER-01**: $EDITOR integration (Ctrl+G) — requires WidgetsBinding.suspend()/resume()
- **DEFER-02**: Prompt history injection (Ctrl+R) — requires TextEditingController exposure
- **DEFER-03**: @file mentions / FilePicker — requires file list data source
- **DEFER-04**: Session persistence — save/restore conversation threads
- **DEFER-05**: Reconnection on agent crash — auto-restart agent process
- **DEFER-06**: authenticate() flow for agents that require auth
- **DEFER-07**: Virtual list for long conversations (performance)
- **DEFER-08**: StickyHeader stack coordination (multiple headers overlapping)
- **DEFER-09**: Nested tool call rendering (sa__*/tb__* subagent tools)

## Out of Scope

| Feature | Reason |
|---------|--------|
| LLM API calls | The ACP agent handles all LLM communication |
| Agent implementation | We only implement the client side |
| Mobile/web UI | Terminal only |
| Plugin system | Direct implementation, no extensibility for v0.2 |
| Image rendering | No Kitty graphics protocol for v0.2 |
| OAuth/SSO | Deferred until agents require it |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROTO-01 | Phase 7 | Pending |
| PROTO-02 | Phase 7 | Pending |
| PROTO-03 | Phase 7 | Pending |
| PROTO-04 | Phase 7 | Pending |
| PROTO-05 | Phase 7 | Pending |
| PROTO-06 | Phase 7 | Pending |
| PROTO-07 | Phase 7 | Pending |
| SCROLL-01 | Phase 8 | Pending |
| SCROLL-02 | Phase 8 | Pending |
| SCROLL-03 | Phase 8 | Pending |
| SCROLL-04 | Phase 8 | Pending |
| STREAM-01 | Phase 9 | Pending |
| STREAM-02 | Phase 9 | Pending |
| STREAM-03 | Phase 9 | Pending |
| STREAM-04 | Phase 9 | Pending |
| TOOL-01 | Phase 10 | Pending |
| TOOL-02 | Phase 10 | Pending |
| TOOL-03 | Phase 10 | Pending |
| TOOL-04 | Phase 10 | Pending |
| UX-01 | Phase 11 | Pending |
| UX-02 | Phase 11 | Pending |
| UX-03 | Phase 11 | Pending |
| UX-04 | Phase 11 | Pending |
| UX-05 | Phase 11 | Pending |

**Coverage:**
- v0.2.0 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after v0.2.0 milestone initialization*
