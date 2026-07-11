/**
 * Generic, bounded undo/redo history stack.
 *
 * Pure and framework-agnostic (no MobX, no React, no app types) so it can be
 * unit-tested in isolation and reused by any store.  Callers push immutable
 * snapshots of whatever state they want to make undoable; `undo`/`redo` return
 * the snapshot to restore (or `undefined` at the ends of the timeline).
 *
 * Behaviour:
 *  - Linear timeline with a cursor.  `undo`/`redo` move the cursor.
 *  - Pushing a new snapshot after one or more undos truncates the "redo"
 *    branch (standard editor semantics — you can't redo into an abandoned
 *    future).
 *  - Bounded: at most `limit` snapshots are retained; the oldest are dropped.
 *  - Optional coalescing: consecutive pushes that share a `coalesceKey` and
 *    land within `coalesceMs` of each other are merged into a single undo step
 *    (e.g. dragging a slider produces one undoable edit, not hundreds).
 */

export interface HistoryStackOptions {
  /** Maximum number of snapshots retained. Clamped to >= 1. Default 50. */
  limit?: number;
  /**
   * Time window (ms) within which same-`coalesceKey` pushes merge into the
   * current entry instead of creating a new one. Clamped to >= 0. Default 400.
   */
  coalesceMs?: number;
  /** Injectable clock (ms). Defaults to `Date.now`. Used for coalescing/tests. */
  clock?: () => number;
}

interface HistoryEntry<T> {
  state: T;
  coalesceKey: string | undefined;
  timestamp: number;
}

const DEFAULT_LIMIT = 50;
const DEFAULT_COALESCE_MS = 400;

export class HistoryStack<T> {
  private entries: HistoryEntry<T>[] = [];
  /** Index of the current snapshot in `entries`; -1 when empty. */
  private cursor = -1;

  private readonly limit: number;
  private readonly coalesceMs: number;
  private readonly clock: () => number;

  constructor(options: HistoryStackOptions = {}) {
    this.limit = Math.max(1, Math.floor(options.limit ?? DEFAULT_LIMIT));
    this.coalesceMs = Math.max(0, options.coalesceMs ?? DEFAULT_COALESCE_MS);
    this.clock = options.clock ?? (() => Date.now());
  }

  /** Number of snapshots currently retained. */
  get size(): number {
    return this.entries.length;
  }

  /** True when there is an earlier snapshot to undo to. */
  get canUndo(): boolean {
    return this.cursor > 0;
  }

  /** True when there is a later snapshot to redo to. */
  get canRedo(): boolean {
    return this.cursor >= 0 && this.cursor < this.entries.length - 1;
  }

  /** The snapshot at the current cursor, or `undefined` when empty. */
  get current(): T | undefined {
    return this.cursor >= 0 ? this.entries[this.cursor].state : undefined;
  }

  /**
   * Record a new snapshot as the current state.
   *
   * If `coalesceKey` is provided and matches the current entry's key within the
   * coalesce window (and the cursor is at the tip of the timeline), the current
   * entry is replaced rather than appended — merging rapid edits into one step.
   * Otherwise any redo branch is truncated and a new entry is appended.
   */
  push(state: T, coalesceKey?: string): void {
    const atTip = this.cursor === this.entries.length - 1;
    const now = this.clock();

    if (
      atTip &&
      this.cursor >= 0 &&
      coalesceKey !== undefined &&
      this.entries[this.cursor].coalesceKey === coalesceKey &&
      now - this.entries[this.cursor].timestamp <= this.coalesceMs
    ) {
      // Merge into the current entry: keeps a single undo step for the burst.
      this.entries[this.cursor] = { state, coalesceKey, timestamp: now };
      return;
    }

    // Drop any abandoned redo branch before appending.
    if (this.cursor < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.cursor + 1);
    }

    this.entries.push({ state, coalesceKey, timestamp: now });
    this.cursor = this.entries.length - 1;
    this.enforceLimit();
  }

  /** Move back one step, returning the snapshot to restore (or `undefined`). */
  undo(): T | undefined {
    if (!this.canUndo) return undefined;
    this.cursor -= 1;
    return this.entries[this.cursor].state;
  }

  /** Move forward one step, returning the snapshot to restore (or `undefined`). */
  redo(): T | undefined {
    if (!this.canRedo) return undefined;
    this.cursor += 1;
    return this.entries[this.cursor].state;
  }

  /** Discard the entire timeline. */
  clear(): void {
    this.entries = [];
    this.cursor = -1;
  }

  private enforceLimit(): void {
    const overflow = this.entries.length - this.limit;
    if (overflow > 0) {
      this.entries = this.entries.slice(overflow);
      this.cursor = Math.max(0, this.cursor - overflow);
    }
  }
}
