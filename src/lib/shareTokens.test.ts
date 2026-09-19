import { describe, it, expect } from 'vitest';
import {
  generateMemberKeyPair,
  wrapMemberPrivateKey,
  unwrapMemberPrivateKey,
  createShareToken,
  unwrapShareToken,
  reissueShareTokensAfterRotation,
} from './shareTokens';
import { deriveBaseKEK, deriveFinalKEK, derivePartitionSubKeyRawV2, importDekAsHkdfBase, generateSaltBytes } from './vaultKeys';

describe('Claim 6: zero-knowledge member enrollment + Share Tokens', () => {
  it('end-to-end: member enrolls with their own passphrase, owner issues a Share Token for a partition, member unwraps it and it matches the real partition sub-key', async () => {
    // 1. Member enrollment: own passphrase -> own KEK -> own ECDH keypair,
    // private key wrapped under the member's own KEK (never the owner's).
    const memberPassphrase = 'a-completely-different-member-secret';
    const memberSalt = generateSaltBytes(16);
    const memberBaseKek = await deriveBaseKEK(memberPassphrase, memberSalt);
    const { key: memberFinalKek } = await deriveFinalKEK(memberBaseKek);
    const { publicKeyJwk, privateKey } = await generateMemberKeyPair();
    const wrappedPriv = await wrapMemberPrivateKey(privateKey, memberFinalKek);

    // 2. Owner side: derive the real raw partition sub-key from their own
    // DEK (as VaultMain/EntryModal do), then wrap it to the member's
    // public key via ECDH -- the owner never sees the member's private key
    // or passphrase, and the member never sees the owner's DEK.
    const dekRaw = crypto.getRandomValues(new Uint8Array(32));
    const dekHkdfBase = await importDekAsHkdfBase(dekRaw);
    const ownerSalt = generateSaltBytes(16);
    const rawPartitionKey = await derivePartitionSubKeyRawV2({
      dekHkdfBase, partitionId: 'Family Joint', ownerUid: 'owner-uid-1', version: 1, salt: ownerSalt,
    });
    const token = await createShareToken(rawPartitionKey, 'Family Joint', 1, publicKeyJwk);

    // 3. Member side, on a later unlock: re-derive their own KEK from their
    // own passphrase, unwrap their own private key, then unwrap the token.
    const rederivedBaseKek = await deriveBaseKEK(memberPassphrase, memberSalt);
    const { key: rederivedFinalKek } = await deriveFinalKEK(rederivedBaseKek);
    const recoveredPrivateKey = await unwrapMemberPrivateKey(wrappedPriv.wrapped, wrappedPriv.iv, rederivedFinalKek);
    const unwrappedPartitionKey = await unwrapShareToken(token, recoveredPrivateKey);

    // 4. Prove it's the SAME key: encrypt with the owner's raw partition
    // key material re-imported as a CryptoKey, decrypt with the member's
    // unwrapped key.
    const directKey = await crypto.subtle.importKey('raw', rawPartitionKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, directKey, new TextEncoder().encode('shared family document'));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, unwrappedPartitionKey, ct);
    expect(new TextDecoder().decode(pt)).toBe('shared family document');
  });

  it('a member with no Share Token for a partition cannot derive any usable key for it (wrong member keypair fails to unwrap)', async () => {
    const { publicKeyJwk: legitPub } = await generateMemberKeyPair();
    const { privateKey: attackerPriv } = await generateMemberKeyPair(); // a different member's keypair

    const dekRaw = crypto.getRandomValues(new Uint8Array(32));
    const dekHkdfBase = await importDekAsHkdfBase(dekRaw);
    const salt = generateSaltBytes(16);
    const rawPartitionKey = await derivePartitionSubKeyRawV2({
      dekHkdfBase, partitionId: 'Wills & Trust', ownerUid: 'owner-uid-2', version: 1, salt,
    });
    const token = await createShareToken(rawPartitionKey, 'Wills & Trust', 1, legitPub);

    await expect(unwrapShareToken(token, attackerPriv)).rejects.toThrow();
  });

  it('Claim 16: rotation reissues fresh tokens for remaining members only, under a bumped version', async () => {
    const memberA = await generateMemberKeyPair();
    const memberB = await generateMemberKeyPair(); // this one gets removed before rotation

    const newRawKey = crypto.getRandomValues(new Uint8Array(32));
    const reissued = await reissueShareTokensAfterRotation(newRawKey, 'Family Joint', 2, [
      { publicKeyJwk: memberA.publicKeyJwk, uid: 'member-a' },
    ]);

    expect(Object.keys(reissued)).toEqual(['member-a']);
    expect(reissued['member-a'].version).toBe(2);
    const unwrapped = await unwrapShareToken(reissued['member-a'], memberA.privateKey);
    expect(unwrapped).toBeTruthy();
    // memberB never received a token in this reissue -- simulates revocation on rotation.
    void memberB;
  });

  it('Claim 24: a time-locked release condition round-trips on the token (release gating itself is enforced by the caller, not this module)', async () => {
    const { publicKeyJwk, privateKey } = await generateMemberKeyPair();
    const dekRaw = crypto.getRandomValues(new Uint8Array(32));
    const dekHkdfBase = await importDekAsHkdfBase(dekRaw);
    const salt = generateSaltBytes(16);
    const rawPartitionKey = await derivePartitionSubKeyRawV2({
      dekHkdfBase, partitionId: 'emergency_access', ownerUid: 'owner-3', version: 1, salt,
    });
    const releaseAtIso = new Date(Date.now() + 86400000).toISOString();
    const token = await createShareToken(rawPartitionKey, 'emergency_access', 1, publicKeyJwk, { type: 'time_lock', releaseAtIso });

    expect(token.releaseCondition).toEqual({ type: 'time_lock', releaseAtIso });
    // The token itself is still cryptographically unwrappable at any time --
    // it's MemberVerifyScreen's caller-side check that withholds it before release.
    const key = await unwrapShareToken(token, privateKey);
    expect(key).toBeTruthy();
  });
});
