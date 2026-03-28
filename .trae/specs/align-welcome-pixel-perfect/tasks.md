# Tasks

## Task 1: 新增 DensityOrbWidget — ASCII 密度字符动画球体 (LeafRenderObjectWidget) ✅
- [x] SubTask 1.1: 研究 flitter-core 的 LeafRenderObjectWidget API
  - 阅读 `flitter-core/src/widgets/leaf-render-object-widget.ts` 和已有的 LeafRenderObjectWidget 用例
  - 确认 `paint(context)` 中写入 ScreenBuffer 的 API（putCell / writeChar 等）
- [x] SubTask 1.2: 创建 `density-orb-widget.ts`，实现 `DensityOrbWidget` + `RenderDensityOrb`
  - Widget 层: StatefulWidget（管理 timer + 点击计数 + 冲击波状态）
  - RenderObject 层: LeafRenderObject，在 `paint()` 中逐 cell 写入密度字符 + RGB 颜色
  - 格子: 40 列 × 20 行终端字符（逻辑上 40×40 采样点，Y 方向 2:1 压缩）
  - 8 级密度字符: ` .:-=+*#`
  - Perlin noise FBM (3 octaves) + 椭圆遮罩 + edgeFade
  - RGB 颜色渐变: `rgb(0,55,20)` → `rgb(0,255,136)`（smart mode），随密度级别插值
  - 动画: setInterval 100ms, timeOffset += 0.06
- [x] SubTask 1.3: 实现鼠标点击冲击波
  - MouseRegion 包裹，onTap 记录点击位置
  - 冲击波: 从点击点向外传播的环形波（1秒持续，速度30，半径3）
  - 波前处密度临时提升 1-2 级
- [x] SubTask 1.4: 实现 5 次点击爆炸
  - 计数器 clickCount++，达到 5 时触发爆炸
  - 爆炸动画（粒子扩散 ~0.5s）→ 替换为 SizedBox
  - 可选 onOrbExplode callback
- [x] **Gate 1** ✅ `pnpm -r run typecheck` → 零新增错误

## Task 2: 修改 Welcome Screen — DensityOrb 替换 + settings 提示行 ✅
- [x] SubTask 2.1: 在 `chat-view.ts` 中 `new OrbWidget()` → `new DensityOrbWidget()`，更新 import
- [x] SubTask 2.2: 在 "Ctrl+O for help" 之后新增 Text 行:
  - "Use the " (mutedForeground) + "settings: open in editor" (foreground) + " command to configure Amp" (mutedForeground)
  - 前后加 SizedBox(height:1)
- [x] SubTask 2.3: 保留 GlowText、保留 "Ctrl+O" blue / "for help" yellow（逆向确认一致）
- [x] **Gate 1** ✅ `pnpm -r run typecheck` → 零错误
- [x] **Gate 2** ✅ 更新 `visual-cell-assertions.test.ts`:
  - 新增断言: `findTextOnce(grid, 'settings: open in editor')` 存在
  - 新增断言: 密度字符 (`#` `*` `+` `=` `-` `:` `.`) 存在于 grid 左半区
  - 新增断言: 密度字符的 fg color 在绿色 RGB 范围内
- [x] **Gate 3** ✅ 更新 `chat-view.test.ts`:
  - "OrbWidget" → "DensityOrbWidget" 描述更新
  - 新增: textContent Column 有 4 个文本/widget 子节点（标题+ctrl+settings+名言）
- [x] 运行 `bun test src/__tests__/visual-cell-assertions.test.ts src/__tests__/chat-view.test.ts` → 全部通过

## Task 3: 输入框默认多行 ✅
- [x] SubTask 3.1: `bottom-grid.ts` 中 `submitWithMeta` 改为 `true`
- [x] SubTask 3.2: 验证 Enter 换行 / Ctrl+Enter 提交
- [x] **Gate 1** ✅ `pnpm -r run typecheck` → 零错误

## Task 4: Skills Badge 显示 ✅
- [x] SubTask 4.1: `app-state.ts` 新增 `skillCount: number = 0`
- [x] SubTask 4.2: `BottomGrid` 新增 `skillCount?: number` prop → 传递给 `InputArea`
- [x] SubTask 4.3: `InputArea` 新增 `skillCount?: number` prop
- [x] SubTask 4.4: `InputArea` mode label 渲染: skillCount>0 时追加 `──⚠─N─skills` TextSpan
  - `──` 和 `─` 和 `skills` 为 mutedForeground
  - `⚠` 为 warning 色
  - `N` 为 skillCount 数字，mutedForeground
- [x] SubTask 4.5: `app.ts` 将 `appState.skillCount` 传递给 `BottomGrid`
- [x] **Gate 1** ✅ `pnpm -r run typecheck` → 零错误
- [x] **Gate 2** ✅ 在 `visual-cell-assertions.test.ts` 新增:
  - skillCount=7 时 `⚠` 存在且 WARNING 色
  - skillCount=0 时无 `skills` 文本
- [x] 运行 `bun test src/__tests__/visual-cell-assertions.test.ts` → 全部通过

## Task 5: OrbWidget 标记 @deprecated ✅
- [x] SubTask 5.1: `orb-widget.ts` 的 `OrbWidget` class 添加 `@deprecated` JSDoc

## Task 6: 全量回归验证 ✅
- [x] SubTask 6.1: `pnpm -r run typecheck` → 零新增错误（Gate 1 全量）
- [x] SubTask 6.2: `cd packages/flitter-amp && bun test` → 102 pass, 0 fail（Gate 2+3+4）
- [x] SubTask 6.3: `cd packages/flitter-core && bun test` → 2808 pass, 0 fail（Gate 5 布局守卫）
- [ ] SubTask 6.4: 打开 `welcome-120x40.svg` 和 `welcome-80x24.svg` 人工确认（Gate 4）
- [ ] SubTask 6.5: `bun run src/test-utils/tmux-harness.ts --scenario welcome` → tmux 对比（Gate 6）

# Task Dependencies
- [Task 1] 无依赖，但是最大的工作量（LeafRenderObjectWidget + 鼠标交互）
- [Task 2] 依赖 [Task 1]（需要 DensityOrbWidget）
- [Task 3] 无依赖，可与 Task 1 并行
- [Task 4] 无依赖，可与 Task 1 并行
- [Task 5] 无依赖，可与 Task 1 并行
- [Task 6] 依赖 [Task 1-5]

# 并行执行策略
```
Wave 1 (并行): Task 1 + Task 3 + Task 4 + Task 5
                ↓ (Task 1 完成后)
Wave 2:         Task 2
                ↓ (全部完成后)
Wave 3:         Task 6 (全量回归)
```
