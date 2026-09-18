import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, EyeOff, Shield, ShieldCheck, Key, Lock, Unlock, 
  Sparkles, ChevronLeft, ChevronRight, CheckCircle2, RotateCcw,
  Volume2, VolumeX, Grid, Layers, HelpCircle, ArrowRight, Zap
} from 'lucide-react';
import { SECURITY_QUESTIONS } from '../constants/questions';
import { cn } from '../lib/utils';

// High-fidelity sound synthesizer for cryptographic question terminal
class QuestionSoundFX {
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

  // Key typing tick
  playKeyTick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.03);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // Next card slide chime
  playCardSlide() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  // Shard Lock Clack
  playShardLocked() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
      gain2.gain.setValueAtTime(0.1, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.16);
    } catch (e) {}
  }

  // All 10 Shards Complete Fanfare
  playAllCompleteChord() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [440, 554.37, 659.25, 880, 1108.73];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + 1.5);
      });
    } catch (e) {}
  }
}

const questionFX = new QuestionSoundFX();

// Thematic Visual Metadata & Rich SVG Vector Artwork for each question
export interface QuestionArtworkMeta {
  code: string;
  category: string;
  badge: string;
  primaryColor: string;
  accentGlow: string;
  bgGradient: string;
  hint: string;
  renderIllustration: (isAnswered: boolean, charCount: number) => React.ReactNode;
}

