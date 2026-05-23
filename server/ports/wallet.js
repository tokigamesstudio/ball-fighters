/**
 * Wallet port interface
 * @typedef {Object} WalletAdapter
 * @property {function(string, number, string): Promise<{success: boolean, balance: number}>} debit
 * @property {function(string, number, string): Promise<{success: boolean, balance: number}>} credit
 */

export function createMockWallet() {
  const balances = new Map();
  const processed = new Map(); // txRef -> result (idempotency)
  
  return {
    async debit(playerId, amount, txRef) {
      if (processed.has(txRef)) {
        return processed.get(txRef);
      }
      
      const currentBalance = balances.get(playerId) || 0;
      const newBalance = currentBalance - amount;
      balances.set(playerId, newBalance);
      
      const result = { success: true, balance: newBalance };
      processed.set(txRef, result);
      return result;
    },
    
    async credit(playerId, amount, txRef) {
      if (processed.has(txRef)) {
        return processed.get(txRef);
      }
      
      const currentBalance = balances.get(playerId) || 0;
      const newBalance = currentBalance + amount;
      balances.set(playerId, newBalance);
      
      const result = { success: true, balance: newBalance };
      processed.set(txRef, result);
      return result;
    }
  };
}
