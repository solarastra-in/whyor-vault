import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Shield, ShieldCheck, Key, Lock, Unlock, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { SECURITY_QUESTIONS } from '../constants/questions';
import { QUESTION_ARTWORKS } from './CinematicQuestionExperience';
import { cn } from '../lib/utils';

interface CinematicVerificationChallengeProps {
  stage: 1 | 2 | 3;
  attempt: number;
  indices: number[];
  allAnswers: Record<number, string>;
  setAllAnswers: (answers: Record<number, string>) => void;
  visibleAnswers: Record<number, boolean>;
  setVisibleAnswers: (vis: Record<number, boolean>) => void;
  loading: boolean;
  onNextStage: () => void;
}

export default function CinematicVerificationChallenge({
  stage,
  attempt,
  indices,
  allAnswers,
  setAllAnswers,
  visibleAnswers,
  setVisibleAnswers,
  loading,
  onNextStage
}: CinematicVerificationChallengeProps) {
  const [activeSubIndex, setActiveSubIndex] = useState(0);

  // If activeSubIndex is out of range when indices changes, reset to 0
  useEffect(() => {
    setActiveSubIndex(0);
  }, [indices]);

  const currentQIndex = indices[activeSubIndex] ?? indices[0] ?? 0;
  const currentArtwork = QUESTION_ARTWORKS[currentQIndex] || QUESTION_ARTWORKS[0];
  const currentQuestion = SECURITY_QUESTIONS[currentQIndex];
  const currentAnswer = allAnswers[currentQIndex] || '';
  const isCurrentVisible = !!visibleAnswers[currentQIndex];

  const allCurrentAnswered = indices.every(idx => (allAnswers[idx] || '').trim().length > 0);

  return (
    <div className="w-full text-slate-100 flex flex-col space-y-6">
      
      {/* STAGE & ATTEMPT TRACKER */}
      <div>
        <div className="flex items-center justify-between text-indigo-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 font-mono">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            <span>ENCLAVE CHALLENGE • STAGE {stage} OF 3</span>
          </div>
          <span className="text-amber-400">
            ATTEMPT {attempt + 1}/3
          </span>
        </div>

        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500", 
                stage >= i ? "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]" : "bg-slate-800"
              )} 
            />
          ))}
        </div>

        <h2 className="text-lg sm:text-xl font-black text-white uppercase font-display tracking-tight">
          {stage === 1 ? 'Stage Alpha: Core Identity' : stage === 2 ? 'Stage Beta: Environmental Verification' : 'Stage Omega: Final Synthesis'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Decrypt the holographic security shard by providing the corresponding memory entropy.
        </p>
      </div>

      {/* MULTI-QUESTION TABS (IF MULTIPLE QUESTIONS IN THIS STAGE) */}
      {indices.length > 1 && (
        <div className="flex gap-2">
          {indices.map((idx, pos) => {
            const meta = QUESTION_ARTWORKS[idx];
            const isAnswered = (allAnswers[idx] || '').trim().length > 0;
            const isSelected = pos === activeSubIndex;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSubIndex(pos)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                  isSelected
                    ? "bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-950/40"
                    : isAnswered
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                )}
              >
                <span>Shard {pos + 1}</span>
                {isAnswered ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Key className="h-3 w-3 text-slate-500" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* HOLOGRAPHIC QUESTION CARD */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQIndex}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span 
                className="w-6 h-6 rounded-md font-mono text-[10px] font-bold flex items-center justify-center border"
                style={{
                  borderColor: currentArtwork.primaryColor,
                  color: currentArtwork.primaryColor,
                  backgroundColor: `${currentArtwork.primaryColor}20`
                }}
              >
                #{currentQIndex + 1}
              </span>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  {currentArtwork.category}
                </span>
                <span 
                  className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ml-2"
                  style={{
                    borderColor: `${currentArtwork.primaryColor}40`,
                    color: currentArtwork.primaryColor
                  }}
                >
                  {currentArtwork.badge}
                </span>
              </div>
            </div>

            {currentAnswer.trim() ? (
              <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Ready</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                <Key className="h-3 w-3 animate-pulse" />
                <span>Required</span>
              </span>
            )}
          </div>

          {/* Holographic Illustration Canvas */}
          <div className={cn("w-full h-44 sm:h-52 relative overflow-hidden bg-gradient-to-b", currentArtwork.bgGradient)}>
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_51%)] bg-[size:100%_4px] pointer-events-none opacity-40" />
            <div className="w-full h-full flex items-center justify-center p-2">
              {currentArtwork.renderIllustration(currentAnswer.trim().length > 0, currentAnswer.length)}
            </div>
            <div className="absolute bottom-2 left-3 text-[9px] font-mono text-slate-400/60 pointer-events-none">
              RESTORATION_HASH::{currentQIndex}
            </div>
          </div>

          {/* Question Text & Input */}
          <div className="p-5 space-y-4">
            <div>
              <h4 className="text-base sm:text-lg font-black text-white">
                "{currentQuestion}"
              </h4>
              <p className="text-xs text-slate-400 mt-1 italic">
                {currentArtwork.hint}
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock className="h-4 w-4" />
              </div>
              <input 
                type={isCurrentVisible ? "text" : "password"}
                value={currentAnswer}
                onChange={(e) => setAllAnswers({ ...allAnswers, [currentQIndex]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (indices.length > 1 && activeSubIndex < indices.length - 1) {
                      setActiveSubIndex(prev => prev + 1);
                    } else if (allCurrentAnswered && !loading) {
                      onNextStage();
                    }
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-400 rounded-2xl pl-11 pr-12 py-4 text-sm font-mono text-white placeholder:text-slate-600 outline-none transition-all shadow-inner"
                placeholder="Declare value to satisfy challenge..."
                autoFocus
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setVisibleAnswers({ ...visibleAnswers, [currentQIndex]: !isCurrentVisible })}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-800"
              >
                {isCurrentVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* STAGE SUBMISSION BUTTON */}
      <button 
        disabled={loading || !allCurrentAnswered}
        onClick={onNextStage}
        className={cn(
          "w-full py-5 rounded-2xl font-mono text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl cursor-pointer",
          allCurrentAnswered && !loading
            ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white shadow-indigo-900/50 scale-[1.01]"
            : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
        )}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 text-indigo-300" />
        )}
        <span>
          {loading ? 'Synthesizing Entropy...' : stage === 3 ? 'Execute Final Decryption' : 'Submit Entropy & Progress'}
        </span>
      </button>

    </div>
  );
}
