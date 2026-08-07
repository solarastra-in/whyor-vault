/**
 * auditChain.ts
 * -----------------------------------------------------------------------
 * Merkle-chained, encrypted, HMAC-authenticated audit log.
 * Implements WHYOR-001-PPA Claims 4, 20, 21, 23, 26.
 * -----------------------------------------------------------------------
 */

const LOCAL_CHAIN_PREFIX = 'whyor_audit_chain_v1_';

export interface AuditEntryPlain {
  actionType: string;
  actorUid: string;
  partitionId: string | null;
  itemIds: string[];
  timestampIso: string; // Claim 4(a): ISO 8601
  sessionId: string;
}

export interface EncryptedChainNode {
  index: number;
  ciphertext: string;   // base64 AES-256-GCM
  iv: string;            // base64
  entryHmac: string;     // hex HMAC-SHA256, Claim 4(b)
  chainHash: string;     // hex SHA-256(prevChainHash || ciphertext), Claim 4(d)
}

async function localStorageNamespace(ownerUid: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ownerUid));
  const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${LOCAL_CHAIN_PREFIX}${hex}`;
}

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

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function deriveAuditHmacKey(dekHkdfBase: CryptoKey): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode('whyor-audit-hmac-key') },
    dekHkdfBase,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign', 'verify']
  );
}

async function deriveAuditEncKey(dekHkdfBase: CryptoKey): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode('whyor-audit-enc-key') },
    dekHkdfBase,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function canonicalize(entry: AuditEntryPlain): string {
  return JSON.stringify({
    actionType: entry.actionType,
    actorUid: entry.actorUid,
    partitionId: entry.partitionId,
    itemIds: entry.itemIds,
    timestampIso: entry.timestampIso,
    sessionId: entry.sessionId,
  });
}

async function loadLocalChain(ownerUid: string): Promise<EncryptedChainNode[]> {
  try {
    const ns = await localStorageNamespace(ownerUid);
    const raw = localStorage.getItem(ns);
    return raw ? JSON.parse(raw) as EncryptedChainNode[] : [];
  } catch {
    return [];
  }
}

async function saveLocalChain(ownerUid: string, chain: EncryptedChainNode[]): Promise<void> {
  const ns = await localStorageNamespace(ownerUid);
  localStorage.setItem(ns, JSON.stringify(chain));
}

const GENESIS_HASH = '0'.repeat(64);

export async function appendAuditEntry(
  ownerUid: string,
  dekHkdfBase: CryptoKey,
  entry: AuditEntryPlain
): Promise<{ node: EncryptedChainNode; merkleRoot: string }> {
  const chain = await loadLocalChain(ownerUid);
  const prevHash = chain.length > 0 ? chain[chain.length - 1].chainHash : GENESIS_HASH;

  const hmacKey = await deriveAuditHmacKey(dekHkdfBase);
  const encKey = await deriveAuditEncKey(dekHkdfBase);

  const canonical = canonicalize(entry);
  const entryHmacBuf = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(canonical));
  const entryHmac = toHex(entryHmacBuf);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encKey, new TextEncoder().encode(canonical));
  const ciphertext = b64(new Uint8Array(ciphertextBuf));

  const chainHashBuf = await crypto.subtle.digest(
    'SHA-256',
    (() => {
      const prevBytes = new TextEncoder().encode(prevHash);
      const cipherBytes = unb64(ciphertext);
      const out = new Uint8Array(prevBytes.length + cipherBytes.length);
      out.set(prevBytes, 0);
      out.set(cipherBytes, prevBytes.length);
      return out;
    })()
  );
  const chainHash = toHex(chainHashBuf);

  const node: EncryptedChainNode = { index: chain.length, ciphertext, iv: b64(iv), entryHmac, chainHash };
  chain.push(node);
  await saveLocalChain(ownerUid, chain);

  return { node, merkleRoot: chainHash };
}

export async function decryptAndVerifyNode(
  dekHkdfBase: CryptoKey,
  node: EncryptedChainNode
): Promise<AuditEntryPlain> {
  const encKey = await deriveAuditEncKey(dekHkdfBase);
  const hmacKey = await deriveAuditHmacKey(dekHkdfBase);

  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(node.iv) }, encKey, unb64(node.ciphertext)
  );
  const canonical = new TextDecoder().decode(plainBuf);

  const expectedHmac = toHex(await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(canonical)));
  if (expectedHmac !== node.entryHmac) {
    throw new Error(`Audit entry ${node.index} failed HMAC verification — possible tampering.`);
  }

  return JSON.parse(canonical) as AuditEntryPlain;
}

export async function verifyChainIntegrity(
  ownerUid: string,
  serverMerkleRoot: string | null
): Promise<{ intact: boolean; firstDivergentIndex: number; recomputedRoot: string }> {
  const chain = await loadLocalChain(ownerUid);
  let prevHash = GENESIS_HASH;

  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];
    const recomputedBuf = await crypto.subtle.digest(
      'SHA-256',
      (() => {
        const prevBytes = new TextEncoder().encode(prevHash);
        const cipherBytes = unb64(node.ciphertext);
        const out = new Uint8Array(prevBytes.length + cipherBytes.length);
        out.set(prevBytes, 0);
        out.set(cipherBytes, prevBytes.length);
        return out;
      })()
    );
    const recomputed = toHex(recomputedBuf);
    if (recomputed !== node.chainHash) {
      return { intact: false, firstDivergentIndex: i, recomputedRoot: recomputed };
    }
    prevHash = node.chainHash;
  }

  const recomputedRoot = prevHash;
  const intact = serverMerkleRoot === null || serverMerkleRoot === recomputedRoot;
  return { intact, firstDivergentIndex: intact ? -1 : chain.length, recomputedRoot };
}

export async function exportSignedAuditLog(
  ownerUid: string,
  dekHkdfBase: CryptoKey
): Promise<{ exportJson: string; exportHmac: string }> {
  const chain = await loadLocalChain(ownerUid);
  const decrypted: AuditEntryPlain[] = [];
  for (const node of chain) {
    decrypted.push(await decryptAndVerifyNode(dekHkdfBase, node));
  }
  const exportJson = JSON.stringify({ exportedAt: new Date().toISOString(), entries: decrypted }, null, 0);
  const hmacKey = await deriveAuditHmacKey(dekHkdfBase);
  const sigBuf = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(exportJson));
  return { exportJson, exportHmac: toHex(sigBuf) };
}
