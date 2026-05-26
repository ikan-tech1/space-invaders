# OG Space Invaders — Ship Cosmetics

Canvas/CSS tint only — no external sprite assets.

## Per hull (`meta.shipCosmetics[hullId]`)

| Field | Options |
|-------|---------|
| **Primary** | 8 palette swatches (hull body tint) |
| **Accent** | 8 palette swatches (engine trail glow) |
| **Cockpit tint** | Optional swatch or none |
| **Callsign** | Up to 12 characters (name plate) |

## Palette IDs

`cyan`, `gold`, `magenta`, `green`, `orange`, `white`, `red`, `violet`

Default unlock: **cyan**. Additional colors via:

- **15 ★** each in Armory (tap locked swatch)
- Easter eggs / challenges (see below)

## Rendering

- In-run: `CanvasRenderer.drawPlayer()` — primary fill, accent engine rect, cockpit overlay
- Armory / menu: `armoryGunPreview` + hangar hero canvas
- Side fleet ghosts use the same paint at 55% alpha

## Secret unlocks

| Source | Colors |
|--------|--------|
| 5× click menu invader row | Magenta |
| L12 clear &lt; 90s | Orange + Gold |
| 100 kills no damage (run) | Violet |
