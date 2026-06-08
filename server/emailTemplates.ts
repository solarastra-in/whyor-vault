/**
 * Beautiful, secure, and modern custom HTML email templates for WhyOr Vault.
 * Ensures absolute secrecy: no confidential items, master keys, or passwords are sent in plaintext.
 */

interface TemplateData {
  ownerEmail?: string;
  inviteCode?: string;
  inviteeEmail?: string;
  recipientName?: string;
  vaultId?: string;
  eventType?: string;
  conditions?: string;
  mfaCode?: string;
  amountPaid?: string;
  invoiceId?: string;
  customerEmail?: string;
  paymentDetails?: string;
}

const BRAND_NAME = "WhyOr Vault";
const BASE_URL = process.env.APP_URL || "https://whyorvault.com";

// Wrapper to provide standard modern header, footer, and styling hierarchy
function emailWrapper(title: string, bodyContent: string, preheaderText = ""): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #020617;
      color: #94a3b8;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #020617;
      padding: 40px 20px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
    }
    .header {
      background-color: #020617;
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid #1e293b;
    }
    .logo-container {
      display: inline-block;
      padding: 10px 15px;
      border: 1px solid #312e81;
      border-radius: 8px;
      background-color: #1e1b4b;
    }
    .logo-text {
      color: #ffffff;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    h1 {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin-top: 0;
      margin-bottom: 16px;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .highlight-card {
      background-color: #020617;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    .token-text {
      font-family: Menlo, Monaco, Consolas, "Fira Code", monospace;
      color: #818cf8;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 0.3em;
      margin: 12px 0;
    }
    .btn {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      font-weight: 700;
      font-size: 13px;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 16px 0;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.4);
    }
    .btn:hover {
      background-color: #4338ca;
    }
    .warning-box {
      border-left: 3px solid #ef4444;
      background-color: #1a1013;
      padding: 16px;
      border-radius: 4px;
      margin: 24px 0;
    }
    .warning-title {
      color: #f87171;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 4px 0;
    }
    .warning-text {
      color: #fca5a5;
      font-size: 13px;
      margin: 0;
      line-height: 1.5;
    }
    .info-grid {
      display: table;
      width: 100%;
      margin: 16px 0;
      background-color: #020617;
      border-radius: 8px;
      border: 1px solid #1e293b;
    }
    .info-row {
      display: table-row;
    }
    .info-label {
      display: table-cell;
      padding: 12px 16px;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #1e293b;
      width: 35%;
    }
    .info-value {
      display: table-cell;
      padding: 12px 16px;
      color: #cbd5e1;
      font-size: 13px;
      border-bottom: 1px solid #1e293b;
    }
    .footer {
      background-color: #020617;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #1e293b;
    }
    .footer-text {
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
      margin: 0;
    }
    .footer-lnk {
      color: #4f46e5;
      text-decoration: none;
    }
    .footer-lnk:hover {
      text-decoration: underline;
    }
    .shield-badge {
      display: inline-block;
      margin-bottom: 12px;
      padding: 4px 8px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 4px;
      color: #818cf8;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
  </style>
</head>
<body>
  ${preheaderText ? `<div style="display: none; max-height: 0px; overflow: hidden;">${preheaderText}</div>` : ""}
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-container">
          <p class="logo-text">🔓 WhyOr Vault</p>
        </div>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p class="footer-text" style="color: #64748b; font-weight: 600; margin-bottom: 10px;">🛡️ ZERO-KNOWLEDGE PROTOCOL CONFIRMED</p>
        <p class="footer-text" style="margin-bottom: 15px;">
          All sensitive vault credentials, master keys, file blocks, and data partitions are encrypted directly within your browser. 
          Our mail systems never see, store, or process any plaintext user secrets.
        </p>
        <p class="footer-text">
          &copy; 2026 ${BRAND_NAME} System Services. All rights reserved.<br>
          Authorized Access Controls • <a href="${BASE_URL}" class="footer-lnk">System Dashboard</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function getFamilyInviteTemplate(data: TemplateData): string {
  const owner = data.ownerEmail || "A vault administrator";
  const code = data.inviteCode || "XXXXXX";
  const invitee = data.inviteeEmail || "your authorized email";
  const title = "Family Handshake Invitation";

  const body = `
    <div class="shield-badge">Secure Inter-User Handshake</div>
    <h1>Secure Vault Handshake Connection</h1>
    <p>We detected that <strong>${owner}</strong> has invited you to safely link and co-represent their encrypted ledger on WhyOr Vault.</p>
    
    <p>To accept this invitation and securely chain your access capabilities with this vault, please follow these step-by-step instructions:</p>
    
    <div class="highlight-card" style="margin-bottom: 25px;">
      <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin: 0 0 10px 0; letter-spacing: 0.1em;">Your Temporary Handshake Token</p>
      <div class="token-text" style="font-size: 28px; font-weight: 950; font-family: monospace; letter-spacing: 0.15em; color: #4f46e5;">${code}</div>
      <p style="font-size: 10px; color: #e11d48; margin: 10px 0 0 0; font-weight: 700; letter-spacing: 0.05em;">EXPIRES IN 30 MINUTES FROM DISPATCH</p>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: left;">
      <h3 style="font-size: 13px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin-top: 0; margin-bottom: 12px; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Next Steps for Onboarding:</h3>
      <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155; line-height: 1.6;">
        <li style="margin-bottom: 8px;">
          <strong>Access the Dashboard:</strong> Click the <strong>Access WhyOr Portal</strong> button below to open the secure web interface standalone.
        </li>
        <li style="margin-bottom: 8px;">
          <strong>Create or Login to Your Account:</strong> Authenticate/register on the login screen using your authorized email address: <strong style="color: #4f46e5;">${invitee}</strong>.
        </li>
        <li style="margin-bottom: 8px;">
          <strong>Redeem Handshake Token:</strong> When prompted by the onboarding setup wizard, enter the 6-character secure handshake token shown above (<strong style="font-family: monospace; letter-spacing: 0.05em;">${code}</strong>).
        </li>
        <li style="margin-bottom: 0;">
          <strong>Complete Local Security Keys:</strong> Define your local recovery challenge questions. This will securely bind your device with the shared vault, allowing you to fetch and decrypt co-managed ledger credentials without the owner needing to share their master key directly.
        </li>
      </ol>
    </div>

    <div style="text-align: center; margin-bottom: 25px;">
      <a href="${BASE_URL}" class="btn">Access WhyOr Portal</a>
    </div>

    <div class="warning-box" style="border-left-color: #6366f1; background-color: #0c0f24; padding: 15px; border-radius: 8px;">
      <p class="warning-title" style="color: #818cf8; font-weight: bold; margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; tracking: 0.05em;">Security Note</p>
      <p class="warning-text" style="color: #94a3b8; font-size: 11px; margin: 0; line-height: 1.5;">
        Accepting this handshake does NOT transmit the owner's master key in plaintext. Encryption shielding prevents any single node leakage. Both you and the primary owner maintain crypotographic sovereignty.
      </p>
    </div>
  `;

  return emailWrapper(title, body, `You are invited to link to a secure WhyOr Vault. Handshake code: ${code}`);
}

export function getAccessRevokedTemplate(data: TemplateData): string {
  const owner = data.ownerEmail || "A vault administrator";
  const title = "Secured Core - Member Revocation Notification";

  const body = `
    <div class="shield-badge" style="background-color: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171;">Security Boundary Update</div>
    <h1>Vault Access Revoked</h1>
    <p>This automated transmission is to inform you that your authorized access to the secure WhyOr Vault co-managed by <strong>${owner}</strong> has been revoked by the primary owner.</p>
    
    <p>All active cryptographic handshake routes, co-trustee indicators, and offline browser caching parameters relative to this vault configuration have been safely invalidated.</p>

    <div class="info-grid">
      <div class="info-row">
        <span class="info-label">Action</span>
        <span class="info-value">Access Revocation</span>
      </div>
      <div class="info-row">
        <span class="info-label">Vault ID Hash</span>
        <span class="info-value">${data.vaultId || "Undisclosed Security Sector"}</span>
      </div>
    </div>

    <p style="margin-top: 24px; font-size: 13px;">If you believe this configuration change occurred by mistake, coordinate with the vault owner directly. No actions are required to preserve security boundaries.</p>
  `;

  return emailWrapper(title, body, `Your authorized access to WhyOr Vault has been safely revoked.`);
}

export function getWelcomeMemberTemplate(data: TemplateData): string {
  const owner = data.ownerEmail || "A vault administrator";
  const title = "Welcome to WhyOr Vault - Access Authorized";

  const body = `
    <div class="shield-badge">Access Registration Cleared</div>
    <h1>Access Authorized to Secure Vault</h1>
    <p>You have been officially added as an authorized representative of the global secure vault managed by <strong>${owner}</strong>.</p>
    
    <p>To safely visualize and coordinate with shared assets or escrow dispatches, sign into the portal using your verified email address.</p>

    <div class="info-grid">
      <div class="info-row">
        <span class="info-label">Primary Owner</span>
        <span class="info-value">${owner}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Scope Authorized</span>
        <span class="info-value">Shared Ledger, Nominated Representative, Escrow Receiver</span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${BASE_URL}" class="btn">Connect Security Console</a>
    </div>

    <p style="font-size: 13px;">Ensure your local browser environment is secured. Keep your personal portal authentication credentials strictly confidential.</p>
  `;

  return emailWrapper(title, body, `You are officially cleared to access shared credentials with ${owner}.`);
}

export function getEscrowReleaseAttorneyTemplate(data: TemplateData): string {
  const type = data.eventType || "Critical Life Event / Escrow Protocol";
  const conds = data.conditions || "Emergency Verification Procedure Completed Successfully";
  const title = "URGENT DISPATCH: Secure Escrow Ledger Released";

  const body = `
    <div class="shield-badge" style="background-color: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171;">URGENT CRYPTOGRAPHIC RELEASE</div>
    <h1 style="color: #f87171;">Secured Escrow Release Dispatch</h1>
    <p>ATTENTION: Under established guidelines authorized by the vault owner, an escrow release condition sequence has been verified and triggered.</p>
    
    <p>A secure, encrypted escrow ledger has been dispatched regarding the critical event listed below. You are listed as the designated recipient for these legal/administrative assets.</p>

    <div class="info-grid">
      <div class="info-row">
        <span class="info-label">Event Protocol</span>
        <span class="info-value" style="color: #ef4444; font-weight: bold;">${type}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Conditions Met</span>
        <span class="info-value">${conds}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Vault ID Sector</span>
        <span class="info-value">${data.vaultId || "SECURE_ZONE_RECOVERY"}</span>
      </div>
    </div>

    <div class="warning-box">
      <p class="warning-title">Emergency Action Required</p>
      <p class="warning-text">
        To review and unlock this secure archive safely, connect immediately to your WhyOr Security Console. Zero-knowledge cryptographic verification protocols remain strictly active.
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${BASE_URL}" class="btn" style="background-color: #dc2626; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.4);">Unlock Released Escrow</a>
    </div>
  `;

  return emailWrapper(title, body, `EMERGENCY DISPATCH: Secure Escrow Archive Released for ${type}.`);
}

export function getEscrowReleaseTrusteeTemplate(data: TemplateData): string {
  const type = data.eventType || "Nominee Key Release";
  const title = "SECURED DISPATCH: Nominated Trustee Escrow Unlocked";

  const body = `
    <div class="shield-badge" style="background-color: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); color: #f59e0b;">ESCROW DISPATCH SEQUENCE APPROVED</div>
    <h1 style="color: #f59e0b;">Nominee Trustee Escrow Released</h1>
    <p>This automated transmission notifies you that the secure keys escrowed in support of family representation have been successfully triggered and verified.</p>
    
    <p>As a nominated trustee or family representative, cryptographic key chunks and instructions have been unlocked inside the WhyOr Security Console.</p>

    <div class="info-grid">
      <div class="info-row">
        <span class="info-label">Release Event</span>
        <span class="info-value" style="color: #f59e0b; font-weight: bold;">${type}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Scope Authorized</span>
        <span class="info-value">Decrypted Wills, Secure Hardware Strings, Credentials ledger</span>
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${BASE_URL}" class="btn" style="background-color: #d97706; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.4);">Access Trustee Platform</a>
    </div>

    <div class="warning-box" style="border-left-color: #d97706; background-color: #211305;">
      <p class="warning-title" style="color: #fca5a5;">Aesthetic Guardrails</p>
      <p class="warning-text" style="color: #f3f4f6; font-size: 12px;">
        To secure historical integrity, all actions completed under this unlocked state are logged on the immutable, distributed secure session ledger.
      </p>
    </div>
  `;

  return emailWrapper(title, body, `SECURED DISPATCH: Trustee Escrow Access Unlocked for ${type}.`);
}

export function getAdminMfaTemplate(data: TemplateData): string {
  const code = data.mfaCode || "000000";
  const title = "Admin Portal Multi-Factor Verification Code";

  const body = `
    <div class="shield-badge" style="background-color: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #34d399;">ADMINISTRATIVE SECURITY OVERRIDE</div>
    <h1>Admin Central Verification Code</h1>
    <p>A login request was initiated for the WhyOr Admin Central Operator Console from an external client.</p>
    
    <p>To authorize this administrative session, please enter the following secure Multi-Factor Authentication OTP code in your web browser:</p>
    
    <div class="highlight-card" style="margin-bottom: 25px; border-left-color: #10b981;">
      <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin: 0 0 10px 0; letter-spacing: 0.1em;">Your Administrative OTP Code</p>
      <div class="token-text" style="font-size: 32px; font-weight: 950; font-family: monospace; letter-spacing: 0.25em; color: #10b981;">${code}</div>
      <p style="font-size: 10px; color: #e11d48; margin: 10px 0 0 0; font-weight: 700; letter-spacing: 0.05em;">EXPIRES IN 10 MINUTES</p>
    </div>

    <p style="font-size: 11px; color: #64748b; line-height: 1.5; margin-top: 20px;">
      <strong>Security Alert:</strong> If you did not request this OTP, change your administrative workspace passwords immediately. Access attempts are permanently printed to system diagnostic journals.
    </p>
  `;

  return emailWrapper(title, body, `Operator override OTP: ${code}`);
}

export function getPaymentReceiptTemplate(data: TemplateData): string {
  const amount = data.amountPaid || "$0.00";
  const invoice = data.invoiceId || "INV-0000";
  const customer = data.customerEmail || "valuable customer";
  const details = data.paymentDetails || "Secure Lifetime Enterprise Plan";
  const title = "Payment Received - Thank You";

  const body = `
    <div class="shield-badge" style="background-color: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #34d399;">PAYMENT COMPLETED REGISTERED</div>
    <h1>Payment Receipt & Account Activation</h1>
    <p>Dear Valued Custimer,</p>
    <p>Thank you for your payment. WhyOr Cryptographic Vault has registered your payment successfully and activated your secure plan.</p>
    
    <div class="info-grid" style="margin-top: 20px; margin-bottom: 25px;">
      <div class="info-row" style="padding: 10px 0; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between;">
        <span class="info-label" style="font-size: 12px; color: #64748b; font-weight: bold;">Invoice Number</span>
        <span class="info-value" style="font-size: 12px; color: #f8fafc; font-family: monospace;">${invoice}</span>
      </div>
      <div class="info-row" style="padding: 10px 0; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between;">
        <span class="info-label" style="font-size: 12px; color: #64748b; font-weight: bold;">Account Paid</span>
        <span class="info-value" style="font-size: 12px; color: #f8fafc;">${customer}</span>
      </div>
      <div class="info-row" style="padding: 10px 0; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between;">
        <span class="info-label" style="font-size: 12px; color: #64748b; font-weight: bold;">Plan Details</span>
        <span class="info-value" style="font-size: 12px; color: #e2e8f0; font-weight: 500;">${details}</span>
      </div>
      <div class="info-row" style="padding: 12px 0; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between;">
        <span class="info-label" style="font-size: 12px; color: #64748b; font-weight: bold;">Amount Paid</span>
        <span class="info-value" style="font-size: 14px; color: #10b981; font-weight: 900;">${amount}</span>
      </div>
    </div>

    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${BASE_URL}" class="btn" style="background-color: #10b981; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);">Access Your Activated Vault</a>
    </div>

    <div class="warning-box" style="border-left-color: #10b981; background-color: #061f14; padding: 15px; border-radius: 8px;">
      <p class="warning-title" style="color: #34d399; font-weight: bold; margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase;">Cryptographic Integrity Preserved</p>
      <p class="warning-text" style="color: #a7f3d0; font-size: 11px; margin: 0; line-height: 1.5;">
        Our payment processors operate under a sealed, blind escrow sequence. No master key, password, or local challenge hashes are ever available to payment pipelines. Your zero-knowledge vault remains perfectly secure.
      </p>
    </div>
  `;

  return emailWrapper(title, body, `Receipt of ${amount} cleared for ${customer}.`);
}
