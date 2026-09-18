import React from 'react';
import { cn } from '../lib/utils';
import { 
  CreditCard, Landmark, Sliders, Globe, Key, Shield, ShieldCheck, 
  Archive, FileText, ClipboardList, Database, Download, Trash2, 
  Paperclip, RefreshCw, AlertOctagon, HelpCircle, Info
} from 'lucide-react';
import { Tooltip, InfoTooltip, FieldLabel } from './Tooltip';
import AssetBadge from './AssetBadge';

interface EntryModalContentProps {
  formData: any;
  setFormData: (updater: any) => void;
  uploadingAttachment: boolean;
  downloadingHash: string | null;
  handleAttachmentUpload: (file: File) => Promise<void>;
  handleAttachmentDownload: (attach: any) => Promise<void>;
  handleAttachmentDelete: (hash: string) => void;
}

export function EntryModalContent({
  formData,
  setFormData,
  uploadingAttachment,
  downloadingHash,
  handleAttachmentUpload,
  handleAttachmentDownload,
  handleAttachmentDelete
}: EntryModalContentProps) {
  
  // Custom helper to update standard form fields
  const getUrlForInstitutionAndType = (inst: string, type: string) => {
    const name = inst.toLowerCase().trim();
    if (!name) return '';
    
    if (type === 'bank' || type === 'credit') {
      if (name.includes('chase')) return 'https://www.chase.com';
      if (name.includes('america') || name.includes('bofa') || name.includes('bankofamerica')) return 'https://www.bankofamerica.com';
      if (name.includes('citi')) return 'https://www.citi.com';
      if (name.includes('wells fargo') || name.includes('wellsfargo')) return 'https://www.wellsfargo.com';
      if (name.includes('capital one') || name.includes('capitalone')) return 'https://www.capitalone.com';
      if (name.includes('express') || name.includes('amex') || name.includes('american express')) return 'https://www.americanexpress.com';
      if (name.includes('discover')) return 'https://www.discover.com';
      if (name.includes('hsbc')) return 'https://www.hsbc.com';
      if (name.includes('barclay')) return 'https://www.barclays.com';
      if (name.includes('fidelity')) return 'https://www.fidelity.com';
      if (name.includes('vanguard')) return 'https://www.vanguard.com';
      if (name.includes('schwab')) return 'https://www.schwab.com';
      if (name.includes('td bank') || name.includes('tdbank') || name === 'td') return 'https://www.td.com';
      if (name.includes('pnc')) return 'https://www.pnc.com';
      if (name.includes('us bank') || name.includes('usbank')) return 'https://www.usbank.com';
      if (name.includes('navy federal')) return 'https://www.navyfederal.org';
      if (name.includes('usaa')) return 'https://www.usaa.com';
      
      const clean = name.replace(/[^a-z0-9]/g, '');
      if (clean) {
        return `https://www.${clean}.com`;
      }
    }
    return '';
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev, [field]: value };
      if (field === 'institution' && (prev.type === 'bank' || prev.type === 'credit')) {
        // Auto-populate URL if it's empty, unset, or currently matching previous auto-population
        if (!prev.url || prev.url === '' || prev.url.startsWith('https://www.')) {
          const autoUrl = getUrlForInstitutionAndType(value, prev.type);
          if (autoUrl) {
            updated.url = autoUrl;
          }
        }
      }
      return updated;
    });
  };

  const handleBalanceChange = (valStr: string) => {
    const val = parseFloat(valStr) || 0;
    setFormData((prev: any) => {
      if (prev.type === 'realestate') {
        return { ...prev, propertyValue: val };
      } else if (prev.type === 'insurance') {
        return { ...prev, coverageAmount: val };
      } else {
        return { ...prev, currentBalance: val };
      }
    });
  };

  const getActiveBalanceValue = () => {
    if (formData.type === 'realestate') return formData.propertyValue || '';
    if (formData.type === 'insurance') return formData.coverageAmount || '';
    return formData.currentBalance || '';
  };

  // 1. Credit Card
  const renderCreditCardForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-lg flex items-start gap-3">
        <CreditCard className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Credit Card Escrow Protocol</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Record physical or virtual credit cards. PIN codes and security numbers will be encrypted locally with PBKDF2 keys.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Card Issuer / Bank</label>
          <input 
            value={formData.institution || ''}
            onChange={(e) => updateField('institution', e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-indigo-600 outline-none"
            placeholder="e.g. Chase, American Express..."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Credit Limit ($)</label>
          <input 
            value={formData.creditLimit || ''}
            onChange={(e) => updateField('creditLimit', e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-indigo-400 font-bold focus:border-indigo-600 outline-none"
            placeholder="e.g. 25,000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Credit Card Number</label>
          <input 
            value={formData.cardNumber || ''}
            onChange={(e) => updateField('cardNumber', e.target.value)}
            className="w-full bg-slate-950 border border-slate-855 rounded px-4 py-3 text-sm text-slate-100 focus:border-indigo-600 outline-none font-mono tracking-wider"
            placeholder="XXXX XXXX XXXX XXXX"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-left">Expiry</label>
            <input 
              value={formData.expiry || ''} 
              onChange={(e) => updateField('expiry', e.target.value)} 
              className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-3 text-sm text-white focus:border-indigo-600 font-mono text-center" 
              placeholder="MM/YY" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-left">CVV</label>
            <input 
              value={formData.cvv || ''} 
              onChange={(e) => updateField('cvv', e.target.value)} 
              className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-3 text-sm text-white focus:border-indigo-600 font-mono text-center" 
              placeholder="123" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-left">ATM PIN</label>
            <input 
              value={formData.cardPin || ''} 
              onChange={(e) => updateField('cardPin', e.target.value)} 
              className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-3 text-sm text-white focus:border-indigo-600 font-mono text-center" 
              placeholder="XXXX" 
            />
          </div>
        </div>
      </div>

      {/* Web Portal Integration Fields */}
      <div className="p-4 bg-slate-950 rounded border border-slate-850 space-y-4">
        <h5 className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest border-b border-indigo-950 pb-2 text-left flex items-center gap-1.5 font-sans">
          <Globe className="h-3 w-3 text-indigo-400 animate-pulse" />
          Web Portal Auto-Login Configuration
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5 text-left">Online Portal Username</label>
            <input 
              value={formData.username || ''} 
              onChange={(e) => updateField('username', e.target.value)} 
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-600"
              placeholder="e.g. MyChaseLogin"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5 text-left">Online Portal Password</label>
            <input 
              type="password"
              value={formData.password || ''} 
              onChange={(e) => updateField('password', e.target.value)} 
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono outline-none focus:border-indigo-600"
              placeholder="••••••••••••"
            />
          </div>
        </div>
        <div>
          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5 text-left font-sans">Portal Address / Sign-In URL (Auto-Populates)</label>
          <input 
            value={formData.url || ''} 
            onChange={(e) => updateField('url', e.target.value)} 
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-indigo-400 font-mono outline-none focus:border-indigo-600"
            placeholder="https://www.chase.com"
          />
        </div>
      </div>
    </div>
  );

  // 2. Bank Account
  const renderBankAccountForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-teal-950/20 border border-teal-500/20 rounded-lg flex items-start gap-3">
        <Landmark className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider font-sans">Bank Account Secure Escrow</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Configure checking, savings, or certificate accounts. Maintain routing details & associated ATM debit assets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Banking Institution Name</label>
          <input 
            value={formData.institution || ''}
            onChange={(e) => updateField('institution', e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-teal-600 outline-none"
            placeholder="e.g. Bank of America, Chase..."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Current Verified Balance ($)</label>
          <input 
            type="number"
            value={getActiveBalanceValue()}
            onChange={(e) => handleBalanceChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-teal-400 font-bold focus:border-teal-600 outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Checking/Savings Account Number</label>
          <input 
            value={formData.accountNumber || ''}
            onChange={(e) => updateField('accountNumber', e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-teal-650 outline-none font-mono"
            placeholder="Enter full account digits"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">ABA / Routing Number</label>
          <input 
            value={formData.routingNumber || ''}
            onChange={(e) => updateField('routingNumber', e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-teal-650 outline-none font-mono"
            placeholder="9-digit routing sequence"
          />
        </div>
      </div>

      <div className="p-4 bg-slate-950 rounded border border-slate-850 space-y-4">
        <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2 text-left">Associated Debit Card Escrow</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5 text-left">Debit Card Number</label>
            <input 
              value={formData.cardNumber || ''} 
              onChange={(e) => updateField('cardNumber', e.target.value)} 
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono"
              placeholder="XXXX XXXX XXXX XXXX"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5 text-left">Debit Card ATM PIN</label>
            <input 
              value={formData.cardPin || ''} 
              onChange={(e) => updateField('cardPin', e.target.value)} 
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono"
              placeholder="e.g. 4-digit code"
            />
          </div>
        </div>
      </div>

      {/* Web Portal Integration Fields */}
      <div className="p-4 bg-slate-950 rounded border border-slate-850 space-y-4">
        <h5 className="text-[9px] font-bold text-teal-400 uppercase tracking-widest border-b border-teal-950/45 pb-2 text-left flex items-center gap-1.5 font-sans">
          <Globe className="h-3 w-3 text-teal-400 animate-pulse" />
          Web Portal Auto-Login Configuration
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5 text-left font-sans">Online Banking Username</label>
            <input 
              value={formData.username || ''} 
              onChange={(e) => updateField('username', e.target.value)} 
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 outline-none focus:border-teal-600"
              placeholder="e.g. BankOfAmericaUser"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5 text-left font-sans">Online Banking Password</label>
            <input 
              type="password"
              value={formData.password || ''} 
              onChange={(e) => updateField('password', e.target.value)} 
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono outline-none focus:border-teal-600 font-sans"
              placeholder="••••••••••••"
            />
          </div>
        </div>
        <div>
          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5 text-left font-sans">Portal Address / Sign-In URL (Auto-Populates)</label>
          <input 
            value={formData.url || ''} 
            onChange={(e) => updateField('url', e.target.value)} 
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-teal-400 font-mono outline-none focus:border-teal-600"
            placeholder="https://www.bankofamerica.com"
          />
        </div>
      </div>
    </div>
  );

  // 3. Brokerage / Investment
  const renderBrokerageForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-lg flex items-start gap-3">
        <Landmark className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Brokerage & Investment Protocol</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Secure references for retirement IRA, mutual funds, or secondary trading accounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Brokerage Firm / Broker</label>
          <input 
            value={formData.institution || ''}
            onChange={(e) => updateField('institution', e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-indigo-600 outline-none"
            placeholder="e.g. Fidelity, Charles Schwab, Vanguard..."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Total Portfolio Valuation ($)</label>
          <input 
            type="number"
            value={getActiveBalanceValue()}
            onChange={(e) => handleBalanceChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-indigo-400 font-bold focus:border-indigo-600 outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Account ID / Reference String</label>
        <input 
          value={formData.accountNumber || ''}
          onChange={(e) => updateField('accountNumber', e.target.value)}
          className="w-full bg-slate-950 border border-slate-855 rounded px-4 py-3 text-sm text-white focus:border-indigo-600 outline-none font-mono"
          placeholder="e.g. F984-Z762"
        />
      </div>
    </div>
  );

  // 4. Real Estate
  const renderRealEstateForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex items-start gap-3">
        <Archive className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Real Estate & Deeds Escrow Protocol</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Record property deeds, titles, and address files. Tracks local valuation and physical records coordinates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Land Registry / County Authority</label>
          <input 
            value={formData.institution || ''}
            onChange={(e) => updateField('institution', e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-emerald-600 outline-none"
            placeholder="e.g. County Registrar, Land Registry"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Estimated Property Value ($)</label>
          <input 
            type="number"
            value={getActiveBalanceValue()}
            onChange={(e) => handleBalanceChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-emerald-400 font-bold focus:border-emerald-600 outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Property Demographics (Address)</label>
        <textarea 
          value={formData.propertyAddress || ''}
          onChange={(e) => updateField('propertyAddress', e.target.value)}
          className="w-full h-24 bg-slate-950 border border-slate-850 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-emerald-600"
          placeholder="Type full geographical parameters and coordinates..."
        />
      </div>
    </div>
  );

  // 5. Life Insurance
  const renderLifeInsuranceForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-sky-950/20 border border-sky-500/20 rounded-lg flex items-start gap-3">
        <FileText className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Life Insurance Policy Escrow</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Record life insurance coverage values, provider contacts, and policy codes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Insurance Carrier / Underwriter</label>
          <input 
            value={formData.institution || ''}
            onChange={(e) => updateField('institution', e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-sky-600 outline-none"
            placeholder="e.g. MetLife, Prudential..."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Coverage Face Value Amount ($)</label>
          <input 
            type="number"
            value={getActiveBalanceValue()}
            onChange={(e) => handleBalanceChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-sky-450 font-bold focus:border-sky-600 outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Policy Reference Number</label>
          <input 
            value={formData.policyNumber || ''}
            onChange={(e) => updateField('policyNumber', e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-sky-600 outline-none font-mono"
            placeholder="e.g. PL-983192"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Carrier Contact Details (Agent / Support Phone)</label>
          <input 
            value={formData.carrier || ''}
            onChange={(e) => updateField('carrier', e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-sky-600 outline-none"
            placeholder="e.g. agent@metlife.com or (800) 555-0192"
          />
        </div>
      </div>
    </div>
  );

  // 6. Patent Filing
  const renderPatentForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-lg flex items-start gap-3">
        <ClipboardList className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Intellectual Property &amp; Patent Protocol</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Document patent filings, claim abstracts, and application states for proprietary technical solutions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Patent/Invention Identifier</label>
          <input 
            value={formData.patentTitle || ''} 
            onChange={(e) => updateField('patentTitle', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white font-bold focus:border-amber-600 outline-none" 
            placeholder="e.g. System and Method for Secure Escrow..."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left font-sans">Drafting Patent Agent / Office</label>
          <input 
            value={formData.patentAgent || ''} 
            onChange={(e) => updateField('patentAgent', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-amber-600 outline-none" 
            placeholder="e.g. Apex Legal Group LLP"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Application or Grant Number</label>
          <input 
            value={formData.patentAppNumber || ''} 
            onChange={(e) => updateField('patentAppNumber', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white font-mono focus:border-amber-600 outline-none" 
            placeholder="e.g. US 17/983,124"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Jurisdiction (e.g. USPTO, EPO)</label>
          <input 
            value={formData.patentJurisdiction || ''} 
            onChange={(e) => updateField('patentJurisdiction', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-amber-600 outline-none" 
            placeholder="e.g. US Patent and Trademark Office"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Filing Registry Date</label>
          <input 
            type="date"
            value={formData.patentFilingDate || ''} 
            onChange={(e) => updateField('patentFilingDate', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-white font-mono focus:border-amber-600" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Current Examination Status</label>
          <select 
            value={formData.patentStatus || 'Draft'} 
            onChange={(e) => updateField('patentStatus', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-white focus:border-amber-600 outline-none"
          >
            <option value="Draft">Drafting Proposal</option>
            <option value="Filed">Filed (Awaiting Review)</option>
            <option value="Pending">Patent Pending / Examination</option>
            <option value="Published">Published Application</option>
            <option value="Granted">Granted / Issued Patent</option>
            <option value="Rejected">Withdrawn or Rejected</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Designated Inventors (Comma-separated List)</label>
        <input 
          value={formData.patentInventors || ''} 
          onChange={(e) => updateField('patentInventors', e.target.value)} 
          className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-amber-600 outline-none" 
          placeholder="e.g. WhyOr Vault, Cooper Smith"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Abstract Summary of Disclosure</label>
        <textarea 
          value={formData.patentAbstract || ''} 
          onChange={(e) => updateField('patentAbstract', e.target.value)} 
          className="w-full h-20 bg-slate-950 border border-slate-850 rounded-lg px-4 py-3 text-sm text-white focus:border-amber-600 outline-none leading-relaxed" 
          placeholder="Brief description of the dynamic technical architecture..."
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Key Patent Claims Details</label>
        <textarea 
          value={formData.patentClaims || ''} 
          onChange={(e) => updateField('patentClaims', e.target.value)} 
          className="w-full h-20 bg-slate-950 border border-slate-850 rounded-lg px-4 py-3 text-xs text-slate-300 font-mono focus:border-amber-600 outline-none leading-relaxed" 
          placeholder="e.g. 1. A cryptographic system comprising of PBKDF2 local keys..."
        />
      </div>
    </div>
  );

  // 7. Non-Financial Asset
  const renderNonFinancialForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-lg flex items-start gap-3">
        <Sliders className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider font-sans">Non-Financial Physical Asset &amp; Proofs</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Catalog safe deposit coordinates, corporate agreements, intellectual rights, or precious property locations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Asset Sub-category</label>
          <select 
            value={formData.nonFinancialType || 'Contract'} 
            onChange={(e) => updateField('nonFinancialType', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-white focus:border-cyan-600 outline-none"
          >
            <option value="Contract">Legal Contract / Agreement</option>
            <option value="Certificate">Physical Certificate / License</option>
            <option value="Asset Title">Property Title / Deed</option>
            <option value="Membership">Membership / Subscription</option>
            <option value="Intellectual Property">Intellectual Property IP</option>
            <option value="Safe Deposit">Safe Deposit Box Key / Access</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Reference Number / Code</label>
          <input 
            value={formData.identifierReference || ''} 
            onChange={(e) => updateField('identifierReference', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white font-mono focus:border-cyan-600 outline-none" 
            placeholder="e.g. Agreement ID, Key Number..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Acquisition Date</label>
          <input 
            type="date"
            value={formData.effectiveDate || ''} 
            onChange={(e) => updateField('effectiveDate', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-white font-mono focus:border-cyan-600" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left font-sans">Physical Storage / Location Custodian</label>
          <input 
            value={formData.locationCustodian || ''} 
            onChange={(e) => updateField('locationCustodian', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-cyan-600 outline-none" 
            placeholder="e.g. Safety Deposit Box B-19, Desk Drawer..."
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Key Related Parties (Comma-separated List)</label>
        <input 
          value={formData.parties || ''} 
          onChange={(e) => updateField('parties', e.target.value)} 
          className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-cyan-600 outline-none" 
          placeholder="e.g. Cooper Smith (Partner), Jane Doe (Attorney)"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Detailed Asset / Contract Specifications</label>
        <textarea 
          value={formData.assetDescription || ''} 
          onChange={(e) => updateField('assetDescription', e.target.value)} 
          className="w-full h-20 bg-slate-950 border border-slate-850 rounded-lg px-4 py-3 text-sm text-white focus:border-cyan-600 outline-none leading-relaxed" 
          placeholder="Terms, physical states, or emergency retrieving directives..."
        />
      </div>
    </div>
  );

  // 8. Wills, Trusts & Estates
  const renderWillTrustForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-yellow-950/20 border border-yellow-500/20 rounded-lg flex items-start gap-3">
        <FileText className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Wills, Trusts &amp; Testamentary Estates Escrow</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Configure estate plans, living heirs assignments, power of attorney documents, and medical releases.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Law Counsel / Drafting Firm Name</label>
          <input 
            value={formData.legalCounsel || ''} 
            onChange={(e) => updateField('legalCounsel', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-yellow-600 outline-none" 
            placeholder="e.g. Liberty Planning Lawyers LLP"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Signature execution date</label>
          <input 
            type="date"
            value={formData.executionDate || ''} 
            onChange={(e) => updateField('executionDate', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-white font-mono focus:border-yellow-600" 
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Drafting Counsel Contact Details (Email / Phone)</label>
        <input 
          value={formData.legalContact || ''} 
          onChange={(e) => updateField('legalContact', e.target.value)} 
          className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-yellow-600 outline-none" 
          placeholder="e.g. executor@libertylaw.com or (555) 019-9831"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left font-sans">Designated Co-Executors &amp; Successor Trustees names</label>
        <input 
          value={formData.trusteeNames || ''} 
          onChange={(e) => updateField('trusteeNames', e.target.value)} 
          className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-yellow-600 outline-none" 
          placeholder="e.g. Uncle Arthur (arthur@co-exec.org), Sarah Smith"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Key Testamentary Directives / Guardianship parameters</label>
        <textarea 
          value={formData.directives || ''} 
          onChange={(e) => updateField('directives', e.target.value)} 
          className="w-full h-24 bg-slate-950 border border-slate-855 rounded-lg px-4 py-3 text-sm text-white focus:border-yellow-600 outline-none leading-relaxed" 
          placeholder="Summarize asset dividing ratios, healthcare release directives, or physical copy retrieval instructions..."
        />
      </div>
    </div>
  );

  // 9. Official Documentation
  const renderDocumentationForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-lg flex items-start gap-3">
        <Archive className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Official Document Scan Escrow</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Audit identity passports, driver licencing scans, tax filings, or company LLC incorporation structures.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Official Document Category</label>
          <select 
            value={formData.docCategory || 'Identity Identification'} 
            onChange={(e) => updateField('docCategory', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-white focus:border-purple-600 outline-none"
          >
            <option value="Identity Identification">Identity (Passport, Driver, SSN)</option>
            <option value="Emergency Medical">Emergency Medical / Health Proxy</option>
            <option value="Tax Financial">Tax &amp; Audit Financial Statement</option>
            <option value="Deed Title">Deed / Land Registry Protocol</option>
            <option value="Corporate LLC">Corporate Registry / Cap Table</option>
            <option value="Proof Verification">Proof Verification / Escrow Scan</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Issuing Authority / State Agency</label>
          <input 
            value={formData.issuingAuthority || ''} 
            onChange={(e) => updateField('issuingAuthority', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-purple-600 outline-none" 
            placeholder="e.g. US State Department, IRS, DMV"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Issue Date</label>
          <input 
            type="date"
            value={formData.issueDate || ''} 
            onChange={(e) => updateField('issueDate', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-white font-mono focus:border-purple-600" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left font-sans">Expiration Validity Date (Optional)</label>
          <input 
            type="date"
            value={formData.expirationDate || ''} 
            onChange={(e) => updateField('expirationDate', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-white font-mono focus:border-purple-600" 
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Document Reference / Folio Serial Number</label>
        <input 
          value={formData.docRefNumber || ''} 
          onChange={(e) => updateField('docRefNumber', e.target.value)} 
          className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-purple-600 outline-none font-mono" 
          placeholder="e.g. Passport details, Registration Vol/Folio #..."
        />
      </div>
    </div>
  );

  // 10. Crypto Keys
  const renderCryptoForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-yellow-950/20 border border-yellow-500/20 rounded-lg flex items-start gap-3">
        <Database className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Cryptographic Blockchain Keys Escrow</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Backup seed phrases, raw private keys, and hardware derivations securely in an isolated PBKDF2 local partition.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Wallet Interface Location</label>
          <select 
            value={formData.cryptoType || 'hardware_ledger'} 
            onChange={(e) => updateField('cryptoType', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-white focus:border-yellow-650 outline-none"
          >
            <option value="hardware_ledger">Ledger Physical Hardware Wallet</option>
            <option value="hardware_trezor">Trezor Physical Hardware Wallet</option>
            <option value="hot_wallet">Browser Extension Wallet (MetaMask, Phantom)</option>
            <option value="cold_slate">Metal Seed Slate / Backplate</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Primary Blockchain Network</label>
          <input 
            value={formData.blockchain || 'BTC'} 
            onChange={(e) => updateField('blockchain', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-yellow-650 outline-none" 
            placeholder="e.g. Bitcoin, Ethereum, Solana..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left font-mono">Public Wallet Coordinates Address</label>
          <input 
            value={formData.walletAddress || ''} 
            onChange={(e) => updateField('walletAddress', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-yellow-650 outline-none font-mono" 
            placeholder="Public address identifier..."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Default Derivation Path</label>
          <input 
            value={formData.derivationPath || "m/44'/0'/0'/0/0"} 
            onChange={(e) => updateField('derivationPath', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-yellow-650 outline-none font-mono" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left flex items-center gap-1.5"><Key className="h-3 w-3 text-yellow-500 animate-pulse" /> 12/24 Word Seed Phrase — HIGH SECURITY</label>
          <textarea 
            value={formData.seedPhrase || ''} 
            onChange={(e) => updateField('seedPhrase', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-xs text-white outline-none focus:border-yellow-650 font-mono h-20 leading-relaxed" 
            placeholder="Type your secure seed sequence sequentially..."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left flex items-center gap-1.5"><Shield className="h-3 w-3 text-yellow-500 animate-pulse" /> Raw Wallet Private Key (Hex / Base58) — HIGH SECURITY</label>
          <textarea 
            value={formData.privateKey || ''} 
            onChange={(e) => updateField('privateKey', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-xs text-white outline-none focus:border-yellow-650 font-mono h-20 leading-relaxed" 
            placeholder="Type raw private key hex string..."
          />
        </div>
      </div>
    </div>
  );

  // 11. Hardware keys
  const renderHardwareRecoveryForm = () => (
    <div className="space-y-6 animate-fade-in p_recovery_details">
      <div className="p-4 bg-pink-950/25 border border-pink-500/20 rounded-lg flex items-start gap-3">
        <ClipboardList className="h-5 w-5 text-pink-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">MFA Security Recovery &amp; Hardware Tokens</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Secure Yubikeys setup details, Bitlocker key strings, emergency recovery contacts, or website backup codes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Hardware Key Category</label>
          <select 
            value={formData.recoveryType || 'yubikey'} 
            onChange={(e) => updateField('recoveryType', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-white focus:border-pink-600 outline-none"
          >
            <option value="yubikey">YubiKey physical hardware MFA FIDO2</option>
            <option value="apple_id">Apple Account Recovery Contact Key</option>
            <option value="google_2fa">Google Authenticator Multi-Device Backup</option>
            <option value="bitlocker">BitLocker Hard-Drive Encryption Code</option>
            <option value="other">General Website Security Backup Codes</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left font-mono">Unique Key serial Identifier</label>
          <input 
            value={formData.recoveryIdentifier || ''} 
            onChange={(e) => updateField('recoveryIdentifier', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-pink-600 outline-none font-mono" 
            placeholder="e.g. Serial #SF942B5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left font-sans">Setup Pin Code / Setup Password</label>
          <input 
            value={formData.recoveryPin || ''} 
            onChange={(e) => updateField('recoveryPin', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-pink-650 outline-none font-mono" 
            placeholder="Yubikey PIN or setup passcode..."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Rescue Lockout Backup Codes — HIGH SECURITY</label>
          <textarea 
            value={formData.recoveryCodes || ''} 
            onChange={(e) => updateField('recoveryCodes', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-xs text-white focus:border-pink-650 outline-none font-mono h-20" 
            placeholder="Type website bypass emergency rescue codes..."
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Location and Recovery Instructions</label>
        <textarea 
          value={formData.recoveryInstructions || ''} 
          onChange={(e) => updateField('recoveryInstructions', e.target.value)} 
          className="w-full h-20 bg-slate-950 border border-slate-850 rounded-lg px-4 py-3 text-sm text-white focus:border-pink-605 outline-none" 
          placeholder="e.g., Kept physical key in safety box #2B or with primary successor..."
        />
      </div>
    </div>
  );

  // 12. Other / Fallback
  const renderOtherAssetForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Custom Asset Escrow</h4>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            Record other categories of secure assets, private data credentials, or keys.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Institution / Issuer Name</label>
          <input 
            value={formData.institution || ''}
            onChange={(e) => updateField('institution', e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-white focus:border-indigo-600 outline-none"
            placeholder="e.g. Other Registry..."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Estimated Asset Value ($)</label>
          <input 
            type="number"
            value={getActiveBalanceValue()}
            onChange={(e) => handleBalanceChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-3 text-sm text-indigo-400 font-bold focus:border-indigo-505 outline-none"
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Global Asset Selector framework bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-800/60">
        <div>
          <div className="flex items-center justify-between mb-1">
            <FieldLabel 
              label="Asset Category" 
              required 
              tooltip="Select the classification of the item. This establishes the specialized schema fields and custom cryptographic metadata."
              tooltipTitle="Asset Classification"
              description="Defines field structure and emergency handling protocols"
            />
            <AssetBadge type={formData.type} variant="pill" />
          </div>
          <select 
            value={formData.type}
            onChange={(e) => updateField('type', e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-indigo-400 font-extrabold focus:border-indigo-650 outline-none cursor-pointer"
          >
            <option value="credit">Credit Card</option>
            <option value="bank">Bank Account</option>
            <option value="brokerage">Brokerage / Investment</option>
            <option value="realestate">Real Estate</option>
            <option value="insurance">Life Insurance</option>
            <option value="patent">Patent Filing</option>
            <option value="non_financial">Non-Financial Asset &amp; Proofs</option>
            <option value="will_trust">Wills, Trusts &amp; Estates</option>
            <option value="documentation">Official Documentation &amp; Scans</option>
            <option value="crypto">Cryptocurrency Asset &amp; Keys</option>
            <option value="hardware_recovery">Security &amp; Hardware Recovery Keys</option>
            <option value="other">Other Asset</option>
          </select>
        </div>
        <div>
          <FieldLabel 
            label="Record Identifier (Name)" 
            required 
            tooltip="A recognizable title for this asset record. Displayed in your vault dashboard list."
            tooltipTitle="Record Title"
            description="Clear, memorable name for easy search and categorization"
          />
          <input 
            value={formData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-sm text-white focus:border-indigo-600 outline-none placeholder:text-slate-700"
            placeholder="e.g. Chase Sapphire, Retirement IRA..."
          />
        </div>
      </div>

      {/* 2. Custom Render Form Body based on designated type */}
      <div className="py-4 font-sans">
        {formData.type === 'credit' && renderCreditCardForm()}
        {formData.type === 'bank' && renderBankAccountForm()}
        {formData.type === 'brokerage' && renderBrokerageForm()}
        {formData.type === 'realestate' && renderRealEstateForm()}
        {formData.type === 'insurance' && renderLifeInsuranceForm()}
        {formData.type === 'patent' && renderPatentForm()}
        {formData.type === 'non_financial' && renderNonFinancialForm()}
        {formData.type === 'will_trust' && renderWillTrustForm()}
        {formData.type === 'documentation' && renderDocumentationForm()}
        {formData.type === 'crypto' && renderCryptoForm()}
        {formData.type === 'hardware_recovery' && renderHardwareRecoveryForm()}
        {formData.type === 'other' && renderOtherAssetForm()}
      </div>

      {/* 3. Common Legal Structuring & Access Enclave parameters */}
      <div className="p-6 bg-slate-955/40 border border-slate-850 rounded-xl space-y-6">
        <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-2 text-left flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-indigo-400" /> Ownership, Trust &amp; Sharing Escrow</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <FieldLabel 
              label="Primary Owner's Legal Name" 
              tooltip="The full legal name as it appears on government documents or account statements."
              tooltipTitle="Legal Titleholder"
              description="Official account holder name"
            />
            <input 
              value={formData.ownershipName || ''}
              onChange={(e) => updateField('ownershipName', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-4 py-2.5 text-xs text-white focus:border-indigo-600 outline-none font-medium"
              placeholder="Full Legal Name"
            />
          </div>
          <div>
            <FieldLabel 
              label="Legal Ownership Entity" 
              tooltip="Whether the asset is held by you individually, jointly with a spouse/partner, inside a revocable living trust, or by an LLC."
              tooltipTitle="Ownership Structure"
              description="Legal entity governing asset transfer"
            />
            <select 
              value={formData.ownershipType || 'Individual'}
              onChange={(e) => updateField('ownershipType', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-4 py-2.5 text-xs text-white focus:border-indigo-600 outline-none cursor-pointer"
            >
              <option value="Individual">Individual</option>
              <option value="Joint">Joint Account / Partnership</option>
              <option value="LLC">LLC Incorporation</option>
              <option value="Trust">Trust Entity</option>
              <option value="IRA">IRA (Roth/Traditional)</option>
              <option value="Other">Other Entity</option>
            </select>
          </div>
          <div>
            <FieldLabel 
              label="Heir Security Partition" 
              tooltip="Cryptographic compartment: 'Personal' remains sealed only for you. 'Wills & Trust' allows designated successor decrypt access upon verified proof."
              tooltipTitle="Cryptographic Partition"
              description="Controls zero-knowledge sub-key isolation"
            />
            <select 
              value={formData.partition || 'Personal'}
              onChange={(e) => updateField('partition', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-4 py-2.5 text-xs text-indigo-400 font-bold focus:border-indigo-505 outline-none cursor-pointer"
            >
              <option value="Personal">Personal (Owner Lock)</option>
              <option value="Family Joint">Family Joint Accounts</option>
              <option value="Wills & Trust">Wills &amp; Trust (Successor Accessible)</option>
              <option value="B2B Corporate">B2B Corporate</option>
            </select>
          </div>
        </div>

        <div>
          <FieldLabel 
            label="Designated Death / Emergency Beneficiary" 
            tooltip="Name and relationship of the individual or trustee designated to receive or administer this specific asset."
            tooltipTitle="Succession Beneficiary"
            description="Primary contact for inheritance distribution"
          />
          <input 
            value={formData.beneficiary || ''}
            onChange={(e) => updateField('beneficiary', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded px-4 py-2.5 text-xs text-white focus:border-indigo-600 outline-none"
            placeholder="Name of primary beneficiary"
          />
        </div>

        <div className="border-t border-slate-850 pt-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
            <AlertOctagon className="h-4 w-4 text-purple-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Special Release Directives &amp; Life Triggers</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-left">Lawyer/Counsel Trustee Security Email(s)</label>
              <input 
                value={formData.sharedLawyers || ''}
                onChange={(e) => updateField('sharedLawyers', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-indigo-200 focus:border-indigo-600 outline-none"
                placeholder="e.g. counsel@estatefirm.org"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-left">Designated Successor Family Email(s)</label>
              <input 
                value={formData.sharedTrustees || ''}
                onChange={(e) => updateField('sharedTrustees', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-indigo-200 focus:border-indigo-600 outline-none"
                placeholder="e.g. spouse@gmail.com, bob@heirs.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-left font-sans">Verification Condition to Trigger Successor release</label>
            <input 
              value={formData.sharingConditions || ''}
              onChange={(e) => updateField('sharingConditions', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:border-indigo-600 outline-none"
              placeholder="e.g. Release only upon confirmed physically reported passing; keep secure under active escrow"
            />
          </div>
        </div>
      </div>
    </>
  );
}
