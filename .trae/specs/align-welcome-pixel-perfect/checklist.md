# Checklist — 欢迎界面不打折扣对齐

> 每个条目格式：`[目标描述]` → `验证方法`。
> 标注 **现状** 和 **目标** 帮助识别变更范围。

## Orb 渲染
> **现状**：Braille Unicode 字符(⣰⣿⣾⢿)，绿色渐变 rgb(0,140,70)→rgb(0,255,136)，40×20 字符，100ms Perlin noise 动画，无鼠标交互
> **目标**：ASCII 密度字符(` .:-=+*#`)，绿色渐变 rgb(0,55,20)→rgb(0,255,136)，40×20 字符，100ms Perlin noise 动画，鼠标冲击波+5次爆炸
> **依据**：逆向源码 README.md Section 3.1 + tmux ANSI escape 实测

- [x] `density-orb-widget.ts` 存在且导出 `DensityOrbWidget` → `rg "export class DensityOrbWidget" packages/flitter-amp/src/widgets/`
- [x] 使用密度字符 ` .:-=+*#` 渲染（非 Braille U+2800）→ `rg "0x2800" density-orb-widget.ts` 应无匹配
- [x] 使用 StatefulWidget + Text/TextSpan 实现 per-cell 渲染（与 OrbWidget 同模式）→ `rg "StatefulWidget" density-orb-widget.ts`
- [x] 球体有 Perlin noise 动画（非静态）→ `rg "setInterval\|timer" density-orb-widget.ts` 应有匹配
- [x] 每个 cell 有独立 RGB 绿色（per-cell color）→ `rg "rgb\|Color.rgb" density-orb-widget.ts`
- [x] 颜色范围从暗绿到亮绿 → Color.rgb(0,55,20) 和 Color.rgb(0,255,136) 常量确认
- [x] 球体尺寸 ~40 列 × ~20 行 → `rg "40\|20" density-orb-widget.ts` 确认常量
- [x] 鼠标点击产生冲击波 → `rg "shockwave\|Shockwave\|onTap\|MouseRegion" density-orb-widget.ts`
- [x] 5 次点击后爆炸 → `rg "maxClicks\|clickCount\|explode" density-orb-widget.ts`
- [x] `OrbWidget` 添加 `@deprecated` → `rg "@deprecated" orb-widget.ts`

## Welcome Screen 布局
> **现状**：OrbWidget(Braille) + GlowText + Ctrl+O(blue)+for help(yellow) + 每日名言(3行文字)
> **目标**：DensityOrbWidget(ASCII密度) + GlowText(保留!) + Ctrl+O(blue保留!)+for help(yellow保留!) + settings提示 + 每日名言(4行文字)
> **依据**：逆向源码 README.md Section 3.2/3.4 确认 GlowText 和配色与 Flitter 一致

- [x] `buildWelcomeScreen()` 使用 `DensityOrbWidget` → `rg "DensityOrbWidget" chat-view.ts`
- [x] GlowText "Welcome to Amp" 保留 → `rg "GlowText" chat-view.ts` 在 buildWelcomeScreen 中仍有匹配
- [x] "Ctrl+O" 保持蓝色（keybind）→ 现有测试断言通过（102 pass, 0 fail）
- [x] "for help" 保持黄色（command/warning）→ 现有测试断言通过（102 pass, 0 fail）
- [x] 新增 "Use the settings: open in editor command to configure Amp" → `findTextOnce(grid, 'settings: open in editor')` 测试通过
- [x] "settings: open in editor" 子串使用 foreground 色 → chat-view.ts 中使用 fgColor 确认
- [x] 每日名言保留在最后一行 → 现有名言测试断言通过（102 pass, 0 fail）

## 输入框
> **现状**：submitWithMeta=false, maxLines=1, Enter提交
> **目标**：submitWithMeta=true, maxLines=undefined, Enter换行+Ctrl+Enter提交

- [x] `submitWithMeta` 传值 `true` → `rg "submitWithMeta" bottom-grid.ts` 确认默认值为 true
- [x] maxLines 非 1 → InputArea 中 `submitWithMeta=true` 分支 maxLines=undefined（已有逻辑）

## Skills Badge
> **现状**：不存在 skillCount，不存在 skills badge
> **目标**：AppState.skillCount → BottomGrid → InputArea → `smart──⚠─N─skills`

- [x] `AppState` 含 `skillCount` → `rg "skillCount" app-state.ts`
- [x] `BottomGrid` 接受并传递 `skillCount` → `rg "skillCount" bottom-grid.ts`
- [x] `InputArea` 接受 `skillCount` → `rg "skillCount" input-area.ts`
- [x] skillCount>0 时追加 `──⚠─N─skills` → visual-cell-assertions 验证通过
- [x] `⚠` 为 WARNING 色 → `assertStyleAt(grid, pos.x, pos.y, { fg: WARNING })` 测试通过
- [x] skillCount=0 时无 `skills` → `findText(grid, 'skills').length === 0` 测试通过

## Execution Gates

### Gate 1: 静态类型安全
- [x] `pnpm -r run typecheck` 零新增错误（flitter-core 预存错误为未使用变量）

### Gate 2: 单元格级视觉断言
- [x] `bun test src/__tests__/visual-cell-assertions.test.ts` 全部通过
- [x] 新增断言: "settings: open in editor" 文本存在
- [x] 新增断言: 密度字符 `# * + = - : .` 存在于 welcome grid
- [x] 新增断言: skillCount=7 时 `⚠` 存在且 WARNING 色

### Gate 3: Widget 树结构断言
- [x] `bun test src/__tests__/chat-view.test.ts` 全部通过
- [x] "OrbWidget" 描述更新为 "DensityOrbWidget"

### Gate 4: SVG 快照
- [x] `bun test src/__tests__/visual-snapshot.test.ts` 全部通过
- [ ] `welcome-120x40.svg` 人工可见 ASCII 密度字符球体 + 绿色渐变（需人工确认）

### Gate 5: 布局守卫
- [x] `bun test src/__tests__/layout-guardrails.test.ts` 全部通过（零修改）
- [x] `bun test src/__tests__/app-layout.test.ts` 全部通过（零修改）

### Gate 6: 全量回归
- [x] `cd packages/flitter-amp && bun test` → 102 pass, 0 fail
- [x] `cd packages/flitter-core && bun test` → 2808 pass, 0 fail

### Gate 7: tmux 终端对比
- [ ] `bun run src/test-utils/tmux-harness.ts --scenario welcome` 成功启动（需实际终端运行）
- [ ] 对比 amp session: 球体为 ASCII 密度字符 + 绿色 per-cell 渐变（需人工确认）
- [ ] 对比 amp session: 球体有 Perlin noise 流动动画（需人工确认）
- [ ] 对比 amp session: 球体点击产生冲击波效果（需人工确认）
- [ ] `tmux capture-pane -t flitter -p -e | rg '38;2;0;'` 确认绿色 RGB 范围（需实际终端运行）
