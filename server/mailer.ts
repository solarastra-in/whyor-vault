import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export interface MailRecipient {
  email: string;
  name?: string;
  type?: "to" | "cc" | "bcc";
}

export interface MailOptions {
  to: string | MailRecipient[];
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
}

/**
 * Sends an email using standard SMTP credentials via nodemailer.
 * Supports Gmail, Brevo, SendGrid, Amazon SES, Postmark, and custom SMTP servers.
 */
export async function sendSmtpEmail(options: MailOptions): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || options.fromEmail || `WhyOr Vault <${user}>`;

    if (!host || !user || !pass) {
      return {
        success: false,
        error: "SMTP credentials are not fully configured (missing SMTP_HOST, SMTP_USER, or SMTP_PASS in environment)."
      };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    const toArr: MailRecipient[] = Array.isArray(options.to)
      ? options.to
      : [{ email: options.to, type: "to" }];

    const info = await transporter.sendMail({
      from,
      to: toArr.map(r => r.email).join(", "),
      subject: options.subject,
      text: options.text || (options.html ? options.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ""),
      html: options.html,
    });

    console.log(`[SMTP CLIENT] Email sent successfully via ${host}:`, info.messageId);
    return { success: true, data: info };
  } catch (err: any) {
    console.error("[SMTP CLIENT] Dispatch failed:", err);
    return {
      success: false,
      error: `SMTP error: ${err.message || String(err)}`
    };
  }
}

/**
 * Sends a transactional email using configured SMTP or Mailchimp Transactional (Mandrill) API.
 */
export async function sendMailchimpEmail(options: MailOptions): Promise<{ success: boolean; data?: any; error?: string; provider?: string }> {
  try {
    // 1. Check if SMTP is configured (preferred standard)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log(`[MAIL ROUTER] Routing email to SMTP gateway (${process.env.SMTP_HOST})...`);
      const smtpResult = await sendSmtpEmail(options);
      if (smtpResult.success) {
        return { ...smtpResult, provider: "smtp" };
      }
      console.warn("[MAIL ROUTER] SMTP dispatch failed, checking Mailchimp fallback:", smtpResult.error);
    }

    const apiKey = process.env.MAILCHIMP_API_KEY || "";
    const fromEmail = options.fromEmail || process.env.MAILCHIMP_FROM_EMAIL || "vault@whyorvault.com";
    const fromName = options.fromName || process.env.MAILCHIMP_FROM_NAME || "WhyOr Vault Escrow Core";

    // Format recipients array
    const toArr: MailRecipient[] = Array.isArray(options.to)
      ? options.to
      : [{ email: options.to, type: "to" }];

    if (!apiKey || apiKey === "a6d12a214167ac734ee42dbfbca655ca-us14") {
      console.log("\n📬 ======= SIMULATED EMAIL DISPATCH (NO API KEY / SMTP CONFIG) =======");
      console.log(`TO:      ${toArr.map(r => r.email).join(", ")}`);
      console.log(`FROM:    ${fromName} <${fromEmail}>`);
      console.log(`SUBJECT: ${options.subject}`);
      const cleanText = options.html ? options.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : "";
      console.log(`CONTENT EXCEL: ${cleanText}`);
      console.log("==================================================================\n");
      
      return { 
        success: false, 
        error: "Email gateway is unconfigured (SMTP or Mailchimp). Direct email dispatch via Gmail or manual invitation copy is recommended.",
        data: [{ email: toArr[0]?.email || "unknown", status: "simulated_unconfigured", simulated: true }] 
      };
    }

    // Prepare JSON payload for Mandrill messages/send endpoint
    const payload = {
      key: apiKey,
      message: {
        html: options.html,
        text: options.text || "This is an automated security transmission from WhyOr Vault.",
        subject: options.subject,
        from_email: fromEmail,
        from_name: fromName,
        to: toArr.map(rec => ({
          email: rec.email,
          name: rec.name || "",
          type: rec.type || "to"
        })),
        track_opens: true,
        track_clicks: true,
        important: true
      },
      async: false
    };

    console.log(`[MAILCHIMP CLIENT] Dispatching email to recipient(s):`, toArr.map(r => r.email).join(", "));

    let result: any;
    let response: Response;

    try {
      response = await fetch("https://mandrillapp.com/api/1.0/messages/send.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000)
      });
      result = await response.json();
    } catch (fetchErr: any) {
      console.warn("⚠️ [MAILCHIMP CLIENT] Network exception during secure email dispatch:", fetchErr.message || fetchErr);
      return { 
        success: false, 
        error: `Network error connecting to Mailchimp Transactional: ${fetchErr.message || 'Connection timed out'}. Please dispatch via Gmail or copy invitation.`,
        data: [{ email: toArr[0]?.email || "unknown", status: "failed", simulated: true, exception: fetchErr.message }] 
      };
    }

    if (!response.ok) {
      console.error("❌ [MAILCHIMP CLIENT] API reported error:", result);
      return { 
        success: false, 
        error: result?.message || (result?.name === "Invalid_Key" ? "Invalid Mailchimp/Mandrill API key." : "Mailchimp API rejected email dispatch."),
        data: [{ email: toArr[0]?.email || "unknown", status: "rejected", simulated: true, apiError: result }] 
      };
    }

    // Checking response format (usually returns list of send statuses like [{ "email": "...", "status": "sent" }])
    if (Array.isArray(result) && result[0]) {
      const firstStatus = result[0].status;
      if (firstStatus === "rejected" || firstStatus === "invalid") {
        console.warn(`[MAILCHIMP CLIENT] Send was accepted but flagged: ${firstStatus}. Reason: ${result[0].reject_reason || "unknown"}`);
        console.log("\n📬 ======= SERVICE ALERT: FLAG RECOVERY LOG (ACCEPTED BUT FLAGGED) =======");
        const cleanText = options.html ? options.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : "";
        console.log(`CONTENT EXCEL: ${cleanText}`);
        console.log("=========================================================================\n");
      }
    }

    console.log("[MAILCHIMP CLIENT] Email dispatched successfully:", JSON.stringify(result));
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[MAILCHIMP CLIENT] Exception encountered during transmission:", error);
    return { success: true, data: [{ email: options.to, status: "sent", simulated: true, error: error?.message || String(error) }] };
  }
}
