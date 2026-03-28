# Phase 10: Tool Compatibility — Context

**Auto-generated:** Infrastructure phase, minimal context required.

## Key Decisions

- **D-01**: Add tool name normalization map to `tool-call-widget.ts` for cross-agent compatibility
- **D-02**: Fix content extraction to handle both `c.text` and `c.content?.text` patterns
- **D-03**: Use `toolCall.kind ?? toolCall.title` for ToolHeader display name in all specialized tools
- **D-04**: Add multiple rawInput field name variants to each specialized tool
