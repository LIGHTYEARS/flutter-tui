# Amp CLI Binary — Reverse Engineering Spec

## 1. Distribution & Installation

### Install Script
- **URL**: `https://ampcode.com/install.sh`
- **Method**: Bash script downloads pre-compiled binary, verifies checksum, optionally verifies minisign signature
- **Storage Base**: `https://static.ampcode.com`
- **Version File**: `https://static.ampcode.com/cli/cli-version.txt`

### macOS Targets
| Platform | Target String | Detection |
|---|---|---|
| Apple Silicon | `darwin-arm64` | `uname -s` = Darwin, `uname -m` = arm64 |
| Intel (AVX2) | `darwin-x64` | `uname -s` = Darwin, `uname -m` = x86_64, AVX2 present |
| Intel (no AVX2) | `darwin-x64-baseline` | `uname -s` = Darwin, `uname -m` = x86_64, no AVX2 |
| Rosetta 2 | `darwin-arm64` | `sysctl.proc_translated` = 1 → redirected to arm64 |

### Download URLs (Versioned)
```
Binary:   https://static.ampcode.com/cli/{version}/amp-{target}
Checksum: https://static.ampcode.com/cli/{version}/{target}-amp.sha256
Signature:https://static.ampcode.com/cli/{version}/amp-{target}.minisig
```

### Current Version (as of 2026-03-26)
```
Version:  0.0.1774512763-gf7364e
Released: 2026-03-26T08:16:41.390Z
```

---

## 2. Binary Format & Build Toolchain

### File Identity
| Property | Value |
|---|---|
| File Type | Mach-O 64-bit executable arm64 |
| Magic | 0xFEEDFACF |
| File Size | ~67 MB |
| SHA256 | `fcec816b26b68b9b45ddd7b6cd645ea3e28c6129e46c9cbeebc8b03c1ea80f82` |
| Stripped | Yes (only 704 external symbols — all undefined imports) |
| Compiler | Zig/Bun native toolchain (C++ / Zig backend) |

### Build System: Bun Standalone Binary
The binary is produced by **`bun build --compile`** — Bun's single-file executable bundler. Evidence:
1. **`__BUN` segment** in Mach-O load commands (vmsize ~8.9MB) — contains the bundled, minified JavaScript payload
2. **`__jsc_int` section** in `__TEXT` segment (~350KB) — JavaScriptCore bytecode/interrupt handlers
3. **Bun runtime strings** — shell completions (`_bun_*`), Bun.serve, Bun.nanoseconds, `bun pm`, `bun upgrade`
4. **libicucore.A.dylib** — ICU linked, standard for JSC-based runtimes on macOS

### Mach-O Segments
| Segment | VM Address | VM Size | Description |
|---|---|---|---|
| `__PAGEZERO` | 0x000000000 | 4GB | Standard null page guard |
| `__TEXT` | 0x100000000 | ~56MB | Executable code + read-only data |
| `__DATA_CONST` | 0x103bdc000 | — | Read-only global data |
| `__DATA` | 0x103d04000 | — | Read-write global data |
| `__DATA_DIRTY` | 0x1042b0000 | — | Frequently-written data |
| **`__BUN`** | 0x1042b4000 | **~8.9MB** | **Bundled JS source (minified)** |
| `__LINKEDIT` | 0x104b44000 | — | Symbol table, string table, relocations |

### Key `__TEXT` Sections
| Section | Size | Purpose |
|---|---|---|
| `__text` | ~49.6MB | Native compiled code (Bun runtime + JSC engine) |
| `__jsc_int` | ~350KB | JavaScriptCore interpreter bytecodes |
| `__stubs` | ~8KB | Dynamic library call stubs |
| `__const` | ~5MB | Read-only constants |

### Dynamic Libraries
```
/usr/lib/libicucore.A.dylib    (ICU — Unicode/i18n, used by JSC)
/usr/lib/libresolv.9.dylib     (DNS resolution)
/usr/lib/libc++.1.dylib        (C++ standard library)
/usr/lib/libSystem.B.dylib     (macOS system library)
```

---

## 3. CLI Interface

