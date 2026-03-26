# Amp Widget Tree Skeleton Spec

> G1 Guardrail Document — Phase 8 Layout Fidelity
> Generated from reverse-engineered Amp CLI source + flitter-core constraint analysis

## 1. Root Constraint Chain

### How constraints flow from terminal → root → children

```
Terminal (e.g. 120 cols × 40 rows)
  │
  ▼ PipelineOwner.updateRootConstraints()
  │   Creates LOOSE constraints: BoxConstraints(w: 0..120, h: 0..40)
  │   NOTE: First frame uses tight constraints, but subsequent frames use LOOSE
  │
  ▼ Root Column (mainAxisSize: 'max', crossAxisAlignment: 'stretch')
  │   mainSize = constraints.maxHeight = 40 (fills terminal height)
  │   crossSize = constraints.maxWidth = 120 (fills terminal width)
  │   crossAxisAlignment 'stretch' → children get tight width (minW=maxW=120)
  │
  ├─▼ Expanded (flex:1) → Row (crossAxisAlignment: 'stretch')
  │   │ Gets tight height = freeSpace (40 - inputHeight - statusHeight)
  │   │ Gets tight width = 120 (from stretch)
  │   │
  │   ├─▼ Expanded → SingleChildScrollView (vertical)
  │   │   │ Gets tight height from Expanded
  │   │   │ Gets tight width = remaining (120 - 1 for scrollbar)
  │   │   │ Passes to child: UNBOUNDED height, same width
  │   │   │
  │   │   └─▼ Padding(left:2, right:2, bottom:1)
  │   │       └─▼ ChatView
  │   │           Width available: 120 - 1(scrollbar) - 4(padding) = 115
  │   │           Height: UNBOUNDED (inside scroll view)
  │   │
  │   └─▼ Scrollbar (intrinsic width: 1 col)
  │       Gets tight height from Row's stretch
  │
  ├─▼ InputArea (non-flex child)
  │   │ Gets from Column: tight width=120 (stretch), unbounded height
  │   │ minHeight:3 from BoxConstraints → actual height = max(3, content)
  │   │
  │   └─▼ Container(border:rounded, padding:horiz:1, minHeight:3)
  │       └─▼ TextField(autofocus:true)
  │
  └─▼ StatusBar (non-flex child)
      │ Gets from Column: tight width=120 (stretch), unbounded height
      │ Height: 1 row (single line of text + padding)
      │
      └─▼ Padding(horizontal:1)
          └─▼ Row (Expanded(left) + right)
```

### Critical Layout Rules

| Rule | Value | Source |
|------|-------|--------|
| Root constraints (after frame 1) | LOOSE (min=0) | `PipelineOwner.updateRootConstraints()` |
| Column default crossAxisAlignment | `'center'` | `flex.ts:48` — **MUST override to 'stretch'** |
| Column mainAxisSize:'max' with finite constraints | fills to maxMain | `render-flex.ts:443-445` |
| Expanded fit | `'tight'` | Forces child to exactly fill allocated space |
| ScrollView child gets | UNBOUNDED main axis | `scroll-view.ts:295-300` |
| Stack fit:'expand' | tight to parent max | Forces non-positioned children to fill |

---

## 2. Amp Reference Layout (from reverse-engineered source)

### Amp Root Build Method

```
Column (mainAxisSize: max)
  ├── Expanded
  │   └── Row (crossAxisAlignment: stretch)     ← KEY: stretch, not center
  │       ├── Expanded
  │       │   └── Padding (left:2, right:2-3, bottom:1)
  │       │       └── ScrollView (position: "bottom")
  │       │           └── Column (items + spacers)
  │       └── Scrollbar (thickness:1)
  │             thumbColor: app.scrollbarThumb (foreground/white)
  │             trackColor: app.scrollbarTrack (index(8)/dark gray)
  ├── F0H PromptBar
  │   └── qt (OverlayTexts, overlayGroupSpacing:2)
  │       └── jD (Stack)
  │           └── jJH (custom RenderObject with border)
  │               ├── Padding (horizontal:1, vertical:0)
  │               │   └── TextField (the input)
  │               ├── rightChild1 (optional)
  │               └── rightChild2 (optional)
  │           [overlayTexts as border labels: "smart" at bottom-right]
  └── Footer Row
      └── [spinner] [status text] ... [cwd] [(branch)]
```

### Amp vs Our Implementation — Constraint Chain Diff

