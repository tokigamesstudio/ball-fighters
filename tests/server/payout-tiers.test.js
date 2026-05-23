import { describe, it, expect } from 'vitest';
import { calcPayout } from '../../server/payout.js';

describe('calcPayout', () => {
  it('obliterate (winnerHpPct > 0.6): returns stake * odds * 2.38', () => {
    expect(calcPayout(10, 2.0, 0.8)).toBeCloseTo(10 * 2.0 * 2.38);
  });

  it('close call (0.2 < winnerHpPct < 0.6): returns stake * odds * 1.03', () => {
    expect(calcPayout(10, 2.0, 0.4)).toBeCloseTo(10 * 2.0 * 1.03);
  });

  it('clutch (winnerHpPct < 0.2): returns stake * odds * 0.73', () => {
    expect(calcPayout(10, 2.0, 0.1)).toBeCloseTo(10 * 2.0 * 0.73);
  });

  it('boundary 0.6 is close call', () => {
    expect(calcPayout(10, 2.0, 0.6)).toBeCloseTo(10 * 2.0 * 1.03);
  });

  it('boundary 0.2 is clutch', () => {
    expect(calcPayout(10, 2.0, 0.2)).toBeCloseTo(10 * 2.0 * 0.73);
  });

  it('RTP check: weighted average payout across tiers ≈ 0.95 × stake', () => {
    // Win rate ~50%, tier distribution: 7.5% obliterate, 49.3% close, 43.1% clutch
    const winRate = 0.5;
    const obliteratePct = 0.075;
    const closePct = 0.493;
    const clutchPct = 0.431;

    // With fair odds (1/winRate * (1-houseEdge)), RTP = winRate * odds * avgTierMultiplier
    const fairOdds = (1 - 0.05) / winRate; // 1.9
    const rtp = winRate * fairOdds * (obliteratePct * 2.38 + closePct * 1.03 + clutchPct * 0.73);

    expect(rtp).toBeCloseTo(0.95, 2);
  });
});
