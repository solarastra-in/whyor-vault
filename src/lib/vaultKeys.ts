/**
 * vaultKeys.ts
 * -----------------------------------------------------------------------
 * Two-tier Key-Encrypting-Key (KEK) / Data-Encryption-Key (DEK) vault key
 * architecture, implementing WHYOR-001-PPA Claims 1, 2, 5, 12, 14.
 * -----------------------------------------------------------------------
 */

import { argon2id } from 'hash-wasm';

const AES = 'AES-GCM';
export const ARGON2ID_MEMORY_KB = 65536; // 64 MB, satisfies Claim 1(a) "at least 64 MB"
export const ARGON2ID_ITERATIONS = 3;    // OWASP min for Argon2id at 64MB/1 lane is 3
export const ARGON2ID_PARALLELISM = 1;
export const PBKDF2_ITERATIONS = 600_000; // satisfies Claim 1(b) "at least 600,000"
export const KDF_VERSION_CURRENT = 2;

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  return out;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
}

// Claim 13: passphrase entropy enforcement at vault creation. Estimates the
// entropy of a candidate secret in bits using a conservative
// character-class-pool model (the same floor NIST SP 800-63B Appendix A
// uses), discounted for repeated characters, and rejects secrets below a
// threshold expressed in bits. This is deliberately independent of the KDF
// parameters above: Argon2id/PBKDF2 slow down brute force per guess, but
// cannot fix a low-entropy input -- a predictable answer produces a weak
// vault no matter how many iterations wrap it, so this check runs before
// any of that cascade.
export const MIN_ANSWER_ENTROPY_BITS = 20;

export function estimateEntropyBits(input: string): number {
  const trimmed = input.trim();
  if (trimmed.length === 0) return 0;
  let poolSize = 0;
  if (/[a-z]/.test(trimmed)) poolSize += 26;
  if (/[A-Z]/.test(trimmed)) poolSize += 26;
  if (/[0-9]/.test(trimmed)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(trimmed)) poolSize += 32;
  if (poolSize === 0) poolSize = 1;
  const uniqueChars = new Set(trimmed.split('')).size;
  // Repetition penalty: "aaaaaa" (1 unique char over 6) scores near zero;
  // fully non-repeating strings score at full length.
  const repetitionPenalty = uniqueChars / trimmed.length;
  return trimmed.length * Math.log2(poolSize) * repetitionPenalty;
}

export interface EntropyValidation {
  valid: boolean;
  bits: number;
  error?: string;
}

export function validateAnswerEntropy(answer: string): EntropyValidation {
  const bits = estimateEntropyBits(answer);
  if (bits < MIN_ANSWER_ENTROPY_BITS) {
    return {
      valid: false,
      bits,
      error: `Too predictable (~${bits.toFixed(0)} bits; needs at least ${MIN_ANSWER_ENTROPY_BITS}). Use a longer or less guessable answer.`,
    };
  }
  return { valid: true, bits };
}

export function generateSaltBytes(len = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(len));
}

// Claim 1(a)/(b)/(c): dual-route KDF cascade -> Base KEK

async function argon2idRaw(passphrase: string, salt: Uint8Array): Promise<Uint8Array> {
  const hex = await argon2id({
    password: passphrase,
    salt,
    iterations: ARGON2ID_ITERATIONS,
    memorySize: ARGON2ID_MEMORY_KB,
    parallelism: ARGON2ID_PARALLELISM,
    hashLength: 32,
    outputType: 'hex',
  });
  return hexToBytes(hex);
}

async function pbkdf2Raw(passphrase: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

export async function deriveBaseKEK(passphrase: string, saltBytes: Uint8Array): Promise<Uint8Array> {
  const [argonOut, pbkdf2Out] = await Promise.all([
    argon2idRaw(passphrase, saltBytes),
    pbkdf2Raw(passphrase, saltBytes),
  ]);
  const digest = await crypto.subtle.digest('SHA-256', concatBytes(argonOut, pbkdf2Out));
  return new Uint8Array(digest);
}

// Claim 1(d)/(e)/11/14: WebAuthn PRF fusion -> Final KEK

export interface FinalKekResult {
  key: CryptoKey;      // non-extractable AES-256-GCM CryptoKey (Claim 12)
  usedPRF: boolean;     // false triggers Claim 14 security advisory
}

export async function deriveFinalKEK(
  baseKEKBytes: Uint8Array,
  prfOutput?: ArrayBuffer
): Promise<FinalKekResult> {
  if (!prfOutput) {
    const key = await crypto.subtle.importKey(
      'raw', baseKEKBytes, { name: AES, length: 256 }, false,
      ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
    return { key, usedPRF: false };
  }

  const combined = concatBytes(baseKEKBytes, new Uint8Array(prfOutput));
  const hkdfBase = await crypto.subtle.importKey('raw', combined, 'HKDF', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: new TextEncoder().encode('whyor-final-kek-v2'),
    },
    hkdfBase,
    { name: AES, length: 256 },
    false,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );
  return { key, usedPRF: true };
}

// Master DEK: generation, wrapping, unwrapping (Claims 1(f), 12)

export async function generateMasterDEK(): Promise<{ key: CryptoKey; raw: Uint8Array }> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const key = await crypto.subtle.importKey(
    'raw', raw, { name: AES, length: 256 }, false,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );
  return { key, raw };
}

