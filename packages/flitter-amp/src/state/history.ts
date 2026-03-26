// Prompt history — in-memory history of previous prompts for Ctrl+R navigation

export class PromptHistory {
  private entries: string[] = [];
  private cursor = -1;
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  push(text: string): void {
    if (text.trim() === '') return;
    // Deduplicate consecutive identical entries
    if (this.entries.length > 0 && this.entries[this.entries.length - 1] === text) return;
    this.entries.push(text);
    if (this.entries.length > this.maxSize) {
      this.entries.shift();
    }
    this.cursor = -1;
  }

  previous(): string | null {
    if (this.entries.length === 0) return null;
    if (this.cursor === -1) {
      this.cursor = this.entries.length - 1;
    } else if (this.cursor > 0) {
      this.cursor--;
    } else {
      return null; // At oldest entry
    }
    return this.entries[this.cursor];
  }

  next(): string | null {
    if (this.cursor === -1) return null;
    if (this.cursor < this.entries.length - 1) {
      this.cursor++;
      return this.entries[this.cursor];
    }
    this.cursor = -1;
    return ''; // Return empty to restore "new prompt" state
  }

  resetCursor(): void {
    this.cursor = -1;
  }
}
