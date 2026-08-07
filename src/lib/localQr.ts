/**
 * localQr.ts
 * -----------------------------------------------------------------------
 * Client-side QR generation using the `qrcode` library.
 * Replaces remote API calls (e.g. api.qrserver.com) that send sensitive
 * keys/tokens over the network.
 * -----------------------------------------------------------------------
 */
import QRCode from 'qrcode';

/** Returns a data: URL PNG — generated entirely client-side. */
export async function generateLocalQrDataUrl(data: string, colorHex = '#6366f1'): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: colorHex, light: '#0f172a' },
    width: 300,
  });
}

// Crockford base32 alphabet — excludes I, L, O, U to avoid transcription errors on printed keycards.
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function encodeCrockfordBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += CROCKFORD_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += CROCKFORD_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function decodeCrockfordBase32(str: string): Uint8Array {
  const clean = str.toUpperCase().replace(/[ILOU\-\s]/g, (c) => (c === 'I' || c === 'L' ? '1' : c === 'O' ? '0' : ''));
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = CROCKFORD_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}
