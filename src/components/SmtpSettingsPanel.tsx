import React, { useState, useEffect } from 'react';
import { 
  Server, Mail, Check, Copy, RefreshCw, Send, AlertCircle, 
  CheckCircle2, ExternalLink, ShieldCheck, Info, Terminal, Key
} from 'lucide-react';
import { cn, safeCopyToClipboard } from '../lib/utils';

interface SmtpStatusResponse {
  configured: boolean;
  activeProvider: 'smtp' | 'mailchimp' | 'none';
  smtp: {
    configured: boolean;
    host: string | null;
    port: string;
    secure: boolean;
    userMasked: string | null;
    from: string | null;
  };
  mailchimp: {
    configured: boolean;
  };
}

interface SmtpSettingsPanelProps {
  currentUserEmail?: string | null;
  onClose?: () => void;
}

const PRESETS = {
  gmail: {
    name: 'Gmail / Google Workspace',
    description: 'Use a free 16-character Google App Password (recommended for personal & family use).',
    host: 'smtp.gmail.com',
    port: '465',
    secure: 'true',
    user: 'your-email@gmail.com',
    pass: 'xxxx xxxx xxxx xxxx',
    from: 'WhyOr Vault <your-email@gmail.com>',
    instructions: [
      'Sign in to your Google Account (myaccount.google.com).',
      'Go to Security -> ensure "2-Step Verification" is ON.',
      'Go to App Passwords (myaccount.google.com/apppasswords).',
      'Create an App Password named "WhyOr Vault".',
      'Copy the 16-character code into SMTP_PASS in your .env file.'
    ]
  },
  brevo: {
    name: 'Brevo (formerly Sendinblue)',
    description: 'Free tier with 300 transactional emails/day. Very reliable.',
    host: 'smtp-relay.brevo.com',
    port: '587',
    secure: 'false',
    user: 'your-brevo-login-email@domain.com',
    pass: 'your-brevo-smtp-key',
    from: 'WhyOr Vault <verified-sender@domain.com>',
    instructions: [
      'Create a free account at brevo.com.',
      'Go to Transactional -> Settings -> Configuration -> SMTP.',
      'Copy the SMTP Server, Port, Login, and Master Password/Key.',
      'Paste them into your .env file.'
    ]
  },
  sendgrid: {
    name: 'Twilio SendGrid',
    description: 'High-volume production API and SMTP gateway.',
    host: 'smtp.sendgrid.net',
    port: '587',
    secure: 'false',
    user: 'apikey',
    pass: 'SG.your_sendgrid_api_key_here',
    from: 'WhyOr Vault <verified@yourdomain.com>',
    instructions: [
      'Log into sendgrid.com and create an API Key with "Mail Send" access.',
      'Set SMTP_USER exactly to "apikey".',
      'Set SMTP_PASS to your full SendGrid API Key starting with "SG.".'
    ]
  },
  ses: {
    name: 'Amazon SES',
    description: 'Cost-effective high-scale cloud email relay.',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: '587',
    secure: 'false',
    user: 'YOUR_AWS_SES_SMTP_USERNAME',
    pass: 'YOUR_AWS_SES_SMTP_PASSWORD',
    from: 'WhyOr Vault <verified@yourdomain.com>',
    instructions: [
      'In AWS Management Console, open Amazon Simple Email Service (SES).',
      'Verify your domain or sender email address.',
      'Go to Account Dashboard -> SMTP settings -> Create SMTP credentials.',
      'Paste the generated credentials into your .env file.'
    ]
  },
  custom: {
    name: 'Custom / Self-Hosted SMTP',
    description: 'Any standard RFC 5321 compliant SMTP server (Postfix, Exim, Exchange, etc.).',
    host: 'mail.yourdomain.com',
    port: '587',
    secure: 'false',
    user: 'vault-mailer@yourdomain.com',
    pass: 'your-secure-password',
    from: 'WhyOr Vault <vault-mailer@yourdomain.com>',
    instructions: [
      'Obtain host, port, authentication credentials, and TLS settings from your mail host.',
      'Configure the values in your server environment variables or .env file.'
    ]
  }
};

