/**
 * Generate Stake Engine Math Upload Files
 * 
 * Produces:
 * - index.json (mode declarations)
 * - lookUpTable_base.csv (simulation_number, probability, payout_multiplier)
 * - base_events.jsonl (game outcomes, to be compressed with zstd)
 * 
 * Usage: node scripts/generate-math-upload.js [num_simulations]
 * Then:  cd dist/math && zstd base_events.jsonl
 */
import { BattleSimulation } from '../src/core/simulation.js';
import { calcPayout, getTier } from '../server/payout.js';
import { oddsForFighter } from '../server/odds.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import crypto from 'crypto';

const NUM_SIMS = parseInt(process.argv[2]) || 100_000;
const OUTPUT_DIR = 'dist/math';
const HOUSE_EDGE = 0.05;
const FIGHTERS = ['blaze', 'quake', 'spark', 'phantom'];

const MATCHUP_PROBS = {
  'blaze:quake':   { blaze: 0.545, quake: 0.455 },
  'blaze:spark':   { blaze: 0.402, spark: 0.598 },
  'blaze:phantom': { blaze: 0.490, phantom: 0.510 },
  'quake:spark':   { quake: 0.489, spark: 0.511 },
  'phantom:quake': { phantom: 0.370, quake: 0.630 },
  'phantom:spark': { phantom: 0.587, spark: 0.413 },
};

function getMatchupKey(a, b) {
  return [a, b].sort().join(':');
}

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

console.log(`\n🎰 Generating ${NUM_SIMS.toLocaleString()} simulations for Stake Engine...\n`);

const events = [];
const csvRows = [];

// Probability per simulation (uniform for now — each outcome equally likely to be selected)
// Stake Engine uses uint64 probabilities that sum to a large number
// We use uniform weighting: each sim has probability 1/NUM_SIMS
// Represented as integer: total_weight / NUM_SIMS per sim
const TOTAL_WEIGHT = BigInt(NUM_SIMS) * 1000000n; // large integer for precision
const PER_SIM_WEIGHT = TOTAL_WEIGHT / BigInt(NUM_SIMS);

for (let i = 0; i < NUM_SIMS; i++) {
  // Generate deterministic seed
  const seed = crypto.randomBytes(16).toString('hex');
  
  // Random player fighter and opponent
  const playerFighter = FIGHTERS[i % FIGHTERS.length];
  const opponents = FIGHTERS.filter(f => f !== playerFighter);
  const opponent = opponents[Math.floor(Math.random() * opponents.length)];

  // Get odds for this matchup
  const key = getMatchupKey(playerFighter, opponent);
  const probs = MATCHUP_PROBS[key];
  const playerWinProb = probs[playerFighter];
  const playerOdds = oddsForFighter(playerWinProb, HOUSE_EDGE);

  // Run simulation
  const sim = new BattleSimulation(seed, [playerFighter, opponent]);
  const result = sim.runAll();

  // Determine outcome
  const winnerName = result.winner?.id || result.winner?.type;
  const playerWon = winnerName === playerFighter;

  let payoutMultiplier = 0; // integer: 0 = loss, 100 = 1.00x
  let tier = null;

  if (playerWon) {
    const hpPct = result.winner.hp / result.winner.maxHp;
    const payout = calcPayout(1, playerOdds, hpPct); // stake=1 to get multiplier
    payoutMultiplier = Math.round(payout * 100); // integer representation (100 = 1x)
    tier = getTier(hpPct);
  }

  // Event data (what the /play API returns to the frontend)
  const event = {
    id: i + 1,
    events: [{
      seed,
      fighterA: playerFighter,
      fighterB: opponent,
      winner: playerWon ? playerFighter : opponent,
      winnerHpPct: result.winner ? result.winner.hp / result.winner.maxHp : 0,
      tier: tier?.label || null,
      totalFrames: result.totalFrames,
    }],
    payoutMultiplier,
  };

  events.push(JSON.stringify(event));

  // CSV row: simulation_number, probability (uint64), payout_multiplier
  csvRows.push(`${i + 1},${PER_SIM_WEIGHT},${payoutMultiplier}`);

  if ((i + 1) % 10000 === 0) process.stdout.write(`\r  Progress: ${i + 1}/${NUM_SIMS}`);
}

console.log('\n\n  Writing files...');

// Write JSONL
const jsonlPath = `${OUTPUT_DIR}/base_events.jsonl`;
writeFileSync(jsonlPath, events.join('\n') + '\n');
console.log(`  ✅ ${jsonlPath} (${events.length} events)`);

// Write CSV
const csvPath = `${OUTPUT_DIR}/lookUpTable_base.csv`;
writeFileSync(csvPath, csvRows.join('\n') + '\n');
console.log(`  ✅ ${csvPath}`);

// Compress with zstd
try {
  execSync(`zstd --rm -f ${jsonlPath}`, { stdio: 'pipe' });
  console.log(`  ✅ ${jsonlPath}.zst (compressed)`);
} catch (e) {
  console.log(`  ⚠️  zstd compression failed — compress manually: zstd ${jsonlPath}`);
}

// Write index.json
const index = {
  modes: [{
    name: 'base',
    cost: 1.0,
    events: 'base_events.jsonl.zst',
    weights: 'lookUpTable_base.csv',
  }],
};
writeFileSync(`${OUTPUT_DIR}/index.json`, JSON.stringify(index, null, 2) + '\n');
console.log(`  ✅ ${OUTPUT_DIR}/index.json`);

console.log(`\n✅ Math upload folder ready at: ${OUTPUT_DIR}/`);
console.log(`   Upload this folder via the "Math" button in Stake Engine ACP.\n`);
