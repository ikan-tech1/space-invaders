# OG Space Invaders — Game Modes Roadmap

Future alternate modes for the Classic Arcade Edition. Build **one mode at a time**; each entry includes pitch, win condition, unlock gate, and difficulty twist.

---

## 1. Survival Endless+

**Pitch:** Pure wave survival with escalating alien speed and shot density—no campaign script, no shops between waves. How deep can you go before the formation breaks you?

**Win condition:** Beat your personal best depth; tier medals at depths 10, 25, 50.

**Unlock:** Clear campaign Level 6 (Endless already unlocks at L6—this is the “hardcore” variant without depot breaks).

**Twist:** Shields never respawn; one life only on Insane.

---

## 2. Boss Rush

**Pitch:** Chain every mini boss and big boss back-to-back with minimal breather screens. A gauntlet for players who mastered weak-point timing.

**Win condition:** Defeat all 8 boss encounters in one sitting.

**Unlock:** Clear campaign + defeat L12 big boss once.

**Twist:** No power-up drops—loadout and ship passive only.

---

## 3. Pacifist Run

**Pitch:** Aliens advance; you dodge. Shields and UFO collisions still score. Can you survive a full level without firing?

**Win condition:** Survive Level 4 with zero player shots fired.

**Unlock:** 3★ on any two campaign levels.

**Twist:** Timer pressure doubles; UFOs spawn more often as “score lifelines.”

---

## 4. Token Rush

**Pitch:** Every kill and pickup is worth double run tokens, but enemy fire rate scales faster each level. Hoard ◎ for the Armory or burn out early.

**Win condition:** Bank 80 run tokens before dying or clearing L6.

**Unlock:** Own 2 ships in the Armory.

**Twist:** Wallet tokens are not granted until run ends—risk/reward on death.

---

## 5. Couch Co-op (Async)

**Pitch:** Two pilots, one screen—Player B joins on a second input lane (keyboard arrows + WASD split). Shared lives pool, shared score.

**Win condition:** Clear L6 co-op on Classic difficulty.

**Unlock:** Complete any weekly challenge bundle.

**Twist:** Friendly fire off; combo meter merges both kill chains.

---

## 6. Mirror Mode

**Pitch:** Formation mirrors horizontally every 15 seconds; controls invert briefly on mirror flip. Disorienting arcade novelty.

**Win condition:** Clear L3 without losing more than one life.

**Unlock:** Reach 10× combo in campaign.

**Twist:** Alien descent direction randomizes after each mirror swap.

---

## 7. Nightmare (Cursed Pickups)

**Pitch:** Power-ups only drop “cursed” variants—rapid becomes wild spread, shield becomes fragile glass, slow becomes enemy slow-miss. High risk, high score multiplier.

**Win condition:** Reach L5 with cursed-only pickups.

**Unlock:** Insane difficulty campaign clear.

**Twist:** Global 1.5× score mult; damage taken is doubled.

---

## 8. Time Attack

**Pitch:** Per-level par times with bronze/silver/gold medals. Sector map becomes a time-trial grid.

**Win condition:** Gold medal on 6 of 12 levels.

**Unlock:** Blitz IV challenge complete.

**Twist:** No continues; one life per attempt per level.

---

## 9. Gauntlet (No Shop)

**Pitch:** Full 12-level campaign with interstitial depot, slot machine, and run shop disabled. Pure skill + star upgrades only.

**Win condition:** Campaign clear without opening depot.

**Unlock:** Spend 100 lifetime tokens (Big Spender badge).

**Twist:** Star payouts +50%; no run consumables.

---

## 10. Vanguard Escort

**Pitch:** Protect a slow NPC convoy ship at screen bottom—aliens prioritize it. Lose if convoy hull breaks.

**Win condition:** Escort survives through L4 boss.

**Unlock:** Fly Vanguard on a campaign clear.

**Twist:** Player ship is faster but convoy blocks rear shots occasionally.

---

## 11. Titan Siege

**Pitch:** All formations have +50% HP; you must fly Titan with boss damage passive to finish in reasonable time.

**Win condition:** Clear L6 as Titan with 2+ lives remaining.

**Unlock:** Unlock Titan hull in Armory.

**Twist:** Mini bosses gain a second weak-point phase.

---

## 12. Daily Gauntlet

**Pitch:** Seeded daily modifier set (e.g., “Spread only,” “Double UFO,” “No shields”) on a fixed 3-level slice.

**Win condition:** Complete today’s gauntlet seed once.

**Unlock:** 7-day Daily Ops streak.

**Twist:** Leaderboard by seed hash (local high scores first).

---

## Implementation order (suggested)

1. **Survival Endless+** — extends existing Endless with stricter rules.
2. **Time Attack** — reuses level script + timer UI.
3. **Boss Rush** — boss script concatenation.
4. **Token Rush** — economy knobs only.
5. **Gauntlet** — feature flags on existing interstitial.

---

## Menu placeholder

The main menu **Modes** grid shows locked tiles for the above. Tapping a tile opens this roadmap blurb until the mode ships.
