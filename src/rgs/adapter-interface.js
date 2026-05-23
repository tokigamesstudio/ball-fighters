/**
 * RGS Adapter Interface (Client-Side)
 * 
 * Abstract interface for Remote Game Server communication.
 * Each RGS provider (Stake Engine, custom server, etc.) implements this.
 * The game client codes against this interface — never directly against a provider.
 */

/**
 * @typedef {Object} RGSConfig
 * @property {number[]} betLevels - Allowed bet amounts (provider-specific units)
 * @property {number} defaultBetLevel - Index into betLevels for default selection
 * @property {number} minBet
 * @property {number} maxBet
 * @property {number} stepBet
 */

/**
 * @typedef {Object} RGSBalance
 * @property {number} amount - Balance in provider units
 * @property {string} currency - ISO 4217 currency code
 */

/**
 * @typedef {Object} RGSJurisdictionFlags
 * @property {boolean} disabledAutoplay
 * @property {boolean} disabledTurbo
 * @property {boolean} disabledSpacebar
 * @property {boolean} disabledBuyFeature
 * @property {boolean} disabledFullscreen
 * @property {boolean} displayRTP
 * @property {boolean} displaySessionTimer
 * @property {number} minimumRoundDuration
 */

/**
 * @typedef {Object} RGSAuthResult
 * @property {RGSBalance} balance
 * @property {RGSConfig} config
 * @property {RGSJurisdictionFlags} jurisdictionFlags
 * @property {RGSRound|null} activeRound - Unfinished round from previous session
 */

/**
 * @typedef {Object} RGSRound
 * @property {string|number} betId
 * @property {number} amount
 * @property {number} payout
 * @property {number} payoutMultiplier
 * @property {boolean} active
 * @property {string} mode
 * @property {*} state - Game-specific state
 */

/**
 * @typedef {Object} RGSPlayResult
 * @property {RGSBalance} balance
 * @property {RGSRound} round
 */

/**
 * @typedef {Object} RGSEndRoundResult
 * @property {RGSBalance} balance
 */

export class RGSAdapter {
  /** Authenticate session, return balance + config + flags */
  async authenticate() { throw new Error('not implemented'); }

  /** Place a bet. Returns balance + round outcome. */
  async play(amount, mode, options) { throw new Error('not implemented'); }

  /** End an active round. Returns final balance. */
  async endRound() { throw new Error('not implemented'); }

  /** Send a game event (optional, for providers that support it) */
  async event(eventValue) { throw new Error('not implemented'); }

  /** Get current balance */
  getBalance() { throw new Error('not implemented'); }

  /** Format an amount for display (provider-specific scaling) */
  formatAmount(amount) { throw new Error('not implemented'); }

  /** Parse a display amount back to provider units */
  parseAmount(displayValue) { throw new Error('not implemented'); }
}
