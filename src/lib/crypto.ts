/**
 * Zero-knowledge encryption utilities using Web Crypto API.
 * Data is encrypted with AES-GCM 256.
 * The key is derived from answers or master password using PBKDF2.
 */

import { argon2id } from 'hash-wasm';

const ALGO = 'AES-GCM';
const PBKDF2_ITERATIONS = 250000;

export async function deriveKey(passphrase: string, salt: string, hardwareEntropy?: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  let keyMaterialString = passphrase;
  if (hardwareEntropy) {
    keyMaterialString += ":" + hardwareEntropy;
  }
  
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(keyMaterialString),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passphraseKey,
    { name: ALGO, length: 256 },
    false, // extractable: false - Session key never exists as raw bytes in JS heap
    ['encrypt', 'decrypt']
  );
}

/**
 * Derives a partition-specific key using HKDF (RFC 5869)
 */
export async function derivePartitionKey(masterSignature: string, partitionId: string, salt: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterSignature),
    'HKDF',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: enc.encode(salt),
      info: enc.encode(`partition-key-derivation:${partitionId}`)
    },
    baseKey,
    { name: ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Content-addressed attachment DEK & deterministic IV generation
 * Satisfies the requirement: per-file DEK prevents duplicate storage
 */
export async function deriveAttachmentKeyAndIV(
  masterSignature: string, 
  contentHash: string, 
  salt: string
): Promise<{ key: CryptoKey, iv: Uint8Array }> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterSignature),
    'HKDF',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: enc.encode(salt),
      info: enc.encode(`attachment-file-dek:${contentHash}`)
    },
    baseKey,
    { name: ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // Generate a deterministic IV from contentHash and master signature to allow secure client-side deduplication
  const ivMaterial = enc.encode(`${masterSignature}:${contentHash}:iv`);
  const digest = await crypto.subtle.digest('SHA-256', ivMaterial);
  const iv = new Uint8Array(digest).slice(0, 12); // AES-GCM IV is 12 bytes

  return { key, iv };
}

/**
 * Compiles a SHA-256 hex string from an ArrayBuffer content
 */
export async function computeContentHash(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function encryptAttachment(arrayBuffer: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<string> {
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  );
  
  // Convert encrypted bytes to Base64
  const encryptedArray = new Uint8Array(encrypted);
  let binary = '';
  for (let i = 0; i < encryptedArray.length; i++) {
    binary += String.fromCharCode(encryptedArray[i]);
  }
  return btoa(binary);
}

export async function decryptAttachment(base64Payload: string, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> {
  const binaryString = atob(base64Payload);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    bytes
  );
}

export async function encrypt(data: any, key: CryptoKey, associatedData?: string): Promise<string> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = enc.encode(JSON.stringify(data));
  const encodedAD = associatedData ? enc.encode(associatedData) : undefined;

  const encrypted = await crypto.subtle.encrypt(
    { 
      name: ALGO, 
      iv,
      additionalData: encodedAD
    },
    key,
    encodedData
  );

  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);

  // Padding to nearest 256-byte boundary to mask original data length
  const targetLength = Math.ceil(combined.length / 256) * 256;
  const paddedResult = new Uint8Array(targetLength + 4); 
  paddedResult.set(combined.slice(0), 4);
  
  const view = new DataView(paddedResult.buffer);
  view.setUint32(0, combined.length);

  return btoa(String.fromCharCode(...paddedResult));
}

export async function decrypt(encryptedBase64: string, key: CryptoKey, associatedData?: string): Promise<any> {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const binaryString = atob(encryptedBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const view = new DataView(bytes.buffer);
  const actualLength = view.getUint32(0);
  const combined = bytes.slice(4, 4 + actualLength);

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const encodedAD = associatedData ? enc.encode(associatedData) : undefined;

  try {
    const decrypted = await crypto.subtle.decrypt(
      { 
        name: ALGO, 
        iv,
        additionalData: encodedAD
      },
      key,
      data
    );
    return JSON.parse(dec.decode(decrypted));
  } catch (e) {
    throw new Error('Decryption failed. Integrity check failed or invalid key.');
  }
}

export async function hashAnswer(answer: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(answer.toLowerCase().trim() + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeSignature(hashes: string[]): Promise<string> {
  return hashes.join('|');
}

export async function hashSignature(signature: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(signature + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashMasterKeyPBKDF2(key: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(key), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 600000, hash: 'SHA-256' }, keyMaterial, 256);
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashMasterKey(key: string, salt: string): Promise<string> {
  // REQUIREMENT 4: Use Argon2id specifically for the master key path
  try {
    const saltBytes = new TextEncoder().encode(salt);
    // hash-wasm Argon2 options
    const hash = await argon2id({
      password: key,
      salt: saltBytes,
      iterations: 2,
      memorySize: 65536, // 64MB
      parallelism: 1,
      hashLength: 32,
      outputType: 'hex',
    });
    return hash;
  } catch (err) {
    console.warn("Argon2 hash failed, falling back to PBKDF2", err);
    return hashMasterKeyPBKDF2(key, salt);
  }
}

export function generateSalt(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

const PEPPERS: Record<string, string> = {
  "v1": "WhyOrSecureFingerprintPepper2026DefaultSecretAndSufficiencyToken!",
};

export const CURRENT_PEPPER_VERSION = "v1";

export function getPepper(version?: string): string {
  return PEPPERS[version || "v1"] || PEPPERS["v1"];
}

export async function hmacSignature(signature: string, salt: string, pepper: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMsg = enc.encode(pepper);
  const key = await crypto.subtle.importKey(
    'raw',
    keyMsg,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );
  const data = enc.encode(signature + salt);
  const sigBuffer = await crypto.subtle.sign('HMAC', key, data);
  const hashArray = Array.from(new Uint8Array(sigBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function serverHmacSignature(signature: string, salt: string, version: string = CURRENT_PEPPER_VERSION): Promise<string> {
  const localFallback = () => hmacSignature(signature, salt, getPepper(version));

  const serverTask = async (): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('/api/hmac', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ signature, salt, version })
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data && data.signatureHash) {
          return data.signatureHash;
        }
      }
      throw new Error(`Non-ok server response: ${response.status}`);
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  };

  const timeoutTask = new Promise<string>((_, reject) => 
    setTimeout(() => reject(new Error("Server HMAC fetch timed out after 10000ms")), 10000)
  );

  return Promise.race([serverTask(), timeoutTask]).catch(err => {
    console.warn("Server HMAC endpoint timed out/failed. Executing local fallback signature (client-side secret):", err);
    return localFallback();
  });
}

export function timingSafeEqual(a: string, b: string): boolean {
  const dummy = a;
  const match = a.length === b.length;
  const len = match ? a.length : dummy.length;
  let result = 0;
  for (let i = 0; i < len; i++) {
    const charA = a.charCodeAt(i);
    const charB = match ? b.charCodeAt(i) : dummy.charCodeAt(i);
    result |= charA ^ charB;
  }
  return match && result === 0;
}


