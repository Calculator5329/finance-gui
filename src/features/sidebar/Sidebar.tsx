import { observer } from 'mobx-react-lite';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive } from 'lucide-react';
import { NodePalette } from './NodePalette';
import { SetupManager } from './SetupManager';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = observer(function Sidebar({ isOpen }: SidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 220, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="h-full bg-zinc-900/80 backdrop-blur-md border-r border-zinc-800 overflow-hidden shrink-0 z-40"
        >
          <div className="w-[220px] h-full flex flex-col">
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                Nodes
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              <NodePalette />

              {/* Setups section */}
              <div className="mt-4 pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-1.5 px-2.5 py-1 mb-1.5">
                  <Archive size={10} className="text-zinc-600" />
                  <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                    Saved Setups
                  </span>
                </div>
                <div className="px-1">
                  <SetupManager />
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
});
