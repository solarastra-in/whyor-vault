import { describe, it, expect } from 'vitest';
import {
  deriveBaseKEK, deriveFinalKEK, generateMasterDEK, wrapDEK, unwrapDEK,
  importDekAsHkdfBase, derivePartitionSubKeyV2, deriveFileKeyMaterial,
  createNewVaultKeyMaterial, unlockV2Vault, generateSaltBytes,
} from './vaultKeys';

describe('Claim 1(a)-(c): dual-route KDF cascade -> Base KEK', () => {
  it('produces a 256-bit (32-byte) Base KEK', async () => {
    const salt = generateSaltBytes(16);
    const kek = await deriveBaseKEK('correct horse battery staple', salt);
    expect(kek.length).toBe(32);
  });

  it('is deterministic for the same passphrase + salt', async () => {
    const salt = generateSaltBytes(16);
    const k1 = await deriveBaseKEK('my-passphrase', salt);
    const k2 = await deriveBaseKEK('my-passphrase', salt);
    expect(Array.from(k1)).toEqual(Array.from(k2));
  });

  it('differs for different passphrases with the same salt', async () => {
    const salt = generateSaltBytes(16);
    const k1 = await deriveBaseKEK('passphrase-A', salt);
    const k2 = await deriveBaseKEK('passphrase-B', salt);
    expect(Array.from(k1)).not.toEqual(Array.from(k2));
  });

  it('differs for the same passphrase with different salts', async () => {
    const k1 = await deriveBaseKEK('same-passphrase', generateSaltBytes(16));
    const k2 = await deriveBaseKEK('same-passphrase', generateSaltBytes(16));
    expect(Array.from(k1)).not.toEqual(Array.from(k2));
  });
});

describe('Claim 1(d)/(e)/14: WebAuthn PRF fusion -> Final KEK', () => {
  it('without PRF, Final KEK equals Base KEK (Claim 14 fallback)', async () => {
    const salt = generateSaltBytes(16);
    const baseKEK = await deriveBaseKEK('pass', salt);
    const { key, usedPRF } = await deriveFinalKEK(baseKEK);
    expect(usedPRF).toBe(false);
    const rawBaseKey = await crypto.subtle.importKey('raw', baseKEK, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const pt = new TextEncoder().encode('probe');
    const ctViaBase = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, rawBaseKey, pt);
    const decryptedViaFinal = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ctViaBase);
    expect(new TextDecoder().decode(decryptedViaFinal)).toBe('probe');
  });

  it('with PRF, Final KEK differs from Base KEK', async () => {
    const salt = generateSaltBytes(16);
    const baseKEK = await deriveBaseKEK('pass', salt);
    const prfOutput = crypto.getRandomValues(new Uint8Array(32)).buffer;
    const { key, usedPRF } = await deriveFinalKEK(baseKEK, prfOutput);
    expect(usedPRF).toBe(true);
    const rawBaseKey = await crypto.subtle.importKey('raw', baseKEK, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ctViaBase = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, rawBaseKey, new TextEncoder().encode('probe'));
    await expect(crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ctViaBase)).rejects.toThrow();
  });

  it('different PRF outputs produce different Final KEKs (device-binding)', async () => {
    const salt = generateSaltBytes(16);
    const baseKEK = await deriveBaseKEK('pass', salt);
    const prf1 = crypto.getRandomValues(new Uint8Array(32)).buffer;
    const prf2 = crypto.getRandomValues(new Uint8Array(32)).buffer;
    const { key: key1 } = await deriveFinalKEK(baseKEK, prf1);
    const { key: key2 } = await deriveFinalKEK(baseKEK, prf2);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, new TextEncoder().encode('probe'));
    await expect(crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, ct)).rejects.toThrow();
  });
});

