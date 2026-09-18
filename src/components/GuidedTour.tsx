import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Key, Fingerprint, Lock, Unlock, Database, Users, 
  HelpCircle, ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2, 
  FileText, CreditCard, AlertTriangle, RefreshCw, Eye, Smartphone, 
  Layers, HardDrive, Compass, BookOpen, ExternalLink, ShieldCheck,
  Video, Play, Cpu
} from 'lucide-react';
import { cn } from '../lib/utils';
import InteractiveVaultMovieStage, { MOVIE_STAGES } from './InteractiveVaultMovieStage';

export interface TourStep {
  id: string;
  targetScreen?: 'all' | 'auth' | 'setup' | 'verify' | 'corrupted' | 'vault';
  badge: string;
  title: string;
  description: string;
  deepDive: string;
  icon: React.ReactNode;
  movieStage?: number; // 0 to 5 matching the 6 mechanical stages
  fieldTips?: { name: string; tip: string }[];
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'intro_zk',
    targetScreen: 'all',
    badge: 'Core Architecture',
    title: 'Zero-Knowledge Cryptographic Vault',
    description: 'Welcome to WhyOr Vault. Unlike typical cloud managers, your credentials and secrets never leave your device unencrypted. All cryptographic keys are derived locally in browser memory.',
    deepDive: 'The server stores only ciphertext and high-entropy salted hashes. Neither system administrators nor database compromise can expose your unencrypted data.',
    icon: <Shield className="h-6 w-6 text-indigo-400" />,
    movieStage: 0,
    fieldTips: [
      { name: 'Session Key', tip: 'Derived strictly in RAM using PBKDF2 / Argon2id and scrubbed on lock.' },
      { name: 'Zero-Knowledge Proof', tip: 'Your password never travels over the network.' }
    ]
  },
  {
    id: 'entropy_questions',
    targetScreen: 'setup',
    badge: '3-Stage Protocol',
    title: '10-Question Entropy Key Derivation',
    description: 'To protect your vault without requiring a single vulnerable master password, your session key is synthesized from 10 distinct security questions grouped into 3 security tiers.',
    deepDive: 'Each answer receives an individual random cryptographic salt before being hashed with SHA-256. The composite signature rotates the multi-axis combination dial to generate a high-entropy 256-bit AES session key.',
    icon: <Key className="h-6 w-6 text-amber-400" />,
    movieStage: 1,
    fieldTips: [
      { name: 'Stage Alpha: Core Identity', tip: 'Answers 1-3 establish baseline entropy.' },
      { name: 'Stage Beta: Environmental Verification', tip: 'Answers 4-6 introduce dynamic spatial variance.' },
      { name: 'Stage Omega: Final Synthesis', tip: 'Answers 7-10 complete the cryptographic derivation.' }
    ]
  },
  {
    id: 'hardware_biometrics',
    targetScreen: 'verify',
    badge: 'WebAuthn PRF Protocol',
    title: 'Hardware Biometrics & YubiKey Keys',
    description: 'Link your Touch ID, Face ID, Windows Hello, or physical YubiKey hardware token. Once linked, you can unlock your vault instantly with biometric validation.',
    deepDive: 'Uses the WebAuthn PRF (Pseudo-Random Function) extension to bind your cryptographic key directly to your device secure hardware enclave, disengaging the perimeter titanium bolts.',
    icon: <Fingerprint className="h-6 w-6 text-emerald-400" />,
    movieStage: 2,
    fieldTips: [
      { name: 'Touch ID / Face ID', tip: 'Enclave-protected hardware credential stored in your device TPM.' },
      { name: 'Iframe Sandbox Protection', tip: 'When inside preview frames, click Open in New Tab for direct hardware scanner access.' }
    ]
  },
  {
    id: 'recovery_master_key',
    targetScreen: 'setup',
    badge: 'Disaster Recovery',
    title: 'Emergency Master Key & Shamir Escrow',
    description: 'In the event of lost credentials, your Emergency Master Kit provides a cryptographically secure fallback split into Shamir secret shares across trusted contacts.',
    deepDive: 'A 2-of-3 threshold is required to reconstruct the master recovery seed, ensuring no single contact or trustee can compromise your private vault unilaterally.',
    icon: <ShieldCheck className="h-6 w-6 text-cyan-400" />,
    movieStage: 3,
    fieldTips: [
      { name: 'Emergency Paper Key', tip: 'Printable QR code and 24-word BIP-39 mnemonic phrase stored offline.' },
      { name: 'Shamir Split', tip: 'Mathematical polynomial shares distributed to designated trusted contacts.' }
    ]
  },
  {
    id: 'hkdf_partitions',
    targetScreen: 'vault',
    badge: 'Compartmentalization',
    title: 'HKDF Cryptographic Partitions',
    description: 'Your assets are segmented into independent cryptographic partitions (Banking, Legal, Medical, Personal, Real Estate). Each partition derives an isolated encryption key.',
    deepDive: 'If one partition key is shared with a designated heir or attorney, other compartments remain sealed and mathematically inaccessible.',
    icon: <Layers className="h-6 w-6 text-purple-400" />,
    movieStage: 4,
    fieldTips: [
      { name: 'Sub-Key Isolation', tip: 'HMAC-based Extract-and-Expand Key Derivation Function (HKDF-SHA256).' },
      { name: 'Independent Nonces', tip: 'Unique 96-bit initialization vectors ensure cipher uniqueness.' }
    ]
  },
  {
    id: 'declaring_records',
    targetScreen: 'vault',
    badge: 'Asset Declaration',
    title: 'Declaring Sensitive Records & Heirs',
    description: 'Easily store bank credentials, crypto seeds, physical safe lock combinations, insurance policies, and digital wills with designated beneficiary release schedules.',
    deepDive: 'Fields are individually encrypted using authenticated AES-GCM before writing to the local encrypted indexedDB/LocalStorage datastore.',
    icon: <Database className="h-6 w-6 text-teal-400" />,
    movieStage: 5,
    fieldTips: [
      { name: 'Nominee Assignment', tip: 'Designate specific heirs for specific assets with automatic delay timer.' },
      { name: 'Local In-Memory Cache', tip: 'Records only exist unencrypted in active ephemeral browser RAM.' }
    ]
  },
  {
    id: 'decoy_duress',
    targetScreen: 'vault',
    badge: 'Coercion Defense',
    title: 'Decoy Duress Vault Mode',
    description: 'If forced to open your vault under duress or threat, enter your secondary Duress PIN. WhyOr Vault will open a plausible, fully populated decoy vault.',
    deepDive: 'Zero cryptographic trace of your real vault exists in decoy mode. Coercers cannot detect that a secondary partition is active.',
    icon: <AlertTriangle className="h-6 w-6 text-rose-400" />,
    movieStage: 2,
    fieldTips: [
      { name: 'Duress PIN', tip: 'Alternate PIN that unlocks randomized innocuous mock estate items.' },
      { name: 'Silent Alert', tip: 'Optionally dispatches silent beacon to emergency contacts.' }
    ]
  },
  {
    id: 'audit_chain',
    targetScreen: 'vault',
    badge: 'Integrity Verification',
    title: 'Tamper-Evident Merkle Audit Chain',
    description: 'Every record update, export, and unlock attempt is recorded in a cryptographically sealed SHA-256 Merkle audit trail.',
    deepDive: 'Any unauthorized local file alteration or manual cache tampering invalidates the root Merkle hash and immediately trips the security interlock.',
    icon: <HardDrive className="h-6 w-6 text-blue-400" />,
    movieStage: 1,
    fieldTips: [
      { name: 'Root Merkle Hash', tip: 'Immutable cryptographic fingerprint of the entire vault database.' },
      { name: 'Integrity Checker', tip: 'Automatic self-verification runs upon each unlock.' }
    ]
  },
  {
    id: 'session_decay',
    targetScreen: 'all',
    badge: 'Zero Exposure',
    title: 'Ephemeral Session Memory & Auto-Decay',
    description: 'WhyOr Vault automatically zeroes all decrypted memory buffers when you switch tabs, minimize the window, or remain idle for longer than your timeout setting.',
    deepDive: 'Cryptographic keys are overwritten with pseudorandom noise before garbage collection, defending against memory dumping and browser tab snooping.',
    icon: <RefreshCw className="h-6 w-6 text-amber-400" />,
    movieStage: 3,
    fieldTips: [
      { name: 'Inactivity Timer', tip: 'Configurable 5-60 minute auto-lock countdown.' },
      { name: 'Tab Visibility Guard', tip: 'Locks immediately when switching tabs or locking your OS screen.' }
    ]
  }
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen?: 'auth' | 'setup' | 'verify' | 'corrupted' | 'vault';
  onReplayVaultAnimation?: () => void;
}

