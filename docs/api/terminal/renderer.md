# Renderer

`来源: src/terminal/renderer.ts`

ANSI 字符串构建器和渲染器。将 diff 补丁（RowPatch[]）转换为最小化的 ANSI 转义序列字符串。跨调用维护 SGR 状态以最小化输出。

## 转义序列常量

| 常量 | 值 | 说明 |
|------|------|------|
| `ESC` | `\x1b` | ESC 字符 |
| `CSI` | `\x1b[` | 控制序列引入符 |
| `BSU` | `\x1b[?2026h` | 开始同步更新 |
| `ESU` | `\x1b[?2026l` | 结束同步更新 |
| `CURSOR_HIDE` | `\x1b[?25l` | 隐藏光标 |
| `CURSOR_SHOW` | `\x1b[?25h` | 显示光标 |
| `SGR_RESET` | `\x1b[0m` | 重置所有样式 |
| `ALT_SCREEN_ON` | `\x1b[?1049h` | 进入备用屏幕 |
| `ALT_SCREEN_OFF` | `\x1b[?1049l` | 退出备用屏幕 |

### 函数常量

| 函数 | 说明 |
|------|------|
| `CURSOR_MOVE(x, y)` | 移动光标到 (x, y)（1-based） |
| `CURSOR_SHAPE(n)` | 设置光标形状 (DECSCUSR) |
| `hyperlinkOpen(uri, id?)` | OSC 8 超链接 |

## buildSgrDelta

```typescript
function buildSgrDelta(prev: CellStyle, next: CellStyle): string
```

计算从 `prev` 样式到 `next` 样式的最小 SGR 转义序列。如果样式相同返回空字符串。

::: tip Bold/Dim 共享关闭码
Bold 和 Dim 共享 SGR 关闭码 22。当需要关闭 Bold 但保留 Dim（或反之），必须先重置再重新设置所有属性。
:::

---

## CursorState

```typescript
interface CursorState {
  position: { x: number; y: number } | null;
  visible: boolean;
  shape: number;  // DECSCUSR: 0=默认, 1=闪烁方块, 2=稳定方块...
}
```

---

## Renderer

### 构造函数

```typescript
new Renderer()
```

### 方法

#### `render(patches: RowPatch[], cursor?: CursorState): string`

将 diff 补丁转换为完整的 ANSI 输出字符串。

**渲染算法：**
1. 开始同步更新 (BSU)
2. 隐藏光标
3. 遍历每个 RowPatch（按行排序）：
   - 移动光标到补丁起始位置
   - 计算 SGR 增量，输出样式变化
   - 输出字符（跳过宽度为 0 的延续单元格）
   - 处理超链接变化
4. 处理光标状态（如可见则移动到位置并显示）
5. 结束同步更新 (ESU)
6. 重置 SGR

#### `setCapabilities(caps: TerminalCapabilities): void`

设置终端能力信息，用于颜色降级决策。

#### `resetState(): void`

重置 SGR 跟踪状态。终端 reset 后应调用。

### 转义序列生成器

用于 TerminalManager 的独立控制操作：

| 方法 | 说明 |
|------|------|
| `clearScreen()` | 清屏序列 |
| `hideCursor()` | 隐藏光标 |
| `showCursor()` | 显示光标 |
| `setCursorShape(n)` | 设置光标形状 |
| `reset()` | 重置 SGR + 超链接 |
| `moveTo(x, y)` | 移动光标 |
| `startSync()` / `endSync()` | 同步更新包裹 |
| `enterAltScreen()` / `exitAltScreen()` | 备用屏幕 |
| `enableMouse()` / `disableMouse()` | 鼠标报告 |
| `enableBracketedPaste()` / `disableBracketedPaste()` | 括号粘贴 |

## 示例

```typescript
import { Renderer } from './terminal/renderer';

const renderer = new Renderer();
const screen = new ScreenBuffer(80, 24);

// ... 绘制到 screen ...

const patches = screen.getDiff();
const cursor = {
  position: { x: 10, y: 5 },
  visible: true,
  shape: 1,
};

const output = renderer.render(patches, cursor);
process.stdout.write(output);

screen.present();
```
