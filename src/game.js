import { BattleSimulation } from './core/simulation.js';
import { renderFrame, resetCracks, resetExplosions } from './rendering/renderer.js';
import { updateHPBars, updateKillFeed, showWinner, updateTimer } from './rendering/drawUI.js';
import { triggerFinishingMove, resetFinishingMove, drawFinishingMove } from './rendering/finishingMoves.js';
import { createRGSAdapter } from './rgs/index.js';

const rgs = createRGSAdapter();

const canvas = document.getElementById('arena');
const ctx = canvas.getContext('2d');

let currentResult = null;
let frames = [];
let playbackFrame = 0;
let playing = false;
let animId = null;
let playbackSpeed = 0.75;
let playbackAccum = 0;
let screenShake = { x: 0, y: 0, intensity: 0 };
let killFeedEntries = [];
let floatingTexts = [];
let slowMotion = 0;
let selectedFighter = null;
let opponentFighter = null;
let deathHoldFrames = 0;
let rgsConfig = null;
let jurisdictionFlags = null;

const fighterColors = {
  blaze: '#ff4400',
  boulder: '#8B4513',
  spark: '#FFD700',
  phantom: '#9B59B6'
};

function showErrorMessage(msg) {
  const el = document.getElementById('error-message');
  if (el) { el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 4000); }
}

function playback() {
  if (!playing || (playbackFrame >= frames.length && deathHoldFrames <= 0)) {
    if (playbackFrame >= frames.length && deathHoldFrames <= 0 && playing) {
      playing = false;
      showWinner(currentResult);
      document.getElementById('btn-reset').style.display = 'block';
      updateBalanceDisplay();
    }
    return;
  }

  // If on last frame, hold
  if (playbackFrame >= frames.length) {
    deathHoldFrames--;
    // Keep rendering last frame
    const fd = frames[frames.length - 1];
    renderFrame(ctx, canvas, fd, currentResult, screenShake, floatingTexts, fd.frame);
    // Draw finishing move animation on top
    drawFinishingMove(ctx, canvas.width, canvas.height);
    // Draw progress bar at 100%
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(0, canvas.height - 2, canvas.width, 2);
    animId = requestAnimationFrame(playback);
    return;
  }

  let speed = playbackSpeed;
  if (slowMotion > 0) {
    slowMotion--;
    speed = speed / 2;
  }

  playbackAccum += speed;
  const steps = Math.floor(playbackAccum);
  playbackAccum -= steps;

  for (let s = 0; s < steps; s++) {
    if (playbackFrame >= frames.length) break;
    const fd = frames[playbackFrame];
    if (s === steps - 1) {
      slowMotion = renderFrame(ctx, canvas, fd, currentResult, screenShake, floatingTexts, fd.frame);
      updateHPBars(fd.fighters);
      updateTimer(fd.frame, fd.dangerPad);
      // Draw progress bar
      const progress = playbackFrame / frames.length;
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(0, canvas.height - 2, canvas.width * progress, 2);
    }
    updateKillFeed(currentResult, fd.frame, killFeedEntries);
    playbackFrame++;
    
    // Set hold when reaching last frame
    if (playbackFrame === frames.length) {
      deathHoldFrames = 90;
      // Trigger finishing move animation if applicable
      if (currentResult?.serverResult?.finishingMove && currentResult.winner) {
        const winner = frames[frames.length - 1].fighters.find(f => f.alive);
        if (winner) {
          triggerFinishingMove(winner.id || winner.type, winner.x, winner.y);
          deathHoldFrames = 120; // longer hold for finishing move
        }
      }
    }
  }

  animId = requestAnimationFrame(playback);
}

