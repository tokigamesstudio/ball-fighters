import crypto from 'crypto';
import { createRound, placeBet, resolveRound } from '../round.js';
import { calcPayout, getTier } from '../payout.js';

const FIGHTERS = ['blaze', 'quake', 'air', 'water'];

export class InsufficientBalanceError extends Error {
  constructor() {
    super('Insufficient balance');
    this.name = 'InsufficientBalanceError';
  }
}

/**
 * Slot-style single-player round lifecycle.
 * Called by the aggregator route handler.
 *
 * Flow:
 * 1. Validate session via aggregator
 * 2. Create round (fighterA = playerChoice, fighterB = random opponent)
 * 3. Debit stake from player wallet
 * 4. Resolve round (run simulation)
 * 5. If player won: credit payout
 * 6. Return { round, bet, result, payout }
 */
export async function playSlotRound({ sessionToken, fighterChoice, stake, aggregator, store }) {
  // 1. Validate session
  const session = await aggregator.validateSession(sessionToken);
  
  // Validate fighter choice
  if (!FIGHTERS.includes(fighterChoice)) {
    throw new Error('Invalid fighter choice');
  }
  
  // Validate stake
  if (stake <= 0) {
    throw new Error('Stake must be greater than 0');
  }
  
  // Check balance
  if (session.balance < stake) {
    throw new InsufficientBalanceError();
  }
  
  // 2. Generate seed and pick opponent deterministically
  const seed = crypto.randomBytes(16).toString('hex');
  const opponents = FIGHTERS.filter(f => f !== fighterChoice);
  const opponentIndex = parseInt(seed.slice(0, 2), 16) % opponents.length;
  const opponent = opponents[opponentIndex];
  
  // Create round with correct matchup (seed will be regenerated, but we'll override it)
  const round = createRound({ fighterA: fighterChoice, fighterB: opponent }, store);
  
  // Override with our deterministic seed
  const seedHash = crypto.createHash('sha256').update(seed).digest('hex');
  round.seed = seed;
  round.seedHash = seedHash;
  store.saveRound(round);
  
  // 3. Place bet
  const bet = placeBet(round.id, { playerId: session.playerId, fighter: fighterChoice, stake }, store);
  
  // 4. Debit stake
  await aggregator.debit(session, stake, `debit-${round.id}`);
  
  // Everything after debit must be compensated on failure
  try {
    // 5. Resolve round
    const resolution = resolveRound(round.id, store);
    
    // 6. Calculate tiered payout if won
    let payout = 0;
    let tier = null;
    let narrative = null;
    const playerWon = resolution.winner === fighterChoice;
    
    if (playerWon) {
      const myOdds = bet.odds;
      tier = getTier(resolution.winnerHpPct);
      const payoutAmount = calcPayout(stake, myOdds, resolution.winnerHpPct);
      await aggregator.credit(session, payoutAmount, `credit-${round.id}`);
      payout = payoutAmount;
      narrative = tier.narrative;
    }
    
    // Get updated round with seed
    const resolvedRound = store.getRound(round.id);
    
    return {
      roundId: round.id,
      fighterA: round.fighterA,
      fighterB: round.fighterB,
      oddsA: round.oddsA,
      oddsB: round.oddsB,
      winner: resolution.winner,
      playerBet: fighterChoice,
      payout,
      tier: tier?.label,
      narrative,
      winnerHpPct: resolution.winnerHpPct,
      seedHash: round.seedHash,
      seed: resolvedRound.seed
    };
  } catch (err) {
    // Compensate: refund the stake. If refund fails, log for manual reconciliation.
    try {
      await aggregator.credit(session, stake, `refund-${round.id}`);
    } catch (refundErr) {
      console.error(`[REFUND FAILED] round=${round.id} player=${session.playerId} stake=${stake}`, refundErr);
    }
    throw err;
  }
}
