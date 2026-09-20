import { describe, it, expect } from 'vitest';
import { estimateEntropyBits, validateAnswerEntropy, padAnswerTo20BitEntropy, MIN_ANSWER_ENTROPY_BITS } from './vaultKeys';

describe('Claim 13: passphrase/answer entropy enforcement', () => {
  it('rejects trivially weak answers', () => {
    expect(validateAnswerEntropy('cat').valid).toBe(false);
    expect(validateAnswerEntropy('1234').valid).toBe(false);
    expect(validateAnswerEntropy('aaaaaaaaaa').valid).toBe(false);
    expect(validateAnswerEntropy('').valid).toBe(false);
  });

  it('enforces mandatory 20-bit entropy rule with padding for short answers', () => {
    expect(MIN_ANSWER_ENTROPY_BITS).toBe(20);
    // Raw lowercase 4-letter answer has ~18.8 bits (< 20)
    expect(validateAnswerEntropy('cold').valid).toBe(false);
    // With deterministic 20-bit padding applied
    const padded = padAnswerTo20BitEntropy('cold', 9);
    expect(estimateEntropyBits(padded)).toBeGreaterThanOrEqual(20);
    expect(validateAnswerEntropy(padded).valid).toBe(true);
    // Empty answers never get padded
    expect(padAnswerTo20BitEntropy('', 0)).toBe('');
    expect(validateAnswerEntropy(padAnswerTo20BitEntropy('', 0)).valid).toBe(false);
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
