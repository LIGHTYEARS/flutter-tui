// Platform adapter for terminal I/O. Isolates Bun/Node-specific calls behind an interface.
// Amp ref: amp-strings.txt — wB0 TerminalManager uses process.stdout, process.stdin, SIGWINCH

// ---------------------------------------------------------------------------
// Terminal Capabilities (detected from environment)
// ---------------------------------------------------------------------------

/**
 * Describes what the current terminal supports.
 * Amp ref: wB0.capabilities — resolved terminal capabilities
 */
export interface TerminalCapabilities {
  trueColor: boolean;     // supports 24-bit RGB
  ansi256: boolean;       // supports 256 colors
  mouse: boolean;         // supports SGR mouse
  altScreen: boolean;     // supports alt screen buffer
  syncOutput: boolean;    // supports BSU/ESU (mode 2026)
  unicode: boolean;       // supports Unicode characters
  hyperlinks: boolean;    // supports OSC 8 hyperlinks
}

/**
 * Detect terminal capabilities from environment variables.
 * Uses TERM, COLORTERM, TERM_PROGRAM for detection.
 * Returns safe defaults for unknown terminals.
 */
export function detectCapabilities(): TerminalCapabilities {
  const env = typeof process !== 'undefined' ? process.env : {};
  const term = env.TERM ?? '';
  const colorTerm = env.COLORTERM ?? '';
  const termProgram = env.TERM_PROGRAM ?? '';

  // True color: COLORTERM=truecolor or 24bit
  const trueColor =
    colorTerm === 'truecolor' ||
    colorTerm === '24bit' ||
    termProgram === 'iTerm.app' ||
    termProgram === 'WezTerm' ||
    termProgram === 'Hyper' ||
    term.includes('kitty') ||
    term.includes('alacritty');

  // 256 color: TERM containing 256color, or trueColor implies 256
  const ansi256 = trueColor || term.includes('256color') || term.includes('xterm');

  // Most modern terminals support these features
  const isModernTerminal =
    termProgram === 'iTerm.app' ||
    termProgram === 'WezTerm' ||
    termProgram === 'Hyper' ||
    term.includes('kitty') ||
    term.includes('alacritty') ||
    term.includes('xterm') ||
    term.includes('screen') ||
    term.includes('tmux') ||
    term.includes('rxvt');

  return {
    trueColor,
    ansi256,
    mouse: isModernTerminal || term !== '',
    altScreen: isModernTerminal || term !== '',
    syncOutput: isModernTerminal,
    unicode: true, // assume Unicode support in modern environments
    hyperlinks:
      termProgram === 'iTerm.app' ||
      termProgram === 'WezTerm' ||
      term.includes('kitty'),
  };
}

// ---------------------------------------------------------------------------
// PlatformAdapter interface
// ---------------------------------------------------------------------------

/**
 * Abstracts terminal I/O operations.
 * Implementations isolate Bun/Node-specific calls behind this interface.
 * Amp ref: wB0 uses process.stdin.setRawMode, process.stdout.write, SIGWINCH
 */
export interface PlatformAdapter {
  // Raw mode
  enableRawMode(): void;
  disableRawMode(): void;

  // I/O
  writeStdout(data: string): void;
  onStdinData(callback: (data: Buffer) => void): void;
  removeStdinData(callback: (data: Buffer) => void): void;

  // Terminal size
  getTerminalSize(): { columns: number; rows: number };
  onResize(callback: (cols: number, rows: number) => void): void;
  removeResize(callback: (cols: number, rows: number) => void): void;

  // Alt screen
  enableAltScreen(): void;
  disableAltScreen(): void;
}

// ---------------------------------------------------------------------------
// BunPlatform — real terminal implementation
// ---------------------------------------------------------------------------

/**
 * Bun/Node platform adapter for real terminal I/O.
 * Amp ref: wB0 constructor initializes TTY, registers stdin data + SIGWINCH handlers.
 */
export class BunPlatform implements PlatformAdapter {
  private rawModeEnabled = false;
  private stdinCallbacks: ((data: Buffer) => void)[] = [];
  private resizeCallbacks: ((cols: number, rows: number) => void)[] = [];
  private stdinDataHandler: ((data: Buffer) => void) | null = null;
  private resizeHandler: (() => void) | null = null;

