// ═══════════════════════════════════════════════════════════════════════════
// EFFECT RENDERERS — Fire trails, particles, projectiles
// ═══════════════════════════════════════════════════════════════════════════

export function drawFireTrails(ctx, fireTrails, frame) {
  for (const t of fireTrails) {
    const alpha = (t.life / t.maxLife) * 0.85;
    if (alpha <= 0) continue;
    
    // Draw 3 flame tongues per trail spot
    for (let i = 0; i < 3; i++) {
      const flicker = Math.sin(frame * 0.4 + t.x * 0.1 + i * 2.1) * 0.5 + 0.5; // 0-1
      const height = 12 + flicker * 10; // 12-22px tall
      const width = 6 + Math.sin(frame * 0.3 + i * 1.4) * 2; // 4-8px wide
      const offsetX = (i - 1) * 7 + Math.sin(frame * 0.25 + i) * 3;
      const cx = t.x + offsetX;
      const cy = t.y;
      
      // Flame gradient: orange base -> yellow mid -> white tip
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy - height * 0.5, height);
      grad.addColorStop(0, `rgba(255,60,0,${alpha})`);
      grad.addColorStop(0.4, `rgba(255,140,0,${alpha * 0.8})`);
      grad.addColorStop(0.75, `rgba(255,220,0,${alpha * 0.5})`);
      grad.addColorStop(1, `rgba(255,255,200,0)`);
      
      // Teardrop flame shape using bezier curves
      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, cy); // base
      ctx.bezierCurveTo(
        cx + width, cy - height * 0.3,
        cx + width * 0.5, cy - height * 0.8,
        cx + Math.sin(frame * 0.2 + i) * 2, cy - height // tip sways
      );
      ctx.bezierCurveTo(
        cx - width * 0.5, cy - height * 0.8,
        cx - width, cy - height * 0.3,
        cx, cy
      );
      ctx.fill();
      ctx.restore();
    }
    
    // Ember particles: small bright dots floating up
    for (let e = 0; e < 2; e++) {
      const emberPhase = (frame * 0.08 + t.x * 0.05 + e * 3.7) % 1;
      const ex = t.x + Math.sin(frame * 0.15 + e * 2.3) * 8;
      const ey = t.y - emberPhase * 25;
      const ea = alpha * (1 - emberPhase) * 0.9;
      ctx.save();
      ctx.globalAlpha = ea;
      ctx.fillStyle = emberPhase < 0.5 ? '#ffcc00' : '#ff6600';
      ctx.beginPath();
      ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
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
