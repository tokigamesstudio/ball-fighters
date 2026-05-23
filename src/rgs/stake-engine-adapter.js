/**
 * Stake Engine RGS Adapter
 * 
 * Implements RGSAdapter using the stake-engine TypeScript client.
 * Wraps the Stake Engine SDK to conform to our generic RGS interface.
 * 
 * Requires: npm install stake-engine
 */
import { RGSAdapter } from './adapter-interface.js';

export class StakeEngineAdapter extends RGSAdapter {
  constructor({ url = window.location.href, enforceBetLevels = true } = {}) {
    super();
    this._url = url;
    this._enforceBetLevels = enforceBetLevels;
    this._client = null;
    this._balance = null;
    this._config = null;
    this._jurisdictionFlags = null;
  }

  async authenticate() {
    // Dynamic import so the game doesn't hard-depend on stake-engine at module level
    const { RGSClient, DisplayAmount } = await import('stake-engine');
    this._DisplayAmount = DisplayAmount;

    this._client = RGSClient({
      url: this._url,
      enforceBetLevels: this._enforceBetLevels,
    });

    const { balance, config, jurisdictionFlags, round } = await this._client.Authenticate();
    this._balance = balance;
    this._config = config;
    this._jurisdictionFlags = jurisdictionFlags;

    return {
      balance: { amount: balance.amount, currency: balance.currency },
      config: {
        betLevels: config.betLevels,
        defaultBetLevel: config.defaultBetLevel,
        minBet: config.minBet,
        maxBet: config.maxBet,
        stepBet: config.stepBet,
      },
      jurisdictionFlags: {
        disabledAutoplay: jurisdictionFlags.disabledAutoplay,
        disabledTurbo: jurisdictionFlags.disabledTurbo,
        disabledSpacebar: jurisdictionFlags.disabledSpacebar,
        disabledBuyFeature: jurisdictionFlags.disabledBuyFeature,
        disabledFullscreen: jurisdictionFlags.disabledFullscreen,
        displayRTP: jurisdictionFlags.displayRTP,
        displaySessionTimer: jurisdictionFlags.displaySessionTimer,
        minimumRoundDuration: jurisdictionFlags.minimumRoundDuration,
      },
      activeRound: round?.active ? {
        betId: round.betID,
        amount: round.amount,
        payout: round.payout,
        payoutMultiplier: round.payoutMultiplier,
        active: round.active,
        mode: round.mode,
        state: round.state,
      } : null,
    };
  }

  async play(amount, mode, options) {
    const { balance, round } = await this._client.Play({ amount, mode });
    this._balance = balance;

    return {
      balance: { amount: balance.amount, currency: balance.currency },
      round: {
        betId: round.betID,
        amount: round.amount,
        payout: round.payout,
        payoutMultiplier: round.payoutMultiplier,
        active: round.active,
        mode: round.mode,
        state: round.state,
      },
    };
  }

  async endRound() {
    const { balance } = await this._client.EndRound();
    this._balance = balance;
    return { balance: { amount: balance.amount, currency: balance.currency } };
  }

  async event(eventValue) {
    const { event } = await this._client.Event(eventValue);
    return { event };
  }

  getBalance() {
    return this._balance ? { amount: this._balance.amount, currency: this._balance.currency } : null;
  }

  formatAmount(amount) {
    if (!this._DisplayAmount || !this._balance) return String(amount);
    return this._DisplayAmount({ amount, currency: this._balance.currency });
  }

  parseAmount(displayValue) {
    return displayValue * 1_000_000;
  }
}
