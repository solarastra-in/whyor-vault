/**
 * Utility for parsing and calculating expiration dates, premium payments,
 * collection deadlines, and maturity dates for vault assets.
 */

export type DueEventType = 'expiration' | 'premium' | 'collection' | 'maturity';

export interface AssetDueEvent {
  type: DueEventType;
  field: string;
  label: string;
  rawDate: string;
  targetDate: Date;
  daysRemaining: number;
  isOverdue: boolean;
  isDueToday: boolean;
  isWithin30Days: boolean;
  severity: 'critical' | 'normal';
  badgeText: string;
  fullFormattedDate: string;
  urgencyRank: number; // 0 = overdue, 1 = today, 2 = <=7d, 3 = <=30d, 4 = >30d
}

export interface AssetExpirationStatus {
  hasTrackedDate: boolean;
  mostUrgentEvent: AssetDueEvent | null;
  allEvents: AssetDueEvent[];
  isWithin30Days: boolean;
  isOverdue: boolean;
  daysRemaining: number | null;
}

/**
 * Robust date parser supporting YYYY-MM-DD, MM/YY, MM/YYYY, and standard ISO formats
 */
export function parseDateString(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (
    !trimmed || 
    trimmed.toLowerCase() === 'no expiration' || 
    trimmed.toLowerCase() === 'n/a' || 
    trimmed.toLowerCase() === 'none'
  ) {
    return null;
  }

  // MM/YY or MM/YYYY (e.g., credit card expiry 12/28)
  const mmYyMatch = trimmed.match(/^(\d{1,2})\/(\d{2,4})$/);
  if (mmYyMatch) {
    const month = parseInt(mmYyMatch[1], 10);
    let year = parseInt(mmYyMatch[2], 10);
    if (year < 100) {
      year += 2000;
    }
    if (month >= 1 && month <= 12) {
      const lastDay = new Date(year, month, 0).getDate();
      return new Date(year, month - 1, lastDay, 23, 59, 59);
    }
  }

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day, 23, 59, 59);
  }

  // General fallback parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    parsed.setHours(23, 59, 59, 999);
    return parsed;
  }

  return null;
}

/**
 * Calculates calendar days remaining until target date from today (00:00:00 baseline)
 */
