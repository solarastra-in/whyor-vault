import React from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, ShieldCheck, Users, AlertTriangle, 
  LayoutGrid, List, Layers, Calendar, ArrowUpDown, 
  CheckSquare, Sparkles, Filter, X
} from 'lucide-react';
import { DecryptedItem, ViewMode, SortField, SortDirection } from '../types';
import { calculateEstateAggregates, formatCurrency } from './AssetPillars';
import { cn } from '../lib/utils';

interface AssetPortfolioStatsProps {
  items: DecryptedItem[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;
  activeQuickFilter: string | null;
  onQuickFilterChange: (filter: string | null) => void;
}

export const AssetPortfolioStats: React.FC<AssetPortfolioStatsProps> = ({
  items,
  viewMode,
  onViewModeChange,
  sortField,
  sortDirection,
  onSortChange,
  isSelectionMode,
  onToggleSelectionMode,
  selectedCount,
  activeQuickFilter,
  onQuickFilterChange
}) => {
  const stats = calculateEstateAggregates(items);

  const viewModes: { id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'grid', label: 'Grid Cards', icon: LayoutGrid },
    { id: 'table', label: 'Dense Table', icon: List },
    { id: 'grouped', label: 'Estate Pillars', icon: Layers },
    { id: 'timeline', label: 'Due Timeline', icon: Calendar }
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Executive Portfolio Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Tracked Value */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Tracked Net Value
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/20 text-indigo-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
            {formatCurrency(stats.totalTrackedValue)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Across {stats.totalAssetsCount} vaulted records
          </div>
        </motion.div>

        {/* Metric 2: Insurance Coverage */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Life Protection
            </span>
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
            {stats.totalInsuranceCoverage > 0 ? formatCurrency(stats.totalInsuranceCoverage) : '$0'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Total active policy coverages
          </div>
        </motion.div>

        {/* Metric 3: Beneficiary Heir Allocation */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Heir Allocation
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/20 text-emerald-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-400">
              {stats.beneficiaryCoveragePercent}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({stats.assetsWithBeneficiaryCount}/{stats.totalAssetsCount})
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.beneficiaryCoveragePercent}%` }}
            />
          </div>
        </motion.div>

        {/* Metric 4: Attention Required */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => {
            if (stats.urgentAlertsCount > 0) {
              onQuickFilterChange(activeQuickFilter === 'urgent' ? null : 'urgent');
            } else if (stats.missingBeneficiaryCount > 0) {
              onQuickFilterChange(activeQuickFilter === 'missing_beneficiary' ? null : 'missing_beneficiary');
            }
          }}
          className={cn(
            "p-4 rounded-xl border shadow-sm relative overflow-hidden transition-all cursor-pointer",
            stats.urgentAlertsCount > 0 
              ? "bg-red-950/30 border-red-500/40 hover:bg-red-950/40 hover:border-red-400" 
              : stats.missingBeneficiaryCount > 0
                ? "bg-amber-950/30 border-amber-500/40 hover:bg-amber-950/40 hover:border-amber-400"
                : "bg-slate-900/90 border-slate-800"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Attention Index
            </span>
            <div className={cn(
              "p-1.5 rounded-lg border",
              stats.urgentAlertsCount > 0 
                ? "bg-red-950 text-red-400 border-red-500/30 animate-pulse" 
                : stats.missingBeneficiaryCount > 0
                  ? "bg-amber-950 text-amber-400 border-amber-500/30"
                  : "bg-slate-950 text-slate-400 border-slate-800"
            )}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white flex items-center gap-2">
            <span>{stats.urgentAlertsCount + stats.missingBeneficiaryCount}</span>
            {stats.urgentAlertsCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-bold uppercase tracking-wider">
                {stats.urgentAlertsCount} Due &lt;30d
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium truncate">
            {stats.urgentAlertsCount > 0 
              ? `${stats.urgentAlertsCount} urgent renewal/premium date(s)`
              : stats.missingBeneficiaryCount > 0
                ? `${stats.missingBeneficiaryCount} asset(s) without designated heir`
                : 'All estate safety thresholds healthy'}
          </div>
        </motion.div>
      </div>

      {/* Control Bar: View Switcher, Sorting, Quick Filters, Batch Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-md">
        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800/80">
          {viewModes.map(mode => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onViewModeChange(mode.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer select-none",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                )}
                title={`Switch to ${mode.label} mode`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {stats.urgentAlertsCount > 0 && (
            <button
              type="button"
              onClick={() => onQuickFilterChange(activeQuickFilter === 'urgent' ? null : 'urgent')}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5",
                activeQuickFilter === 'urgent'
                  ? "bg-red-600 text-white border-red-400 shadow-sm ring-1 ring-white/50"
                  : "bg-red-950/50 text-red-300 border-red-500/40 hover:bg-red-900"
              )}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              <span>Expiring &lt;30d ({stats.urgentAlertsCount})</span>
            </button>
          )}

          {stats.missingBeneficiaryCount > 0 && (
            <button
              type="button"
              onClick={() => onQuickFilterChange(activeQuickFilter === 'missing_beneficiary' ? null : 'missing_beneficiary')}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer",
                activeQuickFilter === 'missing_beneficiary'
                  ? "bg-amber-600 text-white border-amber-400 shadow-sm ring-1 ring-white/50"
                  : "bg-amber-950/50 text-amber-300 border-amber-500/40 hover:bg-amber-900"
              )}
            >
              Needs Heir ({stats.missingBeneficiaryCount})
            </button>
          )}

          {activeQuickFilter && (
            <button
              type="button"
              onClick={() => onQuickFilterChange(null)}
              className="px-2 py-1 rounded-full text-[10px] font-mono font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
              title="Clear active filter"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Sort & Multi-Select Controls */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-[11px] font-mono">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortField}
              onChange={(e) => onSortChange(e.target.value as SortField)}
              className="bg-transparent border-none text-slate-200 font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="updatedAt" className="bg-slate-900">Recently Updated</option>
              <option value="name" className="bg-slate-900">Asset Name (A-Z)</option>
              <option value="value" className="bg-slate-900">Highest Value</option>
              <option value="expiration" className="bg-slate-900">Next Expiration/Due</option>
              <option value="institution" className="bg-slate-900">Institution</option>
              <option value="type" className="bg-slate-900">Category Type</option>
            </select>
            <span className="text-[10px] font-bold text-indigo-400 uppercase">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          </div>

          {/* Batch Selection Toggle Button */}
          <button
            type="button"
            onClick={onToggleSelectionMode}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer select-none",
              isSelectionMode 
                ? "bg-indigo-950 border-indigo-500 text-indigo-300 shadow-sm" 
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            )}
            title="Toggle batch selection checkboxes"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Select</span>
            {selectedCount > 0 && (
              <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                {selectedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
