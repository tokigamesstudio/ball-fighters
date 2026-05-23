# Workflows

## Slot Round Lifecycle (Primary Flow)

```mermaid
sequenceDiagram
    participant Client as Browser Client
    participant Server as Express Server
    participant Agg as Aggregator Adapter
    participant Sim as Simulation Engine
    participant Store as Data Store

    Client->>Server: POST /slot/play {sessionToken, fighterChoice, stake}
    Server->>Agg: validateSession(token)
    Agg-->>Server: {playerId, balance}
    Server->>Store: createRound(fighterA, fighterB)
    Server->>Store: placeBet(roundId, playerId, fighter, stake)
    Server->>Agg: debit(session, stake, txRef)
    Server->>Sim: runSimulation(seed, [fighterA, fighterB])
    Sim-->>Server: {winner, winnerHpPct}
    Server->>Store: resolveRound(roundId)
    alt Player Won
        Server->>Server: calcPayout(stake, odds, winnerHpPct)
        Server->>Agg: credit(session, payout, txRef)
    end
    Server-->>Client: {roundId, winner, payout, seed, ...}
```

## Client Playback Flow

```mermaid
sequenceDiagram
    participant UI as Game UI
    participant Sim as BattleSimulation
    participant Render as Canvas Renderer

    UI->>UI: User selects fighter, clicks Play
    UI->>UI: POST /slot/play → get result + seed
    UI->>Sim: new BattleSimulation(seed, [fighterA, fighterB])
    loop Each Frame
        Sim->>Sim: step()
        Sim->>Sim: captureFrame()
    end
    Sim-->>UI: frames[]
    loop Playback
        UI->>Render: renderFrame(ctx, frame)
        UI->>UI: updateHPBars, updateKillFeed
    end
    UI->>UI: showWinner()
```

## Compensation Flow (Error Handling)

```mermaid
flowchart TD
    A[Debit Stake] --> B{Simulation/Payout OK?}
    B -->|Yes| C[Credit Payout if Won]
    B -->|No| D[Credit Refund]
    D --> E{Refund OK?}
    E -->|Yes| F[Return Error to Client]
    E -->|No| G[Log for Manual Reconciliation]
    G --> F
```

## Balance Tuning Workflow (Scripts)

```mermaid
flowchart LR
    A[Monte Carlo Simulation] --> B[Measure Win Rates]
    B --> C[Coordinate Descent / Parallel Tuning]
    C --> D[Adjust Fighter Parameters]
    D --> A
    B --> E[Validate Balance Score]
```

Scripts in `scripts/`:
- `montecarlo.js` — runs N simulations per matchup, reports win rates
- `tune-balance.js` — coordinate descent optimizer for fighter parameters
- `tune-parallel.js` — parallel evolutionary parameter search
- `ball-montecarlo.js` — quick matchup win-rate measurement
