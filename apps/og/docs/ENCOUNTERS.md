# OG Space Invaders — Encounter Design Bible

Campaign cadence: **mini bosses** at levels 3, 9, 15… · **big bosses** at 6, 12, 18… · Endless scales stats and rotates archetypes.

---

## Mini Boss Roster

| Name | Title | Level(s) | HP (Classic L3/L9) | Movement | Attack | Phase 2 |
|------|-------|----------|-------------------|----------|--------|---------|
| **The Bulwark** | Iron Curtain | 3, 15, 27… | ~27 (+25% tank) | Slow lateral | 5–7 bullet spread | — |
| **The Swarm Queen** | Brood Matriarch | 9, 21, 33… | ~24 | Bob hover | Aimed 3–4 burst + drone spawns | Faster spawns |
| **The Slicer** | Blade Dancer | 15, 27…* | ~21 (−12%) | Zigzag | 4–6 arm spiral (rotating) | — |
| **The Bombardier** | Gravity Wells | 21, 33…* | ~24 | Fast + sine bob | 3 arcing drop bombs | — |

\*Endless rotation order: Bulwark → Swarm Queen → Slicer → Bombardier (every 6 levels from L3).

**Telegraph:** Red/gold pulse ring + chevrons before every volley (existing VFX).

**Weak points:** Left / Center / Right core — shifts every 2s (UI label shows boss surname + core).

---

## Big Boss Roster

| Name | Title | Level(s) | HP (Classic L6/L12) | Phase 1 (<50% HP) | Phase 2 (≥50% HP cut) |
|------|-------|----------|---------------------|-------------------|------------------------|
| **The Hive Sentinel** | Sector Gatekeeper | 6 | ~71 | Aimed triple burst | Cross-burst diagonals |
| **The Overmind** | Mothership Core | 12 (finale) | ~104 | 4-arm spiral | 3 homing volleys |
| **The Dreadnought** | Heavy Cruiser | 18, 24… | scales | Wide 7-bullet spread | Laser sweep (7 lanes) |

Phase transition at **50% HP** — accent ring VFX, faster cooldowns, aggro SFX.

---

## Campaign Levels (1–12)

| Lv | Codename | Sector | Formation | Encounter | Speed× | Fire× | Threat | Identity |
|----|----------|--------|-----------|-----------|--------|-------|--------|----------|
| 1 | FIRST CONTACT | I | Classic | Standard | 0.68 | 0.55 | Low | Tutorial patrol (half grid) |
| 2 | STAGGERED WAVE | I | Staggered | Standard | 0.82 | 0.72 | Low | Bottom-shooter priority |
| 3 | IRON GATE | I | — | **Bulwark** | — | — | Medium | First mini boss |
| 4 | DIAMOND GRID | II | Diamond | Standard | 1.00 | 0.95 | Medium | Blitz challenge sector |
| 5 | PINCER SPREAD | II | Pincer | Standard | 1.08 | 1.05 | Medium | Wing squeeze |
| 6 | SECTOR GATE | II | — | **Hive Sentinel** | — | — | High | Endless unlock |
| 7 | LUCKY SEVEN | III | Classic | Standard | 1.16 | 1.12 | High | Reinforced grid |
| 8 | STAGGERED ASSAULT | III | Staggered | Standard | 1.22 | 1.18 | High | Climbing fire rate |
| 9 | BROOD NEST | III | — | **Swarm Queen** | — | — | High | Drone spawner |
| 10 | DIAMOND SIEGE | IV | Diamond | Standard | 1.32 | 1.24 | Extreme | Peak march |
| 11 | PINCER FINALE | IV | Pincer | Standard | 1.38 | 1.28 | Extreme | Pre-finale pressure |
| 12 | MOTHERSHIP | IV | — | **Overmind** | — | — | Extreme | Campaign finale |

**Endless (13+):** Template cycles every 12 levels with +7% speed / +4.5% fire per cycle; boss archetypes rotate per tables above.

---

## Player Ships

| Ship | Speed× | Fire CD× | Hitbox | Cost | Passive | Role |
|------|--------|----------|--------|------|---------|------|
| **Striker** | 1.00 | 1.00 | 1.00 | Free | Steady Sortie (+2 ◎ per clear) | Balanced default |
| **Phantom** | 1.22 | 0.88 | 0.88 | 120 | Ghost Chain (+0.45s combo window) | Aggressive scorer |
| **Titan** | 0.82 | 1.08 | 1.12 | 200 | Siege Breakers (+1 boss dmg/hit) | Boss killer |
| **Vanguard** | 1.08 | 0.95 | 0.95 | 160 | Escort Bonus (+15% run ◎) | Token farmer |

Sprites: `player`, `playerPhantom`, `playerTitan`, `playerVanguard` in `SpriteDrawer.ts`.

---

## Difficulty Scaling (Boss HP)

| Mode | HP Multiplier |
|------|---------------|
| Casual | ×0.82 |
| Classic | ×1.00 |
| Insane | ×1.28 |

Endless levels 13+ add +6% HP per level above 12.

---

## Implementation Map

| System | File |
|--------|------|
| Boss definitions & attacks | `src/progression/bosses.ts` |
| Level table & banners | `src/progression/levelScript.ts` |
| Ship stats & passives | `src/progression/ships.ts` |
| Boss entity fields | `src/game/entities/types.ts` |
| Combat loop | `src/game/Game.ts` |
| Boss sprites | `src/render/SpriteDrawer.ts` |
| Telegraph / HP bar | `src/render/CanvasRenderer.ts` |
| Sector briefings | `src/progression/sectorBriefings.ts` |