### Top-Level Commands
```
amp [options] [command]

Commands:
  version       Print version number
  logout        Log out (remove stored API key)
  login         Log in to Amp
  threads       Thread management (alias: t, thread)
    new / continue / list / usage / visibility / search / share / rename / archive / delete / handoff / markdown
  tools         Tool management (alias: tool)
    list / show / make / use
  review        Code review on uncommitted changes or commit range
  skill         Skill management (alias: skills)
    add / list / remove / info
  permissions   Permission management (alias: permission)
    list / test / edit / add
  mcp           MCP server management
    add / list / remove / doctor / approve
    oauth (login / logout / status)
  usage         Show usage and credit balance
  update        Update Amp CLI (alias: up)
```

### Key Options
```
--visibility <private|public|workspace|group>
--notifications / --no-notifications
--model <model>           (short: -m)
--execute <instruction>   Non-interactive execute mode
--resume <thread-id>      Resume a thread
--continue <thread-id>    Continue thread in interactive mode
--yolo                    Skip permission prompts
--verbose                 Show debug output
--print                   Print response and exit (non-interactive)
--json                    Output as JSON
```

---

## 4. Architecture — Embedded JavaScript Application

### Runtime Stack
```
┌─────────────────────────────────────────────┐
│              Mach-O Binary (67MB)           │
├─────────────────────────────────────────────┤
│  Bun Runtime (native C++/Zig)  ~56MB __TEXT │
│    ├── JavaScriptCore Engine                │
│    ├── HTTP/TLS Client (BoringSSL)          │
│    ├── Node.js Compat Layer                 │
│    └── File I/O, Child Process, etc.        │
├─────────────────────────────────────────────┤
│  Bundled JS Application      ~8.9MB __BUN  │
│    ├── CLI Entry Point & Argument Parser    │
│    ├── Anthropic API Client (Claude)        │
│    ├── Agent Loop (conversation engine)     │
│    ├── MCP Client (Model Context Protocol)  │
│    ├── OAuth 2.0 / PKCE Flow                │
│    ├── TUI Rendering Engine (custom)        │
│    ├── Thread Storage & Sync Service        │
│    ├── Skill Loader & Plugin System         │
│    ├── Tool Infrastructure                  │
│    ├── Secret Scanning / Redaction          │
│    └── Telemetry & Analytics                │
└─────────────────────────────────────────────┘
```

### JS Bundle Characteristics
- **Minified**: Yes — variable names are single-letter/short mangled identifiers
- **Source Maps**: Not embedded
- **Module System**: ESM bundled into a single entry, lazy-loaded via `SR()` (likely `__require`)
- **Key Observation**: The `__BUN` segment can be extracted and (partially) analyzed with `strings` and pattern matching against the minified code

---

## 5. Core Subsystems

### 5.1 LLM Provider Integration

#### Anthropic (Primary)
- **API Base**: `https://api.anthropic.com/`
- **Web App**: `https://ampcode.com/`
- **Auth Header**: `X-Workers-Service-Auth` (Cloudflare Workers proxy)

#### Model Identifiers Found in Binary
| Constant | Value | Notes |
|---|---|---|
| `CLAUDE_OPUS_4_6` | `claude-opus-4-6-1m` | Primary "deep" mode model |
| Context Window | 1,000,000 tokens | `o7R=1e6` |
| Max Output | 32,000 tokens | `k7R=32000` |
| Default tokens | 8,000 | `axT=8000` |
| Min tokens | 4,000 | `Wq=4000` |
| Max retries | 10 | `oxT=10` |
| Max tool calls | 25,000 | `A7R=25000` |
| Token limit | 32,768 | `kxT=32768` |
| Tool result truncation | 65,536 chars | `goR=65536` |

#### Fireworks Integration
- Alternative provider path via `kVT` function (OpenAI-compatible API)
- Inference uses `runInference()` with V8 heap snapshot support

#### Agent Modes
- **Default**: Standard Claude model
- **Deep** (`--model` or `Alt+D`): `claude-opus-4-6-1m` with extended context (1M tokens)
- Inferred from: `if(r==="deep")return{model:k8.CLAUDE_OPUS_4_6.name,provider:_9.ANTHROPIC}`

### 5.2 Agent / Conversation Engine

#### Inference Loop
```
runInference(model, systemPrompt, conversation, toolService, env)
  → API call → extract message → tool calls → execute tools → update conversation → repeat
```

#### Task Subagent System
- Spawns sub-agents for parallel work: `oVT()` / `kVT()`
- System prompt template `za["task-subagent"]`
- Returns structured results: `in-progress` / `done` / `error` / `cancelled`

#### Conversation Protocol
- Messages: `{role: "user"|"assistant"|"tool", content, tool_calls?, reasoning_content?}`
- Tool results: `{role: "tool", content, tool_call_id}`
- Streaming: SSE (Server-Sent Events) via `TransformStream` parser

