import { CAMPAIGN_MAX_LEVEL, getLevelConfig } from "../progression/levelScript";
import { loadOgMeta } from "../progression/metaStore";
import type { Screen } from "../screens/ScreenRouter";

const SECTOR_ROMAN = ["I", "II", "III", "IV"] as const;

function sectorRoman(sector: number): string {
  return SECTOR_ROMAN[sector - 1] ?? String(sector);
}

function starRow(stars: number): string {
  return [0, 1, 2]
    .map((i) => `<span class="sector-star ${i < stars ? "sector-star--lit" : ""}" aria-hidden="true">★</span>`)
    .join("");
}

function encounterBadge(level: number): string {
  const enc = getLevelConfig(level).encounter;
  if (enc === "bigBoss") return '<span class="sector-lvl-badge sector-lvl-badge--boss">BOSS</span>';
  if (enc === "miniBoss") return '<span class="sector-lvl-badge sector-lvl-badge--mini">MINI</span>';
  return "";
}

export function createSectorMapScreen(
  onBack: () => void,
  onStartLevel: (level: number) => void
): Screen {
  return {
    id: "sectorMap",
    mount(root) {
      const meta = loadOgMeta();
      const starsMap = meta.campaignStars ?? {};
      const highestClear = meta.campaignBestLevel ?? 0;
      const maxUnlocked = Math.min(CAMPAIGN_MAX_LEVEL, Math.max(1, highestClear + 1));

      const sectors = [1, 2, 3, 4].map((sector) => {
        const levels = [1, 2, 3].map((offset) => {
          const level = (sector - 1) * 3 + offset;
          const cfg = getLevelConfig(level);
          const stars = starsMap[String(level)] ?? 0;
          const unlocked = level <= maxUnlocked;
          const cleared = level <= highestClear;
          return `
            <button type="button"
              class="sector-lvl ${unlocked ? "sector-lvl--unlocked" : "sector-lvl--locked"} ${cleared ? "sector-lvl--cleared" : ""}"
              data-level="${level}"
              ${unlocked ? "" : "disabled"}
              aria-label="Level ${level} ${cfg.codename}${stars ? `, ${stars} stars` : ""}">
              <span class="sector-lvl-num">L${level}</span>
              <span class="sector-lvl-name">${cfg.codename}</span>
              ${encounterBadge(level)}
              <span class="sector-lvl-stars" aria-hidden="true">${starRow(stars)}</span>
              ${!unlocked ? '<span class="sector-lvl-lock" aria-hidden="true">🔒</span>' : ""}
            </button>`;
        });
        const sectorStars = [1, 2, 3].reduce(
          (sum, offset) => sum + (starsMap[String((sector - 1) * 3 + offset)] ?? 0),
          0
        );
        return `
          <section class="sector-block" aria-label="Sector ${sectorRoman(sector)}">
            <header class="sector-block-head">
              <h2 class="sector-block-title">Sector ${sectorRoman(sector)}</h2>
              <span class="sector-block-stars">${sectorStars}/9 ★</span>
            </header>
            <div class="sector-lvl-grid">${levels.join("")}</div>
          </section>`;
      });

      root.innerHTML = `
        <div class="screen sub-screen sector-map-screen">
          <header class="sub-header cabinet-mini sub-cabinet">
            <div class="cabinet-mini-glow" aria-hidden="true"></div>
            <p class="cabinet-mini-status"><span class="arcade-status-dot"></span> CAMPAIGN MAP</p>
            <h1 class="screen-title">Sector Select</h1>
            <p class="screen-subtitle">${highestClear}/${CAMPAIGN_MAX_LEVEL} cleared · pick any unlocked level</p>
            <div class="screen-marquee" aria-hidden="true"><span>— 12 LEVELS · 4 SECTORS —</span></div>
          </header>
          <div class="sector-map-grid">${sectors.join("")}</div>
          <p class="sector-map-hint">Bosses at L3, L6, L9, L12. Endless unlocks after L6.</p>
          <button type="button" class="btn btn-primary" data-back>Main Menu</button>
        </div>`;

      root.querySelector("[data-back]")?.addEventListener("click", onBack);
      root.querySelectorAll("[data-level]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const level = parseInt((btn as HTMLElement).dataset.level ?? "1", 10);
          if (level >= 1 && level <= maxUnlocked) onStartLevel(level);
        });
      });
    },
    unmount() {},
  };
}
