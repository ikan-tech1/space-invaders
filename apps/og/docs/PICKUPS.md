# OG Space Invaders — Pickup Roster

Field pickups, death-slot symbols, and armory gates. No laser / rail / pierce weapons.

## Duration classes

| Class | Behavior |
|-------|----------|
| **Timed** | Countdown in seconds; shown on HUD buff row |
| **Until life lost** | Persists across levels until the player takes a hit |
| **Instant** | Applied once on collection |

## Drop timing

| Source | Rule |
|--------|------|
| Alien kill | `ALIEN_DROP_CHANCE`: Casual 20%, Classic 20%, Insane 22% (+2% endless bonus) |
| UFO | Guaranteed 1 roll from **good** pool (uncommon upgrades / rare weapons) |
| Mini-boss death | 1 good + 1 random field roll |
| Big-boss death | 2 drops, 45% chance of a 3rd |
| Cursed share | ~8% of successful alien rolls use curse pool only |
| On-screen cap | `MAX_PICKUPS_ON_SCREEN` = 4 |

Weights are per-pickup `weight` in `PICKUP_DEFS` (see `config.ts`). Armory-unlocked guns and campaign level gates filter the pool.

## Full roster

| ID | Name | Effect | Duration | Rarity | Weight |
|----|------|--------|----------|--------|--------|
| rapid | Rapid Pulse | Rapid-fire solo shots | 6s timed | common | 14 |
| spread | Spread Array | 3-way spread | 8s timed | common | 12 |
| twin | Twin Blasters | Twin volley | 8s timed | common | 11 |
| triple | Triple Burst | Triple volley | 8s timed | common | 10 |
| double | Double Fire | Double volley (armory) | 8s timed | common | 9 |
| scatter | Scatter Fan | Wide fan (armory) | 8s timed | uncommon | 8 |
| burst2 | Burst Mk-II | 2-bolt burst (armory, L2+) | 8s timed | uncommon | 7 |
| burst3 | Burst Mk-III | 3-bolt burst (armory, L3+) | 8s timed | uncommon | 6 |
| quint | Quint Salvo | 5-way (campaign L2+) | 8s timed | uncommon | 6 |
| hex | Hex Storm | 6-way (campaign L4+) | 8s timed | rare | 4 |
| homing | Seeker Pods | Homing volley (armory, L3+) | 8s timed | rare | 5 |
| shockwave | Shockwave | Shock volley (armory, L4+) | 8s timed | rare | 4 |
| plasma | Nova Plasma | Plasma fan (unlock / L2+) | 6s timed | rare | 5 |
| volleyUp | Volley +1 | Bump equipped volley one tier | 30s timed | uncommon | 7 |
| fireRate | Overclock | −28% fire cooldown | 30s timed | uncommon | 7 |
| curseSolo | Cursed Solo | Force solo cannon | 8s timed | cursed | 3 |
| curseSlowFire | Gunked Feed | +55% fire cooldown | 8s timed | cursed | 3 |
| curseJam | Weapon Jam | Cannot fire | 2s timed | cursed | 2 |
| shield | Shield Patch | Repair all bunkers | instant | common | 10 |
| bunker | Emergency Bunker | Spawn extra bunker (L3+) | instant | uncommon | 5 |
| aegis | Aegis Field | Absorb next hit | until life lost | rare | 3 |
| invulnPulse | Invuln Pulse | Brief invulnerability | 3s timed | uncommon | 4 |
| extraLife | Rescue Pod | +1 life (or +12◎ if capped) | instant | rare | 1 |
| comboAura | Combo Aura | Combo multiplier floor 2× | until life lost | uncommon | 4 |
| slow | Time Dilation | Slow enemy march | 3s timed | common | 8 |
| clone | Ghost Clone | Side clone volleys | 5s timed | uncommon | 5 |
| wingmen | Wingmen | 2 ghost ships mirror fire (±36px) | 8s timed | uncommon | 4 |
| phantomFleet | Phantom Fleet | 2 side ships, 0.7× bolt damage | 5s timed | rare | 3 |
| escortDrones | Escort Drones | 2 orbiters auto-fire weak bolts | 12s timed | uncommon | 4 |
| clearRow | Row Purge | Destroy bottom alien row | instant | uncommon | 4 |
| freezeAliens | Stasis Grid | Freeze alien movement | 3s timed | uncommon | 5 |
| doubleScore | Score Surge | 2× kill score | 10s timed | rare | 4 |
| tokenBurst | Token Burst | +8◎ to wallet/run | instant | uncommon | 6 |
| hyperSpeed | Hyper Drive | +45% move speed | 5s timed | common | 7 |

