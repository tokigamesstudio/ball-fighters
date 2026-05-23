import { AggregatorAdapter } from './aggregator-interface.js';

export class StubAggregatorAdapter extends AggregatorAdapter {
  constructor() {
    super();
    this.players = new Map();
    this.transactions = new Map();
  }

  async validateSession(token) {
    const playerId = token;
    if (!this.players.has(playerId)) {
      this.players.set(playerId, { balance: 1000, currency: 'USD' });
    }
    const player = this.players.get(playerId);
    return { playerId, currency: player.currency, balance: player.balance };
  }

  async debit(session, amount, txRef) {
    if (this.transactions.has(txRef)) {
      return this.transactions.get(txRef);
    }
    
    const player = this.players.get(session.playerId);
    if (!player) throw new Error('Player not found');
    if (player.balance < amount) throw new Error('Insufficient balance');
    
    player.balance -= amount;
    const result = { success: true, balance: player.balance };
    this.transactions.set(txRef, result);
    return result;
  }

  async credit(session, amount, txRef) {
    if (this.transactions.has(txRef)) {
      return this.transactions.get(txRef);
    }
    
    const player = this.players.get(session.playerId);
    if (!player) throw new Error('Player not found');
    
    player.balance += amount;
    const result = { success: true, balance: player.balance };
    this.transactions.set(txRef, result);
    return result;
  }

  async getBalance(session) {
    const player = this.players.get(session.playerId);
    if (!player) throw new Error('Player not found');
    return player.balance;
  }
}
