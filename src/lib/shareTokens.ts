/**
 * shareTokens.ts
 * -----------------------------------------------------------------------
 * Client-only zero-knowledge family sharing via wrapped partition
 * sub-keys. Implements WHYOR-001-PPA Claims 6, 16, 24.
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

export interface MemberKeyPair {
  publicKeyJwk: JsonWebKey;
  privateKey: CryptoKey;
}

export async function generateMemberKeyPair(): Promise<MemberKeyPair> {
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { publicKeyJwk, privateKey: pair.privateKey };
}

export async function wrapMemberPrivateKey(privateKey: CryptoKey, memberFinalKEK: CryptoKey): Promise<{ wrapped: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const jwk = await crypto.subtle.exportKey('jwk', privateKey);
  const plaintext = new TextEncoder().encode(JSON.stringify(jwk));
  const wrappedBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, memberFinalKEK, plaintext);
  return { wrapped: b64(new Uint8Array(wrappedBuf)), iv: b64(iv) };
}

export async function unwrapMemberPrivateKey(wrapped: string, iv: string, memberFinalKEK: CryptoKey): Promise<CryptoKey> {
  const plaintextBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, memberFinalKEK, unb64(wrapped));
  const jwk = JSON.parse(new TextDecoder().decode(plaintextBuf)) as JsonWebKey;
  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
}

export interface ShareToken {
  partitionId: string;
  version: number;
  ephemeralPublicJwk: JsonWebKey;
  wrapped: string;
  iv: string;
  issuedAt: string;
  releaseCondition?: { type: 'time_lock'; releaseAtIso: string } | { type: 'manual_approval'; approverUid: string };
}

export async function createShareToken(
  partitionSubKeyRaw: Uint8Array,
  partitionId: string,
  version: number,
  memberPublicKeyJwk: JsonWebKey,
  releaseCondition?: ShareToken['releaseCondition']
): Promise<ShareToken> {
  const memberPublicKey = await crypto.subtle.importKey(
    'jwk', memberPublicKeyJwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []
  );
  const ephemeralPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
  const sharedKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: memberPublicKey },
    ephemeralPair.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, partitionSubKeyRaw);
  const ephemeralPublicJwk = await crypto.subtle.exportKey('jwk', ephemeralPair.publicKey);

  return {
    partitionId,
    version,
    ephemeralPublicJwk,
    wrapped: b64(new Uint8Array(wrappedBuf)),
    iv: b64(iv),
    issuedAt: new Date().toISOString(),
    releaseCondition,
  };
}

export async function unwrapShareToken(token: ShareToken, memberPrivateKey: CryptoKey): Promise<CryptoKey> {
  const ephemeralPublicKey = await crypto.subtle.importKey(
    'jwk', token.ephemeralPublicJwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []
  );
  const sharedKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: ephemeralPublicKey },
    memberPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const rawBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(token.iv) }, sharedKey, unb64(token.wrapped));
  const rawBytes = new Uint8Array(rawBuf);
  const key = await crypto.subtle.importKey('raw', rawBytes, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  rawBytes.fill(0);
  return key;
}

export async function reissueShareTokensAfterRotation(
  newPartitionSubKeyRaw: Uint8Array,
  partitionId: string,
  newVersion: number,
  remainingMembers: { publicKeyJwk: JsonWebKey; uid: string }[]
): Promise<Record<string, ShareToken>> {
  const tokens: Record<string, ShareToken> = {};
  for (const member of remainingMembers) {
    tokens[member.uid] = await createShareToken(newPartitionSubKeyRaw, partitionId, newVersion, member.publicKeyJwk);
  }
  return tokens;
}
