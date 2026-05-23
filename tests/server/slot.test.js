import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/app.js';
import { createMemoryStore } from '../../server/stores/memory.js';
import { StubAggregatorAdapter } from '../../server/adapters/aggregator-stub.js';

describe('Slot Lifecycle', () => {
  let app;
  let store;
  let aggregator;

  beforeEach(() => {
    store = createMemoryStore();
    aggregator = new StubAggregatorAdapter();
    app = createApp(store, aggregator);
  });

  it('POST /slot/play returns 200 with winner', async () => {
    const res = await request(app)
      .post('/slot/play')
      .send({ sessionToken: 'player1', fighterChoice: 'blaze', stake: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('roundId');
    expect(res.body).toHaveProperty('fighterA', 'blaze');
    expect(res.body).toHaveProperty('fighterB');
    expect(res.body).toHaveProperty('oddsA');
    expect(res.body).toHaveProperty('oddsB');
    expect(res.body).toHaveProperty('winner');
    expect(res.body).toHaveProperty('playerBet', 'blaze');
    expect(res.body).toHaveProperty('payout');
    expect(res.body).toHaveProperty('seedHash');
    expect(res.body).toHaveProperty('seed');
    expect(['blaze', 'quake', 'spark', 'phantom']).toContain(res.body.winner);
  });

  it('Player balance is debited by stake amount', async () => {
    const session = await aggregator.validateSession('player1');
    const initialBalance = session.balance;

    const res = await request(app)
      .post('/slot/play')
      .send({ sessionToken: 'player1', fighterChoice: 'blaze', stake: 10 });

    const updatedSession = await aggregator.validateSession('player1');
    
    if (res.body.winner === 'blaze') {
      // Player won: balance = initial - stake + payout
      expect(updatedSession.balance).toBe(initialBalance - 10 + res.body.payout);
    } else {
      // Player lost: balance = initial - stake
      expect(updatedSession.balance).toBe(initialBalance - 10);
    }
  });

  it('If player won: balance is credited by payout amount', async () => {
    // Run multiple rounds to ensure we get at least one win
    let won = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!won && attempts < maxAttempts) {
      attempts++;
      aggregator = new StubAggregatorAdapter(); // Reset balance
      app = createApp(createMemoryStore(), aggregator);
      
      const session = await aggregator.validateSession('player1');
      const initialBalance = session.balance;

      const res = await request(app)
        .post('/slot/play')
        .send({ sessionToken: 'player1', fighterChoice: 'blaze', stake: 10 });

      if (res.body.winner === 'blaze') {
        won = true;
        const updatedSession = await aggregator.validateSession('player1');
        const expectedBalance = initialBalance - 10 + res.body.payout;
        expect(updatedSession.balance).toBe(expectedBalance);
        expect(res.body.payout).toBeGreaterThan(0);
      }
    }

    expect(won).toBe(true);
  });

  it('Response includes seedHash (pre-committed) and seed (revealed)', async () => {
    const res = await request(app)
      .post('/slot/play')
      .send({ sessionToken: 'player1', fighterChoice: 'blaze', stake: 10 });

    expect(res.status).toBe(200);
    expect(res.body.seedHash).toBeDefined();
    expect(res.body.seed).toBeDefined();
    expect(typeof res.body.seedHash).toBe('string');
    expect(typeof res.body.seed).toBe('string');
    expect(res.body.seedHash.length).toBe(64); // SHA-256 hex
    expect(res.body.seed.length).toBe(32); // 16 bytes hex
  });

  it('Invalid fighterChoice returns 400', async () => {
    const res = await request(app)
      .post('/slot/play')
      .send({ sessionToken: 'player1', fighterChoice: 'invalid', stake: 10 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('Stake <= 0 returns 400', async () => {
    const res = await request(app)
      .post('/slot/play')
      .send({ sessionToken: 'player1', fighterChoice: 'blaze', stake: 0 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('Insufficient balance returns 402', async () => {
    const res = await request(app)
      .post('/slot/play')
      .send({ sessionToken: 'player1', fighterChoice: 'blaze', stake: 2000 });

    expect(res.status).toBe(402);
    expect(res.body).toHaveProperty('error', 'Insufficient balance');
  });

  it('Provably fair: seed hash, simulation, and opponent selection are verifiable', async () => {
    const crypto = await import('crypto');
    const { BattleSimulation } = await import('../../src/core/simulation.js');
    
    const res = await request(app)
      .post('/slot/play')
      .send({ sessionToken: 'player1', fighterChoice: 'blaze', stake: 10 });

    expect(res.status).toBe(200);
    
    // 1. Extract seedHash (pre-committed) and seed (revealed)
    const { seedHash, seed, fighterA, fighterB, winner } = res.body;
    
    // 2. Verify seed hash matches
    const computedHash = crypto.createHash('sha256').update(seed).digest('hex');
    expect(computedHash).toBe(seedHash);
    
    // 3. Verify simulation result is deterministic
    const sim = new BattleSimulation(seed, [fighterA, fighterB]);
    while (!sim.finished && sim.frame < sim.maxFrames) {
      sim.step();
    }
    expect(sim.winner.type).toBe(winner);
    
    // 4. Verify opponent was deterministically selected
    const opponents = ['quake', 'spark', 'phantom']; // blaze excluded
    const opponentIndex = parseInt(seed.slice(0, 2), 16) % opponents.length;
    expect(fighterB).toBe(opponents[opponentIndex]);
  });

  it('Refunds stake if resolveRound throws after debit', async () => {
    const session = await aggregator.validateSession('player1');
    const initialBalance = session.balance;

    // Mock store to make saveRound throw during resolution
    const faultyStore = createMemoryStore();
    let callCount = 0;
    const originalSaveRound = faultyStore.saveRound;
    faultyStore.saveRound = (round) => {
      callCount++;
      // Let the first two calls succeed (initial round creation and seed override)
      // Throw on the third call (during resolution)
      if (callCount >= 3) {
        throw new Error('Simulation failed');
      }
      return originalSaveRound(round);
    };
    
    const faultyApp = createApp(faultyStore, aggregator);

    const res = await request(faultyApp)
      .post('/slot/play')
      .send({ sessionToken: 'player1', fighterChoice: 'blaze', stake: 10 });

    expect(res.status).toBe(500);
    
    // Verify balance is restored (refunded)
    const updatedSession = await aggregator.validateSession('player1');
    expect(updatedSession.balance).toBe(initialBalance);
  });
});
