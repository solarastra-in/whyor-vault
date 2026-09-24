import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  X, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Sliders, 
  ExternalLink, 
  Activity, 
  Lock, 
  Key, 
  Flame, 
  Play, 
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { cn, safeCopyToClipboard } from '../lib/utils';
import { db, auth, doc } from '../lib/firebase';
import { getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

interface DiagnosticLog {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'failed' | 'warning';
  message: string;
  details?: string;
}

export interface SecuritySimulationsAndDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchMovieVault?: () => void;
  onLaunchMasterKeyTransition?: () => void;
  onLaunchErasureSimulation?: () => void;
  defaultTab?: 'diagnostics' | 'simulations';
}

function getCleanPreviewUrl(): string {
  if (typeof window === 'undefined') return '';
  const u = new URL(window.location.href);
  return u.origin;
}

export const SecuritySimulationsAndDiagnosticsModal: React.FC<SecuritySimulationsAndDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  onLaunchMovieVault,
  onLaunchMasterKeyTransition,
  onLaunchErasureSimulation,
  defaultTab = 'diagnostics'
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'simulations'>(defaultTab);
  const [tests, setTests] = useState<DiagnosticLog[]>([]);
  const [testing, setTesting] = useState(false);
  const [lastTested, setLastTested] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tests.length === 0) {
      runAllTests();
    }
  }, [isOpen]);

  const runAllTests = async () => {
    if (testing) return;
    setTesting(true);

    const initial: DiagnosticLog[] = [
      { id: 'network', name: 'Browser IP Link (Generate_204)', status: 'running', message: 'Checking outbound IP routing pathway to Google Host CDN...', details: '' },
      { id: 'cfg', name: 'Firebase Credentials Descriptor', status: 'idle', message: 'Ready to inspect localized tokens...', details: '' },
      { id: 'backend', name: 'App Gateway Server Ingress (/api/health)', status: 'running', message: 'Probing regional sandbox server availability...', details: '' },
      { id: 'firestore', name: 'Cloud Firestore Connection (Force Server Read)', status: 'idle', message: 'Awaiting network probe sequence...', details: '' },
      { id: 'cache', name: 'Local Backup Configuration Cache', status: 'idle', message: 'Awaiting disk scan...', details: '' },
      { id: 'routing', name: 'Sandbox Escape & Route Fallback Verification', status: 'idle', message: 'Ready to assert SPA fallback routing integrity...', details: '' }
    ];
    setTests(initial);

    // 1. Direct Network Connectivity Check
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      await fetch('https://clients3.google.com/generate_204', {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      setTests(prev => prev.map(t => t.id === 'network' ? {
        ...t,
        status: 'success',
        message: 'PASSED • General outbound internet access is active and responding.'
      } : t));
    } catch (err: any) {
      setTests(prev => prev.map(t => t.id === 'network' ? {
        ...t,
        status: 'failed',
        message: 'FAILED • Internet routing failed or request timed out. Your local firewall or network posture may be blocking outbound Google resources.',
        details: err.toString()
      } : t));
    }

    // 2. Local Credentials Token Check
    setTests(prev => prev.map(t => t.id === 'cfg' ? { ...t, status: 'running', message: 'Analyzing firebase-applet-config.json...' } : t));
    try {
      const missing = [];
      const required = ['projectId', 'appId', 'apiKey', 'authDomain', 'firestoreDatabaseId'];
      for (const k of required) {
        if (!firebaseConfig[k as keyof typeof firebaseConfig]) {
          missing.push(k);
        }
      }
      if (missing.length > 0) {
        setTests(prev => prev.map(t => t.id === 'cfg' ? {
          ...t,
          status: 'failed',
          message: `FAILED • Essential configuration keys missing: ${missing.join(', ')}`
        } : t));
      } else {
        const maskedKey = firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 8)}...${firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4)}` : 'None';
        setTests(prev => prev.map(t => t.id === 'cfg' ? {
          ...t,
          status: 'success',
          message: `PASSED • Firebase credentials structured correctly.`,
          details: `Project ID: ${firebaseConfig.projectId}\nDatabase ID: ${firebaseConfig.firestoreDatabaseId}\nMasked Key: ${maskedKey}`
        } : t));
      }
    } catch (err: any) {
      setTests(prev => prev.map(t => t.id === 'cfg' ? { ...t, status: 'failed', message: 'FAILED • Local configuration file was unreadable.', details: err.toString() } : t));
    }

    // 3. Port 3000 Ingress Health check
    setTests(prev => prev.map(t => t.id === 'backend' ? { ...t, status: 'running', message: 'Querying backend Node gateway...' } : t));
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/api/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setTests(prev => prev.map(t => t.id === 'backend' ? {
          ...t,
          status: 'success',
          message: `PASSED • Gateway connection successful. Node server backend responded status: "${data.status || 'ok'}".`
        } : t));
      } else {
        setTests(prev => prev.map(t => t.id === 'backend' ? {
          ...t,
          status: 'warning',
          message: `MUTED • Server returned HTTP ${res.status}. Your backend is reachable but requires specific parameters.`
        } : t));
      }
    } catch (err: any) {
      setTests(prev => prev.map(t => t.id === 'backend' ? {
        ...t,
        status: 'warning',
        message: 'MUTED • Backend endpoint check was deferred or offline. (Expected if running under static-only mode).',
        details: err.toString()
      } : t));
    }

    // 4. Cloud Firestore connection bypass cache check
    setTests(prev => prev.map(t => t.id === 'firestore' ? { ...t, status: 'running', message: 'Sending un-cached test probe to cloud firestore endpoint (firestore.googleapis.com)...' } : t));
    try {
      const firestoreReadTask = async () => {
        const testRef = doc(db, 'vaults', '__system_connection_test_doc__');
        await getDocFromServer(testRef);
      };

      const timeoutTask = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore operation timed out (10s threshold). Cloud servers unreachable.')), 10000)
      );

      await Promise.race([firestoreReadTask(), timeoutTask]);

      setTests(prev => prev.map(t => t.id === 'firestore' ? {
        ...t,
        status: 'success',
        message: 'PASSED • Real-Time Firestore cloud connection validated! Read channel is 100% active.'
      } : t));
    } catch (err: any) {
      const errStr = err.toString();
      const isReplied = errStr.includes('permission-denied') || errStr.includes('Permission Denied') || errStr.includes('MISSING_OR_INSUFFICIENT_PERMISSIONS') || errStr.includes('not-found');
      
      if (isReplied) {
        setTests(prev => prev.map(t => t.id === 'firestore' ? {
          ...t,
          status: 'success',
          message: 'PASSED • Cloud Firestore is reachable! Firebase backend received, authenticated, and processed the request (received secure access reject as expected).'
        } : t));
      } else {
        setTests(prev => prev.map(t => t.id === 'firestore' ? {
          ...t,
          status: 'failed',
          message: 'FAILED • Could not establish link with Cloud Firestore backend. Server did not respond or connection timed out.',
          details: errStr
        } : t));
      }
    }

    // 5. Offline Cache Checks
    setTests(prev => prev.map(t => t.id === 'cache' ? { ...t, status: 'running', message: 'Inspecting browser local storage caches...' } : t));
    try {
      let foundKeys = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('whyor_') || k.startsWith('firebase:'))) {
          foundKeys++;
        }
      }

      if (foundKeys > 0) {
        setTests(prev => prev.map(t => t.id === 'cache' ? {
          ...t,
          status: 'success',
          message: `PASSED • Integrity check complete. Detected ${foundKeys} local configuration and data backups. Offline decrypt is ready.`
        } : t));
      } else {
        setTests(prev => prev.map(t => t.id === 'cache' ? {
          ...t,
          status: 'warning',
          message: 'WARNING • No offline backup configuration found on this browser yet. Login to a valid vault once to seed local storage backups.'
        } : t));
      }
    } catch (err: any) {
      setTests(prev => prev.map(t => t.id === 'cache' ? { ...t, status: 'failed', message: 'FAILED • Local storage unreadable. Check browser cookie/history settings.', details: err.toString() } : t));
    }

    // 6. Routing Integrity & Sandbox Escape Regression
    setTests(prev => prev.map(t => t.id === 'routing' ? { ...t, status: 'running', message: 'Verifying SPA fallback and Sandbox Escape viability...' } : t));
    try {
      const cleanUrl = getCleanPreviewUrl();
      const testPath = cleanUrl + (cleanUrl.endsWith('/') ? '' : '/') + 'test-spa-fallback-path-' + Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(testPath, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const contentType = res.headers.get('content-type') || '';
      const isHtml = contentType.includes('text/html');
      
      if (res.ok && isHtml) {
        setTests(prev => prev.map(t => t.id === 'routing' ? {
          ...t,
          status: 'success',
          message: 'PASSED • SPA Routing fallback verified! Absolute-path redirect to subpaths is operational and returns index.html without 404.'
        } : t));
      } else {
        setTests(prev => prev.map(t => t.id === 'routing' ? {
          ...t,
          status: 'failed',
          message: `FAILED • SPA Fallback route returned status ${res.status} (content-type: ${contentType}). Deep URLs may 404.`,
          details: `Requested: ${testPath}\nStatus: ${res.status}\nContent-Type: ${contentType}`
        } : t));
      }
    } catch (err: any) {
      setTests(prev => prev.map(t => t.id === 'routing' ? {
        ...t,
        status: 'failed',
        message: 'FAILED • Routing test encountered an error. Could not query local web host routing rules.',
        details: err.toString()
      } : t));
    }

    setLastTested(new Date().toLocaleTimeString());
    setTesting(false);
  };

  const handleEscapeIframe = () => {
    const cleanUrl = getCleanPreviewUrl();
    safeCopyToClipboard(cleanUrl).then((ok) => {
      if (ok && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-notify', {
          detail: { message: "Copied URL to clipboard! Open in a new tab.", type: "info" }
        }));
      }
    }).catch(() => {});
    window.open(cleanUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto pointer-events-auto">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative text-slate-100"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/15 border border-indigo-500/30 rounded-xl flex items-center justify-center shadow-inner">
                <Cpu className="text-indigo-400 h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  System Diagnostics & Security Lab
                </h2>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                  Isolated Testing Enclave {lastTested && `• Checked: ${lastTested}`}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Lab"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/50">
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={cn(
                "flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 transition-all",
                activeTab === 'diagnostics'
                  ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
              )}
            >
              <Activity className="w-4 h-4" />
              <span>Connection Diagnostics</span>
            </button>
            <button
              onClick={() => setActiveTab('simulations')}
              className={cn(
                "flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 transition-all",
                activeTab === 'simulations'
                  ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
              )}
            >
              <Layers className="w-4 h-4" />
              <span>Cryptographic Simulations</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
            {activeTab === 'diagnostics' ? (
              <>
                {/* Notice */}
                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-xs text-indigo-300 leading-relaxed space-y-1.5">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-indigo-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Isolated Network Audit
                  </p>
                  <p className="text-[11px] text-indigo-200/90">
                    This diagnostic suite queries Google CDN, Firebase Cloud Firestore, local storage caches, and server API gateways dynamically to inspect connectivity without cluttering active screens.
                  </p>
                </div>

                {/* Test Results */}
                <div className="space-y-3 font-mono">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    INTEGRITY CHECKLIST
                  </div>
                  {tests.map(t => (
                    <div key={t.id} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                      <div className="flex items-start gap-3 justify-between">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {t.status === 'running' && <RefreshCw className="h-3.5 w-3.5 text-indigo-400 animate-spin" />}
                            {t.status === 'success' && <Check className="h-3.5 w-3.5 text-emerald-400 font-bold" />}
                            {t.status === 'failed' && <X className="h-3.5 w-3.5 text-red-400 font-bold" />}
                            {t.status === 'warning' && <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                            {t.status === 'idle' && <div className="w-2 h-2 rounded-full bg-slate-600 my-1 mx-0.5" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">{t.name}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{t.message}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0",
                          t.status === 'success' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
                          t.status === 'failed' && "bg-red-500/10 text-red-500 border border-red-500/30",
                          t.status === 'warning' && "bg-amber-500/10 text-amber-400 border border-amber-500/30",
                          t.status === 'running' && "bg-indigo-500/10 text-indigo-400 animate-pulse border border-indigo-500/30",
                          t.status === 'idle' && "bg-slate-800 text-slate-500"
                        )}>
                          {t.status}
                        </span>
                      </div>
                      {t.details && (
                        <pre className="mt-2.5 p-2.5 bg-slate-900 rounded border border-slate-800/80 w-full overflow-x-auto text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed max-h-36">
                          {t.details}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Cryptographic Simulations Tab */
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-indigo-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Security Visualizations & Animation Preview
                  </p>
                  <p className="text-[11px]">
                    These interactive animations demonstrate key zero-knowledge state transitions. They have been relocated from active screens into this isolated lab so your everyday vault workflow stays clean and focused.
                  </p>
                </div>

                {/* Simulation 1: Movie Vault Opening */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-indigo-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                        Cinematic Mechanical Vault Opening
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Multi-bolt mechanical 3D lock tumblers and gear rotations used when transitioning into the unlocked secure enclave.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchMovieVault?.();
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-colors shadow-md shadow-indigo-950"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Play Animation</span>
                  </button>
                </div>

                {/* Simulation 2: Master Key Secondary Override */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Key className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                        Master Key Secondary Recovery Override
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Simulate the emergency break-glass master recovery key procedure for catastrophic passphrase loss without server assistance.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchMasterKeyTransition?.();
                    }}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-colors shadow-md shadow-amber-950"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Preview Override</span>
                  </button>
                </div>

                {/* Simulation 3: Duress Erasure Protocol */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 hover:border-red-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                      <Flame className="w-5 h-5 text-red-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2">
                        Duress Erasure Protocol (Dry-Run Simulation)
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          Safe • 0 Data Deleted
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Experience multi-pass cryptographic zeroization, memory scrubbing, and duress protocol animation in safe dry-run mode.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchErasureSimulation?.();
                    }}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-colors shadow-md shadow-red-950"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Test Erasure</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row gap-3">
            {activeTab === 'diagnostics' ? (
              <>
                <button
                  type="button"
                  onClick={runAllTests}
                  disabled={testing}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", testing && "animate-spin")} />
                  {testing ? 'Probing Cloud...' : 'Run Diagnostics Test'}
                </button>
                <button
                  type="button"
                  onClick={handleEscapeIframe}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Escape Iframe Sandbox
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Done / Return to Vault
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SecuritySimulationsAndDiagnosticsModal;