export async function wrapDEK(dekRaw: Uint8Array, finalKEK: CryptoKey): Promise<{ wrapped: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ctBuf = await crypto.subtle.encrypt({ name: AES, iv }, finalKEK, dekRaw);
  return { wrapped: bytesToB64(new Uint8Array(ctBuf)), iv: bytesToB64(iv) };
}

export async function unwrapDEK(wrappedB64: string, ivB64: string, finalKEK: CryptoKey): Promise<CryptoKey> {
  const ptBuf = await crypto.subtle.decrypt(
    { name: AES, iv: b64ToBytes(ivB64) }, finalKEK, b64ToBytes(wrappedB64)
  );
  const rawDek = new Uint8Array(ptBuf);
  const key = await crypto.subtle.importKey('raw', rawDek, { name: AES, length: 256 }, false, ['encrypt', 'decrypt']);
  rawDek.fill(0);
  return key;
}

export async function importDekAsHkdfBase(dekRaw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', dekRaw, 'HKDF', false, ['deriveKey', 'deriveBits']);
}

// Claim 2: HKDF partition sub-keys with version + partition + owner UID

export interface PartitionKeyOptions {
  dekHkdfBase: CryptoKey;
  partitionId: string;
  ownerUid: string;
  version: number;
  salt: Uint8Array;
}

export async function derivePartitionSubKeyV2(opts: PartitionKeyOptions): Promise<CryptoKey> {
  const info = new TextEncoder().encode(
    `whyor-partition-v${opts.version}:${opts.partitionId}:${opts.ownerUid}`
  );
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: opts.salt, info },
    opts.dekHkdfBase,
    { name: AES, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function derivePartitionSubKeyRawV2(opts: PartitionKeyOptions): Promise<Uint8Array> {
  const info = new TextEncoder().encode(
    `whyor-partition-v${opts.version}:${opts.partitionId}:${opts.ownerUid}`
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: opts.salt, info },
    opts.dekHkdfBase,
    256
  );
  return new Uint8Array(bits);
}

export const PARTITION_TAXONOMY = [
  'personal_accounts',
  'family_joint',
  'wills_trust',
  'insurance',
  'medical_healthcare',
  'digital_assets',
  'emergency_access',
  'shared_documents',
] as const;
export type PartitionId = typeof PARTITION_TAXONOMY[number];

// Claim 5: content-addressed file DEK + HKDF-derived deterministic IV

export interface FileKeyMaterial {
  fileKey: CryptoKey;
  iv: Uint8Array;
}

export async function deriveFileKeyMaterial(
  dekHkdfBase: CryptoKey,
  contentHashHex: string,
  vaultSalt: Uint8Array
): Promise<FileKeyMaterial> {
  const enc = new TextEncoder();
  const fileKey = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: vaultSalt, info: enc.encode(`whyor-file-dek:${contentHashHex}`) },
    dekHkdfBase,
    { name: AES, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const ivBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: vaultSalt, info: enc.encode(`whyor-file-iv:${contentHashHex}`) },
    dekHkdfBase,
    96
  );

  return { fileKey, iv: new Uint8Array(ivBits) };
}

// Vault creation & unlock

export interface NewVaultKeyMaterial {
  kdfVersion: number;
  argonPbkdfSaltB64: string;
  wrappedDEK: string;
  wrappedDEKIv: string;
  dek: CryptoKey;
  dekHkdfBase: CryptoKey;
  usedPRF: boolean;
}

export async function createNewVaultKeyMaterial(
  passphrase: string,
  prfOutput?: ArrayBuffer
): Promise<NewVaultKeyMaterial> {
  const saltBytes = generateSaltBytes(16);
  const baseKEKBytes = await deriveBaseKEK(passphrase, saltBytes);
  const { key: finalKEK, usedPRF } = await deriveFinalKEK(baseKEKBytes, prfOutput);

  const { key: dek, raw: dekRaw } = await generateMasterDEK();
  const dekHkdfBase = await importDekAsHkdfBase(dekRaw);
  const { wrapped, iv } = await wrapDEK(dekRaw, finalKEK);
  dekRaw.fill(0);

  return {
    kdfVersion: KDF_VERSION_CURRENT,
    argonPbkdfSaltB64: bytesToB64(saltBytes),
    wrappedDEK: wrapped,
    wrappedDEKIv: iv,
    dek,
    dekHkdfBase,
    usedPRF,
  };
}

