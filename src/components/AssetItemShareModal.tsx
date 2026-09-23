import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Share2, Mail, Shield, Lock, Check, Copy, 
  Send, Users, AlertCircle, Clock, Link as LinkIcon
} from 'lucide-react';
import { DecryptedItem, VaultConfig } from '../types';
import AssetBadge from './AssetBadge';
import { cn } from '../lib/utils';
import { updateDoc } from 'firebase/firestore';
import { db, doc } from '../lib/firebase';
import { encrypt } from '../lib/crypto';

interface AssetItemShareModalProps {
  item?: DecryptedItem | null;
  items?: DecryptedItem[]; // For bulk sharing
  isOpen: boolean;
  onClose: () => void;
  vaultId: string;
  userId: string;
  vaultConfig: VaultConfig | null;
  encryptionKey: CryptoKey;
}

export const AssetItemShareModal: React.FC<AssetItemShareModalProps> = ({
  item,
  items = [],
  isOpen,
  onClose,
  vaultId,
  userId,
  vaultConfig,
  encryptionKey
}) => {
  const targetItems = item ? [item] : items;
  const [recipientEmail, setRecipientEmail] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'immediate' | 'escrow' | 'summary'>('escrow');
  const [customNote, setCustomNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [generatedShareLink, setGeneratedShareLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || targetItems.length === 0) return null;

  const existingMembers = Array.from(
    new Set([
      ...(vaultConfig?.members || []),
      ...(vaultConfig?.ownerEmails || []),
      ...(vaultConfig?.assignedTrustees || []),
      ...(vaultConfig?.assignedLawyers || [])
    ])
  ).filter(email => email && email.includes('@'));

  const handleExecuteShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      window.dispatchEvent(new CustomEvent('app-notify', {
        detail: { message: "Please enter a valid recipient email address.", type: 'error' }
      }));
      return;
    }

    setIsLoading(true);
    try {
      // 1. Generate secure share token identifier
      const shareToken = Math.random().toString(36).substring(2, 10).toUpperCase();
      const origin = window.location.origin;
      const shareUrl = `${origin}/#share-token=${shareToken}&vault=${vaultId}`;

      // 2. Update item(s) sharing condition metadata in Firestore
      for (const target of targetItems) {
        const itemRef = doc(db, 'vaults', vaultId, 'items', target.id);
        const updatedItem: DecryptedItem = {
          ...target,
          sharingConditions: `Granted to ${recipientEmail} [${permissionLevel.toUpperCase()}]. Note: ${customNote || 'No special note'}. Token: ${shareToken}`,
          sharedTrustees: target.sharedTrustees 
            ? `${target.sharedTrustees}, ${recipientEmail}` 
            : recipientEmail
        };

        const encryptedData = await encrypt(updatedItem, encryptionKey, `${vaultId}:${target.id}`);
        await updateDoc(itemRef, {
          encryptedData,
          updatedAt: Date.now()
        });
      }

      // 3. Attempt to dispatch notification email via transactional mailer
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipientEmail,
            type: 'family_invite',
            templateData: {
              inviteeEmail: recipientEmail,
              vaultName: `${vaultConfig?.ownerEmails?.[0] || 'Estate'} Vault`,
              invitationLink: shareUrl,
              accessLevel: permissionLevel === 'immediate' ? 'Immediate Access' : 'Escrow / Succession Protected',
              customMessage: customNote || `You have been designated as a trusted steward for ${targetItems.length} asset record(s).`
            }
          })
        });
      } catch (mailErr) {
        console.warn("Mailer dispatch notice:", mailErr);
      }

      setGeneratedShareLink(shareUrl);
      setShareSuccess(true);
      window.dispatchEvent(new CustomEvent('app-notify', {
        detail: { message: `Successfully configured secure sharing for ${targetItems.length} record(s)!`, type: 'success' }
      }));
    } catch (err: any) {
      console.error("Failed to share asset:", err);
      window.dispatchEvent(new CustomEvent('app-notify', {
        detail: { message: err?.message || "Failed to update asset permissions.", type: 'error' }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const copyShareLink = () => {
    if (!generatedShareLink) return;
    navigator.clipboard.writeText(generatedShareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    window.dispatchEvent(new CustomEvent('app-notify', {
      detail: { message: "Share link copied to clipboard!", type: 'success' }
    }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overscroll-contain">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 overflow-hidden z-10 text-slate-200 max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 sm:mb-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-950/70 border border-indigo-500/30 text-indigo-400">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {targetItems.length === 1 ? `Share ${targetItems[0].name}` : `Share ${targetItems.length} Selected Assets`}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                  Controlled cryptographic sharing with designated heirs or legal counsel
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!shareSuccess ? (
            <form onSubmit={handleExecuteShare} className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {/* Asset Badge Overview */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <AssetBadge type={targetItems[0].type} variant="glow" short />
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate">
                      {targetItems.length === 1 ? targetItems[0].name : `${targetItems.length} Records Selected`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {targetItems.length === 1 ? targetItems[0].institution || 'Vault Asset' : 'Bulk Portfolio Sharing'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  Zero-Knowledge
                </span>
              </div>

              {/* Recipient Email & Quick Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Recipient Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="heir@family.com or lawyer@firm.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>

                {/* Quick Select Existing Vault Members */}
                {existingMembers.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-mono">Saved members:</span>
                    {existingMembers.map((email) => (
                      <button
                        key={email}
                        type="button"
                        onClick={() => setRecipientEmail(email)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {email}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Permission Levels */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Access & Release Trigger
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    onClick={() => setPermissionLevel('escrow')}
                    className={cn(
                      "p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all",
                      permissionLevel === 'escrow'
                        ? "bg-indigo-950/40 border-indigo-500/80 text-white"
                        : "bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-900"
                    )}
                  >
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block text-white">
                        Succession Escrow (Recommended)
                      </span>
                      <span className="text-[11px] text-slate-400 leading-normal block">
                        Record decrypts only upon bereavement event verification or Dead Man's Switch timer lapse.
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setPermissionLevel('immediate')}
                    className={cn(
                      "p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all",
                      permissionLevel === 'immediate'
                        ? "bg-indigo-950/40 border-indigo-500/80 text-white"
                        : "bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-900"
                    )}
                  >
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block text-white">
                        Immediate Co-Steward Access
                      </span>
                      <span className="text-[11px] text-slate-400 leading-normal block">
                        Full read/write decryption enabled immediately for trusted spouse or co-owner.
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setPermissionLevel('summary')}
                    className={cn(
                      "p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all",
                      permissionLevel === 'summary'
                        ? "bg-indigo-950/40 border-indigo-500/80 text-white"
                        : "bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-900"
                    )}
                  >
                    <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block text-white">
                        Redacted Metadata Only (Advisory)
                      </span>
                      <span className="text-[11px] text-slate-400 leading-normal block">
                        Financial planner can view asset presence and balances without viewing secret credentials or pins.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom Advisory Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Executor Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Please contact our estate attorney Sarah Jenkins when executing this transfer..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Encrypting &amp; Dispatching...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Share</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Success State with Copyable Link */
            <div className="space-y-4 py-3 text-center flex-1 overflow-y-auto custom-scrollbar">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Sharing Authorized</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  A cryptographic invitation has been registered for <strong>{recipientEmail}</strong>. You can also send the secure link directly:
                </p>
              </div>

              {generatedShareLink && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-indigo-300 truncate text-left">
                    {generatedShareLink}
                  </span>
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 transition-colors cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer mt-4"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
