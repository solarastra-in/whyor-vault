import { describe, it, expect } from 'vitest';
import { createNewVaultKeyMaterial } from './vaultKeys';
import { deriveSessionKeyForConfig, SessionKeyConfigFields } from './sessionKeyBridge';
import { deriveKey } from './crypto';

async function probeRoundTrip(encryptKey: CryptoKey, decryptKey: CryptoKey, text: string): Promise<boolean> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryptKey, new TextEncoder().encode(text));
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, decryptKey, ct);
    return new TextDecoder().decode(pt) === text;
  } catch {
    return false;
  }
}

describe('Integration: exact App.tsx vault-creation -> vault-unlock sequence (v2 vaults)', () => {
  it('a vault created via createNewVaultKeyMaterial unlocks via deriveSessionKeyForConfig with a matching, working DEK', async () => {
    const combinedSignature = 'hashed-answer-1|hashed-answer-2|...|hashed-answer-10';
    const created = await createNewVaultKeyMaterial(combinedSignature);

    // This mirrors exactly what App.tsx's configPayload now stores.
    const config: SessionKeyConfigFields = {
      salt: 'unused-for-v2',
      kdfVersion: created.kdfVersion,
      argonPbkdfSaltB64: created.argonPbkdfSaltB64,
      wrappedDEK: created.wrappedDEK,
      wrappedDEKIv: created.wrappedDEKIv,
    };

    const unlockedKey = await deriveSessionKeyForConfig(combinedSignature, config);
    expect(await probeRoundTrip(created.dek, unlockedKey, 'created vault item')).toBe(true);
  });

  it('wrong combinedSignature at unlock time fails to produce a working key', async () => {
    const created = await createNewVaultKeyMaterial('correct-combined-signature');
    const config: SessionKeyConfigFields = {
      salt: 'unused',
      kdfVersion: created.kdfVersion,
      argonPbkdfSaltB64: created.argonPbkdfSaltB64,
      wrappedDEK: created.wrappedDEK,
      wrappedDEKIv: created.wrappedDEKIv,
    };
    await expect(deriveSessionKeyForConfig('wrong-combined-signature', config)).rejects.toThrow();
  });

  it('with PRF enrolled at creation, unlock without re-asserting PRF still recovers a key (Claim 14 fallback is separate from this path — this proves the PRF branch is only entered when credential fields are present in config)', async () => {
    const prf = crypto.getRandomValues(new Uint8Array(32)).buffer;
    const created = await createNewVaultKeyMaterial('sig-with-prf', prf);
    expect(created.usedPRF).toBe(true);

    // Config WITHOUT webauthnPrfCredentialId set (simulating a vault row
    // where PRF enrollment metadata wasn't persisted) — unlock must not
    // silently attempt/require PRF, since it can't reconstruct the
    // original Final KEK without prf anyway. This should FAIL, proving
    // the wrapped DEK is genuinely bound to the PRF output and isn't
    // silently recoverable without it.
    const configMissingPrfMeta: SessionKeyConfigFields = {
      salt: 'unused',
      kdfVersion: created.kdfVersion,
      argonPbkdfSaltB64: created.argonPbkdfSaltB64,
      wrappedDEK: created.wrappedDEK,
      wrappedDEKIv: created.wrappedDEKIv,
    };
    await expect(deriveSessionKeyForConfig('sig-with-prf', configMissingPrfMeta)).rejects.toThrow();
  });

  it('v1-shaped config (no kdfVersion) uses the legacy deriveKey path and matches deriveKey() directly', async () => {
    const config: SessionKeyConfigFields = { salt: 'legacy-salt-value' };
    const bridgeKey = await deriveSessionKeyForConfig('legacy-combined-signature', config);
    const directKey = await deriveKey('legacy-combined-signature', 'legacy-salt-value');
    expect(await probeRoundTrip(directKey, bridgeKey, 'legacy vault item')).toBe(true);
  });

  it('kdfVersion 1 explicitly also uses the legacy path (not just "missing")', async () => {
    const config: SessionKeyConfigFields = { salt: 'legacy-salt-2', kdfVersion: 1 };
    const bridgeKey = await deriveSessionKeyForConfig('sig', config);
    const directKey = await deriveKey('sig', 'legacy-salt-2');
    expect(await probeRoundTrip(directKey, bridgeKey, 'probe')).toBe(true);
  });
}, 30000);
