CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed TEXT NOT NULL,
  seed_hash TEXT NOT NULL,
  fighter_a TEXT NOT NULL,
  fighter_b TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  odds_a NUMERIC(8,4) NOT NULL,
  odds_b NUMERIC(8,4) NOT NULL,
  winner TEXT,
  result_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id),
  player_id TEXT NOT NULL,
  fighter TEXT NOT NULL,
  stake NUMERIC(12,2) NOT NULL,
  odds NUMERIC(8,4) NOT NULL,
  potential_payout NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_ref TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  tx_ref TEXT NOT NULL UNIQUE,
  round_id UUID REFERENCES rounds(id),
  bet_id UUID REFERENCES bets(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bets_round_id_idx ON bets(round_id);
CREATE INDEX IF NOT EXISTS bets_player_id_idx ON bets(player_id);
CREATE INDEX IF NOT EXISTS transactions_tx_ref_idx ON transactions(tx_ref);
