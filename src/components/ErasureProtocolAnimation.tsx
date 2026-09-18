import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Flame, ShieldAlert, Skull, Volume2, VolumeX, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

interface ErasureProtocolAnimationProps {
  isActive: boolean;
  isDryRun?: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}

// Browser-native Web Audio Synthesizer for Emergency Erasure Sound FX
class ErasureSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sirenInterval: any = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSiren();
    }
  }

  getMuted() {
    return this.isMuted;
  }

  // Dual tone emergency warning siren
  startSiren() {
    if (this.isMuted || this.sirenInterval) return;
    this.initCtx();
    if (!this.ctx) return;

    let high = true;
    const playTone = () => {
      if (this.isMuted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(high ? 780 : 520, now);
        osc.frequency.exponentialRampToValueAtTime(high ? 840 : 480, now + 0.35);

        // Low volume warning pulse
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
        high = !high;
      } catch (e) {
        // Audio error fallback
      }
    };

    playTone();
    this.sirenInterval = setInterval(playTone, 420);
  }

  stopSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
  }

  // Harsh digital incineration / noise shred sweep
  playIncinerateBurst() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.45;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.45);
      filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
    } catch (e) {}
  }

  // Deep seismic bass detonation rumble
  playSeismicZero() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.3);
    } catch (e) {}
  }

  // Click confirmation sound
  playTerminalTick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  }
}

const soundEngine = new ErasureSoundEngine();

const ERASURE_STAGES = [
  { label: "ARMING EMERGENCY PROTOCOL", detail: "Dissolving AES-256 volatile memory keys & ephemeral cache...", pct: 15 },
  { label: "MULTI-PASS SHREDDING (PASS 1/7)", detail: "Writing pseudo-random entropy over encrypted credential partitions...", pct: 35 },
  { label: "CORRUPTING CRYPTOGRAPHIC ESCROWS", detail: "Zeroing zero-knowledge challenge hashes and Shamir polynomial shares...", pct: 55 },
  { label: "IRREVOCABLE DATABASE EVISCERATION", detail: "Purging item collections, archived entries & HMAC audit trail blocks...", pct: 78 },
  { label: "IDENTITY & ENCLAVE INCINERATION", detail: "Revoking hardware WebAuthn authenticators and destroying access tokens...", pct: 92 },
  { label: "CRYPTOGRAPHIC CORE ZEROED", detail: "Total entropy state restored. Zero data recoverable.", pct: 100 }
];

