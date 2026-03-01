import { useState, useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Save, FolderOpen, Trash2, Download, Upload, X, Check } from 'lucide-react';
import { useStore } from '../../stores/RootStore';

export const SetupManager = observer(function SetupManager() {
  const rootStore = useStore();
  const [isNaming, setIsNaming] = useState(false);
  const [setupName, setSetupName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    const name = setupName.trim();
    if (!name) return;
    rootStore.saveSetup(name);
    setSetupName('');
    setIsNaming(false);
  }, [rootStore, setupName]);

  const handleLoad = useCallback(
    (id: string) => {
      rootStore.loadSetup(id);
    },
    [rootStore],
  );

  const handleDelete = useCallback(
    (id: string) => {
      rootStore.deleteSetup(id);
    },
    [rootStore],
  );

  const handleExport = useCallback(
    (id: string) => {
      rootStore.exportSetup(id);
    },
    [rootStore],
  );

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          rootStore.importSetup(e.target?.result as string);
        } catch (err) {
          console.warn('[SetupManager] Failed to import setup:', err);
        }
      };
      reader.readAsText(file);
      // Reset input so the same file can be re-imported
      event.target.value = '';
    },
    [rootStore],
  );

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      {/* Save button / inline name input */}
      {isNaming ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={setupName}
            onChange={(e) => setSetupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsNaming(false);
            }}
            placeholder="Setup name..."
            autoFocus
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 transition-colors"
          />
          <button
            onClick={handleSave}
            disabled={!setupName.trim()}
            className="p-1 rounded hover:bg-zinc-800 text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Save"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => setIsNaming(false)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsNaming(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium text-cyan-400 border border-cyan-500/20 rounded-md hover:bg-cyan-500/10 transition-colors"
          >
            <Save size={11} />
            Save Current
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-zinc-500 border border-zinc-800 rounded-md hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            title="Import setup from file"
          >
            <Upload size={11} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      )}

      {/* Saved setups list */}
      {rootStore.savedSetups.length > 0 && (
        <div className="space-y-1">
          {rootStore.savedSetups.map((setup) => (
            <div
              key={setup.id}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-zinc-900/40 border border-zinc-800/50 group hover:border-zinc-700 transition-colors"
            >
              <FolderOpen size={11} className="text-zinc-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-zinc-300 truncate">{setup.name}</div>
                <div className="text-[9px] text-zinc-600">{formatDate(setup.createdAt)}</div>
              </div>
              <button
                onClick={() => handleLoad(setup.id)}
                className="p-0.5 rounded text-cyan-500/60 hover:text-cyan-400 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
                title="Load setup"
              >
                <FolderOpen size={11} />
              </button>
              <button
                onClick={() => handleExport(setup.id)}
                className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
                title="Export as JSON"
              >
                <Download size={11} />
              </button>
              <button
                onClick={() => handleDelete(setup.id)}
                className="p-0.5 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete setup"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {rootStore.savedSetups.length === 0 && !isNaming && (
        <div className="text-[9px] text-zinc-600 text-center py-1">
          No saved setups yet
        </div>
      )}
    </div>
  );
});
