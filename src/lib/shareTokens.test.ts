import { describe, it, expect } from 'vitest';
import { generateMemberKeyPair, wrapMemberPrivateKey, unwrapMemberPrivateKey, createShareToken, unwrapShareToken, reissueShareTokensAfterRotation } from './shareTokens';
import { generateMasterDEK, importDekAsHkdfBase, derivePartitionSubKeyRawV2, generateSaltBytes, deriveBaseKEK, deriveFinalKEK } from './vaultKeys';

async function encryptedProbe(key: CryptoKey, text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  return { iv, ct };
}

describe('Claim 6(b)/(d): Share Token wrap/unwrap round trip', () => {
  it('member recovers a partition sub-key that is functionally identical to the original', async () => {
    const { raw } = await generateMasterDEK();
    const dekHkdfBase = await importDekAsHkdfBase(raw);
    const salt = generateSaltBytes(16);
    const partitionRaw = await derivePartitionSubKeyRawV2({ dekHkdfBase, partitionId: 'wills_trust', ownerUid: 'owner1', version: 1, salt });
    const originalKey = await crypto.subtle.importKey('raw', partitionRaw, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);

    const member = await generateMemberKeyPair();
    const token = await createShareToken(partitionRaw, 'wills_trust', 1, member.publicKeyJwk);
    const recoveredKey = await unwrapShareToken(token, member.privateKey);

    const { iv, ct } = await encryptedProbe(originalKey, 'estate document contents');
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, recoveredKey, ct);
    expect(new TextDecoder().decode(decrypted)).toBe('estate document contents');
  });

  it("a different member's private key cannot unwrap someone else's Share Token", async () => {
    const { raw } = await generateMasterDEK();
    const dekHkdfBase = await importDekAsHkdfBase(raw);
    const salt = generateSaltBytes(16);
    const partitionRaw = await derivePartitionSubKeyRawV2({ dekHkdfBase, partitionId: 'medical_healthcare', ownerUid: 'owner1', version: 1, salt });

    const intendedMember = await generateMemberKeyPair();
    const attacker = await generateMemberKeyPair();
    const token = await createShareToken(partitionRaw, 'medical_healthcare', 1, intendedMember.publicKeyJwk);

    await expect(unwrapShareToken(token, attacker.privateKey)).rejects.toThrow();
  });

  it('a member private key wraps/unwraps under their own Final KEK correctly', async () => {
    const salt = generateSaltBytes(16);
    const { key: memberFinalKEK } = await deriveFinalKEK(await deriveBaseKEK('member-passphrase', salt));
    const member = await generateMemberKeyPair();

    const { wrapped, iv } = await wrapMemberPrivateKey(member.privateKey, memberFinalKEK);
    const unwrappedPrivateKey = await unwrapMemberPrivateKey(wrapped, iv, memberFinalKEK);

    const { raw } = await generateMasterDEK();
    const dekHkdfBase = await importDekAsHkdfBase(raw);
    const partitionRaw = await derivePartitionSubKeyRawV2({ dekHkdfBase, partitionId: 'digital_assets', ownerUid: 'owner1', version: 1, salt });
    const token = await createShareToken(partitionRaw, 'digital_assets', 1, member.publicKeyJwk);
    const recoveredKey = await unwrapShareToken(token, unwrappedPrivateKey);

    const { iv: pIv, ct } = await encryptedProbe(await crypto.subtle.importKey('raw', partitionRaw, { name: 'AES-GCM', length: 256 }, false, ['encrypt']), 'probe');
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: pIv }, recoveredKey, ct);
    expect(new TextDecoder().decode(decrypted)).toBe('probe');
  });
});

describe('Claim 6(f)/16: revocation reissues tokens only to remaining members', () => {
  it('reissues valid tokens for each remaining member at the new version', async () => {
    const { raw } = await generateMasterDEK();
    const dekHkdfBase = await importDekAsHkdfBase(raw);
    const salt = generateSaltBytes(16);
    const newPartitionRaw = await derivePartitionSubKeyRawV2({ dekHkdfBase, partitionId: 'family_joint', ownerUid: 'owner1', version: 2, salt });

    const alice = await generateMemberKeyPair();
    const bob = await generateMemberKeyPair();
    const tokens = await reissueShareTokensAfterRotation(newPartitionRaw, 'family_joint', 2, [
      { publicKeyJwk: alice.publicKeyJwk, uid: 'alice' },
      { publicKeyJwk: bob.publicKeyJwk, uid: 'bob' },
    ]);

    expect(Object.keys(tokens).sort()).toEqual(['alice', 'bob']);
    const aliceKey = await unwrapShareToken(tokens['alice'], alice.privateKey);
    const { iv, ct } = await encryptedProbe(await crypto.subtle.importKey('raw', newPartitionRaw, { name: 'AES-GCM', length: 256 }, false, ['encrypt']), 'rotated');
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aliceKey, ct);
    expect(new TextDecoder().decode(decrypted)).toBe('rotated');
  });
});
