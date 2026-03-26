// Editor integration — suspend TUI, open $EDITOR with prompt, resume with edited text

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Open text in $EDITOR (or $VISUAL, or vi) and return the edited result.
 * Blocks the current process while the editor is open (stdio: 'inherit').
 */
export function openInEditor(initialText: string, editorOverride?: string): string {
  const editor = editorOverride || process.env.EDITOR || process.env.VISUAL || 'vi';
  const tmpFile = join(tmpdir(), `flitter-amp-${Date.now()}.txt`);

  writeFileSync(tmpFile, initialText, 'utf-8');

  try {
    spawnSync(editor, [tmpFile], {
      stdio: 'inherit',
      env: process.env,
    });

    return readFileSync(tmpFile, 'utf-8');
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}
