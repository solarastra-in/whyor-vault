import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, ShieldCheck, Lock, Unlock, Key, Fingerprint, Cpu, 
  Volume2, VolumeX, AlertCircle, TriangleAlert, LogIn, 
  Sun, Moon, HelpCircle, Sparkles, CheckCircle2, ChevronRight,
  RotateCcw, Sliders, ExternalLink, Copy, Database
} from 'lucide-react';
import { cn, safeCopyToClipboard, getCleanPreviewUrl } from '../lib/utils';
import FirestoreTestModal from './FirestoreTestModal';

const notify = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-notify', { detail: { message, type } }));
  }
};

const getIsSandbox = (): boolean => {
  return typeof window !== 'undefined' && (
    (import.meta as any).env?.VITE_APP_ENV === 'Sandbox' ||
    localStorage.getItem('whyor_vault_sandbox_active') === 'true'
  );
};

interface CinematicVaultLandingProps {
  key?: string;
  onLogin: () => void;
  onSandboxLogin: () => void;
  onShowGuide: () => void;
  loginPending?: boolean;
  popupBlockedIndicator: boolean;
  networkErrorIndicator: boolean;
  onAdminClick?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isOpening?: boolean;
  onOpeningComplete?: () => void;
}

// Web Audio Synthesizer for high-fidelity movie vault sound effects
class LandingVaultSoundFX {
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

  // Dial ratchet tick
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

  // Pneumatic steam hiss
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

  // Cinematic Sub-bass drop
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

