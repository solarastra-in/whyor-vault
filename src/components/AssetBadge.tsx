import React from 'react';
import { 
  Building2, Coins, Landmark, CreditCard, TrendingUp, 
  ShieldCheck, Lightbulb, FolderOpen, FileText, Archive, 
  Cpu, Layers, HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface AssetTypeDefinition {
  key: string;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  glowColor: string;
  cardBorder: string;
  hexColor: string;
  hoverBg: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ASSET_TYPE_CONFIG: Record<string, AssetTypeDefinition> = {
  realestate: {
    key: 'realestate',
    label: 'Real Estate',
    shortLabel: 'Real Estate',
    badgeBg: 'bg-emerald-950/60',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    dotColor: 'bg-emerald-400',
    glowColor: 'shadow-emerald-500/20',
    cardBorder: 'border-l-emerald-500 hover:shadow-emerald-500/10',
    hexColor: '#10b981',
    hoverBg: 'hover:bg-emerald-900/60',
    icon: Building2
  },
  crypto: {
    key: 'crypto',
    label: 'Crypto & Digital',
    shortLabel: 'Crypto',
    badgeBg: 'bg-teal-950/60',
    badgeText: 'text-teal-300',
    badgeBorder: 'border-teal-500/40',
    dotColor: 'bg-teal-400',
    glowColor: 'shadow-teal-500/20',
    cardBorder: 'border-l-teal-500 hover:shadow-teal-500/10',
    hexColor: '#14b8a6',
    hoverBg: 'hover:bg-teal-900/60',
    icon: Coins
  },
  bank: {
    key: 'bank',
    label: 'Banking',
    shortLabel: 'Banking',
    badgeBg: 'bg-sky-950/60',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-500/40',
    dotColor: 'bg-sky-400',
    glowColor: 'shadow-sky-500/20',
    cardBorder: 'border-l-sky-500 hover:shadow-sky-500/10',
    hexColor: '#0ea5e9',
    hoverBg: 'hover:bg-sky-900/60',
    icon: Landmark
  },
  credit: {
    key: 'credit',
    label: 'Cards & Credit',
    shortLabel: 'Credit',
    badgeBg: 'bg-pink-950/60',
    badgeText: 'text-pink-300',
    badgeBorder: 'border-pink-500/40',
    dotColor: 'bg-pink-400',
    glowColor: 'shadow-pink-500/20',
    cardBorder: 'border-l-pink-500 hover:shadow-pink-500/10',
    hexColor: '#ec4899',
    hoverBg: 'hover:bg-pink-900/60',
    icon: CreditCard
  },
  brokerage: {
    key: 'brokerage',
    label: 'Brokerage & Stocks',
    shortLabel: 'Brokerage',
    badgeBg: 'bg-indigo-950/60',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-500/40',
    dotColor: 'bg-indigo-400',
    glowColor: 'shadow-indigo-500/20',
    cardBorder: 'border-l-indigo-500 hover:shadow-indigo-500/10',
    hexColor: '#6366f1',
    hoverBg: 'hover:bg-indigo-900/60',
    icon: TrendingUp
  },
  insurance: {
    key: 'insurance',
    label: 'Life Insurance',
    shortLabel: 'Insurance',
    badgeBg: 'bg-cyan-950/60',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40',
    dotColor: 'bg-cyan-400',
    glowColor: 'shadow-cyan-500/20',
    cardBorder: 'border-l-cyan-500 hover:shadow-cyan-500/10',
    hexColor: '#06b6d4',
    hoverBg: 'hover:bg-cyan-900/60',
    icon: ShieldCheck
  },
  patent: {
    key: 'patent',
    label: 'Patent Filings',
    shortLabel: 'Patents',
    badgeBg: 'bg-amber-950/60',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    dotColor: 'bg-amber-400',
    glowColor: 'shadow-amber-500/20',
    cardBorder: 'border-l-amber-500 hover:shadow-amber-500/10',
    hexColor: '#f59e0b',
    hoverBg: 'hover:bg-amber-900/60',
    icon: Lightbulb
  },
  will_trust: {
    key: 'will_trust',
    label: 'Wills & Trusts',
    shortLabel: 'Wills & Trusts',
    badgeBg: 'bg-purple-950/60',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40',
    dotColor: 'bg-purple-400',
    glowColor: 'shadow-purple-500/20',
    cardBorder: 'border-l-purple-500 hover:shadow-purple-500/10',
    hexColor: '#a855f7',
    hoverBg: 'hover:bg-purple-900/60',
    icon: FolderOpen
  },
  non_financial: {
    key: 'non_financial',
    label: 'Non-Financial Assets',
    shortLabel: 'Non-Financial',
    badgeBg: 'bg-fuchsia-950/60',
    badgeText: 'text-fuchsia-300',
    badgeBorder: 'border-fuchsia-500/40',
    dotColor: 'bg-fuchsia-400',
    glowColor: 'shadow-fuchsia-500/20',
    cardBorder: 'border-l-fuchsia-500 hover:shadow-fuchsia-500/10',
    hexColor: '#d946ef',
    hoverBg: 'hover:bg-fuchsia-900/60',
    icon: FileText
  },
  documentation: {
    key: 'documentation',
    label: 'Document Archive',
    shortLabel: 'Documents',
    badgeBg: 'bg-slate-800/80',
    badgeText: 'text-slate-300',
    badgeBorder: 'border-slate-600/50',
    dotColor: 'bg-slate-400',
    glowColor: 'shadow-slate-500/10',
    cardBorder: 'border-l-slate-500 hover:shadow-slate-500/10',
    hexColor: '#94a3b8',
    hoverBg: 'hover:bg-slate-750',
    icon: Archive
  },
  hardware_recovery: {
    key: 'hardware_recovery',
    label: 'Security Recovery Keys',
    shortLabel: 'Recovery Keys',
    badgeBg: 'bg-rose-950/60',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/40',
    dotColor: 'bg-rose-400',
    glowColor: 'shadow-rose-500/20',
    cardBorder: 'border-l-rose-500 hover:shadow-rose-500/10',
    hexColor: '#f43f5e',
    hoverBg: 'hover:bg-rose-900/60',
    icon: Cpu
  },
  other: {
    key: 'other',
    label: 'Other Assets',
    shortLabel: 'Other',
    badgeBg: 'bg-slate-900/80',
    badgeText: 'text-slate-300',
    badgeBorder: 'border-slate-700/60',
    dotColor: 'bg-slate-400',
    glowColor: 'shadow-slate-500/10',
    cardBorder: 'border-l-slate-600 hover:shadow-slate-600/10',
    hexColor: '#64748b',
    hoverBg: 'hover:bg-slate-800',
    icon: Layers
  }
};

export function getAssetTypeMeta(type: string): AssetTypeDefinition {
  const normalizedKey = (type || 'other').toLowerCase().trim();
  if (ASSET_TYPE_CONFIG[normalizedKey]) {
    return ASSET_TYPE_CONFIG[normalizedKey];
  }
  
  // Fuzzy or fallback formatting
  const formattedLabel = type
    ? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
    : 'Asset';

  return {
    key: normalizedKey,
    label: formattedLabel,
    shortLabel: formattedLabel,
    badgeBg: 'bg-slate-900/80',
    badgeText: 'text-slate-300',
    badgeBorder: 'border-slate-700/60',
    dotColor: 'bg-slate-400',
    glowColor: 'shadow-slate-500/10',
    cardBorder: 'border-l-slate-600 hover:shadow-slate-600/10',
    hexColor: '#64748b',
    hoverBg: 'hover:bg-slate-800',
    icon: HelpCircle
  };
}

export interface AssetBadgeProps {
  type: string;
  variant?: 'default' | 'pill' | 'glow' | 'compact' | 'subtle';
  showIcon?: boolean;
  showDot?: boolean;
  short?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

export default function AssetBadge({
  type,
  variant = 'default',
  showIcon = true,
  showDot = true,
  short = false,
  className,
  onClick,
  title
}: AssetBadgeProps) {
  const meta = getAssetTypeMeta(type);
  const Icon = meta.icon;
  const displayText = short ? meta.shortLabel : meta.label;

  const isInteractive = Boolean(onClick);

  return (
    <span
      onClick={onClick}
      title={title || `${meta.label} Asset Classification`}
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-bold tracking-wider uppercase border select-none transition-all",
        // Padding & size based on variant
        variant === 'compact' 
          ? "px-2 py-0.5 text-[8.5px] rounded-md" 
          : variant === 'pill'
          ? "px-2.5 py-1 text-[9px] rounded-full"
          : "px-2.5 py-1 text-[9px] rounded-lg",
        
        // Colors & backgrounds
        meta.badgeBg,
        meta.badgeText,
        meta.badgeBorder,
        
        // Glow effect
        variant === 'glow' && ["shadow-sm", meta.glowColor],
        
        // Interactive state
        isInteractive && [
          "cursor-pointer active:scale-95",
          meta.hoverBg,
          "hover:border-opacity-80"
        ],
        className
      )}
    >
      {/* Status Dot */}
      {showDot && (
        <span 
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0 shadow-sm",
            meta.dotColor
          )}
          style={{ boxShadow: `0 0 6px ${meta.hexColor}aa` }}
        />
      )}

      {/* Asset Type Icon */}
      {showIcon && (
        <Icon className={cn(
          "shrink-0",
          variant === 'compact' ? "h-2.5 w-2.5" : "h-3 w-3"
        )} />
      )}

      {/* Type Label */}
      <span className="truncate whitespace-nowrap leading-none">
        {displayText}
      </span>
    </span>
  );
}
