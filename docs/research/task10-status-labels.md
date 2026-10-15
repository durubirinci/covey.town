# Task 10 research: statuses above avatars

Owner: Duru. Result: a working prototype of a status line with a live countdown above each
player's name. Task 24 can be split into Small tasks; no need to simplify how the timer is shown.

## How Phaser draws name labels today

- Each name label is a plain `Phaser.GameObjects.Text`, created in two places in
  `frontend/src/components/Town/TownGameScene.ts`: in `create()` for your own player ("(You)",
  depth 6) and in `createPlayerSprites()` for everyone else.
- A label is not attached to its sprite. Code moves it by hand to `(sprite.body.x, sprite.body.y - 20)`
  in three places: the scene's `update()` (your player), the loop at the end of `update()` (other
  players) and `PlayerController._updateGameComponentLocation()` (when a movement event arrives).
- Labels are destroyed in `updatePlayers()` when a player disconnects.

## Adding a second line

- Prototype: a second `Text` object (`statusLabel`) per player, hidden when there is no status, placed
  directly above the name label. All three positioning places now call one helper,
  `placePlayerLabels()` in `PlayerController.ts`, so the two labels can't drift apart.
- Alternative considered: a single multi-line label (`'name\nFocused 24:13'`). Rejected because the
  text grows downward over the sprite and the status could not have its own color.

## Keeping the countdown running while the game is paused

- "Paused" in Covey.Town is not a Phaser pause. `TownController.pause()` (used when a modal is open)
  only sets `_paused`; the scene's `update()` then returns early, but Phaser's clock, physics and
  rendering keep running.
- So the countdown runs on Phaser's clock (`this.time.addEvent`, every 250 ms) instead of in
  `update()`, and keeps ticking while paused. The time left is computed from an absolute `expiresAt`
  timestamp, so it is also correct after the browser tab was in the background.
- Bug found: while your game was paused, other players' name labels stopped following them (their
  sprites keep moving, but the label loop was after the early return). Measured in a two-browser
  test: the other player walked to y=1051 while their label stayed at y=833. Fixed by moving the
  label loop above the pause check; the same test now shows the label at y=1034, 20 px above the sprite.

## Proposed split of task 24

1. Status label and countdown in the game scene: done in this prototype (Small).
2. Show statuses from the server instead of the dev-only `setDemoStatus` console helper, once the
   status backend sends them (Small, after the status backend task).
3. Remove the prototype console helpers and add tests for label placement and expiry (Small).

## Trying the prototype

Run the townService and frontend with `NEXT_PUBLIC_TOWN_DEV_MODE=true`, open the town, then in the
browser console: `setDemoStatus('Focused', 25)` (yourself), `setDemoStatus('On break', 10, 'all')`
(everyone). Statuses only show in your own browser until the server tracks them.
