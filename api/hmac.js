import crypto from 'crypto';

export default function handler(req, res) {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { signature, salt, version } = req.body || {};
  if (!signature || !salt) {
    return res.status(400).json({ error: 'Missing signature or salt' });
  }

  const pepper = process.env.FINGERPRINT_PEPPER || 'FALLBACK_PEPPER_KEY';
  const hmac = crypto.createHmac('sha256', pepper);
  hmac.update(signature + salt);
  const signatureHash = hmac.digest('hex');

  return res.status(200).json({ signatureHash, version: version || 'v1' });
}
