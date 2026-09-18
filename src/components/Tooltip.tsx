import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({
  content,
  children,
  title,
  className,
  position = 'top',
  delay = 150
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<any>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }[position];

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-slate-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-slate-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-slate-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-slate-900 border-t-transparent border-b-transparent border-l-transparent'
  }[position];

  return (
    <div 
      className={cn("relative inline-flex items-center group", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={(e) => {
        // Allow mobile tap toggling
        if ('ontouchstart' in window) {
          e.stopPropagation();
          setIsVisible(prev => !prev);
        }
      }}
    >
      {children}
      {isVisible && (
        <div 
          role="tooltip"
          className={cn(
            "absolute z-50 pointer-events-none w-64 max-w-xs p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-xs shadow-2xl backdrop-blur-md transition-all duration-150 animate-fadeIn text-left leading-relaxed",
            positionClasses
          )}
        >
          {title && (
            <div className="font-bold text-[11px] text-white uppercase tracking-wider mb-1 flex items-center gap-1.5 pb-1 border-b border-slate-800">
              <Info className="h-3 w-3 text-indigo-400 shrink-0" />
              <span>{title}</span>
            </div>
          )}
          <div className="text-[11px] text-slate-300 font-normal leading-normal">
            {content}
          </div>
          <div className={cn("absolute w-0 h-0 border-4", arrowClasses)} />
        </div>
      )}
    </div>
  );
}

export function InfoTooltip({
  text,
  title,
  position = 'top',
  className
}: {
  text: React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  return (
    <Tooltip content={text} title={title} position={position} className={className}>
      <button
        type="button"
        tabIndex={0}
        aria-label="More information"
        className="p-1 text-slate-400 hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-800/60 focus:outline-none cursor-pointer inline-flex items-center justify-center"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
}

export function FieldLabel({
  label,
  required,
  tooltip,
  tooltipTitle,
  description,
  badge,
  className
}: {
  label: string;
  required?: boolean;
  tooltip?: React.ReactNode;
  tooltipTitle?: string;
  description?: string;
  badge?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-1.5 text-left", className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-rose-400 text-xs font-black">*</span>}
          {tooltip && (
            <InfoTooltip text={tooltip} title={tooltipTitle || label} />
          )}
        </label>
        {badge && (
          <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">
          {description}
        </p>
      )}
    </div>
  );
}
