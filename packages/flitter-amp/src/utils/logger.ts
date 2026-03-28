// Logging utility — writes to a log file when TUI is running to avoid corrupting the display.
// Falls back to stderr when no log file is configured (e.g., during tests).

import { existsSync, mkdirSync, createWriteStream, type WriteStream } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

let currentLevel: LogLevel = 'info';
let logStream: WriteStream | null = null;

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * Initialize file-based logging. Must be called before TUI starts.
 * Logs are written to ~/.flitter/logs/amp-YYYY-MM-DD.log
 */
export function initLogFile(): void {
  try {
    const logDir = join(homedir(), '.flitter', 'logs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    const date = new Date().toISOString().slice(0, 10);
    const logPath = join(logDir, `amp-${date}.log`);
    logStream = createWriteStream(logPath, { flags: 'a' });
    logStream.on('error', () => {
      logStream = null;
    });
  } catch {
    logStream = null;
  }
}

/**
 * Close log file stream. Call on shutdown.
 */
export function closeLogFile(): void {
  if (logStream) {
    logStream.end();
    logStream = null;
  }
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  const formatted = args.length > 0
    ? `${prefix} ${message} ${args.map(a => JSON.stringify(a)).join(' ')}`
    : `${prefix} ${message}`;
  return formatted;
}

function writeLog(level: LogLevel, message: string, ...args: unknown[]): void {
  if (!shouldLog(level)) return;
  const line = formatMessage(level, message, ...args) + '\n';
  if (logStream) {
    logStream.write(line);
  } else {
    process.stderr.write(line);
  }
}

export const log = {
  debug(message: string, ...args: unknown[]): void {
    writeLog('debug', message, ...args);
  },

  info(message: string, ...args: unknown[]): void {
    writeLog('info', message, ...args);
  },

  warn(message: string, ...args: unknown[]): void {
    writeLog('warn', message, ...args);
  },

  error(message: string, ...args: unknown[]): void {
    writeLog('error', message, ...args);
  },
};
