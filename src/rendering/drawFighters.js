// ═══════════════════════════════════════════════════════════════════════════
// FIGHTER RENDERERS — Each fighter has unique visual style
// ═══════════════════════════════════════════════════════════════════════════

// Spritesheet cache
const spritesheets = {};
function getSpritesheet(name, src, frames, frameSize) {
  if (!spritesheets[name]) {
    const img = new Image();
    img.src = src;
    spritesheets[name] = { img, frames, frameSize, loaded: false };
    img.onload = () => { spritesheets[name].loaded = true; };
  }
  return spritesheets[name];
}

export function drawBlaze(ctx, f, frame) {
  const sheet = getSpritesheet('blaze', 'assets/spritesheets/blaze_idle_v2.png', 8, 512);
  if (sheet.loaded) {
    const frameIdx = Math.floor((frame / 5) % sheet.frames); // 12 FPS at 60 FPS game loop
    const drawSize = f.size * 4;
    ctx.drawImage(sheet.img, frameIdx * sheet.frameSize, 0, sheet.frameSize, sheet.frameSize, -drawSize/2, -drawSize/2, drawSize, drawSize);
    return;
  }

  // Fallback: procedural rendering if spritesheet not loaded
  const g = ctx.createRadialGradient(0, 0, f.size*0.3, 0, 0, f.size*2);
  g.addColorStop(0, 'rgba(255,100,0,0.4)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, f.size*2, 0, Math.PI*2); ctx.fill();

  // Main ball
  const bodyGrad = ctx.createRadialGradient(-3, -3, 0, 0, 0, f.size);
  bodyGrad.addColorStop(0, '#ffdd44');
  bodyGrad.addColorStop(0.4, '#ff6600');
  bodyGrad.addColorStop(1, '#cc2200');
  ctx.fillStyle = bodyGrad;
  ctx.shadowColor = '#ff4400';
  ctx.shadowBlur = 15;
  ctx.beginPath(); ctx.arc(0, 0, f.size, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // Flame crown on top of ball
  for (let i = 0; i < 3; i++) {
    const flicker = Math.sin(frame * 0.4 + i * 2.1) * 0.5 + 0.5;
    const height = 8 + flicker * 6; // 8-14px
    const width = 4 + Math.sin(frame * 0.3 + i * 1.4) * 1.5;
    const offsetX = (i - 1) * 6;
    const cx = offsetX;
    const cy = -f.size;
    
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy - height * 0.5, height);
    grad.addColorStop(0, '#ff4400');
    grad.addColorStop(0.6, '#ff8800');
    grad.addColorStop(1, '#ffcc00');
    
    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(
      cx + width, cy - height * 0.3,
      cx + width * 0.5, cy - height * 0.8,
      cx + Math.sin(frame * 0.2 + i) * 1.5, cy - height
    );
    ctx.bezierCurveTo(
      cx - width * 0.5, cy - height * 0.8,
      cx - width, cy - height * 0.3,
      cx, cy
    );
    ctx.fill();
    ctx.restore();
  }

  // Flame particles
  for (let i = 0; i < 5; i++) {
    const a = (frame * 0.1 + i * 1.3) % (Math.PI * 2);
    const d = f.size + 8 + Math.sin(frame * 0.15 + i) * 4;
    ctx.fillStyle = `rgba(255,${120 + Math.random()*60},0,0.6)`;
    ctx.beginPath(); ctx.arc(Math.cos(a)*d, Math.sin(a)*d, 2+Math.random()*2, 0, Math.PI*2); ctx.fill();
  }
}

export function drawQuake(ctx, f, frame) {
  const sheet = getSpritesheet('quake', 'assets/spritesheets/quake_idle.png', 8, 512);
  if (sheet.loaded) {
    const frameIdx = Math.floor((frame / 5) % sheet.frames);
    const drawSize = f.size * 4;
    ctx.drawImage(sheet.img, frameIdx * sheet.frameSize, 0, sheet.frameSize, sheet.frameSize, -drawSize/2, -drawSize/2, drawSize, drawSize);
    return;
  }

  // Fallback: procedural
  const pulseRadius = f.size + 8 + Math.sin(frame * 0.05) * 4;
  ctx.strokeStyle = 'rgba(139,69,19,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, pulseRadius, 0, Math.PI*2); ctx.stroke();

  // Main ball
  const bodyGrad = ctx.createRadialGradient(-3, -3, 0, 0, 0, f.size);
  bodyGrad.addColorStop(0, '#A0522D');
  bodyGrad.addColorStop(0.6, '#8B4513');
  bodyGrad.addColorStop(1, '#6b4423');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.arc(0, 0, f.size, 0, Math.PI*2); ctx.fill();

  // Concentric shockwave rings radiating out
  for (let i = 1; i <= 3; i++) {
    const offset = (frame * 0.15 + i * 0.8) % 2;
    const radius = f.size * (0.4 + offset * 0.4);
    const alpha = 0.4 * (1 - offset / 2);
    ctx.strokeStyle = `rgba(139,69,19,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.stroke();
  }

  // Rough spots for texture
  ctx.fillStyle = 'rgba(50,30,10,0.4)';
  ctx.beginPath(); ctx.arc(-5, -4, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, 3, 2, 0, Math.PI*2); ctx.fill();
}

export function drawSpark(ctx, f, frame) {
  const sheet = getSpritesheet('spark', 'assets/spritesheets/spark_idle.png', 8, 512);
  if (sheet.loaded) {
    const frameIdx = Math.floor((frame / 5) % sheet.frames);
    const drawSize = f.size * 4;
    ctx.drawImage(sheet.img, frameIdx * sheet.frameSize, 0, sheet.frameSize, sheet.frameSize, -drawSize/2, -drawSize/2, drawSize, drawSize);
    return;
  }

  // Fallback: procedural
  const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, f.size);
  bodyGrad.addColorStop(0, '#ffffaa');
  bodyGrad.addColorStop(0.5, '#ffff00');
  bodyGrad.addColorStop(1, '#ccaa00');
  ctx.fillStyle = bodyGrad;
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(0, 0, f.size, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // Electric arcs
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const arcAngle = frame * 0.15 + i * Math.PI / 3;
    const length = 20 + Math.sin(frame * 0.3 + i) * 10;
    ctx.globalAlpha = 0.7 + Math.random() * 0.2;
    ctx.strokeStyle = i % 2 === 0 ? '#FFD700' : '#ffffff';
    
    const segments = 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(arcAngle) * f.size, Math.sin(arcAngle) * f.size);
    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const px = Math.cos(arcAngle) * (f.size + length * t);
      const py = Math.sin(arcAngle) * (f.size + length * t);
      const perpAngle = arcAngle + Math.PI/2;
      const offset = Math.sin(frame * 0.5 + i * 2.1 + s * 1.7) * 6;
      ctx.lineTo(px + Math.cos(perpAngle) * offset, py + Math.sin(perpAngle) * offset);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawPhantom(ctx, f, frame) {
  const sheet = getSpritesheet('phantom', 'assets/spritesheets/phantom_idle.png', 8, 512);
  if (sheet.loaded) {
    const frameIdx = Math.floor((frame / 5) % sheet.frames);
    const drawSize = f.size * 4;
    ctx.drawImage(sheet.img, frameIdx * sheet.frameSize, 0, sheet.frameSize, sheet.frameSize, -drawSize/2, -drawSize/2, drawSize, drawSize);
    return;
  }

  // Fallback: procedural
  const pulse = 0.7 + 0.3 * Math.sin(frame * 0.08);
  ctx.globalAlpha = 0.6 * pulse;

  // Outer glow
  const g = ctx.createRadialGradient(0, 0, f.size*0.3, 0, 0, f.size*2);
  g.addColorStop(0, 'rgba(160,80,255,0.5)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, f.size*2, 0, Math.PI*2); ctx.fill();

  // Main ball
  const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, f.size);
  bodyGrad.addColorStop(0, '#cc88ff');
  bodyGrad.addColorStop(0.6, '#8844cc');
  bodyGrad.addColorStop(1, '#552288');
  ctx.fillStyle = bodyGrad;
  ctx.shadowColor = '#aa66ff';
  ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(0, 0, f.size, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 1;
}
