# 欢迎界面不打折扣对齐 Spec

## Why

tmux session 实时对比（244×63 终端）+ 逆向源码分析（README.md Section 3）显示 Flitter 的欢迎界面与 Amp 官方在 3 个维度上存在可见差异：

1. **Orb 渲染技术不同** — 两者都是 Perlin noise 动画球体，但：
   - Amp 用 **ASCII 密度字符 ` .:-=+*#` + per-cell RGB 绿色渐变**（LeafRenderObjectWidget 直接操作 ScreenBuffer，40×40 格子）
   - Flitter 用 **Braille Unicode 字符 (U+2800) + RGB 绿色渐变**（Text+TextSpan 组合，80×80 点阵→40×20 字符）
   - 视觉差异：密度字符产生更平滑的灰度过渡感，Braille 是二值（有/无）
   - Amp 支持**鼠标点击冲击波**和**5 次点击爆炸**，Flitter 没有
2. **缺少 settings 提示** — Amp 有 "Use the settings: open in editor command to configure Amp"，Flitter 用每日名言替代
3. **输入框高度** — Amp 3 行（可多行输入），Flitter 1 行
4. **Skills badge** — Amp 输入框右上角有 `smart──⚠─7─skills`，Flitter 只有 `smart`

### 逆向源码实证

从 `README.md` Section 3 和 tmux ANSI escape 分析确认：

```
# Amp 官方 Orb (README.md Section 3.1)
Widget: $XH (StatefulWidget) → LeafRenderObjectWidget
Size: 40×40 characters (Lb=40, Ab=40)
Algorithm: Perlin noise (kd class, makeNoise2D)
Colors: Mode-specific — green(smart), gold(rush), amber(internal)
Rendering: per-cell color blending via ScreenBuffer
Mouse: Shockwave on click (Rd=1s, HXH=30 speed, $l=3 radius)
Easter egg: Explodes after 5 clicks (Hq=5) → replaced with SizedBox

# tmux ANSI escape 实测颜色范围（绿色 smart mode）
最暗: rgb(0, 55, 20)    — 边缘空格
最亮: rgb(0, 182, 94)   — 中心 * 字符
密度字符: 空格 . : - = + * #
```

```
# "Ctrl+O for help" 配色（README.md Section 3.4）
"Ctrl+O" → app.keybind → blue
" for help" → app.command → yellow
# 注意：与 Flitter 实现一致！（之前的 tmux capture 对比结论错误）
```

本轮目标：**从 Braille 渲染切换到 ASCII 密度字符渲染，增加鼠标交互，补齐缺失的 UI 元素**。

## What Changes

- **Orb 重写为 ASCII 密度字符 + per-cell RGB** — 新增 `DensityOrbWidget` (LeafRenderObjectWidget)，使用密度字符 ` .:-=+*#` + Perlin noise + 绿色渐变，支持鼠标冲击波和 5 次爆炸
- **保留 OrbWidget** — 标记 `@deprecated`，不删除
- **保留 GlowText** — 逆向确认 Amp 官方也使用 Perlin noise glow animation，与 Flitter 实现一致
- **保留 "Ctrl+O for help" 配色** — 逆向确认 Amp 官方是 blue+yellow，与 Flitter 实现一致
- **新增 settings 提示行** — Welcome screen 新增 "Use the settings: open in editor command to configure Amp"
- **输入框默认多行** — `submitWithMeta` 从 `false` 改为 `true`
- **Skills badge** — 输入框右上角追加 `──⚠─N─skills`

## Impact

- Affected code: `packages/flitter-amp/src/widgets/density-orb-widget.ts` (新增，LeafRenderObjectWidget)
- Affected code: `packages/flitter-amp/src/widgets/orb-widget.ts` (标记 @deprecated)
- Affected code: `packages/flitter-amp/src/widgets/chat-view.ts` (welcome screen: OrbWidget→DensityOrbWidget + settings 行)
- Affected code: `packages/flitter-amp/src/widgets/input-area.ts` (skills badge)
- Affected code: `packages/flitter-amp/src/widgets/bottom-grid.ts` (submitWithMeta + skillCount)
- Affected code: `packages/flitter-amp/src/app.ts` (传递 skillCount)
- Affected code: `packages/flitter-amp/src/state/app-state.ts` (skillCount 字段)
- Affected code: `packages/flitter-amp/src/__tests__/*.test.ts` (测试更新)

