import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HistoryStack } from './history.ts';

test('starts empty', () => {
  const h = new HistoryStack<number>();
  assert.equal(h.size, 0);
  assert.equal(h.current, undefined);
  assert.equal(h.canUndo, false);
  assert.equal(h.canRedo, false);
  assert.equal(h.undo(), undefined);
  assert.equal(h.redo(), undefined);
});

test('push records snapshots and tracks current', () => {
  const h = new HistoryStack<string>();
  h.push('a');
  assert.equal(h.current, 'a');
  assert.equal(h.size, 1);
  assert.equal(h.canUndo, false); // only one entry -> nothing to undo to
  h.push('b');
  assert.equal(h.current, 'b');
  assert.equal(h.size, 2);
  assert.equal(h.canUndo, true);
  assert.equal(h.canRedo, false);
});

test('undo and redo walk the timeline', () => {
  const h = new HistoryStack<string>();
  h.push('a');
  h.push('b');
  h.push('c');

  assert.equal(h.undo(), 'b');
  assert.equal(h.current, 'b');
  assert.equal(h.canRedo, true);

  assert.equal(h.undo(), 'a');
  assert.equal(h.current, 'a');
  assert.equal(h.canUndo, false);
  assert.equal(h.undo(), undefined); // clamped at the start

  assert.equal(h.redo(), 'b');
  assert.equal(h.redo(), 'c');
  assert.equal(h.canRedo, false);
  assert.equal(h.redo(), undefined); // clamped at the end
});

test('pushing after undo truncates the redo branch', () => {
  const h = new HistoryStack<string>();
  h.push('a');
  h.push('b');
  h.push('c');

  h.undo(); // -> b
  h.undo(); // -> a
  assert.equal(h.current, 'a');
  assert.equal(h.canRedo, true);

  h.push('x'); // new action from 'a' abandons b, c
  assert.equal(h.current, 'x');
  assert.equal(h.canRedo, false);
  assert.equal(h.size, 2); // a, x

  assert.equal(h.undo(), 'a');
  assert.equal(h.redo(), 'x');
});

test('respects the bounded limit by dropping oldest entries', () => {
  const h = new HistoryStack<number>({ limit: 3 });
  h.push(1);
  h.push(2);
  h.push(3);
  h.push(4);
  h.push(5);

  assert.equal(h.size, 3); // only 3, 4, 5 retained
  assert.equal(h.current, 5);

  assert.equal(h.undo(), 4);
  assert.equal(h.undo(), 3);
  assert.equal(h.canUndo, false); // 1 and 2 were dropped
  assert.equal(h.undo(), undefined);
});

test('limit is clamped to at least 1', () => {
  const h = new HistoryStack<number>({ limit: 0 });
  h.push(1);
  h.push(2);
  assert.equal(h.size, 1);
  assert.equal(h.current, 2);
  assert.equal(h.canUndo, false);
});

test('coalesces same-key pushes within the window into one undo step', () => {
  let t = 1000;
  const h = new HistoryStack<number>({ coalesceMs: 400, clock: () => t });
  h.push(0); // baseline, no key

  t = 1000;
  h.push(1, 'slider');
  t = 1100;
  h.push(2, 'slider');
  t = 1300;
  h.push(3, 'slider'); // all within 400ms of the previous -> merged

  assert.equal(h.current, 3);
  assert.equal(h.size, 2); // baseline + single coalesced slider entry
  assert.equal(h.undo(), 0); // one undo jumps past the whole burst
});

test('does not coalesce once the window has elapsed', () => {
  let t = 0;
  const h = new HistoryStack<number>({ coalesceMs: 400, clock: () => t });
  t = 0;
  h.push(1, 'slider');
  t = 500; // > 400ms later
  h.push(2, 'slider');

  assert.equal(h.size, 2);
  assert.equal(h.undo(), 1);
});

test('does not coalesce across different keys', () => {
  const t = 0;
  const h = new HistoryStack<number>({ coalesceMs: 400, clock: () => t });
  h.push(1, 'a');
  h.push(2, 'b'); // same instant, different key -> separate entries
  assert.equal(h.size, 2);
  assert.equal(h.undo(), 1);
});

test('coalescing never merges into an abandoned redo branch', () => {
  const t = 0;
  const h = new HistoryStack<number>({ coalesceMs: 10_000, clock: () => t });
  h.push(1, 'k'); // entry 0, key 'k'
  h.push(2, 'x'); // entry 1, different key -> appended (cursor at tip = 1)
  h.undo(); // cursor now on entry 0 ('k'), NOT at the tip
  // Same key + within window, but cursor is off-tip: must append (truncating 2).
  h.push(3, 'k');
  assert.equal(h.current, 3);
  assert.equal(h.size, 2);
  assert.equal(h.canRedo, false);
  assert.equal(h.undo(), 1);
});

test('clear resets the timeline', () => {
  const h = new HistoryStack<number>();
  h.push(1);
  h.push(2);
  h.clear();
  assert.equal(h.size, 0);
  assert.equal(h.current, undefined);
  assert.equal(h.canUndo, false);
  assert.equal(h.canRedo, false);
});
