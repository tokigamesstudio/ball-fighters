// ═══════════════════════════════════════════════════════════════════════════
// MAIN RENDERER — Orchestrates all draw calls
// ═══════════════════════════════════════════════════════════════════════════

import { drawBlaze, drawQuake, drawSpark, drawPhantom } from './drawFighters.js';
import { drawFireTrails, drawParticles, drawProjectiles } from './drawEffects.js';

let activeCracks = [];
let deathExplosions = [];

export function resetCracks() {
  activeCracks = [];
}

export function resetExplosions() {
  deathExplosions = [];
}

function drawExplosions(ctx) {
  for (let i = deathExplosions.length - 1; i >= 0; i--) {
    const exp = deathExplosions[i];
    exp.life--;
    
    // Expanding shockwave ring
    const ringProgress = 1 - (exp.life / exp.maxLife);
    if (ringProgress < 0.4) {
      const ringRadius = ringProgress * 150;
      const ringAlpha = (0.4 - ringProgress) * 2.5;
      ctx.save();
      ctx.globalAlpha = ringAlpha;
      ctx.strokeStyle = exp.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = exp.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    
    // Particles
    let allDead = true;
    for (const p of exp.particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.3;
      p.alpha -= p.decay;
      if (p.alpha <= 0) continue;
      allDead = false;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (allDead && exp.life <= 0) deathExplosions.splice(i, 1);
  }
}

function drawCracks(ctx) {
  for (let i = activeCracks.length - 1; i >= 0; i--) {
    const c = activeCracks[i];
    c.length = Math.min(c.maxLength, c.length + c.maxLength / 8);
    c.life--;
    if (c.life <= 0) { activeCracks.splice(i, 1); continue; }
    const alpha = (c.life / c.maxLife) * 0.85;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 4;
    // draw main crack
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + Math.cos(c.angle) * c.length, c.y + Math.sin(c.angle) * c.length);
    ctx.stroke();
    // draw branches
    for (const b of c.branches) {
      const bx = c.x + Math.cos(c.angle) * c.length * b.t;
      const by = c.y + Math.sin(c.angle) * c.length * b.t;
      const bl = c.length * (1 - b.t) * 0.5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(b.angle) * bl, by + Math.sin(b.angle) * bl);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function renderFrame(ctx, canvas, fd, result, screenShake, floatingTexts, frame) {
  const W = canvas.width, H = canvas.height;

  // Screen shake
  if (screenShake.intensity > 0) {
    screenShake.intensity *= 0.82;
    screenShake.x = (Math.random()-0.5) * screenShake.intensity;
    screenShake.y = (Math.random()-0.5) * screenShake.intensity;
    if (screenShake.intensity < 0.3) screenShake.intensity = 0;
  }

  ctx.save();
  ctx.translate(screenShake.x, screenShake.y);

  // Background
  const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
  bg.addColorStop(0, '#0c0c18');
  bg.addColorStop(0.5, '#060610');
  bg.addColorStop(1, '#020206');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Arena border
  ctx.strokeStyle = 'rgba(180,180,255,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  // Subtle grid
  ctx.strokeStyle = 'rgba(60,60,120,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // Danger zone
  if (fd.dangerPad > 0) {
    const dp = fd.dangerPad + 50;
    const pulse = 0.5 + 0.5 * Math.sin(fd.frame * 0.04);
    ctx.strokeStyle = `rgba(255,30,0,${0.4 + pulse*0.3})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur = 10;
    ctx.strokeRect(dp, dp, W - dp*2, H - dp*2);
    ctx.shadowBlur = 0;
    // Edge glow
    const alpha = 0.08 + pulse * 0.05;
    let g = ctx.createLinearGradient(0,0,dp+30,0);
    g.addColorStop(0, `rgba(255,20,0,${alpha})`); g.addColorStop(1,'transparent');
    ctx.fillStyle = g; ctx.fillRect(0,0,dp+30,H);
    g = ctx.createLinearGradient(W,0,W-dp-30,0);
    g.addColorStop(0, `rgba(255,20,0,${alpha})`); g.addColorStop(1,'transparent');
    ctx.fillStyle = g; ctx.fillRect(W-dp-30,0,dp+30,H);
    g = ctx.createLinearGradient(0,0,0,dp+30);
    g.addColorStop(0, `rgba(255,20,0,${alpha})`); g.addColorStop(1,'transparent');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,dp+30);
    g = ctx.createLinearGradient(0,H,0,H-dp-30);
    g.addColorStop(0, `rgba(255,20,0,${alpha})`); g.addColorStop(1,'transparent');
    ctx.fillStyle = g; ctx.fillRect(0,H-dp-30,W,dp+30);
  }



  // Ground cracks
  drawCracks(ctx);

  // Effects
  drawFireTrails(ctx, fd.fireTrails, fd.frame);
  drawParticles(ctx, fd.particles);
  drawProjectiles(ctx, fd.projectiles, fd.frame);

  // Wall bounce flash for electric projectiles
  for (const p of fd.projectiles) {
    if (p.type === 'electric') {
      const distToWall = Math.min(p.x, p.y, W - p.x, H - p.y);
      if (distToWall < 30) {
        const flashAlpha = (30 - distToWall) / 30 * 0.4;
        ctx.fillStyle = `rgba(255,215,0,${flashAlpha})`;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  // Fighters
  for (const f of fd.fighters) {
    if (!f.alive) continue;

    ctx.save();
    ctx.translate(f.x, f.y);

    switch (f.type) {
      case 'blaze': drawBlaze(ctx, f, fd.frame); break;
      case 'quake': drawQuake(ctx, f, fd.frame); break;
      case 'spark': drawSpark(ctx, f, fd.frame); break;
      case 'phantom': drawPhantom(ctx, f, fd.frame); break;
    }

    ctx.restore();

    // HP arc around fighter
    const hpPct = f.hp / f.maxHp;
    const arcColor = hpPct > 0.6 ? f.color : hpPct > 0.3 ? '#ff9800' : '#f44336';
    ctx.strokeStyle = arcColor;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size + 5, -Math.PI/2, -Math.PI/2 + Math.PI*2*hpPct);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Flash (skip on last frame so it doesn't freeze on screen)
  if (fd.flash > 0.01 && fd.frame < result?.totalFrames - 1) {
    ctx.globalAlpha = fd.flash;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // Death explosions
  drawExplosions(ctx);

  // Floating damage text
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 1.2; ft.life--;
    const alpha = Math.max(0, ft.life / ft.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ft.color;
    ctx.font = `bold ${ft.size}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }
  ctx.globalAlpha = 1;

  // Process events
  for (const ev of fd.events) {
    if (ev.type === 'screenShake') screenShake.intensity = Math.max(screenShake.intensity, ev.intensity);
    if (ev.type === 'damage' && ev.amount >= 1) {
      floatingTexts.push({ x: ev.x + (Math.random()-0.5)*20, y: ev.y - 15, text: `-${ev.amount}`, color: ev.color || '#ff4444', size: 11 + Math.min(ev.amount * 0.4, 12), life: 35, maxLife: 35 });
    }
    if (ev.type === 'death') {
      const particles = [];
      // 40 regular particles
      for (let i = 0; i < 40; i++) {
        const angle = (Math.PI * 2 * i / 40) + (Math.random() - 0.5) * 0.3;
        const speed = 2 + Math.random() * 10;
        particles.push({
          x: ev.x, y: ev.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          size: 3 + Math.random() * 5,
          color: ev.color,
          alpha: 1,
          decay: 0.02 + Math.random() * 0.02
        });
      }
      // 8 larger chunks
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i / 8) + (Math.random() - 0.5) * 0.4;
        const speed = 1 + Math.random() * 3;
        particles.push({
          x: ev.x, y: ev.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 8 + Math.random() * 6,
          color: ev.color,
          alpha: 1,
          decay: 0.015 + Math.random() * 0.01
        });
      }
      deathExplosions.push({ x: ev.x, y: ev.y, color: ev.color, particles, life: 90, maxLife: 90 });
    }
    if (ev.type === 'teleport') {
      ctx.save();
      ctx.strokeStyle = 'rgba(140,60,255,0.4)';
      ctx.lineWidth = 2; ctx.setLineDash([8,4]);
      ctx.beginPath(); ctx.moveTo(ev.from.x, ev.from.y); ctx.lineTo(ev.to.x, ev.to.y); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
    if (ev.type === 'quakeShockwave') {
      const numCracks = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < numCracks; i++) {
        const angle = (Math.PI * 2 * i / numCracks) + (Math.random() - 0.5) * 0.5;
        const maxLength = 40 + Math.random() * 60;
        const branches = [];
        const numBranches = 1 + Math.floor(Math.random() * 2);
        for (let j = 0; j < numBranches; j++) {
          const t = 0.6 + Math.random() * 0.2;
          const branchAngle = angle + (Math.random() - 0.5) * 0.6;
          branches.push({ t, angle: branchAngle });
        }
        activeCracks.push({ 
          x: ev.x, y: ev.y, angle, length: 0, maxLength, 
          branches, life: 45, maxLife: 45 
        });
      }
    }
  }

  // Return slowMotion trigger
  return fd.events.some(e => e.type === 'death') ? 25 : 0;
}