  enableRawMode(): void {
    if (this.rawModeEnabled) return;
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
    }
    this.rawModeEnabled = true;
  }

  disableRawMode(): void {
    if (!this.rawModeEnabled) return;
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
    this.rawModeEnabled = false;
  }

  writeStdout(data: string): void {
    process.stdout.write(data);
  }

  onStdinData(callback: (data: Buffer) => void): void {
    this.stdinCallbacks.push(callback);
    if (!this.stdinDataHandler) {
      this.stdinDataHandler = (data: Buffer) => {
        for (const cb of this.stdinCallbacks) {
          cb(data);
        }
      };
      process.stdin.on('data', this.stdinDataHandler);
    }
  }

  removeStdinData(callback: (data: Buffer) => void): void {
    const idx = this.stdinCallbacks.indexOf(callback);
    if (idx !== -1) {
      this.stdinCallbacks.splice(idx, 1);
    }
    if (this.stdinCallbacks.length === 0 && this.stdinDataHandler) {
      process.stdin.removeListener('data', this.stdinDataHandler);
      this.stdinDataHandler = null;
    }
  }

  getTerminalSize(): { columns: number; rows: number } {
    return {
      columns: process.stdout.columns || 80,
      rows: process.stdout.rows || 24,
    };
  }

  onResize(callback: (cols: number, rows: number) => void): void {
    this.resizeCallbacks.push(callback);
    if (!this.resizeHandler) {
      this.resizeHandler = () => {
        const size = this.getTerminalSize();
        for (const cb of this.resizeCallbacks) {
          cb(size.columns, size.rows);
        }
      };
      process.stdout.on('resize', this.resizeHandler);
    }
  }

  removeResize(callback: (cols: number, rows: number) => void): void {
    const idx = this.resizeCallbacks.indexOf(callback);
    if (idx !== -1) {
      this.resizeCallbacks.splice(idx, 1);
    }
    if (this.resizeCallbacks.length === 0 && this.resizeHandler) {
      process.stdout.removeListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  enableAltScreen(): void {
    this.writeStdout('\x1b[?1049h');
  }

  disableAltScreen(): void {
    this.writeStdout('\x1b[?1049l');
  }
}

// ---------------------------------------------------------------------------
// MockPlatform — for testing
// ---------------------------------------------------------------------------

/**
 * Mock platform adapter for testing.
 * Captures all output and provides test helpers to simulate input and resize.
 */
export class MockPlatform implements PlatformAdapter {
  written: string[] = [];
  size: { columns: number; rows: number } = { columns: 80, rows: 24 };
  rawMode: boolean = false;
  altScreen: boolean = false;
  private stdinCallbacks: ((data: Buffer) => void)[] = [];
  private resizeCallbacks: ((cols: number, rows: number) => void)[] = [];

  enableRawMode(): void {
    this.rawMode = true;
  }

  disableRawMode(): void {
    this.rawMode = false;
  }

  writeStdout(data: string): void {
    this.written.push(data);
  }

  onStdinData(callback: (data: Buffer) => void): void {
    this.stdinCallbacks.push(callback);
  }

  removeStdinData(callback: (data: Buffer) => void): void {
    const idx = this.stdinCallbacks.indexOf(callback);
    if (idx !== -1) {
      this.stdinCallbacks.splice(idx, 1);
    }
  }

  getTerminalSize(): { columns: number; rows: number } {
    return { ...this.size };
  }

  onResize(callback: (cols: number, rows: number) => void): void {
    this.resizeCallbacks.push(callback);
  }

  removeResize(callback: (cols: number, rows: number) => void): void {
    const idx = this.resizeCallbacks.indexOf(callback);
    if (idx !== -1) {
      this.resizeCallbacks.splice(idx, 1);
    }
  }

  enableAltScreen(): void {
    this.altScreen = true;
  }

  disableAltScreen(): void {
    this.altScreen = false;
  }

  // --- Test helpers ---

  /** Simulate stdin input delivery to all registered callbacks. */
  simulateInput(data: string | Buffer): void {
    const buf = typeof data === 'string' ? Buffer.from(data) : data;
    for (const cb of this.stdinCallbacks) {
      cb(buf);
    }
  }

  /** Simulate terminal resize event. */
  simulateResize(cols: number, rows: number): void {
    this.size = { columns: cols, rows: rows };
    for (const cb of this.resizeCallbacks) {
      cb(cols, rows);
    }
  }

  /** Get all written output concatenated into a single string. */
  getOutput(): string {
    return this.written.join('');
  }

  /** Clear captured output. */
  clearOutput(): void {
    this.written = [];
  }

  /** Get the number of registered stdin callbacks. */
  getStdinCallbackCount(): number {
    return this.stdinCallbacks.length;
  }

  /** Get the number of registered resize callbacks. */
  getResizeCallbackCount(): number {
    return this.resizeCallbacks.length;
  }
}
