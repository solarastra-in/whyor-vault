import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, ShieldAlert, Lock, Unlock, Cpu, Volume2, VolumeX, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface MasterKeyTransitionModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onCancel?: () => void;
  sourceContext?: string;
}

// Browser-native Web Audio Synthesizer for Master Key Transition Sound FX
class MasterKeySoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

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
  }

  // Heavy mechanical tumbler lock turn
  playKeyTurn() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // Pneumatic airlock hiss / decompression whoosh
  playAirlockDecompress() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch (e) {}
  }

  // Cybernetic harmonic chime sequence (rising triad)
  playOverrideHarmonics() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [329.63, 440.0, 659.25, 880.0]; // E4, A4, E5, A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = this.ctx!.currentTime + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.38);
      });
    } catch (e) {}
  }

  // Bass resonance unlock ping
  playUnlockImpact() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.6);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }
}

const soundEngine = new MasterKeySoundEngine();

const TRANSITION_STEPS = [
  { stage: 1, title: "BREAK-GLASS SECURITY OVERRIDE", detail: "Intercepting primary enclave protocol...", pct: 20 },
  { stage: 2, title: "ROTATING DUAL MECHANICAL INTERLOCKS", detail: "Disengaging biometric & challenge gates...", pct: 45 },
  { stage: 3, title: "ALIGNING CONCENTRIC CIPHER RINGS", detail: "Synchronizing PBKDF2 & Shamir polynomial engines...", pct: 70 },
  { stage: 4, title: "SECONDARY RECOVERY ENCLAVE READY", detail: "Zero-knowledge break-glass pathway unlocked.", pct: 100 }
];

export default function MasterKeyTransitionModal({
  isOpen,
  onComplete,
  onCancel,
  sourceContext = "Verification Challenge Fallback"
}: MasterKeyTransitionModalProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [keysRotated, setKeysRotated] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  useEffect(() => {
    if (!isOpen) {
      setActiveStepIndex(0);
      setProgress(0);
      setKeysRotated(false);
      setIsComplete(false);
      return;
    }

    soundEngine.playAirlockDecompress();
    soundEngine.playOverrideHarmonics();

    const timer1 = setTimeout(() => {
      setActiveStepIndex(1);
      setProgress(45);
      setKeysRotated(true);
      soundEngine.playKeyTurn();
    }, 600);

    const timer2 = setTimeout(() => {
      setActiveStepIndex(2);
      setProgress(75);
      soundEngine.playKeyTurn();
    }, 1250);

    const timer3 = setTimeout(() => {
      setActiveStepIndex(3);
      setProgress(100);
      setIsComplete(true);
      soundEngine.playUnlockImpact();
    }, 1900);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl text-white select-none overflow-hidden">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />

      {/* Radial Glow Ambient */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

      {/* Laser Scanning Line */}
      <motion.div
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 h-0.5 bg-indigo-400 opacity-70 shadow-[0_0_15px_#6366f1,0_0_30px_#6366f1] pointer-events-none"
      />

      {/* Top Control Bar */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Return to Questions
          </button>
        )}
        <button
          type="button"
          onClick={onComplete}
          className="px-3.5 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-indigo-950/60 cursor-pointer"
        >
          Skip Animation
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white transition-all cursor-pointer"
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-indigo-400 animate-pulse" />}
        </button>
      </div>

      {/* Center Animated Vault Hatch & Rings */}
      <div className="relative z-30 max-w-lg w-full p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl shadow-indigo-950/70 text-center flex flex-col items-center">
        
        {/* Source Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 font-mono text-[9px] font-black uppercase tracking-[0.25em] mb-4">
          <ShieldAlert className="h-3 w-3 text-amber-400" />
          <span>SECONDARY OVERRIDE • {sourceContext}</span>
        </div>

        {/* Concentric Rotating Cryptographic Ring Stage */}
        <div className="relative w-48 h-48 my-4 flex items-center justify-center">
          {/* Outer Ring: Hex Stream */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-indigo-500/30 flex items-center justify-center"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#6366f1]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
          </motion.div>

          {/* Middle Ring: PBKDF2 Permutation */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 rounded-full border border-indigo-400/40 border-t-indigo-400 border-r-transparent flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          />

          {/* Inner Ring: SSS Polynomial Threshold */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-8 rounded-full border-2 border-cyan-500/50 border-b-transparent flex items-center justify-center"
          />

          {/* Central Key Hologram with Dual Mechanical Switches */}
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: isComplete ? 1.15 : 1 }}
            transition={{ duration: 0.4 }}
            className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl relative",
              isComplete
                ? "bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-[0_0_35px_rgba(99,102,241,0.6)]"
                : "bg-slate-950 border border-indigo-500/40 text-indigo-400"
            )}
          >
            {isComplete ? (
              <Unlock className="h-10 w-10 text-white animate-pulse" />
            ) : (
              <Key className="h-9 w-9 text-indigo-400" />
            )}

            {/* Glowing Corner Notches */}
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-indigo-400" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-indigo-400" />
          </motion.div>

          {/* Dual Mechanical Interlock Indicators */}
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col items-center">
            <motion.div
              animate={{ rotate: keysRotated ? 90 : 0 }}
              transition={{ duration: 0.5 }}
              className={cn(
                "w-6 h-6 rounded-md border flex items-center justify-center text-[8px] font-mono font-bold shadow-md",
                keysRotated ? "bg-emerald-950 border-emerald-500 text-emerald-400" : "bg-slate-950 border-slate-700 text-slate-500"
              )}
            >
              K1
            </motion.div>
            <span className="text-[7px] font-mono text-slate-500 mt-1 uppercase">Switch A</span>
          </div>

          <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex flex-col items-center">
            <motion.div
              animate={{ rotate: keysRotated ? -90 : 0 }}
              transition={{ duration: 0.5 }}
              className={cn(
                "w-6 h-6 rounded-md border flex items-center justify-center text-[8px] font-mono font-bold shadow-md",
                keysRotated ? "bg-emerald-950 border-emerald-500 text-emerald-400" : "bg-slate-950 border-slate-700 text-slate-500"
              )}
            >
              K2
            </motion.div>
            <span className="text-[7px] font-mono text-slate-500 mt-1 uppercase">Switch B</span>
          </div>
        </div>

        {/* Title and Secondary Pathway Warning */}
        <h2 className="text-xl sm:text-2xl font-black uppercase font-display tracking-tight text-white mt-3 mb-1">
          {isComplete ? "MASTER KEY ENCLAVE UNLOCKED" : "ENGAGING MASTER KEY PATHWAY"}
        </h2>

        <p className="text-xs text-slate-400 font-mono max-w-sm mb-6 leading-relaxed">
          {isComplete
            ? "Secondary authorization verified. Ready for 24-char Master Key or 2-of-3 SSS shares."
            : "Break-glass protocol engaged. Bypassing question stages to access offline cryptographic core."}
        </p>

        {/* Live Step Tracker Bar */}
        <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-2 shadow-inner text-left">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-cyan-400 animate-spin-slow" />
              {TRANSITION_STEPS[activeStepIndex]?.title}
            </span>
            <span className="text-white font-mono">{progress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5 mb-2.5">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut", duration: 0.35 }}
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 rounded-full shadow-[0_0_10px_#6366f1]"
            />
          </div>

          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span className="italic">{TRANSITION_STEPS[activeStepIndex]?.detail}</span>
            {isComplete && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Authorized
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
