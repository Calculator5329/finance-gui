import { observer } from 'mobx-react-lite';
import { Undo2, Redo2 } from 'lucide-react';
import { useStore } from '../stores/RootStore';

const buttonClass =
  'p-1.5 rounded-md transition-colors text-zinc-400 enabled:hover:bg-zinc-800 ' +
  'enabled:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed';

/** Undo / redo toolbar buttons, reactively enabled/disabled. */
export const UndoRedoButtons = observer(function UndoRedoButtons() {
  const store = useStore();

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => store.undo()}
        disabled={!store.canUndo}
        className={buttonClass}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <Undo2 size={18} />
      </button>
      <button
        type="button"
        onClick={() => store.redo()}
        disabled={!store.canRedo}
        className={buttonClass}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
      >
        <Redo2 size={18} />
      </button>
    </div>
  );
});