export const QUESTION_ARTWORKS: QuestionArtworkMeta[] = [
  // 0: Pet
  {
    code: "SHARD-01",
    category: "ANIMA CIPHER",
    badge: "LOYAL COMPANION",
    primaryColor: "#f59e0b",
    accentGlow: "rgba(245, 158, 11, 0.4)",
    bgGradient: "from-amber-950/70 via-slate-950 to-amber-900/40",
    hint: "Your first faithful domestic guardian or childhood companion.",
    renderIllustration: (isAnswered, chars) => (
      <svg viewBox="0 0 320 200" className="w-full h-full object-cover">
        <defs>
          <radialGradient id="petGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={isAnswered ? 0.35 : 0.2} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="petGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <circle cx="160" cy="100" r="85" fill="url(#petGlow)" />
        {/* Radar Rings */}
        <circle cx="160" cy="100" r="70" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <circle cx="160" cy="100" r="50" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
        
        {/* Loyal Cyber Companion Silhouette & Geometric Face */}
        <g transform="translate(160, 100)">
          {/* Head & Ears */}
          <path d="M-30,-20 L-45,-60 L-15,-35 L15,-35 L45,-60 L30,-20 Z" fill="url(#petGrad)" opacity="0.9" />
          {/* Face Base */}
          <path d="M-30,-20 L30,-20 L38,20 L0,48 L-38,20 Z" fill="#78350f" stroke="#fbbf24" strokeWidth="2" />
          {/* Biometric Eyes */}
          <circle cx="-14" cy="-2" r="5" fill="#fef08a" />
          <circle cx="14" cy="-2" r="5" fill="#fef08a" />
          <circle cx="-14" cy="-2" r="2" fill="#d97706" />
          <circle cx="14" cy="-2" r="2" fill="#d97706" />
          {/* Cyber Snout */}
          <polygon points="0,12 -8,22 8,22" fill="#fbbf24" />
          {/* Collar & Holographic Tag */}
          <rect x="-24" y="32" width="48" height="6" rx="3" fill="#d97706" stroke="#fef08a" strokeWidth="1" />
          <circle cx="0" cy="46" r="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M-3,46 L0,43 L3,46 L0,49 Z" fill="#ffffff" />
          {/* Floating Paw Print Sigils */}
          <g opacity={chars > 0 ? "0.9" : "0.3"} transform="translate(-75, -20) scale(0.6)">
            <ellipse cx="0" cy="0" rx="14" ry="11" fill="#fbbf24" />
            <circle cx="-12" cy="-15" r="5" fill="#fbbf24" />
            <circle cx="-4" cy="-20" r="5" fill="#fbbf24" />
            <circle cx="6" cy="-19" r="5" fill="#fbbf24" />
            <circle cx="13" cy="-13" r="5" fill="#fbbf24" />
          </g>
          <g opacity={chars > 0 ? "0.9" : "0.3"} transform="translate(75, 10) scale(0.5)">
            <ellipse cx="0" cy="0" rx="14" ry="11" fill="#fbbf24" />
            <circle cx="-12" cy="-15" r="5" fill="#fbbf24" />
            <circle cx="-4" cy="-20" r="5" fill="#fbbf24" />
            <circle cx="6" cy="-19" r="5" fill="#fbbf24" />
            <circle cx="13" cy="-13" r="5" fill="#fbbf24" />
          </g>
        </g>
      </svg>
    )
  },

  // 1: Nickname
  {
    code: "SHARD-02",
    category: "PERSONA GLYPH",
    badge: "SECRET MONIKER",
    primaryColor: "#ec4899",
    accentGlow: "rgba(236, 72, 153, 0.4)",
    bgGradient: "from-pink-950/70 via-slate-950 to-purple-900/40",
    hint: "The childhood alias spoken only among trusted companions.",
    renderIllustration: (isAnswered, chars) => (
      <svg viewBox="0 0 320 200" className="w-full h-full object-cover">
        <defs>
          <radialGradient id="nickGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity={isAnswered ? 0.4 : 0.2} />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="neonPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
        </defs>
        <circle cx="160" cy="100" r="90" fill="url(#nickGlow)" />
        {/* Cyber Neon Shield & Cassette / Tag Badge */}
        <g transform="translate(160, 100)">
          {/* Retro Hexagon Matrix */}
          <polygon points="0,-65 60,-32 60,35 0,68 -60,35 -60,-32" fill="#500724" stroke="#ec4899" strokeWidth="2.5" />
          <polygon points="0,-52 48,-26 48,28 0,55 -48,28 -48,-26" fill="#831843" stroke="#f472b6" strokeWidth="1" strokeDasharray="3 3" />
          
          {/* Secret Mask / Identity Silhouette */}
          <path d="M-36,-12 Q0,-22 36,-12 Q32,18 0,28 Q-32,18 -36,-12 Z" fill="#be185d" stroke="#fbcfe8" strokeWidth="2" />
          {/* Eyes in the mask */}
          <path d="M-22,-4 Q-14,-10 -6,-4 Q-14,2 -22,-4 Z" fill="#ffffff" />
          <path d="M6,-4 Q14,-10 22,-4 Q14,2 6,-4 Z" fill="#ffffff" />

          {/* Holographic Soundwave / Spray Bar */}
          <g transform="translate(0, 42)">
            {[-25, -15, -5, 5, 15, 25].map((x, i) => (
              <line key={i} x1={x} y1="-5" x2={x} y2={5 + (i % 3) * 4} stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" />
            ))}
          </g>
          {/* Sparkles */}
          <polygon points="-50,-35 -47,-45 -37,-48 -47,-51 -50,-61 -53,-51 -63,-48 -53,-45" fill="#fbcfe8" />
          <polygon points="50,30 52,22 60,20 52,18 50,10 48,18 40,20 48,22" fill="#fbcfe8" />
        </g>
      </svg>
    )
  },

  // 2: Spouse/Partner City
  {
    code: "SHARD-03",
    category: "GEO ANCHOR",
    badge: "DESTINY SKYLINE",
    primaryColor: "#06b6d4",
    accentGlow: "rgba(6, 182, 212, 0.4)",
    bgGradient: "from-cyan-950/70 via-slate-950 to-blue-900/40",
    hint: "The geographical latitude and longitude where two lifelines converged.",
    renderIllustration: (isAnswered, chars) => (
      <svg viewBox="0 0 320 200" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="skylineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#083344" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Constellation Star Map */}
        <circle cx="70" cy="40" r="2" fill="#ffffff" />
        <circle cx="120" cy="30" r="2.5" fill="#a5f3fc" />
        <circle cx="210" cy="45" r="2" fill="#ffffff" />
        <circle cx="260" cy="25" r="3" fill="#67e8f9" />
        <line x1="70" y1="40" x2="120" y2="30" stroke="#0891b2" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="210" y1="45" x2="260" y2="25" stroke="#0891b2" strokeWidth="0.8" strokeDasharray="3 3" />
        
        {/* City Skyline Silhouettes */}
        <path d="M20,160 L20,110 L45,110 L45,95 L65,95 L65,130 L85,130 L85,80 L95,65 L105,80 L105,160 Z" fill="#0e7490" opacity="0.6" />
        <path d="M115,160 L115,100 L140,100 L140,75 L160,50 L180,75 L180,160 Z" fill="url(#skylineGrad)" />
        <path d="M190,160 L190,90 L210,90 L210,120 L235,120 L235,85 L260,85 L260,160 Z" fill="#0891b2" opacity="0.7" />
        <line x1="0" y1="160" x2="320" y2="160" stroke="#06b6d4" strokeWidth="2" />
        {/* Golden Navigational Compass Rose */}
        <g transform="translate(260, 80)">
          <circle cx="0" cy="0" r="22" fill="#042f2e" stroke="#22d3ee" strokeWidth="1.5" />
          <polygon points="0,-18 5,-5 18,0 5,5 0,18 -5,5 -18,0 -5,-5" fill="#a5f3fc" />
          <circle cx="0" cy="0" r="4" fill="#0891b2" />
        </g>
        {/* Convergence Heart / Pulse Ring */}
        <g transform="translate(160, 45)">
          <circle cx="0" cy="0" r="14" fill="#083344" stroke="#67e8f9" strokeWidth="1.5" />
          <path d="M-6,-2 Q0,-8 6,-2 Q6,4 0,9 Q-6,4 -6,-2 Z" fill="#22d3ee" />
        </g>
      </svg>
    )
  },

  // 3: Favorite Teacher
  {
    code: "SHARD-04",
    category: "MENTOR ARCHIVE",
    badge: "WISDOM BEACON",
    primaryColor: "#8b5cf6",
    accentGlow: "rgba(139, 92, 246, 0.4)",
    bgGradient: "from-purple-950/70 via-slate-950 to-indigo-900/40",
    hint: "The educator who ignited intellectual curiosity and guidance.",
    renderIllustration: (isAnswered, chars) => (
      <svg viewBox="0 0 320 200" className="w-full h-full object-cover">
        <defs>
          <radialGradient id="tomeGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={isAnswered ? 0.4 : 0.2} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="160" cy="100" r="85" fill="url(#tomeGlow)" />
        {/* Orbital Atom Ring */}
        <ellipse cx="160" cy="100" rx="90" ry="32" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5 5" transform="rotate(-25 160 100)" />
        <ellipse cx="160" cy="100" rx="90" ry="32" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5 5" transform="rotate(25 160 100)" />
        <circle cx="100" cy="85" r="3.5" fill="#c4b5fd" />
        <circle cx="220" cy="115" r="3.5" fill="#c4b5fd" />

        {/* Central Open Holographic Book / Tome */}
        <g transform="translate(160, 105)">
          {/* Spine and Covers */}
          <path d="M0,25 Q-35,30 -70,20 L-65,-35 Q-35,-25 0,-30 Q35,-25 65,-35 L70,20 Q35,30 0,25 Z" fill="#2e1065" stroke="#a78bfa" strokeWidth="2" />
          {/* Left Page */}
          <path d="M0,-28 Q-30,-23 -60,-32 L-65,18 Q-35,27 0,22 Z" fill="#581c87" stroke="#c4b5fd" strokeWidth="1" />
          {/* Right Page */}
          <path d="M0,-28 Q30,-23 60,-32 L65,18 Q35,27 0,22 Z" fill="#581c87" stroke="#c4b5fd" strokeWidth="1" />
          {/* Book Text Runes */}
          <line x1="-50" y1="-18" x2="-10" y2="-15" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round" />
          <line x1="-50" y1="-8" x2="-15" y2="-5" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round" />
          <line x1="-50" y1="2" x2="-20" y2="5" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round" />
          
          <line x1="10" y1="-15" x2="50" y2="-18" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="-5" x2="50" y2="-8" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="5" x2="50" y2="2" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round" />

          {/* Floating Flame / Light of Knowledge */}
          <path d="M0,-35 Q-8,-52 0,-65 Q8,-52 0,-35 Z" fill="#fbbf24" />
          <circle cx="0" cy="-50" r="3" fill="#ffffff" />
        </g>
      </svg>
    )
  },

  // 4: Childhood Street
  {
    code: "SHARD-05",
    category: "ORIGIN ROOT",
    badge: "MEMORY AVENUE",
    primaryColor: "#10b981",
    accentGlow: "rgba(16, 185, 129, 0.4)",
    bgGradient: "from-emerald-950/70 via-slate-950 to-teal-900/40",
    hint: "The pavement and streetlamps under which your early footsteps echoed.",
    renderIllustration: (isAnswered, chars) => (
      <svg viewBox="0 0 320 200" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="lampCone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Perspective Road Grid */}
        <polygon points="160,70 162,70 270,180 50,180" fill="#064e3b" opacity="0.6" />
        <polygon points="160,70 161,70 165,180 155,180" fill="#34d399" opacity="0.8" />
        <line x1="160" y1="70" x2="50" y2="180" stroke="#10b981" strokeWidth="2" />
        <line x1="162" y1="70" x2="270" y2="180" stroke="#10b981" strokeWidth="2" />

        {/* Vintage Holographic Streetlamp */}
        <g transform="translate(100, 50)">
          {/* Post */}
          <line x1="0" y1="120" x2="0" y2="20" stroke="#a7f3d0" strokeWidth="3" />
          <path d="M0,20 Q0,5 15,5 L20,5" fill="none" stroke="#a7f3d0" strokeWidth="3" />
          {/* Lantern Head */}
          <polygon points="15,5 25,5 28,18 12,18" fill="#fef08a" stroke="#047857" strokeWidth="1.5" />
          {/* Volumetric Light Cone */}
          <polygon points="15,18 25,18 80,120 -30,120" fill="url(#lampCone)" />
          <circle cx="20" cy="12" r="4" fill="#ffffff" />
        </g>

        {/* Street Name Signpost */}
        <g transform="translate(220, 100)">
          <line x1="0" y1="70" x2="0" y2="0" stroke="#6ee7b7" strokeWidth="2.5" />
          <rect x="-35" y="-12" width="70" height="20" rx="3" fill="#065f46" stroke="#a7f3d0" strokeWidth="1.5" />
          <line x1="-28" y1="-2" x2="28" y2="-2" stroke="#ecfdf5" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    )
  },

  // 5: Favorite Movie Character
  {
    code: "SHARD-06",
    category: "MYTHOS PROTOCOL",
    badge: "CINEMATIC HERO",
    primaryColor: "#e11d48",
    accentGlow: "rgba(225, 29, 72, 0.4)",
    bgGradient: "from-rose-950/70 via-slate-950 to-red-900/40",
    hint: "The larger-than-life protagonist whose deeds resonated with you.",
    renderIllustration: (isAnswered, chars) => (
      <svg viewBox="0 0 320 200" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="beamGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Projector Light Beam from Left */}
        <polygon points="35,90 35,110 280,170 280,30" fill="url(#beamGrad)" />
        
        {/* Spinning 35mm Reel Projector */}
        <g transform="translate(35, 100)">
          <circle cx="0" cy="-25" r="18" fill="#4c0519" stroke="#fb7185" strokeWidth="2" />
          <circle cx="0" cy="-25" r="6" fill="#be123c" />
          <circle cx="0" cy="25" r="18" fill="#4c0519" stroke="#fb7185" strokeWidth="2" />
          <circle cx="0" cy="25" r="6" fill="#be123c" />
          <rect x="-10" y="-12" width="20" height="24" rx="3" fill="#881337" stroke="#fda4af" strokeWidth="1.5" />
          <polygon points="10,-6 18,-10 18,10 10,6" fill="#f43f5e" />
        </g>

        {/* Hero Silhouette in the Screen Beam */}
        <g transform="translate(230, 100)">
          {/* Aura */}
          <circle cx="0" cy="0" r="42" fill="#881337" opacity="0.6" />
          {/* Cape / Silhouette */}
          <path d="M-25,45 Q-15,-10 0,-15 Q15,-10 25,45 Q0,35 -25,45 Z" fill="#ffe4e6" />
          {/* Hero Head & Mask/Visor */}
          <circle cx="0" cy="-28" r="12" fill="#ffe4e6" />
          <line x1="-8" y1="-28" x2="8" y2="-28" stroke="#e11d48" strokeWidth="2" />
          {/* Emblem on Chest */}
          <polygon points="0,-8 6,-3 4,4 -4,4 -6,-3" fill="#e11d48" />
        </g>
      </svg>
    )
  },

  // 6: Favorite Vacation Spot
  {
    code: "SHARD-07",
    category: "HAVEN REFUGE",
    badge: "TWIN SUN OASIS",
    primaryColor: "#f97316",
    accentGlow: "rgba(249, 115, 22, 0.4)",
    bgGradient: "from-orange-950/70 via-slate-950 to-amber-900/40",
    hint: "The tranquil coastline, mountain summit, or faraway childhood retreat.",
    renderIllustration: (isAnswered, chars) => (
      <svg viewBox="0 0 320 200" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="sunsetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
        </defs>
        {/* Giant Twin Suns */}
        <circle cx="160" cy="85" r="45" fill="url(#sunsetGrad)" />
        <circle cx="210" cy="70" r="25" fill="#fef08a" opacity="0.85" />

        {/* Horizon & Ocean Waves */}
        <line x1="0" y1="130" x2="320" y2="130" stroke="#f97316" strokeWidth="1.5" />
        <path d="M0,135 Q40,140 80,135 T160,135 T240,135 T320,135 L320,200 L0,200 Z" fill="#431407" opacity="0.8" />
        <path d="M0,150 Q40,155 80,150 T160,150 T240,150 T320,150 L320,200 L0,200 Z" fill="#2a0800" />

        {/* Tropical Palm Tree Silhouette */}
        <g transform="translate(80, 140)">
          {/* Trunk */}
          <path d="M0,0 Q15,-40 30,-70" fill="none" stroke="#fdba74" strokeWidth="4" strokeLinecap="round" />
          {/* Fronds */}
          <path d="M30,-70 Q10,-95 -10,-85" fill="none" stroke="#fdba74" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30,-70 Q25,-105 10,-105" fill="none" stroke="#fdba74" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30,-70 Q55,-100 65,-90" fill="none" stroke="#fdba74" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30,-70 Q60,-75 80,-65" fill="none" stroke="#fdba74" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        {/* Distant Mountain Peak */}
        <polygon points="210,130 250,95 290,130" fill="#7c2d12" opacity="0.7" />
      </svg>
    )
  },

  // 7: High School Best Friend
  {
    code: "SHARD-08",
    category: "ALLIANCE SYNTH",
    badge: "TWIN STAR BONDS",
    primaryColor: "#3b82f6",
    accentGlow: "rgba(59, 130, 246, 0.4)",
    bgGradient: "from-blue-950/70 via-slate-950 to-indigo-900/40",
    hint: "The steadfast comrade who stood by your side through high school years.",
    renderIllustration: (isAnswered, chars) => (
      <svg viewBox="0 0 320 200" className="w-full h-full object-cover">
        <defs>
          <radialGradient id="starGlowA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="starGlowB" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Orbital Ellipse */}
        <ellipse cx="160" cy="100" rx="90" ry="40" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 4" transform="rotate(-15 160 100)" />
        {/* Energy Beam between the twin stars */}
        <line x1="110" y1="80" x2="210" y2="120" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3 2" />
        
        {/* Star Alpha (Comrade A) */}
        <g transform="translate(110, 80)">
          <circle cx="0" cy="0" r="28" fill="url(#starGlowA)" />
          <circle cx="0" cy="0" r="10" fill="#ffffff" />
          <polygon points="0,-18 4,-5 17,0 4,5 0,18 -4,5 -17,0 -4,-5" fill="#bfdbfe" />
        </g>

        {/* Star Beta (Comrade B) */}
        <g transform="translate(210, 120)">
          <circle cx="0" cy="0" r="28" fill="url(#starGlowB)" />
          <circle cx="0" cy="0" r="10" fill="#ffffff" />
          <polygon points="0,-18 4,-5 17,0 4,5 0,18 -4,5 -17,0 -4,-5" fill="#bae6fd" />
        </g>

        {/* Bond Token / Intersecting Rings */}
        <g transform="translate(160, 100)">
          <circle cx="-10" cy="0" r="14" fill="none" stroke="#60a5fa" strokeWidth="2" />
          <circle cx="10" cy="0" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" />
        </g>
      </svg>
    )
  },

  // 8: First Car
  {
    code: "SHARD-09",
    category: "VELOCITY ENCLAVE",
    badge: "IRON HORSE",
    primaryColor: "#eab308",
    accentGlow: "rgba(234, 179, 8, 0.4)",
    bgGradient: "from-yellow-950/70 via-slate-950 to-amber-900/40",
    hint: "The four-wheeled machine that granted your first independent mobility.",
    renderIllustration: (isAnswered, chars) => (
      <svg viewBox="0 0 320 200" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="roadSpeed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#eab308" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#fde047" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Speed Grid Lines */}
        <line x1="20" y1="160" x2="300" y2="160" stroke="#facc15" strokeWidth="2" />
        <line x1="40" y1="170" x2="280" y2="170" stroke="#eab308" strokeWidth="1" strokeDasharray="10 10" />

        {/* Retro-Futuristic Coupe Silhouette */}
        <g transform="translate(160, 120)">
          {/* Aerodynamic Body */}
          <path d="M-80,10 L-60,-8 L-30,-22 L35,-22 L70,-4 L90,10 Z" fill="#854d0e" stroke="#fef08a" strokeWidth="2" />
          {/* Cabin Glass */}
          <polygon points="-25,-20 30,-20 55,-6 -45,-6" fill="#fef9c3" opacity="0.75" />
          {/* Headlights Light Beam */}
          <polygon points="90,6 200,-20 200,30 90,12" fill="url(#roadSpeed)" />
          {/* Wheels */}
          <circle cx="-50" cy="14" r="14" fill="#0f172a" stroke="#facc15" strokeWidth="3" />
          <circle cx="-50" cy="14" r="5" fill="#fef08a" />
          <circle cx="55" cy="14" r="14" fill="#0f172a" stroke="#facc15" strokeWidth="3" />
          <circle cx="55" cy="14" r="5" fill="#fef08a" />
          {/* Speedometer Gauge in Background */}
          <path d="M-40,-50 A35,35 0 0,1 40,-50" fill="none" stroke="#ca8a04" strokeWidth="3" strokeDasharray="3 3" />
          <line x1="0" y1="-50" x2="22" y2="-70" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    )
  },

  // 9: First Concert
  {
    code: "SHARD-10",
    category: "SONIC HARMONY",
    badge: "ELECTRIC STAGE",
    primaryColor: "#14b8a6",
    accentGlow: "rgba(20, 184, 166, 0.4)",
    bgGradient: "from-teal-950/70 via-slate-950 to-emerald-900/40",
    hint: "The thunderous live stage, acoustic frenzy, and vibrating basslines.",
    renderIllustration: (isAnswered, chars) => (
      <svg viewBox="0 0 320 200" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="laserBeam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Stage Laser Fan Rays */}
        <polygon points="160,30 40,160 50,160" fill="url(#laserBeam)" />
        <polygon points="160,30 110,160 120,160" fill="url(#laserBeam)" />
        <polygon points="160,30 200,160 210,160" fill="url(#laserBeam)" />
        <polygon points="160,30 270,160 280,160" fill="url(#laserBeam)" />

        {/* Audio Equalizer Spectrum Bars */}
        <g transform="translate(60, 150)">
          {[18, 35, 60, 45, 80, 55, 95, 40, 70, 50, 30, 65, 85, 45, 25].map((h, i) => (
            <rect 
              key={i} 
              x={i * 13} 
              y={-h * 0.7} 
              width="8" 
              height={h * 0.7} 
              rx="2" 
              fill={i % 2 === 0 ? "#2dd4bf" : "#5eead4"} 
              opacity={0.8}
            />
          ))}
        </g>

        {/* Electric Guitar Silhouette in Center Spotlight */}
        <g transform="translate(160, 90)">
          <circle cx="0" cy="0" r="35" fill="#134e4a" stroke="#2dd4bf" strokeWidth="1.5" />
          {/* Guitar Body */}
          <path d="M-15,10 Q-22,25 0,30 Q22,25 15,10 Q10,0 12,-12 Q-12,-12 -15,10 Z" fill="#0f766e" stroke="#99f6e4" strokeWidth="1.5" />
          {/* Neck & Headstock */}
          <rect x="-3" y="-45" width="6" height="35" fill="#115e59" stroke="#99f6e4" strokeWidth="1" />
          <polygon points="-5,-45 5,-45 7,-55 -7,-55" fill="#0d9488" />
        </g>
      </svg>
    )
  }
];

