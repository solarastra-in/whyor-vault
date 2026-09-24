import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import dotenv from "dotenv";
import { sendMailchimpEmail } from "./server/mailer";
import { 
  getFamilyInviteTemplate, 
  getAccessRevokedTemplate, 
  getWelcomeMemberTemplate, 
  getEscrowReleaseAttorneyTemplate, 
  getEscrowReleaseTrusteeTemplate,
  getAdminMfaTemplate,
  getPaymentReceiptTemplate
} from "./server/emailTemplates";
import { handleGeminiChat } from "./server/geminiChat";

// Load environment variables (e.g., FINGERPRINT_PEPPER)
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Verify security settings and initialize high-entropy persistent pepper for production
  let pepper = process.env.FINGERPRINT_PEPPER;
  const pepperFilePath = path.join(process.cwd(), ".persistent_pepper");
  
  if (!pepper) {
    if (fs.existsSync(pepperFilePath)) {
      try {
        pepper = fs.readFileSync(pepperFilePath, "utf-8").trim();
      } catch (e) {
        console.warn("[SECURITY PROTOCOL] Could not read .persistent_pepper file, generating fallback.");
      }
    }
  }

  if (!pepper) {
    pepper = crypto.randomBytes(64).toString("hex");
    try {
      fs.writeFileSync(pepperFilePath, pepper, { mode: 0o600 });
      console.log("[SECURITY PROTOCOL] Created persistent 128-character HMAC pepper secret at .persistent_pepper");
    } catch (e) {
      console.warn("[SECURITY PROTOCOL] Running with runtime persistent pepper.");
    }
  }

  process.env.FINGERPRINT_PEPPER = pepper;
  console.log("[SECURITY PROTOCOL] Production HMAC Fingerprint Pepper Initialized (128-character high-entropy secret active)");

  // Set up body parser for post payloads
  app.use(express.json());

  // Set Cross-Origin-Opener-Policy to allow popups (e.g., Google OAuth) to maintain
  // communication with the opener window without COOP mismatch warnings.
  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

    // Content Security Policy (CSP):
    // Allows required origins for Google Identity/Firebase, AI Studio iframe tooling (cdn.jsdelivr.net),
    // and fonts, while preventing arbitrary string execution in production.
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = isDev
      ? "'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com https://www.gstatic.com https://cdn.jsdelivr.net"
      : "'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com https://www.gstatic.com https://cdn.jsdelivr.net";

    const cspDirectives = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' ws: wss: https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.run.app https://cdn.jsdelivr.net https://*.google.com",
      "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    res.setHeader("Content-Security-Policy", cspDirectives.join("; "));
    next();
  });

  // API Route for secure client-side proxy HMAC signature calculations
  app.post("/api/hmac", (req: express.Request, res: express.Response) => {
    try {
      const { signature, salt, version } = req.body;
      if (!signature || !salt) {
        return res.status(400).json({ error: "Missing required 'signature' or 'salt' parameters." });
      }

      // Security: Keep pepper COMPLETELY server-side as a high-entropy secret
      const pepper = process.env.FINGERPRINT_PEPPER || 
                    "WhyOrSecureFingerprintPepper2026DefaultSecretAndSufficiencyToken!";

      // Perform secure backend HMAC SHA-256
      const hmac = crypto.createHmac("sha256", pepper);
      hmac.update(signature + salt);
      const signatureHash = hmac.digest("hex");

      return res.json({ signatureHash });
    } catch (err: any) {
      console.error("Backend HMAC calculation failure:", err);
      return res.status(500).json({ error: "Internal cryptographic server failure." });
    }
  });

  // API Route for sending authenticated/formatted Mailchimp Transactional messages
  app.post("/api/send-email", async (req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { to, type, templateData } = req.body;

      if (!to || !type) {
        return res.status(400).json({ error: "Missing mandatory fields: 'to' and 'type' are required." });
      }

      let html = "";
      let subject = "Security Notification - WhyOr Vault";

      switch (type) {
        case "family_invite":
          html = getFamilyInviteTemplate(templateData || {});
          subject = "WhyOr Vault Handshake Connection Invitation";
          break;
        case "access_revoked":
          html = getAccessRevokedTemplate(templateData || {});
          subject = "WhyOr Vault Access Revoked";
          break;
        case "welcome_member":
          html = getWelcomeMemberTemplate(templateData || {});
          subject = "Access Authorized to WhyOr Secure Vault";
          break;
        case "escrow_release_attorney":
          html = getEscrowReleaseAttorneyTemplate(templateData || {});
          subject = "URGENT DISPATCH: Secure Escrow Ledger Released";
          break;
        case "escrow_release_trustee":
          html = getEscrowReleaseTrusteeTemplate(templateData || {});
          subject = "SECURED DISPATCH: Nominated Trustee Escrow Unlocked";
          break;
        case "admin_mfa":
          html = getAdminMfaTemplate(templateData || {});
          subject = "Operator MFA Verification Security Override Key";
          break;
        case "payment_received":
          html = getPaymentReceiptTemplate(templateData || {});
          subject = "Payment Receipt Registered - WhyOr Cryptographic Vault";
          break;
        case "smtp_test":
        case "test_email":
          html = `
            <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#020617; color:#f8fafc; padding:32px 24px; border-radius:12px; max-width:540px; margin:0 auto; border:1px solid #1e293b;">
              <div style="border-bottom:1px solid #1e293b; padding-bottom:16px; margin-bottom:20px;">
                <span style="background:rgba(99,102,241,0.15); color:#818cf8; font-size:11px; font-weight:700; padding:4px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:0.1em; border:1px solid rgba(99,102,241,0.3);">WhyOr Vault Security</span>
                <h2 style="color:#ffffff; font-size:20px; font-weight:700; margin:12px 0 4px 0;">SMTP Verification Succeeded</h2>
                <p style="color:#94a3b8; font-size:13px; margin:0;">Direct transport connection established successfully.</p>
              </div>
              <div style="background-color:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:16px; margin-bottom:20px;">
                <p style="font-size:12px; color:#64748b; margin:0 0 6px 0; text-transform:uppercase; font-weight:600; letter-spacing:0.05em;">Dispatch Details</p>
                <p style="font-size:13px; color:#cbd5e1; margin:4px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                <p style="font-size:13px; color:#cbd5e1; margin:4px 0;"><strong>Active Transport:</strong> ${process.env.SMTP_HOST ? `SMTP Relay (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || '587'})` : 'Transactional Gateway'}</p>
                <p style="font-size:13px; color:#cbd5e1; margin:4px 0;"><strong>Recipient:</strong> ${to}</p>
              </div>
              <p style="font-size:12px; color:#64748b; margin:0; line-height:1.5;">This message confirms your SMTP credentials are active. All cryptographic vault handshakes, access revocations, and recovery notifications will route via this mailer.</p>
            </div>
          `;
          subject = "WhyOr Vault: SMTP Gateway Verification Successful";
          break;
        default:
          return res.status(400).json({ error: `Invalid template type: '${type}'` });
      }

      console.log(`[API EMAIL ENDPOINT] Request received to send '${type}' to ${to}`);
      const mailResult = await sendMailchimpEmail({
        to,
        subject,
        html,
        text: `Automated security transmission from WhyOr Vault: ${subject}. Clear text is disabled for privacy.`
      });

      if (!mailResult.success) {
        return res.status(200).json({ 
          success: false, 
          unconfigured: true,
          error: mailResult.error || "Email transmission failed", 
          details: mailResult.error 
        });
      }

      return res.json({ 
        success: true, 
        simulated: (mailResult as any).simulated || false,
        provider: mailResult.provider || "mailchimp",
        message: (mailResult as any).simulated 
          ? "Email gateway is unconfigured or in simulation mode." 
          : `Email transmitted successfully via ${mailResult.provider === 'smtp' ? 'SMTP Gateway' : 'Mailchimp Transactional'}`, 
        details: mailResult.data 
      });
    } catch (err: any) {
      console.error("Internal API server mailer exception:", err);
      return res.status(500).json({ error: "Internal mailer dispatch failure.", details: err?.message || String(err) });
    }
  });

  // API Route to inspect email & SMTP configuration state
  app.get("/api/email-status", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    const hasMailchimp = Boolean(
      process.env.MAILCHIMP_API_KEY && 
      process.env.MAILCHIMP_API_KEY !== "a6d12a214167ac734ee42dbfbca655ca-us14"
    );

    res.json({
      configured: hasSmtp || hasMailchimp,
      activeProvider: hasSmtp ? "smtp" : hasMailchimp ? "mailchimp" : "none",
      smtp: {
        configured: hasSmtp,
        host: process.env.SMTP_HOST || null,
        port: process.env.SMTP_PORT || "587",
        secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        userMasked: process.env.SMTP_USER 
          ? `${process.env.SMTP_USER.slice(0, 3)}***@${process.env.SMTP_USER.split('@')[1] || 'domain'}` 
          : null,
        from: process.env.SMTP_FROM || null
      },
      mailchimp: {
        configured: hasMailchimp
      }
    });
  });

  // API Route for multi-turn Gemini Assistant Chatbot
  app.post("/api/gemini/chat", handleGeminiChat);

  // Keep a status page for connectivity checking
  app.get("/api/health", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json({ status: "healthy", serverTime: new Date().toISOString() });
  });

  // Serve the beautifully designed, interactive onboarding HTML preview route
  app.get("/onboarding-preview", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "onboarding.html"));
  });

  // Set up Vite development server middleware or production static asset server
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));
  const isBundled = (typeof __filename !== "undefined" && (__filename.endsWith(".cjs") || __filename.includes("dist"))) || process.env.NODE_ENV === "production";
  const useStatic = hasDist && isBundled;

  if (!useStatic) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Explicit SPA-fallback for Dev Mode so any deep-links, subpaths or redirected URLs do not 404!
    app.get("*", async (req, res, next) => {
      // If requesting an API route or a static asset with a file extension, pass through
      if (req.path.startsWith("/api") || req.path.includes(".")) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        // Transform HTML template using Vite server pipeline
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (err) {
        console.error("Vite Dev SPA fallback rewrite error:", err);
        next(err);
      }
    });
  } else {
    app.use(express.static(distPath));
    // SPA routing fallback using app.get('*', ...) for Express 4
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULL-STACK SECURITY VAULT] Online on http://0.0.0.0:${PORT}`);
  });
}

startServer();
