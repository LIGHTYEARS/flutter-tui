# Phase 16: AppTheme & Syntax Highlighting - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add the second theme layer (AppTheme / h8) as an InheritedWidget distinct from Theme (w3), and implement a syntax highlighting function (ae) for file-extension-based code colorization. Wire DiffView to use AppTheme for syntax-highlighted diff content.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase with clear Amp reference patterns. Key constraints:
- AppTheme must be distinct from Theme (both coexist in widget tree)
- AppTheme.of(context) accessor pattern matching Amp's h8.of(context)
- Syntax highlighting must support at minimum: TypeScript/JavaScript, Python, Go, Rust, JSON, YAML, Markdown, Shell
- ae() function signature: syntaxHighlight(content: string, config: SyntaxHighlightConfig, filePath: string) → TextSpan[]
- DiffView must consume AppTheme for colorized diff content

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/widgets/theme.ts` — Theme InheritedWidget (w3) with ThemeData and color scheme. Follow same pattern for AppTheme.
- `src/widgets/diff-view.ts` — DiffView widget that needs AppTheme integration for syntax highlighting.
- `src/core/text-style.ts` — TextStyle with color, bold, italic etc. Used to build syntax-highlighted spans.
- `src/core/text-span.ts` — TextSpan tree structure used as output of syntax highlighting.

### Established Patterns
- InheritedWidget pattern: `Theme.of(context)` accessor, `updateShouldNotify()` override
- Color references via ThemeData fields
- TextSpan tree construction for rich text rendering

### Integration Points
- AppTheme wraps root widget (alongside Theme and MediaQuery) in WidgetsBinding
- DiffView reads AppTheme.of(context).syntaxHighlight config
- ae() function called during DiffView build to colorize diff content

</code_context>

<specifics>
## Specific Ideas

Amp ref: h8 InheritedWidget, ae() syntax highlighting function
Reference files: .reference/widgets-catalog.md (line 888, 1413)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
