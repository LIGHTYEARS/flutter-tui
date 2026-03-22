---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Amp CLI Deep Fidelity
status: planned
stopped_at: Milestone planning complete, ready for phase execution
last_updated: "2026-03-22T13:24:00Z"
last_activity: 2026-03-22
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 17
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-22)

**Core value:** Flutter-faithful TUI framework with declarative widgets, box-constraint layout, and 60fps cell-level diff rendering
**Current focus:** v1.2 Amp CLI Deep Fidelity — Planned

## Current Position

Phase: 16 of 22 (AppTheme & Syntax Highlighting) — NOT STARTED
Plan: 0/17 plans complete
Status: Planned
Last activity: 2026-03-22

Progress: [░░░░░░░░░░] 0%

## v1.2 Phase Overview

| Phase | Name | Requirements | Plans | Status |
|-------|------|-------------|-------|--------|
| 16 | AppTheme & Syntax Highlighting | ATHM-01, ATHM-02 | 2 | Planned |
| 17 | Rendering Pipeline Enhancements | RPIP-01..05 | 3 | Planned |
| 18 | Terminal Protocol Extensions | TPRO-01..10 | 3 | Planned |
| 19 | Image Protocol | IMG-01..03 | 2 | Planned |
| 20 | TextField Complete Rewrite | TXFD-01..05 | 3 | Planned |
| 21 | Performance Diagnostics Upgrade | PERF-01..03 | 2 | Planned |
| 22 | Minor Fidelity Fixes | MINR-01..07 | 2 | Planned |

## Recommended Execution Order (Waves)

| Wave | Phase(s) | Rationale |
|------|----------|-----------|
| W12 | 16 + 17 | Independent: AppTheme vs rendering pipeline |
| W13 | 18 | Depends on Phase 17 Renderer enhancements |
| W14 | 19 + 20 + 21 | All depend on W12/W13; can run in parallel |
| W15 | 22 | Final sweep |

## Performance Metrics

**Velocity (v1.0 + v1.1 + v1.2):**

- v1.0 plans completed: 25
- v1.1 plans completed: 16
- v1.2 plans planned: 17
- Total plans completed: 41
- Total test count: 2165 (0 failures)
- Total examples: 28

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.2]: Image protocol promoted from v2 Out-of-Scope to v1.2 (Amp actively uses Kitty images)
- [v1.2]: AppTheme (h8) is separate from Theme (w3) — two-layer theme system matching Amp architecture
- [v1.2]: TextField requires complete rewrite (not incremental enhancement) — current skeleton is too far from Amp's implementation
- [v1.2]: PerformanceOverlay must draw directly to screen buffer (not as widget in tree) to match Amp's BB0
- [v1.2]: Alpha compositing is P1 because semi-transparent overlays and the perf overlay background depend on it

### Pending Todos

None — milestone just started.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-22T13:24:00Z
Stopped at: Milestone planning complete
Resume file: None
