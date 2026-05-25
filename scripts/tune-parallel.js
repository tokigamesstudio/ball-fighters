import { BattleSimulation } from '../src/core/simulation.js';

const PARAMS = {
  blaze:   { hp:[60,180], skillCooldown:[50,150], impulsePower:[2,7], fireTrailDamage:[1,5] },
  quake:   { hp:[60,180], skillCooldown:[80,180], shockwaveDamage:[15,40], shockwaveRange:[120,280] },
  air:   { hp:[60,180], skillCooldown:[40,100], boltDamage:[8,24], directionChangeInterval:[25,70] },
  water: { hp:[60,180], skillCooldown:[100,200], boltDamage:[12,30], homingInterval:[20,50], dashPower:[5,12] }
};

const PAIRS = [
  ['blaze', 'quake'],
  ['blaze', 'air'],
  ['blaze', 'water'],
  ['quake', 'air'],
  ['quake', 'water'],
  ['air', 'water']
];

function clamp(val, [min, max]) {
  return Math.max(min, Math.min(max, val));
}

function randomParams() {
  const params = {};
  for (const [fighter, bounds] of Object.entries(PARAMS)) {
    params[fighter] = {};
    for (const [key, [min, max]] of Object.entries(bounds)) {
      params[fighter][key] = min + Math.random() * (max - min);
    }
  }
  return params;
}

function mutate(params) {
  const mutated = JSON.parse(JSON.stringify(params));
  for (const fighter of Object.keys(PARAMS)) {
    for (const key of Object.keys(PARAMS[fighter])) {
      mutated[fighter][key] *= (1 + (Math.random() * 0.3 - 0.15));
      mutated[fighter][key] = clamp(mutated[fighter][key], PARAMS[fighter][key]);
    }
  }
  return mutated;
}

function evaluateParams(params) {
  const results = {};
  for (const [a, b] of PAIRS) {
    let wins = 0;
    for (let i = 0; i < 150; i++) {
      const sim = new BattleSimulation(`tune-${a}-${b}-${i}`, [a, b], params);
      const result = sim.runAll();
      if (result.winner?.id === a) wins++;
    }
    results[`${a}_vs_${b}`] = wins / 150;
  }
  
  let score = 0;
  for (const rate of Object.values(results)) {
    score += Math.max(0, rate - 0.65) ** 2;
    score += Math.max(0, 0.35 - rate) ** 2;
  }
  
  return { score, results };
}

function tune() {
  console.log('🎯 Starting parallel balance tuner (CMA-ES lite)\n');
  console.log('Population: 16 | Max generations: 40 | Target: all matchups 35-65%\n');
  
  let population = Array.from({ length: 16 }, randomParams);
  let bestEver = null;
  
  for (let gen = 0; gen < 40; gen++) {
    console.log(`\n━━━ Generation ${gen + 1} ━━━`);
    
    const evaluated = population.map((params, i) => {
      process.stdout.write(`Evaluating candidate ${i + 1}/16...`);
      const result = evaluateParams(params);
      process.stdout.write(` score: ${result.score.toFixed(4)}\r`);
      return { params, ...result };
    });
    
    evaluated.sort((a, b) => a.score - b.score);
    const best = evaluated[0];
    
    if (!bestEver || best.score < bestEver.score) {
      bestEver = best;
    }
    
    console.log(`\nBest score: ${best.score.toFixed(4)}`);
    console.log('Matchup rates:', Object.entries(best.results)
      .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
      .join(', '));
    
    if (best.score < 0.001) {
      console.log('\n✅ Converged! Score < 0.001');
      break;
    }
    
    const elites = evaluated.slice(0, 4);
    const newPop = elites.map(e => e.params);
    
    for (let i = 0; i < 12; i++) {
      const parent = elites[Math.floor(Math.random() * 4)].params;
      newPop.push(mutate(parent));
    }
    
    population = newPop;
  }
  
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏆 BEST PARAMETERS FOUND');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Final score:', bestEver.score.toFixed(6));
  console.log('\nMatchup win rates:');
  for (const [pair, rate] of Object.entries(bestEver.results)) {
    const status = rate >= 0.35 && rate <= 0.65 ? '✓' : '✗';
    console.log(`  ${status} ${pair}: ${(rate * 100).toFixed(1)}%`);
  }
  
  console.log('\nParameters:');
  for (const [fighter, params] of Object.entries(bestEver.params)) {
    console.log(`\n${fighter}:`);
    for (const [key, val] of Object.entries(params)) {
      console.log(`  ${key}: ${val.toFixed(2)}`);
    }
  }
  
  // Calculate avg fight duration
  console.log('\nCalculating average fight duration...');
  let totalFrames = 0;
  let count = 0;
  for (const [a, b] of PAIRS) {
    for (let i = 0; i < 10; i++) {
      const sim = new BattleSimulation(`duration-${a}-${b}-${i}`, [a, b], bestEver.params);
      const result = sim.runAll();
      totalFrames += result.totalFrames;
      count++;
    }
  }
  const avgDuration = (totalFrames / count / 60).toFixed(1);
  console.log(`Average fight duration: ${avgDuration}s`);
  
  return bestEver.params;
}

tune();