| Layer | Amp | Our Implementation | Bug? |
|-------|-----|-------------------|------|
| Root Column | mainAxisSize:'max' | mainAxisSize:'max' ✅ | — |
| Root Column crossAxis | **IMPLICIT 'stretch'** (Amp uses custom border render that stretches) | `crossAxisAlignment:'stretch'` ✅ | Fixed |
| Inner Row crossAxis | `'stretch'` | `'stretch'` ✅ | Fixed |
| ScrollView child | Column with `mainAxisSize:'min'` (content-sized, scrollable) | Column with `mainAxisSize:'min'` ✅ | — |
| Welcome Screen outer Column | `mainAxisAlignment:'center'`, `crossAxisAlignment:'center'` | Same ✅ | — |
| Welcome Screen outer Column mainAxisSize | **KEY: inside ScrollView, gets unbounded height** | Same issue — `mainAxisAlignment:'center'` has NO effect with unbounded height | **BUG** |
| InputArea F0H | Custom `jJH` RenderObject handles border+constraints | Container with BoxConstraints(minHeight:3) | Approximate ✅ |
| InputArea border | `borderColor: theme.colorScheme.border` (default/gray), `borderStyle:"rounded"` | `brightBlack`, `rounded` ✅ | Close |
| InputArea overlayTexts | Mode label at `bottom-right` on border via `qt` overlay system | Stack+Positioned ✅ | — |
| StatusBar | Row(mainAxisSize:'min') + composited spans | Row (default mainAxisSize) ✅ | — |

---

## 3. Identified Layout Bugs (Current Implementation)

### BUG-1: Welcome Screen Cannot Center Vertically

**Root Cause**: The ChatView `buildWelcomeScreen()` returns:
```typescript
Column(mainAxisAlignment: 'center', crossAxisAlignment: 'center', children: [welcomeRow])
```

This Column is a child of `SingleChildScrollView`, which gives it **UNBOUNDED height** (`maxHeight: Infinity`). With unbounded height:
- `mainAxisSize: 'max'` uses `Number.isFinite(Infinity) === false`, so falls back to `allocatedSize` (content height)
- Column height = content height → `mainAxisAlignment: 'center'` has no effect because there is no extra space

**Amp Solution**: Amp likely wraps the welcome screen differently — either:
1. The welcome screen is rendered OUTSIDE the scroll view (special case), OR
2. The scroll view explicitly uses viewport height for centering

**Fix Options**:
- **Option A**: When items are empty, bypass the ScrollView entirely and render a `Center` widget directly
- **Option B**: Use `SizedBox.expand()` inside the scroll view to force the Column to fill viewport height (but this requires knowing viewport height)
- **Option C (recommended)**: Conditionally render: if no messages, use a non-scrollable centered layout; if messages exist, use the scroll view

### BUG-2: Assistant Message Column Uses crossAxisAlignment:'stretch' (Amp does too)

The `XkL` function in Amp creates:
```javascript
s$ (Column, crossAxisAlignment="stretch", mainAxisSize="min")
  ht (Markdown widget)
```

Our ChatView conversation Column uses `crossAxisAlignment: 'start'`. For markdown content this mostly doesn't matter (text wraps to available width), but for code blocks or other block-level elements, `'stretch'` ensures they fill the full width.

**Fix**: Change conversation Column's `crossAxisAlignment` from `'start'` to `'stretch'`.

### BUG-3: (Potential) Root Constraints Become Loose After First Frame

**Root Cause**: `PipelineOwner.updateRootConstraints()` creates LOOSE constraints:
```typescript
BoxConstraints({ minWidth: 0, maxWidth: cols, minHeight: 0, maxHeight: rows })
```

With the outer Column using `mainAxisSize: 'max'`, this isn't actually a problem for height (it uses maxHeight). And with `crossAxisAlignment: 'stretch'`, children get tight width constraints. So this is NOT a current bug — but it's an important constraint to document.

---

## 4. Per-Area Layout Specification

### 4.1 Welcome Screen (Empty State)

**Amp Layout**:
```
Row (mainAxisAlignment:center, crossAxisAlignment:center, mainAxisSize:min)
  ├── Orb (40×14 chars, animated WebGL sphere — we use ASCII art)
  ├── SizedBox(width:2)
  └── SizedBox(width:50)
      └── Column (crossAxisAlignment:start)
          ├── Text("Welcome to Amp", green bold, glow animation)
          ├── SizedBox(height:1)
          ├── Text: "Ctrl+O" blue + " for " dim + "help" yellow
          ├── SizedBox(height:1)
          └── Text(quote, dim italic)
```