  // Access Granted Chord
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

const landingSoundFX = new LandingVaultSoundFX();

export default function CinematicVaultLanding({
  onLogin,
  onSandboxLogin,
  onShowGuide,
  loginPending,
  popupBlockedIndicator,
  networkErrorIndicator,
  onAdminClick,
  theme,
  onToggleTheme,
  isOpening: externalIsOpening = false,
  onOpeningComplete
}: CinematicVaultLandingProps) {
  // Modes: 
  // 'sealed': Vault presented center-stage, locked, inviting user to click to unlock
  // 'details': User clicked vault, console prompts user to add details / authenticate
  // 'authenticating': GAuth or Sandbox is verifying
  // 'opening': Vault animation sequence executing (like the Movie Vault)
  const [mode, setMode] = useState<'sealed' | 'details' | 'authenticating' | 'opening'>('sealed');
  
  // Animation stage 0 to 5 during opening
  const [openingStage, setOpeningStage] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [dialHoverAngle, setDialHoverAngle] = useState(0);
  const [telemetry, setTelemetry] = useState<string>("[SYS] Blast doors sealed • Level 5 Cryptographic Enclave active");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const isSandboxMode = getIsSandbox();
  const sequenceTimers = useRef<any[]>([]);

  const clearTimers = () => {
    sequenceTimers.current.forEach(t => clearTimeout(t));
    sequenceTimers.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // When external opening trigger occurs (e.g. from parent App state)
  useEffect(() => {
    if (externalIsOpening && mode !== 'opening') {
      triggerOpeningSequence();
    }
  }, [externalIsOpening]);

  // When loginPending becomes true, enter authenticating mode
  useEffect(() => {
    if (loginPending) {
      setMode('authenticating');
      setTelemetry("[GAuth] Communicating with Google Auth Protocol • Deriving key seed...");
      landingSoundFX.playDialTick(360);
    }
  }, [loginPending]);

  // Handle clicking on the vault door
  const handleVaultClick = () => {
    if (mode === 'sealed') {
      landingSoundFX.playDialTick(480);
      setMode('details');
      setTelemetry("[ACCESS PROTOCOL] Vault engagement requested. Please add credentials to unlock.");
    }
  };

  // Trigger the full 6-stage Movie Vault opening sequence
  const triggerOpeningSequence = () => {
    clearTimers();
    setMode('opening');
    setOpeningStage(0);
    setTelemetry("[AUTH] Identity verified • Initiating mechanical vault sequence");
    landingSoundFX.playDialTick(350);

    // Stage 1: Dial rotation (400ms)
    sequenceTimers.current.push(setTimeout(() => {
      setOpeningStage(1);
      setTelemetry("[DIAL] Rotating multi-axis combination wheel 540° to key alignment");
      
      let tick = 0;
      const interval = setInterval(() => {
        landingSoundFX.playDialTick(420 + (tick % 5) * 50);
        tick++;
        if (tick > 9) clearInterval(interval);
      }, 75);
    }, 400));

    // Stage 2: Titanium bolts retract (1400ms)
    sequenceTimers.current.push(setTimeout(() => {
      setOpeningStage(2);
      landingSoundFX.playBoltClack();
      setTelemetry("[BOLTS] Disengaging 12 perimeter titanium cylindrical locking pins");
    }, 1400));

    // Stage 3: Pneumatic steam seal release (2100ms)
    sequenceTimers.current.push(setTimeout(() => {
      setOpeningStage(3);
      landingSoundFX.playSteamHiss();
      setTelemetry("[PNEUMATICS] Atmospheric hermetic seal vented • Equalizing pressure");
    }, 2100));

    // Stage 4: Heavy dual blast doors swing open in 3D (2800ms)
    sequenceTimers.current.push(setTimeout(() => {
      setOpeningStage(4);
      landingSoundFX.playSubBassDrop();
      landingSoundFX.playAccessGrantedChord();
      setTelemetry("[DOORS] Multi-ton armored blast doors swinging outward on pivot bearings");
    }, 2800));

    // Stage 5: Chamber reveal & Camera plunge into vault (3800ms)
    sequenceTimers.current.push(setTimeout(() => {
      setOpeningStage(5);
      setTelemetry("[STATUS] ACCESS GRANTED • WELCOME TO YOUR ZERO-KNOWLEDGE LEDGER");
    }, 3800));

    // Complete transition (4600ms)
    sequenceTimers.current.push(setTimeout(() => {
      if (onOpeningComplete) {
        onOpeningComplete();
      }
    }, 4600));
  };

  const handleGoogleLogin = () => {
    landingSoundFX.playDialTick(500);
    onLogin();
  };

  const handleSandboxLogin = () => {
    landingSoundFX.playDialTick(520);
    setMode('authenticating');
    setTelemetry("[SANDBOX] Generating cryptographic guest entropy token...");
    setTimeout(() => {
      onSandboxLogin();
      triggerOpeningSequence();
    }, 500);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    landingSoundFX.setMuted(next);
  };

  // Dial rotation angle depending on state
  const dialAngle = mode === 'opening' && openingStage >= 1 
    ? 540 
    : dialHoverAngle;
  const boltsRetracted = mode === 'opening' && openingStage >= 2;
  const steamVisible = mode === 'opening' && (openingStage === 3 || openingStage === 4);
  const doorsOpen = mode === 'opening' && openingStage >= 4;
  const chamberDiving = mode === 'opening' && openingStage >= 5;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between relative overflow-hidden select-none">
      {/* Cinematic Cyber Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,27,75,0.7)_0%,rgba(2,6,23,0.95)_70%,rgba(0,0,0,1)_100%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#312e81_1px,transparent_1px),linear-gradient(to_bottom,#312e81_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      {/* Volumetric Spotlight behind vault */}
      <motion.div 
        animate={{
          scale: doorsOpen ? [1, 1.4, 1.6] : [0.95, 1.05, 0.95],
          opacity: doorsOpen ? [0.6, 0.95, 0.9] : 0.25
        }}
        transition={{ duration: doorsOpen ? 2.5 : 4, repeat: doorsOpen ? 0 : Infinity, ease: "easeInOut" }}
        className="absolute w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.35)_0%,rgba(20,184,166,0.2)_40%,transparent_70%)] pointer-events-none filter blur-3xl -top-20"
      />

      {/* TOP STATUS BAR */}
      <header className="w-full max-w-7xl mx-auto p-4 sm:p-6 flex items-center justify-between z-30 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center shadow-lg shadow-indigo-950/60 backdrop-blur-md">
            <Lock className="text-indigo-400 h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black font-display tracking-tight text-white uppercase leading-none">
                WhyOr<span className="text-indigo-400">Vault</span>
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold tracking-wider">
                LEVEL 5 SECURED
              </span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mt-1">
              Zero-Knowledge Digital Estate Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/60 py-1.5 px-3 rounded-lg font-bold font-mono uppercase tracking-wider transition-all cursor-pointer shadow-md backdrop-blur-md"
            title="Run Firestore Live Submission & Diagnostics Test Suite"
          >
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Test Database</span>
          </button>

          <button
            type="button"
            onClick={onShowGuide}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 py-1.5 px-3 rounded-lg font-bold font-mono uppercase tracking-wider transition-all cursor-pointer shadow-md backdrop-blur-md"
          >
            <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
            <span>Vault Guide</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md backdrop-blur-md"
            title={isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>

          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md backdrop-blur-md"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-indigo-400" />}
            </button>
          )}

