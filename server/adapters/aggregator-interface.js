/**
 * Aggregator adapter interface.
 * Each aggregator (Relax, SoftSwiss, etc.) implements this.
 */
export class AggregatorAdapter {
  /** Validate session token, return { playerId, currency, balance } */
  async validateSession(token) { throw new Error('not implemented'); }
  /** Debit player via aggregator wallet */
  async debit(session, amount, txRef) { throw new Error('not implemented'); }
  /** Credit player via aggregator wallet */
  async credit(session, amount, txRef) { throw new Error('not implemented'); }
  /** Get current balance */
  async getBalance(session) { throw new Error('not implemented'); }
}
