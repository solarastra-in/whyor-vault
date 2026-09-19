import React from 'react';
import { AlertTriangle, Clock, Calendar, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAssetExpirationStatus, AssetDueEvent } from '../utils/expirationAlerts';

export interface AssetExpirationBadgeProps {
  item: any;
  variant?: 'badge' | 'compact' | 'pill' | 'detailed';
  showIcon?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function AssetExpirationBadge({
  item,
  variant = 'badge',
  showIcon = true,
  className,
  onClick
}: AssetExpirationBadgeProps) {
  const status = getAssetExpirationStatus(item);

  // If no expiration, premium, collection, or maturity date is tracked, don't render
  if (!status.hasTrackedDate || !status.mostUrgentEvent) {
    return null;
  }

  const event = status.mostUrgentEvent;
  const isRedAlert = status.isWithin30Days; // Turns red 30 days before expiration, premium, collection, or maturity

  if (variant === 'detailed') {
    return (
      <div 
        className={cn(
          "p-3 rounded-xl border text-left transition-all",
          isRedAlert 
            ? "bg-red-950/25 border-red-500/30 text-red-100 shadow-sm shadow-red-950/40" 
            : "bg-slate-950/45 border-slate-800/80 text-slate-300",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 font-bold text-[10px] tracking-wider uppercase">
            {isRedAlert ? (
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}
            <span className={isRedAlert ? "text-red-300 font-extrabold" : "text-slate-300"}>
              {event.label} Schedule
            </span>
          </div>

          <span 
            className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-mono font-black tracking-wider uppercase border",
              isRedAlert
                ? "bg-red-900/60 border-red-500 text-white animate-pulse"
                : "bg-slate-900 border-slate-700 text-slate-300"
            )}
          >
            {event.badgeText}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-800/60 font-mono">
          <div>
            <span className="text-slate-500 block text-[8px] uppercase tracking-wider">Scheduled Date</span>
            <span className="font-bold text-slate-200">{event.fullFormattedDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[8px] uppercase tracking-wider">Timeline Margin</span>
            <span className={cn(
              "font-bold",
              event.daysRemaining < 0 ? "text-rose-400" :
              event.daysRemaining <= 30 ? "text-red-300" : "text-emerald-400"
            )}>
              {event.daysRemaining < 0 
                ? `${Math.abs(event.daysRemaining)} days overdue`
                : event.daysRemaining === 0 
                ? 'Due Today' 
                : `${event.daysRemaining} days remaining`}
            </span>
          </div>
        </div>

        {isRedAlert && (
          <div className="mt-2.5 pt-2 border-t border-red-500/20 flex items-start gap-1.5 text-[9.5px] leading-tight text-red-300/90 font-sans">
            <AlertOctagon className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
            <span>
              <strong>30-Day Alert Protocol:</strong> Action required. Verify renewal, payment disbursement, or legal custodian validation.
            </span>
          </div>
        )}

        {status.allEvents.length > 1 && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Other Tracked Timelines:</span>
            {status.allEvents.slice(1).map((ev: AssetDueEvent, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span>{ev.label}:</span>
                <span className={ev.isWithin30Days ? "text-red-400 font-bold" : "text-slate-300"}>
                  {ev.fullFormattedDate} ({ev.daysRemaining >= 0 ? `${ev.daysRemaining}d` : 'overdue'})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Badge variants: 'badge', 'compact', 'pill'
  const isPill = variant === 'pill';
  const isCompact = variant === 'compact';

  return (
    <span
      onClick={onClick}
      title={`${event.label}: ${event.fullFormattedDate} (${event.daysRemaining >= 0 ? `${event.daysRemaining} days left` : 'overdue'}). ${isRedAlert ? 'Within 30-day alert threshold!' : ''}`}
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-bold tracking-wider select-none transition-all",
        isCompact 
          ? "px-1.5 py-0.5 text-[8px] rounded" 
          : isPill
          ? "px-2.5 py-0.5 text-[8.5px] rounded-full"
          : "px-2 py-0.5 text-[9px] rounded-md",
        
        // When within 30 days, turns RED!
        isRedAlert
          ? "bg-red-950/80 border border-red-500/80 text-red-200 shadow-sm shadow-red-950/50 hover:bg-red-900/80 hover:border-red-400 ring-1 ring-red-500/30"
          : "bg-slate-850/80 border border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white",
        
        onClick && "cursor-pointer active:scale-95",
        className
      )}
    >
      {/* Animated Ping dot or Alert Icon for urgent red alert */}
      {isRedAlert ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      ) : showIcon ? (
        <Clock className={cn("shrink-0 text-slate-400", isCompact ? "h-2 w-2" : "h-2.5 w-2.5")} />
      ) : null}

      {/* Badge label text */}
      <span className={cn(
        "whitespace-nowrap uppercase leading-none font-black",
        isRedAlert ? "text-red-100" : "text-slate-300"
      )}>
        {event.badgeText}
      </span>
    </span>
  );
}
