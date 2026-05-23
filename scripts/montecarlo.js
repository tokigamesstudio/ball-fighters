import { BattleSimulation } from '../src/core/simulation.js';
import { oddsForFighter } from '../server/odds.js';

function runMonteCarloSimulation(iterations, fighterNames = null) {
  const wins = {};
  
  for (let i = 0; i < iterations; i++) {
    const seed = `mc-${Date.now()}-${Math.random()}-${i}`;
    const sim = new BattleSimulation(seed, fighterNames);
    const result = sim.runAll();
    
    const winnerName = result.winner?.name || 'none';
    wins[winnerName] = (wins[winnerName] || 0) + 1;
    
    if ((i + 1) % 1000 === 0) {
      process.stdout.write(`\rProgress: ${i + 1}/${iterations}`);
    }
  }
  
  console.log(''); // newline after progress
  
  const results = Object.entries(wins)
    .map(([name, count]) => ({
      name,
      wins: count,
      percentage: (count / iterations * 100).toFixed(2)
    }))
    .sort((a, b) => b.wins - a.wins);
  
  return results;
}

console.log('=== Monte Carlo Battle Simulation ===\n');

console.log('Run 1: 10,000 battles');
const run1 = runMonteCarloSimulation(10000);
run1.forEach(r => console.log(`${r.name}: ${r.percentage}% (${r.wins} wins)`));

console.log('\nRun 2: 10,000 battles');
const run2 = runMonteCarloSimulation(10000);
run2.forEach(r => console.log(`${r.name}: ${r.percentage}% (${r.wins} wins)`));

console.log('\n=== Variance Analysis ===');
const fighters = [...new Set([...run1.map(r => r.name), ...run2.map(r => r.name)])];
fighters.forEach(name => {
  const pct1 = parseFloat(run1.find(r => r.name === name)?.percentage || 0);
  const pct2 = parseFloat(run2.find(r => r.name === name)?.percentage || 0);
  const variance = Math.abs(pct1 - pct2);
  console.log(`${name}: ${variance.toFixed(2)}% variance`);
});

console.log('\n=== 1v1 Matchup Analysis (5000 simulations each) ===\n');

const matchups = [
  ['blaze', 'quake'],
  ['blaze', 'spark'],
  ['blaze', 'phantom'],
  ['quake', 'spark'],
  ['quake', 'phantom'],
  ['spark', 'phantom']
];

matchups.forEach(([fighterA, fighterB]) => {
  console.log(`${fighterA.toUpperCase()} vs ${fighterB.toUpperCase()}`);
  const results = runMonteCarloSimulation(5000, [fighterA, fighterB]);
  
  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
  const aWins = results.find(r => r.name === capitalize(fighterA))?.wins || 0;
  const bWins = results.find(r => r.name === capitalize(fighterB))?.wins || 0;
  const aWinPct = (aWins / 5000 * 100).toFixed(2);
  const bWinPct = (bWins / 5000 * 100).toFixed(2);
  
  const aOdds = oddsForFighter(aWins / 5000, 0.05);
  const bOdds = oddsForFighter(bWins / 5000, 0.05);
  
  console.log(`  ${fighterA}: ${aWinPct}% wins → odds: ${aOdds.toFixed(2)}`);
  console.log(`  ${fighterB}: ${bWinPct}% wins → odds: ${bOdds.toFixed(2)}`);
  console.log('');
});
