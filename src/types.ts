export interface DecryptedItem {
  id: string;
  type: string;
  name: string;
  institution: string;
  ownershipName?: string;
  ownershipType?: 'Individual' | 'Joint' | 'LLC' | 'Trust' | 'IRA' | 'Other';
  beneficiary?: string;
  updatedAt?: number;
  
  // Bank / Credit Card
  cardNumber?: string;
  cardPin?: string;
  routingNumber?: string;
  accountNumber?: string;
  cvv?: string;
  expiry?: string;
  creditLimit?: string;
  
  // Financial Tracking
  balanceHistory?: { date: number; amount: number }[];
  currentBalance?: number;
  
  // Real Estate
  propertyAddress?: string;
  propertyValue?: number;
  
  // Insurance
  policyNumber?: string;
  carrier?: string;
  coverageAmount?: number;
  premiumDueDate?: string;
  maturityDate?: string;

  // Patent / Intellectual Property
  patentTitle?: string;
  patentAppNumber?: string;
  patentFilingDate?: string;
  patentInventors?: string;
  patentJurisdiction?: string;
  patentStatus?: 'Draft' | 'Filed' | 'Pending' | 'Published' | 'Granted' | 'Rejected';
  patentAbstract?: string;
  patentClaims?: string;
  patentAgent?: string;

  // Other & General Credentials
  username?: string;
  password?: string;
  url?: string;
  notes?: string;

  // Non-Financial Asset
  nonFinancialType?: string;
  parties?: string;
  effectiveDate?: string;
  identifierReference?: string;
  assetDescription?: string;
  locationCustodian?: string;
  collectionDate?: string;
  
  // Will & Trust Or Estates
  trusteeNames?: string;
  legalCounsel?: string;
  legalContact?: string;
  executionDate?: string;
  directives?: string;
  
  // Custom Doc Archive
  docCategory?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expirationDate?: string;
  docRefNumber?: string;

  // Item Level Sharing & Triggers
  sharedLawyers?: string;
  sharedTrustees?: string;
  sharingConditions?: string;

  // Embedded Life Event metadata
  isLifeEvent?: boolean;
  eventType?: string;
  reporterName?: string;
  reporterEmail?: string;
  conditions?: string;
  createdAt?: number;
  status?: string;
  initiatorName?: string;
  initiatorEmail?: string;
  trusteeEmails?: string;
  attorneyEmails?: string;
  proofFileName?: string;
  partition?: string;

  // Crypto / Digital Wallet Asset
  cryptoType?: string;
  blockchain?: string;
  walletAddress?: string;
  seedPhrase?: string;
  privateKey?: string;
  derivationPath?: string;

  // Hardware token / website key recovery
  recoveryType?: string;
  recoveryIdentifier?: string;
  recoveryPin?: string;
  recoveryCodes?: string;
  recoveryInstructions?: string;

  // New heritage safety enhancements
  adminContext?: string; // Advisory notes for executors
  versions?: Array<{
    timestamp: number;
    editor: string;
    justification: string;
    decryptedSnapshot: any;
  }>;
}

export interface VaultConfig {
  hashedAnswers: string[];
  answerSalts: string[];
  signatureHash: string;
  pepperVersion?: string;
  masterKeySalt: string;
  hashedMasterKey: string;
  hashedDuressKey?: string;
  masterKeyFailedAttempts?: number;
  salt: string;
  failedAttempts: number;
  isCorrupted: boolean;
  ownerId: string;
  owners: string[];
  ownerEmails: string[];
  members: string[];
  encryptedSignatureEscrow?: string;
  encryptedAnswersEscrow?: string;
  isPremium?: boolean;
  userCustomFreeLimit?: number;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
  subscriptionAmount?: number;
  deadMansSwitchArmed?: boolean;
  deadMansSwitchThreshold?: number;
  deadMansSwitchLastPing?: number;
  assignedTrustees?: string[];
  assignedLawyers?: string[];
  allowEmergencyRelease?: boolean;
}

export interface VaultItem {
  id?: string;
  type: string;
  name: string;
  institution: string;
  encryptedData: string;
  updatedAt: number;
  partition?: string;
}

export type ViewMode = 'grid' | 'table' | 'grouped' | 'timeline';

export type SortField = 'name' | 'type' | 'institution' | 'value' | 'updatedAt' | 'expiration';
export type SortDirection = 'asc' | 'desc';
