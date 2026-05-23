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

// Per-mode flat odds calibrated for 95% RTP
// Derived from: 0.95 / (actualWinRate * avgTierMultiplier)
const MODE_ODDS = {
  blaze: 2.43,
  quake: 1.73,
  spark: 1.77,
  phantom: 1.80,
};

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

  for (let i = 0; i < SIMS_PER_MODE; i++) {
    const seed = crypto.randomBytes(16).toString('hex');
    
    // Cycle through opponents evenly
    const opponent = opponents[i % opponents.length];

    // Flat odds for this mode (calibrated for 95% RTP)
    const playerOdds = MODE_ODDS[playerFighter];

    // Run simulation
    const sim = new BattleSimulation(seed, [playerFighter, opponent]);
    const result = sim.runAll();

    const winnerName = result.winner?.id || result.winner?.type;
    const playerWon = winnerName === playerFighter;

    let payoutMultiplier = 0;
    let tier = null;

    if (playerWon) {
      const hpPct = result.winner.hp / result.winner.maxHp;
      const payout = calcPayout(1, playerOdds, hpPct);
      payoutMultiplier = Math.round(payout * 100);
      tier = getTier(hpPct);
    }

    events.push(JSON.stringify({
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
    }));

    csvRows.push(`${i + 1},${PER_SIM_WEIGHT},${payoutMultiplier}`);

    if ((i + 1) % 25000 === 0) process.stdout.write(`\r    Progress: ${i + 1}/${SIMS_PER_MODE}`);
  }

  console.log(`\r    ✅ ${SIMS_PER_MODE.toLocaleString()} simulations done`);

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
