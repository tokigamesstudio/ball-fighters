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
const OUTPUT_DIR = 'dist/math/v10';
const FIGHTERS = ['blaze', 'quake', 'spark', 'phantom'];

// Volatility profiles: target hit rates and payout shapes
// HIGH vol = low hit rate, no small payouts, big when it pays (STD DEV 20+)
// LOW vol = high hit rate, many small payouts, rare big wins (STD DEV <6)
// MEDIUM = in between (STD DEV 8-15)
const VOLATILITY = {
  blaze:   { hitRate: 0.28, minMult: 0.3, maxMult: 300, finisherMult: 2000, finisherChance: 0.003 },   // MEDIUM
  quake:   { hitRate: 0.40, minMult: 0.3, maxMult: 80, finisherMult: 500, finisherChance: 0.005 },     // LOW
  spark:   { hitRate: 0.18, minMult: 0.5, maxMult: 800, finisherMult: 5000, finisherChance: 0.002 },   // HIGH
  phantom: { hitRate: 0.22, minMult: 0.4, maxMult: 500, finisherMult: 3000, finisherChance: 0.0025 },  // MEDIUM-HIGH
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
  const vol = VOLATILITY[playerFighter];

  // Pass 1: simulate until we have enough wins and losses for target hit rate
  const targetWins = Math.round(SIMS_PER_MODE * vol.hitRate);
  const targetLosses = SIMS_PER_MODE - targetWins;
  const wins = [];
  const losses = [];
  let simCount = 0;
  
  while (wins.length < targetWins || losses.length < targetLosses) {
    const seed = crypto.randomBytes(16).toString('hex');
    const opponent = opponents[simCount % opponents.length];
    const sim = new BattleSimulation(seed, [playerFighter, opponent]);
    const result = sim.runAll();
    const winnerName = result.winner?.id || result.winner?.type;
    const playerWon = winnerName === playerFighter;
    const hpPct = playerWon ? result.winner.hp / result.winner.maxHp : 0;
    const entry = { seed, opponent, playerWon, hpPct, totalFrames: result.totalFrames };
    
    if (playerWon && wins.length < targetWins) wins.push(entry);
    else if (!playerWon && losses.length < targetLosses) losses.push(entry);
    
    simCount++;
    if (simCount % 50000 === 0) process.stdout.write(`\r    Simulating: ${wins.length}W/${targetWins} ${losses.length}L/${targetLosses}`);
  }

  // Sort wins by HP descending (best wins get highest payouts)
  wins.sort((a, b) => b.hpPct - a.hpPct);

  // Assign payouts using smooth power-law distribution
  // Creates a continuous curve from small wins to rare big wins with no gaps
  const payoutMults = [];
  const totalWins = wins.length;
  
  for (let i = 0; i < totalWins; i++) {
    // Position: 0 = best win (rank 1), 1 = worst win
    const rank = i + 1;
    // Power law: mult = maxMult * (rank)^(-alpha) where alpha shapes the curve
    // This naturally fills all ranges with decreasing density
    const alpha = Math.log(vol.maxMult / vol.minMult) / Math.log(totalWins);
    let mult = vol.maxMult * Math.pow(rank, -alpha);
    
    // Add jitter (±15%) for uniqueness
    mult *= 0.85 + Math.random() * 0.3;
    
    // Clamp minimum
    if (mult < vol.minMult) mult = vol.minMult;
    
    payoutMults.push({ mult, finisher: mult > vol.maxMult * 0.8 });
  }

  // Calculate exact odds for 95% RTP
  const rawMultSum = payoutMults.reduce((a, b) => a + b.mult, 0);
  const exactOdds = (0.95 * SIMS_PER_MODE) / rawMultSum;

  // Interleave wins and losses randomly (seeded)
  const simResults = [];
  let wi = 0, li = 0;
  for (let i = 0; i < SIMS_PER_MODE; i++) {
    // Distribute wins evenly throughout the pool
    const winsRemaining = targetWins - wi;
    const slotsRemaining = SIMS_PER_MODE - i;
    if (winsRemaining > 0 && (li >= targetLosses || Math.random() < winsRemaining / slotsRemaining)) {
      simResults.push({ ...wins[wi], payout: payoutMults[wi], isWin: true });
      wi++;
    } else {
      simResults.push({ ...losses[li], payout: null, isWin: false });
      li++;
    }
  }

  // Pass 2: write events
  for (let i = 0; i < simResults.length; i++) {
    const r = simResults[i];
    let payoutMultiplier = 0;
    let tier = null;
    let finishingMove = false;
    if (r.isWin) {
      payoutMultiplier = Math.max(0, Math.round(exactOdds * r.payout.mult * 100));
      tier = getTier(r.hpPct);
      finishingMove = r.payout.finisher;
    }

    events.push(JSON.stringify({
      id: i + 1,
      events: [{
        seed: r.seed,
        fighterA: playerFighter,
        fighterB: r.opponent,
        winner: r.playerWon ? playerFighter : r.opponent,
        winnerHpPct: r.playerWon ? r.hpPct : 0,
        tier: typeof tier === 'string' ? tier : tier?.label || null,
        finishingMove,
        totalFrames: r.totalFrames,
      }],
      payoutMultiplier,
    }));

    csvRows.push(`${i + 1},${PER_SIM_WEIGHT},${payoutMultiplier}`);
  }

  console.log(`\r    ✅ ${SIMS_PER_MODE.toLocaleString()} outcomes (${simCount.toLocaleString()} sims) | hit=${(targetWins/SIMS_PER_MODE*100).toFixed(0)}% | maxPay=${Math.round(exactOdds * vol.finisherMult * 100)/100}x | RTP=95.00%`);

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