**Required Properties**:
- Row: `mainAxisSize:'min'`, `crossAxisAlignment:'center'`
- Text Column: `crossAxisAlignment:'start'`, `mainAxisSize:'min'`
- Text Column width: constrained to ~50 chars (Amp uses `SizedBox(width:50)`)
- **Centering**: Must be centered in viewport (both horizontal and vertical)

### 4.2 Conversation View (With Messages)

**Amp Layout**:
```
Column (crossAxisAlignment: "stretch", mainAxisSize: "min")
  [for each message, SizedBox(height:1) spacer between]:
    user_message: Container(border:left-only green 2px, padding:left:1)
                    Text(green, italic) — NO label
    assistant_message: Column(crossAxisAlignment:"stretch", mainAxisSize:"min")
                         Markdown(text) — NO border, NO label
    tool_call: Column(crossAxisAlignment:"start")
                 Row(icon + toolName bold + detail dim) — single line, maxLines:1
                 [expanded content if not collapsed]
    thinking: Column(crossAxisAlignment:"start")
                Row(spinner/icon + "Thinking" + chevron)
                [expanded content if not collapsed: Padding(left:2) Markdown]
```

**Required Properties**:
- Outer Column: `crossAxisAlignment: 'stretch'` (NOT 'start')
- `mainAxisSize: 'min'` (content-sized inside scroll view)
- Message spacer: `SizedBox(height:1)` between items
- User message: left border only (green, width 2, solid), no label
- Assistant message: no border, no label, stretch cross-axis

### 4.3 Input Area (PromptBar)

**Amp Layout (F0H)**:
```
qt (OverlayTexts wrapper, overlayGroupSpacing:2)
  Stack (jD)
    jJH (custom render: rounded border, background fill)
      Padding(horizontal:1, vertical:0)
        TextField
    [optional overlayLayer]
    [resize handle: Positioned(top:0) MouseRegion(cursor:NS_RESIZE) SizedBox(height:1)]
  [border text overlays]: mode label at bottom-right, skill count
```

**Required Properties**:
- Border: `rounded`, `borderColor: theme.colorScheme.border` (falls back to default/gray)
- Background: `theme.colorScheme.background` (transparent/none in terminal)
- Inner padding: `horizontal: 1, vertical: 0`
- Mode label: positioned on border at bottom-right
- TextField: single-line by default, expandable to multi-line
- MinHeight: ~3 rows (border + 1 line content + border)

### 4.4 Status Bar (Footer)

**Amp Layout**:
```
Row (mainAxisSize: "min")
  [optional spinner: wave animation "∼≈≋≈∼" in primary/blue, 200ms]
  ft.horizontal(1) spacer
  [status text based on state]:
    idle: "? for shortcuts" — "?" in keybind/blue, rest dim
    executing: "Executing [command]..." — verb in command/yellow
    streaming: "Streaming response..." — simple text
    etc.
  [spacer]
  [right side: cwd + (branch), dim]
```

**Required Properties**:
- "?" in keybind color (blue)
- " for shortcuts" in dim
- Spinner: wave pattern ` ∼≈≋≈∼`, 200ms cycle, primary color when active
- Right side: shortened cwd `~/...` + ` (branch)` in dim foreground
- Full width: Expanded on left, fixed on right

---

## 5. Constraint Propagation Checklist

For each widget in the tree, verify:

- [ ] **Root Column**: `mainAxisSize:'max'`, `crossAxisAlignment:'stretch'`
- [ ] **Expanded(Row)**: Row gets tight height from Column flex allocation, tight width from stretch
- [ ] **Row**: `crossAxisAlignment:'stretch'` — Scrollbar and ScrollView fill full height
- [ ] **Expanded(ScrollView)**: ScrollView gets tight height, passes UNBOUNDED height to child
- [ ] **Welcome screen**: Centered in viewport (NOT inside scroll view when empty)
- [ ] **Conversation Column**: `crossAxisAlignment:'stretch'` (not 'start'), `mainAxisSize:'min'`
- [ ] **InputArea**: Full width (from Column stretch), `minHeight:3` constraint
- [ ] **StatusBar**: Full width (from Column stretch), 1 row height
- [ ] **Overlay Stacks**: `fit:'expand'` for full-screen modals