describe('Claim 1(f)/12: master DEK generation, wrap, unwrap', () => {
  it('generates a non-extractable DEK', async () => {
    const { key } = await generateMasterDEK();
    expect(key.extractable).toBe(false);
  });

  it('wrap then unwrap recovers a functionally identical DEK', async () => {
    const { key: dek, raw: dekRaw } = await generateMasterDEK();
    const salt = generateSaltBytes(16);
    const baseKEK = await deriveBaseKEK('pass', salt);
    const { key: finalKEK } = await deriveFinalKEK(baseKEK);

    const { wrapped, iv } = await wrapDEK(dekRaw, finalKEK);
    const unwrapped = await unwrapDEK(wrapped, iv, finalKEK);

    const testIv = crypto.getRandomValues(new Uint8Array(12));
    const pt = new TextEncoder().encode('vault item plaintext');
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: testIv }, dek, pt);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: testIv }, unwrapped, ct);
    expect(new TextDecoder().decode(decrypted)).toBe('vault item plaintext');
  });

  it('unwrapping with the wrong KEK fails (proves the wrap is actually keyed)', async () => {
    const { raw: dekRaw } = await generateMasterDEK();
    const salt = generateSaltBytes(16);
    const { key: finalKEK } = await deriveFinalKEK(await deriveBaseKEK('right-pass', salt));
    const { key: wrongKEK } = await deriveFinalKEK(await deriveBaseKEK('wrong-pass', salt));

    const { wrapped, iv } = await wrapDEK(dekRaw, finalKEK);
    await expect(unwrapDEK(wrapped, iv, wrongKEK)).rejects.toThrow();
  });
});

describe('Claim 2: HKDF partition sub-keys with version+partition+ownerUID', () => {
  it('different partitions produce different, cross-isolated keys', async () => {
    const { raw } = await generateMasterDEK();
    const dekHkdfBase = await importDekAsHkdfBase(raw);
    const salt = generateSaltBytes(16);

    const keyA = await derivePartitionSubKeyV2({ dekHkdfBase, partitionId: 'wills_trust', ownerUid: 'user1', version: 1, salt });
    const keyB = await derivePartitionSubKeyV2({ dekHkdfBase, partitionId: 'medical_healthcare', ownerUid: 'user1', version: 1, salt });

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, keyA, new TextEncoder().encode('partition A secret'));
    await expect(crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyB, ct)).rejects.toThrow();
  });

  it('version rotation produces a different key for the same partition (Claim 2(d)/16)', async () => {
    const { raw } = await generateMasterDEK();
    const dekHkdfBase = await importDekAsHkdfBase(raw);
    const salt = generateSaltBytes(16);

    const v1 = await derivePartitionSubKeyV2({ dekHkdfBase, partitionId: 'wills_trust', ownerUid: 'user1', version: 1, salt });
    const v2 = await derivePartitionSubKeyV2({ dekHkdfBase, partitionId: 'wills_trust', ownerUid: 'user1', version: 2, salt });

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, v1, new TextEncoder().encode('v1 secret'));
    await expect(crypto.subtle.decrypt({ name: 'AES-GCM', iv }, v2, ct)).rejects.toThrow();
  });

  it('different owner UIDs produce different keys for the same partition (cross-user isolation)', async () => {
    const { raw } = await generateMasterDEK();
    const dekHkdfBase = await importDekAsHkdfBase(raw);
    const salt = generateSaltBytes(16);

    const keyUser1 = await derivePartitionSubKeyV2({ dekHkdfBase, partitionId: 'wills_trust', ownerUid: 'user1', version: 1, salt });
    const keyUser2 = await derivePartitionSubKeyV2({ dekHkdfBase, partitionId: 'wills_trust', ownerUid: 'user2', version: 1, salt });

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, keyUser1, new TextEncoder().encode('secret'));
    await expect(crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyUser2, ct)).rejects.toThrow();
  });
});

