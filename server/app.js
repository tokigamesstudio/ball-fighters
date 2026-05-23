import express from 'express';
import cors from 'cors';
import { createRound, placeBet, resolveRound, RoundNotOpenError, InvalidFighterError, InvalidStakeError, AlreadyResolvedError, RoundNotFoundError } from './round.js';
import { createMemoryStore } from './stores/memory.js';
import { registerSlotRoutes } from './routes/slot.js';
import { StubAggregatorAdapter } from './adapters/aggregator-stub.js';

export function createApp(store = createMemoryStore(), aggregator = new StubAggregatorAdapter()) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Serve static files from project root
  app.use(express.static('.'));

  registerSlotRoutes(app, aggregator, store);

  app.get('/balance', async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) return res.status(400).json({ error: 'Missing token' });
      const session = await aggregator.validateSession(token);
      const balance = await aggregator.getBalance(session);
      res.json({ balance });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post('/round/create', (req, res) => {
    try {
      const { fighterA, fighterB } = req.body;
      if (!fighterA || !fighterB) {
        return res.status(400).json({ error: 'Missing required fields: fighterA, fighterB' });
      }
      
      const round = createRound({ fighterA, fighterB }, store);
      res.status(201).json({
        roundId: round.id,
        seedHash: round.seedHash,
        oddsA: round.oddsA,
        oddsB: round.oddsB
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post('/round/bet', (req, res) => {
    try {
      const { roundId, playerId, fighter, stake } = req.body;
      const result = placeBet(roundId, { playerId, fighter, stake }, store);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof RoundNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof RoundNotOpenError || err instanceof AlreadyResolvedError) {
        return res.status(409).json({ error: err.message });
      }
      if (err instanceof InvalidFighterError || err instanceof InvalidStakeError) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post('/round/resolve', (req, res) => {
    try {
      const { roundId } = req.body;
      const result = resolveRound(roundId, store);
      const round = store.getRound(roundId);
      res.status(200).json({
        winner: result.winner,
        payouts: result.payouts,
        seed: round.seed
      });
    } catch (err) {
      if (err instanceof RoundNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof AlreadyResolvedError) {
        return res.status(409).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  });
  
  app.get('/round/:id', (req, res) => {
    try {
      const round = store.getRound(req.params.id);
      if (!round) {
        return res.status(404).json({ error: 'Round not found' });
      }
      
      const response = {
        id: round.id,
        status: round.status,
        fighterA: round.fighterA,
        fighterB: round.fighterB,
        oddsA: round.oddsA,
        oddsB: round.oddsB
      };
      
      if (round.winner) {
        response.winner = round.winner;
      }
      
      res.status(200).json(response);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  return app;
}
