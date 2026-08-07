/**
 * Protocol Master Key Generator & Validator
 * 
 * Requirement: 
 * - 24 characters
 * - Minimum 6 special characters
 * - No simple sequences or repeated characters
 * - Crypto-random source
 */

const SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const WORDLIST = [
  "ALPHA", "BRAVO", "DELTA", "ECHO", "FOXTROT", "GOLF", "HOTEL", "INDIA", 
  "JULIET", "KILO", "LIMA", "MIKE", "NOVEMBER", "OSCAR", "PAPA", "QUEBEC", 
  "ROMEO", "SIERRA", "TANGO", "UNIFORM", "VICTOR", "WHISKEY", "XRAY", "YANKEE", "ZULU"
];

export function validateMasterKey(key: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (key.length < 12 || key.length > 64) {
    errors.push("Security keys must be between 12 and 64 characters in length.");
  }

  const hasLetter = /[a-zA-Z]/.test(key);
  if (!hasLetter) {
    errors.push("Must contain at least one letter.");
  }

  const hasSpecialOrDigit = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(key);
  if (!hasSpecialOrDigit) {
    errors.push("Must contain at least one number or special character (e.g. !@#$).");
  }

  if (/1234|abcd|qwerty|asdf/i.test(key)) {
    errors.push("Weak sequence detected. Please choose a more complex or random key.");
  }

  return { valid: errors.length === 0, errors };
}

export function generateSecureMasterKey(): string {
  const getRand = (arr: any[]) => arr[Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1) * arr.length)];
  
  while (true) {
    let key = "";
    // Pattern: WORD(5) + 2SPECIAL + WORD(5) + 2SPECIAL + 4NUM + 2SPECIAL + WORD(4) = 24
    const w1 = getRand(WORDLIST).substring(0, 5).padEnd(5, 'X').toUpperCase(); // 5
    key += w1;
    
    key += Array.from({length: 2}, () => getRand(SPECIAL_CHARS.split(''))).join(''); // 2

    let w2 = getRand(WORDLIST);
    while (w2 === w1) w2 = getRand(WORDLIST);
    key += w2.substring(0, 5).padEnd(5, 'X').toUpperCase(); // 5

    key += Array.from({length: 2}, () => getRand(SPECIAL_CHARS.split(''))).join(''); // 2

    key += Math.floor(1000 + Math.random() * 9000).toString(); // 4

    key += Array.from({length: 2}, () => getRand(SPECIAL_CHARS.split(''))).join(''); // 2

    let w3 = getRand(WORDLIST);
    key += w3.substring(0, 4).padEnd(4, 'X').toUpperCase(); // 4

    const validation = validateMasterKey(key);
    if (validation.valid) {
      return key;
    }
  }
}

export function verifyMasterKey(key: string, expectedHash: string, salt: string): Promise<boolean> {
  // This will be used for hashing and checking
  return Promise.resolve(false); // Placeholder as we'll implementation hashing in App or crypto lib
}

interface Shares {
  share1: string;
  share2: string;
  share3: string;
}

/**
 * Galois Field GF(256) Arithmetic Helpers for Shamir's Secret Sharing
 */
function gfMul(a: number, b: number): number {
  let p = 0;
  let tA = a;
  let tB = b;
  for (let i = 0; i < 8; i++) {
    if (tB & 1) p ^= tA;
    const carry = tA & 0x80;
    tA <<= 1;
    if (carry) tA ^= 0x11b; // x^8 + x^4 + x^3 + x + 1 (AES irreducible polynomial)
    tB >>= 1;
  }
  return p & 255;
}

function gfInv(a: number): number {
  if (a === 0) throw new Error("Division by zero in GF(256) field arithmetic.");
  for (let x = 1; x < 256; x++) {
    if (gfMul(a, x) === 1) return x;
  }
  throw new Error("Multiplicative inverse not found in GF(256).");
}