### 5.3 MCP (Model Context Protocol)

#### Client Implementation
- Full MCP client: `amp-mcp-client v0.0.0-dev`
- Capabilities: `sampling`, `prompts.listChanged`
- Transport: Streamable HTTP (SSE-based), stdio
- Auth: OAuth 2.0 with PKCE, dynamic client registration, RFC 9728 resource metadata

#### MCP OAuth Flow
```
1. Discover server → GET .well-known/oauth-authorization-server
2. Dynamic registration → POST /register
3. Authorization → browser redirect → callback server
4. Token exchange → POST /token
5. Credential storage → ~/.amp/oauth/{server}-client.json + keychain
```

#### Server Trust System
- `CqR` class: Trust manager with per-server spec hashing
- Workspace-level allowlisting: `allowAllMcpServers`
- Config key: `mcpTrustedServers`

### 5.4 TUI (Terminal User Interface)

#### Custom Widget Framework (Flutter-inspired)
The binary contains a full custom **Flutter-style widget/element/render tree** for terminal UI:

- **Widget Tree**: `Widget → Element → RenderObject` pattern
- **Layout**: `BoxConstraints`, intrinsic sizing, `Flex` layout (Row/Column)
- **Painting**: `ScreenBuffer` with ANSI escape codes, border drawing with Unicode box characters
- **State Management**: `StatefulWidget → State` with `setState()` rebuild cycle
- **Input**: Focus management (`FocusNode`), keyboard events, mouse regions
- **Scrolling**: `ScrollController`, `ScrollView` with follow mode

#### Key UI Components
| Widget | Purpose |
|---|---|
| Prompt Bar | Input area with multiline, Shift+Enter, `$`/`$$` shell commands |
| Assistant Message | Streamed response with thinking blocks |
| Tool Call Block | Shows tool execution with progress |
| Diff Card | File diff rendering |
| Permission Dialog | Tool/file access approval |
| Command Palette | Ctrl+O — fuzzy command search |
| Status Bar | Model, thread ID, usage info |
| Skill Modal | Browse/invoke installed skills |

#### Keyboard Shortcuts
| Key | Action |
|---|---|
| Ctrl+O | Command palette |
| Ctrl+R | Prompt history |
| Ctrl+V | Paste images |
| Ctrl+S | Switch modes |
| Ctrl+G | Edit in $EDITOR |
| Alt+D | Toggle deep reasoning |
| Alt+T | Toggle thinking/dense view |
| Tab/Shift+Tab | Navigate messages |
| `$` / `$$` | Shell commands |
| `@` / `@@` | Mention files/threads |

### 5.5 Thread Management

#### Storage
- Local: `~/.amp/` directory tree
- Sync: Server-side via `ThreadSyncService`
  - Upload: `x8.uploadThread()`
  - Download: `x8.discoverThreads()`
  - Metadata: visibility, sharedGroupIDs

#### Thread Sync Protocol
- Bidirectional sync with conflict resolution
- Exponential backoff on failures
- Periodic retry (configurable interval)
- `AbortController`-based cancellation

### 5.6 Skills System

#### Skill Discovery Paths (priority order)
1. `~/.config/agents/skills/` (global agent skills)
2. `~/.config/amp/skills/` (global amp skills)
3. `.agents/skills/` (per-workspace)
4. `.claude/skills/` (per-workspace, Claude-compatible)
5. `~/.claude/skills/` (global Claude-compatible)
6. `~/.claude/plugins/cache/` (plugin cache)
7. `AMP_TOOLBOX` env or `~/.config/amp/tools/`
8. Custom `skills.path` from config

#### Skill Format
```yaml
# skill.md frontmatter
---
name: my-skill          # lowercase a-z, 0-9, hyphens
description: "..."      # max length enforced
compatibility: "..."
builtin-tools: [...]
isolatedContext: false
disable-model-invocation: false
argument-hint: "..."
---

# Markdown body with instructions
```

#### Associated Files
- `mcp.json` — MCP server definitions for the skill
- Any other files in the skill directory are accessible

### 5.7 Tool Infrastructure

#### Built-in Tools
- File operations (read, write, search via ripgrep)
- Shell command execution (with sandbox/permission checks)
- Code review
- Web page extraction: `x8.extractWebPageContent()`
- Thread reading: cross-thread content extraction

