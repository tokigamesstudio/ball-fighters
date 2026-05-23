/**
 * Local/Dev RGS Adapter
 * 
 * Implements RGSAdapter by calling our own Express server.
 * Used for local development and testing without Stake Engine.
 */
import { RGSAdapter } from './adapter-interface.js';

export class LocalRGSAdapter extends RGSAdapter {
  constructor({ serverUrl = 'http://localhost:3001', sessionToken = null } = {}) {
    super();
    this._serverUrl = serverUrl;
    this._sessionToken = sessionToken || this._getOrCreateToken();
    this._balance = null;
    this._config = null;
  }

  _getOrCreateToken() {
    let id = localStorage.getItem('arena_player_id');
    if (!id) { id = 'player_' + Math.random().toString(36).slice(2); localStorage.setItem('arena_player_id', id); }
    return id;
  }

  async authenticate() {
    const res = await fetch(`${this._serverUrl}/balance?token=${this._sessionToken}`);
    const data = await res.json();

    this._balance = { amount: data.balance * 1_000_000, currency: 'USD' };
    this._config = {
      betLevels: [1_000_000, 2_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000],
      defaultBetLevel: 2,
      minBet: 1_000_000,
      maxBet: 100_000_000,
      stepBet: 1_000_000,
    };

    return {
      balance: this._balance,
      config: this._config,
      jurisdictionFlags: {
        disabledAutoplay: false,
        disabledTurbo: false,
        disabledSpacebar: false,
        disabledBuyFeature: false,
        disabledFullscreen: false,
        displayRTP: false,
        displaySessionTimer: false,
        minimumRoundDuration: 0,
      },
      activeRound: null,
    };
  }

  async play(amount, mode, { fighterChoice } = {}) {
    const stake = amount / 1_000_000;

    const res = await fetch(`${this._serverUrl}/slot/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken: this._sessionToken, fighterChoice: fighterChoice || 'blaze', stake }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    this._balance = { amount: (data.payout > 0 ? data.payout : 0) * 1_000_000, currency: 'USD' };
    // Refresh balance
    const balRes = await fetch(`${this._serverUrl}/balance?token=${this._sessionToken}`);
    const balData = await balRes.json();
    this._balance = { amount: balData.balance * 1_000_000, currency: 'USD' };

    return {
      balance: this._balance,
      round: {
        betId: data.roundId,
        amount,
        payout: data.payout * 1_000_000,
        payoutMultiplier: data.payout > 0 ? data.payout / stake : 0,
        active: false,
        mode,
        state: {
          winner: data.winner,
          fighterA: data.fighterA,
          fighterB: data.fighterB,
          tier: data.tier,
          seed: data.seed,
          seedHash: data.seedHash,
        },
      },
    };
  }

  async endRound() {
    return { balance: this._balance };
  }

  async event(eventValue) {
    return { event: eventValue };
  }

  getBalance() {
    return this._balance;
  }

  formatAmount(amount) {
    const value = amount / 1_000_000;
    return `$${value.toFixed(2)}`;
  }

  parseAmount(displayValue) {
    return displayValue * 1_000_000;
  }
}