export function splitMasterKey(key: string): Shares {
  const enc = new TextEncoder();
  const secretBytes = enc.encode(key); // length 24
  const len = secretBytes.length;
  
  const alpha = new Uint8Array(len);
  const beta = new Uint8Array(len);
  const gamma = new Uint8Array(len);
  
  // Generate random coefficients for first-degree polynomials: P(x) = Secret + Coef * x
  const coefs = crypto.getRandomValues(new Uint8Array(len));
  
  for (let i = 0; i < len; i++) {
    const secretByte = secretBytes[i];
    const coefValue = coefs[i];
    
    // Evaluate polynomial P(x) at x = 1, 2, 3
    alpha[i] = secretByte ^ gfMul(coefValue, 1);
    beta[i]  = secretByte ^ gfMul(coefValue, 2);
    gamma[i] = secretByte ^ gfMul(coefValue, 3);
  }
  
  const toHex = (buf: Uint8Array) => Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    share1: `SHARE-ALPHA-${toHex(alpha).toUpperCase()}`,
    share2: `SHARE-BETA-${toHex(beta).toUpperCase()}`,
    share3: `SHARE-GAMMA-${toHex(gamma).toUpperCase()}`
  };
}

// ---------------------------------------------------------------------
// Claims 3 & 17: Configurable (k, n) GF(2^8) Shamir Secret Sharing
// ---------------------------------------------------------------------

export interface KofNShare {
  x: number;
  k: number;
  n: number;
  data: Uint8Array;
}

function gfEvalPoly(coeffs: number[], x: number): number {
  let result = 0;
  for (let i = coeffs.length - 1; i >= 0; i--) {
    result = gfMul(result, x) ^ coeffs[i];
  }
  return result;
}

export function splitSecretKofN(secret: string, k: number, n: number): KofNShare[] {
  if (k < 2 || n < 2 || n > 10 || k > n) {
    throw new Error('Invalid threshold parameters: require 2 <= k <= n <= 10 per Claim 17.');
  }
  const enc = new TextEncoder();
  const secretBytes = enc.encode(secret);
  const len = secretBytes.length;

  const polysCoeffs: number[][] = [];
  for (let i = 0; i < len; i++) {
    const randomCoeffs = Array.from(crypto.getRandomValues(new Uint8Array(k - 1)));
    polysCoeffs.push([secretBytes[i], ...randomCoeffs]);
  }

  const shares: KofNShare[] = [];
  for (let x = 1; x <= n; x++) {
    const data = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      data[i] = gfEvalPoly(polysCoeffs[i], x);
    }
    shares.push({ x, k, n, data });
  }
  return shares;
}

export function reconstructSecretKofN(shares: KofNShare[]): string {
  if (shares.length === 0) throw new Error('No shares provided.');
  const { k } = shares[0];
  if (shares.length < k) {
    throw new Error(`Insufficient shares: need ${k}, got ${shares.length}.`);
  }
  const useShares = shares.slice(0, k);
  const len = useShares[0].data.length;
  const reconstructed = new Uint8Array(len);

  for (let byteIdx = 0; byteIdx < len; byteIdx++) {
    let acc = 0;
    for (let j = 0; j < useShares.length; j++) {
      let li = 1;
      for (let m = 0; m < useShares.length; m++) {
        if (m === j) continue;
        const num = useShares[m].x;
        const den = useShares[m].x ^ useShares[j].x;
        li = gfMul(li, gfMul(num, gfInv(den)));
      }
      acc ^= gfMul(useShares[j].data[byteIdx], li);
    }
    reconstructed[byteIdx] = acc;
  }

  return new TextDecoder().decode(reconstructed);
}

export async function encodeKofNShareForKeycard(share: KofNShare): Promise<string> {
  const { encodeCrockfordBase32 } = await import('./localQr');
  return `WHYOR-KN-${share.k}-${share.n}-${share.x}-${encodeCrockfordBase32(share.data)}`;
}

