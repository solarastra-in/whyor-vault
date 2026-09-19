import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Copy, Check, Eye, EyeOff, Shield, Share2, 
  Edit3, Calendar, Lock, AlertTriangle, Building2, 
  ExternalLink, FileText, UserCheck, Key, RefreshCw, 
  History, Landmark, CheckCircle2, Clock
} from 'lucide-react';
import { DecryptedItem } from '../types';
import AssetBadge from './AssetBadge';
import AssetExpirationBadge from './AssetExpirationBadge';
import { getItemMonetaryValue, formatCurrency, getPillarForType } from './AssetPillars';
import { getAssetExpirationStatus } from '../utils/expirationAlerts';
import { cn } from '../lib/utils';

interface AssetDrawerProps {
  item: DecryptedItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: DecryptedItem) => void;
  onShare: (item: DecryptedItem) => void;
  userId: string;
  vaultId: string;
}

export const AssetDrawer: React.FC<AssetDrawerProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onShare,
  userId,
  vaultId
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'credentials' | 'succession' | 'history'>('details');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});

  if (!item) return null;

  const expirationStatus = getAssetExpirationStatus(item);
  const monetaryValue = getItemMonetaryValue(item);
  const pillar = getPillarForType(item.type);

  const copyToClipboard = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
    window.dispatchEvent(new CustomEvent('app-notify', {
      detail: { message: `Copied ${fieldId} to clipboard!`, type: 'success' }
    }));
  };

  const toggleFieldReveal = (fieldId: string) => {
    setRevealedFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[90] backdrop-blur-xs cursor-pointer"
          />

          {/* Slide-in Sheet */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl z-[95] flex flex-col overflow-hidden text-slate-200"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/60 relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
                    <AssetBadge type={item.type} variant="glow" short />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <AssetBadge type={item.type} variant="pill" short />
                      {expirationStatus.isWithin30Days && (
                        <AssetExpirationBadge item={item} />
                      )}
                    </div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight leading-snug">
                      {item.name}
                    </h2>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {item.institution || 'Self-Custody / Personal Asset'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onShare(item)}
                    className="p-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                    title="Share this asset with heirs or legal counsel"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Edit record details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Close drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Financial Highlight Bar (if applicable) */}
              {monetaryValue > 0 && (
                <div className="mt-4 p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Estimated / Face Value
                  </span>
                  <span className="text-lg font-mono font-black text-emerald-400">
                    {formatCurrency(monetaryValue)}
                  </span>
                </div>
              )}

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800 mt-5 -mb-6 space-x-6 text-xs font-bold uppercase tracking-wider">
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'credentials', label: 'Security & Access' },
                  { id: 'succession', label: 'Ownership & Heirs' },
                  { id: 'history', label: 'Audit & Versions' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "pb-3 cursor-pointer transition-colors relative",
                      activeTab === tab.id 
                        ? "text-indigo-400 border-b-2 border-indigo-500 font-extrabold" 
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* TAB 1: DETAILS */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                      Primary Identification
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono">Pillar Category</span>
                        <span className="font-bold text-white">{pillar.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono">Institution / Custodian</span>
                        <span className="font-bold text-white">{item.institution || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono">Ownership Structure</span>
                        <span className="font-bold text-indigo-300">{item.ownershipType || 'Individual'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono">Primary Beneficiary</span>
                        <span className={cn("font-bold", item.beneficiary ? "text-emerald-400" : "text-amber-400")}>
                          {item.beneficiary || '⚠️ Not Assigned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bank & Credit Card Fields */}
                  {(item.accountNumber || item.routingNumber || item.cardNumber || item.creditLimit) && (
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">
                        Banking & Ledger Details
                      </h4>
                      <div className="space-y-2">
                        {item.accountNumber && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div>
                              <span className="text-[9px] font-mono uppercase text-slate-500 block">Account Number</span>
                              <span className="font-mono text-xs font-bold text-white">
                                {revealedFields['accountNumber'] ? item.accountNumber : `••••••••${item.accountNumber.slice(-4)}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleFieldReveal('accountNumber')}
                                className="p-1.5 text-slate-400 hover:text-white rounded"
                              >
                                {revealedFields['accountNumber'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => copyToClipboard(item.accountNumber!, 'Account Number')}
                                className="p-1.5 text-slate-400 hover:text-white rounded"
                              >
                                {copiedField === 'Account Number' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {item.routingNumber && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div>
                              <span className="text-[9px] font-mono uppercase text-slate-500 block">Routing / Sort Code</span>
                              <span className="font-mono text-xs font-bold text-white">{item.routingNumber}</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(item.routingNumber!, 'Routing Number')}
                              className="p-1.5 text-slate-400 hover:text-white rounded"
                            >
                              {copiedField === 'Routing Number' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}

                        {item.creditLimit && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[9px] font-mono uppercase text-slate-500">Credit Limit</span>
                            <span className="font-mono text-xs font-bold text-emerald-400">{item.creditLimit}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Insurance Specific Fields */}
                  {(item.policyNumber || item.coverageAmount || item.premiumDueDate || item.maturityDate) && (
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                        Policy Specifications & Deadlines
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {item.policyNumber && (
                          <div>
                            <span className="text-[9px] text-slate-500 font-mono uppercase block">Policy #</span>
                            <span className="font-mono font-bold text-white">{item.policyNumber}</span>
                          </div>
                        )}
                        {item.coverageAmount && (
                          <div>
                            <span className="text-[9px] text-slate-500 font-mono uppercase block">Coverage Face Amount</span>
                            <span className="font-mono font-bold text-emerald-400">{formatCurrency(item.coverageAmount)}</span>
                          </div>
                        )}
                        {item.premiumDueDate && (
                          <div>
                            <span className="text-[9px] text-slate-500 font-mono uppercase block">Premium Due Date</span>
                            <span className="font-mono font-bold text-amber-300">{item.premiumDueDate}</span>
                          </div>
                        )}
                        {item.maturityDate && (
                          <div>
                            <span className="text-[9px] text-slate-500 font-mono uppercase block">Maturity Date</span>
                            <span className="font-mono font-bold text-cyan-300">{item.maturityDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Real Estate Specific */}
                  {item.propertyAddress && (
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                        Real Property Asset Location
                      </h4>
                      <p className="text-xs font-medium text-slate-300">{item.propertyAddress}</p>
                      {item.propertyValue && (
                        <p className="text-xs font-mono text-emerald-400 font-bold">
                          Appraised Value: {formatCurrency(item.propertyValue)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Patent / IP Specific */}
                  {(item.patentAppNumber || item.patentTitle || item.patentStatus) && (
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                        Intellectual Property Dossier
                      </h4>
                      <div className="space-y-1">
                        <div><span className="text-slate-500 font-mono">App #:</span> {item.patentAppNumber || 'Pending'}</div>
                        <div><span className="text-slate-500 font-mono">Status:</span> <span className="text-amber-300 font-bold">{item.patentStatus || 'Draft'}</span></div>
                        <div><span className="text-slate-500 font-mono">Inventors:</span> {item.patentInventors || 'N/A'}</div>
                        <div><span className="text-slate-500 font-mono">Jurisdiction:</span> {item.patentJurisdiction || 'USPTO'}</div>
                      </div>
                    </div>
                  )}

                  {/* Notes & Physical Location */}
                  {(item.notes || item.locationCustodian || item.adminContext) && (
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Physical Location & Custodian Directives
                      </h4>
                      {item.locationCustodian && (
                        <p className="text-xs text-indigo-300">
                          <strong>Location / Safe:</strong> {item.locationCustodian}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                          {item.notes}
                        </p>
                      )}
                      {item.adminContext && (
                        <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg text-amber-300 text-xs">
                          <strong>Executor Confidential Advisory:</strong> {item.adminContext}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CREDENTIALS & SECRETS */}
              {activeTab === 'credentials' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Zero-Knowledge Escrow: Encrypted in local browser memory via AES-GCM 256-bit keys.</span>
                  </div>

                  {item.username && (
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-slate-500 block">Username / Login ID</span>
                        <span className="font-mono text-xs font-bold text-white">{item.username}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.username!, 'Username')}
                        className="p-1.5 text-slate-400 hover:text-white rounded"
                      >
                        {copiedField === 'Username' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {item.password && (
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-slate-500 block">Encrypted Password</span>
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {revealedFields['password'] ? item.password : '••••••••••••••••'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFieldReveal('password')}
                          className="p-1.5 text-slate-400 hover:text-white rounded"
                        >
                          {revealedFields['password'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(item.password!, 'Password')}
                          className="p-1.5 text-slate-400 hover:text-white rounded"
                        >
                          {copiedField === 'Password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Seed Phrases & Crypto Wallets */}
                  {(item.seedPhrase || item.privateKey || item.walletAddress) && (
                    <div className="p-4 bg-slate-950/60 border border-teal-500/30 rounded-xl space-y-3">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                        <Key className="w-3.5 h-3.5" />
                        Digital Wallet Secrets
                      </h4>
                      {item.walletAddress && (
                        <div className="text-xs">
                          <span className="text-[9px] font-mono text-slate-500 block">Public Wallet Address</span>
                          <span className="font-mono text-slate-300 break-all">{item.walletAddress}</span>
                        </div>
                      )}
                      {item.seedPhrase && (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Mnemonic Seed Phrase</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => toggleFieldReveal('seedPhrase')} className="p-1 text-slate-400 hover:text-white">
                                {revealedFields['seedPhrase'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => copyToClipboard(item.seedPhrase!, 'Seed Phrase')} className="p-1 text-slate-400 hover:text-white">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="font-mono text-xs text-amber-300 break-all leading-relaxed">
                            {revealedFields['seedPhrase'] ? item.seedPhrase : '•••• •••• •••• •••• •••• •••• •••• ••••'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recovery Codes */}
                  {item.recoveryCodes && (
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-400">
                        2FA Recovery Backup Codes
                      </h4>
                      <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        {item.recoveryCodes}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SUCCESSION & HEIRS */}
              {activeTab === 'succession' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5" />
                      Estate Delegation & Heirs
                    </h4>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono uppercase block">Primary Heir / Beneficiary</span>
                      <span className={cn("text-sm font-bold block mt-0.5", item.beneficiary ? "text-emerald-400" : "text-amber-400")}>
                        {item.beneficiary || 'No heir mapped. Add a beneficiary to protect this asset.'}
                      </span>
                    </div>

                    {item.trusteeNames && (
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase block">Nominated Trustees</span>
                        <span className="text-white font-medium">{item.trusteeNames}</span>
                      </div>
                    )}

                    {item.legalCounsel && (
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase block">Legal Counsel</span>
                        <span className="text-white font-medium">{item.legalCounsel} ({item.legalContact || 'No contact specified'})</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                      Access Conditions & Trigger State
                    </h4>
                    <p className="text-slate-400 leading-relaxed font-sans">
                      {item.sharingConditions || 'Default Protocol: Decryptable only by authenticated master key holder during lifetime. Transition release requires dual-key consensus or armed Dead Man Switch trigger.'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT & VERSIONS */}
              {activeTab === 'history' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" />
                      Cryptographic Ledger Timestamp
                    </h4>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono uppercase block">Last Synchronized</span>
                      <span className="font-mono text-white">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Recent Session'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono uppercase block">Encrypted ID Fingerprint</span>
                      <span className="font-mono text-slate-500 break-all text-[10px]">{item.id}</span>
                    </div>
                  </div>

                  {item.versions && item.versions.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Prior Snapshots ({item.versions.length})
                      </h4>
                      {item.versions.map((ver, idx) => (
                        <div key={idx} className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg text-xs">
                          <div className="flex justify-between text-slate-400 font-mono text-[10px] mb-1">
                            <span>{new Date(ver.timestamp).toLocaleDateString()}</span>
                            <span>{ver.editor}</span>
                          </div>
                          <p className="text-slate-300 font-sans">{ver.justification || 'Routine metadata update'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic p-3 text-center">
                      Genesis record active. No rollback versions logged yet.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onShare(item)}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Asset</span>
              </button>

              <button
                type="button"
                onClick={() => onEdit(item)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Record</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