async function startBattle() {
  if (!selectedFighter) return;

  document.getElementById('winner-overlay').style.display = 'none';
  document.getElementById('kill-feed').innerHTML = '';
  document.getElementById('header').innerHTML = '';
  killFeedEntries = [];
  floatingTexts = [];
  slowMotion = 0;
  deathHoldFrames = 0;
  screenShake = { x: 0, y: 0, intensity: 0 };

  // Hide fighter select, show reset button
  document.getElementById('fighter-select').style.display = 'none';
  document.getElementById('btn-fight').style.display = 'none';
  document.getElementById('btn-reset').style.display = 'block';

  const stakeInput = parseFloat(document.getElementById('stake-input').value) || 10;
  const amount = rgs.parseAmount(stakeInput);

  // Immediately show deducted balance for anticipation
  const currentBalance = rgs.getBalance();
  if (currentBalance) {
    document.getElementById('balance-display').textContent = rgs.formatAmount(currentBalance.amount - amount);
  }

  let playResult;
  try {
    playResult = await rgs.play(amount, selectedFighter, { fighterChoice: selectedFighter });
  } catch (err) {
    if (err.message.includes('nsufficient') || err.message.includes('balance')) {
      updateBalanceDisplay();
      showErrorMessage('Insufficient balance. Please reduce your stake.');
    } else {
      showErrorMessage(err.message || 'Something went wrong. Please try again.');
    }
    document.getElementById('btn-reset').style.display = 'block';
    return;
  }

  // Extract game state from round
  const state = playResult.round.state || {};
  const seed = state.seed;
  const fighterA = state.fighterA || selectedFighter;
  const fighterB = state.fighterB;
  document.getElementById('seed-input').value = seed || '';

  // End round if active
  if (playResult.round.active) {
    await rgs.endRound();
  }

  requestAnimationFrame(() => {
    const sim = new BattleSimulation(seed, [fighterA, fighterB]);
    const result = sim.runAll();
    
    // Attach server payout info to result for display
    result.serverResult = state;
    result.serverResult.payout = playResult.round.payout / 1_000_000;
    result.serverResult.payoutMultiplier = playResult.round.payoutMultiplier;
    
    currentResult = result;
    frames = result.frames;
    playbackFrame = 0;
    playbackAccum = 0;
    playing = true;
    if (animId) cancelAnimationFrame(animId);
    playback();
  });
}

function reset() {
  playing = false;
  if (animId) cancelAnimationFrame(animId);
  frames = [];
  currentResult = null;
  playbackFrame = 0;
  playbackAccum = 0;
  selectedFighter = null;
  opponentFighter = null;
  deathHoldFrames = 0;
  document.getElementById('winner-overlay').style.display = 'none';
  document.getElementById('kill-feed').innerHTML = '';
  document.getElementById('header').innerHTML = '';
  document.getElementById('seed-input').value = '';
  document.getElementById('seed-input').style.display = 'none';
  document.getElementById('timer').textContent = '00:00';
  killFeedEntries = [];
  floatingTexts = [];
  slowMotion = 0;
  resetCracks();
  resetExplosions();
  resetFinishingMove();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Show fighter select, hide reset button
  document.getElementById('fighter-select').style.display = 'flex';
  document.getElementById('btn-fight').style.display = 'block';
  document.getElementById('btn-fight').disabled = true;
  document.getElementById('btn-reset').style.display = 'none';
  
  // Clear selection
  document.querySelectorAll('.fighter-card').forEach(card => {
    card.classList.remove('selected');
    card.style.borderColor = '';
    card.style.boxShadow = '';
  });
}

// Fighter selection
document.querySelectorAll('.fighter-card').forEach(card => {
  card.addEventListener('click', () => {
    selectedFighter = card.dataset.fighter;
    
    // Update UI
    document.querySelectorAll('.fighter-card').forEach(c => {
      c.classList.remove('selected');
      c.style.borderColor = '';
      c.style.boxShadow = '';
    });
    
    card.classList.add('selected');
    const color = fighterColors[selectedFighter];
    card.style.borderColor = color;
    card.style.boxShadow = `0 0 20px ${color}40`;
    
    document.getElementById('btn-fight').disabled = false;
  });
});

// Event listeners
document.getElementById('btn-fight').addEventListener('click', startBattle);
document.getElementById('btn-reset').addEventListener('click', reset);
document.getElementById('btn-play-again').addEventListener('click', () => {
  // Reset state but keep selectedFighter, then start immediately
  playing = false;
  if (animId) cancelAnimationFrame(animId);
  frames = []; currentResult = null; playbackFrame = 0; playbackAccum = 0;
  deathHoldFrames = 0; killFeedEntries = []; floatingTexts = []; slowMotion = 0;
  screenShake = { x: 0, y: 0, intensity: 0 };
  resetExplosions(); resetCracks(); resetFinishingMove();
  document.getElementById('winner-overlay').style.display = 'none';
  document.getElementById('kill-feed').innerHTML = '';
  document.getElementById('header').innerHTML = '';
  document.getElementById('seed-input').value = '';
  startBattle();
});

document.getElementById('btn-paytable').addEventListener('click', () => {
  document.getElementById('paytable-modal').style.display = 'flex';
});
document.getElementById('btn-close-paytable').addEventListener('click', () => {
  document.getElementById('paytable-modal').style.display = 'none';
});
document.getElementById('paytable-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
});

document.querySelectorAll('#speed-controls button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#speed-controls button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    playbackSpeed = parseFloat(btn.dataset.speed);
  });
});

document.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (jurisdictionFlags?.disabledSpacebar) return;
    if (selectedFighter && !playing) {
      startBattle();
    }
  }
});

