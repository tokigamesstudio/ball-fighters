/**
 * Math Validation for Stake Engine Submission
 * 
 * Produces:
 * - RTP verification
 * - Hit-rate table (non-zero wins frequency)
 * - Max-win and its achievability
 * - Unique payout amounts
 * - Distribution gap analysis
 * - Per-matchup breakdown
 */
import { BattleSimulation } from '../src/core/simulation.js';
import { calcPayout, getTier } from '../server/payout.js';
import { oddsForFighter } from '../server/odds.js';

const ITERATIONS = 100_000;
const HOUSE_EDGE = 0.05;
const STAKE = 1; // Normalize to 1 unit

// Matchup probabilities (from round.js)
const MATCHUP_PROBS = {
  'blaze:quake':   { blaze: 0.535, quake: 0.465 },
  'air:blaze':   { blaze: 0.384, air: 0.616 },
  'blaze:water': { blaze: 0.494, water: 0.506 },
  'air:quake':   { quake: 0.623, air: 0.377 },
  'water:quake': { water: 0.307, quake: 0.693 },
  'air:water': { water: 0.618, air: 0.382 },
};

const FIGHTERS = ['blaze', 'quake', 'air', 'water'];

function getMatchupKey(a, b) {
  return [a, b].sort().join(':');
}

function simulate(iterations) {
  const results = [];
  let totalWagered = 0;
  let totalPaid = 0;
  let wins = 0;
  const payoutAmounts = new Map(); // multiplier → count
  const tierCounts = { obliterate: 0, close: 0, clutch: 0 };
  const matchupStats = {};

  for (let i = 0; i < iterations; i++) {
    // Random matchup (player picks fighter, opponent is random)
    const playerFighter = FIGHTERS[Math.floor(Math.random() * FIGHTERS.length)];
    const opponents = FIGHTERS.filter(f => f !== playerFighter);
    const opponent = opponents[Math.floor(Math.random() * opponents.length)];

    const key = getMatchupKey(playerFighter, opponent);
    const probs = MATCHUP_PROBS[key];
    const playerWinProb = probs[playerFighter];
    const playerOdds = oddsForFighter(playerWinProb, HOUSE_EDGE);

    // Run simulation
    const seed = `math-${i}-${Date.now().toString(36)}`;
    const sim = new BattleSimulation(seed, [playerFighter, opponent]);
    const result = sim.runAll();

    totalWagered += STAKE;
    const winnerType = result.winner?.type;
    // Map type to fighter name
    const typeToName = { fire: 'blaze', earth: 'quake', electric: 'air', void: 'water' };
    const winnerName = typeToName[winnerType] || winnerType;
    const playerWon = winnerName === playerFighter;

    let payout = 0;
    if (playerWon) {
      wins++;
      const hpPct = result.winner.hp / result.winner.maxHp;
      payout = calcPayout(STAKE, playerOdds, hpPct);
      const tier = getTier(hpPct);
      tierCounts[tier.label.toLowerCase().replace(' ', '')] = (tierCounts[tier.label.toLowerCase().replace(' ', '')] || 0) + 1;

      // Round multiplier to 2 decimal places for grouping
      const mult = Math.round(payout * 100) / 100;
      payoutAmounts.set(mult, (payoutAmounts.get(mult) || 0) + 1);
    }

    totalPaid += payout;

    // Track per-matchup
    if (!matchupStats[key]) matchupStats[key] = { played: 0, playerWins: 0, totalPaid: 0 };
    matchupStats[key].played++;
    if (playerWon) matchupStats[key].playerWins++;
    matchupStats[key].totalPaid += payout;

    if ((i + 1) % 10000 === 0) process.stdout.write(`\r  Simulating: ${i + 1}/${iterations}`);
  }
  console.log('');

  return { totalWagered, totalPaid, wins, payoutAmounts, tierCounts, matchupStats, iterations };
}

