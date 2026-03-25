// InputBridge -- Connects InputParser to EventDispatcher
// Amp ref: input-system.md Section 3.1 (wiring), Section 9.1 (pipeline)
//
// The bridge:
//   1. Takes raw bytes (from stdin or mock)
//   2. Feeds them to InputParser
//   3. InputParser emits InputEvents via callback
//   4. Bridge forwards each event to EventDispatcher.dispatch()

import { InputParser } from './input-parser';
import { EventDispatcher } from './event-dispatcher';
import type { InputEvent } from './events';

/**
 * InputBridge connects the InputParser to the EventDispatcher.
 *
 * Usage:
 *   const bridge = new InputBridge();
 *   bridge.feed('\x1b[A');  // dispatches ArrowUp key event
 *   // or:
 *   bridge.attachStdin(process.stdin);  // auto-feed from stdin
 */
export class InputBridge {
  private _parser: InputParser;
  private _dispatcher: EventDispatcher;
  private _stdinCallback: ((data: Buffer) => void) | null = null;
  private _stdin: NodeJS.ReadableStream | null = null;
  private _disposed: boolean = false;

  constructor(parser?: InputParser, dispatcher?: EventDispatcher) {
    this._dispatcher = dispatcher ?? EventDispatcher.instance;
    this._parser = parser ?? new InputParser((event: InputEvent) => {
      if (!this._disposed) {
        this._dispatcher.dispatch(event);
      }
    });
  }

  /**
   * Feed raw bytes and dispatch resulting events.
   * Accepts strings or Buffers -- same as InputParser.feed().
   */
  feed(data: string | Buffer): void {
    if (this._disposed) return;
    this._parser.feed(data);
  }

  /**
   * Set up stdin reading (for production use).
   * Attaches a 'data' listener that feeds into the parser.
   */
  attachStdin(stdin: NodeJS.ReadableStream): void {
    if (this._disposed) return;
    this.detachStdin(); // clean up any previous attachment

    this._stdin = stdin;
    this._stdinCallback = (data: Buffer) => {
      if (!this._disposed) {
        this._parser.feed(data);
      }
    };
    stdin.on('data', this._stdinCallback);
  }

  /**
   * Detach from stdin.
   */
  detachStdin(): void {
    if (this._stdin && this._stdinCallback) {
      this._stdin.removeListener('data', this._stdinCallback);
      this._stdinCallback = null;
      this._stdin = null;
    }
  }

  /**
   * Get the underlying parser (for testing/access).
   */
  get parser(): InputParser {
    return this._parser;
  }

  /**
   * Get the underlying dispatcher (for testing/access).
   */
  get dispatcher(): EventDispatcher {
    return this._dispatcher;
  }

  /**
   * Dispose the bridge, cleaning up stdin attachment and parser.
   */
  dispose(): void {
    this._disposed = true;
    this.detachStdin();
    this._parser.dispose();
  }
}