          {onAdminClick && (
            <button
              type="button"
              onClick={onAdminClick}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-md backdrop-blur-md"
              title="Staff Terminal"
            >
              <Sliders className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>
      </header>

      {/* CENTER STAGE: THE MOVIE VAULT PORTAL & ACCESS CONTROLS */}
      <main className="w-full max-w-6xl mx-auto px-4 flex-1 flex flex-col items-center justify-center relative z-20 py-4">
        
        {/* Dynamic Telemetry Status Ticker */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 flex items-center gap-2.5 shadow-xl backdrop-blur-md"
        >
          <div className={cn(
            "w-2 h-2 rounded-full",
            mode === 'opening' ? "bg-emerald-400 animate-ping" :
            mode === 'authenticating' ? "bg-amber-400 animate-pulse" :
            mode === 'details' ? "bg-indigo-400 animate-pulse" :
            "bg-emerald-500"
          )} />
          <span className="text-[11px] font-mono tracking-wider text-slate-300 font-semibold truncate max-w-xs sm:max-w-md md:max-w-lg">
            {telemetry}
          </span>
        </motion.div>

        {/* VAULT & INTERACTION CONTAINER */}
        <div className="w-full flex flex-col items-center justify-center relative">
          
          {/* CAMERA DIVE SCALE WRAPPER */}
          <motion.div 
            animate={{
              scale: chamberDiving ? [1, 1.25, 2.5] : 1,
              opacity: chamberDiving ? [1, 1, 0] : 1,
              filter: chamberDiving ? "blur(4px)" : "blur(0px)"
            }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center"
          >
            {/* ─── THE MASSIVE PHYSICAL MOVIE VAULT DOOR ─── */}
            <div 
              onClick={handleVaultClick}
              onMouseEnter={() => {
                if (mode === 'sealed') {
                  setDialHoverAngle(prev => prev + 45);
                  landingSoundFX.playDialTick(380);
                }
              }}
              className={cn(
                "relative rounded-full select-none transition-all duration-500",
                mode === 'sealed' ? "cursor-pointer hover:scale-[1.02] active:scale-[0.99]" : "",
                "w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 flex items-center justify-center"
              )}
              style={{
                perspective: '1200px'
              }}
            >
              {/* Outer Heavy Reinforced Steel Frame & Shadow */}
              <div className="absolute inset-0 rounded-full border-[14px] sm:border-[18px] border-slate-800 shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_0_40px_rgba(0,0,0,0.9)] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center overflow-visible">
                
                {/* 16 Perimeter Heavy Steel Hex Rivets */}
                {Array.from({ length: 16 }).map((_, i) => {
                  const angle = (i * 360) / 16;
                  const rad = (angle * Math.PI) / 180;
                  const r = 48;
                  const left = 50 + r * Math.cos(rad);
                  const top = 50 + r * Math.sin(rad);
                  return (
                    <div
                      key={i}
                      className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-600 border border-slate-500 shadow-sm"
                      style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                    />
                  );
                })}

                {/* 12 Motorized Titanium Perimeter Locking Bolts */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 360) / 12;
                  return (
                    <div
                      key={i}
                      className="absolute w-5 h-9 sm:w-6 sm:h-11 flex flex-col items-center pointer-events-none"
                      style={{
                        transform: `rotate(${angle}deg) translateY(${boltsRetracted ? '-120px' : '-165px'})`,
                        transition: 'transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}
                    >
                      <div className={cn(
                        "w-full h-full rounded-sm border transition-all duration-400",
                        boltsRetracted
                          ? "bg-emerald-500/40 border-emerald-400 shadow-[0_0_12px_#10b981]"
                          : "bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 border-slate-400 shadow-lg"
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full mx-auto mt-1 transition-colors duration-300",
                          boltsRetracted ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-500 shadow-[0_0_6px_#f43f5e]"
                        )} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DUAL BLAST DOORS (Splits down center, swings open in 3D) */}
              <div className="absolute inset-4 sm:inset-5 rounded-full overflow-hidden flex shadow-2xl">
                {/* Left Door Half */}
                <motion.div
                  animate={{
                    x: doorsOpen ? "-120%" : "0%",
                    rotateY: doorsOpen ? -45 : 0,
                    opacity: doorsOpen ? 0.15 : 1
                  }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  className="w-1/2 h-full bg-gradient-to-r from-slate-800 via-slate-850 to-slate-900 border-r-2 border-slate-700 relative flex items-center justify-end overflow-hidden"
                  style={{ transformOrigin: "left center" }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:20px_20px]" />
                  <div className="absolute left-4 top-1/4 bottom-1/4 w-3 rounded bg-slate-950 border border-slate-700" />
                  <div className="w-8 h-4 rounded bg-slate-950 border border-indigo-500/40 mr-1.5" />
                </motion.div>

                {/* Right Door Half */}
                <motion.div
                  animate={{
                    x: doorsOpen ? "120%" : "0%",
                    rotateY: doorsOpen ? 45 : 0,
                    opacity: doorsOpen ? 0.15 : 1
                  }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  className="w-1/2 h-full bg-gradient-to-l from-slate-800 via-slate-850 to-slate-900 border-l-2 border-slate-700 relative flex items-center justify-start overflow-hidden"
                  style={{ transformOrigin: "right center" }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(-45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:20px_20px]" />
                  <div className="absolute right-4 top-1/4 bottom-1/4 w-3 rounded bg-slate-950 border border-slate-700" />
                  <div className="w-8 h-4 rounded bg-slate-950 border border-indigo-500/40 ml-1.5" />
                </motion.div>
              </div>

              {/* INNER CHAMBER (Revealed when doors swing open) */}
              <motion.div
                animate={{
                  scale: doorsOpen ? [0.75, 1.05, 1] : 0.6,
                  opacity: doorsOpen ? 1 : 0
                }}
                transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
                className="absolute inset-6 sm:inset-7 rounded-full bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 flex flex-col items-center justify-center p-4 text-center border-2 border-indigo-500/50 shadow-[0_0_60px_rgba(99,102,241,0.6)] pointer-events-none"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(99,102,241,0.9)] animate-pulse">
                  <Unlock className="h-8 w-8 text-emerald-400" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest font-mono">
                  VAULT UNLOCKED
                </h4>
                <p className="text-[9px] text-indigo-300 font-mono mt-1">
                  ENTERING SECURE ENCLAVE...
                </p>
              </motion.div>

              {/* CENTRAL MECHANICAL COMBINATION DIAL */}
              <motion.div
                animate={{
                  scale: doorsOpen ? 0 : 1,
                  opacity: doorsOpen ? 0 : 1
                }}
                transition={{ duration: 0.4 }}
                className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-4 border-slate-700 shadow-2xl flex items-center justify-center z-20 pointer-events-none"
              >
                {/* Rotating Outer Dial Cog */}
                <motion.div
                  animate={{ rotate: dialAngle }}
                  transition={{ duration: mode === 'opening' ? 1.0 : 0.4, ease: "easeInOut" }}
                  className="absolute inset-1.5 rounded-full border-2 border-dashed border-indigo-500/50"
                />

                {/* Degree / Hash Markings */}
                <motion.div
                  animate={{ rotate: -dialAngle * 0.7 }}
                  transition={{ duration: mode === 'opening' ? 1.0 : 0.4, ease: "easeInOut" }}
                  className="absolute inset-3 rounded-full border border-slate-700/80 flex items-center justify-center"
                >
                  {['00', '64', '128', '192', '256'].map((num, idx) => {
                    const angle = (idx * 360) / 5;
                    return (
                      <span
                        key={idx}
                        className="absolute text-[8px] font-mono font-bold text-slate-400"
                        style={{
                          transform: `rotate(${angle}deg) translateY(-54px)`
                        }}
                      >
                        {num}
                      </span>
                    );
                  })}
                </motion.div>

                {/* Central Spindle Hub with Biometric / Lock Ring */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-950 border-2 border-indigo-500/70 flex flex-col items-center justify-center shadow-xl">
                  {mode === 'authenticating' ? (
                    <Fingerprint className="h-6 w-6 text-amber-400 animate-pulse" />
                  ) : boltsRetracted ? (
                    <Unlock className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <Lock className="h-6 w-6 text-indigo-400" />
                  )}
                  <span className="text-[7px] font-mono font-bold text-indigo-300 uppercase mt-0.5">
                    {mode === 'authenticating' ? "SCANNING" : boltsRetracted ? "OPEN" : "SEALED"}
                  </span>
                </div>
              </motion.div>

              {/* Pneumatic Steam Ejection Sprays */}
              <AnimatePresence>
                {steamVisible && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 0.85, 0], scale: [0.8, 1.8, 2.3], x: [-40, -90] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9 }}
                      className="absolute left-0 w-24 h-24 rounded-full bg-white/20 filter blur-xl pointer-events-none"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 0.85, 0], scale: [0.8, 1.8, 2.3], x: [40, 90] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9 }}
                      className="absolute right-0 w-24 h-24 rounded-full bg-white/20 filter blur-xl pointer-events-none"
                    />
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ─── INTERACTIVE CONTROLS HUD OVERLAY / DETAILS PROMPT ─── */}
          <div className="w-full max-w-md mt-6 sm:mt-8 relative z-30">
            <AnimatePresence mode="wait">
              {/* STATE 1: SEALED (INVITE CLICK) */}
              {mode === 'sealed' && (
                <motion.div
                  key="sealed-prompt"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center text-center space-y-4"
                >
                  <button
                    type="button"
                    onClick={handleVaultClick}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/50 hover:shadow-indigo-500/70 border border-indigo-400/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <Lock className="h-4 w-4 animate-bounce" />
                    <span>CLICK VAULT TO UNLOCK</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <p className="text-xs text-slate-400 max-w-sm">
                    Tap the vault door or click the button above to begin the cryptographic authentication protocol.
                  </p>
                </motion.div>
              )}

              {/* STATE 2: DETAILS / ACCESS PROTOCOL (AUTHENTICATE WITH GAUTH OR SANDBOX) */}
              {mode === 'details' && (
                <motion.div
                  key="details-console"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-teal-400 to-indigo-500" />
                  
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                        INITIATE ACCESS PROTOCOL
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      Sign in with Google to synthesize zero-knowledge keys and open the vault blast doors.
                    </p>
                  </div>

                  {/* Browser Sandbox / Popup Warnings */}
                  {popupBlockedIndicator && (
                    <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-left text-xs text-red-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-red-400">
                        <TriangleAlert className="h-4 w-4 shrink-0" />
                        <span>Popup Blocked by Browser</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Your browser blocked the Google Sign-In popup inside this iframe preview.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const url = getCleanPreviewUrl();
                          safeCopyToClipboard(url);
                          notify("Copied preview URL! Opening in new tab...", "info");
                          window.open(url, '_blank');
                        }}
                        className="w-full py-2 bg-red-900/80 hover:bg-red-800 text-white font-bold rounded text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open in New Tab</span>
                      </button>
                    </div>
                  )}

                  {networkErrorIndicator && (
                    <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-left text-xs text-red-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Network Restriction Detected</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Cross-origin cookie restrictions may restrict popup auth in iframe preview mode.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const url = getCleanPreviewUrl();
                          safeCopyToClipboard(url);
                          notify("Copied preview URL! Opening in new tab...", "info");
                          window.open(url, '_blank');
                        }}
                        className="w-full py-2 bg-red-900/80 hover:bg-red-800 text-white font-bold rounded text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Bypass Sandbox (New Tab)</span>
                      </button>
                    </div>
                  )}

                  {isIframe && isSandboxMode && !popupBlockedIndicator && !networkErrorIndicator && (
                    <div className="mb-4 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-left text-xs text-slate-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="h-4 w-4 text-indigo-400 animate-pulse shrink-0" />
                        <span className="text-[11px]">Running in sandbox preview.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const url = getCleanPreviewUrl();
                          safeCopyToClipboard(url);
                          notify("Copied URL to clipboard!", "info");
                          window.open(url, '_blank');
                        }}
                        className="text-[11px] text-indigo-400 hover:text-white underline font-bold cursor-pointer"
                      >
                        New Tab
                      </button>
                    </div>
                  )}

