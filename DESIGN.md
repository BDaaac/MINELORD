# MINELORD UI/UX Design

## Visual Language

MINELORD looks like a cursed retro terminal: dark CRT, scanlines, matrix rain, green phosphor glow, red danger flashes, and compact game-first screens.

### Palette

```css
--bg: #0a0a0a;
--green: #00ff41;
--dark-green: #003b00;
--red: #ff0000;
--yellow: #ffff00;
--cyan: #00ffff;
--panel: rgba(0, 22, 0, 0.82);
--panel-strong: rgba(0, 38, 0, 0.92);
--font-terminal: "VT323", "Consolas", monospace;
```

### Typography

- Primary font: `VT323`.
- Optional pixel font for logo moments: `Press Start 2P`.
- All screens use terminal-sized text, not marketing hero typography.
- Text has subtle CRT glow via `text-shadow`.

### Effects

- Global scanlines overlay across the app.
- Matrix-symbol rain behind title and menu states.
- Blinking cursor on active prompts.
- Danger states use red border, red flash, and brief glitch movement.
- Defuse Point pulses yellow.
- Mines pulse while placement is active.

## Screens

### 1. Title Screen

- ASCII logo types in on boot.
- Main actions: `START GAME`, `HOW TO PLAY`, `LEADERBOARD`.
- Background matrix rain stays behind the terminal frame.
- Cursor blinks beside selected prompt.

### 2. How To Play

- Short mission briefing in Russian.
- Shows mine, defuse point, number tile, and one-life rule.
- Includes a tiny sapper-walks-into-mine animation.
- One primary action: `UNDERSTOOD. LET'S GO`.

### 3. Joker Select

- Three random joker cards per round.
- 10 second countdown; if time reaches zero, picks a random joker.
- Hover/selected card glows brighter.
- Cards show short tactical text, not paragraphs.

### 4. Mine Placement

- Header always shows round, mine count, and timer.
- Timer flashes red below 5 seconds.
- Mine palette supports normal, Phantom, Sticky, Nova, Mirror, and Bait.
- Left click places current type; second click removes.
- Defuse Point is locked and cannot contain a mine.
- Help text always tells the next action.

### 5. AI Run

- AI log scrolls like a terminal.
- Sappers are represented by a moving `>_` cursor on the grid.
- Opened cells reveal generated numbers.
- Explosions use red screen flash plus `BOOM` log lines.
- Multiple sappers move through different routes.

### 6. Shop

- Shows coins, available upgrades, owned mine pool, and joker deck.
- Disabled purchases show `[---]`.
- Purchases update inventory immediately.
- Primary action moves to next round.

### 7. Boss Intro

- Red terminal border.
- Boss name, quote, ability chips, and one warning line.
- The screen briefly shakes/glitches.
- Primary action begins mine preparation.

### 8. The Machine

- Shows Gemini connection status, selected model, current key, and request count.
- Thoughts type in real time.
- Response format is strictly parsed:

```json
{"cell":"D4","reason":"вероятность мины низкая"}
```

- If a key hits quota, `429`, `RESOURCE_EXHAUSTED`, or invalid-key errors, the game switches to the next key automatically.
- If all keys fail, The Machine falls back to deterministic local logic and logs that fallback.

### 9. Win / Lose

- Win shows explosions, speed kills, coins earned, and round number.
- Lose explains that a sapper reached the Defuse Point.
- One-click continuation: next round/shop or try again.

## UX Rules

- The next action is always visible.
- The game board scales on mobile and buttons remain large.
- Most interactions are one click.
- The AI log must make waiting entertaining.
- No nested cards; repeated items can be cards, but screens are terminal frames.
- The first screen is the playable product, not a landing page.