export default function SmtpSettingsPanel({ currentUserEmail, onClose }: SmtpSettingsPanelProps) {
  const [status, setStatus] = useState<SmtpStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS>('gmail');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [testEmail, setTestEmail] = useState(currentUserEmail || 'solarastra.in@gmail.com');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/email-status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.warn("Could not query /api/email-status:", e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const activePreset = PRESETS[selectedPreset];

  const getEnvSnippet = (presetKey: keyof typeof PRESETS) => {
    const p = PRESETS[presetKey];
    return `# --- SMTP Configuration (${p.name}) ---
SMTP_HOST="${p.host}"
SMTP_PORT="${p.port}"
SMTP_SECURE="${p.secure}"
SMTP_USER="${p.user}"
SMTP_PASS="${p.pass}"
SMTP_FROM="${p.from}"`;
  };

  const handleCopySnippet = () => {
    const snippet = getEnvSnippet(selectedPreset);
    safeCopyToClipboard(snippet).then((ok) => {
      if (ok) {
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2500);
      }
    });
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail.trim(),
          type: 'smtp_test',
          templateData: {}
        })
      });
      const data = await res.json();
      if (res.ok && data.success && !data.simulated) {
        setTestResult({
          success: true,
          message: `Verification email transmitted successfully via ${data.provider === 'smtp' ? 'SMTP Gateway' : 'Cloud Mailer'} to ${testEmail}!`,
          details: data.details
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || (data.simulated ? "Gateway unconfigured. SMTP or Mailchimp credentials not active in environment." : "Failed to send verification email."),
          details: data.details
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to reach server mailer."
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-900 flex-1 overflow-y-auto custom-scrollbar space-y-6 text-left">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shrink-0">
            <Server className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">Email & SMTP Gateway</h3>
            <p className="text-xs text-slate-400">Configure outbound email delivery for family invitations, security releases, and alerts.</p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loadingStatus}
          className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors cursor-pointer"
          title="Refresh Gateway Status"
        >
          <RefreshCw className={cn("h-4 w-4", loadingStatus && "animate-spin")} />
        </button>
      </div>

      {/* Live Status Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full animate-pulse",
              status?.smtp?.configured ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : 
              status?.mailchimp?.configured ? "bg-indigo-400 shadow-sm shadow-indigo-400/50" : 
              "bg-amber-400 shadow-sm shadow-amber-400/50"
            )} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Delivery Channel:
            </span>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              status?.smtp?.configured ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
              status?.mailchimp?.configured ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" :
              "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            )}>
              {status?.smtp?.configured ? `SMTP Active (${status.smtp.host})` :
               status?.mailchimp?.configured ? "Mailchimp Transactional" :
               "Simulation / Direct Gmail Dispatch"}
            </span>
          </div>
        </div>

        {status?.smtp?.configured ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Host & Port</span>
              <span className="text-slate-200 font-mono font-medium">{status.smtp.host}:{status.smtp.port}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Authenticated User</span>
              <span className="text-slate-200 font-mono font-medium">{status.smtp.userMasked || 'Configured'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Encryption</span>
              <span className="text-slate-200 font-mono font-medium">{status.smtp.secure ? 'SSL/TLS (Port 465)' : 'STARTTLS (Port 587)'}</span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">SMTP details are not yet configured on the server.</p>
              <p className="text-[11px] text-amber-200/80">
                You can configure standard SMTP variables in your <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-100 font-mono">.env</code> file below, or continue using the 1-click <strong className="text-white">"Send via Gmail"</strong> button in the handshake modal to send invitations directly from your personal Google account.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Where to Configure Guide */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Where to Configure SMTP</h4>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-2.5">
          <p>
            In WhyOr Vault, SMTP details are configured server-side via <strong>environment variables</strong>. This guarantees that your email password or App Password is <em>never</em> exposed to web browsers or client storage.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] font-bold text-white block mb-1">📁 Local / Developer Setup:</span>
              <p className="text-[11px] text-slate-400">
                Create or edit the <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded font-mono">.env</code> file in the applet root folder and paste the variables shown below.
              </p>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] font-bold text-white block mb-1">☁️ Cloud Run / Production:</span>
              <p className="text-[11px] text-slate-400">
                Add these 6 key-value pairs to your Cloud Run service or hosting provider under <strong>Environment Variables & Secrets</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Presets and Copyable Configuration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Provider Templates &amp; .env Snippets</h4>
          </div>
          <button
            onClick={handleCopySnippet}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {copiedSnippet ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedSnippet ? "Copied to Clipboard!" : "Copy .env Block"}</span>
          </button>
        </div>

        {/* Preset Selector Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => {
            const isSel = selectedPreset === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedPreset(key)}
                className={cn(
                  "px-3 py-2 text-xs font-semibold rounded-lg border transition-all shrink-0 cursor-pointer",
                  isSel 
                    ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900"
                )}
              >
                {PRESETS[key].name}
              </button>
            );
          })}
        </div>

        {/* Code Snippet Box */}
        <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-200">
          <pre className="overflow-x-auto whitespace-pre custom-scrollbar">
            {getEnvSnippet(selectedPreset)}
          </pre>
        </div>

        {/* Setup Instructions for Selected Provider */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            How to set up {activePreset.name}:
          </span>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
            {activePreset.instructions.map((step, idx) => (
              <li key={idx} className="leading-relaxed">{step}</li>
            ))}
          </ol>
          {selectedPreset === 'gmail' && (
            <div className="pt-2">
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline"
              >
                <span>Generate Google App Password</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Live Test Dispatch */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live SMTP Test Dispatch</h4>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <p className="text-xs text-slate-400">
            Verify whether your configured server credentials can successfully handshake and deliver an email:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSendTestEmail}
              disabled={testing || !testEmail.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              {testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span>{testing ? "Testing Connection..." : "Send Verification Email"}</span>
            </button>
          </div>

          {testResult && (
            <div className={cn(
              "p-3 rounded-lg border text-xs flex items-start gap-2.5",
              testResult.success 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                : "bg-red-500/10 border-red-500/30 text-red-200"
            )}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.details && typeof testResult.details === 'string' && (
                  <p className="text-[11px] opacity-80 font-mono">{testResult.details}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer close */}
      <div className="mt-8 flex justify-end">
        <button 
          onClick={onClose}
          className="py-2 text-xs font-bold text-slate-500 hover:text-white transition-all uppercase tracking-widest border border-slate-800 px-4 rounded-xl hover:bg-slate-800 cursor-pointer"
        >
          Close Settings
        </button>
      </div>
    </div>
  );
}
