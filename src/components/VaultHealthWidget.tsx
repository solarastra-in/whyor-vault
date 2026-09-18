import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, ShieldCheck, AlertTriangle, CheckCircle2, 
  Layers, PieChart, Sparkles, ArrowRight, HeartPulse, Info,
  TrendingUp, Users, Lock, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface VaultAssetItem {
  id: string;
  type: string;
  name: string;
  institution?: string;
  beneficiary?: string;
  updatedAt?: number;
  [key: string]: any;
}

export interface VaultHealthWidgetProps {
  items: VaultAssetItem[];
  vaultConfig?: any;
  onSelectCategory?: (category: string) => void;
  onDeclareRecord?: () => void;
  className?: string;
}

interface CategoryMeta {
  key: string;
  label: string;
  color: string;
  hoverColor: string;
}

export const CATEGORY_MAP: Record<string, CategoryMeta> = {
  realestate: { key: 'realestate', label: 'Real Estate', color: '#10b981', hoverColor: '#34d399' },
  crypto: { key: 'crypto', label: 'Crypto & Wallets', color: '#14b8a6', hoverColor: '#2dd4bf' },
  bank: { key: 'bank', label: 'Banking', color: '#0ea5e9', hoverColor: '#38bdf8' },
  credit: { key: 'credit', label: 'Cards & Credit', color: '#ec4899', hoverColor: '#f472b6' },
  brokerage: { key: 'brokerage', label: 'Brokerage & Stocks', color: '#6366f1', hoverColor: '#818cf8' },
  insurance: { key: 'insurance', label: 'Life Insurance', color: '#06b6d4', hoverColor: '#22d3ee' },
  patent: { key: 'patent', label: 'Patents & IP', color: '#f59e0b', hoverColor: '#fbbf24' },
  will_trust: { key: 'will_trust', label: 'Wills & Trusts', color: '#a855f7', hoverColor: '#c084fc' },
  non_financial: { key: 'non_financial', label: 'Non-Financial', color: '#d946ef', hoverColor: '#e879f9' },
  documentation: { key: 'documentation', label: 'Documents', color: '#94a3b8', hoverColor: '#cbd5e1' },
  hardware_recovery: { key: 'hardware_recovery', label: 'Hardware Keys', color: '#f43f5e', hoverColor: '#fb7185' },
  other: { key: 'other', label: 'Other Assets', color: '#64748b', hoverColor: '#94a3b8' },
};

interface SliceData {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  hoverColor: string;
}

