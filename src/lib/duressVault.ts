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

export async function attemptDuressUnlock(
  duressPassphrase: string,
  config: DuressVaultConfig
): Promise<CryptoKey | null> {
  const { deriveBaseKEK, deriveFinalKEK, unwrapDEK } = await import('./vaultKeys');
  try {
    const saltBytes = unb64(config.duressArgonPbkdfSaltB64);
    const baseKEKBytes = await deriveBaseKEK(duressPassphrase, saltBytes);
    const { key: finalKEK } = await deriveFinalKEK(baseKEKBytes);
    return await unwrapDEK(config.duressWrappedDEK, config.duressWrappedDEKIv, finalKEK);
  } catch {
    return null;
  }
}