#### Ripgrep Integration
- Primary search tool, downloaded on-demand from `storage.googleapis.com/amp-public-assets-prod-0/ripgrep/`
- Fallback: `AMP_RIPGREP_PATH` env var or system `rg`
- Used for codebase search with `G3R()` resolver

### 5.8 Security & Secret Scanning

#### Comprehensive Secret Detection
The binary contains **50+ regex patterns** for detecting leaked secrets in tool outputs:
- AWS (access keys, secret keys)
- Anthropic, OpenAI API keys
- GitHub, GitLab tokens
- Stripe, Twilio, Slack tokens
- SSH private keys, JWT tokens
- And many more (see `SST` patterns array in binary)

### 5.9 Configuration

#### Config Hierarchy
- Admin settings: system-level JSON with `amp.*` prefix
- Global config: `~/.amp/` or platform-specific config dir
- Workspace config: `.amp/` in project root
- Environment variables: `AMP_HOME`, `AMP_RIPGREP_PATH`, `AMP_TOOLBOX`, `AMP_URL`

#### Settings System
- Observable config: RxJS-style `BehaviorSubject` with `pipe()`, `subscribe()`
- Targets: `"global"` or workspace-scoped
- Persistence: JSON files with atomic write (temp + rename)

### 5.10 Telemetry & Analytics
- Installation ID: UUID persisted to config
- Device Fingerprint: SHA-256 hash of `{clientType, os, osVersion, cpuArchitecture, locale, timezone}`
- Format: `v1:fp_{hash}`

---

## 6. Network Endpoints

| Endpoint | Purpose |
|---|---|
| `https://ampcode.com/` | Web app, OAuth redirects, docs |
| `https://api.anthropic.com/` | Anthropic Claude API |
| `https://static.ampcode.com/cli/` | Binary distribution, version checks |
| `https://storage.googleapis.com/amp-public-assets-prod-0/` | Ripgrep binaries, assets |
| `https://ampcode.com/.well-known/signing-key.pub` | Minisign public key for binary verification |

---

## 7. Reverse Engineering Entry Points

### Extracting the JS Bundle
```bash
# The __BUN segment contains the full minified JS application.
# Extract it using offset/size from otool:
otool -l amp-darwin-arm64 | grep -A8 '__BUN'
# offset=60243968, size=0x88eb80 (8,974,208 bytes)

dd if=amp-darwin-arm64 bs=1 skip=60243968 count=8974208 of=amp-bundle.js 2>/dev/null

# Or use strings for targeted extraction:
strings amp-darwin-arm64 | grep -i 'pattern' > extracted.txt
```

### Key Analysis Techniques
1. **String Analysis**: `strings` + `rg` to find API endpoints, model names, error messages
2. **Segment Extraction**: `dd` to extract `__BUN` segment for JS code analysis
3. **Dynamic Analysis**: Run binary with `--verbose`, intercept HTTPS with mitmproxy
4. **Symbol Table**: Only 704 external (undefined) symbols — all system library imports
5. **MCP Protocol**: Attach as MCP client to observe protocol messages
6. **Config Files**: Examine `~/.amp/` directory after running for stored state

### Deobfuscation Hints
The JS bundle uses Bun's bundler (not webpack/esbuild), producing:
- Single-letter variable names: `R`, `T`, `r`, `a`, `e`, `t`
- Lazy module wrappers: `SR(() => { ... })` pattern
- Class preservation: Class names are often preserved (e.g., `CqR`, `Fv`, `BqR`)
- String literals are unobfuscated — all error messages, URLs, format strings are readable
- RxJS operators visible: `pipe()`, `VT()` (map), `k9()` (switchMap), `v9()` (distinctUntilChanged)

---

## 8. Compatibility with Flitter

### Relevant for flitter-amp
The Amp CLI's TUI is built on a **Flutter-inspired widget framework** rendered to the terminal. Key parallels with Flitter:
- `Widget → Element → RenderObject` three-tree architecture
- `BoxConstraints`-based layout with intrinsic sizing
- `StatefulWidget`/`State` pattern with `setState()` rebuild
- `Container` with decoration, padding, margin, constraints
- `Row`/`Column` (Flex) layout with `Expanded`
- `ScrollView` with `ScrollController`
- Focus management with `FocusNode`
- `MouseRegion` for click handling
- `Builder` and `LayoutBuilder` for dynamic content

This means the Amp CLI's UI can be faithfully reproduced in Flitter with near 1:1 widget mapping.
