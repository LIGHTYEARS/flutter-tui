// Key system for widget identity and reconciliation
// Amp ref: Used in Widget.canUpdate() for element reconciliation (widget-tree.md)

let _nextUniqueId = 0;
let _nextGlobalId = 0;

/**
 * Abstract base class for widget keys.
 * Keys control whether an Element can be reused when the widget tree is rebuilt.
 */
export abstract class Key {
  abstract equals(other: Key): boolean;
  abstract toString(): string;
}

/**
 * A key that uses value-based equality.
 * Two ValueKeys with the same value are considered equal.
 */
export class ValueKey<T> extends Key {
  readonly value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  equals(other: Key): boolean {
    if (!(other instanceof ValueKey)) return false;
    return this.value === other.value;
  }

  toString(): string {
    return `ValueKey(${this.value})`;
  }
}

/**
 * A key that is unique by identity.
 * Every UniqueKey instance is different from every other, even other UniqueKeys.
 */
export class UniqueKey extends Key {
  readonly _id: number;

  constructor() {
    super();
    this._id = _nextUniqueId++;
  }

  equals(other: Key): boolean {
    return this === other;
  }

  toString(): string {
    return `UniqueKey(#${this._id})`;
  }
}

/**
 * GlobalKey placeholder for Phase 3.
 * Will eventually provide access to currentState/currentContext.
 * For now, behaves like UniqueKey with its own ID sequence.
 */
export class GlobalKey extends Key {
  readonly _id: number;

  constructor() {
    super();
    this._id = _nextGlobalId++;
  }

  equals(other: Key): boolean {
    return this === other;
  }

  toString(): string {
    return `GlobalKey(#${this._id})`;
  }
}