---

## ADDED Requirements

### Requirement: ASCII 密度字符 Orb — DensityOrbWidget

新增 `DensityOrbWidget` (LeafRenderObjectWidget) 在 `packages/flitter-amp/src/widgets/density-orb-widget.ts`。

**渲染架构：**
- 继承 `LeafRenderObjectWidget`，对应 `RenderDensityOrb` (LeafRenderObject)
- 在 `paint(context)` 中直接向 PaintContext/ScreenBuffer 写入字符+颜色
- 不使用 Text/TextSpan，直接操作 cell buffer

**渲染算法（匹配 Amp 官方 $XH）：**
- 格子尺寸: 40×40 字符（`cols=40, rows=40`，实际占 40 列 × 20 行因为终端字符高度 2:1）
  - 注意：实际终端占位 40 列 × 20 行（chars），但逻辑上是 40×40 的采样网格
- 8 级密度字符: ` .:-=+*#`（从空到最密）
- 椭圆遮罩: 归一化坐标 `nx=(x-cx)/rx, ny=(y-cy)/ry`，`dist = sqrt(nx²+ny²)`，dist>1 跳过
- Perlin noise: 使用 FBM (2D, 3 octaves)，`noise(x*scale + timeOffset, y*scale)`
- 密度映射: `noiseValue * edgeFade(1-dist)` → 量化到 8 级
- RGB 颜色: 绿色渐变，从暗绿 `rgb(0,55,20)` 到亮绿 `rgb(0,255,136)`（smart mode）
  - 颜色随密度级别插值
  - 支持 mode-specific colors（smart=green, rush=gold）
- 动画: 100ms/帧，`timeOffset += 0.06`

**鼠标交互（匹配 Amp 官方冲击波）：**
- 点击球体产生冲击波效果:
  - 从点击位置向外传播的环形波
  - 持续 1 秒（`shockwaveDuration=1`），传播速度 30（`propagationSpeed=30`），影响半径 3（`effectRadius=3`）
  - 波前处密度字符临时提升 1-2 级
- 5 次点击后球体"爆炸"（`maxClicks=5`）:
  - 播放爆炸动画（粒子扩散）
  - 替换为空 SizedBox
  - 触发 `onOrbExplode` callback

**占位尺寸：**
- intrinsicWidth: 40
- intrinsicHeight: 20（40 逻辑行 / 2，因为终端字符宽高比）

#### Scenario: 用户首次打开空对话
- **WHEN** conversation items 为空
- **THEN** 显示 ASCII 密度字符渲染的动画球体
- **THEN** 球体使用 ` .:-=+*#` 字符 + 绿色 RGB 渐变
- **THEN** 球体有 Perlin noise 流动动画

#### Scenario: 用户点击球体
- **WHEN** 用户点击球体区域
- **THEN** 从点击位置产生冲击波，向外扩散 1 秒
- **WHEN** 用户连续点击 5 次
- **THEN** 球体爆炸消失，替换为空白

### Requirement: Settings 提示行

在 Welcome screen 的文字区域新增一行提示文本。

**文本:** "Use the `settings: open in editor` command to configure Amp"
**位置:** 在 "Ctrl+O for help" 之后，每日名言之前
**样式:** 整体使用 `theme.base.mutedForeground`（灰色），其中 `settings: open in editor` 子串使用 `theme.base.foreground`

#### Scenario: 新用户看到配置提示
- **WHEN** 空对话的 Welcome screen 显示
- **THEN** "Use the settings: open in editor command to configure Amp" 文本可见

### Requirement: Skills / MCP Badge

在 InputArea 的 mode label 后追加 skills 状态标记。

**格式:** `smart──⚠─N─skills`（当有 skills 时）
**数据流:** `AppState.skillCount` → `BottomGrid` → `InputArea`
**颜色:** `⚠` 为 `theme.base.warning`（黄色），分隔线和文字为 `theme.base.mutedForeground`

#### Scenario: 有已安装 skills
- **WHEN** skillCount > 0
- **THEN** 输入框右上角显示 `smart──⚠─N─skills`

