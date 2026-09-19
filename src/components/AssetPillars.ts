import React from 'react';
import { 
  Building2, Landmark, CreditCard, TrendingUp, ShieldCheck, 
  Lightbulb, FolderOpen, Coins, Cpu, Archive, FileText, 
  AlertOctagon, KeySquare, Layers
} from 'lucide-react';
import { DecryptedItem } from '../types';
import { getAssetExpirationStatus } from '../utils/expirationAlerts';

export interface EstatePillar {
  id: string;
  name: string;
  description: string;
  types: string[];
  icon: React.ComponentType<{ className?: string }>;
  colorGradient: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  dotColor: string;
}

export const ESTATE_PILLARS: EstatePillar[] = [
  {
    id: 'financial',
    name: 'Financial Accounts',
    description: 'Liquid cash, depository accounts, credit lines, and investment portfolios',
    types: ['bank', 'credit', 'brokerage'],
    icon: Landmark,
    colorGradient: 'from-blue-600/20 to-indigo-600/20',
    badgeBg: 'bg-blue-950/60',
    badgeText: 'text-blue-300',
    borderAccent: 'border-blue-500/30',
    dotColor: 'bg-blue-400'
  },
  {
    id: 'properties',
    name: 'Real Estate & Properties',
    description: 'Real property, residential homes, land holdings, and physical valuables',
    types: ['realestate', 'non_financial'],
    icon: Building2,
    colorGradient: 'from-emerald-600/20 to-teal-600/20',
    badgeBg: 'bg-emerald-950/60',
    badgeText: 'text-emerald-300',
    borderAccent: 'border-emerald-500/30',
    dotColor: 'bg-emerald-400'
  },
  {
    id: 'protection',
    name: 'Insurance & Policies',
    description: 'Life insurance coverage, term policies, annuities, and policy protections',
    types: ['insurance'],
    icon: ShieldCheck,
    colorGradient: 'from-cyan-600/20 to-sky-600/20',
    badgeBg: 'bg-cyan-950/60',
    badgeText: 'text-cyan-300',
    borderAccent: 'border-cyan-500/30',
    dotColor: 'bg-cyan-400'
  },
  {
    id: 'legal',
    name: 'Wills, Trusts & Succession',
    description: 'Testamentary wills, living trusts, power of attorney, and legal directives',
    types: ['will_trust'],
    icon: FolderOpen,
    colorGradient: 'from-purple-600/20 to-indigo-600/20',
    badgeBg: 'bg-purple-950/60',
    badgeText: 'text-purple-300',
    borderAccent: 'border-purple-500/30',
    dotColor: 'bg-purple-400'
  },
  {
    id: 'business',
    name: 'Intellectual Property',
    description: 'Patent filings, intellectual property, claims, inventors, and agents',
    types: ['patent'],
    icon: Lightbulb,
    colorGradient: 'from-amber-600/20 to-orange-600/20',
    badgeBg: 'bg-amber-950/60',
    badgeText: 'text-amber-300',
    borderAccent: 'border-amber-500/30',
    dotColor: 'bg-amber-400'
  },
  {
    id: 'digital',
    name: 'Digital Assets & Keys',
    description: 'Crypto wallets, hardware tokens, recovery seed strings, and vital records',
    types: ['crypto', 'hardware_recovery', 'documentation', 'other'],
    icon: Coins,
    colorGradient: 'from-teal-600/20 to-pink-600/20',
    badgeBg: 'bg-teal-950/60',
    badgeText: 'text-teal-300',
    borderAccent: 'border-teal-500/30',
    dotColor: 'bg-teal-400'
  }
];

export function getPillarForType(type: string): EstatePillar {
  return ESTATE_PILLARS.find(p => p.types.includes(type)) || ESTATE_PILLARS[ESTATE_PILLARS.length - 1];
}

/**
 * Extracts estimated monetary value for an item
 */
export function getItemMonetaryValue(item: DecryptedItem): number {
  if (typeof item.currentBalance === 'number' && !isNaN(item.currentBalance)) {
    return item.currentBalance;
  }
  if (typeof item.propertyValue === 'number' && !isNaN(item.propertyValue)) {
    return item.propertyValue;
  }
  if (typeof item.coverageAmount === 'number' && !isNaN(item.coverageAmount)) {
    return item.coverageAmount;
  }
  if (item.creditLimit) {
    const parsed = parseFloat(String(item.creditLimit).replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

export interface EstateAggregates {
  totalAssetsCount: number;
  totalTrackedValue: number;
  totalInsuranceCoverage: number;
  assetsWithBeneficiaryCount: number;
  beneficiaryCoveragePercent: number;
  urgentAlertsCount: number;
  missingBeneficiaryCount: number;
  hasCriticalAlerts: boolean;
}

export function calculateEstateAggregates(items: DecryptedItem[]): EstateAggregates {
  let totalTrackedValue = 0;
  let totalInsuranceCoverage = 0;
  let assetsWithBeneficiaryCount = 0;
  let urgentAlertsCount = 0;
  let missingBeneficiaryCount = 0;

  const validItems = items.filter(i => i.type !== 'life_event');

  for (const item of validItems) {
    // Value accumulation
    if (typeof item.propertyValue === 'number') {
      totalTrackedValue += item.propertyValue;
    } else if (typeof item.currentBalance === 'number') {
      totalTrackedValue += item.currentBalance;
    }

    if (typeof item.coverageAmount === 'number') {
      totalInsuranceCoverage += item.coverageAmount;
    }

    // Beneficiary tracking
    if (item.beneficiary && item.beneficiary.trim().length > 0) {
      assetsWithBeneficiaryCount++;
    } else {
      // Certain asset types crucially require beneficiary (bank, brokerage, insurance, will, realestate)
      if (['bank', 'brokerage', 'insurance', 'realestate', 'will_trust'].includes(item.type)) {
        missingBeneficiaryCount++;
      }
    }

    // Expiration urgency
    const expStatus = getAssetExpirationStatus(item);
    if (expStatus.isWithin30Days) {
      urgentAlertsCount++;
    }
  }

  const beneficiaryCoveragePercent = validItems.length > 0 
    ? Math.round((assetsWithBeneficiaryCount / validItems.length) * 100) 
    : 0;

  return {
    totalAssetsCount: validItems.length,
    totalTrackedValue,
    totalInsuranceCoverage,
    assetsWithBeneficiaryCount,
    beneficiaryCoveragePercent,
    urgentAlertsCount,
    missingBeneficiaryCount,
    hasCriticalAlerts: urgentAlertsCount > 0
  };
}
