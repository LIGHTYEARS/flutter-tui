# Amp CLI Reverse-Engineered Source Index

> Single source of truth for Amp CLI's visual implementation.
> Extracted from the Amp CLI binary's embedded JavaScript bundle.

## Symbol Mapping (Minified → Readable)

| Minified | Readable Name | File |
|----------|--------------|------|
| `gH` | Color | (built-in color utility) |
| `wd` | ColorScheme | `color-scheme-wd.js` |
| `YB` | BaseTheme | `color-scheme-wd.js` |
| `x1` | AppTheme | `app-theme-x1.js` |
| `Qt` | Theme (container) | `app-theme-x1.js` |
| `DSH` | DarkThemeRGB | `terminal-theme-DSH.js` |
| `tSH` | LightThemeRGB | `terminal-theme-DSH.js` |
| `AZH` | TerminalThemeProvider | `terminal-theme-DSH.js` |
| `Sa` | UserMessage | `user-message-Sa.js` |
| `RQ` | SelectedUserMessage | `selected-user-message-RQ.js` |
| `XkL` | AssistantMessage | `assistant-message-XkL.js` |
| `wQ` | ToolHeader | `tool-header-wQ.js` |
| `xD` | ToolCallHeader | `tool-call-header-xD.js` |
| `rR` | StatusIcon | `status-icon-rR.js` |
| `j0` | StatusColor | `status-color-j0.js` |
| `zk` | ThinkingBlock | `thinking-block-zk.js` |
| `lT` | ExpandCollapse | `expand-collapse-lT.js` |
| `F0H` | PromptBar | `prompt-bar-F0H.js` |
| `dy` | FooterStatus | `footer-status-dy.js` |
| `iJH` | StatusBarState | `status-bar-iJH.js` |
| `Af` | BrailleSpinner | `braille-spinner-Af.js` |
| `Ym` | AgentModeColor | `agent-mode-colors-Ym.js` |
| `ZKH` | GetModeColors | `agent-mode-colors-Ym.js` |
| `PC$` | PatternMatcher | `rgb-theme-mapping-PC.js` |

## File Descriptions

### Theme System
| File | Description |
|------|-------------|
| `color-scheme-wd.js` | `wd` ColorScheme class — 15 base terminal color fields (foreground, background, primary, secondary, accent, success, warning, info, destructive, etc.). `YB` BaseTheme wraps ColorScheme. |
| `app-theme-x1.js` | `x1` AppTheme class — 40+ semantic color properties (toolRunning, toolSuccess, keybind, command, diffAdded, scrollbarThumb, etc.) with `default("dark"|"light")`. `Qt` Theme container combines base + app. |
| `terminal-theme-DSH.js` | `DSH` dark theme RGB values, `tSH` light theme RGB values. `AZH` TerminalThemeProvider definition. |
| `rgb-theme-mapping-PC.js` | `PC$` pattern matching for theme mapping + `j3` deep equality comparison. |
| `agent-mode-colors-Ym.js` | `Ym` agent mode color function, `ZKH` mode color pair getter, `dFL` color mode config, `kd` Perlin noise-based color animation class. |

### Message Rendering
| File | Description |
|------|-------------|
| `user-message-Sa.js` | `Sa` user message widget — left border (2px, success/green color), italic green text, NO text label. |
| `selected-user-message-RQ.js` | `RQ` selected user message — yellow selection highlight + green left border. |
| `assistant-message-XkL.js` | `XkL` assistant message function — plain markdown rendering, no border, no label. |

### Tool Calls
| File | Description |
|------|-------------|
| `tool-header-wQ.js` | `wQ` tool header builder — format: `[icon] [ToolName bold] [detail dim]`. |
| `tool-call-header-xD.js` | `xD` tool call header class — full tool call display with status tracking. |
| `status-icon-rR.js` | `rR` status icon function — done=✓, error/cancelled=✗, in-progress=⋯ |
| `status-color-j0.js` | `j0` status color function — done=green, error=red, cancelled=yellow, in-progress=blue |
| `expand-collapse-lT.js` | `lT` expand/collapse toggle — ▶/▼ chevron in mutedForeground (brightBlack). |

### Thinking Block
| File | Description |
|------|-------------|
| `thinking-block-zk.js` | `zk` thinking block — streaming=magenta(●), done=green(✓), cancelled=yellow("interrupted"). Content: dim+italic. |

### Input & Status
| File | Description |
|------|-------------|
| `prompt-bar-F0H.js` | `F0H` prompt bar — Container with rounded border (borderStyle:"rounded", borderColor:theme.border). |
| `footer-status-dy.js` | `dy` footer status computation — returns status type/text/icon for different states. |
| `status-bar-iJH.js` | `iJH` status bar state class — manages animation frames, wave spinner ("≈"), contextual messages. |
| `braille-spinner-Af.js` | `Af` braille/cellular automaton spinner — used for loading animations. |

## Quick Reference: Default Dark Theme Colors

```
toolRunning     = blue        scrollbarThumb = default (foreground)
toolSuccess     = green       scrollbarTrack = index(8)
toolError       = red         keybind        = blue
toolCancelled   = yellow      command        = yellow
toolName        = default     link           = blue
userMessage     = cyan        filename       = cyan
assistantMessage= default     diffAdded      = green
systemMessage   = index(8)    diffRemoved    = red
processing      = blue        diffChanged    = yellow
waiting         = yellow      selectedMessage= green
completed       = green       smartModeColor = rgb(0,255,136)
cancelled       = index(8)    rushModeColor  = rgb(255,215,0)
```

## Source

Extracted from Amp CLI binary (macOS arm64) via `strings` command.
Full extracted JS: `/home/gem/home/tmp/amp-js-strings.txt` (8.7MB)
Detailed analysis: `README.md` in this directory.
