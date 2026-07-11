import { useEffect } from 'react';
import { useStore } from '../stores/RootStore';

/**
 * Returns true when the event originated from a text-editing surface, where the
 * browser's native undo/redo should win over the app-level history.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

/**
 * Global keyboard bindings for undo/redo:
 *   - Undo:  Ctrl/Cmd + Z
 *   - Redo:  Ctrl/Cmd + Shift + Z  (also Ctrl/Cmd + Y)
 *
 * Ignored while a text field is focused so native text editing is unaffected.
 */
export function useUndoRedoHotkeys(): void {
  const store = useStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      const key = e.key.toLowerCase();
      const isRedo = (key === 'z' && e.shiftKey) || key === 'y';
      const isUndo = key === 'z' && !e.shiftKey;

      if (isRedo) {
        e.preventDefault();
        store.redo();
      } else if (isUndo) {
        e.preventDefault();
        store.undo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);
}
