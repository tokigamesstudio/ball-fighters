import { describe, it, expect } from 'vitest';
import { oddsForFighter } from '../../server/odds.js';

describe('oddsForFighter', () => {
  it('returns (1/winProb) * (1 - houseEdge)', () => {
    expect(oddsForFighter(0.25, 0.05)).toBeCloseTo(3.80, 10);
  });

  it('RTP: sum of winProb * odds ≈ 0.95 for 4 fighters', () => {
    const probs = [0.28, 0.26, 0.24, 0.22];
    const rtp = probs.reduce((sum, p) => sum + p * oddsForFighter(p, 0.05), 0) / probs.length;
    expect(rtp).toBeCloseTo(0.95, 3);
  });

  it('certain winner with no edge returns 1.0', () => {
    expect(oddsForFighter(1, 0)).toBe(1.0);
  });

  it('oddsForFighter(0.5, 0.05) === 1.90', () => {
    expect(oddsForFighter(0.5, 0.05)).toBeCloseTo(1.90, 10);
  });
});
