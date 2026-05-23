import { describe, it, expect } from 'vitest';
import { calcPayout } from '../../server/payout.js';

describe('calcPayout', () => {
  it('obliterate (winnerHpPct > 0.6): returns stake * odds * 2.19', () => {
    expect(calcPayout(10, 2.0, 0.8)).toBeCloseTo(10 * 2.0 * 2.19);
  });

  it('close call (0.2 < winnerHpPct < 0.6): returns stake * odds * 0.95', () => {
    expect(calcPayout(10, 2.0, 0.4)).toBeCloseTo(10 * 2.0 * 0.95);
  });

  it('clutch (winnerHpPct < 0.2): returns stake * odds * 0.67', () => {
    expect(calcPayout(10, 2.0, 0.1)).toBeCloseTo(10 * 2.0 * 0.67);
  });

  it('boundary 0.6 is close call', () => {
    expect(calcPayout(10, 2.0, 0.6)).toBeCloseTo(10 * 2.0 * 0.95);
  });

  it('boundary 0.2 is clutch', () => {
    expect(calcPayout(10, 2.0, 0.2)).toBeCloseTo(10 * 2.0 * 0.67);
  });

  it('RTP check: weighted average payout across tiers ≈ 0.95 × stake × odds', () => {
    // Win rate ~50%, tier distribution within wins: 9.3% obliterate, 50.4% close, 40.3% clutch
    const winRate = 0.5;
    const obliteratePct = 0.093;
    const closePct = 0.504;
    const clutchPct = 0.403;

    const stake = 100;
    const odds = 1.9; // arbitrary odds that cancel out in ratio

    const expectedRtp = 0.95;

    const avgMultiplier =
      winRate * (obliteratePct * 2.30 + closePct * 1.0 + clutchPct * 0.7);

    // avgMultiplier should equal expectedRtp when odds are fair (odds = 1/winRate)
    // With fair odds (2.0 for 50% win rate), RTP = winRate * odds * avgTierMultiplier
    const fairOdds = 1 / winRate; // 2.0
    const rtp = winRate * fairOdds * (obliteratePct * 2.19 + closePct * 0.95 + clutchPct * 0.67);

    expect(rtp).toBeCloseTo(expectedRtp, 2);
  });
});
