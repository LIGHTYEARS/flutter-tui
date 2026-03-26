# Coding Conventions

**Analysis Date:** 2024-03-26

## Naming Patterns

**Files:**
- `.ts` files use snake_case or kebab-case: `box-constraints.ts`, `text-span.test.ts`
- Test files are colocated in `__tests__/` directories
- Test file naming: `<module>.test.ts` (e.g., `box-constraints.test.ts`)

**Functions:**
- Exported functions: camelCase (e.g., `buildAnsi256Table`, `findNearestAnsi256`)
- Private helpers: camelCase (e.g., `roundOrInf`, `clamp`)
- Methods: camelCase (e.g., `toSgrFg`, `withAlpha`)

**Variables:**
- Private fields: camelCase with underscore prefix for caches (e.g., `rgbToAnsi256Cache`)
- Constants: UPPER_SNAKE_CASE (e.g., `ANSI256_TO_RGB`)
- Static properties: PascalCase (e.g., `Color.black`, `Size.zero`)

**Types:**
- Classes/Types: PascalCase (e.g., `BoxConstraints`, `Color`, `Offset`)
- Interfaces: PascalCase with "I" prefix or plain PascalCase (e.g., `ClientCallbacks`, `SessionUpdate`)
- Type aliases: PascalCase (e.g., `ColorMode`)
- Enums: PascalCase (not detected in this codebase)

## Code Style

**Formatting:**
- Not explicitly configured in root; relies on Bun's default or editor settings
- 2-space or 4-space indentation (observed 2-space in most files)
- Lines generally under 80 characters

**Linting:**
- No ESLint or Prettier config detected in root
- Uses TypeScript strict mode (implied by `tsconfig.json`)

## Import Organization

**Order:**
1. Built-in modules (e.g., `node:fs/promises`)
2. Local modules (relative paths)

**Path Aliases:**
- Not configured in tsconfig.json
- Uses relative paths: `../box-constraints`, `../utils/logger`

## Error Handling

**Patterns:**
- Throws explicit errors for invalid operations:
  ```typescript
  if (this.mode !== 'rgb') throw new Error('r is only available on rgb colors');
  ```
- RangeError for invalid numerical inputs:
  ```typescript
  if (index < 0 || index > 15) {
    throw new RangeError(`Named color index must be 0-15, got ${index}`);
  }
  ```
- Defensive programming with clamping:
  ```typescript
  r = Math.max(0, Math.min(255, Math.round(r)));
  ```

## Logging

**Framework:**
- `console` (for debugging)
- Custom logger in `flitter-amp` (`../utils/logger`)

**Patterns:**
- Simple logging functions (not detailed patterns observed)

## Comments

**When to Comment:**
- File headers explain purpose and Amp reference
- Method comments document behavior, parameters, and return values
- Amp reference comments: `// Amp ref: amp-strings.txt — w0 Color type`
- Helper function comments explain complex logic

**JSDoc/TSDoc:**
- Uses TSDoc-style comments for classes and methods:
  ```typescript
  /**
   * Represents a terminal color supporting Named (16), Ansi256, and TrueColor modes.
   * Immutable value type that produces SGR escape sequence parameters.
   */
  export class Color {
    // ...
  }
  ```

## Function Design

**Size:**
- Keep functions focused (single responsibility)
- Helper functions extracted for complex operations (e.g., `roundOrInf`, `findNearestAnsi256`)

**Parameters:**
- Use options objects for constructors with >2 parameters:
  ```typescript
  constructor(opts?: { width?: number; height?: number })
  ```

**Return Values:**
- Immutable objects (all classes are immutable)
- Returns new instances instead of mutating:
  ```typescript
  withAlpha(alpha: number): Color {
    return new Color(this.mode, this.value, alpha);
  }
  ```

## Module Design

**Exports:**
- Classes and functions directly exported:
  ```typescript
  export class BoxConstraints { /* ... */ }
  export function blendColor(front: Color, back: Color): Color { /* ... */ }
  ```
- Interfaces exported for type definitions

**Barrel Files:**
- `src/index.ts` serves as entry point barrel file
- Not widely used in other modules

---

*Convention analysis: 2024-03-26*