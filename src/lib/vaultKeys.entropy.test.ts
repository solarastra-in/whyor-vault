import { describe, it, expect } from 'vitest';
import { estimateEntropyBits, validateAnswerEntropy, MIN_ANSWER_ENTROPY_BITS } from './vaultKeys';

describe('Claim 13: passphrase/answer entropy enforcement', () => {
  it('rejects trivially weak answers', () => {
    expect(validateAnswerEntropy('cat').valid).toBe(false);
    expect(validateAnswerEntropy('1234').valid).toBe(false);
    expect(validateAnswerEntropy('aaaaaaaaaa').valid).toBe(false);
    expect(validateAnswerEntropy('').valid).toBe(false);
  });

  it('accepts reasonably long, varied answers', () => {
    expect(validateAnswerEntropy('MyGrandmotherLivedInJaipur').valid).toBe(true);
    expect(validateAnswerEntropy('Sunflower-Meadow-42').valid).toBe(true);
  });

  it('scores entropy monotonically with length for fixed charset', () => {
    const short = estimateEntropyBits('abcdef');
    const long = estimateEntropyBits('abcdefghijklmnop');
    expect(long).toBeGreaterThan(short);
  });

  it('threshold constant is a positive, sane bound', () => {
    expect(MIN_ANSWER_ENTROPY_BITS).toBeGreaterThan(0);
    expect(MIN_ANSWER_ENTROPY_BITS).toBeLessThan(64);
  });
});
