export function createMemoryStore() {
  const rounds = new Map();
  const bets = new Map();
  return {
    getRound: (id) => rounds.get(id) ?? null,
    saveRound: (r) => rounds.set(r.id, r),
    getBetsForRound: (roundId) => [...bets.values()].filter(b => b.roundId === roundId),
    saveBet: (b) => bets.set(b.id, b),
    updateBet: (id, updates) => bets.set(id, { ...bets.get(id), ...updates })
  };
}
