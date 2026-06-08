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

  // Verify security settings and provide a cryptographically secure 128-character suggestion if missing
  const hasPepper = !!process.env.FINGERPRINT_PEPPER;
  let suggestedPepper = "";
  if (!hasPepper) {
    suggestedPepper = crypto.randomBytes(64).toString("hex");
    console.warn("\n" + "=".repeat(80));
    console.warn("⚠️  SECURITY PROTOCOL WARNING: FINGERPRINT_PEPPER is not configured! ⚠️");
    console.warn("In a multi-node or containerized environment, an in-memory auto-generated key");
    console.warn("would invalidate all signature hashes permanently upon any server restart or scale event.");
    console.warn("\nACTION REQUIRED:");
    console.warn("To transition to production-grade security, set the FINGERPRINT_PEPPER environment value.");
    console.warn("Here is a secure, custom-generated 128-character pepper ready for immediate use:");
    console.warn(`👉  ${suggestedPepper}`);
    console.warn("=".repeat(80) + "\n");
  }

  // Set up body parser for post payloads
  app.use(express.json());

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