function analyzeResults(data) {
  const { totalWagered, totalPaid, wins, payoutAmounts, tierCounts, matchupStats, iterations } = data;

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         STAKE ENGINE MATH VALIDATION REPORT                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // RTP
  const rtp = (totalPaid / totalWagered) * 100;
  console.log('┌─── RTP ───────────────────────────────────────────────────────');
  console.log(`│ Simulations:    ${iterations.toLocaleString()}`);
  console.log(`│ Total Wagered:  ${totalWagered.toFixed(2)}`);
  console.log(`│ Total Paid:     ${totalPaid.toFixed(2)}`);
  console.log(`│ RTP:            ${rtp.toFixed(4)}%`);
  console.log(`│ Target:         95.00%`);
  console.log(`│ Allowed Range:  90% - 97.7%`);
  console.log(`│ Status:         ${rtp >= 90 && rtp <= 97.7 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('└────────────────────────────────────────────────────────────────\n');

  // Hit Rate
  const hitRate = iterations / wins;
  console.log('┌─── HIT RATE (Non-Zero Wins) ──────────────────────────────────');
  console.log(`│ Wins:           ${wins.toLocaleString()} / ${iterations.toLocaleString()}`);
  console.log(`│ Win Rate:       ${(wins / iterations * 100).toFixed(2)}%`);
  console.log(`│ Hit Rate:       1 in ${hitRate.toFixed(2)}`);
  console.log(`│ Requirement:    1 in 1-8 (not > 10 for base mode)`);
  console.log(`│ Status:         ${hitRate <= 10 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('└────────────────────────────────────────────────────────────────\n');

  // Tier Distribution (of wins)
  console.log('┌─── WIN TIER DISTRIBUTION ─────────────────────────────────────');
  const obliterate = tierCounts.obliterate || 0;
  const close = tierCounts.closecall || tierCounts.close || 0;
  const clutch = tierCounts.clutch || 0;
  console.log(`│ Obliterate (HP>60%):  ${obliterate} (${(obliterate/wins*100).toFixed(1)}% of wins) → 2.19x tier mult`);
  console.log(`│ Close Call (HP 20-60%): ${close} (${(close/wins*100).toFixed(1)}% of wins) → 0.95x tier mult`);
  console.log(`│ Clutch (HP<20%):      ${clutch} (${(clutch/wins*100).toFixed(1)}% of wins) → 0.67x tier mult`);
  console.log('└────────────────────────────────────────────────────────────────\n');

  // Max Win
  const sortedPayouts = [...payoutAmounts.keys()].sort((a, b) => b - a);
  const maxWin = sortedPayouts[0] || 0;
  const maxWinCount = payoutAmounts.get(maxWin) || 0;
  const maxWinHitRate = iterations / maxWinCount;

  // Theoretical max: best odds × obliterate multiplier
  // Best odds = (1 - 0.05) / lowest_win_prob → air vs quake: 0.377 → odds 2.52
  const theoreticalMaxOdds = oddsForFighter(0.307, HOUSE_EDGE); // phantom vs quake (30.7%)
  const theoreticalMax = STAKE * theoreticalMaxOdds * 2.19;

  console.log('┌─── MAX WIN ───────────────────────────────────────────────────');
  console.log(`│ Observed Max:       ${maxWin.toFixed(4)}x stake`);
  console.log(`│ Theoretical Max:    ${theoreticalMax.toFixed(4)}x stake`);
  console.log(`│ Max Win Hit Rate:   1 in ${maxWinHitRate.toFixed(0)}`);
  console.log(`│ Requirement:        Achievable at 1 in 20,000,000 or more frequent`);
  console.log(`│ Status:             ${maxWinHitRate <= 20_000_000 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('└────────────────────────────────────────────────────────────────\n');

  // Unique Payout Amounts
  const uniquePayouts = payoutAmounts.size;
  console.log('┌─── UNIQUE PAYOUT AMOUNTS ─────────────────────────────────────');
  console.log(`│ Unique Payouts:     ${uniquePayouts}`);
  console.log(`│ Status:             ${uniquePayouts >= 10 ? '✅ PASS (reasonable variety)' : '⚠️  LOW VARIETY'}`);
  console.log('└────────────────────────────────────────────────────────────────\n');

  // Hit-Rate Table (top 20 most common payouts)
  console.log('┌─── HIT-RATE TABLE (Top 20 Payouts) ───────────────────────────');
  console.log('│ Multiplier    │ Count    │ Hit Rate     │ % of Wins');
  console.log('│───────────────┼──────────┼──────────────┼──────────────');
  const sortedByFreq = [...payoutAmounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [mult, count] of sortedByFreq) {
    const hr = (iterations / count).toFixed(1);
    const pctWins = (count / wins * 100).toFixed(2);
    console.log(`│ ${mult.toFixed(4).padStart(12)}x │ ${String(count).padStart(8)} │ 1 in ${hr.padStart(7)} │ ${pctWins.padStart(6)}%`);
  }
  console.log('└────────────────────────────────────────────────────────────────\n');

  // Distribution Gap Analysis
  console.log('┌─── DISTRIBUTION GAP ANALYSIS ─────────────────────────────────');
  const sortedMults = [...payoutAmounts.keys()].sort((a, b) => a - b);
  let maxGap = 0;
  let gapStart = 0, gapEnd = 0;
  for (let i = 1; i < sortedMults.length; i++) {
    const gap = sortedMults[i] - sortedMults[i - 1];
    if (gap > maxGap) {
      maxGap = gap;
      gapStart = sortedMults[i - 1];
      gapEnd = sortedMults[i];
    }
  }
  console.log(`│ Payout Range:       ${sortedMults[0]?.toFixed(4)}x - ${sortedMults[sortedMults.length-1]?.toFixed(4)}x`);
  console.log(`│ Largest Gap:        ${gapStart.toFixed(4)}x → ${gapEnd.toFixed(4)}x (${maxGap.toFixed(4)})`);
  console.log(`│ Status:             ${maxGap < 1.0 ? '✅ PASS (no significant gaps)' : '⚠️  LARGE GAP'}`);
  console.log('└────────────────────────────────────────────────────────────────\n');

  // Session frequency check
  console.log('┌─── SESSION FREQUENCY CHECK ───────────────────────────────────');
  const mostFreqPayout = sortedByFreq[0];
  if (mostFreqPayout) {
    const sessionSpins = 200; // typical session
    const expectedOccurrences = sessionSpins / (iterations / mostFreqPayout[1]);
    console.log(`│ Most frequent result: ${mostFreqPayout[0].toFixed(4)}x (${mostFreqPayout[1]} times)`);
    console.log(`│ Expected per ${sessionSpins}-spin session: ${expectedOccurrences.toFixed(1)} times`);
    console.log(`│ Status:             ${expectedOccurrences < sessionSpins * 0.5 ? '✅ PASS' : '⚠️  TOO FREQUENT'}`);
  }
  console.log('└────────────────────────────────────────────────────────────────\n');

  // Per-matchup RTP
  console.log('┌─── PER-MATCHUP RTP ───────────────────────────────────────────');
  for (const [key, stats] of Object.entries(matchupStats)) {
    const matchupRtp = stats.played > 0 ? (stats.totalPaid / (stats.played * STAKE) * 100).toFixed(2) : 'N/A';
    console.log(`│ ${key.padEnd(16)} │ RTP: ${matchupRtp}% │ Win Rate: ${(stats.playerWins/stats.played*100).toFixed(1)}% │ n=${stats.played}`);
  }
  console.log('└────────────────────────────────────────────────────────────────\n');
}

console.log('\n🎰 Running Math Validation...\n');
const data = simulate(ITERATIONS);
analyzeResults(data);
