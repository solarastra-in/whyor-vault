import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  cacheQuickUnlockDek,
  consumeQuickUnlockDek,
  clearQuickUnlockCache,
  getQuickUnlockWindowMins,
  setQuickUnlockWindowMins,
  DEFAULT_QUICK_UNLOCK_WINDOW_MINS,
} from './webauthn';

describe('Quick-unlock DEK cache (speeds up biometric re-unlock without ever skipping the live hardware tap)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips the raw DEK when unwrapped with the SAME hardware entropy it was wrapped with', async () => {
    const vaultId = 'vault-1';
    const dekRaw = crypto.getRandomValues(new Uint8Array(32));
    const hardwareEntropy = crypto.getRandomValues(new Uint8Array(32)).buffer;

    await cacheQuickUnlockDek(vaultId, dekRaw, hardwareEntropy, 15);
    const recovered = await consumeQuickUnlockDek(vaultId, hardwareEntropy);

    expect(recovered).not.toBeNull();
    expect(Array.from(recovered!)).toEqual(Array.from(dekRaw));
  });

  it('returns null (a plain cache miss, not a throw) when the hardware entropy does not match what it was cached under', async () => {
    const vaultId = 'vault-2';
    const dekRaw = crypto.getRandomValues(new Uint8Array(32));
    const registeredEntropy = crypto.getRandomValues(new Uint8Array(32)).buffer;
    const attackerEntropy = crypto.getRandomValues(new Uint8Array(32)).buffer; // e.g. a different/re-registered credential

    await cacheQuickUnlockDek(vaultId, dekRaw, registeredEntropy, 15);
    const recovered = await consumeQuickUnlockDek(vaultId, attackerEntropy);

    expect(recovered).toBeNull();
  });

  it('expires after the configured window and cannot be recovered even with the correct hardware entropy', async () => {
    const vaultId = 'vault-3';
    const dekRaw = crypto.getRandomValues(new Uint8Array(32));
    const hardwareEntropy = crypto.getRandomValues(new Uint8Array(32)).buffer;

    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_000_000);
    await cacheQuickUnlockDek(vaultId, dekRaw, hardwareEntropy, 15); // expires at 1_000_000 + 15*60*1000

    nowSpy.mockReturnValue(1_000_000 + 16 * 60 * 1000); // 16 minutes later -- past the window
    const recovered = await consumeQuickUnlockDek(vaultId, hardwareEntropy);
    expect(recovered).toBeNull();

    nowSpy.mockRestore();
  });

  it('a cleared cache cannot be consumed even immediately after caching', async () => {
    const vaultId = 'vault-4';
    const dekRaw = crypto.getRandomValues(new Uint8Array(32));
    const hardwareEntropy = crypto.getRandomValues(new Uint8Array(32)).buffer;

    await cacheQuickUnlockDek(vaultId, dekRaw, hardwareEntropy, 15);
    clearQuickUnlockCache(vaultId);
    const recovered = await consumeQuickUnlockDek(vaultId, hardwareEntropy);
    expect(recovered).toBeNull();
  });

  it('the per-vault window preference defaults, clamps, and persists correctly', () => {
    const vaultId = 'vault-5';
    expect(getQuickUnlockWindowMins(vaultId)).toBe(DEFAULT_QUICK_UNLOCK_WINDOW_MINS);

    setQuickUnlockWindowMins(vaultId, 30);
    expect(getQuickUnlockWindowMins(vaultId)).toBe(30);

    setQuickUnlockWindowMins(vaultId, 9999); // clamped to the 240-minute ceiling
    expect(getQuickUnlockWindowMins(vaultId)).toBe(240);

    setQuickUnlockWindowMins(vaultId, -5); // clamped to the 1-minute floor
    expect(getQuickUnlockWindowMins(vaultId)).toBe(1);

    // A different vault's preference is independent.
    expect(getQuickUnlockWindowMins('vault-6')).toBe(DEFAULT_QUICK_UNLOCK_WINDOW_MINS);
  });

  it('two different vaults do not share or collide on the same cached DEK', async () => {
    const hardwareEntropy = crypto.getRandomValues(new Uint8Array(32)).buffer;
    const dekA = crypto.getRandomValues(new Uint8Array(32));
    const dekB = crypto.getRandomValues(new Uint8Array(32));

    await cacheQuickUnlockDek('vault-A', dekA, hardwareEntropy, 15);
    await cacheQuickUnlockDek('vault-B', dekB, hardwareEntropy, 15);

    const recoveredA = await consumeQuickUnlockDek('vault-A', hardwareEntropy);
    const recoveredB = await consumeQuickUnlockDek('vault-B', hardwareEntropy);

    expect(Array.from(recoveredA!)).toEqual(Array.from(dekA));
    expect(Array.from(recoveredB!)).toEqual(Array.from(dekB));
    expect(Array.from(recoveredA!)).not.toEqual(Array.from(dekB));
  });
});
