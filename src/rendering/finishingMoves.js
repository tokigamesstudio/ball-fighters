// ═══════════════════════════════════════════════════════════════════════════
// FINISHING MOVE ANIMATIONS — Per-fighter special effects
// ═══════════════════════════════════════════════════════════════════════════

const FINISHING_MOVES = {
  blaze: {
    name: 'INFERNO BURST',
    color: '#ff4400',
    glow: '#ff8800',
    draw(ctx, x, y, progress, W, H) {
      // Expanding fire ring + radial flame lines
      const radius = progress * 200;
      const alpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha = alpha;
      // Fire ring
      ctx.strokeStyle = '#ff4400';
      ctx.lineWidth = 8 - progress * 6;
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      // Inner ring
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      // Radial flame bursts
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + progress * 2;
        const len = radius * 0.8;
        ctx.strokeStyle = i % 2 ? '#ff4400' : '#ffcc00';
        ctx.lineWidth = 4 - progress * 3;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * radius * 0.3, y + Math.sin(angle) * radius * 0.3);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
      }
      ctx.restore();
    }
  },
  quake: {
    name: 'SEISMIC SLAM',
    color: '#8B4513',
    glow: '#A0522D',
    draw(ctx, x, y, progress, W, H) {
      // Ground crack lines radiating outward + screen-wide shockwave
      const alpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha = alpha;
      // Horizontal shockwave
      const waveWidth = progress * W;
      ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
      ctx.fillRect(x - waveWidth / 2, y - 10, waveWidth, 20);
      // Crack lines
      ctx.strokeStyle = '#A0522D';
      ctx.lineWidth = 5 - progress * 4;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 15;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const len = progress * 180;
        ctx.beginPath();
        ctx.moveTo(x, y);
        const midX = x + Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * 20;
        const midY = y + Math.sin(angle) * len * 0.5 + (Math.random() - 0.5) * 20;
        ctx.lineTo(midX, midY);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
      }
      // Impact circle
      ctx.fillStyle = 'rgba(160, 82, 45, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, 30 * (1 - progress), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },
  air: {
    name: 'CYCLONE STRIKE',
    color: '#87CEEB',
    glow: '#B0E0E6',
    draw(ctx, x, y, progress, W, H) {
      // Lightning bolts from top of screen to target
      const alpha = 1 - progress * 0.8;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#FFF700';
      ctx.shadowBlur = 25;
      // Multiple lightning bolts
      for (let bolt = 0; bolt < 3; bolt++) {
        const startX = x + (bolt - 1) * 60;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        let bx = startX, by = 0;
        const segments = 8;
        for (let s = 0; s < segments; s++) {
          bx += (x - startX) / segments + (Math.random() - 0.5) * 40;
          by += y / segments;
          ctx.lineTo(bx, by);
        }
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      // Impact glow
      const glowSize = 40 + Math.sin(progress * 20) * 15;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      gradient.addColorStop(0, 'rgba(255, 247, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },
  water: {
    name: 'TIDAL COLLAPSE',
    color: '#1E90FF',
    glow: '#4169E1',
    draw(ctx, x, y, progress, W, H) {
      // Imploding void circle + ghostly afterimages
      const alpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha = alpha;
      // Void implosion (shrinking dark circle)
      const voidRadius = 150 * (1 - progress);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, voidRadius);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
      gradient.addColorStop(0.7, 'rgba(75, 0, 130, 0.5)');
      gradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, voidRadius, 0, Math.PI * 2);
      ctx.fill();
      // Spiraling particles being sucked in
      ctx.strokeStyle = '#BB79D6';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + progress * 8;
        const dist = voidRadius * 1.5 * (1 - progress * 0.5);
        const px = x + Math.cos(angle) * dist;
        const py = y + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Outer ring
      ctx.strokeStyle = '#9B59B6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(x, y, voidRadius * 1.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
};

let finishingMoveState = null;

export function triggerFinishingMove(fighterType, x, y) {
  const move = FINISHING_MOVES[fighterType];
  if (!move) return;
  finishingMoveState = { type: fighterType, x, y, frame: 0, duration: 90, move };
}

export function resetFinishingMove() {
  finishingMoveState = null;
}

export function drawFinishingMove(ctx, W, H) {
  if (!finishingMoveState) return false;
  const { move, x, y, frame, duration } = finishingMoveState;
  const progress = frame / duration;

  if (progress >= 1) {
    finishingMoveState = null;
    return false;
  }

  move.draw(ctx, x, y, progress, W, H);

  // Draw move name text
  const textAlpha = progress < 0.3 ? progress / 0.3 : (progress > 0.7 ? (1 - progress) / 0.3 : 1);
  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.font = 'bold 28px system-ui';
  ctx.textAlign = 'center';
  ctx.fillStyle = move.color;
  ctx.shadowColor = move.glow;
  ctx.shadowBlur = 20;
  ctx.fillText(`💀 ${move.name}`, W / 2, 50);
  ctx.restore();

  finishingMoveState.frame++;
  return true; // still animating
}

export function getFinishingMoveInfo(fighterType) {
  return FINISHING_MOVES[fighterType] || null;
}
