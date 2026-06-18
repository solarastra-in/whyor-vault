import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Lock, Unlock, Key, RefreshCw, LogOut, Check, ChevronLeft, ChevronRight, 
  CreditCard, Landmark, HelpCircle, Eye, EyeOff, Activity, FileText, FolderOpen, 
  Heart, ClipboardList, Database, Sparkles, Home, Zap, Info, AlertTriangle, 
  Play, Smartphone, BookOpen, ExternalLink, Settings, Lightbulb, Users, Scale, 
  Clock, CheckCircle, Mail, Skull, ShieldAlert, KeyRound, AlertCircle
} from 'lucide-react';

interface OnboardingDiscoveryProps {
  onNext: () => void;
  onLogout: () => void;
}

export default function OnboardingDiscovery({ onNext, onLogout }: OnboardingDiscoveryProps) {
  const [cur, setCur] = useState(0);
  const TOTAL = 8;

  // Screen 2 States (Compartment Live Decrypt demo)
  const [demoInputText, setDemoInputText] = useState('MySecretBankPIN');
  const [isDecrypted, setIsDecrypted] = useState(false);

  // Screen 3 States (Failure and lockout demo)
  const [attempts, setAttempts] = useState(0);
  const [isCorrupted, setIsCorrupted] = useState(false);

  // Screen 4 States (Active Partition selected)
  const [activePartition, setActivePartition] = useState<'banking' | 'legal' | 'valuables'>('banking');

  // Screen 5 States (Check-in countdown simulation)
  const [countdownDays, setCountdownDays] = useState(12);
  const [checkinSuccessMsg, setCheckinSuccessMsg] = useState<string | null>(null);

  // Auto-clear message
  useEffect(() => {
    if (checkinSuccessMsg) {
      const timer = setTimeout(() => setCheckinSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [checkinSuccessMsg]);

  const handleHeartbeatReset = () => {
    setCountdownDays(30);
    setCheckinSuccessMsg('💓 Heartbeat verified! Check-in reset to 30 days.');
  };

  const handleSimulateExpiry = () => {
    setCountdownDays(0);
    setCheckinSuccessMsg('🚨 Countdown elapsed! 48-hour grace period active.');
  };

  const incrementAttempts = () => {
    if (isCorrupted) return;
    const nextAttempts = attempts + 1;
    if (nextAttempts >= 3) {
      setAttempts(3);
      setIsCorrupted(true);
    } else {
      setAttempts(nextAttempts);
    }
  };

  const resetAttempts = () => {
    setAttempts(0);
    setIsCorrupted(false);
  };

  const phases = [
    'STATUS: PHASE I · DISCOVERY',
    'STATUS: PHASE I · ASSET COMPARTMENTS',
    'STATUS: PHASE II · ENCRYPTION PROTOCOL',
    'STATUS: PHASE III · ACCESS CONTROL',
    'STATUS: PHASE III · GUARDIAN DISPATCH',
    'STATUS: PHASE IV · LEGAL PROTOCOL',
    'STATUS: PHASE IV · SECURITY CHECKLIST',
    'STATUS: COMPLETE · VAULT READY',
  ];

  const handleNext = () => {
    if (cur === TOTAL - 1) {
      onNext();
    } else {
      setCur((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (cur > 0) {
      setCur((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* ONBOARDING TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-slate-300 font-mono tracking-wider">
              {phases[cur]}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">
              Screen {cur + 1} of {TOTAL}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
          {/* Step dots */}
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                onClick={() => setCur(i)}
                className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                  i < cur 
                    ? 'w-2 bg-emerald-500' 
                    : i === cur 
                    ? 'w-6 bg-indigo-500 shadow-sm shadow-indigo-500/50' 
                    : 'w-2 bg-slate-800'
                }`}
                title={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCur(TOTAL - 1)}
            className="text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-all border border-slate-800/80 hover:border-slate-700 bg-slate-950/40 px-3 py-1.5 rounded-lg"
          >
            Skip Intro
          </button>
        </div>
      </div>

      {/* CORE FRAME FOR SCULLING CHUNKS */}
      <div className="min-h-[500px] flex flex-col justify-between">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={cur}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch py-2"
          >
            
            {/* ─── SCREEN 1: WHAT IS WHYOR VAULT? ─── */}
            {cur === 0 && (
              <>
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <span className="text-[9px] font-mono uppercase bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                      // 01 · DISCOVERY PHASE
                    </span>
                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase mt-3">
                      Your entire life's <br />
                      <span className="text-indigo-400">assets. Secured forever.</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      WhyOrVault is a zero-knowledge encrypted estate vault. Catalog every critical asset, document, and instruction — and ensure your family can access them when it matters most, not before.
                    </p>
                  </div>

                  <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl space-y-2">
                    <div className="flex gap-2 items-center text-xs font-bold text-slate-300">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span>WHY THIS EXISTS</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Every year, millions of families spend months—sometimes years—searching for bank accounts, insurance policies, property deeds, and passwords after losing a loved one. WhyOrVault solves this securely.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-start gap-3">
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                        <Home className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">For your family's future</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          Every heir knows exactly what exists, where it is, and how to access it — without guessing or agonizing search.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-start gap-3">
                      <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">Zero-knowledge encryption</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          All keys are derived inside your browser. No server — not even WhyOrVault — can read your data or bypass credentials.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-start gap-3">
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">Automated handoff when it matters</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          A 30-day check-in timer setup. If you run out of check-ins, your designated heirs automatically receive access files without physical hurdles.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl border border-slate-850 p-6 flex flex-col items-center justify-center gap-6">
                  {/* Dynamic Locking SVG */}
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full rotate-45" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="2" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="283" strokeDashoffset="60" strokeLinecap="round" className="animate-spin" style={{ animationDuration: '6s' }} />
                      <circle cx="50" cy="50" r="35" fill="none" stroke="#111827" strokeWidth="6" />
                      <circle cx="50" cy="50" r="35" fill="none" stroke="#14b8a6" strokeWidth="2" strokeDasharray="220" strokeDashoffset="120" strokeLinecap="round" className="animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
                    </svg>
                    <div className="z-10 p-4 bg-slate-900/90 border border-indigo-500/30 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center">
                      <Lock className="h-8 w-8 text-indigo-400 animate-pulse" />
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-2 block">ENCRYPTED</span>
                    </div>
                  </div>

                  <div className="text-center w-full space-y-4">
                    <div>
                      <h4 className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-widest">SYSTEM STATUS</h4>
                      <div className="flex gap-1.5 justify-center flex-wrap mt-2">
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-lg flex items-center gap-1">
                          <Check className="h-2.5 w-2.5" /> AES-256-GCM
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-lg">
                          Client-side only
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold rounded-lg">
                          Zero-knowledge
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 max-w-xs mx-auto">
                      <div className="flex justify-between items-center bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850">
                        <span className="text-slate-500 text-[10px] uppercase font-mono">Everyday Assets</span>
                        <div className="w-24 bg-slate-850 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: '55%' }}></div>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-white">55%</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850">
                        <span className="text-slate-500 text-[10px] uppercase font-mono">Long-term Estate</span>
                        <div className="w-24 bg-slate-850 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-teal-500 h-full rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-white">45%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── SCREEN 2: WHAT DO YOU STORE? ─── */}
            {cur === 1 && (
              <>
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <span className="text-[9px] font-mono uppercase bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                      // 02 · STORAGE COMPARTMENTS
                    </span>
                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase mt-3">
                      Two worlds. <br />
                      <span className="text-teal-400">One secure place.</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      WhyOrVault is organized into two distinct layers — everyday life essentials that your family needs day-to-day, and your long-term estate that transfers wealth and legacy.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* simple everyday matters */}
                    <div className="space-y-2.5">
                      <div className="text-[10px] uppercase font-black text-emerald-400 font-mono tracking-wider flex items-center gap-1">
                        <Zap className="h-3 w-3" /> everyday life essentials
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                          <span>💳</span> Bank & Cards
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">
                          Nominee registry, backup cards, autopay schedules
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                          <span>🏠</span> Physical Cache
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">
                          Safe locker combinations, currency caches, keys
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                          <span>⚡</span> Household Utilities
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">
                          Wi-Fi keys, electricity boards, emergency billing schedules
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                          <span>📱</span> Digital Footprint
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">
                          Primary email references, social media proxies, domain references
                        </p>
                      </div>
                    </div>

                    {/* long-term family estate */}
                    <div className="space-y-2.5">
                      <div className="text-[10px] uppercase font-black text-amber-500 font-mono tracking-wider flex items-center gap-1">
                        <Landmark className="h-3 w-3" /> long-term family estate
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                          <span>📜</span> Wills & Trusts
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">
                          Digital copy of testament, executors, trust coordinates
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                          <span>🏘️</span> Estates & Property
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">
                          Property deeds, tax cards, registration info, khata references
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                          <span>🛡️</span> Financial Payouts
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">
                          Life insurance (LIC) registry, policies, agent contacts
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                          <span>💎</span> Physical Valuables
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">
                          Gold appraisal charts, safety box receipts, legal jewelry valuations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl border border-slate-850 p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">LIVE COMPARTMENT PREVIEW</div>
                    <div className="p-3.5 bg-slate-900 border border-indigo-500/20 text-slate-300 rounded-xl flex gap-2.5 items-start">
                      <Shield className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
                      <p className="text-[10px] leading-relaxed text-slate-300">
                        All items shown below are fully encrypted. Your browser decrypts them locally — nothing leaves your private session.
                      </p>
                    </div>

                    <div className="bg-slate-950 px-4 py-3 border border-slate-850 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase">DOMESTIC SPLIT LEDGERS</span>
                        <button
                          type="button"
                          onClick={() => setIsDecrypted(!isDecrypted)}
                          className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold font-mono border transition-all ${
                            isDecrypted 
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' 
                              : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20'
                          }`}
                        >
                          {isDecrypted ? '🔓 Decrypted Locally' : '🔐 Ciphertext'}
                        </button>
                      </div>

                      <div className="space-y-1.5 font-mono text-[10px]">
                        <div className="flex justify-between items-center py-1 border-b border-slate-900/60">
                          <span className="text-slate-400">🏦 HDFC Nominees</span>
                          <span className={isDecrypted ? 'text-emerald-400' : 'text-slate-650'}>
                            {isDecrypted ? 'Claim: $14,250 (Split 50/50)' : 'C7FdEa942...x98'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-900/60">
                          <span className="text-slate-400">🔑 Locker Combo</span>
                          <span className={isDecrypted ? 'text-emerald-400' : 'text-slate-650'}>
                            {isDecrypted ? 'Left 42 - Right 18 - Left 9' : 'Df9381Ka...v12'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400">⚡ Wi-Fi Secret Pin</span>
                          <span className={isDecrypted ? 'text-emerald-400' : 'text-slate-650'}>
                            {isDecrypted ? 'home_network::2026!gogogo' : '••••••••••••'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 border border-slate-850 rounded-xl font-mono text-[10px] text-slate-400 space-y-1">
                    <div className="text-slate-500 font-bold flex justify-between">
                      <span>CRYPTO SHIELD DECRYPT</span>
                      <span className="text-indigo-400">PBKDF2-AES</span>
                    </div>
                    <code className="block whitespace-pre-wrap leading-relaxed pt-1.5 text-slate-500">
                      <span className="text-indigo-400">session_key</span> = PBKDF2(answers, salt, 250000)<br />
                      <span className="text-teal-400">plaintext</span> = AES-GCM.decrypt(ciphertext, session_key)<br />
                      <span className="text-amber-500">// Server receives only zero-knowledge blobs</span>
                    </code>
                  </div>
                </div>
              </>
            )}

            {/* ─── SCREEN 3: HOW THE SECURITY WORKS ─── */}
            {cur === 2 && (
              <>
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <span className="text-[9px] font-mono uppercase bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                      // 03 · PROTOCOL DESIGN
                    </span>
                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase mt-3">
                      Nobody can read your vault. <br />
                      <span className="text-indigo-400">Not even us.</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      This is not a policy promise. It is an immutable mathematical fact. Your encryption keys are derived inside your browser node — they never leave your device.
                    </p>
                  </div>

                  <div className="space-y-3 font-sans">
                    <div className="flex gap-4 p-3 bg-slate-900/60 border border-slate-850 rounded-xl items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">1</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">You answer 10 personal security questions</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          Questions only you know — Childhood teacher, first street, pet's name. Answers are input and processed offline in local frame session.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 p-3 bg-slate-900/60 border border-slate-850 rounded-xl items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">2</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Each answer is SHA-256 hashed and salted</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          Hashing turns readable answers into unique 64-character fingerprints. One slight typo results in a completely mismatching key.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 p-3 bg-slate-900/60 border border-slate-850 rounded-xl items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">3</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">250,000 rounds of PBKDF2 stretching</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          Stretching adds computational load (~0.5s per test). This makes mechanical dictionary and GPU array brute-force attacks impossible.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 p-3 bg-slate-900/60 border border-slate-850 rounded-xl items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">4</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Server HMAC Salt configuration (the Pepper)</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          The final crypto-barrier: a server-side secret Pepper. Even if database is stolen, it is un-decryptable without the environment secret.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl border border-slate-850 p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5">
                    <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">SECURE ATTACK SHIELD SIMULATOR</div>

                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-rose-400 font-black tracking-widest uppercase">DATABASE COMPROMISE TEST</span>
                        <span className="text-[9px] bg-emerald-500/15 border border-emerald-555/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">100% BLOCKED</span>
                      </div>

                      <div className="space-y-1.5 font-mono text-[10px]">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Attacker Gets: Blobs</span>
                          <span className="text-slate-500">Encrypted</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div className="bg-slate-600 h-full rounded-full" style={{ width: '100%' }}></div>
                        </div>

                        <div className="flex justify-between items-center text-slate-400 pt-1">
                          <span>Needs: Your 10 Answers</span>
                          <span className="text-rose-400">Missing</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: '0%' }}></div>
                        </div>

                        <div className="flex justify-between items-center text-slate-400 pt-1">
                          <span>Needs: Server Pepper</span>
                          <span className="text-rose-400">Missing</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-rose-500/5 hover:bg-rose-500/10 transition-colors border border-rose-500/20 rounded-xl space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-rose-400 flex items-center gap-1">
                          <Skull className="h-3.5 w-3.5" /> Brute-Force Lock Counter
                        </span>
                        {isCorrupted ? (
                          <span className="text-[8px] bg-rose-500/20 border border-rose-500/30 text-rose-400 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-widest animate-pulse">CORRUPTED</span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-400">{attempts}/3 Failures</span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 leading-normal">
                        To block brute-force attempts, typing wrong answers 3 times activates cryptographic state corruption inside Database. standard credentials permanently locked!
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={incrementAttempts}
                          disabled={isCorrupted}
                          className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                        >
                          Simulate Bad Try
                        </button>
                        {(attempts > 0 || isCorrupted) && (
                          <button
                            type="button"
                            onClick={resetAttempts}
                            className="bg-slate-900 border border-slate-750 text-slate-300 hover:text-white px-3 py-1.5 rounded text-[10px] uppercase font-bold cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isCorrupted && (
                    <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start gap-2 animate-pulse">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-300 leading-relaxed font-mono">
                        isCorrupted=true triggered. Standard browser login has been permanently disabled on server metadata level. Master emergency recovery physical seed mandatory to unlock database.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ─── SCREEN 4: HEIR ACCESS & ROLES ─── */}
            {cur === 3 && (
              <>
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <span className="text-[9px] font-mono uppercase bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                      // 04 · HEIR ACCESS LAYER
                    </span>
                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase mt-3">
                      Your family gets <br />
                      <span className="text-teal-400">exactly what you decide.</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Designate heirs with surgical crypto precision. Each person sees only the partitions you grant them — access is cryptographic, not just a soft toggle switch.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">DESIGNATED FAMILY HEIRS</div>
                    
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-900/80 border border-slate-850 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">AS</div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase">Ananya Sharma</h4>
                            <p className="text-[10px] text-slate-400 font-sans">Spouse · Primary heir nominee · full clearance</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full">TIER 1 HEIR</span>
                      </div>

                      <div className="p-3 bg-slate-900/80 border border-slate-850 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">RS</div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase">Rohan Sharma</h4>
                            <p className="text-[10px] text-slate-400 font-sans">Son · Secondary successor · Read access</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-violet-500/15 border border-violet-500/25 text-violet-400 px-2 py-0.5 rounded-full">TIER 2 HEIR</span>
                      </div>

                      <div className="p-3 bg-slate-900/80 border border-slate-850 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs">PS</div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase">Priya Sharma</h4>
                            <p className="text-[10px] text-slate-400 font-sans">Daughter · Insurance/Valuables payout heir</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/25 text-amber-500 px-2 py-0.5 rounded-full">TIER 2 HEIR</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl border border-slate-850 p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">HKDF CO-ENCRYPTION PRINCIPLE</div>
                    
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                      <div className="text-[10px] uppercase text-indigo-400 font-bold tracking-wide flex items-center gap-1.5">
                        <Shield className="h-4 w-4" /> Category Isolation
                      </div>

                      <p className="text-[10.5px] text-slate-300 leading-relaxed">
                        Each category compartment gets its own derived sub-key via HKDF. Decrypting the banking ledger tells an examiner or partial heir zero details about legal documents or emotional letters.
                      </p>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1 text-[9px] font-mono">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>🏦 Key Banking:</span>
                          <span className="text-indigo-400">HKDF(sys_key, "banking")</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>📜 Key Legal:</span>
                          <span className="text-teal-400">HKDF(sys_key, "legal")</span>
                        </div>
                        <div className="text-[7.5px] text-slate-500 text-center uppercase tracking-wider pt-1 border-t border-slate-900/60 mt-1">
                          No direct core-key reuse across scopes
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🔑</span>
                        <h4 className="text-xs font-bold text-white uppercase">Emergency Access PIN</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5">
                        Your heirs do NOT hold your Master Key. Instead, Tier 1 is issued a static 6-digit cryptographic PIN. This PIN can decrypt partial components, but ONLY AFTER check-in timer triggers are exceeded and confirmed as active by server consensus.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── SCREEN 5: ESTATE TRIGGER & CHECK-IN ─── */}
            {cur === 4 && (
              <>
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <span className="text-[9px] font-mono uppercase bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                      // 05 · GUARDIAN DISPATCH TIMERS
                    </span>
                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase mt-3">
                      30 days. Then <br />
                      <span className="text-indigo-400">the vault hands off.</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      The Countdown Check-in Trigger is your automated digital estate executor. Keep check-ins active to lock the doors. If you stop checking in - heirs receive access step-by-step.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">HARSH ESCROW RELEASE CYCLE</div>

                    <div className="space-y-2.5">
                      <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex gap-3.5 items-start">
                        <div className="w-6 h-6 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold">1</div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Tier 1 Notification Dispatched</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                            First check-in window (30 days) runs out. Server fires email invitation with keyshare coordinates to Ananya Sharma.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex gap-3.5 items-start">
                        <div className="w-6 h-6 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold">2</div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">48-Hour Hard Grace Safeguard Period</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                            System sends a final panic SMS & secondary route notification to your device. If check-in occurs now, emergency dispatch aborted instantly.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex gap-3.5 items-start">
                        <div className="w-6 h-6 bg-rose-500/10 border border-rose-500/20 text-red-400 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold">3</div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Vault Access Released</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                            Vault compartments are opened securely. Nominal heirs use their unique hardware key options or combined Shamir shares to build and decrypt.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl border border-slate-850 p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">LIVE HEARTBEAT TIMERS</div>

                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 text-center space-y-4 relative overflow-hidden">
                      {/* Timer ring mock */}
                      <div className="w-28 h-28 mx-auto relative flex items-center justify-center">
                        <svg className="w-full h-full rotate-270" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#1c2438" strokeWidth="6" />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="42" 
                            fill="none" 
                            stroke={countdownDays === 0 ? '#ef4444' : '#6366f1'} 
                            strokeWidth="6" 
                            strokeDasharray="264" 
                            strokeDashoffset={264 - (264 * (countdownDays / 30))} 
                            strokeLinecap="round" 
                            className="transition-all duration-700" 
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-xl font-mono font-black ${countdownDays === 0 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>{countdownDays}</span>
                          <span className="text-[8px] font-mono uppercase text-slate-500 font-bold">Days Left</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                          <span>TIMER WINDOW</span>
                          <span>{countdownDays}/30 DAYS USED</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${countdownDays === 0 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${(countdownDays/30)*100}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleHeartbeatReset}
                          className="flex-1 bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/20 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                        >
                          💓 Reset Heartbeat (Check-In)
                        </button>
                        <button
                          type="button"
                          onClick={handleSimulateExpiry}
                          className="bg-slate-955 border border-slate-750 text-slate-450 hover:text-rose-400 px-3 py-1.5 rounded text-[10px] uppercase font-bold cursor-pointer"
                        >
                          Expire
                        </button>
                      </div>
                    </div>

                    {checkinSuccessMsg && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-mono leading-normal shadow-sm">
                        {checkinSuccessMsg}
                      </div>
                    )}

                    <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase text-violet-400 font-bold">
                        <span>💌</span> Sealed Legacy Letters
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Your private letters are sealed inside individual categories. They cannot be sniffed or parsed by support or platform, and release only on verified timeout expiry.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── SCREEN 6: AUTHORITIES & LEGAL ─── */}
            {cur === 5 && (
              <>
                <div className="lg:col-span-12 space-y-6">
                  <div className="max-w-3xl">
                    <span className="text-[9px] font-mono uppercase bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                      // 06 · LEGAL COMPULSION & COMPLIANCE
                    </span>
                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase mt-3">
                      A court order gets them <br />
                      <span className="text-teal-400">nothing useful.</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      WhyOrVault is built so that even if every server we own is seized by any government authority, no plaintext data is recoverable. This is mathematics, not simple platform policy.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-800 transition-all">
                      <div className="space-y-2">
                        <div className="text-2xl">🧑‍💻</div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest">Hacker Steals Database</div>
                        <h4 className="text-xs font-bold text-white uppercase">Gets nothing useful</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1">
                          They receive encrypted binary data fragments. Useless without your private security Answers and localized Server Pepper keys.
                        </p>
                      </div>
                      <span className="inline-block mt-4 w-fit text-[9px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded">
                        🛡️ BLOCKED BY DESIGN
                      </span>
                    </div>

                    <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-800 transition-all">
                      <div className="space-y-2">
                        <div className="text-2xl">⚖️</div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest">Court Order Served</div>
                        <h4 className="text-xs font-bold text-white uppercase">We comply fully. You are safe.</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1">
                          We produce exactly what we have on record. What we produce: encrypted cipher data. Your keys reside only inside browser RAM.
                        </p>
                      </div>
                      <span className="inline-block mt-4 w-fit text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded">
                        ⚖️ ZERO DATA RECOVERABLE
                      </span>
                    </div>

                    <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-800 transition-all">
                      <div className="space-y-2">
                        <div className="text-2xl">👁️</div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest">Insider Integrity Breach</div>
                        <h4 className="text-xs font-bold text-white uppercase">Even Support Has zero access</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1">
                          Platform operators and internal database engineers see absolute static noise. Cryptographic locks cannot be hotfixed by software administrators.
                        </p>
                      </div>
                      <span className="inline-block mt-4 w-fit text-[9px] font-mono font-bold bg-rose-500/15 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded">
                        🚫 IMPOSSIBLE IN CODE
                      </span>
                    </div>
                  </div>

                  <div className="bg-indigo-500/5 border border-indigo-500/25 p-5 rounded-2xl flex items-start gap-4">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Precedent Reference: Signal Messenger Protocol</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Signal was subpoenaed by the US Department of Justice. They fully complied and delivered everything they held in storage: account creation timestamp and last active dates. That is zero-messages, zero-metakey access in practice. WhyOrVault enforces exactly this cryptographic security pipeline.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── SCREEN 7: SECURITY CHECKLIST ─── */}
            {cur === 6 && (
              <>
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <span className="text-[9px] font-mono uppercase bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                      // 07 · OPERATIONAL CHECKLIST
                    </span>
                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase mt-3">
                      Do these things. <br />
                      <span className="text-indigo-400">Stay protected always.</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Zero-knowledge security depends on basic operational custody. Avoid digital compromises by tracking this physical and mental security plan.
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-2">
                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">Never save the Master Key on your phone</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          Phone screenshots automatically backup to unencrypted iCloud or Google Photos. Keep things analog — print or write down coordinates on physical card.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">Distribute Shamir coordinates to 3 nodes</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          Hand shares to spouse + private lawyer lockbox + primary file stash. Any 2 combined reconstruct complete credentials. One lost share exposes zero risk.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">Designate a secondary Duress Vault</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          Set up decoy answers. Entering decoy credentials opens a fully formed duress sandbox, hiding your central estates from search under physical force.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-500 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">!</div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">Use answers not searchable on social media</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          Do not use generic dog breeds or high school nicknames. Pick unique questions with answer variants known strictly only by memory.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl border border-slate-850 p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">SHAMIR SHIELD CRYPTO THEORY</div>

                    <div className="bg-slate-900 p-4 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Users className="h-4 w-4" /> 3 Shares. Any 2 reconstruct.
                      </h4>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-center font-mono">
                          <span className="text-[10px] text-violet-400 font-bold">Share S1</span>
                          <span className="text-[8px] text-slate-500 block mt-1 uppercase">You hold</span>
                        </div>
                        <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-center font-mono">
                          <span className="text-[10px] text-violet-400 font-bold">Share S2</span>
                          <span className="text-[8px] text-slate-500 block mt-1 uppercase">Spouse node</span>
                        </div>
                        <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-center font-mono">
                          <span className="text-[10px] text-violet-400 font-bold">Share S3</span>
                          <span className="text-[8px] text-slate-500 block mt-1 uppercase">Attorney box</span>
                        </div>
                      </div>

                      <p className="text-[9.5px] leading-relaxed text-slate-400 font-sans">
                        Under Galois Field GF(2⁸) polynomial mechanics, holding 1 separate share yields absolute zero mathematical knowledge about the password. Only combined threshold splits decrypt vaults.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl font-mono text-[9px] text-slate-500 space-y-1">
                      <div className="text-slate-400 font-bold">DUPLEX CRYPTO STRUCTURE</div>
                      <code className="block leading-relaxed">
                        real_vault_key = PBKDF2(real_ans, ...)<br />
                        decoy_duress_key = PBKDF2(fake_ans, ...)<br />
                        <span className="text-emerald-400">// Server structure is identical. Impossible to show which ledger is the real primary storage node.</span>
                      </code>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── SCREEN 8: READY TO START ─── */}
            {cur === 7 && (
              <div className="lg:col-span-12 max-w-2xl mx-auto w-full text-center space-y-6 py-6">
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-emerald-500 p-0.5 rounded-full mx-auto flex items-center justify-center shadow-xl animate-bounce">
                    <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-emerald-400" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                    Your vault is ready.
                  </h1>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                    You now understand completely what WhyOrVault does, why it exists, and how it keeps your central assets secure from external servers and platforms.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-xxl pt-4">
                  <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="text-xl">💳</div>
                      <h4 className="text-xs font-bold text-white uppercase mt-2">1. catalog assets</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Start with everyday life modules — home Wi-Fi keys, card registries, auto billing dates. Takes only 10 minutes.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="text-xl">🔑</div>
                      <h4 className="text-xs font-bold text-white uppercase mt-2">2. save master key</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Write down the generated 24-character master key in a physical safe. Do not photograph it or email it to anyone.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="text-xl">👨‍👩‍👧</div>
                      <h4 className="text-xs font-bold text-white uppercase mt-2">3. assign heirs</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Define check-in interval durations. Choose specific categories to delegate securely to chosen members.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center pt-6 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => setCur(0)}
                    className="flex-1 py-3 text-[10px] uppercase font-black tracking-widest border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  >
                    🔄 Replay Guide
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg hover:shadow-emerald-900/20 border border-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                    id="onboarding-enter-vault-button"
                  >
                    <span>Enter Vault</span>
                    <KeyRound className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
            
          </motion.div>
        </AnimatePresence>

        {/* BOTTOM STEPS CONTROL CODES */}
        {cur < TOTAL - 1 && (
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest shrink-0">
                SCREEN {cur + 1} OF {TOTAL}
              </span>
              <div className="w-32 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((cur + 1) / TOTAL) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrev}
                disabled={cur === 0}
                className={`flex-1 sm:flex-none px-5 py-3 text-[10px] tracking-widest font-bold uppercase border rounded-xl transition-all flex items-center gap-1.5 cursor-pointer justify-center ${
                  cur === 0 
                    ? 'border-slate-850/40 text-slate-600 cursor-not-allowed opacity-50 bg-slate-950/20' 
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all border border-indigo-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                id="onboarding-next-step-button"
              >
                <span>{cur === TOTAL - 2 ? 'Get Started' : 'Next Step'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
