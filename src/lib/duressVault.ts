/**
 * duressVault.ts
 * -----------------------------------------------------------------------
 * Cryptographically indistinguishable decoy partition for coercive
 * access scenarios. Implements WHYOR-001-PPA Claim 9.
 * -----------------------------------------------------------------------
 */

function b64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface DuressVaultConfig {
  duressArgonPbkdfSaltB64: string;
  duressWrappedDEK: string;
  duressWrappedDEKIv: string;
}

export async function enrollDuressVault(
  duressPassphrase: string,
  substituteContentSeed: { partitionsToPopulate: string[] }
): Promise<DuressVaultConfig> {
  const { deriveBaseKEK, deriveFinalKEK, generateMasterDEK, wrapDEK, generateSaltBytes } = await import('./vaultKeys');

  const saltBytes = generateSaltBytes(16);
  const baseKEKBytes = await deriveBaseKEK(duressPassphrase, saltBytes);
  const { key: finalKEK } = await deriveFinalKEK(baseKEKBytes);
  const { raw: dekRaw } = await generateMasterDEK();
  const { wrapped, iv } = await wrapDEK(dekRaw, finalKEK);
  dekRaw.fill(0);

  void substituteContentSeed;

  return {
    duressArgonPbkdfSaltB64: b64(saltBytes),
    duressWrappedDEK: wrapped,
    duressWrappedDEKIv: iv,
  };
}

export interface DuressUnlockResult {
  dek: CryptoKey;
  dekHkdfBase: CryptoKey;
}

/**
 * Attempts to unlock the decoy partition with a candidate passphrase.
 * Returns null on any mismatch/failure (wrong passphrase, no duress vault
 * enrolled) -- callers should fall through to the normal unlock path
 * rather than surface a distinct error, so a coerced owner isn't tipped
 * off that a "duress vault" concept exists at all.
 */
export async function attemptDuressUnlock(
  duressPassphrase: string,
  config: DuressVaultConfig
): Promise<DuressUnlockResult | null> {
  const { deriveBaseKEK, deriveFinalKEK, unwrapDEK, importDekAsHkdfBase } = await import('./vaultKeys');
  try {
    const saltBytes = unb64(config.duressArgonPbkdfSaltB64);
    const baseKEKBytes = await deriveBaseKEK(duressPassphrase, saltBytes);
    const { key: finalKEK } = await deriveFinalKEK(baseKEKBytes);
    const dek = await unwrapDEK(config.duressWrappedDEK, config.duressWrappedDEKIv, finalKEK);
    // unwrapDEK returns a non-extractable CryptoKey; re-derive a parallel
    // HKDF base the same way vaultKeys.ts does at real unlock, so decoy
    // vault items can use the same partition-sub-key machinery as a real
    // vault (see attemptDuressUnlock's caller in App.tsx).
    const ptBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(config.duressWrappedDEKIv) },
      finalKEK,
      unb64(config.duressWrappedDEK)
    );
    const rawDek = new Uint8Array(ptBuf);
    const dekHkdfBase = await importDekAsHkdfBase(rawDek);
    rawDek.fill(0);
    return { dek, dekHkdfBase };
  } catch {
    return null;
  }
}