export default function VaultHealthWidget({
  items,
  vaultConfig,
  onSelectCategory,
  onDeclareRecord,
  className
}: VaultHealthWidgetProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredSlice, setHoveredSlice] = useState<SliceData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 220, height: 220 });

  // 1. Calculate Asset Type Distribution
  const distributionData: SliceData[] = useMemo(() => {
    const total = items.length;
    if (total === 0) return [];

    const counts: Record<string, number> = {};
    items.forEach(item => {
      const type = item.type || 'other';
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([typeKey, count]) => {
        const meta = CATEGORY_MAP[typeKey] || {
          key: typeKey,
          label: typeKey.charAt(0).toUpperCase() + typeKey.slice(1).replace('_', ' '),
          color: '#64748b',
          hoverColor: '#94a3b8'
        };
        return {
          key: typeKey,
          label: meta.label,
          count,
          percentage: (count / total) * 100,
          color: meta.color,
          hoverColor: meta.hoverColor
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // 2. Compute Vault Health Metrics
  const healthMetrics = useMemo(() => {
    const total = items.length;
    if (total === 0) {
      return {
        score: 25,
        rating: 'INITIALIZING',
        statusColor: 'text-amber-400',
        badgeBg: 'bg-amber-950/40 border-amber-500/30',
        diversificationScore: 0,
        beneficiaryRatio: 0,
        hasSwitch: false,
        insights: [
          'No encrypted assets declared yet. Add records to establish vault distribution.',
          'Dead Man Switch recommended for estate succession integrity.'
        ]
      };
    }

    const uniqueCategories = new Set(items.map(it => it.type)).size;
    const itemsWithBeneficiary = items.filter(it => it.beneficiary && it.beneficiary.trim().length > 0).length;
    const beneficiaryRatio = Math.round((itemsWithBeneficiary / total) * 100);
    const hasSwitch = vaultConfig?.deadMansSwitchArmed === true;

    // Score components:
    // - Asset count and diversification: up to 35 pts
    const divScore = Math.min(35, uniqueCategories * 10 + Math.min(5, total));
    // - Beneficiary mapping coverage: up to 35 pts
    const benScore = Math.round((beneficiaryRatio / 100) * 35);
    // - Automated Switch / Protection: up to 30 pts
    const switchScore = hasSwitch ? 30 : 10;

    const totalScore = Math.min(100, divScore + benScore + switchScore);

    let rating = 'OPTIMAL';
    let statusColor = 'text-emerald-400';
    let badgeBg = 'bg-emerald-950/40 border-emerald-500/30';

    if (totalScore < 50) {
      rating = 'NEEDS ATTENTION';
      statusColor = 'text-rose-400';
      badgeBg = 'bg-rose-950/40 border-rose-500/30';
    } else if (totalScore < 75) {
      rating = 'MODERATE RESILIENCE';
      statusColor = 'text-amber-400';
      badgeBg = 'bg-amber-950/40 border-amber-500/30';
    } else {
      rating = 'HIGH RESILIENCE';
      statusColor = 'text-emerald-400';
      badgeBg = 'bg-emerald-950/40 border-emerald-500/30';
    }

    const insights: string[] = [];
    if (uniqueCategories >= 3) {
      insights.push(`Healthy diversification across ${uniqueCategories} distinct asset classes.`);
    } else {
      insights.push(`Diversify holdings across banking, legal, and credentials.`);
    }

    if (beneficiaryRatio >= 75) {
      insights.push(`${beneficiaryRatio}% of assets mapped to designated heirs.`);
    } else {
      insights.push(`Assign beneficiaries to unmapped assets for smooth succession.`);
    }

    if (hasSwitch) {
      insights.push(`Dead Man's Switch armed and monitoring inactivity.`);
    }

    return {
      score: totalScore,
      rating,
      statusColor,
      badgeBg,
      diversificationScore: uniqueCategories,
      beneficiaryRatio,
      hasSwitch,
      insights
    };
  }, [items, vaultConfig]);

  // 3. Responsive Resize Observer for D3 Canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const size = Math.min(240, Math.max(180, Math.floor(width)));
        setDimensions({ width: size, height: size });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 4. Render D3 Donut Chart
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.62; // Donut hole size
    const outerRadius = radius * 0.92;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // If no items, draw empty aesthetic ring
    if (distributionData.length === 0) {
      const arc = d3.arc<any>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(0)
        .endAngle(2 * Math.PI);

      g.append('path')
        .attr('d', arc(null as any)!)
        .attr('fill', '#1e293b')
        .attr('stroke', '#334155')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4 4');

      return;
    }

    // D3 Pie Generator
    const pie = d3.pie<SliceData>()
      .value(d => d.count)
      .sort(null)
      .padAngle(0.04);

    // Normal & Expanded Arc Generators
    const arcGen = d3.arc<d3.PieArcDatum<SliceData>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(5);

    const arcHoverGen = d3.arc<d3.PieArcDatum<SliceData>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(outerRadius + 6)
      .cornerRadius(6);

    const arcs = g.selectAll('.arc')
      .data(pie(distributionData))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .style('cursor', 'pointer');

    // Slices path with entrance animation
    arcs.append('path')
      .attr('fill', d => d.data.color)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .each(function(d) {
        (this as any)._current = d;
      })
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHoverGen as any)
          .attr('fill', d.data.hoverColor)
          .style('filter', `drop-shadow(0 0 10px ${d.data.color}88)`);

        setHoveredSlice(d.data);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcGen as any)
          .attr('fill', d.data.color)
          .style('filter', 'none');

        setHoveredSlice(null);
      })
      .on('click', (event, d) => {
        if (onSelectCategory) {
          onSelectCategory(d.data.key);
        }
      })
      .transition()
      .duration(700)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arcGen(interpolate(t) as any)!;
        };
      });

  }, [distributionData, dimensions, onSelectCategory]);

  return (
    <div className={cn("w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-xl shadow-xl text-left", className)}>
      
      {/* Background Glow Accent */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER: TITLE & HEALTH SCORE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight font-display flex items-center gap-2">
                <span>Vault Health & Distribution</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                  d3-telemetry
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Real-time cryptographic asset breakdown and resilience integrity audit.
              </p>
            </div>
          </div>
        </div>

        {/* Resilience Index Gauge */}
        <div className="flex items-center gap-3.5 self-start sm:self-auto bg-slate-950/70 border border-slate-800 px-3.5 py-2 rounded-2xl">
          <div className="text-right">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
              Health Index
            </span>
            <span className={cn("text-xs font-mono font-black uppercase tracking-wider", healthMetrics.statusColor)}>
              {healthMetrics.rating}
            </span>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-11 h-11 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-900">
              <span className="text-xs font-mono font-black text-white">
                {healthMetrics.score}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN BODY: 2-COLUMN LAYOUT (D3 DONUT CHART + METRICS & LEGEND) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
        
        {/* LEFT COLUMN: D3 DONUT CHART WITH INTERACTIVE CENTER DISPLAY */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div ref={containerRef} className="relative flex items-center justify-center w-full max-w-[240px] aspect-square">
            <svg 
              ref={svgRef} 
              className="w-full h-full overflow-visible select-none"
            />

            {/* CENTER DONUT STATS DISPLAY */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
              <AnimatePresence mode="wait">
                {hoveredSlice ? (
                  <motion.div
                    key={hoveredSlice.key}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <span 
                      className="text-[9.5px] font-mono font-black uppercase tracking-wider truncate max-w-[110px]"
                      style={{ color: hoveredSlice.color }}
                    >
                      {hoveredSlice.label}
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-white leading-tight mt-0.5">
                      {hoveredSlice.count}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {hoveredSlice.percentage.toFixed(1)}% share
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="default-center"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest">
                      Total Assets
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-display text-white leading-none my-1">
                      {items.length}
                    </span>
                    <span className="text-[9.5px] font-mono text-indigo-400 font-bold uppercase">
                      {distributionData.length} Categories
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-500 mt-2 block text-center">
            Hover slice for breakdown • Click to filter
          </span>
        </div>

        {/* RIGHT COLUMN: DISTRIBUTION LEGEND & HEALTH PILLARS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* CATEGORY DISTRIBUTION LEGEND CHIPS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <PieChart className="h-3.5 w-3.5 text-indigo-400" />
                <span>Asset Composition</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {items.length} {items.length === 1 ? 'Record' : 'Records'} Enrolled
              </span>
            </div>

            {distributionData.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {distributionData.map((slice) => {
                  const isHovered = hoveredSlice?.key === slice.key;

                  return (
                    <button
                      key={slice.key}
                      type="button"
                      onClick={() => onSelectCategory && onSelectCategory(slice.key)}
                      onMouseEnter={() => setHoveredSlice(slice)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer bg-slate-950/60",
                        isHovered 
                          ? "border-slate-600 bg-slate-800 shadow-md scale-[1.02]" 
                          : "border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="text-[10.5px] font-bold text-white truncate">
                            {slice.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                          {slice.count}
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${slice.percentage}%`,
                            backgroundColor: slice.color 
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  No encrypted assets currently enrolled in this enclave.
                </p>
                {onDeclareRecord && (
                  <button
                    type="button"
                    onClick={onDeclareRecord}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/40"
                  >
                    <span>Declare First Asset Record</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* HEALTH AUDIT PILLARS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            
            {/* Pillar 1: Diversification */}
            <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Diversification
                </span>
                <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <div className="text-sm font-mono font-black text-white">
                {healthMetrics.diversificationScore} {healthMetrics.diversificationScore === 1 ? 'Class' : 'Classes'}
              </div>
              <p className="text-[9.5px] text-slate-400 mt-1 line-clamp-1">
                {healthMetrics.diversificationScore >= 3 ? 'Resilient partition balance' : 'Expansion recommended'}
              </p>
            </div>

            {/* Pillar 2: Beneficiary Mapping */}
            <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Succession Mapped
                </span>
                <Users className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="text-sm font-mono font-black text-white">
                {healthMetrics.beneficiaryRatio}%
              </div>
              <p className="text-[9.5px] text-slate-400 mt-1 line-clamp-1">
                {healthMetrics.beneficiaryRatio >= 75 ? 'Optimal kin redundancy' : 'Unmapped heir paths'}
              </p>
            </div>

            {/* Pillar 3: Dead Man Switch */}
            <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Inactivity Switch
                </span>
                <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
              </div>
              <div className="text-sm font-mono font-black text-white">
                {healthMetrics.hasSwitch ? 'ARMED' : 'STANDBY'}
              </div>
              <p className="text-[9.5px] text-slate-400 mt-1 line-clamp-1">
                {healthMetrics.hasSwitch ? 'Automated check-in active' : 'Unarmed failsafe'}
              </p>
            </div>

          </div>

          {/* DYNAMIC AUDIT SUMMARY BULLETS */}
          <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {healthMetrics.insights.map((insight, idx) => (
                <p key={idx} className="text-[11px] text-indigo-200/90 leading-tight">
                  • {insight}
                </p>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
