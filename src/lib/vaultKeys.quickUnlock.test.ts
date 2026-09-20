import { describe, it, expect } from 'vitest';
import { createNewVaultKeyMaterial, unlockV2VaultWithCacheableDek, importCachedDekRaw } from './vaultKeys';

describe('Quick-unlock cacheable DEK path (vaultKeys.ts)', () => {
  it('unlockV2VaultWithCacheableDek produces the same {dek, dekHkdfBase} a normal unlock would, plus the raw bytes to cache', async () => {
    const passphrase = 'correct horse battery staple quick-unlock test';
    const material = await createNewVaultKeyMaterial(passphrase);

    const cacheable = await unlockV2VaultWithCacheableDek(
      passphrase, material.argonPbkdfSaltB64, material.wrappedDEK, material.wrappedDEKIv
    );

    expect(cacheable.dekRawForCache).toBeInstanceOf(Uint8Array);
    expect(cacheable.dekRawForCache.length).toBe(32);

    // Prove cacheable.dek decrypts identically to the original creation-time DEK.
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, material.dek, new TextEncoder().encode('hello vault'));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cacheable.dek, ct);
    expect(new TextDecoder().decode(pt)).toBe('hello vault');
  });

  it('importCachedDekRaw reconstructs a {dek, dekHkdfBase} pair usable exactly like a fresh unlock -- the whole point of the quick-unlock path', async () => {
    const passphrase = 'another passphrase entirely, quick-unlock round trip';
    const material = await createNewVaultKeyMaterial(passphrase);

    const cacheable = await unlockV2VaultWithCacheableDek(
      passphrase, material.argonPbkdfSaltB64, material.wrappedDEK, material.wrappedDEKIv
    );
    const dekRawCopy = cacheable.dekRawForCache.slice(); // simulate "recovered from the local cache"

    const reimported = await importCachedDekRaw(dekRawCopy);

    // Both the freshly-derived dek AND the cache-reimported dek must
    // encrypt/decrypt interchangeably -- proving the quick-unlock path
    // yields a cryptographically identical session to the slow path.
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, reimported.dek, new TextEncoder().encode('quick unlock works'));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, material.dek, ct);
    expect(new TextDecoder().decode(pt)).toBe('quick unlock works');

    // And the HKDF base reproduces the same partition sub-key either way.
    const { derivePartitionSubKeyV2 } = await import('./vaultKeys');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const kFromOriginal = await derivePartitionSubKeyV2({ dekHkdfBase: material.dekHkdfBase, partitionId: 'Family Joint', ownerUid: 'owner-x', version: 1, salt });
    const kFromCache = await derivePartitionSubKeyV2({ dekHkdfBase: reimported.dekHkdfBase, partitionId: 'Family Joint', ownerUid: 'owner-x', version: 1, salt });

    const iv2 = crypto.getRandomValues(new Uint8Array(12));
    const ct2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv2 }, kFromOriginal, new TextEncoder().encode('same partition key'));
    const pt2 = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv2 }, kFromCache, ct2);
    expect(new TextDecoder().decode(pt2)).toBe('same partition key');
  });
});
