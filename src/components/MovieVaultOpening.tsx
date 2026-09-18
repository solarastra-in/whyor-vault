import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldCheck, Lock, Unlock, Volume2, VolumeX, FastForward, Play, RefreshCw, Cpu, Key } from 'lucide-react';
import { cn } from '../lib/utils';

interface MovieVaultOpeningProps {
  isOpen: boolean;
  onComplete: () => void;
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
}

// Browser-native Web Audio Synthesizer for movie vault effects
class VaultSoundFX {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialize on first user interaction or trigger
  }

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

  // Mechanical dial ratchet tick
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

  // Heavy metal bolt clunk
  playBoltClack() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Low thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);

      // Metallic high transient
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(800, now);
      osc2.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      gain2.gain.setValueAtTime(0.15, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.09);
    } catch (e) {}
  }

  // Pneumatic air pressure hiss
  playSteamHiss() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2500, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.8);
      filter.Q.value = 3.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      noise.stop(this.ctx.currentTime + 0.85);
    } catch (e) {}
  }

  // Cinematic Sub-bass drop / door movement
  playSubBassDrop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 1.6);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.65);
    } catch (e) {}
  }

  // Access Granted Chime
  playAccessGrantedChord() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5 Major chord
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
        osc.stop(now + 1.3);
      });
    } catch (e) {}
  }
}

const soundFX = new VaultSoundFX();

