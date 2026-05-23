import { BattleSimulation } from '../../src/core/simulation.js';

/**
 * Run a 1v1 simulation and return the result.
 * This port isolates the server from the client simulation module.
 * @param {string} seed
 * @param {[string, string]} fighters
 * @returns {{ winner: { type: string, hp: number, maxHp: number }, totalFrames: number }}
 */
export function runSimulation(seed, fighters) {
  const sim = new BattleSimulation(seed, fighters);
  const result = sim.runAll();
  return {
    winner: result.winner ? { type: result.winner.type, name: result.winner.name, hp: result.winner.hp, maxHp: result.winner.maxHp } : null,
    winnerHpPct: result.winner ? result.winner.hp / result.winner.maxHp : null,
    totalFrames: result.totalFrames
  };
}