interface CinematicQuestionExperienceProps {
  answers: string[];
  setAnswers: (answers: string[]) => void;
  visibleAnswers: Record<number, boolean>;
  setVisibleAnswers: (vis: Record<number, boolean>) => void;
  loading: boolean;
  onSubmit: () => void;
  onBack: () => void;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
}

export default function CinematicQuestionExperience({
  answers,
  setAnswers,
  visibleAnswers,
  setVisibleAnswers,
  loading,
  onSubmit,
  onBack,
  title = "Cryptographic Shard Synthesis",
  subtitle = "Phase III: Ten Multi-Dimensional Redundancy Challenges",
  submitLabel = "Commit Encrypted Shards & Initialize Vault"
}: CinematicQuestionExperienceProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'cinema' | 'overview'>('cinema');
  const [isMuted, setIsMuted] = useState(false);
  const [justLocked, setJustLocked] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when active card changes in cinema mode
  useEffect(() => {
    if (viewMode === 'cinema' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeIndex, viewMode]);

  const currentArtwork = QUESTION_ARTWORKS[activeIndex] || QUESTION_ARTWORKS[0];
  const currentQuestion = SECURITY_QUESTIONS[activeIndex];
  const currentAnswer = answers[activeIndex] || '';
  const isCurrentVisible = !!visibleAnswers[activeIndex];

  // Count answered shards
  const answeredCount = answers.filter(a => a.trim().length > 0).length;
  const isAllAnswered = answeredCount === SECURITY_QUESTIONS.length;

  const handleAnswerChange = (val: string, index = activeIndex) => {
    questionFX.playKeyTick();
    const next = [...answers];
    next[index] = val;
    setAnswers(next);
  };

  const handleNext = () => {
    if (activeIndex < SECURITY_QUESTIONS.length - 1) {
      questionFX.playCardSlide();
      setActiveIndex(prev => prev + 1);
    } else {
      if (isAllAnswered) {
        questionFX.playAllCompleteChord();
      }
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      questionFX.playCardSlide();
      setActiveIndex(prev => prev - 1);
    }
  };

  const handleLockAndAdvance = () => {
    questionFX.playShardLocked();
    setJustLocked(true);
    setTimeout(() => setJustLocked(false), 500);

    if (activeIndex < SECURITY_QUESTIONS.length - 1) {
      setTimeout(() => {
        setActiveIndex(prev => prev + 1);
      }, 250);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    questionFX.setMuted(next);
  };

  // Evaluate answer entropy rating
  const getEntropyLevel = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return { level: 'NONE', label: 'Empty Shard', color: 'text-slate-500', width: '0%', bg: 'bg-slate-700' };
    if (trimmed.length < 3) return { level: 'LOW', label: 'Low Entropy', color: 'text-amber-400', width: '25%', bg: 'bg-amber-500' };
    if (trimmed.length < 6) return { level: 'MED', label: 'Moderate Enclave', color: 'text-indigo-400', width: '65%', bg: 'bg-indigo-500' };
    return { level: 'HIGH', label: 'Military-Grade Entropy', color: 'text-emerald-400', width: '100%', bg: 'bg-emerald-400' };
  };

  const entropy = getEntropyLevel(currentAnswer);

  return (
    <div className="w-full text-slate-100 flex flex-col space-y-6 select-none animate-fade-in">
      
      {/* TOP HEADER CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-display uppercase">
              {title}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
              {answeredCount}/{SECURITY_QUESTIONS.length} SEALED
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Mute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>

          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('cinema')}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === 'cinema' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Cinema Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('overview')}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === 'overview' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Overview</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODE 1: CINEMA CARD CAROUSEL (OUT OF THIS WORLD VISUAL FOCUS) ─── */}
      {viewMode === 'cinema' && (
        <div className="flex flex-col items-center space-y-6">
          
          {/* QUICK JUMP THUMBNAIL MATRIX (1-10) */}
          <div className="w-full flex items-center justify-between gap-1 sm:gap-2 px-1 py-2 overflow-x-auto custom-scrollbar">
            {SECURITY_QUESTIONS.map((_, idx) => {
              const meta = QUESTION_ARTWORKS[idx];
              const isAnswered = (answers[idx] || '').trim().length > 0;
              const isCurrent = idx === activeIndex;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    questionFX.playCardSlide();
                    setActiveIndex(idx);
                  }}
                  className={cn(
                    "flex-1 min-w-[40px] sm:min-w-[54px] py-1.5 px-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border",
                    isCurrent
                      ? "bg-indigo-600/30 border-indigo-500 shadow-lg shadow-indigo-900/40 text-white scale-105"
                      : isAnswered
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40"
                      : "bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono font-black">
                      #{idx + 1}
                    </span>
                    {isAnswered && (
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[8px] font-mono font-bold uppercase truncate max-w-[45px] opacity-75">
                    {meta.category.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* MAIN HOLOGRAPHIC 3D QUESTION CARD */}
          <div className="w-full max-w-2xl relative" style={{ perspective: '1000px' }}>
            
            {/* Ambient Volumetric Backdrop */}
            <div 
              className="absolute -inset-1 rounded-3xl opacity-30 filter blur-xl pointer-events-none transition-colors duration-700"
              style={{ background: currentArtwork.primaryColor }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, rotateY: 15, scale: 0.95 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: -15, scale: 0.95 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "relative rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-xl transition-all",
                  justLocked ? "ring-2 ring-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]" : ""
                )}
              >
                {/* Top Card Banner & Metadata */}
                <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center border font-mono text-[11px] font-black"
                      style={{
                        borderColor: currentArtwork.primaryColor,
                        backgroundColor: `${currentArtwork.primaryColor}25`,
                        color: currentArtwork.primaryColor
                      }}
                    >
                      {activeIndex + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400">
                          {currentArtwork.code} • {currentArtwork.category}
                        </span>
                      </div>
                      <span 
                        className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border inline-block mt-0.5"
                        style={{
                          borderColor: `${currentArtwork.primaryColor}50`,
                          backgroundColor: `${currentArtwork.primaryColor}15`,
                          color: currentArtwork.primaryColor
                        }}
                      >
                        {currentArtwork.badge}
                      </span>
                    </div>
                  </div>

                  {/* Shard Status Badge */}
                  <div className="flex items-center gap-1.5">
                    {currentAnswer.trim().length > 0 ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full shadow-sm">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>LOCKED SHARD</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-full shadow-sm">
                        <Key className="h-3 w-3 animate-pulse" />
                        <span>AWAITING ENTROPY</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* THEMATIC IMAGE & VISUAL ARTWORK STAGE */}
                <div className={cn("w-full h-48 sm:h-56 relative overflow-hidden bg-gradient-to-b", currentArtwork.bgGradient)}>
                  {/* Futuristic Scanlines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_51%)] bg-[size:100%_4px] pointer-events-none opacity-40" />
                  
                  {/* Render Visual Art */}
                  <div className="w-full h-full flex items-center justify-center p-2">
                    {currentArtwork.renderIllustration(currentAnswer.trim().length > 0, currentAnswer.length)}
                  </div>

                  {/* Holographic Watermark / Corner Runes */}
                  <div className="absolute bottom-2 left-3 text-[9px] font-mono text-slate-400/60 pointer-events-none">
                    SEC_CHALLENGE_{activeIndex + 1} // AES_SEED_OCTET
                  </div>
                  <div className="absolute top-2 right-3 text-[9px] font-mono text-slate-400/60 pointer-events-none">
                    ENTROPY_VECT::{currentAnswer.length * 8}_BITS
                  </div>
                </div>

                {/* THE QUESTION DISPLAY */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-white leading-snug">
                      "{currentQuestion}"
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 italic">
                      {currentArtwork.hint}
                    </p>
                  </div>

                  {/* INPUT FIELD WITH AUDIO FEEDBACK */}
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input 
                        ref={inputRef}
                        type={isCurrentVisible ? "text" : "password"}
                        value={currentAnswer}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (currentAnswer.trim()) {
                              handleLockAndAdvance();
                            }
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-400 rounded-2xl pl-11 pr-24 py-4 text-sm font-mono text-white placeholder:text-slate-600 outline-none transition-all shadow-inner"
                        placeholder="Type answer to energize shard..."
                        autoComplete="off"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setVisibleAnswers({ ...visibleAnswers, [activeIndex]: !isCurrentVisible })}
                          className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-800"
                          title={isCurrentVisible ? "Conceal Answer" : "Reveal Answer"}
                        >
                          {isCurrentVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        
                        {currentAnswer.trim() && (
                          <button
                            type="button"
                            onClick={handleLockAndAdvance}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-md"
                          >
                            <span>Lock</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ENTROPY STRENGTH GAUGE */}
                    <div className="flex items-center justify-between gap-3 px-1">
                      <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          className={cn("h-full rounded-full transition-all duration-300", entropy.bg)}
                          animate={{ width: entropy.width }}
                        />
                      </div>
                      <span className={cn("text-[10px] font-mono font-bold uppercase", entropy.color)}>
                        {entropy.label}
                      </span>
                    </div>
                  </div>

                  {/* CAROUSEL CONTROLS */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={activeIndex === 0}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>

                    <span className="text-xs font-mono text-slate-500 font-bold">
                      {activeIndex + 1} / {SECURITY_QUESTIONS.length}
                    </span>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={activeIndex === SECURITY_QUESTIONS.length - 1}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Next Shard</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ─── MODE 2: OVERVIEW GRID (REVIEW ALL 10 THEMATIC VISUAL CARDS) ─── */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto px-1 custom-scrollbar">
          {SECURITY_QUESTIONS.map((q, idx) => {
            const meta = QUESTION_ARTWORKS[idx];
            const answer = answers[idx] || '';
            const isVisible = !!visibleAnswers[idx];
            const isAnswered = answer.trim().length > 0;

            return (
              <div 
                key={idx}
                className={cn(
                  "rounded-2xl border p-4 bg-slate-900/80 relative overflow-hidden flex flex-col justify-between space-y-3 transition-all",
                  isAnswered ? "border-emerald-500/40" : "border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-5 h-5 rounded-md font-mono text-[10px] font-bold flex items-center justify-center border"
                      style={{
                        borderColor: meta.primaryColor,
                        color: meta.primaryColor,
                        backgroundColor: `${meta.primaryColor}20`
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                      {meta.category}
                    </span>
                  </div>
                  {isAnswered && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  )}
                </div>

                {/* Micro Thumbnail Art */}
                <div className={cn("w-full h-20 rounded-xl overflow-hidden bg-gradient-to-b border border-slate-800/80 relative", meta.bgGradient)}>
                  {meta.renderIllustration(isAnswered, answer.length)}
                </div>

                <div>
                  <h5 className="text-xs font-bold text-white line-clamp-2">
                    {q}
                  </h5>
                </div>

                <div className="relative">
                  <input 
                    type={isVisible ? "text" : "password"}
                    value={answer}
                    onChange={(e) => handleAnswerChange(e.target.value, idx)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    placeholder="Enter answer..."
                  />
                  <button
                    type="button"
                    onClick={() => setVisibleAnswers({ ...visibleAnswers, [idx]: !isVisible })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
                  >
                    {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOTTOM ACTION BAR */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          disabled={loading || !isAllAnswered}
          onClick={onSubmit}
          className={cn(
            "w-full sm:flex-1 py-4 px-6 rounded-2xl font-mono text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer",
            isAllAnswered && !loading
              ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-indigo-900/50 scale-[1.01]"
              : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
          )}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isAllAnswered ? (
            <Sparkles className="h-4 w-4 text-emerald-300 animate-spin" />
          ) : (
            <Lock className="h-4 w-4 text-slate-500" />
          )}
          <span>
            {loading ? "INITIALIZING ENCLAVE..." : isAllAnswered ? submitLabel : `COMPLETE ALL 10 SHARDS (${answeredCount}/10)`}
          </span>
        </button>
      </div>

    </div>
  );
}