                  {/* Primary Action: GAuth (Sign in with Google) */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loginPending}
                      className={cn(
                        "w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl text-xs uppercase tracking-wider",
                        loginPending
                          ? "bg-indigo-600/60 text-indigo-200 cursor-not-allowed"
                          : "bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.99] border border-slate-200"
                      )}
                    >
                      {loginPending ? (
                        <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      )}
                      <span>{loginPending ? "Acquiring Google Token..." : "Sign in with Google (GAuth)"}</span>
                    </button>

                    {/* Secondary: Sandbox Guest Session */}
                    <button
                      type="button"
                      onClick={handleSandboxLogin}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 hover:border-amber-500/60 text-amber-200 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Cpu className="h-4 w-4 text-amber-400" />
                      <span>Launch Sandbox Guest Session</span>
                    </button>
                  </div>

                  {/* Return to sealed vault door */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setMode('sealed')}
                      className="text-[10px] text-slate-400 hover:text-white uppercase font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Inspect Vault Door</span>
                    </button>

                    <button
                      type="button"
                      onClick={triggerOpeningSequence}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 uppercase font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Replay Full Movie Opening Sequence"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Preview Blast Sequence</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STATE 3: AUTHENTICATING / IN-PROGRESS */}
              {mode === 'authenticating' && (
                <motion.div
                  key="authenticating-console"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-3 backdrop-blur-xl"
                >
                  <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mx-auto mb-2" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                    AUTHENTICATING IDENTITY
                  </h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Verifying cryptographic credentials and establishing secure session enclave.
                  </p>
                </motion.div>
              )}

