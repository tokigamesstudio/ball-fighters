import { playSlotRound, InsufficientBalanceError } from '../lifecycle/slot.js';
import { InvalidFighterError, InvalidStakeError } from '../round.js';

export function registerSlotRoutes(app, aggregator, store) {
  app.post('/slot/play', async (req, res) => {
    try {
      const { sessionToken, fighterChoice, stake } = req.body;
      
      if (!sessionToken || !fighterChoice || stake === undefined) {
        return res.status(400).json({ error: 'Missing required fields: sessionToken, fighterChoice, stake' });
      }
      
      const result = await playSlotRound({ sessionToken, fighterChoice, stake, aggregator, store });
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof InvalidFighterError || err instanceof InvalidStakeError || err.message.includes('Invalid fighter') || err.message.includes('Stake must be')) {
        return res.status(400).json({ error: err.message });
      }
      if (err instanceof InsufficientBalanceError) {
        return res.status(402).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  });
}
