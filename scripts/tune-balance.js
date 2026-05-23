import { BattleSimulation } from '../src/core/simulation.js';

// Initial parameters extracted from fighter files
const initialParams = {
  blaze: {
    speed: 4.5,
    hp: 80,
    projectileDamage: 28,
    projectileCooldown: 40,
    fireTrailDamage: 2
  },
  boulder: {
    speed: 2.7,
    hp: 130,
    collisionDamage: 12,
    projectileDamage: 31,
    projectileCooldown: 47
  },
  spark: {
    speed: 5,
    hp: 75,
    projectileDamage: 18,
    projectileCooldown: 30
  },
  phantom: {
    speed: 3.5,
    hp: 95,
    projectileDamage: 18,
    projectileCooldown: 50,
    teleportCooldown: 300
  }
};

// Parameter bounds
const bounds = {
  speed: [1, 15],
  hp: [30, 300],
  projectileDamage: [1, 50],
  collisionDamage: [1, 50],
  projectileCooldown: [15, 200],
  fireTrailDamage: [1, 10],
  teleportCooldown: [100, 500]
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function simulatePair(fighterA, fighterB, configA, configB, n = 300) {
  let winsA = 0;
  for (let i = 0; i < n; i++) {
    const seed = `tune-${fighterA}-${fighterB}-${Date.now()}-${Math.random()}-${i}`;
    const sim = new BattleSimulation(seed, [fighterA, fighterB], { [fighterA]: configA, [fighterB]: configB });
    const result = sim.runAll();
    if (result.winner?.type === fighterA) winsA++;
  }
  return winsA / n;
}

function measureAllPairs(params) {
  const fighters = Object.keys(params);
  const pairs = [];
  
  for (let i = 0; i < fighters.length; i++) {
    for (let j = i + 1; j < fighters.length; j++) {
      pairs.push([fighters[i], fighters[j]]);
    }
  }
  
  const winRates = [];
  for (const [a, b] of pairs) {
    const rateA = simulatePair(a, b, params[a], params[b]);
    winRates.push({ a, b, rateA });
  }
  
  return winRates;
}

function balanceScore(winRates) {
  let penalty = 0;
  for (const { rateA } of winRates) {
    if (rateA < 0.35) penalty += (0.35 - rateA) ** 2;
    if (rateA > 0.65) penalty += (rateA - 0.65) ** 2;
  }
  return penalty;
}

function coordinateDescent(params, maxIterations = 100) {
  let currentParams = JSON.parse(JSON.stringify(params));
  let currentWinRates = measureAllPairs(currentParams);
  let currentScore = balanceScore(currentWinRates);
  
  console.log(`Initial balance score: ${currentScore.toFixed(4)}`);
  console.log('Initial win rates:');
  currentWinRates.forEach(({ a, b, rateA }) => {
    console.log(`  ${a} vs ${b}: ${(rateA * 100).toFixed(1)}% / ${((1 - rateA) * 100).toFixed(1)}%`);
  });
  console.log('');
  
  let stepSize = 0.1; // Start with 10% perturbation
  let noImprovementCount = 0;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    let improved = false;
    
    // Try perturbing each parameter
    for (const fighter of Object.keys(currentParams)) {
      for (const param of Object.keys(currentParams[fighter])) {
        const originalValue = currentParams[fighter][param];
        const [min, max] = bounds[param];
        
        // Try +stepSize
        const upValue = clamp(originalValue * (1 + stepSize), min, max);
        if (upValue !== originalValue) {
          currentParams[fighter][param] = upValue;
          const newWinRates = measureAllPairs(currentParams);
          const newScore = balanceScore(newWinRates);
          
          if (newScore < currentScore) {
            currentScore = newScore;
            currentWinRates = newWinRates;
            improved = true;
            noImprovementCount = 0;
            console.log(`[${iter + 1}] Improved: ${fighter}.${param} = ${upValue.toFixed(2)} (score: ${newScore.toFixed(4)})`);
            continue;
          }
          currentParams[fighter][param] = originalValue;
        }
        
        // Try -stepSize
        const downValue = clamp(originalValue * (1 - stepSize), min, max);
        if (downValue !== originalValue) {
          currentParams[fighter][param] = downValue;
          const newWinRates = measureAllPairs(currentParams);
          const newScore = balanceScore(newWinRates);
          
          if (newScore < currentScore) {
            currentScore = newScore;
            currentWinRates = newWinRates;
            improved = true;
            noImprovementCount = 0;
            console.log(`[${iter + 1}] Improved: ${fighter}.${param} = ${downValue.toFixed(2)} (score: ${newScore.toFixed(4)})`);
            continue;
          }
          currentParams[fighter][param] = originalValue;
        }
      }
    }
    
    if ((iter + 1) % 5 === 0 || !improved) {
      console.log(`\n[${iter + 1}] Current balance score: ${currentScore.toFixed(4)} (step: ${(stepSize * 100).toFixed(0)}%)`);
      currentWinRates.forEach(({ a, b, rateA }) => {
        const status = (rateA >= 0.35 && rateA <= 0.65) ? '✓' : '✗';
        console.log(`  ${status} ${a} vs ${b}: ${(rateA * 100).toFixed(1)}% / ${((1 - rateA) * 100).toFixed(1)}%`);
      });
      console.log('');
    }
    
    if (!improved) {
      noImprovementCount++;
      // Reduce step size when stuck
      if (stepSize > 0.02) {
        stepSize *= 0.5;
        console.log(`Reducing step size to ${(stepSize * 100).toFixed(0)}%\n`);
        noImprovementCount = 0;
      } else {
        console.log('No improvement found with minimum step size. Stopping.');
        break;
      }
    }
    
    if (currentScore < 0.001) {
      console.log('Near-perfect balance achieved!');
      break;
    }
  }
  
  return { params: currentParams, score: currentScore, winRates: currentWinRates };
}

console.log('=== Balance Tuner — Coordinate Descent ===\n');
console.log('Running 300 simulations per matchup (1800 total per evaluation)\n');

const result = coordinateDescent(initialParams);

console.log('\n=== FINAL RESULTS ===\n');
console.log('Optimal parameters:');
console.log(JSON.stringify(result.params, null, 2));
console.log(`\nFinal balance score: ${result.score.toFixed(4)}`);
console.log('\nFinal win rates:');
result.winRates.forEach(({ a, b, rateA }) => {
  const status = (rateA >= 0.35 && rateA <= 0.65) ? '✓' : '✗';
  console.log(`  ${status} ${a} vs ${b}: ${(rateA * 100).toFixed(1)}% / ${((1 - rateA) * 100).toFixed(1)}%`);
});
