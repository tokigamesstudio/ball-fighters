/**
 * Generate Stake Engine Math Upload Files (Per-Fighter Modes)
 * 
 * Produces 4 modes (one per fighter choice), each with:
 * - CSV lookup table
 * - Compressed JSONL game events
 * 
 * Usage: node scripts/generate-math-upload.js [sims_per_mode]
 * Default: 100,000 per mode (400k total)
 */
import { BattleSimulation } from '../src/core/simulation.js';
import { calcPayout, getTier } from '../server/payout.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import crypto from 'crypto';

const SIMS_PER_MODE = parseInt(process.argv[2]) || 100_000;
const OUTPUT_DIR = 'dist/math';
const FIGHTERS = ['blaze', 'quake', 'spark', 'phantom'];

if (existsSync(OUTPUT_DIR)) execSync(`rm -rf ${OUTPUT_DIR}`);
mkdirSync(OUTPUT_DIR, { recursive: true });

console.log(`\n🎰 Generating ${SIMS_PER_MODE.toLocaleString()} simulations × 4 fighters = ${(SIMS_PER_MODE * 4).toLocaleString()} total\n`);

const modes = [];

for (const playerFighter of FIGHTERS) {
  console.log(`  ⚔️  Mode: ${playerFighter}`);
  
  const opponents = FIGHTERS.filter(f => f !== playerFighter);
  const events = [];
  const csvRows = [];
  const PER_SIM_WEIGHT = 1000000n; // uniform weight

  // Pass 1: simulate and collect raw HP results
  const simResults = [];
  for (let i = 0; i < SIMS_PER_MODE; i++) {
    const seed = crypto.randomBytes(16).toString('hex');
    const opponent = opponents[i % opponents.length];
    const sim = new BattleSimulation(seed, [playerFighter, opponent]);
    const result = sim.runAll();
    const winnerName = result.winner?.id || result.winner?.type;
    const playerWon = winnerName === playerFighter;
    const hpPct = playerWon ? result.winner.hp / result.winner.maxHp : 0;
    simResults.push({ seed, opponent, playerWon, hpPct, totalFrames: result.totalFrames });
    if ((i + 1) % 50000 === 0) process.stdout.write(`\r    Simulating: ${i + 1}/${SIMS_PER_MODE}`);
  }

  // Pass 2: calculate exact odds for 95% RTP from this dataset
  // Use continuous HP-based multiplier for payout variety
  // multiplier = baseMin + (hpPct * range), scaled so average = 1.0 for 95% RTP
  // First, calculate raw multipliers
  // Finishing Move: ~1% of wins with HP > 0.8 get a 50x payout
  const FINISHING_MOVE_CHANCE = 0.02;
  const FINISHING_MOVE_MULT = 50;
  const FINISHING_MOVE_HP_THRESHOLD = 0.6;

  const rawMults = [];
  const finishingMoveFlags = [];
  for (const r of simResults) {
    if (r.playerWon) {
      const isFinisher = r.hpPct > FINISHING_MOVE_HP_THRESHOLD && Math.random() < FINISHING_MOVE_CHANCE;
      finishingMoveFlags.push(isFinisher);
      if (isFinisher) {
        rawMults.push(FINISHING_MOVE_MULT);
      } else {
        rawMults.push(0.5 + r.hpPct * 2.5);
      }
    }
  }
  // odds = 0.95 * N / sum(rawMults)
  const rawMultSum = rawMults.reduce((a, b) => a + b, 0);
  const exactOdds = (0.95 * SIMS_PER_MODE) / rawMultSum;

  // Pass 3: write events with continuous payouts
  let winIdx = 0;
  for (let i = 0; i < simResults.length; i++) {
    const r = simResults[i];
    let payoutMultiplier = 0;
    let tier = null;
    let finishingMove = false;
    if (r.playerWon) {
      const mult = rawMults[winIdx];
      const payout = exactOdds * mult;
      payoutMultiplier = Math.max(0, Math.round(payout * 100));
      tier = getTier(r.hpPct);
      finishingMove = finishingMoveFlags[winIdx];
      winIdx++;
    }

    events.push(JSON.stringify({
      id: i + 1,
      events: [{
        seed: r.seed,
        fighterA: playerFighter,
        fighterB: r.opponent,
        winner: r.playerWon ? playerFighter : r.opponent,
        winnerHpPct: r.hpPct,
        tier: tier?.label || null,
        finishingMove,
        totalFrames: r.totalFrames,
      }],
      payoutMultiplier,
    }));

    csvRows.push(`${i + 1},${PER_SIM_WEIGHT},${payoutMultiplier}`);
  }

  console.log(`\r    ✅ ${SIMS_PER_MODE.toLocaleString()} sims | odds=${exactOdds.toFixed(4)} | RTP=95.00%`);

  // Write JSONL
  const jsonlFile = `${playerFighter}_events.jsonl`;
  writeFileSync(`${OUTPUT_DIR}/${jsonlFile}`, events.join('\n') + '\n');

  // Compress
  try {
    execSync(`zstd --rm -f ${OUTPUT_DIR}/${jsonlFile}`, { stdio: 'pipe' });
  } catch {
    console.log(`    ⚠️  zstd failed — compress manually`);
  }

  // Write CSV
  const csvFile = `lookUpTable_${playerFighter}.csv`;
  writeFileSync(`${OUTPUT_DIR}/${csvFile}`, csvRows.join('\n') + '\n');

  modes.push({
    name: playerFighter,
    cost: 1.0,
    events: `${jsonlFile}.zst`,
    weights: csvFile,
  });
}

// Write index.json
writeFileSync(`${OUTPUT_DIR}/index.json`, JSON.stringify({ modes }, null, 2) + '\n');

console.log(`\n✅ Math upload folder ready: ${OUTPUT_DIR}/`);
console.log(`   Modes: ${FIGHTERS.join(', ')}`);
console.log(`   Frontend sends mode: client.Play({ amount, mode: '<fighter_name>' })\n`);
