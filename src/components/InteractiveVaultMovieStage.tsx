import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Lock, Unlock, Play, Pause, RotateCcw, Volume2, VolumeX, 
  ChevronRight, ChevronLeft, Maximize2, Sparkles, Key, CheckCircle2,
  Cpu, AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';

// Web Audio Synthesizer for mechanical vault sound effects
class StepSoundFX {
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

  getMuted() {
    return this.isMuted;
  }

  playDialTick(freq = 440) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, this.ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playBoltClack() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(800, now);
      osc2.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      gain2.gain.setValueAtTime(0.12, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.09);
    } catch (e) {}
  }

  playSteamHiss() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.7;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.7);
      filter.Q.value = 3.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      noise.stop(this.ctx.currentTime + 0.75);
    } catch (e) {}
  }

  playSubBassDrop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(26, now + 1.4);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.45);
    } catch (e) {}
  }

  playAccessGrantedChord() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + 1.25);
      });
    } catch (e) {}
  }
}

const sfx = new StepSoundFX();

export interface MovieMechanicalStage {
  step: number; // 0 to 5
  name: string;
  shortName: string;
  mechanicalAction: string;
  cryptoEquivalent: string;
  telemetry: string;
  badge: string;
}

export const MOVIE_STAGES: MovieMechanicalStage[] = [
  {
    step: 0,
    name: '1. Handshake & Key Derivation',
    shortName: 'Key Handshake',
    mechanicalAction: 'Quantum key exchange & identity beacon initialization. Multi-layer sensor arrays align with master biometric signature.',
    cryptoEquivalent: 'PBKDF2 (250,000 rounds) + SHA-256 zero-knowledge signature synthesis from your 10 security challenges.',
    telemetry: '[SYS] Cryptographic handshake active • Master salt verified',
    badge: 'STAGE I: AUTH'
  },
  {
    step: 1,
    name: '2. Multi-Axis Dial Rotation',
    shortName: 'Dial Rotation',
    mechanicalAction: 'Precision beveled combination dial rotates 540° clockwise to align mechanical tumblers and internal gear teeth.',
    cryptoEquivalent: 'HKDF partition derivation mathematically calculating ephemeral sub-keys for banking, legal, and personal sectors.',
    telemetry: '[DIAL] Rotating multi-axis dial 540° to cryptographic offset',
    badge: 'STAGE II: DERIVATION'
  },
  {
    step: 2,
    name: '3. Perimeter Titanium Bolts Retraction',
    shortName: 'Bolts Retract',
    mechanicalAction: 'Twelve motorized 3-inch titanium cylindrical locking bolts disengage from reinforced wall sockets with sub-harmonic thud.',
    cryptoEquivalent: 'AES-256-GCM authentication tag validation. Prevents unauthorized tampering or bit-flip corruption.',
    telemetry: '[MECH] 12 perimeter titanium locking pins retracted inwards',
    badge: 'STAGE III: UNLOCK'
  },
  {
    step: 3,
    name: '4. Pneumatic Pressure Equalization',
    shortName: 'Steam Vent',
    mechanicalAction: 'High-pressure nitrogen hermetic seal breaks. Vapor exhausts radially as pressure equalizes with ambient atmospheric air.',
    cryptoEquivalent: 'Secure enclave memory allocation in isolated browser RAM. Eliminates cold-boot attacks and telemetry sniffing.',
    telemetry: '[SEAL] Pneumatic chamber equalized • Atmospheric seal vented',
    badge: 'STAGE IV: DEPRESSURIZE'
  },
  {
    step: 4,
    name: '5. Armored Blast Doors 3D Swing',
    shortName: 'Blast Doors',
    mechanicalAction: 'Dual multi-ton reinforced steel portal halves swing outwards on precision hydraulic pivot bearings.',
    cryptoEquivalent: 'Ciphertext decryption stream pipeline starts. Local in-memory plaintext ledger populated.',
    telemetry: '[DOORS] Armored portal halves swung open along dual Z-axis',
    badge: 'STAGE V: DISENGAGE'
  },
  {
    step: 5,
    name: '6. Chamber Access & Holographic Ledger',
    shortName: 'Enclave Reveal',
    mechanicalAction: 'Luminous interior safe compartments illuminate. Golden volumetric light beam projects authenticated credential vaults.',
    cryptoEquivalent: 'Decrypted session ledger unlocked and presented. Emergency audit heartbeat timer primed.',
    telemetry: '[STATUS] ACCESS PERMITTED • ZERO-KNOWLEDGE ENCLAVE ONLINE',
    badge: 'STAGE VI: ACCESS'
  }
];

