# Codebase Concerns

**Analysis Date:** 2026-03-26

## Tech Debt

**Scrollbar Rendering Complexity:**
- Issue: Scrollbar widget has complex sub-character precision rendering logic that has required multiple recent bug fixes
- Files: `/home/gem/workspace/packages/flitter-core/src/widgets/scrollbar.ts`
- Impact: Thumb size instability and incorrect background colors on edge cells
- Fix approach: Recent commits (f0f91c4, 0b64af2) fixed these issues by using exact viewport size calculation and consistent rounding

**Large Test Files:**
- Issue: Some test files are extremely large (over 1000 lines), indicating potential test code duplication or lack of test organization
- Files: `/home/gem/workspace/packages/flitter-core/src/widgets/__tests__/text-field.test.ts` (1264 lines), `/home/gem/workspace/packages/flitter-core/src/widgets/__tests__/image-preview.test.ts` (1091 lines), `/home/gem/workspace/packages/flitter-core/src/widgets/__tests__/scrollbar.test.ts` (1058 lines)
- Impact: Hard to maintain and slow to run tests
- Fix approach: Consider splitting large test files into smaller, focused test files

## Known Bugs

**Recent Bug Fixes:**
1. **Scrollbar sub-character edge cell backgrounds:** Fixed by setting proper background colors on scrollbar sub-character edge cells (commit f0f91c4)
2. **Scrollbar thumb size stability:** Fixed by using exact ScrollController.viewportSize for thumb size calculation and consistent rounding (commit 0b64af2)
3. **Mouse scroll dispatch:** Fixed mouse scroll dispatch and scrollbar sub-character rendering (commit b4345a5)

## Security Considerations

**Terminal Capability Detection:**
- Risk: Terminal capability detection could be vulnerable to malicious input or terminal spoofing
- Files: `/home/gem/workspace/packages/flitter-core/src/terminal/terminal-manager.ts`
- Current mitigation: Capability detection with timeout fallback
- Recommendations: Implement strict input validation and limit capability detection to trusted environments

## Performance Bottlenecks

**Large Widget Tree Rendering:**
- Problem: Very large widget trees (1000+ widgets) could cause performance issues
- Files: `/home/gem/workspace/packages/flitter-core/src/framework/element.ts`, `/home/gem/workspace/packages/flitter-core/src/scheduler/frame-scheduler.ts`
- Cause: No RelayoutBoundary or RepaintBoundary optimizations (per Amp fidelity requirements) - full repaint every frame
- Improvement path: Monitor performance for large widget trees and consider adding optimizations if needed

## Fragile Areas

**Scrollbar Widget:**
- Files: `/home/gem/workspace/packages/flitter-core/src/widgets/scrollbar.ts`
- Why fragile: Complex sub-character precision rendering logic that requires careful maintenance
- Safe modification: Test changes with comprehensive test suite (1000+ lines of tests)
- Test coverage: Excellent - 1058 lines of tests

**TextField Widget:**
- Files: `/home/gem/workspace/packages/flitter-core/src/widgets/text-field.ts`
- Why fragile: Complex text input handling with many edge cases (multi-line, word operations, mouse interaction)
- Safe modification: Test changes with comprehensive test suite
- Test coverage: Excellent - 1264 lines of tests

## Scaling Limits

**Terminal Rendering Performance:**
- Current capacity: ~1000 widgets at 60fps
- Limit: Terminal I/O and ANSI rendering overhead could limit performance for very large UIs
- Scaling path: Optimize terminal output by reducing unnecessary ANSI escape sequences and implementing more efficient diff algorithms

**Input Parsing:**
- Current capacity: Handles standard keyboard and mouse input
- Limit: Complex terminal input sequences could cause parsing delays
- Scaling path: Optimize input parser state machine and implement input buffering

## Dependencies at Risk

**Bun Runtime:**
- Risk: Project is Bun-first and uses Bun-specific APIs (platform.ts adapter)
- Impact: Could limit portability to other runtimes (Node.js)
- Migration plan: Maintain and improve the platform.ts adapter to support multiple runtimes

## Missing Critical Features

**Documentation:**
- Problem: Some features lack detailed documentation
- Blocks: Makes it hard for new developers to understand and use the framework
- Fix approach: Improve documentation and examples

**Accessibility:**
- Problem: No accessibility (screen reader) support
- Blocks: Makes the framework inaccessible to visually impaired users
- Fix approach: Implement accessibility features in future versions

## Test Coverage Gaps

**Integration Tests:**
- What's not tested: Some end-to-end integration tests may be missing
- Files: `/home/gem/workspace/packages/flitter-core/examples/`
- Risk: Could miss bugs in complex widget interactions
- Priority: Medium

**Edge Cases:**
- What's not tested: Some edge cases in widget behavior may not be covered
- Files: `/home/gem/workspace/packages/flitter-core/src/widgets/`
- Risk: Could miss rare but critical bugs
- Priority: Low

---

*Concerns audit: 2026-03-26*