# Submission Checklist

Use this checklist before submitting your game for approval. Incomplete submissions cause delays — games that do not meet all requirements will be held until the issues are resolved, which may push your go-live date back significantly.

**Important:** The review queue is shared across all teams. Submissions that fail basic checks take reviewer time away from other games and may result in your request being deprioritised. Ensuring everything is in order before you submit is the single most effective way to get your game live quickly.

## Approval Requirements

The checklist below reflects the exact criteria your game will be reviewed against. Requirements may vary based on your team's trust level.

### PreChecks

- [ ] Game authenticates with RGS successfully on game launch
- [ ] Clicking on the bet button sends a successful play request to RGS

### Compliance Checks

- [ ] Is the game title unique and does not contain terms such as Megaways, Xways, 'Gates of ...', '... Bonanza' - Game titles should not imply affiliation with existing publishers, or present in such a way that it could be associated with an established series of games.
- [ ] Ensure game assets and imagery do not contain offensive, discriminatory or inappropriate content
- [ ] Games should not be presented in a way in where it could be confused with an existing title or series. Reviews will not proceed if two or more of the following apply:
  - Similarity to existing titles

### Game Thumbnail

- [ ] Ensure that the game tile is generally bright and does not clash with the Stake Background (Be careful of dark edges).
- [ ] Ensure that the background image is bright and is appropriate for the game
- [ ] Ensure that the foreground image is appropriate for the game and the key focus area correctly filled.
- [ ] Ensure that the gradient is a similar colour to the background.
- [ ] Ensure that the game title fits within the inner guidelines, it can't be too close to the edges
- [ ] Ensure there is no wording or multipliers on both the background/foreground image.

### Math Requirements

- [ ] Ensure the math section has no validation warnings.
- [ ] RTP 90 -> 97.7%
- [ ] All modes must have an RTP within 0.5% of each other (97% RTP game must be within 96.5% - 97.5%)
- [ ] Advertised max-win is achievable (hit-rate 1 in 20,000,000 or more frequent)
- [ ] Reasonable Hit Rate of Non-Zero Wins (typically around 1-8, not > 10 for base mode)
- [ ] Broadly populated hit-rate table (no significant gaps where wins are not possible)
- [ ] Ensure there is a reasonable number of unique payout amounts
- [ ] Compare the hit-rate of most likely results to the number of available simulations. I.e if there are 100,000 simulations, no single result should be so frequent that it could likely be seen multiple times within a single session.

### RGS Requirements

### Frontend Requirements

- [ ] Main game frame should not be scrollable
- [ ] Is space bar bound to the bet button?
- [ ] Confirmation shows up when changing to bet-modes with a > 2x cost. I.e. If there is a 50x bonus mode, this cannot be activated with a single button
- [ ] User interaction Guide within the Info tab (any button that the player can interact with needs to be explained in the game info)
- [ ] Check 3 wins for each game mode against the Game Rules and ensure that the win that is displayed is the same as payout.
- [ ] Check 10 wins for each game mode against the Game Rules and ensure that the win that is displayed is the same as payout.
- [ ] Check 6 wins for each game mode against the Game Rules and ensure that the win that is displayed is the same as payout.

### Jurisdiction Requirements

### Replay Support

- [ ] Supports replay urls, loads and plays desired event
- [ ] Supports all optional parameters like, currency, language, amount
- [ ] Allows replaying "event" at the end of replay
- [ ] UI clearly displays bet cost, including any multiplier applied to the bet, and "real" bet cost. eg: BONUS 1USD, 250USD REAL COST
- [ ] Supports Replays in Popout S view

### Final Approval Checklist

- [ ] Ensure game has bet-level templates applied
- [ ] Provably Fair and Replay enabled
- [ ] Both Front and Math requests have been set as 'Approved' & 'Active'
- [ ] Check to make sure game has appeared in the stake-engine-game-approved + stake-engine-us-game-approved channels
- [ ] Test the game in older Android and IOS versions.
- [ ] Approval request should both be closed once the game has the 'checked' emoji, meaning it is live on Stake
- [ ] Game Released

## What Happens After Submission

Once you submit, three independent reviewers will be assigned to your game. Each reviewer rates your game from 0 to 3 stars across design, gameplay, and math compliance. Ratings remain hidden until all three are submitted.

- **Average ≥ 1 star** → Game is approved for production.
- **Average < 1 star** → Game is rejected. Reviewers may provide feedback and you may resubmit after addressing it.

The review process can be as quick as a couple of hours, however submitting an incomplete or non-compliant game blows out that timeline and can take weeks.
