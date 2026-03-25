# ANSI Parser

`来源: src/terminal/ansi-parser.ts`

ANSI 转义序列解析器，将包含 ANSI 样式的字符串转换为 TextSpan 树。支持 SGR 样式码和 OSC 8 超链接。

## parseAnsiToTextSpan

```typescript
function parseAnsiToTextSpan(input: string): TextSpan
```

主函数。解析包含 ANSI 转义序列的字符串，返回带样式的 TextSpan 树。

### 支持的序列

#### SGR（选择图形再现）: `ESC[...m`

| 码 | 效果 | 码 | 效果 |
|------|------|------|------|
| 0 | 重置所有 | 22 | 取消粗体/暗淡 |
| 1 | 粗体 | 23 | 取消斜体 |
| 2 | 暗淡 | 24 | 取消下划线 |
| 3 | 斜体 | 29 | 取消删除线 |
| 4 | 下划线 | 39 | 默认前景色 |
| 9 | 删除线 | 49 | 默认背景色 |

#### 颜色

| 范围 | 说明 |
|------|------|
| 30-37 | 标准前景色 |
| 40-47 | 标准背景色 |
| 90-97 | 亮前景色 |
| 100-107 | 亮背景色 |
| 38;5;N | 256 色前景 |
| 48;5;N | 256 色背景 |
| 38;2;R;G;B | RGB 前景 |
| 48;2;R;G;B | RGB 背景 |

#### OSC 8 超链接: `ESC]8;params;URI ST`

其中 ST 为 `ESC\` 或 BEL (`\x07`)。

### 返回值

- 空输入: 返回 `TextSpan({ text: '' })`
- 单一样式段: 返回单个 TextSpan
- 多个样式段: 返回 TextSpan 根节点，各段作为 children

## HyperlinkData

```typescript
interface HyperlinkData {
  uri: string;
  id?: string;
}
```

## 内部解析器

### parseCSI

解析 CSI 序列（参数字节 + 中间字节 + 最终字节），返回参数数组和最终字符。

### parseOSC

解析 OSC 序列（OSC 编号 + 分号 + 数据 + ST 终结符）。

### applySGR

将 SGR 参数应用到样式状态。处理所有标准 SGR 码、扩展颜色和重置。

## 示例

```typescript
import { parseAnsiToTextSpan } from './terminal/ansi-parser';

// 解析带 ANSI 颜色的字符串
const input = '\x1b[1;31mError:\x1b[0m file not found';
const span = parseAnsiToTextSpan(input);

// 结果: TextSpan 包含两个子节点
// 子节点 1: text="Error:", style={bold: true, fg: red}
// 子节点 2: text=" file not found", style=undefined

// 获取纯文本
span.toPlainText(); // "Error: file not found"

// 解析 256 色
const colored = '\x1b[38;5;196mRed Text\x1b[0m';
const span2 = parseAnsiToTextSpan(colored);

// 解析 RGB 色
const rgb = '\x1b[38;2;255;128;0mOrange\x1b[0m';
const span3 = parseAnsiToTextSpan(rgb);

// 解析超链接
const link = '\x1b]8;;https://example.com\x1b\\Click here\x1b]8;;\x1b\\';
const span4 = parseAnsiToTextSpan(link);
```

::: tip 使用场景
ANSI Parser 常用于将已有的 ANSI 格式化输出（如命令行工具的彩色输出）集成到 Flutter-TUI 的 Widget 树中。
:::
