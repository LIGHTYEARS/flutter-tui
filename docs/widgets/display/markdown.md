# Markdown

`来源: src/widgets/markdown.ts`

Markdown 是一个用于渲染 Markdown 格式文本的组件。支持常见的块级和行内语法，内置 LRU 缓存机制（默认 100 条），通过 AppTheme 提供语法高亮和标题颜色。

## 构造函数

```typescript
new Markdown({
  markdown: string,
  textAlign?: 'left' | 'center' | 'right',
  maxLines?: number,
  overflow?: 'clip' | 'ellipsis',
  enableCache?: boolean,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| markdown | `string` | -- | Markdown 源文本（必填） |
| textAlign | `'left' \| 'center' \| 'right'` | `'left'` | 文本对齐方式 |
| maxLines | `number` | -- | 最大显示行数（不设置则不限制） |
| overflow | `'clip' \| 'ellipsis'` | `'clip'` | 超出 maxLines 时的截断方式 |
| enableCache | `boolean` | `true` | 是否启用解析缓存 |

## 静态方法

```typescript
// 使指定 markdown 文本的缓存失效
Markdown.invalidateCache(markdown: string): void

// 清除所有缓存
Markdown.clearCache(): void

// 将 markdown 文本解析为 MarkdownBlock 数组（使用缓存）
Markdown.parseMarkdown(markdown: string): MarkdownBlock[]

// 解析行内 markdown 格式（**bold**、*italic*、`code`、[text](url) 等）
Markdown.parseInline(text: string): InlineSegment[]
```

## 支持的语法

### 块级元素

| 类型 | Markdown 语法 | MarkdownBlockType |
|------|--------------|-------------------|
| 一级标题 | `# 标题` | `heading1` |
| 二级标题 | `## 标题` | `heading2` |
| 三级标题 | `### 标题` | `heading3` |
| 四级标题 | `#### 标题` | `heading4` |
| 无序列表 | `- 内容` | `bullet` |
| 有序列表 | `1. 内容` | `numbered-list` |
| 引用 | `> 内容` | `blockquote` |
| 水平线 | `---` | `horizontal-rule` |
| 表格 | `\| a \| b \|` | `table` |
| 代码块 | ` ``` ` | `code-block` |
| 段落 | 普通文本 | `paragraph` |

### 行内元素

| 语法 | 效果 |
|------|------|
| `**粗体**` | **粗体** |
| `*斜体*` | *斜体* |
| `***粗斜体***` | ***粗斜体*** |
| `` `代码` `` | `代码` |
| `[链接](url)` | 链接 |
| `~~删除线~~` | ~~删除线~~ |

### 标题颜色规则

| 标题级别 | 颜色 |
|---------|------|
| H1、H3 | `primary`（主题主色） |
| H2、H4 | `textSecondary`（次要文字色） |

## 导出类型

```typescript
// 块级元素类型
type MarkdownBlockType =
  | 'heading1' | 'heading2' | 'heading3' | 'heading4'
  | 'bullet' | 'numbered-list' | 'blockquote'
  | 'horizontal-rule' | 'table' | 'code-block' | 'paragraph';

// 块级元素
interface MarkdownBlock {
  readonly type: MarkdownBlockType;
  readonly content: string;
  readonly language?: string;       // 代码块的语言标识
  readonly listNumber?: number;     // 有序列表项的序号
  readonly tableHeaders?: string[]; // GFM 表格的表头列名
  readonly tableRows?: string[][];  // GFM 表格的数据行
}

// 行内片段
interface InlineSegment {
  readonly text: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly code?: boolean;
  readonly linkText?: string;
  readonly linkUrl?: string;
  readonly strikethrough?: boolean;
  readonly boldItalic?: boolean;
}
```

## 基本用法

```typescript
import { Markdown } from 'flutter-tui/widgets/markdown';

// 渲染简单的 Markdown 文本
new Markdown({
  markdown: '# Hello World\n\n这是一段 **Markdown** 文本。',
})
```

### 限制行数

```typescript
new Markdown({
  markdown: longMarkdownContent,
  maxLines: 10,
  overflow: 'ellipsis',
})
```

## 进阶用法

### 居中对齐

```typescript
new Markdown({
  markdown: '## 居中标题\n\n居中显示的段落内容。',
  textAlign: 'center',
})
```

### 禁用缓存

```typescript
// 对于频繁变化的内容，可以禁用缓存以节省内存
new Markdown({
  markdown: dynamicContent,
  enableCache: false,
})
```

### 手动管理缓存

```typescript
// 当 markdown 内容更新后，使旧缓存失效
Markdown.invalidateCache(oldMarkdown);

// 或在需要释放内存时清空所有缓存
Markdown.clearCache();
```

### 解析 Markdown 结构

```typescript
// 获取解析后的块级结构，用于自定义渲染
const blocks = Markdown.parseMarkdown('# Title\n\n- item 1\n- item 2');
// blocks: [
//   { type: 'heading1', ... },
//   { type: 'bullet', ... },
//   { type: 'bullet', ... },
// ]
```

### 在滚动视图中使用

```typescript
import { SingleChildScrollView } from 'flutter-tui/widgets/scroll-view';

new SingleChildScrollView({
  child: new Markdown({
    markdown: veryLongDocument,
  }),
})
```

::: info
Markdown 是一个 `StatelessWidget`，解析结果默认通过 LRU 缓存（最多 100 条）加速重复渲染。如果同一段 Markdown 被多次渲染，只会解析一次。
:::

::: tip
代码块中的语法高亮颜色来自 AppTheme，可通过主题配置自定义颜色方案。
:::

## 相关组件

- [Text](/widgets/display/text) - 纯文本显示
- [DiffView](/widgets/display/diff-view) - Diff 差异显示
- [SingleChildScrollView](/widgets/scroll/scroll-view) - 滚动容器（长文档场景）
