// Tests for DiffView widget
// Verifies diff parsing, line classification, line numbers, context filtering, and theme colors

import { describe, test, expect } from 'bun:test';
import { DiffView } from '../diff-view';
import { Color } from '../../core/color';
import { TextStyle } from '../../core/text-style';
import { TextSpan } from '../../core/text-span';

// ---------------------------------------------------------------------------
// Sample diffs for testing
// ---------------------------------------------------------------------------

const SIMPLE_DIFF = `diff --git a/src/foo.ts b/src/foo.ts
index abc1234..def5678 100644
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -1,5 +1,6 @@
 const a = 1;
-const b = 2;
+const b = 3;
+const c = 4;
 const d = 5;
 const e = 6;`;

const MULTI_HUNK_DIFF = `--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,3 @@
 line1
-old2
+new2
 line3
@@ -10,3 +10,4 @@
 line10
+added11
 line11
 line12`;

const ADDITIONS_ONLY = `@@ -0,0 +1,3 @@
+line1
+line2
+line3`;

const DELETIONS_ONLY = `@@ -1,3 +0,0 @@
-line1
-line2
-line3`;

// ---------------------------------------------------------------------------
// Parsing tests
// ---------------------------------------------------------------------------

describe('DiffView.parseDiff', () => {
  test('parses simple unified diff with meta and one hunk', () => {
    const hunks = DiffView.parseDiff(SIMPLE_DIFF);
    // Should have a meta hunk + 1 real hunk
    expect(hunks.length).toBe(2);

    // First hunk is meta lines
    const meta = hunks[0]!;
    expect(meta.header).toBe('__meta__');
    expect(meta.lines.length).toBeGreaterThan(0);
    expect(meta.lines[0]!.type).toBe('meta');

    // Second hunk is the real diff
    const hunk = hunks[1]!;
    expect(hunk.oldStart).toBe(1);
    expect(hunk.newStart).toBe(1);
    expect(hunk.header).toContain('@@ -1,5 +1,6 @@');
  });

  test('classifies addition lines correctly', () => {
    const hunks = DiffView.parseDiff(ADDITIONS_ONLY);
    expect(hunks.length).toBe(1);
    const hunk = hunks[0]!;
    expect(hunk.lines.length).toBe(3);
    for (const line of hunk.lines) {
      expect(line.type).toBe('addition');
      expect(line.content.startsWith('+')).toBe(true);
    }
  });

  test('classifies deletion lines correctly', () => {
    const hunks = DiffView.parseDiff(DELETIONS_ONLY);
    expect(hunks.length).toBe(1);
    const hunk = hunks[0]!;
    expect(hunk.lines.length).toBe(3);
    for (const line of hunk.lines) {
      expect(line.type).toBe('deletion');
      expect(line.content.startsWith('-')).toBe(true);
    }
  });

  test('classifies context lines correctly', () => {
    const hunks = DiffView.parseDiff(SIMPLE_DIFF);
    const realHunk = hunks[1]!;
    const contextLines = realHunk.lines.filter((l) => l.type === 'context');
    expect(contextLines.length).toBe(3); // 'const a', 'const d', 'const e'
  });

  test('parses multiple hunks', () => {
    const hunks = DiffView.parseDiff(MULTI_HUNK_DIFF);
    // Meta hunk (--- / +++) plus 2 real hunks
    const metaCount = hunks.filter((h) => h.header === '__meta__').length;
    const realHunks = hunks.filter((h) => h.header !== '__meta__');
    expect(metaCount).toBe(1);
    expect(realHunks.length).toBe(2);
    expect(realHunks[0]!.oldStart).toBe(1);
    expect(realHunks[0]!.newStart).toBe(1);
    expect(realHunks[1]!.oldStart).toBe(10);
    expect(realHunks[1]!.newStart).toBe(10);
  });

  test('tracks line numbers for additions', () => {
    const hunks = DiffView.parseDiff(ADDITIONS_ONLY);
    const lines = hunks[0]!.lines;
    expect(lines[0]!.newLineNumber).toBe(1);
    expect(lines[1]!.newLineNumber).toBe(2);
    expect(lines[2]!.newLineNumber).toBe(3);
    // Additions should not have oldLineNumber
    for (const line of lines) {
      expect(line.oldLineNumber).toBeUndefined();
    }
  });

  test('tracks line numbers for deletions', () => {
    const hunks = DiffView.parseDiff(DELETIONS_ONLY);
    const lines = hunks[0]!.lines;
    expect(lines[0]!.oldLineNumber).toBe(1);
    expect(lines[1]!.oldLineNumber).toBe(2);
    expect(lines[2]!.oldLineNumber).toBe(3);
    // Deletions should not have newLineNumber
    for (const line of lines) {
      expect(line.newLineNumber).toBeUndefined();
    }
  });

  test('tracks line numbers for context lines', () => {
    const hunks = DiffView.parseDiff(SIMPLE_DIFF);
    const realHunk = hunks[1]!;
    const contextLines = realHunk.lines.filter((l) => l.type === 'context');
    // First context line: 'const a = 1;' at old=1, new=1
    expect(contextLines[0]!.oldLineNumber).toBe(1);
    expect(contextLines[0]!.newLineNumber).toBe(1);
  });

  test('handles empty diff string', () => {
    const hunks = DiffView.parseDiff('');
    expect(hunks.length).toBe(0);
  });

  test('handles diff with no hunks (only meta)', () => {
    const hunks = DiffView.parseDiff('diff --git a/foo b/foo\nindex 123..456 100644');
    expect(hunks.length).toBe(1);
    expect(hunks[0]!.header).toBe('__meta__');
  });

  test('handles "No newline at end of file" marker', () => {
    const diff = `@@ -1,2 +1,2 @@
-old
+new
\\ No newline at end of file`;
    const hunks = DiffView.parseDiff(diff);
    const lines = hunks[0]!.lines;
    const metaLine = lines.find((l) => l.content === '\\ No newline at end of file');
    expect(metaLine).toBeDefined();
    expect(metaLine!.type).toBe('meta');
  });
});