function updateBalanceDisplay() {
  const balance = rgs.getBalance();
  if (balance) {
    document.getElementById('balance-display').textContent = rgs.formatAmount(balance.amount);
  }
}

async function initRGS() {
  try {
    const authResult = await rgs.authenticate();
    rgsConfig = authResult.config;
    jurisdictionFlags = authResult.jurisdictionFlags;
    document.getElementById('balance-display').textContent = rgs.formatAmount(authResult.balance.amount);

    // Resume interrupted round
    if (authResult.activeRound) {
      await rgs.endRound();
      updateBalanceDisplay();
    }
  } catch (err) {
    showErrorMessage('Could not connect to game server.');
  }
}

// Listen for balance updates (Stake Engine emits these on window)
window.addEventListener('balanceUpdate', (event) => {
  if (playing) return; // suppress during match to avoid spoiler
  const detail = event.detail;
  if (detail) {
    document.getElementById('balance-display').textContent = rgs.formatAmount(detail.amount);
  }
});

// Share button removed — Stake Engine handles replays

// Verify button removed — Stake Engine handles provably fair

// URL parameter handling for replay mode
const urlParams = new URLSearchParams(window.location.search);
const isReplay = urlParams.has('replay') || (urlParams.has('seed') && urlParams.has('a') && urlParams.has('b'));

if (isReplay) {
  const seed = urlParams.get('seed');
  const fighterA = urlParams.get('a');
  const fighterB = urlParams.get('b') || 'quake';
  const currency = urlParams.get('currency') || 'USD';
  const lang = urlParams.get('lang') || 'en';
  const amount = urlParams.get('amount');

  // Hide betting UI, show replay UI
  document.getElementById('fighter-select').style.display = 'none';
  document.getElementById('btn-fight').style.display = 'none';
  const stakeInput = document.getElementById('stake-input');
  if (stakeInput) stakeInput.style.display = 'none';

  // Show bet cost if amount provided
  if (amount) {
    const displayAmount = (parseInt(amount) / 1_000_000).toFixed(2);
    const costEl = document.getElementById('replay-cost');
    if (costEl) costEl.textContent = `Bet: ${displayAmount} ${currency}`;
    else {
      const el = document.createElement('div');
      el.id = 'replay-cost';
      el.style.cssText = 'position:absolute;top:10px;left:10px;color:#fff;font-size:14px;background:rgba(0,0,0,0.7);padding:4px 10px;border-radius:4px;z-index:100;';
      el.textContent = `Bet: ${displayAmount} ${currency}`;
      document.body.appendChild(el);
    }
  }

  // Run replay
  function runReplay() {
    document.getElementById('winner-overlay').style.display = 'none';
    document.getElementById('kill-feed').innerHTML = '';
    killFeedEntries = [];
    floatingTexts = [];
    slowMotion = 0;
    deathHoldFrames = 0;
    screenShake = { x: 0, y: 0, intensity: 0 };
    resetCracks();
    resetExplosions();
    resetFinishingMove();    const sim = new BattleSimulation(seed, [fighterA, fighterB]);
    const result = sim.runAll();
    currentResult = result;
    frames = result.frames;
    playbackFrame = 0;
    playbackAccum = 0;
    playing = true;
    if (animId) cancelAnimationFrame(animId);

    // Override playback end to show replay button
    const origShowWinner = showWinner;
    playback();
  }

  // Override the end-of-playback to show replay button
  const _origPlayback = playback;

  document.getElementById('seed-input').value = seed;
  setTimeout(runReplay, 300);

  // Create replay button (shown at end)
  const replayBtn = document.getElementById('btn-play-again');
  if (replayBtn) {
    replayBtn.textContent = '↻ Replay';
    replayBtn.onclick = () => {
      document.getElementById('winner-overlay').style.display = 'none';
      runReplay();
    };
  }
} else if (urlParams.has('seed') && urlParams.has('a') && !urlParams.has('b')) {
  // Legacy share link (no replay mode, just pre-select fighter)
  const seed = urlParams.get('seed');
  const fighterA = urlParams.get('a');
  document.getElementById('seed-input').value = seed;
  const card = document.querySelector(`.fighter-card[data-fighter="${fighterA}"]`);
  if (card) {
    selectedFighter = fighterA;
    card.classList.add('selected');
    const color = fighterColors[selectedFighter];
    card.style.borderColor = color;
    card.style.boxShadow = `0 0 20px ${color}40`;
    document.getElementById('btn-fight').disabled = false;
  }
}

// Load balance on startup (skip in replay mode)
if (!isReplay) {
  initRGS();
}
