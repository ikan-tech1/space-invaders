# Space Invaders — Dual Edition

Two games in one monorepo: the **classic arcade** build and a **2050 futuristic** remake.

## Live on Vercel

| Game | URL |
|------|-----|
| **OG Space Invaders** | https://og-space-invaders.vercel.app |
| **NEON Siege (2050)** | https://neon-ikan-tech1.vercel.app |

Play OG for the retro neon-arcade feel. Play NEON for weapon tiers (T1–T5), drone classes, hex power-up cores, heat/overheat, and level-based bosses.

Both games share a **12-level campaign** rhythm: **mini boss** on levels 3, 9, 15… and **big boss** on 6, 12, 18… (big takes priority). Clear level 12 to unlock **Endless Mode**. Challenges and easter eggs persist in `localStorage`.

## Local development

```bash
cd "/Users/eashangupta/Projects/Space Invaders"
npm install

# Classic OG build
npm run dev:og      # http://localhost:5173

# Futuristic NEON build
npm run dev:neon    # http://localhost:5174 (or next free port)

# Production builds
npm run build
```

## Project layout

```
apps/og/     — OG Space Invaders (pixel sprites, classic formations)
apps/neon/   — NEON Siege 2050 (vector glow, weapon XP, drone AI)
```

## OG Space Invaders

- **Campaign / Endless** modes; HUD shows **LEVEL N**
- Level script: L1 easier, L4+ denser formations; L3 mini / L6 big bosses
- Power-ups: rapid, spread, shield, slow, **laser**, **bunker**, **clone**
- **Armory:** spend stars on extra life, faster shot, shield repair
- **Challenges:** no-damage L3, 10× combo, speed-clear L4
- **Secrets:** Konami on title, score 8008 → gold UFO, 100 kills → SI initials
- Difficulty: Casual / Classic / Insane

## NEON Siege 2050

- **Campaign / Endless**; 12 named sectors with pre-level briefings and Sector Intel codex
- L3 mini / L6 big boss cadence; narrative boss names (Dreadnought, Capital Ship, etc.)
- **Weapons (XP tiers):** T1 Pulse Carbine → T2 Plasma Scatter → T3 **Kinetic Gauss** (tap-fire heavy slug + shockwave) → T4 **Beam Laser** (hold fire) → T5 Singularity
- **Pickup cores:** Overdrive, Prism (split shots), Ion Lance, Nova Shell, Gauss Burst, Beam Overcharge, Clone Wing, Deploy Bunker, Temporal Slow, Aegis, Chrono, Nanite, Weapon Core, burst volleys
- **Hybrid visuals:** pixel drones/player/bosses + cinematic Gauss impacts, beam overlays, particle trails
- **Hangar:** modules (Overcharger, Stabilizer, Salvager), upgrades, Weapon Intel, Sector Intel
- **Level challenges** unlock pickup drops (flawless L3 → Ion Lance, marksman → Gauss Burst, etc.)
- Code **NEON2050** in hangar for cyan bolt trail (hint: hangar tagline / Briefing)
- **NEONRIFT** — magenta trail (hint: Sector 7 intel)
- **GHOSTFRQ** — ghost trail (hint: Sector 8 intel)

## Deploy

Each app deploys as its own Vercel project (root directory `apps/og` or `apps/neon`):

```bash
cd apps/og && vercel deploy --prod
cd apps/neon && vercel deploy --prod
```

Set `VITE_OG_URL` on the NEON project if the OG production URL changes.

## Controls

| Platform | Move | Fire | Pause |
|----------|------|------|-------|
| Mac | ← → / A D | Space | P |
| iPhone | Drag move zone | FIRE button | ⏸ |