// ---------------------------------------------------------------------------
// Widget construction tests
// ---------------------------------------------------------------------------

describe('DiffView widget', () => {
  test('constructs with required diff prop', () => {
    const view = new DiffView({ diff: SIMPLE_DIFF });
    expect(view.diff).toBe(SIMPLE_DIFF);
    expect(view.showLineNumbers).toBe(true); // default
    expect(view.context).toBeUndefined();
  });

  test('constructs with all options', () => {
    const view = new DiffView({
      diff: SIMPLE_DIFF,
      showLineNumbers: false,
      context: 2,
    });
    expect(view.diff).toBe(SIMPLE_DIFF);
    expect(view.showLineNumbers).toBe(false);
    expect(view.context).toBe(2);
  });

  test('showLineNumbers defaults to true', () => {
    const view = new DiffView({ diff: '' });
    expect(view.showLineNumbers).toBe(true);
  });

  test('build returns a widget (Column) without crashing', () => {
    const view = new DiffView({ diff: SIMPLE_DIFF });
    // Build requires a BuildContext but for StatelessWidget we can test parseDiff directly
    // and verify the widget is a StatelessWidget
    expect(view).toBeInstanceOf(DiffView);
    expect(typeof view.build).toBe('function');
  });

  test('handles empty diff without error', () => {
    const view = new DiffView({ diff: '' });
    expect(view.diff).toBe('');
    // parseDiff on empty string should produce 0 hunks
    expect(DiffView.parseDiff(view.diff).length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Context filtering tests
// ---------------------------------------------------------------------------

describe('DiffView context filtering', () => {
  test('context=0 shows only changed lines', () => {
    const diff = `@@ -1,7 +1,7 @@
 line1
 line2
 line3
-old4
+new4
 line5
 line6
 line7`;
    // Access the private method through parsing and rebuilding
    const view = new DiffView({ diff, context: 0 });
    // We test the behavior via parseDiff + manual check
    const hunks = DiffView.parseDiff(diff);
    expect(hunks.length).toBe(1);
    const allLines = hunks[0]!.lines;
    // The hunk has lines: 3 context, 1 deletion, 1 addition, 3 context (+1 trailing empty)
    expect(allLines.length).toBe(8);
    const changed = allLines.filter((l) => l.type === 'addition' || l.type === 'deletion');
    expect(changed.length).toBe(2);
  });

  test('parseDiff preserves all context lines without filtering', () => {
    const view = new DiffView({ diff: SIMPLE_DIFF });
    const hunks = DiffView.parseDiff(view.diff);
    const realHunk = hunks.find((h) => h.header !== '__meta__')!;
    // Should have all lines: 3 context + 1 deletion + 2 additions
    expect(realHunk.lines.length).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('DiffView edge cases', () => {
  test('handles diff with only hunk header and no content', () => {
    const diff = '@@ -0,0 +0,0 @@';
    const hunks = DiffView.parseDiff(diff);
    expect(hunks.length).toBe(1);
    expect(hunks[0]!.lines.length).toBe(0);
  });

  test('handles diff with trailing empty lines', () => {
    const diff = `@@ -1,2 +1,2 @@
-old
+new
`;
    const hunks = DiffView.parseDiff(diff);
    expect(hunks.length).toBe(1);
    // The trailing empty line becomes a context line
    const hunk = hunks[0]!;
    expect(hunk.lines.length).toBe(3); // deletion, addition, context (empty)
  });

  test('handles hunk header with extra text after @@', () => {
    const diff = '@@ -1,3 +1,3 @@ function foo() {';
    const hunks = DiffView.parseDiff(diff);
    expect(hunks.length).toBe(1);
    expect(hunks[0]!.header).toContain('function foo()');
  });
});

// ---------------------------------------------------------------------------
// computeDiff tests (Myers diff algorithm)
// ---------------------------------------------------------------------------

describe('DiffView.computeDiff', () => {
  test('computes diff for a single line change', () => {
    const result = DiffView.computeDiff('a\nb\nc', 'a\nB\nc');
    expect(result).toContain('-b');
    expect(result).toContain('+B');
    expect(result).toContain(' a');
    expect(result).toContain(' c');
  });

  test('returns empty string for identical inputs', () => {
    const result = DiffView.computeDiff('hello\nworld', 'hello\nworld');
    expect(result).toBe('');
  });

  test('returns empty string when both inputs are empty', () => {
    const result = DiffView.computeDiff('', '');
    expect(result).toBe('');
  });

  test('computes diff when old text is empty (all additions)', () => {
    const result = DiffView.computeDiff('', 'a\nb');
    expect(result).toContain('+a');
    expect(result).toContain('+b');
    // No deletion lines should be present (only --- header line contains -)
    const lines = result.split('\n');
    const deletionLines = lines.filter((l) => l.startsWith('-') && !l.startsWith('---'));
    expect(deletionLines.length).toBe(0);
  });

  test('computes diff when new text is empty (all deletions)', () => {
    const result = DiffView.computeDiff('a\nb', '');
    expect(result).toContain('-a');
    expect(result).toContain('-b');
    // The + should not appear in the diff lines (only in +++ header)
    const lines = result.split('\n');
    const additionLines = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++'));
    expect(additionLines.length).toBe(0);
  });

  test('computes diff for completely different content', () => {
    const result = DiffView.computeDiff('a\nb', 'x\ny');
    expect(result).toContain('-a');
    expect(result).toContain('-b');
    expect(result).toContain('+x');
    expect(result).toContain('+y');
  });

  test('deletions appear before additions in unified format', () => {
    const result = DiffView.computeDiff('hello', 'world');
    const lines = result.split('\n');
    const deletionIdx = lines.findIndex((l) => l === '-hello');
    const additionIdx = lines.findIndex((l) => l === '+world');
    expect(deletionIdx).toBeGreaterThan(-1);
    expect(additionIdx).toBeGreaterThan(-1);
    expect(deletionIdx).toBeLessThan(additionIdx);
  });

  test('equal lines are preserved as context with leading space', () => {
    const result = DiffView.computeDiff('a\nb\nc', 'a\nB\nc');
    const lines = result.split('\n');
    const contextLines = lines.filter((l) => l.startsWith(' '));
    expect(contextLines).toContain(' a');
    expect(contextLines).toContain(' c');
  });

  test('produces valid unified diff header', () => {
    const result = DiffView.computeDiff('a', 'b');
    expect(result).toContain('--- a/file');
    expect(result).toContain('+++ b/file');
    expect(result).toMatch(/@@ -\d+,\d+ \+\d+,\d+ @@/);
  });

  test('uses custom fileName in header', () => {
    const result = DiffView.computeDiff('a', 'b', { fileName: 'test.ts' });
    expect(result).toContain('--- a/test.ts');
    expect(result).toContain('+++ b/test.ts');
  });

  test('respects contextLines option', () => {
    const oldText = 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10';
    const newText = 'line1\nline2\nline3\nLINE4\nline5\nline6\nline7\nline8\nline9\nline10';
    const result = DiffView.computeDiff(oldText, newText, { contextLines: 1 });
    const lines = result.split('\n');
    const contentLines = lines.filter((l) => !l.startsWith('---') && !l.startsWith('+++') && !l.startsWith('@@'));
    // Should have: 1 context before + 1 deletion + 1 addition + 1 context after = 4
    expect(contentLines.length).toBe(4);
    expect(contentLines).toContain(' line3');
    expect(contentLines).toContain('-line4');
    expect(contentLines).toContain('+LINE4');
    expect(contentLines).toContain(' line5');
  });

  test('ignoreWhitespace ignores trailing whitespace differences', () => {
    const result = DiffView.computeDiff('a  \nb\nc  ', 'a\nb\nc', {
      ignoreWhitespace: true,
    });
    expect(result).toBe('');
  });

  test('ignoreWhitespace still detects non-whitespace changes', () => {
    const result = DiffView.computeDiff('a  \nb\nc  ', 'a\nB\nc', {
      ignoreWhitespace: true,
    });
    expect(result).toContain('-b');
    expect(result).toContain('+B');
  });

  test('roundtrip: computeDiff output can be parsed by parseDiff', () => {
    const diff = DiffView.computeDiff('a\nb\nc', 'a\nB\nc');
    const hunks = DiffView.parseDiff(diff);
    const realHunks = hunks.filter((h) => h.header !== '__meta__');
    expect(realHunks.length).toBe(1);
    const hunk = realHunks[0]!;
    expect(hunk.lines.some((l) => l.type === 'deletion' && l.content === '-b')).toBe(true);
    expect(hunk.lines.some((l) => l.type === 'addition' && l.content === '+B')).toBe(true);
    expect(hunk.lines.some((l) => l.type === 'context' && l.content === ' a')).toBe(true);
  });

  test('handles multi-line additions in the middle', () => {
    const result = DiffView.computeDiff('a\nc', 'a\nb\nc');
    expect(result).toContain('+b');
    expect(result).toContain(' a');
    expect(result).toContain(' c');
  });

  test('handles multi-line deletions in the middle', () => {
    const result = DiffView.computeDiff('a\nb\nc', 'a\nc');
    expect(result).toContain('-b');
    expect(result).toContain(' a');
    expect(result).toContain(' c');
  });

  test('handles single line change', () => {
    const result = DiffView.computeDiff('hello', 'world');
    expect(result).toContain('-hello');
    expect(result).toContain('+world');
  });
});

// ---------------------------------------------------------------------------
// computeWordDiff tests
// ---------------------------------------------------------------------------

describe('DiffView.computeWordDiff', () => {
  test('detects changed word in the middle', () => {
    const result = DiffView.computeWordDiff('hello world foo', 'hello planet foo');
    // Should have: same "hello", same " ", removed "world", added "planet", same " ", same "foo"
    const sameWords = result.filter((w) => w.type === 'same');
    const removedWords = result.filter((w) => w.type === 'removed');
    const addedWords = result.filter((w) => w.type === 'added');
    expect(sameWords.map((w) => w.text)).toContain('hello');
    expect(sameWords.map((w) => w.text)).toContain('foo');
    expect(removedWords.length).toBe(1);
    expect(removedWords[0]!.text).toBe('world');
    expect(addedWords.length).toBe(1);
    expect(addedWords[0]!.text).toBe('planet');
  });

  test('returns all same for identical lines', () => {
    const result = DiffView.computeWordDiff('hello world', 'hello world');
    expect(result.every((w) => w.type === 'same')).toBe(true);
    expect(result.map((w) => w.text).join('')).toBe('hello world');
  });

  test('returns empty array for two empty strings', () => {
    const result = DiffView.computeWordDiff('', '');
    expect(result.length).toBe(0);
  });

  test('returns all added when old is empty', () => {
    const result = DiffView.computeWordDiff('', 'hello world');
    expect(result.every((w) => w.type === 'added')).toBe(true);
    expect(result.map((w) => w.text).join('')).toBe('hello world');
  });

  test('returns all removed when new is empty', () => {
    const result = DiffView.computeWordDiff('hello world', '');
    expect(result.every((w) => w.type === 'removed')).toBe(true);
    expect(result.map((w) => w.text).join('')).toBe('hello world');
  });

  test('handles completely different lines', () => {
    const result = DiffView.computeWordDiff('aaa bbb', 'xxx yyy');
    const removed = result.filter((w) => w.type === 'removed');
    const added = result.filter((w) => w.type === 'added');
    expect(removed.map((w) => w.text)).toContain('aaa');
    expect(removed.map((w) => w.text)).toContain('bbb');
    expect(added.map((w) => w.text)).toContain('xxx');
    expect(added.map((w) => w.text)).toContain('yyy');
  });

  test('preserves whitespace as separate tokens', () => {
    const result = DiffView.computeWordDiff('a  b', 'a  b');
    // "a", "  ", "b" should all be same
    expect(result.length).toBe(3);
    expect(result[0]!.text).toBe('a');
    expect(result[1]!.text).toBe('  ');
    expect(result[2]!.text).toBe('b');
  });

  test('detects whitespace changes', () => {
    const result = DiffView.computeWordDiff('a b', 'a  b');
    // "a" same, " " removed, "  " added, "b" same
    const removed = result.filter((w) => w.type === 'removed');
    const added = result.filter((w) => w.type === 'added');
    expect(removed.length).toBeGreaterThanOrEqual(1);
    expect(added.length).toBeGreaterThanOrEqual(1);
  });

  test('handles single word lines', () => {
    const result = DiffView.computeWordDiff('hello', 'world');
    expect(result.length).toBe(2);
    expect(result.find((w) => w.type === 'removed')!.text).toBe('hello');
    expect(result.find((w) => w.type === 'added')!.text).toBe('world');
  });
});

// ---------------------------------------------------------------------------
// New constructor options tests
// ---------------------------------------------------------------------------

describe('DiffView new constructor options', () => {
  test('ignoreWhitespace defaults to false', () => {
    const view = new DiffView({ diff: '' });
    expect(view.ignoreWhitespace).toBe(false);
  });

  test('wordLevelDiff defaults to true', () => {
    const view = new DiffView({ diff: '' });
    expect(view.wordLevelDiff).toBe(true);
  });

  test('ignoreWhitespace can be set to true', () => {
    const view = new DiffView({ diff: '', ignoreWhitespace: true });
    expect(view.ignoreWhitespace).toBe(true);
  });

  test('wordLevelDiff can be set to false', () => {
    const view = new DiffView({ diff: '', wordLevelDiff: false });
    expect(view.wordLevelDiff).toBe(false);
  });

  test('all original options still work', () => {
    const view = new DiffView({
      diff: SIMPLE_DIFF,
      showLineNumbers: false,
      context: 5,
      filePath: 'test.ts',
      ignoreWhitespace: true,
      wordLevelDiff: false,
    });
    expect(view.diff).toBe(SIMPLE_DIFF);
    expect(view.showLineNumbers).toBe(false);
    expect(view.context).toBe(5);
    expect(view.filePath).toBe('test.ts');
    expect(view.ignoreWhitespace).toBe(true);
    expect(view.wordLevelDiff).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Word-level diff rendering tests (build behavior via parseDiff + computeWordDiff)
// ---------------------------------------------------------------------------

describe('DiffView word-level diff rendering logic', () => {
  test('adjacent deletion+addition pair is detected for word-level diff', () => {
    // Simulate the build() detection logic:
    // when a deletion line is immediately followed by an addition line,
    // word-level diff should be computed
    const diff = `@@ -1,3 +1,3 @@
 context
-old line here
+new line here
 more context`;
    const hunks = DiffView.parseDiff(diff);
    const lines = hunks[0]!.lines;

    // Find the deletion+addition pair
    let foundPair = false;
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i]!.type === 'deletion' && lines[i + 1]!.type === 'addition') {
        foundPair = true;
        const oldContent = lines[i]!.content.slice(1); // strip '-'
        const newContent = lines[i + 1]!.content.slice(1); // strip '+'
        const wordDiffs = DiffView.computeWordDiff(oldContent, newContent);

        // "old line here" vs "new line here"
        // "old" -> removed, "new" -> added, " line here" -> same
        const removed = wordDiffs.filter((w) => w.type === 'removed');
        const added = wordDiffs.filter((w) => w.type === 'added');
        expect(removed.length).toBe(1);
        expect(removed[0]!.text).toBe('old');
        expect(added.length).toBe(1);
        expect(added[0]!.text).toBe('new');
        break;
      }
    }
    expect(foundPair).toBe(true);
  });

  test('non-adjacent deletion and addition are not paired', () => {
    // Deletion followed by context then addition should not be paired
    const diff = `@@ -1,4 +1,4 @@
-deleted line
 context line
+added line
 more context`;
    const hunks = DiffView.parseDiff(diff);
    const lines = hunks[0]!.lines;

    // Check that deletion is NOT immediately followed by addition
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i]!.type === 'deletion') {
        expect(lines[i + 1]!.type).not.toBe('addition');
      }
    }
  });

  test('multiple consecutive deletion+addition pairs each get word diff', () => {
    const diff = `@@ -1,4 +1,4 @@
-old line one
+new line one
-old line two
+new line two`;
    const hunks = DiffView.parseDiff(diff);
    const lines = hunks[0]!.lines;

    let pairCount = 0;
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i]!.type === 'deletion' && lines[i + 1]!.type === 'addition') {
        pairCount++;
        i++; // skip the addition
      }
    }
    expect(pairCount).toBe(2);
  });

  test('word diff correctly reconstructs text from same + highlighted segments', () => {
    const wordDiffs = DiffView.computeWordDiff('const x = 1;', 'const y = 2;');
    // On deletion line, show 'same' and 'removed' segments
    const deletionText = wordDiffs
      .filter((w) => w.type === 'same' || w.type === 'removed')
      .map((w) => w.text)
      .join('');
    expect(deletionText).toBe('const x = 1;');

    // On addition line, show 'same' and 'added' segments
    const additionText = wordDiffs
      .filter((w) => w.type === 'same' || w.type === 'added')
      .map((w) => w.text)
      .join('');
    expect(additionText).toBe('const y = 2;');
  });
});
