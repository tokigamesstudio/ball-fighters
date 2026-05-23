// Tiered payout multipliers — calibrated for 95% RTP
// Win distribution: obliterate 9.3%, close 50.4%, clutch 40.3% (of wins)
export const TIERS = {
  obliterate: { hpThreshold: 0.6, multiplier: 2.19, label: 'Obliterate', narrative: 'Dominant victory! Opponent destroyed.' },
  close:      { hpThreshold: 0.2, multiplier: 0.95, label: 'Close Call',  narrative: 'Close call! Hard-fought win.' },
  clutch:     { hpThreshold: 0,   multiplier: 0.67, label: 'Clutch',      narrative: 'Clutch win! Barely survived.' },
};

export function calcPayout(stake, odds, winnerHpPct) {
  let multiplier;
  if (winnerHpPct > 0.6) multiplier = TIERS.obliterate.multiplier;
  else if (winnerHpPct > 0.2) multiplier = TIERS.close.multiplier;
  else multiplier = TIERS.clutch.multiplier;
  return stake * odds * multiplier;
}

export function getTier(winnerHpPct) {
  if (winnerHpPct > 0.6) return TIERS.obliterate;
  if (winnerHpPct > 0.2) return TIERS.close;
  return TIERS.clutch;
}