export default function ErasureProtocolAnimation({
  isActive,
  isDryRun = false,
  onComplete,
  onCancel,
  title = "EMERGENCY TOTAL ERASURE PROTOCOL",
  subtitle = "Irrevocable Secondary Destruction Sequence Engaged"
}: ErasureProtocolAnimationProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sound mute toggle
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  // Spark / Ash disintegration particles on canvas
  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Particle system
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
    }

    const particles: Particle[] = [];
    const colors = ['#ef4444', '#f97316', '#dc2626', '#fca5a5', '#b91c1c', '#f59e0b'];

    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -Math.random() * 2.8 - 0.5,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.8 + 0.2,
        decay: Math.random() * 0.01 + 0.005
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y < -10) {
          p.x = Math.random() * width;
          p.y = height + 10;
          p.alpha = Math.random() * 0.9 + 0.1;
          p.vy = -Math.random() * 2.8 - 0.5;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  // Execute multi-step sequence
  useEffect(() => {
    if (!isActive) {
      soundEngine.stopSiren();
      setCurrentStepIndex(0);
      setProgress(0);
      setTerminalLogs([]);
      setIsFinished(false);
      return;
    }

    soundEngine.startSiren();

    let step = 0;
    const interval = setInterval(() => {
      if (step < ERASURE_STAGES.length) {
        const currentStage = ERASURE_STAGES[step];
        setCurrentStepIndex(step);
        setProgress(currentStage.pct);

        soundEngine.playTerminalTick();
        soundEngine.playIncinerateBurst();

        setTerminalLogs(prev => [
          ...prev,
          `[${new Date().toISOString().slice(11, 19)}] [SYS_PURGE] ${currentStage.label} » ${currentStage.detail}`
        ]);

        step++;
      } else {
        clearInterval(interval);
        soundEngine.stopSiren();
        soundEngine.playSeismicZero();
        setIsFinished(true);

        const timeout = setTimeout(() => {
          if (onComplete) onComplete();
        }, isDryRun ? 2500 : 1500);

        return () => clearTimeout(timeout);
      }
    }, isDryRun ? 900 : 750);

    return () => {
      clearInterval(interval);
      soundEngine.stopSiren();
    };
  }, [isActive, isDryRun, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/95 backdrop-blur-2xl text-white select-none">
      {/* Background Spark / Ash Particles Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Flashing Warning Hazard Strips (Perimeter) */}
      <div className="absolute inset-0 pointer-events-none z-20 border-[6px] border-red-600/70 shadow-[inset_0_0_120px_rgba(239,68,68,0.35)] animate-pulse" />

      {/* Cyber Grid Scanning Line */}
      <motion.div
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 h-1 bg-red-500/80 shadow-[0_0_20px_#ef4444,0_0_40px_#ef4444] z-20 pointer-events-none"
      />

      {/* Audio Mute & Dry Run Control Bar */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
        {isDryRun && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg border border-red-500/40 bg-red-950/40 text-red-300 hover:text-white hover:bg-red-900/60 text-xs font-mono font-bold uppercase tracking-wider transition-all"
          >
            Abort Simulation Drill
          </button>
        )}
        <button
          type="button"
          onClick={toggleMute}
          className="p-2.5 rounded-xl border border-red-500/30 bg-red-950/50 hover:bg-red-900/60 text-red-300 hover:text-white transition-all shadow-lg shadow-red-950/60 cursor-pointer"
          title={isMuted ? "Unmute Alarm" : "Mute Alarm"}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-red-400 animate-pulse" />}
        </button>
      </div>

      {/* Main Content Modal Frame */}
      <div className="relative z-30 max-w-2xl w-full mx-4 p-8 rounded-2xl bg-slate-950/90 border border-red-500/50 shadow-2xl shadow-red-950/80 text-center flex flex-col items-center">
        
        {/* Pulsing Emergency Beacon / Icon */}
        <div className="relative mb-6">
          <motion.div
            animate={{ scale: [1, 1.25, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.7)]"
          >
            {isFinished ? (
              <Skull className="h-10 w-10 text-red-400 animate-bounce" />
            ) : (
              <Flame className="h-10 w-10 text-red-500 animate-pulse" />
            )}
          </motion.div>

          {/* Radar Ring Pulses */}
          <motion.div
            animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border border-red-500/60 pointer-events-none"
          />
        </div>

        {/* Headings */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 font-mono text-[10px] font-black uppercase tracking-[0.25em] mb-3">
          <AlertTriangle className="h-3 w-3 animate-ping" />
          <span>{isDryRun ? "DRY-RUN SIMULATION • NO DATA LOST" : "DURESS / SELF-DESTRUCT INITIATED"}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black uppercase font-display tracking-tight text-white mb-2 text-shadow-red">
          {isFinished ? "VAULT ENTROPY EVISCERATED" : title}
        </h1>

        <p className="text-xs sm:text-sm text-red-200/80 font-mono max-w-lg mb-6 leading-relaxed">
          {isFinished
            ? "All encrypted record blocks, keys, and session contexts have been zeroed. Zero trace remains."
            : subtitle}
        </p>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-slate-900 border border-red-500/30 rounded-xl p-3 mb-6 shadow-inner">
          <div className="flex justify-between items-center text-[11px] font-mono font-bold text-red-400 mb-2">
            <span className="flex items-center gap-1.5">
              <RefreshCw className={cn("h-3 w-3", !isFinished && "animate-spin")} />
              {ERASURE_STAGES[Math.min(currentStepIndex, ERASURE_STAGES.length - 1)]?.label}
            </span>
            <span className="font-black text-white">{progress}%</span>
          </div>

          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-red-950/80 p-0.5">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut", duration: 0.3 }}
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-500 rounded-full shadow-[0_0_12px_#ef4444]"
            />
          </div>
        </div>

        {/* Live Terminal Telemetry Log Box */}
        <div className="w-full h-40 bg-black/80 rounded-xl border border-red-900/60 p-3.5 text-left font-mono text-[10.5px] text-red-400/90 overflow-y-auto space-y-1 shadow-inner scrollbar-thin scrollbar-thumb-red-900">
          <div className="text-[9px] text-red-500/60 font-bold uppercase tracking-widest border-b border-red-950 pb-1 mb-1.5 flex justify-between">
            <span>Terminal Destruction Log</span>
            <span>DoD 5220.22-M Compliant</span>
          </div>
          {terminalLogs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="leading-snug break-all"
            >
              {log}
            </motion.div>
          ))}
          {!isFinished && (
            <div className="flex items-center gap-1 text-red-500 font-bold animate-pulse pt-1">
              <span>&gt; overwriting memory sectors</span>
              <span className="inline-block w-2 h-3 bg-red-500" />
            </div>
          )}
        </div>

        {/* Final Status Confirmation */}
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Sanitization Complete • Terminating Container Session...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
