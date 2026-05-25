import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryStore } from '../../server/stores/memory.js';
import {
  createRound,
  placeBet,
  resolveRound,
  RoundNotOpenError,
  InvalidFighterError,
  InvalidStakeError,
  AlreadyResolvedError
} from '../../server/round.js';
import crypto from 'crypto';

describe('Round Model', () => {
  let store;

  beforeEach(() => {
    store = createMemoryStore();
  });

  it('createRound returns round with id, seedHash, fighters, odds, status', () => {
    const round = createRound({ fighterA: 'blaze', fighterB: 'quake' }, store);
    
    expect(round).toHaveProperty('id');
    expect(round).toHaveProperty('seedHash');
    expect(round.fighterA).toBe('blaze');
    expect(round.fighterB).toBe('quake');
    expect(round).toHaveProperty('oddsA');
    expect(round).toHaveProperty('oddsB');
    expect(round.status).toBe('open');
  });

  it('createRound locks seed with SHA256 hash', () => {
    const round = createRound({ fighterA: 'blaze', fighterB: 'quake' }, store);
    
    // seedHash should be a hex string (64 chars for SHA256)
    expect(round.seedHash).toMatch(/^[a-f0-9]{64}$/);
    
    // Verify it's actually a hash by checking we can't reverse it
    expect(round.seedHash).not.toContain(round.seed || '');
  });

  it('placeBet returns betId, odds, potentialPayout', () => {
    const round = createRound({ fighterA: 'blaze', fighterB: 'quake' }, store);
    const bet = placeBet(round.id, { playerId: 'player1', fighter: 'blaze', stake: 100 }, store);
    
    expect(bet).toHaveProperty('betId');
    expect(bet).toHaveProperty('odds');
    expect(bet).toHaveProperty('potentialPayout');
    expect(bet.potentialPayout).toBeGreaterThan(100);
  });

  it('placeBet rejects if round status is not open', () => {
    const round = createRound({ fighterA: 'blaze', fighterB: 'quake' }, store);
    round.status = 'resolved';
    store.saveRound(round);
    
    expect(() => {
      placeBet(round.id, { playerId: 'player1', fighter: 'blaze', stake: 100 }, store);
    }).toThrow(RoundNotOpenError);
  });

  it('placeBet rejects if fighter not in round', () => {
    const round = createRound({ fighterA: 'blaze', fighterB: 'quake' }, store);
    
    expect(() => {
      placeBet(round.id, { playerId: 'player1', fighter: 'air', stake: 100 }, store);
    }).toThrow(InvalidFighterError);
  });

  it('placeBet rejects if stake <= 0', () => {
    const round = createRound({ fighterA: 'blaze', fighterB: 'quake' }, store);
    
    expect(() => {
      placeBet(round.id, { playerId: 'player1', fighter: 'blaze', stake: 0 }, store);
    }).toThrow(InvalidStakeError);
    
    expect(() => {
      placeBet(round.id, { playerId: 'player1', fighter: 'blaze', stake: -10 }, store);
    }).toThrow(InvalidStakeError);
  });

  it('resolveRound runs simulation and returns winner and payouts', () => {
    const round = createRound({ fighterA: 'blaze', fighterB: 'quake' }, store);
    placeBet(round.id, { playerId: 'player1', fighter: 'blaze', stake: 100 }, store);
    placeBet(round.id, { playerId: 'player2', fighter: 'quake', stake: 50 }, store);
    
    const result = resolveRound(round.id, store);
    
    expect(result).toHaveProperty('winner');
    expect(['blaze', 'quake']).toContain(result.winner);
    expect(result).toHaveProperty('payouts');
    expect(Array.isArray(result.payouts)).toBe(true);
  });

  it('resolveRound rejects if already resolved', () => {
    const round = createRound({ fighterA: 'blaze', fighterB: 'quake' }, store);
    resolveRound(round.id, store);
    
    expect(() => {
      resolveRound(round.id, store);
    }).toThrow(AlreadyResolvedError);
  });

  it('after resolveRound, winning bets have status won, losing bets have status lost', () => {
    const round = createRound({ fighterA: 'blaze', fighterB: 'quake' }, store);
    const bet1 = placeBet(round.id, { playerId: 'player1', fighter: 'blaze', stake: 100 }, store);
    const bet2 = placeBet(round.id, { playerId: 'player2', fighter: 'quake', stake: 50 }, store);
    
    const result = resolveRound(round.id, store);
    const bets = store.getBetsForRound(round.id);
    
    const winningBets = bets.filter(b => b.fighter === result.winner);
    const losingBets = bets.filter(b => b.fighter !== result.winner);
    
    winningBets.forEach(b => expect(b.status).toBe('won'));
    losingBets.forEach(b => expect(b.status).toBe('lost'));
  });
});
