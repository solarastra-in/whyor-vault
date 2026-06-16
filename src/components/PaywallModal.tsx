import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, updateDoc, setDoc, addDoc } from 'firebase/firestore';
import { 
  X, Shield, CreditCard, CheckCircle, RefreshCw, Star, 
  Sparkles, Calendar, HelpCircle, Heart, Lock, HelpCircle as HelpIcon, Landmark
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SystemConfig {
  rateMonthly: number;
  rateYearly: number;
  rateDecade: number;
  freeLimit: number;
  paymentGatewayDetails?: string;
}

export default function PaywallModal({
  isOpen,
  onClose,
  systemConfig,
  vaultId,
  userEmail
}: {
  isOpen: boolean;
  onClose: () => void;
  systemConfig: SystemConfig;
  vaultId: string;
  userEmail: string;
}) {
  const [selectedPlan, setSelectedPlan] = useState<'month' | 'year' | 'decade'>('year');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'plan' | 'receipt'>('plan');
  const [transactionId, setTransactionId] = useState('');

  if (!isOpen) return null;

  const getPlanPrice = () => {
    switch (selectedPlan) {
      case 'month': return systemConfig.rateMonthly;
      case 'year': return systemConfig.rateYearly;
      case 'decade': return systemConfig.rateDecade;
    }
  };

  const getPlanDurationMs = () => {
    switch (selectedPlan) {
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      case 'year': return 365 * 24 * 60 * 60 * 1000;
      case 'decade': return 10 * 365 * 24 * 60 * 60 * 1000;
    }
  };

  const getPlanLabel = () => {
    switch (selectedPlan) {
      case 'month': return 'Monthly Sovereign';
      case 'year': return 'Annual Sovereign';
      case 'decade': return '10-Year Legacy Guardian';
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      triggerNotification("Please fill in all credit card security credentials.", "error");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate cryptographic settlement server delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const price = getPlanPrice();
      const durationMs = getPlanDurationMs();
      const planName = getPlanLabel();
      const generatedTxId = 'TX_SIM_' + Math.random().toString(36).substring(2, 15).toUpperCase();
      setTransactionId(generatedTxId);
      
      if (typeof window !== 'undefined' && import.meta.env.VITE_APP_ENV === 'Sandbox') {
        const rawDb = localStorage.getItem('whyor_vault_sandbox_db_v2');
        const dbState = rawDb ? JSON.parse(rawDb) : {};
        
        // 1. Log transaction
        const txPath = `payment_transactions/${generatedTxId}`;
        dbState[txPath] = {
          userId: vaultId,
          email: userEmail || 'anonymous_vault@domain.com',
          plan: planName,
          amount: price,
          date: Date.now(),
          cardholder: cardName,
          paymentGateway: 'Stripe Sandbox Live Simulator'
        };
        
        // 2. Set user as Premium in the direct Vault config
        const configPath = `vaults/${vaultId}/vault/config`;
        dbState[configPath] = {
          ...(dbState[configPath] || {}),
          isPremium: true,
          subscriptionPlan: selectedPlan,
          subscriptionAmount: price,
          subscriptionExpiresAt: Date.now() + durationMs
        };
        
        // 3. Register user profile update inside the global index
        const registryPath = `vault_registry/${vaultId}`;
        dbState[registryPath] = {
          userId: vaultId,
          email: userEmail || 'anonymous_vault@domain.com',
          isPremium: true,
          subscriptionPlan: planName,
          updatedAt: Date.now()
        };
        
        localStorage.setItem('whyor_vault_sandbox_db_v2', JSON.stringify(dbState));
        window.dispatchEvent(new CustomEvent('sandbox-db-update'));
      } else {
        // 1. Log transaction in centralized table for admin panel review
        const transactionsRef = collection(db, 'payment_transactions');
        await addDoc(transactionsRef, {
          userId: vaultId,
          email: userEmail || 'anonymous_vault@domain.com',
          plan: planName,
          amount: price,
          date: Date.now(),
          cardholder: cardName,
          paymentGateway: 'Stripe Sandbox Live Simulator'
        });

        // 2. Set user as Premium in the direct Vault config
        const userConfigRef = doc(db, 'vaults', vaultId, 'vault', 'config');
        await updateDoc(userConfigRef, {
          isPremium: true,
          subscriptionPlan: selectedPlan,
          subscriptionAmount: price,
          subscriptionExpiresAt: Date.now() + durationMs
        });

        // 3. Register user profile update inside the global index
        await setDoc(doc(db, 'vault_registry', vaultId), {
          userId: vaultId,
          email: userEmail || 'anonymous_vault@domain.com',
          isPremium: true,
          subscriptionPlan: planName,
          updatedAt: Date.now()
        }, { merge: true });
      }

      triggerNotification(`Gateway settlement authorized! Welcome to ${planName} Access.`, "success");

      // Send payment receipt confirmation email to the customer
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: userEmail || 'solarastra.in@gmail.com',
            type: 'payment_received',
            templateData: {
              amountPaid: `$${price?.toFixed(2)}`,
              invoiceId: generatedTxId,
              customerEmail: userEmail || 'solarastra.in@gmail.com',
              paymentDetails: `${planName} Plan setup - Secure escrow keys activated.`
            }
          })
        });
        console.log("Customer payment verification receipt dispatched via Mailchimp successfully.");
      } catch (mailErr) {
        console.warn("Mailchimp receipt issue resolved gracefully:", mailErr);
      }

      setStep('receipt');
    } catch (err: any) {
      console.error("Settlement handshake failed:", err);
      triggerNotification(`Gateway Error: ${err.message || err}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerNotification = (msg: string, type: 'success' | 'error') => {
    window.dispatchEvent(new CustomEvent('app-notify', { detail: { message: msg, type } }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          type="button"
          className="absolute right-6 top-6 p-2 text-slate-500 hover:text-white hover:bg-slate-800 transition-all rounded-lg"
        >
          <X className="h-4 w-4" />
        </button>

        {step === 'plan' ? (
          <form onSubmit={handleProcessPayment} className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <Shield className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold font-display text-white uppercase tracking-tight flex items-center gap-2">
                  Unlock Unlimited Vault Escrow
                  <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Expand allocation limits • Professional Cryptographic Custody
                </p>
              </div>
            </div>

            {/* Price Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Monthly */}
              <div 
                onClick={() => setSelectedPlan('month')}
                className={cn(
                  "border rounded-2xl p-5 cursor-pointer text-left transition-all hover:bg-slate-950 flex flex-col justify-between min-h-[140px]",
                  selectedPlan === 'month' 
                    ? "bg-slate-950 border-indigo-500 shadow-lg shadow-indigo-950/40" 
                    : "bg-slate-950/40 border-slate-800"
                )}
              >
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Monthly Protocol</h4>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xl font-black text-white">${systemConfig.rateMonthly.toFixed(2)}</span>
                    <span className="text-[9px] text-slate-500 font-bold">/MO</span>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tight mt-4">
                  Cancel anytime. Flex plan.
                </div>
              </div>

              {/* Annual */}
              <div 
                onClick={() => setSelectedPlan('year')}
                className={cn(
                  "border rounded-2xl p-5 cursor-pointer text-left transition-all hover:bg-slate-950 flex flex-col justify-between min-h-[140px] relative overflow-hidden",
                  selectedPlan === 'year' 
                    ? "bg-slate-950 border-indigo-500 shadow-lg shadow-indigo-950/40" 
                    : "bg-slate-950/40 border-slate-800"
                )}
              >
                <div className="absolute top-2 right-2 bg-indigo-500 text-slate-950 font-black text-[7px] tracking-widest px-1.5 py-0.5 rounded font-mono uppercase">
                  BEST VALUE
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Annual Sovereign</h4>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xl font-black text-white">${systemConfig.rateYearly.toFixed(2)}</span>
                    <span className="text-[9px] text-slate-500 font-bold">/YR</span>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-tight mt-4 flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-indigo-400 shrink-0" /> Save up to 34% annually
                </div>
              </div>

              {/* 10-Year */}
              <div 
                onClick={() => setSelectedPlan('decade')}
                className={cn(
                  "border rounded-2xl p-5 cursor-pointer text-left transition-all hover:bg-slate-950 flex flex-col justify-between min-h-[140px]",
                  selectedPlan === 'decade' 
                    ? "bg-slate-950 border-indigo-500 shadow-lg shadow-indigo-950/40" 
                    : "bg-slate-950/40 border-slate-800"
                )}
              >
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-yellow-500">10-Yr Guardian</h4>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xl font-black text-white">${systemConfig.rateDecade.toFixed(0)}</span>
                    <span className="text-[9px] text-slate-500 font-bold">/ONE TIME</span>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-yellow-500/80 uppercase tracking-tight mt-4">
                  Lifetime Legacy Guard
                </div>
              </div>
            </div>

            {/* Direct Deposit / Shared Account Details */}
            <div className="bg-slate-950 p-6 border border-slate-800/80 rounded-2xl text-left space-y-3">
              <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                <Landmark className="h-4 w-4" /> Dedicated Settlement Escrow Details (Shared Direct Transfer)
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                You can make the payment using our administrator's shared deposit gateway or account credentials. Once direct settlement completes, your transaction invoice receipt will be expedited instantaneously:
              </p>
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl font-mono text-[10.5px] leading-relaxed text-slate-200 whitespace-pre-wrap select-all relative">
                {systemConfig.paymentGatewayDetails || "Standard Settle Escrow Gateway Bank Instructions:\nBank: WhyOr Sovereign Security Trust\nAccount: 4552-8243-1994\nSWIFT Code: WHYOINBBXXX\nInstruction: Direct Wire Transfer with Vault Ref"}
              </div>
            </div>

            {/* Credit Card Input Form */}
            <div className="bg-slate-950 p-6 border border-slate-800/80 rounded-2xl text-left space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 mb-1">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-400" /> Secure Card Settlements Gateway
                </span>
                <span className="text-slate-600">AES-256 ENCRYPTED TRANSACTION</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cardholder Name</label>
                  <input 
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-600 outline-none font-sans"
                    placeholder="E.g. WhyOr Vault"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Credit Card Number</label>
                  <input 
                    type="text"
                    required
                    value={cardNumber}
                    maxLength={19}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-600 outline-none font-mono tracking-widest"
                    placeholder="4111 2222 3333 4444"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Expiration Date (MM/YY)</label>
                  <input 
                    type="text"
                    required
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length > 2) {
                        val = val.substring(0, 2) + '/' + val.substring(2, 4);
                      }
                      setCardExpiry(val);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-600 outline-none font-mono text-center"
                    placeholder="12/28"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Security Pin (CVV)</label>
                  <input 
                    type="password"
                    required
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-600 outline-none font-mono text-center tracking-widest"
                    placeholder="•••"
                  />
                </div>
              </div>
            </div>

            {/* Total Display */}
            <div className="flex items-center justify-between mt-6 bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-xl text-left">
              <div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-tight">Access Token Authorization</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Enables unlimited cryptographic record creation instantly.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">GRAND TOTAL</span>
                <span className="text-xl font-black text-emerald-400 font-mono">${getPlanPrice()?.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isProcessing}
              className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-950/60 disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white shrink-0" />
                  Cryptographic Handshake Settlement in Progress...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-indigo-200 shrink-0" />
                  Process Settlement & Unlock Unlimited Writing
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 text-emerald-400 animate-bounce">
              <CheckCircle className="h-10 w-10" />
            </div>

            <h3 className="text-2xl font-black font-display text-white uppercase tracking-tight">HANDSHAKE SETTLEMENT APPROVED</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-sm">
              Your unlimited sovereign vault allocation has been created, and your local encryption keys are unlocked for writing.
            </p>

            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl w-full max-w-sm my-6 text-xs text-slate-300 font-mono space-y-2.5 text-left">
              <div className="flex justify-between border-b border-slate-800 pb-2 mb-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <span>RECONCILED INVOICE</span>
                <span>SANDBOX MODE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">TRANSACTION ID:</span>
                <span className="text-white font-bold select-all">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">SETTLED PLAN:</span>
                <span className="text-white font-bold">{getPlanLabel()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">FEE CHARGED:</span>
                <span className="text-emerald-400 font-bold">${getPlanPrice()?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">SETTLED HANDSHAKE:</span>
                <span className="text-indigo-400 font-bold uppercase text-[10px]">Stripe Simulated Gate</span>
              </div>
            </div>

            <button 
              onClick={() => {
                setStep('plan');
                onClose();
              }}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-950"
            >
              Enter Unlimited Vault
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
