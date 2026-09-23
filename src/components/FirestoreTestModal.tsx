import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  ShieldCheck, 
  Send, 
  Trash2, 
  FileCode, 
  X,
  Server
} from 'lucide-react';
import { runFirestoreDiagnostics, FirestoreTestReport, TestStepResult } from '../utils/firestoreTester';
import { auth } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirestoreTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FirestoreTestModal({ isOpen, onClose }: FirestoreTestModalProps) {
  const [report, setReport] = useState<FirestoreTestReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedStep, setSelectedStep] = useState<TestStepResult | null>(null);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    setSelectedStep(null);
    try {
      const finalReport = await runFirestoreDiagnostics((step, current) => {
        setReport({ ...current });
      });
      setReport(finalReport);
      if (finalReport.steps.length > 0) {
        setSelectedStep(finalReport.steps[0]);
      }
    } catch (e: any) {
      console.error("Test runner encountered error:", e);
    } finally {
      setIsRunning(false);
    }
  };

  const currentUser = auth.currentUser;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                Firestore Cloud Submission Test Suite
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 font-bold">
                  v2.5
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Live Document Mutation &amp; Security Validation • DB: <span className="text-slate-200">{firebaseConfig.firestoreDatabaseId}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Context & Info Banner */}
        <div className="p-4 bg-slate-950/30 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Session Auth:</span>
            {currentUser ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                <CheckCircle2 className="h-3 w-3" />
                {currentUser.email} ({currentUser.uid.slice(0, 8)}...)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                <AlertTriangle className="h-3 w-3" />
                Unauthenticated (Read tests only; login needed for write submission)
              </span>
            )}
          </div>
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Executing Live Suite...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Run Firestore Test Suite
              </>
            )}
          </button>
        </div>

        {/* Content Area: Two-column layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Steps List (Left) */}
          <div className="md:col-span-6 p-4 overflow-y-auto space-y-2.5 custom-scrollbar">
            {!report && !isRunning && (
              <div className="p-8 text-center space-y-3">
                <Server className="h-10 w-10 text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Ready to Probe Firestore
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans max-w-sm mx-auto">
                  Click the <b>"Run Firestore Test Suite"</b> button above to execute live read, write, server verification, cleanup, and audit trail tests against the Firestore cluster.
                </p>
              </div>
            )}

            {report?.steps.map((step) => {
              const isSelected = selectedStep?.id === step.id;
              return (
                <div
                  key={step.id}
                  onClick={() => setSelectedStep(step)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-slate-800/90 border-indigo-500/60 shadow-md' 
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {step.status === 'pass' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                      {step.status === 'fail' && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                      {step.status === 'running' && <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin shrink-0" />}
                      {step.status === 'pending' && <div className="h-3 w-3 rounded-full border border-slate-700 shrink-0" />}
                      {step.status === 'skipped' && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
                      <span className="text-xs font-bold text-slate-200 truncate font-mono">
                        {step.name}
                      </span>
                    </div>
                    {step.durationMs !== undefined && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                        {step.durationMs}ms
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="truncate">{step.targetPath}</span>
                    <span className={`uppercase font-bold text-[9px] px-1.5 py-0.2 rounded ${
                      step.status === 'pass' ? 'bg-emerald-950/60 text-emerald-400' :
                      step.status === 'fail' ? 'bg-red-950/60 text-red-400' :
                      step.status === 'running' ? 'bg-indigo-950/60 text-indigo-400 animate-pulse' :
                      step.status === 'skipped' ? 'bg-amber-950/60 text-amber-400' :
                      'text-slate-600'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details Panel (Right) */}
          <div className="md:col-span-6 p-4 overflow-y-auto bg-slate-950/40 custom-scrollbar flex flex-col justify-between">
            {selectedStep ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      selectedStep.status === 'pass' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      selectedStep.status === 'fail' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      selectedStep.status === 'skipped' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {selectedStep.status}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedStep.durationMs !== undefined ? `${selectedStep.durationMs}ms roundtrip` : 'Pending execution'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">
                    {selectedStep.name}
                  </h4>
                  <p className="text-[11px] font-mono text-indigo-400 mt-0.5">
                    Target: /{selectedStep.targetPath}
                  </p>
                </div>

                {selectedStep.details && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300">
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Execution Log</p>
                    {selectedStep.details}
                  </div>
                )}

                {selectedStep.error && (
                  <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs font-mono text-red-300">
                    <p className="text-red-400 text-[10px] uppercase font-bold tracking-wider mb-1">Error Trace</p>
                    {selectedStep.error}
                  </div>
                )}

                {selectedStep.payload && (
                  <div>
                    <p className="text-slate-400 text-[10px] font-mono uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
                      <FileCode className="h-3 w-3" /> Submitted / Returned Payload:
                    </p>
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48 custom-scrollbar">
                      {JSON.stringify(selectedStep.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-mono text-xs my-auto">
                Select any step on the left to inspect its detailed server handshake, duration, and transmitted payload.
              </div>
            )}

            {/* Overall status footer if finished */}
            {report && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Total Duration: <b className="text-white">{report.totalDurationMs}ms</b></span>
                <span className={`font-bold px-2 py-0.5 rounded ${
                  report.overallPassed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                }`}>
                  {report.overallPassed ? 'ALL TESTED GATES PASSED' : 'DIAGNOSTICS FINISHED WITH NOTES'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Encrypted zero-knowledge enclave architecture active.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold font-mono transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
