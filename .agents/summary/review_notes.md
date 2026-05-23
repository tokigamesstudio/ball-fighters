# Review Notes

## Consistency Check

✅ **Technology references** — All files consistently reference Express 5, Vitest, PostgreSQL, ES Modules
✅ **Fighter names** — Consistently listed as blaze, quake, spark, phantom across all docs
✅ **API endpoints** — interfaces.md matches actual route registrations in code
✅ **Data model shapes** — Match actual code structures
✅ **Architecture description** — Accurately reflects hexagonal pattern in server code
✅ **Dependency graph** — Verified import chains match actual file imports

## Completeness Check

### Adequately Documented
- ✅ Simulation engine and deterministic replay
- ✅ Server hexagonal architecture
- ✅ Slot lifecycle with compensation
- ✅ Payout tier system
- ✅ Fighter module contract
- ✅ HTTP API surface
- ✅ Balance tuning scripts

### Gaps Identified

1. **Database schema details** — The `data_models.md` references the migration but doesn't inline the full schema (3 tables: rounds, bets, transactions). The transactions table is not mentioned in the store interface since the memory store doesn't implement it.

2. **Server port configuration** — Default port is 3001 (from `server/index.js`), but `game.js` client connects to port 4001. This discrepancy exists in the codebase itself (potential bug or separate config).

3. **Client UI state machine** — `game.js` manages complex UI state (fighter selection, betting, playback) but this isn't formally documented as a state machine.

4. **Rendering pipeline details** — The rendering modules are listed but the specific visual effects (screen shake, slow motion, death hold, floating text) aren't detailed.

5. **Events system** — `src/core/events.js` exists but is minimal (13 LOC). Its role in the architecture is unclear.

6. **docs/game-math.md** — Existing documentation file not referenced in the generated docs. Contains mathematical foundations for the game balance.

## Recommendations

1. The port mismatch (3001 vs 4001) should be investigated — likely needs environment variable or the client needs updating.
2. The `events.js` module appears to be a stub or placeholder — could be removed or expanded.
3. Consider adding `docs/game-math.md` as a cross-reference from `data_models.md` and `workflows.md`.
