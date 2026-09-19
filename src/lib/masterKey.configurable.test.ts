import { describe, it, expect } from 'vitest';
import { splitMasterKeyConfigurable, reconstructMasterKeyConfigurable, DEFAULT_SHAMIR_K, DEFAULT_SHAMIR_N } from './masterKey';

describe('Claims 3/17/18: configurable engine wired for live vault creation/recovery', () => {
  it('round-trips through the default 2-of-3 threshold used at vault creation', async () => {
    const key = 'TEST-MASTER-KEY-VALUE-2468';
    const result = await splitMasterKeyConfigurable(key, DEFAULT_SHAMIR_K, DEFAULT_SHAMIR_N);
    expect(result.k).toBe(2);
    expect(result.n).toBe(3);
    expect(result.share1).toMatch(/^WHYOR-KN-2-3-1-/);
    const reconstructed = await reconstructMasterKeyConfigurable([result.share1, result.share2]);
    expect(reconstructed).toBe(key);
  });

  it('round-trips a 3-of-3 threshold (the "All 3 Required" UI option)', async () => {
    const key = 'ANOTHER-TEST-KEY-VALUE-13579';
    const result = await splitMasterKeyConfigurable(key, 3, 3);
    const reconstructed = await reconstructMasterKeyConfigurable([result.share1, result.share2, result.share3]);
    expect(reconstructed).toBe(key);
    // Two shares alone must not be enough when k=3.
    await expect(reconstructMasterKeyConfigurable([result.share1, result.share2])).rejects.toThrow();
  });
});
