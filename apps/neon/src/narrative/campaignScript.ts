export interface SectorScript {
  level: number;
  title: string;
  objective: string;
  briefing: string;
  lore: string;
  bossName?: string;
}

export const CAMPAIGN_SECTORS: SectorScript[] = [
  {
    level: 1,
    title: "Outer Relay",
    objective: "Break the scout screen and secure the jump gate.",
    briefing:
      "Hostile drones are probing our outer relay. Clear the formation before they relay our position to the fleet.",
    lore: "The Outer Relay was humanity's first warning beacon — now it's a graveyard of broken signals.",
  },
  {
    level: 2,
    title: "Belt Ambush",
    objective: "Survive staggered waves in the debris field.",
    briefing:
      "Striker wings are using asteroid cover. Keep moving and don't let them pin you against the belt.",
    lore: "Miners once called this sector profitable. Now the only ore left is scrap metal and plasma burns.",
  },
  {
    level: 3,
    title: "Dreadnought Blockade",
    objective: "Destroy the Dreadnought before it calls reinforcements.",
    briefing:
      "A mini dreadnought has locked down the lane. Pierce its escort and break the blockade — no second chances.",
    lore: "Command codename: Dreadnought. One ship, enough firepower to erase a colony.",
    bossName: "Dreadnought",
  },
  {
    level: 4,
    title: "Shard Corridor",
    objective: "Clear diamond formations without losing shields.",
    briefing:
      "Bulwark drones anchor the formation. Focus fire and pick up nanite cores to keep your shields alive.",
    lore: "The Shard Corridor cuts through crystalline dust that scrambles sensors — perfect for ambushes.",
  },
  {
    level: 5,
    title: "Carrier Lane",
    objective: "Reach weapon Tier 3 before the lane collapses.",
    briefing:
      "Carrier drones deploy striker escorts. Chain kills for XP and unlock heavier ordnance before they overwhelm you.",
    lore: "Every carrier is a mobile factory. Destroy one, delay a hundred.",
  },
  {
    level: 6,
    title: "Capital Siege",
    objective: "Destroy the Capital Ship command core.",
    briefing:
      "The capital ship has entered low orbit. This is the fight that decides the sector — bring everything you've got.",
    lore: "They named it Sovereign. We call it the end of the line — or the beginning of ours.",
    bossName: "Capital Ship Sovereign",
  },
  {
    level: 7,
    title: "Neon Rift",
    objective: "Push through pincer formations.",
    briefing:
      "Enemy wings are flanking from both sides. Gauss slugs and beam sweeps will keep the corridor open.",
    lore: "The Neon Rift glows with weapon discharge — a aurora made of war.",
  },
  {
    level: 8,
    title: "Ghost Frequency",
    objective: "Maintain accuracy above 80%.",
    briefing:
      "Elite drones jam targeting. Precision fire earns bonus credits and unlocks advanced pickup drops.",
    lore: "Ghost Frequency isn't a place — it's the silence between enemy comm bursts.",
  },
  {
    level: 9,
    title: "Iron Halo",
    objective: "Defeat the Iron Halo dreadnought.",
    briefing:
      "Second dreadnought detected. Prism cores split your shots — use them to shred escort screens fast.",
    lore: "Iron Halo earned its name from the ring of wreckage it leaves in every system.",
    bossName: "Iron Halo",
  },
  {
    level: 10,
    title: "Zero Meridian",
    objective: "Clear the sector without overheating.",
    briefing:
      "Heat builds fast on beam and singularity weapons. Manage coolant or lose your edge at the worst moment.",
    lore: "Zero Meridian marks the boundary where friend and foe share the same empty sky.",
  },
  {
    level: 11,
    title: "Black Veil",
    objective: "Survive elite-heavy waves.",
    briefing:
      "Elite squadrons dominate the field. Clone wings and bunker drops will multiply your firepower.",
    lore: "Pilots who enter the Black Veil rarely transmit again — except as victory codes.",
  },
  {
    level: 12,
    title: "Singularity Gate",
    objective: "Destroy the gatekeeper and seal the breach.",
    briefing:
      "The enemy is opening a singularity gate. Destroy the capital guardian or Earth loses the war in one breath.",
    lore: "Beyond the gate lies whatever they're running from — or whatever they're bringing here.",
    bossName: "Gatekeeper",
  },
];

export function getSector(level: number): SectorScript {
  const idx = Math.min(Math.max(level, 1), CAMPAIGN_SECTORS.length) - 1;
  return CAMPAIGN_SECTORS[idx]!;
}

export function getBossInboundText(level: number): string | null {
  const sector = getSector(level);
  if (!sector.bossName) return null;
  return `BOSS INBOUND — ${sector.bossName.toUpperCase()}`;
}

export function getSectorBanner(level: number, encounter: "standard" | "miniBoss" | "bigBoss"): string {
  const sector = getSector(level);
  if (encounter === "bigBoss") return `${sector.title.toUpperCase()} — FINAL STAND`;
  if (encounter === "miniBoss") return `${sector.title.toUpperCase()} — BOSS`;
  return sector.title.toUpperCase();
}