---

## MODIFIED Requirements

### Requirement: Welcome Screen 布局

修改 `chat-view.ts` 的 `buildWelcomeScreen()` 方法：

**OrbWidget 替换:**
- `new OrbWidget()` → `new DensityOrbWidget()`

**新增 settings 提示行（第三行）:**
在 "Ctrl+O for help" 之后、名言之前插入 settings 提示

**不变的部分（逆向确认一致）:**
- GlowText "Welcome to Amp" — 保留（Amp 官方也是 Perlin noise glow）
- "Ctrl+O"(blue) + "for help"(yellow) — 保留（逆向确认 keybind=blue, command=yellow）
- 每日名言 — 保留（Amp 官方有 30+ 条 typed suggestions，更丰富但概念一致）

**布局结构:**
```
Column (center, center)
  └── Row (min, center)
       ├── DensityOrbWidget (40×20 chars, 动画 ASCII 密度球 + 鼠标交互)
       ├── SizedBox(width: 2)
       └── Column (min, start)
            ├── GlowText "Welcome to Amp" (green, bold, Perlin glow) ← 保留
            ├── SizedBox(height: 1)
            ├── Text [Ctrl+O (blue) + " for help" (yellow)]           ← 保留
            ├── SizedBox(height: 1)
            ├── Text "Use the settings: ..." (gray, 部分 bold)        ← 新增
            ├── SizedBox(height: 1)
            └── Text (每日名言, dim italic)                            ← 保留
```

### Requirement: 输入框默认多行

- `submitWithMeta` 默认从 `false` 改为 `true`
- Enter → 换行，Ctrl+Enter → 提交

---

## REMOVED Requirements

### Requirement: Braille OrbWidget 从 Welcome Screen 移除
**Reason**: Amp 官方使用 ASCII 密度字符（非 Braille），虽然两者都是 Perlin noise 动画，但渲染字符集不同
**Migration**: 替换为 `DensityOrbWidget`。`OrbWidget` 不删除，添加 `@deprecated`

---

## Execution Guardrails — 质量门控与验证策略

### Gate 1: 静态类型安全
- **工具**: `pnpm -r run typecheck`
- **触发**: 每个 Task 完成后
- **标准**: 零错误

### Gate 2: 单元格级视觉断言
- **工具**: `bun test src/__tests__/visual-cell-assertions.test.ts`
- **需要修改的断言**:
  - 无（"Ctrl+O" blue / "for help" yellow 与现有断言一致）
- **需要新增的断言**:
  - "settings: open in editor" 文本存在
  - DensityOrbWidget 的密度字符 (`. : - = + * #`) 存在于 grid 左半区
  - 密度字符有 RGB 绿色 foreground
  - Skills badge `⚠` 字符存在且为 WARNING 色（skillCount>0 场景）

### Gate 3: Widget 树结构断言
- **工具**: `bun test src/__tests__/chat-view.test.ts`
- **需要修改**:
  - "OrbWidget" → "DensityOrbWidget"
- **需要新增**:
  - Welcome screen textContent Column 有 4 个文本/widget 子节点

### Gate 4: SVG 快照
- **工具**: `bun test src/__tests__/visual-snapshot.test.ts`
- **影响**: `welcome-*.svg` 将更新
- **验证**: 浏览器打开 SVG 人工检查

### Gate 5: 布局守卫
- **工具**: `bun test src/__tests__/layout-guardrails.test.ts` + `app-layout.test.ts`
- **标准**: 零修改通过

### Gate 6: tmux 终端对比
- **工具**: `bun run src/test-utils/tmux-harness.ts --scenario welcome`
- **标准**: 与 amp session 对比——球体为 ASCII 密度字符+绿色渐变、有动画
- **ANSI escape 验证**: `tmux capture-pane -t flitter -p -e | head -30` 确认 `^[[38;2;R;G;B;m` 颜色码范围在绿色区间

### Gate 执行序列
```
Task 1 完成 → Gate 1
Task 2 完成 → Gate 1 → Gate 2 + Gate 3
Task 3 完成 → Gate 1
Task 4 完成 → Gate 1 → Gate 2
全部完成 → Gate 4 → Gate 5 → Gate 6
```
