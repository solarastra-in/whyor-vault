import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Eye, Copy, Check, Share2, Edit3, Trash2, 
  AlertTriangle, MoreVertical, ShieldCheck, 
  Building2, Landmark, CheckSquare, Square
} from 'lucide-react';
import { DecryptedItem } from '../types';
import AssetBadge from './AssetBadge';
import AssetExpirationBadge from './AssetExpirationBadge';
import { getItemMonetaryValue, formatCurrency } from './AssetPillars';
import { getAssetExpirationStatus } from '../utils/expirationAlerts';
import { cn } from '../lib/utils';

interface AssetTableViewProps {
  items: DecryptedItem[];
  selectedItemIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenDrawer: (item: DecryptedItem) => void;
  onEdit: (item: DecryptedItem) => void;
  onShare: (item: DecryptedItem) => void;
  onDelete: (item: DecryptedItem) => void;
  isSelectionMode: boolean;
}

export const AssetTableView: React.FC<AssetTableViewProps> = ({
  items,
  selectedItemIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onOpenDrawer,
  onEdit,
  onShare,
  onDelete,
  isSelectionMode
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allSelected = items.length > 0 && selectedItemIds.length === items.length;

  const handleCopyValue = (e: React.MouseEvent, item: DecryptedItem) => {
    e.stopPropagation();
    const copyText = item.accountNumber || item.policyNumber || item.walletAddress || item.id;
    navigator.clipboard.writeText(copyText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    window.dispatchEvent(new CustomEvent('app-notify', {
      detail: { message: `Copied identifier for ${item.name}!`, type: 'success' }
    }));
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* Table Header */}
          <thead className="bg-slate-950/80 border-b border-slate-800 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              {isSelectionMode && (
                <th className="p-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={allSelected ? onDeselectAll : onSelectAll}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {allSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
              )}
              <th className="p-3.5 pl-4">Asset Record</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Institution / Custodian</th>
              <th className="p-3.5">Ownership &amp; Heir</th>
              <th className="p-3.5 text-right">Value / Coverage</th>
              <th className="p-3.5">Expiration / Due</th>
              <th className="p-3.5 pr-4 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {items.map((item, index) => {
              const isSelected = selectedItemIds.includes(item.id);
              const expStatus = getAssetExpirationStatus(item);
              const monetaryValue = getItemMonetaryValue(item);

              return (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  onClick={() => onOpenDrawer(item)}
                  className={cn(
                    "hover:bg-slate-850/60 transition-colors cursor-pointer group",
                    isSelected && "bg-indigo-950/25 border-l-2 border-l-indigo-500",
                    expStatus.isWithin30Days && "bg-red-950/15"
                  )}
                >
                  {/* Select Checkbox */}
                  {isSelectionMode && (
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onToggleSelect(item.id)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                    </td>
                  )}

                  {/* Asset Name */}
                  <td className="p-3.5 pl-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded-lg bg-slate-950 border border-slate-800 shrink-0 group-hover:border-slate-700 transition-colors">
                        <AssetBadge type={item.type} variant="glow" short />
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                          <span>{item.name}</span>
                          {expStatus.isWithin30Days && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                          {item.accountNumber 
                            ? `••••${item.accountNumber.slice(-4)}`
                            : item.policyNumber 
                              ? `POL: ${item.policyNumber}`
                              : item.id.slice(0, 12)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category Pill */}
                  <td className="p-3.5">
                    <AssetBadge type={item.type} variant="pill" short />
                  </td>

                  {/* Institution */}
                  <td className="p-3.5 text-slate-300 font-medium">
                    {item.institution || <span className="text-slate-600 italic">Self-Custody</span>}
                  </td>

                  {/* Ownership & Heir */}
                  <td className="p-3.5">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-300 block">
                        {item.ownershipType || 'Individual'}
                      </span>
                      {item.beneficiary ? (
                        <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{item.beneficiary}</span>
                        </span>
                      ) : (
                        <span className="text-amber-400/90 text-[10px] font-mono flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>No Heir Mapped</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Value / Coverage */}
                  <td className="p-3.5 text-right font-mono font-bold">
                    {monetaryValue > 0 ? (
                      <span className="text-emerald-400 font-mono">
                        {formatCurrency(monetaryValue)}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono">—</span>
                    )}
                  </td>

                  {/* Expiration / Next Due */}
                  <td className="p-3.5">
                    {expStatus.hasTrackedDate ? (
                      <AssetExpirationBadge item={item} />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-600">No deadline</span>
                    )}
                  </td>

                  {/* Quick Action Buttons */}
                  <td className="p-3.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* Copy Key Info */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyValue(e, item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Copy account / identifier"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Share */}
                      <button
                        type="button"
                        onClick={() => onShare(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                        title="Share asset"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit record"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* View Drawer */}
                      <button
                        type="button"
                        onClick={() => onOpenDrawer(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                        title="Open detailed drawer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