export function calculateDaysRemaining(targetDate: Date, referenceDate: Date = new Date()): number {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const tgt = new Date(targetDate);
  tgt.setHours(0, 0, 0, 0);

  const diffMs = tgt.getTime() - ref.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatBadgeText(type: DueEventType, days: number): string {
  const isOverdue = days < 0;
  const isToday = days === 0;
  const isTomorrow = days === 1;

  switch (type) {
    case 'premium':
      if (isOverdue) return `🚨 Premium Overdue (${Math.abs(days)}d)`;
      if (isToday) return `🚨 Premium Due Today`;
      if (isTomorrow) return `⚠️ Premium Due Tomorrow`;
      if (days <= 30) return `⚠️ Premium Due in ${days}d`;
      return `Premium in ${days}d`;

    case 'maturity':
      if (isOverdue) return `🚨 Matured (${Math.abs(days)}d ago)`;
      if (isToday) return `🚨 Matures Today`;
      if (isTomorrow) return `⚠️ Matures Tomorrow`;
      if (days <= 30) return `⚠️ Maturity in ${days}d`;
      return `Maturity in ${days}d`;

    case 'collection':
      if (isOverdue) return `🚨 Collection Overdue (${Math.abs(days)}d)`;
      if (isToday) return `🚨 Collection Due Today`;
      if (isTomorrow) return `⚠️ Collection Tomorrow`;
      if (days <= 30) return `⚠️ Collection in ${days}d`;
      return `Collection in ${days}d`;

    case 'expiration':
    default:
      if (isOverdue) return `🚨 Expired (${Math.abs(days)}d ago)`;
      if (isToday) return `🚨 Expires Today`;
      if (isTomorrow) return `⚠️ Expires Tomorrow`;
      if (days <= 30) return `⚠️ Expires in ${days}d`;
      return `Expires in ${days}d`;
  }
}

function getUrgencyRank(days: number): number {
  if (days < 0) return 0; // Overdue highest urgency
  if (days === 0) return 1; // Due today
  if (days <= 7) return 2; // Critical 7d
  if (days <= 30) return 3; // Within 30d window
  return 4; // Normal >30d
}

/**
 * Inspects any asset and computes its complete expiration, premium,
 * collection, and maturity schedule status.
 */
export function getAssetExpirationStatus(item: any, referenceDate: Date = new Date()): AssetExpirationStatus {
  if (!item || typeof item !== 'object') {
    return {
      hasTrackedDate: false,
      mostUrgentEvent: null,
      allEvents: [],
      isWithin30Days: false,
      isOverdue: false,
      daysRemaining: null
    };
  }

  const events: AssetDueEvent[] = [];

  // Check 1: Expiration Date (Documents, Insurance, Contracts, etc.)
  const expirationCandidate = item.expirationDate || (item.type === 'credit' ? item.expiry : null);
  if (expirationCandidate) {
    const parsed = parseDateString(expirationCandidate);
    if (parsed) {
      const days = calculateDaysRemaining(parsed, referenceDate);
      const isWithin30 = days <= 30;
      events.push({
        type: 'expiration',
        field: item.expirationDate ? 'expirationDate' : 'expiry',
        label: item.type === 'insurance' ? 'Policy Expiration' : 'Document Expiration',
        rawDate: expirationCandidate,
        targetDate: parsed,
        daysRemaining: days,
        isOverdue: days < 0,
        isDueToday: days === 0,
        isWithin30Days: isWithin30,
        severity: isWithin30 ? 'critical' : 'normal',
        badgeText: formatBadgeText('expiration', days),
        fullFormattedDate: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        urgencyRank: getUrgencyRank(days)
      });
    }
  }

  // Check 2: Premium Payment Due Date (Insurance, Policies, Subscriptions)
  const premiumCandidate = item.premiumDueDate || item.premiumPaymentDate;
  if (premiumCandidate) {
    const parsed = parseDateString(premiumCandidate);
    if (parsed) {
      const days = calculateDaysRemaining(parsed, referenceDate);
      const isWithin30 = days <= 30;
      events.push({
        type: 'premium',
        field: 'premiumDueDate',
        label: 'Premium Payment Due',
        rawDate: premiumCandidate,
        targetDate: parsed,
        daysRemaining: days,
        isOverdue: days < 0,
        isDueToday: days === 0,
        isWithin30Days: isWithin30,
        severity: isWithin30 ? 'critical' : 'normal',
        badgeText: formatBadgeText('premium', days),
        fullFormattedDate: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        urgencyRank: getUrgencyRank(days)
      });
    }
  }

  // Check 3: Maturity Date (Bonds, CDs, Notes, Insurance Endowments)
  const maturityCandidate = item.maturityDate;
  if (maturityCandidate) {
    const parsed = parseDateString(maturityCandidate);
    if (parsed) {
      const days = calculateDaysRemaining(parsed, referenceDate);
      const isWithin30 = days <= 30;
      events.push({
        type: 'maturity',
        field: 'maturityDate',
        label: 'Maturity Date',
        rawDate: maturityCandidate,
        targetDate: parsed,
        daysRemaining: days,
        isOverdue: days < 0,
        isDueToday: days === 0,
        isWithin30Days: isWithin30,
        severity: isWithin30 ? 'critical' : 'normal',
        badgeText: formatBadgeText('maturity', days),
        fullFormattedDate: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        urgencyRank: getUrgencyRank(days)
      });
    }
  }

  // Check 4: Collection Date (Non-Financial Physical Assets, Escrow, Custody)
  const collectionCandidate = item.collectionDate;
  if (collectionCandidate) {
    const parsed = parseDateString(collectionCandidate);
    if (parsed) {
      const days = calculateDaysRemaining(parsed, referenceDate);
      const isWithin30 = days <= 30;
      events.push({
        type: 'collection',
        field: 'collectionDate',
        label: 'Collection / Custody Due',
        rawDate: collectionCandidate,
        targetDate: parsed,
        daysRemaining: days,
        isOverdue: days < 0,
        isDueToday: days === 0,
        isWithin30Days: isWithin30,
        severity: isWithin30 ? 'critical' : 'normal',
        badgeText: formatBadgeText('collection', days),
        fullFormattedDate: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        urgencyRank: getUrgencyRank(days)
      });
    }
  }

  if (events.length === 0) {
    return {
      hasTrackedDate: false,
      mostUrgentEvent: null,
      allEvents: [],
      isWithin30Days: false,
      isOverdue: false,
      daysRemaining: null
    };
  }

  // Sort events by urgency:
  // 1. Overdue/within 30 days first (lowest days remaining)
  // 2. Otherwise earliest date
  events.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const mostUrgent = events[0];
  const hasCritical = events.some(e => e.isWithin30Days);
  const hasOverdue = events.some(e => e.isOverdue);

  return {
    hasTrackedDate: true,
    mostUrgentEvent: mostUrgent,
    allEvents: events,
    isWithin30Days: hasCritical,
    isOverdue: hasOverdue,
    daysRemaining: mostUrgent.daysRemaining
  };
}
