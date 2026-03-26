# External Integrations

**Analysis Date:** 2026-03-26

## APIs & External Services

**Agent Communication:**
- **Agent Client Protocol (ACP)** - Standard protocol for communication between CLI applications and language model agents
  - SDK: `@agentclientprotocol/sdk` 0.16.0
  - Usage: Enables flitter-amp to connect to and interact with Claude, Gemini, and other ACP-compliant agents
  - Examples: `claude --agent`, `gemini --experimental-acp`

**Supported Agents:**
- Claude (Anthropic) - Via `claude --agent` command
- Gemini (Google) - Via `gemini --experimental-acp` command
- Any ACP-compliant agent implementation

## Data Storage

**Databases:**
- Not detected - Application state is stored in memory (AppState class)

**File Storage:**
- Local filesystem - Read access for configuration and possibly agent binaries
- Not applicable for persistent data storage

**Caching:**
- Not detected - No caching mechanism implemented

## Authentication & Identity

**Auth Provider:**
- None - Application does not implement authentication
- Agent authentication is handled by the agent process itself

## Monitoring & Observability

**Error Tracking:**
- Console logging - Errors are logged to stderr with detailed messages
- File logging - Optional logging via logger utility (configurable log levels)

**Logs:**
- Logger utility with levels (info, error)
- Output to stdout/stderr
- File-based logging not implemented

## CI/CD & Deployment

**Hosting:**
- Local execution - Run directly from source or as compiled executable
- No cloud deployment target specified

**CI Pipeline:**
- Not detected - No CI configuration files (GitHub Actions, GitLab CI, etc.) found

## Environment Configuration

**Required env vars:**
- Not explicitly required - Application uses command-line arguments for configuration

**Secrets location:**
- Not applicable - No secrets management implemented

## Webhooks & Callbacks

**Incoming:**
- None - Application does not expose HTTP endpoints

**Outgoing:**
- Agent Client Protocol (ACP) - Sends prompts and receives responses from agents via stdio communication

---

*Integration audit: 2026-03-26*
