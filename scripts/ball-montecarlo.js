import { BattleSimulation } from '../src/core/simulation.js';

function runMatchup(fighterA, fighterB, iterations = 500) {
  let winsA = 0;
  for (let i = 0; i < iterations; i++) {
    const seed = `balance-${fighterA}-${fighterB}-${i}`;
    const sim = new BattleSimulation(seed, [fighterA, fighterB]);
    const result = sim.runAll();
    if (result.winner?.type === fighterA) winsA++;
  }
  return winsA / iterations;
}

console.log('=== Ball Fighter 1v1 Matchup Analysis (500 simulations each) ===\n');

const matchups = [
  ['blaze', 'boulder'],
  ['blaze', 'air'],
  ['blaze', 'water'],
  ['boulder', 'air'],
  ['boulder', 'water'],
  ['air', 'water'],
];

matchups.forEach(([a, b]) => {
  const rate = runMatchup(a, b);
  const status = (rate >= 0.25 && rate <= 0.75) ? '✓' : '✗';
  console.log(`${status} ${a} vs ${b}: ${(rate * 100).toFixed(1)}% / ${((1-rate) * 100).toFixed(1)}%`);
});