describe('Claim 5: content-addressed file DEK + HKDF-derived deterministic IV', () => {
  it('same content hash produces the same file key + IV (dedup property)', async () => {
    const { raw } = await generateMasterDEK();
    const dekHkdfBase = await importDekAsHkdfBase(raw);
    const salt = generateSaltBytes(16);
    const hash = 'a'.repeat(64);

    const m1 = await deriveFileKeyMaterial(dekHkdfBase, hash, salt);
    const m2 = await deriveFileKeyMaterial(dekHkdfBase, hash, salt);
    expect(Array.from(m1.iv)).toEqual(Array.from(m2.iv));

    const pt = new TextEncoder().encode('file bytes');
    const ct1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: m1.iv }, m1.fileKey, pt);
    const ct2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: m2.iv }, m2.fileKey, pt);
    expect(Array.from(new Uint8Array(ct1))).toEqual(Array.from(new Uint8Array(ct2)));
  });

  it('different content hashes produce different keys and IVs', async () => {
    const { raw } = await generateMasterDEK();
    const dekHkdfBase = await importDekAsHkdfBase(raw);
    const salt = generateSaltBytes(16);

    const m1 = await deriveFileKeyMaterial(dekHkdfBase, 'a'.repeat(64), salt);
    const m2 = await deriveFileKeyMaterial(dekHkdfBase, 'b'.repeat(64), salt);
    expect(Array.from(m1.iv)).not.toEqual(Array.from(m2.iv));

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, m1.fileKey, new TextEncoder().encode('x'));
    await expect(crypto.subtle.decrypt({ name: 'AES-GCM', iv }, m2.fileKey, ct)).rejects.toThrow();
  });

  it('IV is 12 bytes (96 bits) as required for AES-GCM', async () => {
    const { raw } = await generateMasterDEK();
    const dekHkdfBase = await importDekAsHkdfBase(raw);
    const m = await deriveFileKeyMaterial(dekHkdfBase, 'c'.repeat(64), generateSaltBytes(16));
    expect(m.iv.length).toBe(12);
  });
});

describe('End-to-end: createNewVaultKeyMaterial + unlockV2Vault', () => {
  it('round-trips without PRF', async () => {
    const created = await createNewVaultKeyMaterial('my-secure-passphrase');
    expect(created.usedPRF).toBe(false);

    const unlocked = await unlockV2Vault(
      'my-secure-passphrase', created.argonPbkdfSaltB64, created.wrappedDEK, created.wrappedDEKIv
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const pt = new TextEncoder().encode('vault contents');
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, created.dek, pt);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, unlocked.dek, ct);
    expect(new TextDecoder().decode(decrypted)).toBe('vault contents');
  });

  it('round-trips with PRF and rejects the wrong PRF output on unlock', async () => {
    const prf = crypto.getRandomValues(new Uint8Array(32)).buffer;
    const created = await createNewVaultKeyMaterial('my-secure-passphrase', prf);
    expect(created.usedPRF).toBe(true);

    const unlocked = await unlockV2Vault(
      'my-secure-passphrase', created.argonPbkdfSaltB64, created.wrappedDEK, created.wrappedDEKIv, prf
    );
    expect(unlocked.usedPRF).toBe(true);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, created.dek, new TextEncoder().encode('ok'));
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, unlocked.dek, ct);
    expect(new TextDecoder().decode(decrypted)).toBe('ok');

    const wrongPrf = crypto.getRandomValues(new Uint8Array(32)).buffer;
    await expect(
      unlockV2Vault('my-secure-passphrase', created.argonPbkdfSaltB64, created.wrappedDEK, created.wrappedDEKIv, wrongPrf)
    ).rejects.toThrow();
  });

  it('wrong passphrase fails to unlock', async () => {
    const created = await createNewVaultKeyMaterial('correct-passphrase');
    await expect(
      unlockV2Vault('wrong-passphrase', created.argonPbkdfSaltB64, created.wrappedDEK, created.wrappedDEKIv)
    ).rejects.toThrow();
  });
});
