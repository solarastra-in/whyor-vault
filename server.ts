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

// Load environment variables (e.g., FINGERPRINT_PEPPER)
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

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
    // Prevents arbitrary string evaluation (eval, new Function, string timeouts) in production,
    // while permitting Vite runtime transforms and WebAssembly execution in dev mode.
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = isDev
      ? "'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com https://www.gstatic.com"
      : "'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com https://www.gstatic.com";

    const cspDirectives = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' ws: wss: https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.run.app",
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
        return res.status(502).json({ 
          error: "Mailchimp transactional transmission failed", 
          details: mailResult.error 
        });
      }

      return res.json({ success: true, message: "Email transmitted successfully", details: mailResult.data });
    } catch (err: any) {
      console.error("Internal API server mailer exception:", err);
      return res.status(500).json({ error: "Internal mailer dispatch failure.", details: err?.message });
    }
  });

  // Keep a status page for connectivity checking
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", serverTime: new Date().toISOString() });
  });

  // Serve the beautifully designed, interactive onboarding HTML preview route
  app.get("/onboarding-preview", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "onboarding.html"));
  });

  // Set up Vite development server middleware or production static asset server
  const distPath = path.join(process.cwd(), "dist");
  const useStatic = process.env.NODE_ENV === "production" && fs.existsSync(path.join(distPath, "index.html"));

  if (!useStatic) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
