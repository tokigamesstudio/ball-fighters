// ═══════════════════════════════════════════════════════════════════════════
// UI RENDERERS — HP bars, kill feed, winner overlay, timer
// ═══════════════════════════════════════════════════════════════════════════

export function updateHPBars(fighters) {
  const header = document.getElementById('header');
  const cards = header.children;

  for (let i = 0; i < fighters.length; i++) {
    const f = fighters[i];
    const pct = Math.max(0, f.hp / f.maxHp * 100);
    const hpColor = pct > 60 ? f.color : pct > 30 ? '#ff9800' : '#f44336';

    let card = cards[i];
    if (!card) {
      card = document.createElement('div');
      card.className = 'competitor-info';
      card.innerHTML = `
        <div class="avatar" style="background:${f.color}22;color:${f.color}">${f.emoji}</div>
        <div class="info">
          <div class="name"><span>${f.name}</span><span class="hp-text">${Math.ceil(f.hp)}</span></div>
          <div class="hp-bar"><div class="hp-fill"></div></div>
        </div>`;
      header.appendChild(card);
    }

    card.className = 'competitor-info' + (f.alive ? '' : ' dead');
    card.querySelector('.hp-fill').style.width = pct + '%';
    card.querySelector('.hp-fill').style.background = `linear-gradient(90deg, ${hpColor}, ${f.color})`;
    card.querySelector('.hp-text').textContent = Math.ceil(f.hp);
  }
}

export function updateKillFeed(result, frameIdx, killFeedEntries) {
  if (!result) return;
  const newKills = result.kills.filter(k => k.frame === frameIdx);
  const feedEl = document.getElementById('kill-feed');
  for (const k of newKills) {
    const killer = result.frames[0].fighters.find(f => f.id === k.killer);
    const victim = result.frames[0].fighters.find(f => f.id === k.victim);
    if (!victim) continue;
    const entry = document.createElement('div');
    entry.className = 'kill-entry';
    entry.style.borderColor = killer?.color || '#888';
    entry.innerHTML = `<span style="color:${killer?.color||'#888'}">${killer?.emoji||'?'} ${killer?.name||'?'}</span> ⚔️ <span style="color:${victim.color}">${victim.name}</span>`;
    feedEl.appendChild(entry);
    killFeedEntries.push(entry);
    while (killFeedEntries.length > 4) { killFeedEntries.shift().remove(); }
  }
}

export function showWinner(result) {
  if (!result) return;
  const overlay = document.getElementById('winner-overlay');
  const w = result.winner;
  document.getElementById('winner-name').textContent = `${w.emoji} ${w.name} Wins!`;
  document.getElementById('winner-name').style.color = w.color;

  let statsText = `HP: ${Math.ceil(w.hp)}/${w.maxHp} • ${(result.totalFrames/60).toFixed(1)}s`;

  if (result.serverResult) {
    const sr = result.serverResult;
    const playerWon = sr.playerBet === sr.winner;
    if (playerWon) {
      document.getElementById('winner-name').textContent = `${w.emoji} ${sr.tier}!`;
      statsText = `${sr.narrative} • Won £${Number(sr.payout).toFixed(2)}`;
    } else {
      statsText = `Defeated. • ${(result.totalFrames/60).toFixed(1)}s`;
    }
  } else {
    statsText += ` • Seed: ${result.seed}`;
  }
  
  document.getElementById('winner-stats').textContent = statsText;
  overlay.style.display = 'flex';
}

export function updateTimer(frame, dangerPad) {
  const secs = Math.floor(frame / 60);
  document.getElementById('timer').textContent =
    `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}` +
    (dangerPad > 0 ? ' ⚠️ DANGER' : '');
}
