# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript 5.7.0 - Main implementation language for both packages

**Secondary:**
- JavaScript - Not explicitly used, but TypeScript compiles to JavaScript
- Markdown - Documentation

## Runtime

**Environment:**
- Bun 1.x - JavaScript runtime for development, testing, and building

**Package Manager:**
- pnpm 8.x - Monorepo package management
- Lockfile: `pnpm-lock.yaml` (present)

## Frameworks

**Core:**
- flitter-core 0.1.0 - Flutter-faithful TUI framework for TypeScript (built in-house)
  - Purpose: Provides widget tree architecture, rendering pipeline, and UI components for terminal applications

**Testing:**
- Bun Test - Built-in testing framework for both packages

**Build/Dev:**
- Bun Build - Native bundler for compiling to executable
- TypeScript Compiler - Type checking and declaration generation
- VitePress - Documentation site generation (for flitter-core)

## Key Dependencies

**Critical:**
- `@agentclientprotocol/sdk` 0.16.0 - Agent Client Protocol SDK for communication between flitter-amp and language model agents
  - Why it matters: Enables the TUI to connect to and interact with Claude, Gemini, and other ACP-compliant agents

**Infrastructure:**
- `bun-types` - Type definitions for Bun runtime API
- `vitepress` 1.6.4 - Static site generator for documentation

## Configuration

**Environment:**
- `.env` - Not explicitly mentioned, but possible for environment configuration
- `USER.md` - User-defined instructions and preferences

**Build:**
- `tsconfig.json` - Root TypeScript configuration (composite project)
- `packages/flitter-core/tsconfig.json` - flitter-core TypeScript configuration (strict mode, ES2022 target)
- `packages/flitter-amp/tsconfig.json` - flitter-amp TypeScript configuration (extends core config)
- `pnpm-workspace.yaml` - Monorepo workspace configuration

## Platform Requirements

**Development:**
- Bun 1.x runtime
- pnpm package manager
- Terminal with ANSI support

**Production:**
- Bun runtime or compiled executable (via `bun build`)
- Terminal with support for keyboard/mouse input and ANSI escape codes

---

*Stack analysis: 2026-03-26*
