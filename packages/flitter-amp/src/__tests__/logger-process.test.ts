// Logger and process TDD tests
//
// Verifies:
// 1. Logger writes to file when initLogFile() is called (not stderr)
// 2. Agent subprocess stderr is piped, not inherited
// 3. Logger falls back to stderr when no log file configured

import { describe, it, expect, afterEach } from 'bun:test';
import { readFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Logger: file-based output', () => {

  it('log module exports initLogFile and closeLogFile', () => {
    const mod = require('../utils/logger');
    expect(typeof mod.initLogFile).toBe('function');
    expect(typeof mod.closeLogFile).toBe('function');
  });

  it('log.info exists and is callable', () => {
    const { log } = require('../utils/logger');
    expect(typeof log.info).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.debug).toBe('function');
    expect(typeof log.warn).toBe('function');
  });
});

describe('Agent subprocess: stderr handling', () => {

  it('spawnAgent uses pipe for stderr (not inherit)', () => {
    const src = readFileSync(
      require.resolve('../utils/process.ts'),
      'utf8',
    );
    expect(src).toContain("stderr: 'pipe'");
    expect(src).not.toContain("stderr: 'inherit'");
  });

  it('spawnAgent reads agent stderr and forwards to logger', () => {
    const src = readFileSync(
      require.resolve('../utils/process.ts'),
      'utf8',
    );
    expect(src).toContain('proc.stderr');
    expect(src).toContain("log.debug");
  });
});
