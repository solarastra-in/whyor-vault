import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, ChevronUp, Plus, DollarSign, 
  ShieldCheck, AlertTriangle, Layers
} from 'lucide-react';
import { DecryptedItem } from '../types';
import { ESTATE_PILLARS, EstatePillar, getItemMonetaryValue, formatCurrency } from './AssetPillars';
import AssetBadge from './AssetBadge';
import AssetExpirationBadge from './AssetExpirationBadge';
import { getAssetExpirationStatus } from '../utils/expirationAlerts';
import { cn } from '../lib/utils';

interface AssetGroupedViewProps {
  items: DecryptedItem[];
  onOpenDrawer: (item: DecryptedItem) => void;
  onEdit: (item: DecryptedItem) => void;
  onShare: (item: DecryptedItem) => void;
  onAddInPillar: (type: string) => void;
  selectedItemIds: string[];
  onToggleSelect: (id: string) => void;
  isSelectionMode: boolean;
}

export const AssetGroupedView: React.FC<AssetGroupedViewProps> = ({
  items,
  onOpenDrawer,
  onEdit,
  onShare,
  onAddInPillar,
  selectedItemIds,
  onToggleSelect,
  isSelectionMode
}) => {
  // By default, expand pillars that contain items
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ESTATE_PILLARS.forEach(p => {
      initial[p.id] = true;
    });
    return initial;
  });

  const togglePillar = (pillarId: string) => {
    setExpandedPillars(prev => ({
      ...prev,
      [pillarId]: !prev[pillarId]
    }));
  };

  return (
    <div className="space-y-6">
      {ESTATE_PILLARS.map((pillar) => {
        const pillarItems = items.filter(item => pillar.types.includes(item.type));
        const isExpanded = !!expandedPillars[pillar.id];
        const PillarIcon = pillar.icon;

        // Pillar aggregate calculations
        let totalPillarValue = 0;
        let urgentCount = 0;
        pillarItems.forEach(it => {
          totalPillarValue += getItemMonetaryValue(it);
          if (getAssetExpirationStatus(it).isWithin30Days) {
            urgentCount++;
          }
        });

        return (
          <motion.div
            key={pillar.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg overflow-hidden transition-all"
          >
            {/* Pillar Section Header */}
            <div
              onClick={() => togglePillar(pillar.id)}
              className="p-4 sm:p-5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-950 transition-colors select-none"
            >
              <div className="flex items-center gap-3.5">
                <div className={cn(
                  "p-3 rounded-xl border flex items-center justify-center shrink-0",
                  pillar.badgeBg,
                  pillar.borderAccent,
                  pillar.badgeText
                )}>
                  <PillarIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-extrabold text-white">
                      {pillar.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {pillarItems.length} {pillarItems.length === 1 ? 'Record' : 'Records'}
                    </span>
                    {urgentCount > 0 && (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/30 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>{urgentCount} Due &lt;30d</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                    {pillar.description}
                  </p>
                </div>
              </div>

              {/* Right Side Stats & Toggle */}
              <div className="flex items-center gap-4 shrink-0">
                {totalPillarValue > 0 && (
                  <div className="text-right hidden md:block">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block">
                      Pillar Subtotal
                    </span>
                    <span className="text-sm font-mono font-black text-emerald-400">
                      {formatCurrency(totalPillarValue)}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddInPillar(pillar.types[0]);
                  }}
                  className="p-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                  title={`Declare new record under ${pillar.name}`}
                >
                  <Plus className="w-4 h-4" />
                </button>

                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Pillar Content / Items Grid */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="p-4 sm:p-5"
                >
                  {pillarItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pillarItems.map((item) => {
                        const isSelected = selectedItemIds.includes(item.id);
                        const expStatus = getAssetExpirationStatus(item);
                        const monetaryValue = getItemMonetaryValue(item);

                        return (
                          <div
                            key={item.id}
                            onClick={() => onOpenDrawer(item)}
                            className={cn(
                              "p-4 rounded-xl border bg-slate-950/70 hover:bg-slate-850/80 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between",
                              isSelected 
                                ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-950/20" 
                                : "border-slate-800 hover:border-slate-700",
                              expStatus.isWithin30Days && "border-red-500/40"
                            )}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <AssetBadge type={item.type} variant="glow" short />
                                </div>
                                {expStatus.isWithin30Days && (
                                  <AssetExpirationBadge item={item} />
                                )}
                              </div>

                              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                                {item.name}
                              </h4>
                              <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                                {item.institution || 'Self-Custody Asset'}
                              </p>
                            </div>

                            {/* Footer Information */}
                            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                              <div>
                                {monetaryValue > 0 ? (
                                  <span className="font-mono font-bold text-emerald-400">
                                    {formatCurrency(monetaryValue)}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {item.ownershipType || 'Individual'}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onShare(item);
                                  }}
                                  className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 font-bold"
                                >
                                  Share
                                </button>
                                <span className="text-slate-700">•</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(item);
                                  }}
                                  className="text-[10px] font-mono text-slate-400 hover:text-white font-bold"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                      <p className="text-xs text-slate-500 font-mono mb-2">
                        No active records currently registered under {pillar.name}.
                      </p>
                      <button
                        type="button"
                        onClick={() => onAddInPillar(pillar.types[0])}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                      >
                        + Declare record in this portfolio
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};
