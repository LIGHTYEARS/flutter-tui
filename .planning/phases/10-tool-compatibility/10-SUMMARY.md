# Phase 10: Tool Compatibility — Summary

## Changes

### 1. Tool name normalization (TOOL-01)
**File:** `packages/flitter-amp/src/widgets/tool-call/tool-call-widget.ts`
- Added `TOOL_NAME_MAP` with 21 common agent tool name aliases
- Normalization applied before the dispatch switch: `const name = TOOL_NAME_MAP[rawName] ?? rawName`
- Gemini's `read_file` → ReadTool, Codex's `shell` → BashTool, etc.

### 2. Content extraction fix (TOOL-02)
**Files:** All 6 files with `extractOutput()` or content extraction
- Changed `.map(c => c.content?.text ?? '')` to `.map(c => (c as Record<string, unknown>)['text'] as string ?? c.content?.text ?? '')`
- Handles both flat `{type, text}` and nested `{type, content: {type, text}}` structures

### 3. Dynamic ToolHeader names (TOOL-03)
**Files:** `read-tool.ts`, `create-file-tool.ts`
- ReadTool: `name: 'Read'` → `name: this.toolCall.kind ?? 'Read'`
- CreateFileTool: `name: 'CreateFile'` → `name: this.toolCall.kind ?? 'CreateFile'`

### 4. Resilient rawInput extraction (TOOL-04)
**Files:** All 5 specialized tools
- BashTool: +shell_command, script, args
- ReadTool: +filename, file
- GrepTool: +search_pattern, regex, search, directory
- CreateFileTool: +filename, file, destination
- WebSearchTool: +search_query, q, search

## Files Modified (7)
- `packages/flitter-amp/src/widgets/tool-call/tool-call-widget.ts`
- `packages/flitter-amp/src/widgets/tool-call/bash-tool.ts`
- `packages/flitter-amp/src/widgets/tool-call/read-tool.ts`
- `packages/flitter-amp/src/widgets/tool-call/grep-tool.ts`
- `packages/flitter-amp/src/widgets/tool-call/create-file-tool.ts`
- `packages/flitter-amp/src/widgets/tool-call/web-search-tool.ts`
- `packages/flitter-amp/src/widgets/tool-call/generic-tool-card.ts`
