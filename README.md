# Arena Fighter — Game Project Prototype

A browser-based arena fighting game where AI-controlled fighters battle in a physics-driven simulation. Features a slot-style betting backend with provable fairness.

## Quick Start

```bash
# Install dependencies
npm install

# Set up database (requires PostgreSQL)
export DATABASE_URL=postgresql://localhost/arena_rgs
npm run migrate

# Start server
node server/index.js

# Open in browser
# Navigate to http://localhost:3001
```

## How It Works

1. **Select a fighter** — Choose from Fire, Earth, Air, or Water
2. **Place a bet** — Stake credits on your fighter winning
3. **Watch the battle** — Deterministic simulation plays out with physics and special abilities
4. **Collect winnings** — Payout depends on how decisively your fighter wins (tiered: Obliterate > Close Call > Clutch)

## Fighters

| Fighter | Style | Strength |
|---------|-------|----------|
| Fire (Blaze) | Aggressive | Fire trails, area damage |
| Earth (Quake) | Tank | Ground pounds, high mass |
| Air | Ranged | Wind blade projectiles |
| Water | Evasive | Mist form, water bolts |

## Architecture

- **Client**: Vanilla JS + Canvas 2D (no framework, no bundler)
- **Server**: Express 5 with hexagonal architecture (ports/adapters)
- **Database**: PostgreSQL
- **Fairness**: Seeded PRNG — same seed produces identical simulation on client and server

## Development

```bash
# Run tests
npm test

# Run balance tuning (Monte Carlo)
node scripts/tune-balance.js
```

## Project Structure

```
src/          → Client game code (simulation, fighters, rendering)
server/       → Backend API (betting, payouts, wallet integration)
tests/        → Vitest test suite
scripts/      → Balance tuning utilities
docs/         → Game math documentation
```

## Tech Stack

- JavaScript ES Modules
- Express 5
- PostgreSQL + pg
- Vitest
- HTML5 Canvas 2D
