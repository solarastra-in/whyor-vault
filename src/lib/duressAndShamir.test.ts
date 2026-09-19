import { describe, it, expect } from 'vitest';
import { enrollDuressVault, attemptDuressUnlock } from './duressVault';
import { splitSecretKofN, reconstructSecretKofN, encodeKofNShareForKeycard, decodeKofNShareFromKeycard, splitMasterKey, reconstructMasterKey } from './masterKey';
import { encodeCrockfordBase32, decodeCrockfordBase32 } from './localQr';

describe('Claim 9: decoy duress vault', () => {
  it('unlocks with the correct duress passphrase and produces a usable DEK + HKDF base', async () => {
    const config = await enrollDuressVault('my-duress-passphrase', { partitionsToPopulate: ['personal_accounts'] });
    const result = await attemptDuressUnlock('my-duress-passphrase', config);
    expect(result).not.toBeNull();

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, result!.dek, new TextEncoder().encode('decoy content'));
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, result!.dek, ct);
    expect(new TextDecoder().decode(decrypted)).toBe('decoy content');

    // dekHkdfBase derives the same partition sub-keys a real vault would,
    // so decoy-mode items can reuse the normal Claim 2 encryption path.
    const { derivePartitionSubKeyV2 } = await import('./vaultKeys');
    const partitionKey = await derivePartitionSubKeyV2({
      dekHkdfBase: result!.dekHkdfBase,
      partitionId: 'personal_accounts',
      ownerUid: 'owner-1',
      version: 1,
      salt: new Uint8Array(16),
    });
    expect(partitionKey).toBeTruthy();
  });

  it('returns null (not a throw) for the wrong duress passphrase', async () => {
    const config = await enrollDuressVault('correct-duress', { partitionsToPopulate: [] });
    const result = await attemptDuressUnlock('wrong-duress', config);
    expect(result).toBeNull();
  });

  it('config shape matches a primary-vault wrapped-DEK shape (same fields, same rough sizes)', async () => {
    const config = await enrollDuressVault('duress-pass', { partitionsToPopulate: [] });
    expect(typeof config.duressArgonPbkdfSaltB64).toBe('string');
    expect(typeof config.duressWrappedDEK).toBe('string');
    expect(typeof config.duressWrappedDEKIv).toBe('string');
    expect(atob(config.duressWrappedDEK).length).toBe(48);
  });
});

describe('Claim 3/17: configurable k-of-n Shamir SSS', () => {
  it('2-of-3 round trip', () => {
    const shares = splitSecretKofN('MY-SECRET-KEY-VALUE-2468', 2, 3);
    expect(shares).toHaveLength(3);
    const recovered = reconstructSecretKofN([shares[0], shares[2]]);
    expect(recovered).toBe('MY-SECRET-KEY-VALUE-2468');
  });

  it('3-of-5 round trip with a different subset of shares than generation order', () => {
    const shares = splitSecretKofN('ANOTHER-SECRET-VALUE-1357', 3, 5);
    expect(shares).toHaveLength(5);
    const recovered = reconstructSecretKofN([shares[4], shares[1], shares[3]]);
    expect(recovered).toBe('ANOTHER-SECRET-VALUE-1357');
  });

  it('any 2 different pairs of a 2-of-3 split all independently recover the same secret', () => {
    const shares = splitSecretKofN('CONSISTENCY-CHECK-9999', 2, 3);
    const r1 = reconstructSecretKofN([shares[0], shares[1]]);
    const r2 = reconstructSecretKofN([shares[0], shares[2]]);
    const r3 = reconstructSecretKofN([shares[1], shares[2]]);
    expect(r1).toBe('CONSISTENCY-CHECK-9999');
    expect(r2).toBe('CONSISTENCY-CHECK-9999');
    expect(r3).toBe('CONSISTENCY-CHECK-9999');
  });

  it('rejects insufficient shares', () => {
    const shares = splitSecretKofN('SECRET', 3, 5);
    expect(() => reconstructSecretKofN([shares[0], shares[1]])).toThrow();
  });

  it('rejects invalid threshold parameters (k > n, k < 2, n > 10)', () => {
    expect(() => splitSecretKofN('X', 5, 3)).toThrow();
    expect(() => splitSecretKofN('X', 1, 3)).toThrow();
    expect(() => splitSecretKofN('X', 2, 11)).toThrow();
  });

  it('keycard string encode/decode round trip', async () => {
    const shares = splitSecretKofN('KEYCARD-ROUNDTRIP-TEST', 2, 3);
    const keycardStr = await encodeKofNShareForKeycard(shares[0]);
    expect(keycardStr.startsWith('WHYOR-KN-2-3-1-')).toBe(true);
    const decoded = await decodeKofNShareFromKeycard(keycardStr);
    expect(decoded.k).toBe(2);
    expect(decoded.n).toBe(3);
    expect(decoded.x).toBe(1);
    expect(Array.from(decoded.data)).toEqual(Array.from(shares[0].data));
  });

  it('does not break the original hardcoded 2-of-3 splitMasterKey/reconstructMasterKey (backward compat)', () => {
    const key = 'ALPHA!@BRAVO#$1234%^CHAR';
    const shares = splitMasterKey(key);
    const recovered = reconstructMasterKey([shares.share1, shares.share3]);
    expect(recovered).toBe(key);
  });
});

describe('Claim 18: Crockford base-32 keycard encoding', () => {
  it('round-trips arbitrary bytes', () => {
    const original = crypto.getRandomValues(new Uint8Array(24));
    const encoded = encodeCrockfordBase32(original);
    const decoded = decodeCrockfordBase32(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it('excludes ambiguous characters I, L, O, U from its alphabet', () => {
    const bytes = new Uint8Array(64).map((_, i) => i * 4);
    const encoded = encodeCrockfordBase32(bytes);
    expect(encoded).not.toMatch(/[ILOU]/);
  });
});
