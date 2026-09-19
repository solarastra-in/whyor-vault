import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, Share2, Download, X, Trash2, 
  ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { DecryptedItem } from '../types';

interface AssetBatchBarProps {
  selectedCount: number;
  onShareSelected: () => void;
  onExportSelected: () => void;
  onDeselectAll: () => void;
}

export const AssetBatchBar: React.FC<AssetBatchBarProps> = ({
  selectedCount,
  onShareSelected,
  onExportSelected,
  onDeselectAll
}) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 border border-indigo-500/40 backdrop-blur-md shadow-2xl shadow-indigo-950/60 flex items-center gap-4 text-white"
        >
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
              {selectedCount}
            </div>
            <span className="text-xs font-bold font-mono">
              {selectedCount === 1 ? 'Record Selected' : 'Records Selected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onShareSelected}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Selected</span>
            </button>

            <button
              type="button"
              onClick={onExportSelected}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={onDeselectAll}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