interface InteractiveVaultMovieStageProps {
  currentStage?: number;
  onStageChange?: (stage: number) => void;
  onLaunchFullscreen?: () => void;
  compact?: boolean;
  className?: string;
  autoPlayOnInit?: boolean;
}

export default function InteractiveVaultMovieStage({
  currentStage: controlledStage,
  onStageChange,
  onLaunchFullscreen,
  compact = false,
  className,
  autoPlayOnInit = false
}: InteractiveVaultMovieStageProps) {
  const [internalStage, setInternalStage] = useState(controlledStage ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<any>(null);

  const stage = controlledStage !== undefined ? controlledStage : internalStage;

  const setStage = (s: number) => {
    const clamped = Math.max(0, Math.min(5, s));
    if (controlledStage === undefined) {
      setInternalStage(clamped);
    }
    onStageChange?.(clamped);
    playStageAudio(clamped);
  };

  const playStageAudio = (s: number) => {
    switch (s) {
      case 0:
        sfx.playDialTick(300);
        break;
      case 1:
        sfx.playDialTick(480);
        setTimeout(() => sfx.playDialTick(580), 80);
        setTimeout(() => sfx.playDialTick(680), 160);
        break;
      case 2:
        sfx.playBoltClack();
        break;
      case 3:
        sfx.playSteamHiss();
        break;
      case 4:
        sfx.playSubBassDrop();
        break;
      case 5:
        sfx.playAccessGrantedChord();
        break;
    }
  };

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        if (stage < 5) {
          setStage(stage + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1200);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, stage]);

  useEffect(() => {
    if (autoPlayOnInit) {
      setIsPlaying(true);
    }
  }, [autoPlayOnInit]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (stage >= 5) {
        setStage(0);
      }
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sfx.setMuted(next);
  };

  const currentInfo = MOVIE_STAGES[stage] || MOVIE_STAGES[0];

  // Derived animation parameters from stage
  const dialAngle = stage >= 1 ? 540 : 0;
  const boltsRetracted = stage >= 2;
  const steamVisible = stage === 3 || stage === 4;
  const doorsOpen = stage >= 4;

  return (
    <div className={cn("bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-2xl text-left", className)}>
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(49,46,129,0.25)_0%,transparent_70%)] pointer-events-none" />

      {/* Header bar with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Shield className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
                {currentInfo.badge}
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                Mechanical Stage {stage + 1} of 6
              </span>
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight mt-0.5">
              {currentInfo.name}
            </h4>
          </div>
        </div>

        {/* Quick actions: Play/Pause, Replay, Mute, Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={togglePlay}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md",
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            )}
            title={isPlaying ? "Pause Sequence" : "Auto-Play Movie"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isPlaying ? "Pause" : "Play Sequence"}</span>
          </button>

          <button
            type="button"
            onClick={() => setStage(0)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset to Stage 1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
          </button>

          {onLaunchFullscreen && (
            <button
              type="button"
              onClick={onLaunchFullscreen}
              className="p-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white transition-colors cursor-pointer"
              title="Launch Fullscreen Cinematic Movie"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Visual Stage & Mechanical Portal */}
      <div className={cn(
        "grid grid-cols-1 items-center gap-6 my-4 relative z-10",
        compact ? "md:grid-cols-1" : "md:grid-cols-12"
      )}>
        {/* Animated Vault Door Visual */}
        <div className={cn(
          "flex items-center justify-center p-3 relative",
          compact ? "w-full" : "md:col-span-6 lg:col-span-5"
        )}>
          {/* Circular Vault Housing */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
            {/* Outer Heavy Steel Frame with Rivets */}
            <div className="absolute inset-0 rounded-full border-[10px] border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.8)] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center overflow-visible">
              
              {/* Rivets */}
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i * 360) / 16;
                const rad = (angle * Math.PI) / 180;
                const r = 47;
                const left = 50 + r * Math.cos(rad);
                const top = 50 + r * Math.sin(rad);
                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-slate-600 border border-slate-700 shadow-sm"
                    style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                  />
                );
              })}

              {/* 12 Perimeter Locking Titanium Cylindrical Bolts */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 360) / 12;
                return (
                  <div
                    key={i}
                    className="absolute w-4 h-7 flex flex-col items-center pointer-events-none"
                    style={{
                      transform: `rotate(${angle}deg) translateY(${boltsRetracted ? '-88px' : '-115px'})`,
                      transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    <div className={cn(
                      "w-full h-full rounded-sm border transition-all duration-400",
                      boltsRetracted
                        ? "bg-emerald-500/40 border-emerald-400 shadow-[0_0_8px_#10b981]"
                        : "bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 border-slate-400 shadow-md"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mx-auto mt-1 transition-colors duration-300",
                        boltsRetracted ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-rose-500"
                      )} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DUAL BLAST DOORS (Split down the middle, swing open outwards) */}
            <div className="absolute inset-3 rounded-full overflow-hidden flex shadow-inner">
              {/* Left Door Half */}
              <motion.div
                animate={{
                  x: doorsOpen ? "-115%" : "0%",
                  rotateY: doorsOpen ? -40 : 0,
                  opacity: doorsOpen ? 0.2 : 1
                }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="w-1/2 h-full bg-gradient-to-r from-slate-800 via-slate-850 to-slate-900 border-r border-slate-700 relative flex items-center justify-end overflow-hidden"
                style={{ transformOrigin: "left center" }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:16px_16px]" />
                <div className="absolute left-3 top-1/4 bottom-1/4 w-2 rounded bg-slate-950 border border-slate-700" />
                <div className="w-6 h-3 rounded bg-slate-950 border border-indigo-500/40 mr-1" />
              </motion.div>

              {/* Right Door Half */}
              <motion.div
                animate={{
                  x: doorsOpen ? "115%" : "0%",
                  rotateY: doorsOpen ? 40 : 0,
                  opacity: doorsOpen ? 0.2 : 1
                }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="w-1/2 h-full bg-gradient-to-l from-slate-800 via-slate-850 to-slate-900 border-l border-slate-700 relative flex items-center justify-start overflow-hidden"
                style={{ transformOrigin: "right center" }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(-45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:16px_16px]" />
                <div className="absolute right-3 top-1/4 bottom-1/4 w-2 rounded bg-slate-950 border border-slate-700" />
                <div className="w-6 h-3 rounded bg-slate-950 border border-indigo-500/40 ml-1" />
              </motion.div>
            </div>

            {/* INNER CHAMBER (Revealed when doors swing open) */}
            <motion.div
              animate={{
                scale: doorsOpen ? [0.8, 1.05, 1] : 0.7,
                opacity: doorsOpen ? 1 : 0
              }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="absolute inset-5 rounded-full bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 flex flex-col items-center justify-center p-3 text-center border-2 border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.5)] pointer-events-none"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center mb-1.5 shadow-[0_0_20px_rgba(99,102,241,0.8)]">
                <Unlock className="h-6 w-6 text-emerald-400 animate-bounce" />
              </div>
              <h5 className="text-[10px] font-black text-white uppercase tracking-widest font-mono">
                ENCLAVE UNLOCKED
              </h5>
              <p className="text-[8px] text-indigo-300 font-mono mt-0.5">
                ZERO-KNOWLEDGE READY
              </p>
            </motion.div>

            {/* CENTRAL COMBINATION DIAL WHEEL */}
            <motion.div
              animate={{
                scale: doorsOpen ? 0 : 1,
                opacity: doorsOpen ? 0 : 1
              }}
              transition={{ duration: 0.4 }}
              className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700 shadow-xl flex items-center justify-center z-20 pointer-events-none"
            >
              {/* Outer Cog Teeth */}
              <motion.div
                animate={{ rotate: dialAngle }}
                transition={{ duration: 1.0, ease: "easeInOut" }}
                className="absolute inset-1 rounded-full border-2 border-dashed border-indigo-500/40"
              />

              {/* Combination Numerals Ring */}
              <motion.div
                animate={{ rotate: -dialAngle * 0.7 }}
                transition={{ duration: 1.0, ease: "easeInOut" }}
                className="absolute inset-2 rounded-full border border-slate-700/80 flex items-center justify-center"
              >
                {['00', '64', '128', '192', '256'].map((num, idx) => {
                  const angle = (idx * 360) / 5;
                  return (
                    <span
                      key={idx}
                      className="absolute text-[7px] font-mono font-bold text-slate-400"
                      style={{
                        transform: `rotate(${angle}deg) translateY(-40px)`
                      }}
                    >
                      {num}
                    </span>
                  );
                })}
              </motion.div>

              {/* Central Spindle Hub */}
              <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-indigo-500/60 flex items-center justify-center shadow-lg">
                <Lock className={cn("h-4 w-4 transition-colors", boltsRetracted ? "text-emerald-400" : "text-indigo-400")} />
              </div>
            </motion.div>

            {/* Steam blast particles */}
            <AnimatePresence>
              {steamVisible && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.6, 2], x: [-30, -70] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute left-4 top-1/2 w-14 h-14 rounded-full bg-indigo-300/30 filter blur-xl pointer-events-none"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.6, 2], x: [30, 70] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute right-4 top-1/2 w-14 h-14 rounded-full bg-indigo-300/30 filter blur-xl pointer-events-none"
                  />
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Explanatory Details Box */}
        <div className={cn(
          "space-y-4",
          compact ? "w-full" : "md:col-span-6 lg:col-span-7"
        )}>
          {/* Mechanical Action card */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider font-mono">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              <span>Physical Door Mechanics</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {currentInfo.mechanicalAction}
            </p>
          </div>

          {/* Cryptographic Equivalent card */}
          <div className="p-3.5 bg-indigo-950/30 border border-indigo-900/40 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Cryptographic Protocol Mapping</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {currentInfo.cryptoEquivalent}
            </p>
          </div>

          {/* Telemetry Console */}
          <div className="p-2.5 bg-black/60 border border-slate-800 rounded-xl font-mono text-[10px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300 truncate">{currentInfo.telemetry}</span>
            </div>
            <span className="text-[9px] text-indigo-400 font-bold uppercase shrink-0">
              {stage < 5 ? `Stage ${stage + 1}` : 'Unlocked'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Step Navigator Strip */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 custom-scrollbar">
          {MOVIE_STAGES.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setStage(idx)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[10px] font-mono uppercase font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0",
                idx === stage
                  ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-950"
                  : idx < stage
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/40"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850"
              )}
            >
              {idx + 1}. {s.shortName}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={stage === 0}
            onClick={() => setStage(stage - 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev Stage</span>
          </button>

          <button
            type="button"
            disabled={stage === 5}
            onClick={() => setStage(stage + 1)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-indigo-950"
          >
            <span>Next Stage</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