export default function MovieVaultOpening({
  isOpen,
  onComplete,
  title = "HIGH-SECURITY VAULT UNLOCKED",
  subtitle = "Cryptographic session key verified • Disengaging reinforced blast doors",
  autoPlay = true
}: MovieVaultOpeningProps) {
  // Stages: 
  // 0: Standby / Verification Handshake
  // 1: Dial Wheel Spin (combos aligning)
  // 2: Locking Bolts Retraction (12 perimeter pins slide in)
  // 3: Pneumatic Seal Release (air pressure vents)
  // 4: Heavy Doors Parting (blast doors swing open in 3D)
  // 5: Chamber Entrance (reveals inside safe dashboard)
  const [stage, setStage] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [dialAngle, setDialAngle] = useState(0);
  const [boltsRetracted, setBoltsRetracted] = useState(false);
  const [steamVisible, setSteamVisible] = useState(false);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    "[SYS] Quantum cryptographic handshake established",
    "[SYS] AES-256-GCM authenticated tag matched"
  ]);

  const timerRefs = useRef<any[]>([]);

  const addLog = (msg: string) => {
    setTelemetryLogs(prev => [...prev.slice(-4), msg]);
  };

  const clearTimers = () => {
    timerRefs.current.forEach(t => clearTimeout(t));
    timerRefs.current = [];
  };

  const startSequence = () => {
    clearTimers();
    setStage(0);
    setDialAngle(0);
    setBoltsRetracted(false);
    setSteamVisible(false);
    setDoorsOpen(false);

    // Initial Dial Ratchet Tick
    soundFX.playDialTick(300);

    // Stage 1: Dial Spin (at 400ms)
    timerRefs.current.push(setTimeout(() => {
      setStage(1);
      setDialAngle(540); // 1.5 full rotations
      addLog("[AUTH] Rotating multi-axis mechanical dial to key offset");
      
      // Series of rapid dial ticks
      let tickCount = 0;
      const tickInterval = setInterval(() => {
        soundFX.playDialTick(400 + (tickCount % 5) * 60);
        tickCount++;
        if (tickCount > 10) clearInterval(tickInterval);
      }, 70);
    }, 400));

    // Stage 2: Locking Bolts Retract (at 1400ms)
    timerRefs.current.push(setTimeout(() => {
      setStage(2);
      setBoltsRetracted(true);
      soundFX.playBoltClack();
      addLog("[MECH] Disengaging 12 perimeter titanium locking pins");
    }, 1400));

    // Stage 3: Pneumatic Steam Seal Release (at 2100ms)
    timerRefs.current.push(setTimeout(() => {
      setStage(3);
      setSteamVisible(true);
      soundFX.playSteamHiss();
      addLog("[SEAL] Equalizing hydraulic pressure • Atmospheric seal broken");
    }, 2100));

    // Stage 4: Dual Blast Doors Swing Open (at 2800ms)
    timerRefs.current.push(setTimeout(() => {
      setStage(4);
      setDoorsOpen(true);
      soundFX.playSubBassDrop();
      soundFX.playAccessGrantedChord();
      addLog("[DOORS] Multi-ton armored vault portal swing disengaged");
      addLog("[STATUS] ACCESS PERMITTED • WELCOME TO YOUR SECURE ENCLAVE");
    }, 2800));

    // Stage 5: Final Chamber Entrance & Complete (at 3900ms)
    timerRefs.current.push(setTimeout(() => {
      setStage(5);
      onComplete();
    }, 3900));
  };

  useEffect(() => {
    if (isOpen) {
      startSequence();
    } else {
      clearTimers();
    }
    return () => clearTimers();
  }, [isOpen]);

  const handleSkip = () => {
    clearTimers();
    soundFX.playAccessGrantedChord();
    onComplete();
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFX.setMuted(next);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center overflow-hidden select-none"
      >
        {/* Cinematic Backdrop with Cyber Grid and Volumetric Flare */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,27,75,0.85)_0%,rgba(2,6,23,0.98)_70%,rgba(0,0,0,1)_100%)] pointer-events-none" />
        
        {/* Subtle radial light cone from behind the vault */}
        <motion.div 
          animate={{
            scale: doorsOpen ? [1, 1.3, 1.5] : [0.9, 1, 0.9],
            opacity: doorsOpen ? [0.6, 1, 0.9] : 0.2
          }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.3)_0%,rgba(217,70,239,0.15)_35%,transparent_70%)] pointer-events-none filter blur-3xl"
        />

        {/* Top Control Bar */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shadow-lg shadow-indigo-950">
              <Shield className="h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
            <div className="text-left">
              <h2 className="text-xs font-black font-mono tracking-widest text-white uppercase flex items-center gap-2">
                <span>WHYOR CRYPTOGRAPHIC VAULT</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  LEVEL 5 AUTHORIZATION
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">PNEUMATIC HIGH-SECURITY SAFE ENCLAVE</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg"
              title={isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-950 border border-indigo-400/40"
            >
              <span>Skip Animation</span>
              <FastForward className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* MAIN CINEMATIC VAULT DOOR PORTAL */}
        <div className="relative w-[340px] sm:w-[460px] md:w-[540px] h-[340px] sm:h-[460px] md:h-[540px] flex items-center justify-center z-10">
          {/* Outer Heavy Steel Frame with Rivets */}
          <div className="absolute inset-0 rounded-full border-[10px] sm:border-[16px] border-slate-800/90 shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_0_40px_rgba(0,0,0,0.8)] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
            
            {/* Rivets around circumference */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              const rad = (angle * Math.PI) / 180;
              const r = 48; // percentage radius
              const left = 50 + r * Math.cos(rad);
              const top = 50 + r * Math.sin(rad);
              return (
                <div
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-br from-slate-600 to-slate-900 border border-slate-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                />
              );
            })}

            {/* Warning Hazard Ring */}
            <div className="absolute inset-3 sm:inset-5 rounded-full border-2 border-dashed border-amber-500/30 opacity-70 pointer-events-none" />

            {/* 12 Perimeter Locking Titanium Cylindrical Bolts */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 360) / 12;
              return (
                <div
                  key={i}
                  className="absolute w-6 sm:w-8 h-10 sm:h-14 flex flex-col items-center pointer-events-none"
                  style={{
                    transform: `rotate(${angle}deg) translateY(${boltsRetracted ? '-140px' : '-195px'})`,
                    transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  <div className={cn(
                    "w-full h-full rounded-md border-2 transition-all duration-500 shadow-xl",
                    boltsRetracted
                      ? "bg-emerald-500/30 border-emerald-400 shadow-emerald-500/50"
                      : "bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 border-slate-300 shadow-indigo-950"
                  )}>
                    {/* Bolt LED Indicator */}
                    <div className={cn(
                      "w-2 h-2 rounded-full mx-auto mt-1.5 transition-colors duration-300",
                      boltsRetracted ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-500 shadow-[0_0_6px_#f43f5e]"
                    )} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* DUAL BLAST DOORS (Split down the middle, swing open outwards) */}
          <div className="absolute inset-4 sm:inset-7 rounded-full overflow-hidden flex shadow-inner">
            {/* Left Door Half */}
            <motion.div
              animate={{
                x: doorsOpen ? "-115%" : "0%",
                rotateY: doorsOpen ? -45 : 0,
                opacity: doorsOpen ? 0.2 : 1
              }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-1/2 h-full bg-gradient-to-r from-slate-800 via-slate-850 to-slate-900 border-r-2 border-slate-700/80 relative flex items-center justify-end overflow-hidden"
              style={{ transformOrigin: "left center" }}
            >
              {/* Heavy Plate Lines & Seams */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:24px_24px]" />
              <div className="absolute left-6 top-1/4 bottom-1/4 w-3 rounded bg-slate-950 border border-slate-700" />
              <div className="absolute left-14 top-1/3 bottom-1/3 w-2 rounded bg-slate-900 border border-slate-750" />
              
              {/* Hydraulic Piston Graphic (Left) */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                <div className="w-12 h-4 rounded bg-slate-950 border border-indigo-500/40" />
                <div className="w-8 h-2.5 bg-amber-500/40 rounded-r border border-amber-400/50" />
              </div>
            </motion.div>

            {/* Right Door Half */}
            <motion.div
              animate={{
                x: doorsOpen ? "115%" : "0%",
                rotateY: doorsOpen ? 45 : 0,
                opacity: doorsOpen ? 0.2 : 1
              }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-1/2 h-full bg-gradient-to-l from-slate-800 via-slate-850 to-slate-900 border-l-2 border-slate-700/80 relative flex items-center justify-start overflow-hidden"
              style={{ transformOrigin: "right center" }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(-45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:24px_24px]" />
              <div className="absolute right-6 top-1/4 bottom-1/4 w-3 rounded bg-slate-950 border border-slate-700" />
              <div className="absolute right-14 top-1/3 bottom-1/3 w-2 rounded bg-slate-900 border border-slate-750" />
              
              {/* Hydraulic Piston Graphic (Right) */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center flex-row-reverse">
                <div className="w-12 h-4 rounded bg-slate-950 border border-indigo-500/40" />
                <div className="w-8 h-2.5 bg-amber-500/40 rounded-l border border-amber-400/50" />
              </div>
            </motion.div>
          </div>

          {/* INNER CHAMBER (Revealed when doors swing open) */}
          <motion.div
            animate={{
              scale: doorsOpen ? [0.8, 1.05, 1] : 0.7,
              opacity: doorsOpen ? 1 : 0
            }}
            transition={{ duration: 1.0, delay: 0.2, ease: "easeOut" }}
            className="absolute inset-10 rounded-full bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 flex flex-col items-center justify-center p-6 text-center border-4 border-indigo-500/40 shadow-[0_0_100px_rgba(99,102,241,0.5)] pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(99,102,241,0.8)]">
              <Unlock className="h-10 w-10 text-emerald-400 animate-bounce" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono">
              VAULT CHAMBER UNLOCKED
            </h3>
            <p className="text-[10px] text-indigo-300 font-mono mt-1">
              ZERO-KNOWLEDGE DECRYPTION CONFIRMED
            </p>
          </motion.div>

          {/* CENTRAL COMBINATION DIAL WHEEL & MULTI-LAYER COGS */}
          <motion.div
            animate={{
              scale: doorsOpen ? 0 : 1,
              opacity: doorsOpen ? 0 : 1
            }}
            transition={{ duration: 0.5 }}
            className="absolute w-44 sm:w-56 h-44 sm:h-56 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-4 border-slate-700 shadow-2xl flex items-center justify-center z-20 pointer-events-none"
          >
            {/* Outer Cog Teeth */}
            <motion.div
              animate={{ rotate: dialAngle }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-1 rounded-full border-4 border-dashed border-indigo-500/40"
            />

            {/* Combination Numerals Ring */}
            <motion.div
              animate={{ rotate: -dialAngle * 0.7 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-3 rounded-full border border-slate-700 flex items-center justify-center"
            >
              {['00', '32', '64', '96', '128', '160', '192', '224', '256'].map((num, idx) => {
                const angle = (idx * 360) / 9;
                return (
                  <span
                    key={idx}
                    className="absolute text-[8px] sm:text-[9px] font-mono font-bold text-slate-400"
                    style={{
                      transform: `rotate(${angle}deg) translateY(-68px)`
                    }}
                  >
                    {num}
                  </span>
                );
              })}
            </motion.div>

            {/* Central Spindle Wheel Handle */}
            <div className="relative w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 border-2 border-indigo-400/40 shadow-inner flex items-center justify-center">
              {/* Spoke Handles */}
              <div className="absolute w-full h-3 bg-gradient-to-r from-slate-500 via-slate-300 to-slate-500 rounded shadow" />
              <div className="absolute h-full w-3 bg-gradient-to-b from-slate-500 via-slate-300 to-slate-500 rounded shadow" />
              
              {/* Central Core Cap with Status Icon */}
              <div className="relative w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center shadow-lg">
                {stage >= 2 ? (
                  <ShieldCheck className="h-6 w-6 text-emerald-400 animate-pulse" />
                ) : (
                  <Lock className="h-6 w-6 text-indigo-400 animate-pulse" />
                )}
              </div>
            </div>
          </motion.div>

          {/* STEAM / PNEUMATIC BURST PARTICLES */}
          {steamVisible && !doorsOpen && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
              {Array.from({ length: 16 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.9, scale: 0.2, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    scale: [0.5, 2.5, 4],
                    x: (Math.random() - 0.5) * 380,
                    y: (Math.random() - 0.5) * 380
                  }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  className="absolute w-12 h-12 rounded-full bg-white/40 filter blur-xl"
                />
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM TELEMETRY STATUS CONSOLE */}
        <div className="w-full max-w-lg mt-8 px-6 z-20">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">
                  DECRYPTION SEQUENCE: STAGE {stage + 1}/5
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase">
                {stage === 0 && "STANDBY"}
                {stage === 1 && "DIAL ROTATION"}
                {stage === 2 && "BOLTS RETRACTED"}
                {stage === 3 && "PNEUMATIC PURGE"}
                {stage >= 4 && "OPEN ACCESS"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"
                initial={{ width: "10%" }}
                animate={{ width: `${Math.min(100, (stage + 1) * 20)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Live Terminal Log Stream */}
            <div className="space-y-1 font-mono text-[10.5px] text-slate-300 text-left min-h-[55px]">
              {telemetryLogs.map((log, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-indigo-400">›</span>
                  <span className={index === telemetryLogs.length - 1 ? "text-white font-bold" : "text-slate-400"}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
