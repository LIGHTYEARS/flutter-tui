# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Flutter-faithful TUI framework with three-tree architecture

**Key Characteristics:**
- Widget, Element, RenderObject three-tree architecture (matching Flutter)
- Declarative widget composition
- Box-constraint based layout system
- 60fps cell-level diff rendering
- Double-buffered terminal output
- Focus and input management system
- Frame scheduling and pipeline execution

## Layers

**Core Primitives:**
- Purpose: Foundation types and utilities for the entire framework
- Location: `packages/flitter-core/src/core/`
- Contains: Types (Offset, Size, Rect), Color, TextStyle, TextSpan, BoxConstraints, Key
- Depends on: None (zero transitive runtime dependencies)
- Used by: All other layers

**Framework:**
- Purpose: Widget lifecycle and element management
- Location: `packages/flitter-core/src/framework/`
- Contains: Widget, Element, RenderObject hierarchies, BuildOwner, PipelineOwner, WidgetsBinding
- Depends on: Core Primitives
- Used by: Widgets, Scheduler, Input, Terminal

**Rendering & Layout:**
- Purpose: Layout calculation and rendering pipeline
- Location: `packages/flitter-core/src/layout/`, `packages/flitter-core/src/terminal/`
- Contains: Layout managers (flex, box), ScreenBuffer, TerminalManager, diff algorithm
- Depends on: Framework, Core Primitives
- Used by: Widgets, Scheduler

**Scheduler:**
- Purpose: Frame scheduling and pipeline execution
- Location: `packages/flitter-core/src/scheduler/`
- Contains: FrameScheduler, timing and animation management
- Depends on: Framework
- Used by: Framework, Widgets

**Input System:**
- Purpose: Keyboard and mouse input handling
- Location: `packages/flitter-core/src/input/`
- Contains: Input parsing, FocusManager, event dispatch
- Depends on: Framework
- Used by: Widgets

**Widgets:**
- Purpose: UI components for building applications
- Location: `packages/flitter-core/src/widgets/`
- Contains: Built-in widgets (Text, Container, Flex, ScrollView, Dialog, etc.)
- Depends on: Framework, Layout, Core Primitives
- Used by: Application layer

**Diagnostics:**
- Purpose: Debugging and performance profiling tools
- Location: `packages/flitter-core/src/diagnostics/`
- Contains: DebugInspector, PerformanceOverlay
- Depends on: Framework, Widgets
- Used by: Development/debugging

## Data Flow

**Widget Lifecycle:**

1. Widget instantiation - User creates widget hierarchy
2. Element creation - WidgetsBinding inflates widgets to elements
3. RenderObject creation - Elements create corresponding render objects
4. Layout - Render objects calculate sizes and positions
5. Paint - Render objects draw to screen buffer
6. Composite - Screen buffer diffs and updates terminal

**State Management:**
- Widget state is managed via StatefulWidget and State classes
- setState() triggers rebuild of widget subtree
- BuildOwner manages dirty elements and scheduling

## Key Abstractions

**Widget:**
- Purpose: Immutable UI configuration
- Examples: `packages/flitter-core/src/framework/widget.ts`, `packages/flitter-core/src/widgets/text.ts`
- Pattern: Base class with build() method for stateless, createState() for stateful

**Element:**
- Purpose: Widget instance handle and lifecycle manager
- Examples: `packages/flitter-core/src/framework/element.ts`
- Pattern: Binds widget to render object, manages rebuilds

**RenderObject:**
- Purpose: Layout and painting logic
- Examples: `packages/flitter-core/src/framework/render-object.ts`, `packages/flitter-core/src/widgets/text.ts`
- Pattern: Handles constraints, layout, paint, hit testing

**WidgetsBinding (J3):**
- Purpose: Central singleton managing framework lifecycle
- Examples: `packages/flitter-core/src/framework/binding.ts`
- Pattern: Owns TerminalManager, BuildOwner, PipelineOwner, FrameScheduler

## Entry Points

**runApp:**
- Location: `packages/flitter-core/src/framework/binding.ts`
- Triggers: Application initialization
- Responsibilities: Inflates root widget, initializes terminal, starts event loop

**flitter-amp CLI:**
- Location: `packages/flitter-amp/src/index.ts`
- Triggers: Command-line execution
- Responsibilities: Parses config, connects to ACP agent, starts TUI

## Error Handling

**Strategy:** Exception-based error handling with debugging support

**Patterns:**
- Widget build errors caught by BuildOwner
- DebugInspector provides widget tree inspection
- Error messages logged to console

## Cross-Cutting Concerns

**Logging:** Custom logger (console-based)
**Validation:** TypeScript type checking
**Authentication:** Not applicable (TUI framework)

---

*Architecture analysis: 2026-03-26*