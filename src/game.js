import { BattleSimulation } from './core/simulation.js';
import { renderFrame, resetCracks, resetExplosions } from './rendering/renderer.js';
import { updateHPBars, updateKillFeed, showWinner, updateTimer } from './rendering/drawUI.js';

const SERVER_URL = 'http://localhost:4001';

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

const fighterColors = {
  blaze: '#ff4400',
  boulder: '#8B4513',
  spark: '#FFD700',
  phantom: '#9B59B6'
};

function generateSeed() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function showErrorMessage(msg) {
  const el = document.getElementById('error-message');
  if (el) { el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 4000); }
}

function getOrCreatePlayerId() {
  let id = localStorage.getItem('arena_player_id');
  if (!id) { id = 'player_' + Math.random().toString(36).slice(2); localStorage.setItem('arena_player_id', id); }
  return id;
}

function playback() {
  if (!playing || (playbackFrame >= frames.length && deathHoldFrames <= 0)) {
    if (playbackFrame >= frames.length && deathHoldFrames <= 0 && playing) {
      playing = false;
      showWinner(currentResult);
      document.getElementById('btn-reset').style.display = 'block';
      fetchBalance();
    }
    return;
  }

  // If on last frame, hold
  if (playbackFrame >= frames.length) {
    deathHoldFrames--;
    // Keep rendering last frame
    const fd = frames[frames.length - 1];
    renderFrame(ctx, canvas, fd, currentResult, screenShake, floatingTexts, fd.frame);
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

  const stake = parseFloat(document.getElementById('stake-input').value) || 10;
  // Immediately show deducted balance for anticipation
  const currentBalance = parseFloat(document.getElementById('balance-display').textContent.replace('£','')) || 0;
  document.getElementById('balance-display').textContent = `£${(currentBalance - stake).toFixed(2)}`;

  let serverResult;
  try {
    const res = await fetch(`${SERVER_URL}/slot/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: getOrCreatePlayerId(),
        fighterChoice: selectedFighter,
        stake
      })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 402) {
        fetchBalance(); // restore correct balance display
        showErrorMessage('Insufficient balance. Please reduce your stake.');
      } else {
        showErrorMessage(body.error || 'Something went wrong. Please try again.');
      }
      document.getElementById('btn-reset').style.display = 'block';
      return;
    }
    serverResult = await res.json();
  } catch (err) {
    showErrorMessage('Could not connect to server. Please try again.');
    document.getElementById('btn-reset').style.display = 'block';
    return;
  }

  // Server determined the seed and opponent — play it back locally
  const seed = serverResult.seed;
  const fighterA = serverResult.fighterA;
  const fighterB = serverResult.fighterB;
  document.getElementById('seed-input').value = seed;

  requestAnimationFrame(() => {
    const sim = new BattleSimulation(seed, [fighterA, fighterB]);
    const result = sim.runAll();
    
    // Attach server payout info to result for display
    result.serverResult = serverResult;
    
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
  resetExplosions(); resetCracks();
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
    if (selectedFighter && !playing) {
      startBattle();
    }
  }
});

async function fetchBalance() {
  try {
    const res = await fetch(`${SERVER_URL}/balance?token=${getOrCreatePlayerId()}`);
    if (!res.ok) return;
    const { balance } = await res.json();
    document.getElementById('balance-display').textContent = `£${Number(balance).toFixed(2)}`;
  } catch {}
}

// Share button - copy replay URL to clipboard
document.getElementById('btn-share').addEventListener('click', async () => {
  if (!currentResult || !currentResult.frames || currentResult.frames.length === 0) return;
  const seed = document.getElementById('seed-input').value;
  const fighterA = currentResult.frames[0].fighters[0].type;
  const fighterB = currentResult.frames[0].fighters[1].type;
  const url = `${window.location.origin}${window.location.pathname}?seed=${seed}&a=${fighterA}&b=${fighterB}`;
  
  try {
    await navigator.clipboard.writeText(url);
    const btn = document.getElementById('btn-share');
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = originalText; }, 2000);
  } catch {}
});

// Verify button - show seed input
document.getElementById('btn-verify').addEventListener('click', () => {
  const seedInput = document.getElementById('seed-input');
  seedInput.style.display = seedInput.style.display === 'none' ? 'block' : 'none';
});

// URL parameter handling for auto-replay
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('seed') && urlParams.has('a')) {
  const seed = urlParams.get('seed');
  const fighterA = urlParams.get('a');
  
  // Pre-fill seed
  document.getElementById('seed-input').value = seed;
  
  // Auto-select fighter
  const card = document.querySelector(`.fighter-card[data-fighter="${fighterA}"]`);
  if (card) {
    selectedFighter = fighterA;
    card.classList.add('selected');
    const color = fighterColors[selectedFighter];
    card.style.borderColor = color;
    card.style.boxShadow = `0 0 20px ${color}40`;
    document.getElementById('btn-fight').disabled = false;
    
    // Auto-start after 500ms
    setTimeout(() => startBattle(), 500);
  }
}

// Load balance on startup
fetchBalance();
