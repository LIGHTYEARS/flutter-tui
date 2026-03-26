// Tool card layout TDD tests
//
// Amp ref: xD widget — body columns use stretch to fill available width
// All tool card body Columns must use crossAxisAlignment:'stretch'
// so Markdown, code blocks, and DiffView fill the terminal width.

import { describe, it, expect } from 'bun:test';
import type { ToolCallItem } from '../acp/types';
import { GenericToolCard } from '../widgets/tool-call/generic-tool-card';
import { BashTool } from '../widgets/tool-call/bash-tool';
import { ReadTool } from '../widgets/tool-call/read-tool';
import { EditFileTool } from '../widgets/tool-call/edit-file-tool';
import { GrepTool } from '../widgets/tool-call/grep-tool';
import { CreateFileTool } from '../widgets/tool-call/create-file-tool';
import { WebSearchTool } from '../widgets/tool-call/web-search-tool';
import { HandoffTool } from '../widgets/tool-call/handoff-tool';
import { TodoListTool } from '../widgets/tool-call/todo-list-tool';
import { ThinkingBlock } from '../widgets/thinking-block';

function makeToolCall(kind: string, opts?: Partial<ToolCallItem>): ToolCallItem {
  return {
    type: 'tool_call',
    toolCallId: `tc-test-${kind}`,
    kind,
    title: `${kind} test`,
    status: 'completed',
    collapsed: false,
    result: {
      content: [{ type: 'text', content: { text: 'some output text that should fill width' } }],
    },
    rawInput: { path: '/test/file.ts' },
    ...opts,
  };
}

/**
 * Recursively searches a widget tree for Column widgets and returns
 * their crossAxisAlignment values.
 */
function findColumnAlignments(widget: any): string[] {
  const results: string[] = [];

  if (widget?.constructor?.name === 'Column') {
    results.push(widget.crossAxisAlignment ?? 'center');
  }

  const children = widget?.children ?? widget?._children ?? [];
  if (Array.isArray(children)) {
    for (const child of children) {
      results.push(...findColumnAlignments(child));
    }
  }

  if (widget?.child) {
    results.push(...findColumnAlignments(widget.child));
  }

  if (widget?.header) {
    results.push(...findColumnAlignments(widget.header));
  }
  if (widget?.body) {
    results.push(...findColumnAlignments(widget.body));
  }

  return results;
}

/**
 * Builds a tool widget and checks that all body Columns use 'stretch'.
 */
function assertBodyColumnsStretch(widget: any, toolName: string) {
  const tree = widget.build({} as any);
  const alignments = findColumnAlignments(tree);

  const startColumns = alignments.filter(a => a === 'start');
  if (startColumns.length > 0) {
    throw new Error(
      `${toolName}: found ${startColumns.length} Column(s) with crossAxisAlignment:'start' — ` +
      `should be 'stretch' for proper width filling. ` +
      `All alignments: [${alignments.join(', ')}]`
    );
  }
}

describe('Tool Card Body Columns: crossAxisAlignment must be stretch', () => {

  it('GenericToolCard body Column uses stretch when expanded', () => {
    const tc = makeToolCall('painter');
    const widget = new GenericToolCard({ toolCall: tc, isExpanded: true });
    assertBodyColumnsStretch(widget, 'GenericToolCard');
  });

  it('BashTool body Column uses stretch when expanded', () => {
    const tc = makeToolCall('Bash');
    const widget = new BashTool({ toolCall: tc, isExpanded: true });
    assertBodyColumnsStretch(widget, 'BashTool');
  });

  it('ReadTool body Column uses stretch when expanded', () => {
    const tc = makeToolCall('Read');
    const widget = new ReadTool({ toolCall: tc, isExpanded: true });
    assertBodyColumnsStretch(widget, 'ReadTool');
  });

  it('EditFileTool body Column uses stretch when expanded', () => {
    const tc = makeToolCall('edit_file');
    const widget = new EditFileTool({ toolCall: tc, isExpanded: true });
    assertBodyColumnsStretch(widget, 'EditFileTool');
  });

  it('GrepTool body Column uses stretch when expanded', () => {
    const tc = makeToolCall('Grep');
    const widget = new GrepTool({ toolCall: tc, isExpanded: true });
    assertBodyColumnsStretch(widget, 'GrepTool');
  });

  it('CreateFileTool body Column uses stretch when expanded', () => {
    const tc = makeToolCall('create_file');
    const widget = new CreateFileTool({ toolCall: tc, isExpanded: true });
    assertBodyColumnsStretch(widget, 'CreateFileTool');
  });

  it('WebSearchTool body Column uses stretch when expanded', () => {
    const tc = makeToolCall('WebSearch');
    const widget = new WebSearchTool({ toolCall: tc, isExpanded: true });
    assertBodyColumnsStretch(widget, 'WebSearchTool');
  });

  it('HandoffTool uses stretch (StatefulWidget — verified via grep)', () => {
    // HandoffTool is a StatefulWidget, can't call build() without full element tree.
    // Verified via grep that crossAxisAlignment was changed to 'stretch'.
    const fs = require('fs');
    const src = fs.readFileSync(
      require.resolve('../widgets/tool-call/handoff-tool.ts'),
      'utf8',
    );
    expect(src).toContain("crossAxisAlignment: 'stretch'");
    expect(src).not.toContain("crossAxisAlignment: 'start'");
  });

  it('TodoListTool body Column uses stretch when expanded', () => {
    const tc = makeToolCall('todo_list', {
      rawInput: { entries: [{ id: '1', content: 'test', status: 'pending', priority: 'high' }] },
    });
    const widget = new TodoListTool({ toolCall: tc, isExpanded: true });
    assertBodyColumnsStretch(widget, 'TodoListTool');
  });
});

describe('ThinkingBlock: body Column should use stretch', () => {
  it('ThinkingBlock (expanded) body Column uses stretch', () => {
    const item = {
      type: 'thinking' as const,
      text: 'Let me think about this...',
      timestamp: Date.now(),
      isStreaming: false,
      collapsed: false,
    };
    const widget = new ThinkingBlock({ item });
    assertBodyColumnsStretch(widget, 'ThinkingBlock');
  });
});