              {/* STATE 4: OPENING SEQUENCE PLAYING */}
              {mode === 'opening' && (
                <motion.div
                  key="opening-console"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl text-center backdrop-blur-xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                      <Unlock className="h-4 w-4 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black uppercase text-white font-mono">
                        BLAST DOORS DISENGAGING
                      </h4>
                      <p className="text-[10px] text-emerald-300 font-mono">
                        Stage {openingStage + 1} of 6 • Entering Enclave
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      clearTimers();
                      landingSoundFX.playAccessGrantedChord();
                      if (onOpeningComplete) onOpeningComplete();
                    }}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 uppercase font-bold cursor-pointer"
                  >
                    Skip
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* BOTTOM SECURITY SPECIFICATION PILLS */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-2xl">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 font-mono">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Zero-Knowledge Architecture</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 font-mono">
            <Key className="h-3 w-3 text-amber-400" />
            <span>AES-256-GCM Military Grade</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 font-mono">
            <Fingerprint className="h-3 w-3 text-indigo-400" />
            <span>Quantum-Resistant Entropy</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 font-mono">
            <Cpu className="h-3 w-3 text-cyan-400" />
            <span>Client-Side Isolation</span>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto p-4 text-center z-20">
        <p className="text-[10px] text-slate-500 font-mono">
          WhyOr Vault © {new Date().getFullYear()} • Encrypted Client-Side Digital Estate Vault
        </p>
      </footer>

      <FirestoreTestModal 
        isOpen={isTestModalOpen} 
        onClose={() => setIsTestModalOpen(false)} 
      />
    </div>
  );
}