## UX

| Category | Glyph color |
|----------|-------------|
| weapon | cyan `#00f0ff` |
| upgrade | gold `#ffd24a` |
| curse | red `#ff4466` |
| defense | green `#3dff8a` |
| special | magenta `#ff2d95` |
| economy | gold `#ffd24a` |
| movement | light blue `#66ccff` |

Toast on pickup: `name — duration` via `pickupToastLine()`. HUD `#hud-buffs` shows active timed buffs and until-life-lost aegis/combo.

### Multi-ship fleet pickups

| Pickup | Side ships | Notes |
|--------|------------|-------|
| Ghost Clone | 2 @ ±36px | Stacks under wingmen/phantom cap |
| Wingmen | 2 @ ±36px | Full damage mirror volleys |
| Phantom Fleet | 2 @ ±44px | 0.7× damage on side bolts; menu code **FLEET** grants 10s trial |
| Escort Drones | 0 side ships | Orbiters fire on their own timer (not counted in 3-ship cap) |

**Cap:** `MAX_FLEET_SIDE_SHIPS` = 3 (clone + wingmen + phantom share one offset queue; highest priority: phantom → wingmen → clone).

Clears on life lost or buff timer end.

### Pickup SFX

| Category | Sound |
|----------|-------|
| curse | `pickupCurse` — low sawtooth |
| economy / tokenBurst | `pickupEconomy` — rising sine chime |
| rare | `pickupRare` — bright sine arpeggio |
| default | `powerup` |

### Magnet VFX

When **Token Magnet** (armory upgrade) or **Magnet Burst** (run consumable) is active:

- Pickups within ~92px pull toward the ship
- Gold/cyan aura rings around the player
- Spark particles trail from pulled pickups
- Collection emits a burst + trail into the hull

### Collection feedback

- Pickups within ~78px of the ship are magnet-pulled with cyan/category spark trails.
- On collect, a streak of particles runs from the pickup to the ship plus a local burst.

### Campaign map

`campaignBestLevel` in meta tracks highest cleared stage. Sector select unlocks levels 1 through `best + 1`. Campaign button opens the 4×3 sector grid before launch. Progress bar, NEXT marker, and endless-unlock chip shown on the map.

### Achievements

New challenge badges queue `og_pending_toasts` and replay as gold achievement toasts when returning to the main menu.

### Endless meta

| Feature | Detail |
|---------|--------|
| Ranks | Scout L1 · Veteran L5 · Ace L10 · Elite L15 · Legend L20 · Mythic L25 |
| HUD | Rank name + token mult (×1.0–×2.2) in endless runs |
| Depth prestige | Every 5 levels cleared → +10 ◎ to run pool |
| Mult milestones | ×1.3 / ×1.6 / ×1.9 / ×2.2 unlock achievement toasts (once) |
| Depot tiers | Depth Cache (Veteran L5) · Prestige Spark (Ace L10) — endless interstitial only |

## Slot machine

Last-life reels use the same `PowerUpType` symbols; pool = `getAvailablePowerups()` (gated like field drops). Filler reels include volleyUp, fireRate, scatter, homing, comboAura, tokenBurst, hyperSpeed, invulnPulse. Reel cells render **pixel canvas sprites** via `slotSymbolSprites.ts` (not text labels).

## Supply depot overlap

Run/endless interstitial consumables (overdrive, magnet burst, score surge, etc.) are separate from field pickups but stack logically (e.g. overdrive still grants rapid on level start).
