/**
 * Asymmetric Balance Tuner
 * 
 * Targets specific win-rate splits per matchup to create meaningful
 * rock-paper-scissors dynamics, then outputs the odds table.
 * 
 * Target design:
 * - Each fighter has 1 strong matchup (~60%), 1 weak matchup (~40%), 1 even (~50%)
 * - blaze beats quake (55%), loses to spark (40%), even with phantom (50%)
 * - quake beats phantom (60%), loses to blaze (45%), even with spark (50%)  
 * - spark beats blaze (60%), loses to phantom (40%), even with quake (50%)
 * - phantom beats spark (60%), loses to quake (40%), even with blaze (50%)
 */
import { BattleSimulation } from '../src/core/simulation.js';

// Target win rates for fighter A in each matchup
const TARGETS = {
  'blaze:quake':   0.55,   // blaze favoured
  'blaze:phantom': 0.50,   // even
  'blaze:spark':   0.40,   // spark favoured
  'phantom:quake': 0.40,   // quake favoured
  'phantom:spark': 0.60,   // phantom favoured
  'quake:spark':   0.50,   // even
};

// Tunable parameters per fighter (subset that most affects win rates)
const TUNABLE = {
  blaze:   ['hp', 'skillCooldown', 'fireTrailDamage'],
  quake:   ['hp', 'skillCooldown', 'shockwaveDamage'],
  spark:   ['hp', 'skillCooldown', 'boltDamage'],
  phantom: ['hp', 'skillCooldown', 'boltDamage'],
};

// Current defaults (from fighter files)
let params = {
  blaze:   { hp: 73.11, skillCooldown: 150, fireTrailDamage: 3.80 },
  quake:   { hp: 85.22, skillCooldown: 112.60, shockwaveDamage: 35.00 },
  spark:   { hp: 84.63, skillCooldown: 90.51, boltDamage: 24.00 },
  phantom: { hp: 82.64, skillCooldown: 200, boltDamage: 26.83 },
};

const BOUNDS = {
  hp: [50, 130],
  skillCooldown: [60, 300],
  fireTrailDamage: [1, 8],
  shockwaveDamage: [15, 55],
  boltDamage: [12, 40],
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function simulateMatchup(fighterA, fighterB, configA, configB, n) {
  let winsA = 0;
  for (let i = 0; i < n; i++) {
    const seed = `tune-${fighterA}-${fighterB}-${i}-${Math.random()}`;
    const sim = new BattleSimulation(seed, [fighterA, fighterB], { [fighterA]: configA, [fighterB]: configB });
    const result = sim.runAll();
    const winnerName = result.winner?.id || result.winner?.type;
    if (winnerName === fighterA) winsA++;
  }
  return winsA / n;
}

function measureAll(params, n = 500) {
  const results = {};
  for (const [key, target] of Object.entries(TARGETS)) {
    const [a, b] = key.split(':');
    const rate = simulateMatchup(a, b, params[a], params[b], n);
    results[key] = rate;
  }
  return results;
}

function score(measured) {
  let total = 0;
  for (const [key, target] of Object.entries(TARGETS)) {
    total += (measured[key] - target) ** 2;
  }
  return total;
}

function printStatus(iter, measured, s) {
  console.log(`\n[Iteration ${iter}] Score: ${s.toFixed(6)}`);
  for (const [key, target] of Object.entries(TARGETS)) {
    const actual = measured[key];
    const diff = Math.abs(actual - target);
    const status = diff < 0.05 ? '✅' : diff < 0.10 ? '⚠️' : '❌';
    console.log(`  ${status} ${key}: ${(actual*100).toFixed(1)}% (target ${(target*100).toFixed(0)}%)`);
  }
}

// Evolutionary tuning with random perturbation
function tune(maxIters = 40) {
  let best = JSON.parse(JSON.stringify(params));
  let bestMeasured = measureAll(best, 600);
  let bestScore = score(bestMeasured);

  console.log('=== Asymmetric Balance Tuner ===\n');
  console.log('Targets:');
  for (const [key, target] of Object.entries(TARGETS)) {
    console.log(`  ${key}: ${(target*100).toFixed(0)}%`);
  }
  printStatus(0, bestMeasured, bestScore);

  let stepSize = 0.15;
  let staleCount = 0;

  for (let iter = 1; iter <= maxIters; iter++) {
    let improved = false;

    for (const fighter of Object.keys(TUNABLE)) {
      for (const param of TUNABLE[fighter]) {
        const original = best[fighter][param];
        const [min, max] = BOUNDS[param];

        for (const dir of [1, -1]) {
          const candidate = JSON.parse(JSON.stringify(best));
          candidate[fighter][param] = clamp(original * (1 + dir * stepSize), min, max);

          if (candidate[fighter][param] === original) continue;

          const measured = measureAll(candidate, 400);
          const s = score(measured);

          if (s < bestScore) {
            best = candidate;
            bestScore = s;
            bestMeasured = measured;
            improved = true;
            console.log(`  ↑ ${fighter}.${param}: ${original.toFixed(2)} → ${candidate[fighter][param].toFixed(2)} (score: ${s.toFixed(6)})`);
            break;
          }
        }
        if (improved) break;
      }
      if (improved) break;
    }

    if (!improved) {
      staleCount++;
      if (staleCount >= 3) {
        stepSize *= 0.6;
        staleCount = 0;
        if (stepSize < 0.02) {
          console.log('\nStep size too small, stopping.');
          break;
        }
        console.log(`  Reducing step to ${(stepSize*100).toFixed(1)}%`);
      }
    } else {
      staleCount = 0;
    }

    if (iter % 5 === 0 || bestScore < 0.005) {
      printStatus(iter, bestMeasured, bestScore);
    }

    if (bestScore < 0.003) {
      console.log('\n✅ Target achieved!');
      break;
    }
  }

  // Final high-precision measurement
  console.log('\n\n=== FINAL VERIFICATION (2000 sims per matchup) ===');
  const finalMeasured = measureAll(best, 2000);
  const finalScore = score(finalMeasured);
  printStatus('FINAL', finalMeasured, finalScore);

  console.log('\n=== TUNED PARAMETERS ===');
  console.log(JSON.stringify(best, null, 2));

  console.log('\n=== ODDS TABLE (for round.js) ===');
  console.log('const MATCHUP_PROBS = {');
  for (const [key, _] of Object.entries(TARGETS)) {
    const [a, b] = key.split(':');
    const rateA = finalMeasured[key];
    console.log(`  '${key}': { ${a}: ${rateA.toFixed(3)}, ${b}: ${(1-rateA).toFixed(3)} },`);
  }
  console.log('};');

  return { params: best, measured: finalMeasured };
}

tune();