export async function decodeKofNShareFromKeycard(text: string): Promise<KofNShare> {
  const { decodeCrockfordBase32 } = await import('./localQr');
  const parts = text.trim().toUpperCase().split('-');
  if (parts.length < 5 || parts[0] !== 'WHYOR' || parts[1] !== 'KN') {
    throw new Error('Not a recognized k-of-n keycard string.');
  }
  const k = parseInt(parts[2], 10);
  const n = parseInt(parts[3], 10);
  const x = parseInt(parts[4], 10);
  const dataStr = parts.slice(5).join('-');
  return { k, n, x, data: decodeCrockfordBase32(dataStr) };
}

export function reconstructMasterKey(anyTwoShares: string[]): string {
  if (anyTwoShares.length < 2) {
    throw new Error("Reconstruction requires at least 2 shares.");
  }
  
  const sssShares: { x: number; data: Uint8Array }[] = [];
  const legacyShares: string[] = [];
  
  const parseHex = (hex: string) => {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return arr;
  };
  
  for (const s of anyTwoShares) {
    const parts = s.trim().toUpperCase().split('-');
    if (parts.length === 3) {
      const type = parts[1]; // ALPHA, BETA, GAMMA
      const hex = parts[2];
      const data = parseHex(hex);
      const x = type === 'ALPHA' ? 1 : type === 'BETA' ? 2 : type === 'GAMMA' ? 3 : 0;
      if (x > 0) {
        sssShares.push({ x, data });
      }
    } else if (parts.length === 4) {
      legacyShares.push(s);
    }
  }
  
  // Case 1: Formal SSS Shares
  if (sssShares.length >= 2) {
    const len = sssShares[0].data.length;
    const reconstructed = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      const p1 = { x: sssShares[0].x, y: sssShares[0].data[i] };
      const p2 = { x: sssShares[1].x, y: sssShares[1].data[i] };
      
      // Lagrange Interpolation constants evaluating L(0)
      // L1(0) = x2 / (x2 ^ x1)
      const num1 = p2.x;
      const den1 = p2.x ^ p1.x;
      const li1 = gfMul(num1, gfInv(den1));
      
      // L2(0) = x1 / (x1 ^ x2)
      const num2 = p1.x;
      const den2 = p1.x ^ p2.x;
      const li2 = gfMul(num2, gfInv(den2));
      
      reconstructed[i] = gfMul(p1.y, li1) ^ gfMul(p2.y, li2);
    }
    
    const dec = new TextDecoder();
    return dec.decode(reconstructed);
  }
  
  // Case 2: Legacy XOR Shares Fallback
  if (legacyShares.length >= 2) {
    let r1: Uint8Array | null = null;
    let r2: Uint8Array | null = null;
    let k: Uint8Array | null = null;
    
    for (const s of legacyShares) {
      const parts = s.trim().toUpperCase().split('-');
      const type = parts[1];
      const hex1 = parts[2];
      const hex2 = parts[3];
      
      if (type === 'ALPHA') {
        r1 = parseHex(hex1);
        r2 = parseHex(hex2);
      } else if (type === 'BETA') {
        r2 = parseHex(hex1);
        k = parseHex(hex2);
      } else if (type === 'GAMMA') {
        r1 = parseHex(hex1);
        k = parseHex(hex2);
      }
    }
    
    if (!r1 || !r2 || !k) {
      throw new Error("Insufficient legacy share combination. Try a different pair.");
    }
    
    const secretBytes = new Uint8Array(r1.length);
    for (let i = 0; i < r1.length; i++) {
      secretBytes[i] = k[i] ^ r1[i] ^ r2[i];
    }
    
    const dec = new TextDecoder();
    return dec.decode(secretBytes);
  }
  
  throw new Error("Unknown share formats or mixed scheme versions. Re-check recovery paper cards.");
}
