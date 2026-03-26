# Testing Patterns

**Analysis Date:** 2024-03-26

## Test Framework

**Runner:**
- **Bun Test Runner** [latest]
- Config: Not explicitly configured; uses Bun's default settings

**Assertion Library:**
- Bun's built-in assertion library: `expect` from `bun:test`

**Run Commands:**
```bash
bun test              # Run all tests (monorepo)
cd packages/flitter-core && bun test    # Run core package tests
cd packages/flitter-amp && bun test     # Run amp package tests
bun test --coverage   # Run with coverage (only in flitter-core)
```

## Test File Organization

**Location:**
- **Colocated with source files** in `__tests__/` directories
- Pattern: `<module>/src/<directory>/__tests__/<module>.test.ts`

**Naming:**
- Test files follow `<module>.test.ts` pattern
- Examples:
  - `box-constraints.test.ts` (tests for `box-constraints.ts`)
  - `color.test.ts` (tests for `color.ts`)
  - `key.test.ts` (tests for `key.ts`)

**Structure:**
```
packages/flitter-core/src/
├── core/
│   ├── __tests__/
│   │   ├── box-constraints.test.ts
│   │   ├── color.test.ts
│   │   ├── key.test.ts
│   │   └── ...
│   ├── box-constraints.ts
│   ├── color.ts
│   ├── key.ts
│   └── ...
└── diagnostics/
    ├── __tests__/
    │   └── ...
    └── ...
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, test } from 'bun:test';
import { BoxConstraints } from '../box-constraints';
import { Size } from '../types';

describe('BoxConstraints', () => {
  describe('default constructor', () => {
    test('creates unconstrained when no args', () => {
      // Arrange & Act
      const c = new BoxConstraints();

      // Assert
      expect(c.minWidth).toBe(0);
      expect(c.minHeight).toBe(0);
      expect(c.maxWidth).toBe(Infinity);
      expect(c.maxHeight).toBe(Infinity);
    });
  });
});
```

**Patterns:**
- `describe()` for grouping related tests
- Nested `describe()` for sub-categories
- `test()` for individual test cases
- Clear "Arrange-Act-Assert" structure

**Setup pattern:**
- No explicit setup/teardown functions (tests are self-contained)
- All tests create fresh instances for each test case

## Mocking

**Framework:**
- Not explicitly configured
- Bun test supports mocking via `bun:test`'s mock functions
- Not heavily used in current tests

**Patterns:**
- No complex mocking patterns observed
- Tests primarily use real instances
- For terminal-specific tests, might need to mock `process.stdout`/`stdin`

**What to Mock:**
- External dependencies (if any)
- Terminal/screen operations (for widget tests)

**What NOT to Mock:**
- Core value types (Color, Size, Offset, BoxConstraints)
- Pure functions with no side effects

## Fixtures and Factories

**Test Data:**
```typescript
// Reuses existing constructors directly
test('tight constraints', () => {
  const c = BoxConstraints.tight(new Size(80, 24));
  expect(c.isTight).toBe(true);
});

// Creates test data inline
test('constrain size below minimum', () => {
  const c = new BoxConstraints({ minWidth: 10, minHeight: 10 });
  const result = c.constrain(new Size(5, 3));
  expect(result.width).toBe(10);
});
```

**Location:**
- Test data is created inline within test cases
- No separate fixture files or factories detected

## Coverage

**Requirements:**
- Target: >80% coverage on core modules (as stated in flitter-core's CLAUDE.md)
- Not explicitly enforced in config

**View Coverage:**
```bash
cd packages/flitter-core && bun test --coverage
```

## Test Types

**Unit Tests:**
- **Scope:** Tests individual classes and functions in isolation
- **Approach:** Direct instantiation and method calls
- **Examples:**
  - `box-constraints.test.ts` - tests BoxConstraints class
  - `color.test.ts` - tests Color class
  - `key.test.ts` - tests Key class

**Integration Tests:**
- **Scope:** Not explicitly separated from unit tests
- **Approach:** Tests interactions between multiple classes
- **Examples:** Color blending (blendColor function) tests

**E2E Tests:**
- **Framework:** Not implemented
- **Approach:** Would likely test entire widget hierarchy and terminal integration
- **Current state:** Not detected in codebase

## Common Patterns

**Async Testing:**
- Not heavily used in current tests (most operations are synchronous)
- Bun test supports `test('async', async () => {})` syntax

**Error Testing:**
```typescript
test('throws error when accessing r on non-rgb color', () => {
  const color = Color.black; // named color
  expect(() => color.r).toThrow();
});

test('invalid color index throws RangeError', () => {
  expect(() => Color.named(-1)).toThrow(RangeError);
  expect(() => Color.named(16)).toThrow(RangeError);
});
```

**Edge Case Testing:**
```typescript
describe('edge cases with Infinity', () => {
  test('constrain with Infinity max', () => {
    const c = new BoxConstraints();
    const result = c.constrain(new Size(999, 999));
    expect(result.width).toBe(999);
    expect(result.height).toBe(999);
  });
});
```

---

*Testing analysis: 2024-03-26*