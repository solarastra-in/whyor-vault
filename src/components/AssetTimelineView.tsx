import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, AlertTriangle, Clock, ShieldCheck, 
  ChevronRight, ArrowRight, Eye, Share2, Edit3, 
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { DecryptedItem } from '../types';
import AssetBadge from './AssetBadge';
import AssetExpirationBadge from './AssetExpirationBadge';
import { getAssetExpirationStatus, AssetDueEvent } from '../utils/expirationAlerts';
import { cn } from '../lib/utils';

interface AssetTimelineViewProps {
  items: DecryptedItem[];
  onOpenDrawer: (item: DecryptedItem) => void;
  onEdit: (item: DecryptedItem) => void;
  onShare: (item: DecryptedItem) => void;
}

export const AssetTimelineView: React.FC<AssetTimelineViewProps> = ({
  items,
  onOpenDrawer,
  onEdit,
  onShare
}) => {
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'urgent' | 'premiums' | 'maturities'>('all');

  // Extract and compile all scheduled timeline events across all assets
  const timelineEvents: { item: DecryptedItem; event: AssetDueEvent }[] = [];

  items.forEach(item => {
    const status = getAssetExpirationStatus(item);
    status.allEvents.forEach(event => {
      timelineEvents.push({ item, event });
    });
  });

  // Sort events chronologically: most urgent / closest targetDate first
  timelineEvents.sort((a, b) => {
    return a.event.targetDate.getTime() - b.event.targetDate.getTime();
  });

  // Filter events based on active tab
  const filteredEvents = timelineEvents.filter(({ event }) => {
    if (timelineFilter === 'urgent') return event.isWithin30Days;
    if (timelineFilter === 'premiums') return event.type === 'premium';
    if (timelineFilter === 'maturities') return event.type === 'maturity' || event.type === 'expiration';
    return true;
  });

  const urgentCount = timelineEvents.filter(e => e.event.isWithin30Days).length;

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Asset Expiration &amp; Renewal Timeline
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Chronological schedule of premium due dates, patent deadlines, and policy maturities
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTimelineFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              timelineFilter === 'all'
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            All Dates ({timelineEvents.length})
          </button>

          <button
            type="button"
            onClick={() => setTimelineFilter('urgent')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              timelineFilter === 'urgent'
                ? "bg-red-600 text-white shadow-sm"
                : "bg-slate-950 text-red-300 hover:bg-red-950/50 border border-red-500/30"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Urgent &lt;30d ({urgentCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setTimelineFilter('premiums')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              timelineFilter === 'premiums'
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            Premiums Due
          </button>

          <button
            type="button"
            onClick={() => setTimelineFilter('maturities')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              timelineFilter === 'maturities'
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            Maturities &amp; Expiries
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length > 0 ? (
        <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {filteredEvents.map(({ item, event }, index) => {
            const isCritical = event.isWithin30Days;

            return (
              <motion.div
                key={`${item.id}-${event.field}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onOpenDrawer(item)}
                className={cn(
                  "relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group bg-slate-900/90 hover:bg-slate-850",
                  isCritical 
                    ? "border-red-500/50 shadow-md shadow-red-950/30" 
                    : "border-slate-800 hover:border-slate-700"
                )}
              >
                {/* Node Bullet on Timeline Line */}
                <div className={cn(
                  "absolute -left-[31px] sm:-left-[39px] top-6 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-slate-950 transition-transform group-hover:scale-125",
                  isCritical ? "border-red-500 bg-red-950 text-red-400 animate-pulse" : "border-indigo-500 text-indigo-400"
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isCritical ? "bg-red-500" : "bg-indigo-400"
                  )} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                      <AssetBadge type={item.type} variant="glow" short />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                          isCritical 
                            ? "bg-red-950/80 text-red-300 border-red-500/50" 
                            : "bg-slate-950 text-slate-300 border-slate-800"
                        )}>
                          {event.label}
                        </span>
                        <AssetBadge type={item.type} variant="pill" short />
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {item.institution || item.carrier || 'Self-Custody'}
                      </p>
                    </div>
                  </div>

                  {/* Date & Urgency Countdown Pill */}
                  <div className="flex items-center gap-4 shrink-0 sm:text-right">
                    <div>
                      <div className="text-xs font-mono font-bold text-white">
                        {event.fullFormattedDate}
                      </div>
                      <div className={cn(
                        "text-[11px] font-mono font-black mt-0.5",
                        event.isOverdue 
                          ? "text-red-400 animate-pulse uppercase" 
                          : isCritical 
                            ? "text-amber-400 font-bold" 
                            : "text-slate-400"
                      )}>
                        {event.badgeText}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onShare(item)}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-indigo-950 text-slate-400 hover:text-indigo-300 transition-colors"
                        title="Share record"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Edit record"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenDrawer(item)}
                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        title="View details"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">Zero Upcoming Expirations</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono">
            {timelineFilter === 'urgent' 
              ? 'No assets with dates due or expiring in the next 30 days.' 
              : 'Add expiration dates, policy premium due dates, or patent filing deadlines to track them here.'}
          </p>
        </div>
      )}
    </div>
  );
};
