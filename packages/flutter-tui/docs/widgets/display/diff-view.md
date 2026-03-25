# DiffView

`来源: src/widgets/diff-view.ts`

DiffView 是一个用于显示文本差异（unified diff）的组件。支持行号显示、word 级别差异高亮、空白字符忽略等功能，内部使用 Myers diff 算法计算差异。

## 构造函数

```typescript
new DiffView({
  diff: string,
  showLineNumbers?: boolean,
  context?: number,
  filePath?: string,
  ignoreWhitespace?: boolean,
  wordLevelDiff?: boolean,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| diff | `string` | -- | unified diff 格式的差异文本（必填） |
| showLineNumbers | `boolean` | `true` | 是否显示行号 |
| context | `number` | -- | 上下文行数（不设置则显示 diff 中的所有行） |
| filePath | `string` | -- | 文件路径提示（用于语法高亮着色） |
| ignoreWhitespace | `boolean` | `false` | 是否忽略空白字符差异 |
| wordLevelDiff | `boolean` | `true` | 是否启用 word 级别差异高亮 |

## 静态方法

```typescript
// 解析 unified diff 文本为 DiffHunk 数组
DiffView.parseDiff(diff: string): DiffHunk[]

// 计算两段文本之间的差异，返回 unified diff 格式字符串
DiffView.computeDiff(oldText: string, newText: string, options?: {
  ignoreWhitespace?: boolean;
  contextLines?: number;
  fileName?: string;
}): string

// 计算两行文本之间的 word 级别差异
DiffView.computeWordDiff(oldLine: string, newLine: string): WordDiff[]
```

## 导出类型

```typescript
// 差异行类型
type DiffLineType = 'addition' | 'deletion' | 'hunk-header' | 'context' | 'meta';

// 差异行
interface DiffLine {
  readonly type: DiffLineType;
  readonly content: string;
  readonly oldLineNumber?: number;
  readonly newLineNumber?: number;
}

// 差异区块
interface DiffHunk {
  readonly header: string;
  readonly lines: DiffLine[];
  readonly oldStart: number;
  readonly newStart: number;
}

// Word 级别差异
interface WordDiff {
  readonly text: string;
  readonly type: 'same' | 'added' | 'removed';
}
```

## 渲染行为

- **添加行**（`+`）：绿色前景色（theme.diffAdded）
- **删除行**（`-`）：红色前景色（theme.diffRemoved）
- **Hunk 头部**（`@@ ... @@`）：信息色（theme.info）
- **元数据行**（`--- a/file`、`+++ b/file` 等）：次要文字色，加粗
- **上下文行**：正常文字色
- **Word 级别差异**：在相邻的删除+添加行内部，进一步用背景色高亮具体变化的单词
- **行号**：双列显示（旧文件行号 | 新文件行号），宽度各 4 字符右对齐

## 基本用法

### 显示已有的 diff 文本

```typescript
import { DiffView } from 'flutter-tui/widgets/diff-view';

const diffText = `--- a/hello.ts
+++ b/hello.ts
@@ -1,3 +1,3 @@
 function greet() {
-  return 'hello';
+  return 'hello world';
 }`;

new DiffView({
  diff: diffText,
})
```

### 计算并显示差异

```typescript
const oldCode = 'function greet() {\n  return "hello";\n}';
const newCode = 'function greet() {\n  return "hello world";\n}';

const diff = DiffView.computeDiff(oldCode, newCode, {
  fileName: 'hello.ts',
});

new DiffView({
  diff: diff,
})
```

## 进阶用法

### 隐藏行号

```typescript
new DiffView({
  diff: diffText,
  showLineNumbers: false,
})
```

### 自定义上下文行数

```typescript
// 只显示变更行及其前后各 2 行
new DiffView({
  diff: diffText,
  context: 2,
})
```

### 忽略空白字符差异

```typescript
// 忽略缩进、尾部空格等差异
const diff = DiffView.computeDiff(oldText, newText, {
  ignoreWhitespace: true,
  contextLines: 3,
});

new DiffView({
  diff: diff,
  ignoreWhitespace: true,
})
```

### 禁用 word 级别高亮

```typescript
// 仅高亮整行差异，不做 word 级别细分
new DiffView({
  diff: diffText,
  wordLevelDiff: false,
})
```

### 显示文件路径

```typescript
new DiffView({
  diff: diffText,
  filePath: 'src/utils/parser.ts',
})
```

### 解析 diff 结构

```typescript
// 获取解析后的 hunk 结构，用于自定义处理
const hunks = DiffView.parseDiff(diffText);
for (const hunk of hunks) {
  console.log(hunk.header);
  for (const line of hunk.lines) {
    console.log(`${line.type}: ${line.content}`);
  }
}
```

### 在滚动视图中使用

```typescript
import { SingleChildScrollView } from 'flutter-tui/widgets/scroll-view';

new SingleChildScrollView({
  child: new DiffView({
    diff: largeDiff,
    showLineNumbers: true,
    wordLevelDiff: true,
  }),
})
```

::: info
DiffView 是一个 `StatelessWidget`，内部使用 Myers diff 算法。该算法时间复杂度为 O(ND)，其中 N 为文本长度、D 为差异数量，适合大多数代码差异场景。
:::

::: tip
启用 `wordLevelDiff` 可以更精确地定位行内变化，便于代码审查。对于大段文本替换的场景，关闭该选项可以提升渲染性能。
:::

## 相关组件

- [Markdown](/widgets/display/markdown) - Markdown 渲染
- [Text](/widgets/display/text) - 纯文本显示
- [SingleChildScrollView](/widgets/scroll/scroll-view) - 滚动容器（长 diff 场景）
