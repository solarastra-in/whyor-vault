/**
 * sessionKeyBridge.ts
 * -----------------------------------------------------------------------
 * The single v1/v2 branch point used by every vault-unlock path in
 * App.tsx (biometric convenience unlock, manual Q&A unlock, master-key
 * escrow recovery unlock). Extracted to its own module — rather than
 * being a local function inside App.tsx — specifically so it can be
 * imported and executed by a real test (see sessionKeyBridge.test.ts),
 * instead of only being checkable by reading the diff.
 * -----------------------------------------------------------------------
 */
import { deriveKey } from './crypto';
import { unlockV2Vault, KDF_VERSION_CURRENT } from './vaultKeys';
import { getWebAuthnPRFOutputForAssertion } from './webauthn';

// Minimal shape this module actually needs from App.tsx's VaultConfig —
// kept narrow so this file doesn't have to import the whole App.tsx type.
export interface SessionKeyConfigFields {
  salt: string;
  kdfVersion?: number;
  argonPbkdfSaltB64?: string;
  wrappedDEK?: string;
  wrappedDEKIv?: string;
  webauthnPrfCredentialId?: string;
  webauthnPrfSaltB64?: string;
}

export interface SessionMaterial {
  dek: CryptoKey;
  // Claim 2: only present for v2 (kdfVersion === KDF_VERSION_CURRENT)
  // vaults -- the HKDF base key partition sub-keys derive from. v1 vaults
  // have no DEK (their session key IS the direct PBKDF2 output), so there
  // is nothing to derive partition sub-keys from per Claim 2(a)'s "master
  // DEK" requirement; callers fall back to the legacy signature-based
  // derivePartitionKey() for those.
  dekHkdfBase?: CryptoKey;
}

/**
 * v1 vaults (kdfVersion missing or 1): unchanged legacy path, single
 * PBKDF2-250k via crypto.ts's deriveKey(). Existing vaults keep working
 * exactly as before.
 *
 * v2 vaults (kdfVersion === 2): real Claim 1 dual-KDF cascade + optional
 * WebAuthn PRF fusion via vaultKeys.ts's unlockV2Vault(). A failed or
 * declined PRF assertion is not fatal — it falls back to
 * Final KEK = Base KEK per Claim 14.
 */
export async function deriveSessionMaterialForConfig(
  secretSignature: string,
  config: SessionKeyConfigFields
): Promise<SessionMaterial> {
  if (config.kdfVersion === KDF_VERSION_CURRENT && config.argonPbkdfSaltB64 && config.wrappedDEK && config.wrappedDEKIv) {
    let prfOutput: ArrayBuffer | undefined;
    if (config.webauthnPrfCredentialId && config.webauthnPrfSaltB64) {
      try {
        const prfSaltBytes = Uint8Array.from(atob(config.webauthnPrfSaltB64), c => c.charCodeAt(0));
        prfOutput = await getWebAuthnPRFOutputForAssertion(config.webauthnPrfCredentialId, prfSaltBytes.buffer);
      } catch (e) {
        console.warn('PRF re-assertion failed at unlock; falling back to passphrase-only KEK (Claim 14).', e);
      }
    }
    const { dek, dekHkdfBase } = await unlockV2Vault(secretSignature, config.argonPbkdfSaltB64, config.wrappedDEK, config.wrappedDEKIv, prfOutput);
    return { dek, dekHkdfBase };
  }
  return { dek: await deriveKey(secretSignature, config.salt) };
}

/**
 * Back-compat wrapper kept for existing callers/tests that only need the
 * session key itself, not the partition-key HKDF base.
 */
export async function deriveSessionKeyForConfig(
  secretSignature: string,
  config: SessionKeyConfigFields
): Promise<CryptoKey> {
  const { dek } = await deriveSessionMaterialForConfig(secretSignature, config);
  return dek;
}
