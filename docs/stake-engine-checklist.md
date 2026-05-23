# Stake Engine Submission Checklist

> Source: https://stake-engine.com/docs/approval-guidelines/submission-checklist
> Captured: 2026-05-23

## PreChecks

- [ ] Game authenticates with RGS successfully on game launch
- [ ] Clicking on the bet button sends a successful play request to RGS

## Compliance Checks

- [ ] Game title is unique and does not contain trademarked terms (Megaways, Xways, 'Gates of...', '...Bonanza')
- [ ] Game assets and imagery do not contain offensive, discriminatory or inappropriate content
- [ ] Game is not presented in a way that could be confused with an existing title or series

## Game Thumbnail

- [ ] Game tile is generally bright and does not clash with the Stake background (no dark edges)
- [ ] Background image is bright and appropriate for the game
- [ ] Foreground image is appropriate and key focus area correctly filled
- [ ] Gradient is a similar colour to the background
- [ ] Game title fits within the inner guidelines (not too close to edges)
- [ ] No wording or multipliers on background/foreground image

## Math Requirements

- [ ] Math section has no validation warnings
- [ ] RTP is between 90% and 97.7%
- [ ] All modes have RTP within 0.5% of each other
- [ ] Advertised max-win is achievable (hit-rate 1 in 20,000,000 or more frequent)
- [ ] Reasonable hit rate of non-zero wins (typically 1-in-8, not > 1-in-10 for base mode)
- [ ] Broadly populated hit-rate table (no significant gaps)
- [ ] Reasonable number of unique payout amounts
- [ ] Most frequent results cannot appear multiple times in a single session given simulation count

## RGS Requirements

### Frontend Requirements

- [ ] Main game frame is not scrollable
- [ ] Space bar is bound to the bet button
- [ ] Confirmation dialog for bet-modes with > 2x cost (e.g. 50x bonus mode cannot be single-click)
- [ ] User interaction guide in Info tab (all interactive buttons explained)
- [ ] Check 3 wins per game mode against Game Rules — displayed win matches payout
- [ ] Check 10 wins per game mode against Game Rules — displayed win matches payout
- [ ] Check 6 wins per game mode against Game Rules — displayed win matches payout

### Replay Support

- [ ] Supports replay URLs, loads and plays desired event
- [ ] Supports all optional parameters (currency, language, amount)
- [ ] Allows replaying "event" at the end of replay
- [ ] UI clearly displays bet cost including any multiplier and real cost
- [ ] Supports replays in Popout S view

## Final Approval Checklist

- [ ] Game has bet-level templates applied
- [ ] Provably Fair and Replay enabled
- [ ] Both Front and Math requests set as 'Approved' & 'Active'
- [ ] Game appeared in stake-engine-game-approved + stake-engine-us-game-approved channels
- [ ] Tested on older Android and iOS versions
- [ ] Approval request closed once game has 'checked' emoji (live on Stake)
- [ ] Game Released

## Review Process

- 3 independent reviewers assigned
- Each rates 0-3 stars across: design, gameplay, math compliance
- Average ≥ 1 star → approved for production
- Average < 1 star → rejected (may resubmit after addressing feedback)
