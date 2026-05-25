import crypto from 'crypto';
import { oddsForFighter } from './odds.js';
import { runSimulation } from './ports/simulation.js';

// 1v1 win probabilities from Monte Carlo (1000 sims per matchup, 600x600 arena)
// Key format: `${fighterA}:${fighterB}` where fighterA < fighterB alphabetically
const MATCHUP_PROBS = {
  'blaze:quake':   { blaze: 0.545, quake: 0.455 },
  'air:blaze':     { blaze: 0.402, air: 0.598 },
  'blaze:water':   { blaze: 0.490, water: 0.510 },
  'air:quake':     { quake: 0.489, air: 0.511 },
  'quake:water':   { water: 0.370, quake: 0.630 },
  'air:water':     { water: 0.587, air: 0.413 },
};

function getMatchupProbs(fighterA, fighterB) {
  const key = [fighterA, fighterB].sort().join(':');
  const probs = MATCHUP_PROBS[key];
  if (!probs) throw new Error(`Unknown matchup: ${fighterA} vs ${fighterB}`);
  return { probA: probs[fighterA], probB: probs[fighterB] };
}

export class RoundNotOpenError extends Error {
  constructor() {
    super('Round is not open for betting');
    this.name = 'RoundNotOpenError';
  }
}

export class InvalidFighterError extends Error {
  constructor() {
    super('Fighter not in this round');
    this.name = 'InvalidFighterError';
  }
}

export class InvalidStakeError extends Error {
  constructor() {
    super('Stake must be greater than 0');
    this.name = 'InvalidStakeError';
  }
}

export class AlreadyResolvedError extends Error {
  constructor() {
    super('Round already resolved');
    this.name = 'AlreadyResolvedError';
  }
}

export class RoundNotFoundError extends Error {
  constructor() {
    super('Round not found');
    this.name = 'RoundNotFoundError';
  }
}

export function createRound({ fighterA, fighterB, houseEdge = 0.05 }, store) {
  const seed = crypto.randomBytes(16).toString('hex');
  const seedHash = crypto.createHash('sha256').update(seed).digest('hex');
  
  const { probA, probB } = getMatchupProbs(fighterA, fighterB);
  const oddsA = oddsForFighter(probA, houseEdge);
  const oddsB = oddsForFighter(probB, houseEdge);
  
  const round = {
    id: crypto.randomUUID(),
    seed,
    seedHash,
    fighterA,
    fighterB,
    oddsA,
    oddsB,
    status: 'open'
  };
  
  store.saveRound(round);
  return round;
}

export function placeBet(roundId, { playerId, fighter, stake }, store) {
  const round = store.getRound(roundId);
  if (!round) throw new RoundNotFoundError();
  if (round.status !== 'open') throw new RoundNotOpenError();
  if (fighter !== round.fighterA && fighter !== round.fighterB) throw new InvalidFighterError();
  if (stake <= 0) throw new InvalidStakeError();
  
  const odds = fighter === round.fighterA ? round.oddsA : round.oddsB;
  const potentialPayout = stake * odds;
  
  const bet = {
    id: crypto.randomUUID(),
    roundId,
    playerId,
    fighter,
    stake,
    odds,
    potentialPayout,
    status: 'pending',
    txRef: `bet-${crypto.randomUUID()}`
  };
  
  store.saveBet(bet);
  
  return {
    betId: bet.id,
    odds,
    potentialPayout
  };
}

export function resolveRound(roundId, store) {
  const round = store.getRound(roundId);
  if (!round) throw new RoundNotFoundError();
  if (round.status === 'resolved') throw new AlreadyResolvedError();
  
  // Run simulation
  const result = runSimulation(round.seed, [round.fighterA, round.fighterB]);
  const winner = result.winner?.type || round.fighterA;
  const winnerHpPct = result.winnerHpPct;
  
  // Update round
  round.status = 'resolved';
  round.winner = winner;
  round.result = result;
  store.saveRound(round);
  
  // Update bets
  const bets = store.getBetsForRound(roundId);
  const payouts = [];
  
  for (const bet of bets) {
    if (bet.fighter === winner) {
      store.updateBet(bet.id, { status: 'won' });
      payouts.push({
        playerId: bet.playerId,
        amount: bet.potentialPayout
      });
    } else {
      store.updateBet(bet.id, { status: 'lost' });
    }
  }
  
  return { winner, winnerHpPct, payouts };
}