export default function GuidedTour({
  isOpen,
  onClose,
  currentScreen = 'vault',
  onReplayVaultAnimation
}: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'guide' | 'movie'>('guide');

  // Set initial step based on current screen if applicable
  useEffect(() => {
    if (isOpen) {
      const matchIndex = TOUR_STEPS.findIndex(s => s.targetScreen === currentScreen);
      if (matchIndex !== -1) {
        setCurrentStepIndex(matchIndex);
      } else {
        setCurrentStepIndex(0);
      }
    }
  }, [isOpen, currentScreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, viewMode]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const activeMovieStage = currentStep.movieStage ?? (currentStepIndex % 6);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-3xl p-5 sm:p-7 z-10 text-left overflow-hidden my-auto max-h-[92vh] flex flex-col justify-between"
        >
          {/* Top Decorative Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3 mb-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-950 shrink-0">
                <Compass className="h-5 w-5 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase font-black tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
                    Guided System Walkthrough
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    STEP {currentStepIndex + 1} OF {TOUR_STEPS.length}
                  </span>
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-tight mt-0.5">
                  WhyOr Vault Architecture &amp; Field Guide
                </h3>
              </div>
            </div>

            {/* View Mode Toggle: Guide vs Interactive Movie */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('guide')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                    viewMode === 'guide'
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Field Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('movie')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                    viewMode === 'movie'
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <Video className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Vault Movie Simulator</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close Guide"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Step Progress Dots & Tabs */}
          <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 custom-scrollbar shrink-0">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 cursor-pointer shrink-0",
                  idx === currentStepIndex
                    ? "w-8 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]"
                    : idx < currentStepIndex
                    ? "w-2.5 bg-emerald-500/60 hover:bg-emerald-500"
                    : "w-2.5 bg-slate-800 hover:bg-slate-700"
                )}
                title={`Jump to: ${step.title}`}
              />
            ))}
          </div>

          {/* MAIN BODY AREA (Scrollable) */}
          <div className="overflow-y-auto pr-1 space-y-5 custom-scrollbar flex-1">
            {viewMode === 'guide' ? (
              <div className="space-y-5">
                {/* Step Headline */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-lg">
                    {currentStep.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 mb-1">
                      {currentStep.badge}
                    </div>
                    <h4 className="text-lg font-black text-white tracking-tight">
                      {currentStep.title}
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-normal">
                      {currentStep.description}
                    </p>
                  </div>
                </div>

                {/* INTEGRATED VAULT MOVIE MECHANICAL STAGE FOR THIS STEP */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-950/60 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[10px] font-mono uppercase font-black text-indigo-400 tracking-wider">
                        Synchronized Vault Movie Mechanism · {MOVIE_STAGES[activeMovieStage].badge}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('movie')}
                      className="text-[10px] font-mono font-bold text-slate-400 hover:text-white uppercase flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Interactive Movie Studio</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Compact Embedded Vault Interactive Simulation */}
                  <InteractiveVaultMovieStage 
                    currentStage={activeMovieStage}
                    compact={true}
                    onLaunchFullscreen={onReplayVaultAnimation ? () => {
                      onClose();
                      onReplayVaultAnimation();
                    } : undefined}
                  />
                </div>

                {/* Deep Dive Box */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Cryptographic Protocol Deep Dive</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {currentStep.deepDive}
                  </p>
                </div>

                {/* Field Tips Grid */}
                {currentStep.fieldTips && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block">
                      Field &amp; Component Descriptions:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentStep.fieldTips.map((tip, idx) => (
                        <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1 text-left">
                          <span className="text-xs font-bold text-slate-200 block">
                            • {tip.name}
                          </span>
                          <p className="text-[11px] text-slate-400 leading-snug">
                            {tip.tip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* FULL INTERACTIVE VAULT MOVIE STUDIO VIEW */
              <div className="space-y-4">
                <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                    <Video className="h-4 w-4 text-indigo-400" />
                    <span>Interactive Cinematic Vault Opening Engine</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Test and simulate each mechanical phase of the multi-ton blast doors opening in real time. Experience dial rotation, perimeter bolt retraction, pneumatic steam release, and 3D portal swing with dynamic synthesized audio.
                  </p>
                </div>

                <InteractiveVaultMovieStage 
                  onLaunchFullscreen={onReplayVaultAnimation ? () => {
                    onClose();
                    onReplayVaultAnimation();
                  } : undefined}
                />
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {onReplayVaultAnimation && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReplayVaultAnimation();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/50 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Experience the full-screen cinematic blast door movie"
                >
                  <Lock className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Launch Fullscreen Movie</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentStepIndex === 0}
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white border border-slate-700 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950"
              >
                <span>{currentStepIndex === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next Topic"}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Floating quick-launch trigger button that can be mounted anywhere
export function TourLauncherButton({
  onClick,
  label = "Guided Tour & Help",
  className
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-950/40 group",
        className
      )}
      title="Open Guided Tour with Tooltips & Field Explanations"
    >
      <Compass className="h-4 w-4 text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
      <span>{label}</span>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
    </button>
  );
}
