// ═══════════════════════════════════════════════════════════════════════════
// EFFECT RENDERERS — Fire trails, particles, projectiles
// ═══════════════════════════════════════════════════════════════════════════

// Fire trail spritesheet: 10 frames, 1200x360 total → 120x360 per frame
const fireTrailSprite = new Image();
fireTrailSprite.src = 'assets/sprites/fire-trail.jpg';
const FIRE_FRAMES = 10;
const FIRE_FRAME_W = 120;
const FIRE_FRAME_H = 360;
const FIRE_DRAW_W = 24;  // rendered width per flame
const FIRE_DRAW_H = 72;  // rendered height per flame

export function drawFireTrails(ctx, fireTrails, frame) {
  if (!fireTrailSprite.complete) return;
  for (const t of fireTrails) {
    const alpha = (t.life / t.maxLife) * 0.85;
    if (alpha <= 0) continue;
    // Each trail spot gets its own animation offset based on position
    const frameIdx = (Math.floor(frame * 0.15 + t.x * 0.3) % FIRE_FRAMES + FIRE_FRAMES) % FIRE_FRAMES;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      fireTrailSprite,
      frameIdx * FIRE_FRAME_W, 0, FIRE_FRAME_W, FIRE_FRAME_H,
      t.x - FIRE_DRAW_W / 2, t.y - FIRE_DRAW_H, FIRE_DRAW_W, FIRE_DRAW_H
    );
    ctx.restore();
  }
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / (p.maxLife||30));
    if (p.type === 'ring') {
      const progress = 1 - (p.life / (p.maxLife||30));
      const radius = p.size + progress * p.size * 3;
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = alpha * 0.7 * (1-progress);
      ctx.lineWidth = 3 * (1-progress*0.7);
      ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI*2); ctx.stroke();
    } else {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  ctx.globalAlpha = 1;
}

export function drawProjectiles(ctx, projectiles, frame) {
  for (const p of projectiles) {
    ctx.save();
    const angle = Math.atan2(p.vy, p.vx);
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);

    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;

    if (p.type === 'shard') {
      // Elongated ice crystal
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.size*2, 0);
      ctx.lineTo(0, p.size*0.5);
      ctx.lineTo(-p.size, 0);
      ctx.lineTo(0, -p.size*0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.arc(p.size*0.5, 0, p.size*0.2, 0, Math.PI*2); ctx.fill();
    } else if (p.type === 'fire') {
      // Flickering fire projectile
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#ffcc00';
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(0, 0, p.size*0.5, 0, Math.PI*2); ctx.fill();
    } else if (p.type === 'void_orb') {
      // Dark orb with inner void
      const vg = ctx.createRadialGradient(0,0,0,0,0,p.size);
      vg.addColorStop(0, '#000');
      vg.addColorStop(0.5, '#4400aa');
      vg.addColorStop(1, '#9944ff');
      ctx.fillStyle = vg;
      ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill();
    } else if (p.type === 'electric') {
      // Jagged lightning bolt
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-p.size*2, 0);
      for (let s = 1; s <= 3; s++) {
        const t = s / 3;
        const px = -p.size*2 + p.size*4*t;
        const offset = (Math.sin(frame * 0.5 + s * 2) * 4);
        ctx.lineTo(px, offset);
      }
      ctx.stroke();
      // White inner glow
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Glow at head
      ctx.fillStyle = '#FFD700';
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(p.size*2, 0, p.size*0.8, 0, Math.PI*2); ctx.fill();
    } else {
      // Toxic blob
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}
