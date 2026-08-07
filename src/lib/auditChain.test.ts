import { describe, it, expect, beforeEach } from 'vitest';
import { appendAuditEntry, decryptAndVerifyNode, verifyChainIntegrity, exportSignedAuditLog, deriveAuditHmacKey, AuditEntryPlain } from './auditChain';
import { generateMasterDEK, importDekAsHkdfBase } from './vaultKeys';

beforeEach(() => {
  localStorage.clear();
});

async function freshDekHkdfBase() {
  const { raw } = await generateMasterDEK();
  return importDekAsHkdfBase(raw);
}

const sampleEntry = (overrides: Partial<AuditEntryPlain> = {}): AuditEntryPlain => ({
  actionType: 'VIEW_ITEM',
  actorUid: 'user-abc',
  partitionId: 'wills_trust',
  itemIds: ['item-1'],
  timestampIso: new Date().toISOString(),
  sessionId: 'session-xyz',
  ...overrides,
});

describe('Claim 4(a)-(e): encrypted, HMAC-authenticated, hash-chained entries', () => {
  it('round-trips a single entry through encrypt -> decrypt+verify', async () => {
    const dekHkdfBase = await freshDekHkdfBase();
    const { node } = await appendAuditEntry('owner1', dekHkdfBase, sampleEntry());
    const decrypted = await decryptAndVerifyNode(dekHkdfBase, node);
    expect(decrypted.actionType).toBe('VIEW_ITEM');
    expect(decrypted.actorUid).toBe('user-abc');
  });

  it('chains multiple entries with correct prevHash linkage', async () => {
    const dekHkdfBase = await freshDekHkdfBase();
    const r1 = await appendAuditEntry('owner2', dekHkdfBase, sampleEntry({ actionType: 'CREATE' }));
    const r2 = await appendAuditEntry('owner2', dekHkdfBase, sampleEntry({ actionType: 'UPDATE' }));
    const r3 = await appendAuditEntry('owner2', dekHkdfBase, sampleEntry({ actionType: 'DELETE' }));

    expect(r1.node.index).toBe(0);
    expect(r2.node.index).toBe(1);
    expect(r3.node.index).toBe(2);
    expect(r1.merkleRoot).not.toBe(r2.merkleRoot);
    expect(r2.merkleRoot).not.toBe(r3.merkleRoot);
  });

  it('ciphertext is not the plaintext JSON (actually encrypted, not just encoded)', async () => {
    const dekHkdfBase = await freshDekHkdfBase();
    const { node } = await appendAuditEntry('owner3', dekHkdfBase, sampleEntry({ actorUid: 'sensitive-uid-should-not-appear' }));
    expect(node.ciphertext).not.toContain('sensitive-uid-should-not-appear');
    expect(atob(node.ciphertext)).not.toContain('sensitive-uid-should-not-appear');
  });

  it('a different DEK cannot decrypt or verify the entry', async () => {
    const dekA = await freshDekHkdfBase();
    const dekB = await freshDekHkdfBase();
    const { node } = await appendAuditEntry('owner4', dekA, sampleEntry());
    await expect(decryptAndVerifyNode(dekB, node)).rejects.toThrow();
  });
});

describe('Claim 4(g)/21: chain integrity verification with divergence detection', () => {
  it('reports intact=true and the correct root for an untampered chain', async () => {
    const dekHkdfBase = await freshDekHkdfBase();
    await appendAuditEntry('owner5', dekHkdfBase, sampleEntry());
    await appendAuditEntry('owner5', dekHkdfBase, sampleEntry());
    const { node: lastNode } = await appendAuditEntry('owner5', dekHkdfBase, sampleEntry());

    const result = await verifyChainIntegrity('owner5', lastNode.chainHash);
    expect(result.intact).toBe(true);
    expect(result.firstDivergentIndex).toBe(-1);
    expect(result.recomputedRoot).toBe(lastNode.chainHash);
  });

  it('detects tampering and reports the correct first-divergent index', async () => {
    const dekHkdfBase = await freshDekHkdfBase();
    await appendAuditEntry('owner6', dekHkdfBase, sampleEntry());
    await appendAuditEntry('owner6', dekHkdfBase, sampleEntry());
    await appendAuditEntry('owner6', dekHkdfBase, sampleEntry());

    const ns = 'whyor_audit_chain_v1_' + Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('owner6')))).map(b => b.toString(16).padStart(2, '0')).join('');
    const chain = JSON.parse(localStorage.getItem(ns)!);
    chain[1].ciphertext = btoa('tampered-bytes-of-the-same-rough-length-xx');
    localStorage.setItem(ns, JSON.stringify(chain));

    const result = await verifyChainIntegrity('owner6', null);
    expect(result.intact).toBe(false);
    expect(result.firstDivergentIndex).toBe(1);
  });

  it('detects a server root mismatch even if the local chain itself is internally consistent', async () => {
    const dekHkdfBase = await freshDekHkdfBase();
    await appendAuditEntry('owner7', dekHkdfBase, sampleEntry());
    const result = await verifyChainIntegrity('owner7', 'a-server-root-that-does-not-match-anything');
    expect(result.intact).toBe(false);
  });
});

describe('Claim 20: signed JSON export', () => {
  it('exports all entries and produces a verifiable HMAC signature', async () => {
    const dekHkdfBase = await freshDekHkdfBase();
    await appendAuditEntry('owner8', dekHkdfBase, sampleEntry({ actionType: 'A' }));
    await appendAuditEntry('owner8', dekHkdfBase, sampleEntry({ actionType: 'B' }));

    const { exportJson, exportHmac } = await exportSignedAuditLog('owner8', dekHkdfBase);
    const parsed = JSON.parse(exportJson);
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries[0].actionType).toBe('A');
    expect(parsed.entries[1].actionType).toBe('B');

    const hmacKey = await deriveAuditHmacKey(dekHkdfBase);
    const expectedSig = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(exportJson))))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    expect(exportHmac).toBe(expectedSig);
  });
});

describe('Claim 26: LocalStorage namespace is SHA-256(owner_uid)', () => {
  it('does not store anything under a raw-uid key', async () => {
    const dekHkdfBase = await freshDekHkdfBase();
    await appendAuditEntry('plaintext-owner-uid-9', dekHkdfBase, sampleEntry());
    expect(localStorage.getItem('whyor_audit_chain_v1_plaintext-owner-uid-9')).toBeNull();

    const expectedHex = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('plaintext-owner-uid-9'))))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    expect(localStorage.getItem(`whyor_audit_chain_v1_${expectedHex}`)).not.toBeNull();
  });
});
