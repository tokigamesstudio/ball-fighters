# Interfaces

## Server HTTP API

### Slot Endpoint

| Method | Path | Description |
|--------|------|-------------|
| POST | `/slot/play` | Play a single slot-style round |

**Request Body:**
```json
{
  "sessionToken": "string",
  "fighterChoice": "blaze|quake|spark|phantom",
  "stake": 100
}
```

**Response (200):**
```json
{
  "roundId": "uuid",
  "fighterA": "blaze",
  "fighterB": "quake",
  "oddsA": 1.78,
  "oddsB": 2.04,
  "winner": "blaze",
  "playerBet": "blaze",
  "payout": 195.42,
  "tier": "Close Call",
  "narrative": "Close call! Hard-fought win.",
  "winnerHpPct": 0.45,
  "seedHash": "sha256hex",
  "seed": "hex"
}
```

**Error Codes:** 400 (invalid input), 402 (insufficient balance), 500 (server error)

### Round Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/round/create` | Create a new betting round |
| POST | `/round/bet` | Place a bet on a round |
| POST | `/round/resolve` | Resolve a round (run simulation) |
| GET | `/round/:id` | Get round status |

### Balance Endpoint

| Method | Path | Description |
|--------|------|-------------|
| GET | `/balance?token=X` | Get player balance |

## Internal Interfaces

### AggregatorAdapter (Abstract Class)

```javascript
class AggregatorAdapter {
  async validateSession(token)        // → { playerId, currency, balance }
  async debit(session, amount, txRef) // → { success, balance }
  async credit(session, amount, txRef)// → { success, balance }
  async getBalance(session)           // → number
}
```

### Store Interface

```javascript
{
  getRound(id)              // → Round | null
  saveRound(round)          // → void
  getBetsForRound(roundId)  // → Bet[]
  saveBet(bet)              // → void
  updateBet(id, updates)    // → void
}
```

### Fighter Interface

Each fighter module exports:
```javascript
export function createFighter(W, H, config) // → Fighter object
export function updateFighter(fighter, state) // → void (mutates fighter)
```

Fighter object shape:
```javascript
{
  id, type, name, x, y, vx, vy, hp, maxHp, size, mass,
  alive, color, skill, skillCooldown, _lastHitBy
}
```

### Simulation State (passed to updateFighter)

```javascript
{
  fighters, projectiles, particles, frameEvents,
  frame, rng, W, H, dangerPad, fireTrails
}
```