export async function unlockV2Vault(
  passphrase: string,
  argonPbkdfSaltB64: string,
  wrappedDEK: string,
  wrappedDEKIv: string,
  prfOutput?: ArrayBuffer
): Promise<{ dek: CryptoKey; dekHkdfBase: CryptoKey; usedPRF: boolean }> {
  const saltBytes = b64ToBytes(argonPbkdfSaltB64);
  const baseKEKBytes = await deriveBaseKEK(passphrase, saltBytes);
  const { key: finalKEK, usedPRF } = await deriveFinalKEK(baseKEKBytes, prfOutput);

  const ptBuf = await crypto.subtle.decrypt(
    { name: AES, iv: b64ToBytes(wrappedDEKIv) }, finalKEK, b64ToBytes(wrappedDEK)
  );
  const rawDek = new Uint8Array(ptBuf);
  const dek = await crypto.subtle.importKey('raw', rawDek, { name: AES, length: 256 }, false, ['encrypt', 'decrypt']);
  const dekHkdfBase = await importDekAsHkdfBase(rawDek);
  rawDek.fill(0);

  return { dek, dekHkdfBase, usedPRF };
}

/**
 * Variant of unlockV2Vault that returns the unwrapped raw DEK bytes in
 * addition to the imported CryptoKeys, so a caller can populate a short-lived,
 * hardware-bound quick-unlock cache. The caller is responsible for zeroing
 * dekRawForCache (e.g. via .fill(0)) once cached.
 */
export async function unlockV2VaultWithCacheableDek(
  passphrase: string,
  argonPbkdfSaltB64: string,
  wrappedDEK: string,
  wrappedDEKIv: string,
  prfOutput?: ArrayBuffer
): Promise<{ dek: CryptoKey; dekHkdfBase: CryptoKey; usedPRF: boolean; dekRawForCache: Uint8Array }> {
  const saltBytes = b64ToBytes(argonPbkdfSaltB64);
  const baseKEKBytes = await deriveBaseKEK(passphrase, saltBytes);
  const { key: finalKEK, usedPRF } = await deriveFinalKEK(baseKEKBytes, prfOutput);

  const ptBuf = await crypto.subtle.decrypt(
    { name: AES, iv: b64ToBytes(wrappedDEKIv) }, finalKEK, b64ToBytes(wrappedDEK)
  );
  const rawDek = new Uint8Array(ptBuf);
  const dek = await crypto.subtle.importKey('raw', rawDek, { name: AES, length: 256 }, false, ['encrypt', 'decrypt']);
  const dekHkdfBase = await importDekAsHkdfBase(rawDek);
  const dekRawForCache = rawDek.slice();
  rawDek.fill(0);

  return { dek, dekHkdfBase, usedPRF, dekRawForCache };
}

/**
 * Reconstructs the {dek, dekHkdfBase} pair from raw DEK bytes recovered from
 * a hardware-bound quick-unlock cache. Bypasses the expensive KDF cascade
 * without altering the resulting session keys.
 */
export async function importCachedDekRaw(rawDek: Uint8Array): Promise<{ dek: CryptoKey; dekHkdfBase: CryptoKey }> {
  const dek = await crypto.subtle.importKey('raw', rawDek, { name: AES, length: 256 }, false, ['encrypt', 'decrypt']);
  const dekHkdfBase = await importDekAsHkdfBase(rawDek);
  return { dek, dekHkdfBase };
}

export interface RekeyResult {
  wrappedDEK: string;
  wrappedDEKIv: string;
  usedPRF: boolean;
}

/**
 * Claim 14 follow-through: lets a vault that was created without a WebAuthn
 * hardware authenticator (Final KEK = Base KEK, the documented fallback)
 * add one afterward, closing the "reduced security level" the app now
 * surfaces to the owner as an advisory. Re-wraps the *existing* DEK under a
 * new Final KEK that mixes in the freshly-enrolled PRF output -- the DEK's
 * raw bytes never leave this function (unwrapped, immediately re-wrapped,
 * then zeroed), and because the DEK itself is unchanged, every item, file,
 * and partition key already derived from it stays valid. Only the outer
 * wrapping changes.
 */
export async function rekeyVaultWithHardwareAuthenticator(
  passphrase: string,
  argonPbkdfSaltB64: string,
  oldWrappedDEK: string,
  oldWrappedDEKIv: string,
  newPrfOutput: ArrayBuffer
): Promise<RekeyResult> {
  const saltBytes = b64ToBytes(argonPbkdfSaltB64);
  const baseKEKBytes = await deriveBaseKEK(passphrase, saltBytes);

  // Unwrap under the current (no-PRF) Final KEK == Base KEK.
  const { key: oldFinalKEK } = await deriveFinalKEK(baseKEKBytes, undefined);
  const ptBuf = await crypto.subtle.decrypt(
    { name: AES, iv: b64ToBytes(oldWrappedDEKIv) }, oldFinalKEK, b64ToBytes(oldWrappedDEK)
  );
  const rawDek = new Uint8Array(ptBuf);

  // Re-wrap under a new Final KEK that mixes in the newly-enrolled PRF output.
  const { key: newFinalKEK, usedPRF } = await deriveFinalKEK(baseKEKBytes, newPrfOutput);
  const { wrapped, iv } = await wrapDEK(rawDek, newFinalKEK);
  rawDek.fill(0);

  return { wrappedDEK: wrapped, wrappedDEKIv: iv, usedPRF };
}
