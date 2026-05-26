import type { GameSettings } from "../storage/LocalStorageRepo";
import type { LocalStorageRepo } from "../storage/LocalStorageRepo";
import type { Screen } from "./ScreenRouter";
import { OG_CHALLENGES } from "../progression/challenges";
import {
  loadOgMeta,
  saveOgMeta,
  UPGRADE_COSTS,
  UPGRADE_LABELS,
  type OgMetaUpgrade,
} from "../progression/metaStore";
import { ARMORY_GUNS, type ArmoryGunId } from "../progression/armoryGuns";
import { SHIP_PROFILES, type ShipId } from "../progression/ships";
import { GUN_VOLLEY_LABELS, getGunCompareStats } from "../game/weaponVolley";
import { POWERUP_LABELS, type PowerUpType } from "../config";
import { mountArmoryGunPreviews, mountArmoryShipSprites } from "../ui/armoryGunPreview";

function renderSubHeader(title: string, subtitle: string, marquee = "— ARCADE MENU —"): string {
  return `
    <header class="sub-header cabinet-mini">
      <div class="cabinet-mini-glow" aria-hidden="true"></div>
      <p class="cabinet-mini-status"><span class="arcade-status-dot"></span> CABINET</p>
      <h1 class="screen-title">${title}</h1>
      <p class="screen-subtitle">${subtitle}</p>
      <div class="screen-marquee" aria-hidden="true"><span>${marquee}</span></div>
    </header>`;
}

export function createSettingsScreen(
  repo: LocalStorageRepo,
  onBack: () => void
): Screen {
  return {
    id: "settings",
    mount(root) {
      const s = repo.getSettings();
      root.innerHTML = `
        <div class="screen sub-screen">
          ${renderSubHeader("Settings", "Cabinet configuration", "— CONFIG —")}
          <section class="panel cabinet-panel">
            <h2 class="panel-label">Audio &amp; Controls</h2>
            <div class="settings-row">
              <label for="vol">Volume</label>
              <input type="range" id="vol" min="0" max="1" step="0.05" value="${s.volume}" />
            </div>
            <div class="settings-row">
              <label for="touch">Touch control size</label>
              <input type="range" id="touch" min="0.8" max="1.4" step="0.1" value="${s.touchScale}" />
            </div>
            <div class="settings-row">
              <label for="mute">Mute</label>
              <input type="checkbox" id="mute" ${s.muted ? "checked" : ""} />
            </div>
          </section>
          <button type="button" class="btn btn-primary" data-back>Main Menu</button>
        </div>
      `;
      const save = (): void => {
        const settings: GameSettings = {
          volume: parseFloat((root.querySelector("#vol") as HTMLInputElement).value),
          touchScale: parseFloat((root.querySelector("#touch") as HTMLInputElement).value),
          muted: (root.querySelector("#mute") as HTMLInputElement).checked,
        };
        repo.saveSettings(settings);
      };
      root.querySelector("#vol")?.addEventListener("input", save);
      root.querySelector("#touch")?.addEventListener("input", save);
      root.querySelector("#mute")?.addEventListener("change", save);
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

export function createHighScoresScreen(repo: LocalStorageRepo, onBack: () => void): Screen {
  return {
    id: "highScores",
    mount(root) {
      const scores = repo.getHighScores();
      const rows =
        scores.length === 0
          ? '<li class="records-empty">No scores yet — go play!</li>'
          : scores
              .map(
                (e, i) =>
                  `<li><span class="records-rank">${i + 1}. ${e.initials}</span><span class="records-score">${e.score.toLocaleString()} · L${e.wave}</span></li>`
              )
              .join("");
      root.innerHTML = `
        <div class="screen sub-screen">
          ${renderSubHeader("High Scores", "Hall of fame", "— TOP PLAYERS —")}
          <section class="panel cabinet-panel panel-flush">
            <ul class="high-score-list">${rows}</ul>
          </section>
          <button type="button" class="btn btn-primary" data-back>Main Menu</button>
        </div>
      `;
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

export function createHowToPlayScreen(onBack: () => void): Screen {
  return {
    id: "howToPlay",
    mount(root) {
      root.innerHTML = `
        <div class="screen sub-screen">
          ${renderSubHeader("How to Play", "Operator manual", "— READ ME —")}
          <section class="panel cabinet-panel how-to-play">
            <h2 class="panel-label">Mission briefing</h2>
            <p><strong>Goal:</strong> Clear 12 campaign levels. Mini bosses every 3 levels, big bosses every 6.</p>
            <p><strong>Mac:</strong> <kbd class="key-chip">←</kbd> <kbd class="key-chip">→</kbd> or <kbd class="key-chip">A</kbd> <kbd class="key-chip">D</kbd> to move, <kbd class="key-chip">Space</kbd> to fire, <kbd class="key-chip">P</kbd> to pause.</p>
            <p><strong>iPhone:</strong> Drag the move zone, tap <span class="key-chip key-chip--fire">FIRE</span>, pause button top-right.</p>
            <p><strong>Shields</strong> block shots but crumble — use them wisely.</p>
            <p><strong>Power-ups:</strong> Rapid, spread, shield, slow, nova plasma, bunker, clone (unlock via challenges).</p>
            <p><strong>Combo:</strong> Chain kills within 2 seconds for score multipliers.</p>
            <p><strong>Stars:</strong> Earn 1–3 stars per level; spend stars in the Armory.</p>
            <p><strong>Tokens:</strong> Earn coins from kills and level clears; spend in the Armory on ships, guns, and upgrades.</p>
            <p><strong>Secrets:</strong> Konami on title, type COIN or ARC on menu, score 1337 / 8008 / 50k, kill milestones 50 &amp; 250, boss clears L3/L6/L9/L12.</p>
          </section>
          <button type="button" class="btn btn-primary" data-back>Main Menu</button>
        </div>
      `;
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

export function createChallengesScreen(onBack: () => void): Screen {
  return {
    id: "challenges",
    mount(root) {
      const meta = loadOgMeta();
      const rows = OG_CHALLENGES.map(
        (c) => `
        <li class="challenge-item ${meta.badges.includes(c.id) ? "done" : ""}">
          <div class="challenge-header">
            <strong>${c.title}</strong>
            ${meta.badges.includes(c.id) ? '<span class="challenge-badge">Complete</span>' : `<span class="challenge-stars">+${c.starReward} ★</span>`}
          </div>
          <p class="challenge-desc">${c.description}</p>
          <span class="challenge-reward">${c.reward}</span>
        </li>`
      ).join("");
      root.innerHTML = `
        <div class="screen sub-screen">
          ${renderSubHeader("Challenges", `${meta.badges.length} / ${OG_CHALLENGES.length} cleared · ★ ${meta.stars} banked`, "— ACHIEVEMENTS —")}
          <p class="challenge-star-note">Complete challenges to earn stars for Armory upgrades.</p>
          <section class="panel cabinet-panel panel-flush">
            <ul class="challenge-list">${rows}</ul>
          </section>
          <button type="button" class="btn btn-primary" data-back>Main Menu</button>
        </div>`;
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

export function createArmoryScreen(onBack: () => void): Screen {
  let previewCleanup: (() => void) | undefined;

  return {
    id: "armory",
    mount(root) {
      previewCleanup?.();
      const meta = loadOgMeta();
      const equippedShip = meta.equippedShip;
      const equippedGun = meta.equippedGun;
      let previewShip: ShipId = equippedShip;
      let previewGun: ArmoryGunId = equippedGun;

      const renderCompare = (): string => {
        const eqShip = SHIP_PROFILES[equippedShip];
        const pvShip = SHIP_PROFILES[previewShip];
        const eqGunStats = getGunCompareStats(equippedGun);
        const pvGunStats = getGunCompareStats(previewGun);
        const shipDiff = (a: number, b: number, inv = false) => {
          const d = b - a;
          if (d === 0) return "—";
          const good = inv ? d < 0 : d > 0;
          return `<span class="compare-delta ${good ? "compare-delta--good" : "compare-delta--bad"}">${d > 0 ? "+" : ""}${Math.round(d * (inv ? 100 : 100))}${inv ? "% fire" : "% spd"}</span>`;
        };
        return `
          <section class="panel cabinet-panel armory-compare" data-compare-panel>
            <h2 class="panel-label">Loadout compare</h2>
            <div class="armory-compare-grid">
              <div class="armory-compare-col">
                <span class="armory-compare-tag">Equipped</span>
                <strong>${eqShip.name}</strong>
                <span class="armory-compare-stat">Spd ${Math.round(eqShip.speedMult * 100)}% · Fire ${Math.round(eqShip.fireCooldownMult * 100)}% · Hull ${Math.round(eqShip.hitboxScale * 100)}%</span>
                <strong class="armory-compare-gun">${GUN_VOLLEY_LABELS[equippedGun]}</strong>
                <span class="armory-compare-stat">${eqGunStats.volleySize} bolts · ${eqGunStats.cooldownTier} · ${eqGunStats.bypassSlot ? "Multi-slot" : "Classic slot"}</span>
              </div>
              <div class="armory-compare-vs">vs</div>
              <div class="armory-compare-col armory-compare-col--preview">
                <span class="armory-compare-tag">Preview</span>
                <strong>${pvShip.name}</strong>
                <span class="armory-compare-stat">Spd ${Math.round(pvShip.speedMult * 100)}% ${previewShip !== equippedShip ? shipDiff(eqShip.speedMult, pvShip.speedMult) : ""}</span>
                <span class="armory-compare-stat">Fire ${Math.round(pvShip.fireCooldownMult * 100)}% ${previewShip !== equippedShip ? shipDiff(eqShip.fireCooldownMult, pvShip.fireCooldownMult, true) : ""}</span>
                <strong class="armory-compare-gun">${GUN_VOLLEY_LABELS[previewGun]}</strong>
                <span class="armory-compare-stat">${pvGunStats.volleySize} bolts · ${pvGunStats.cooldownTier} · ${pvGunStats.bypassSlot ? "Multi-slot" : "Classic slot"}</span>
              </div>
            </div>
            <p class="armory-compare-hint">Tap a ship or gun card to preview stats before equipping.</p>
          </section>`;
      };

      const renderShipCards = (): string =>
        (Object.keys(SHIP_PROFILES) as ShipId[])
          .map((id) => {
            const s = SHIP_PROFILES[id];
            const owned = meta.unlockedShips.includes(id);
            const equipped = equippedShip === id;
            const selected = previewShip === id;
            const speedPct = Math.round(s.speedMult * 100);
            const firePct = Math.round(s.fireCooldownMult * 100);
            return `
          <article class="armory-ship-card ${equipped ? "armory-ship-card--equipped" : ""} ${selected ? "armory-ship-card--selected" : ""}" data-ship="${id}" data-preview-ship="${id}" role="button" tabindex="0">
            <canvas class="armory-ship-preview" width="56" height="40"
              data-ship-preview="${s.spriteKey}" data-ship-color="${s.color}" aria-hidden="true"></canvas>
            <div class="armory-ship-info">
              <h3 class="armory-ship-name">${s.name}</h3>
              <p class="armory-ship-tag">${s.tagline}</p>
              <p class="armory-ship-stats">Speed ${speedPct}% · Fire ${firePct}% · Hull ${Math.round(s.hitboxScale * 100)}%</p>
            </div>
            <div class="armory-ship-actions">
              ${
                equipped
                  ? '<span class="armory-equipped-badge">Equipped</span>'
                  : owned
                    ? `<button type="button" class="btn btn-sm" data-equip-ship="${id}">Equip</button>`
                    : `<button type="button" class="btn btn-sm btn-token" data-buy-ship="${id}" ${meta.tokens < s.tokenCost ? "disabled" : ""}>
                        ${s.tokenCost === 0 ? "Free" : `Unlock ${s.tokenCost} ◎`}
                      </button>`
              }
            </div>
          </article>`;
          })
          .join("");

      const renderGunCards = (): string =>
        ARMORY_GUNS.map((g) => {
          const owned = meta.unlockedGuns.includes(g.id);
          const equipped = equippedGun === g.id;
          const selected = previewGun === g.id;
          const label = GUN_VOLLEY_LABELS[g.id];
          const stats = getGunCompareStats(g.id);
          return `
        <article class="armory-gun-card ${equipped ? "armory-gun-card--equipped" : ""} ${selected ? "armory-gun-card--selected" : ""}" data-gun="${g.id}" data-preview-gun="${g.id}" role="button" tabindex="0">
          <canvas class="armory-gun-preview" width="120" height="64" data-gun-preview="${g.id}" aria-label="${label} firing preview"></canvas>
          <div class="armory-gun-body">
          <div class="armory-gun-head">
            <strong>${label}</strong>
            ${equipped ? '<span class="armory-equipped-badge">Equipped</span>' : ""}
          </div>
          <p class="armory-gun-desc">${g.description}</p>
          <p class="armory-gun-stats">${stats.volleySize} bolts · ${stats.cooldownTier} · ${stats.bypassSlot ? "Multi-slot" : "Classic"}</p>
          ${
            equipped
              ? ""
              : owned
                ? `<button type="button" class="btn btn-sm" data-equip-gun="${g.id}">Equip</button>`
                : `<button type="button" class="btn btn-sm btn-token" data-buy-gun="${g.id}" ${meta.tokens < g.tokenCost ? "disabled" : ""}>
                    ${g.tokenCost === 0 ? "Free" : `Unlock ${g.tokenCost} ◎`}
                  </button>`
          }
          </div>
        </article>`;
        }).join("");

      const upgradeRows = (Object.keys(UPGRADE_COSTS) as OgMetaUpgrade[])
        .map((id) => {
          const owned = meta.upgrades.includes(id);
          const cost = UPGRADE_COSTS[id];
          return `<button type="button" class="btn btn-upgrade" data-up="${id}" ${owned ? "disabled" : ""}>
            <span>${UPGRADE_LABELS[id]}</span>
            <span class="btn-upgrade-cost">${owned ? "Owned" : `${cost} ★`}</span>
          </button>`;
        })
        .join("");

      const pickupRows = meta.unlockedPickups
        .map(
          (id) => `
          <li class="armory-pickup">
            <span class="armory-pickup-name">${POWERUP_LABELS[id as PowerUpType] ?? id}</span>
            <span class="armory-pickup-status">Unlocked</span>
          </li>`
        )
        .join("");

      const paint = (): void => {
        root.innerHTML = `
        <div class="screen sub-screen armory-screen">
          ${renderSubHeader("Armory", "Hangar · loadout · upgrades", "— INSERT COIN —")}
          <div class="armory-wallet panel cabinet-panel">
            <div class="armory-wallet-stat">
              <span class="armory-wallet-label">Wallet</span>
              <span class="armory-wallet-value armory-wallet-value--token">◎ ${meta.tokens}</span>
            </div>
            <div class="armory-wallet-stat">
              <span class="armory-wallet-label">Stars</span>
              <span class="armory-wallet-value armory-wallet-value--star">★ ${meta.stars}</span>
            </div>
            <div class="armory-wallet-stat">
              <span class="armory-wallet-label">Ship</span>
              <span class="armory-wallet-value">${SHIP_PROFILES[equippedShip].name}</span>
            </div>
            <div class="armory-wallet-stat">
              <span class="armory-wallet-label">Gun</span>
              <span class="armory-wallet-value">${GUN_VOLLEY_LABELS[equippedGun]}</span>
            </div>
          </div>
          ${renderCompare()}
          <section class="panel cabinet-panel">
            <h2 class="panel-label">Ship hangar</h2>
            <div class="armory-ship-grid">${renderShipCards()}</div>
          </section>
          <section class="panel cabinet-panel">
            <h2 class="panel-label">Weapon rack</h2>
            <div class="armory-gun-grid">${renderGunCards()}</div>
          </section>
          <section class="panel cabinet-panel">
            <h2 class="panel-label">Star upgrades <span class="panel-label-sub">Earn ★ from challenges &amp; levels</span></h2>
            <div class="upgrade-list">${upgradeRows}</div>
          </section>
          <section class="panel cabinet-panel panel-flush">
            <h2 class="panel-label">Run pickups unlocked</h2>
            <ul class="armory-pickup-list">${pickupRows}</ul>
            <p class="armory-hint">Wallet buys permanent loadout. Run pool (in-game) fuels the supply depot. No rail / pierce weapons.</p>
          </section>
          <button type="button" class="btn btn-primary" data-back>Main Menu</button>
        </div>`;
        bindEvents();
        mountArmoryShipSprites(root);
        const pvShip = SHIP_PROFILES[previewShip];
        previewCleanup = mountArmoryGunPreviews(root, {
          selectedGun: previewGun,
          shipSprite: pvShip.spriteKey,
          shipColor: pvShip.color,
        });
      };

      const bindEvents = (): void => {
        root.querySelector("[data-back]")?.addEventListener("click", onBack);

        root.querySelectorAll("[data-preview-ship]").forEach((el) => {
          el.addEventListener("click", (e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            previewShip = (el as HTMLElement).dataset.previewShip as ShipId;
            paint();
          });
        });
        root.querySelectorAll("[data-preview-gun]").forEach((el) => {
          el.addEventListener("click", (e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            previewGun = (el as HTMLElement).dataset.previewGun as ArmoryGunId;
            paint();
          });
        });

        root.querySelectorAll("[data-buy-ship]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = (btn as HTMLElement).dataset.buyShip as ShipId;
            const cost = SHIP_PROFILES[id].tokenCost;
            if (meta.unlockedShips.includes(id) || meta.tokens < cost) return;
            meta.tokens -= cost;
            meta.unlockedShips.push(id);
            meta.equippedShip = id;
            previewShip = id;
            saveOgMeta(meta);
            paint();
          });
        });
        root.querySelectorAll("[data-equip-ship]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = (btn as HTMLElement).dataset.equipShip as ShipId;
            if (!meta.unlockedShips.includes(id)) return;
            meta.equippedShip = id;
            previewShip = id;
            saveOgMeta(meta);
            paint();
          });
        });
        root.querySelectorAll("[data-buy-gun]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = (btn as HTMLElement).dataset.buyGun as ArmoryGunId;
            const def = ARMORY_GUNS.find((g) => g.id === id)!;
            if (meta.unlockedGuns.includes(id) || meta.tokens < def.tokenCost) return;
            meta.tokens -= def.tokenCost;
            meta.unlockedGuns.push(id);
            meta.equippedGun = id;
            previewGun = id;
            saveOgMeta(meta);
            paint();
          });
        });
        root.querySelectorAll("[data-equip-gun]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = (btn as HTMLElement).dataset.equipGun as ArmoryGunId;
            if (!meta.unlockedGuns.includes(id)) return;
            meta.equippedGun = id;
            previewGun = id;
            saveOgMeta(meta);
            paint();
          });
        });
        root.querySelectorAll("[data-up]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = (btn as HTMLElement).dataset.up as OgMetaUpgrade;
            const cost = UPGRADE_COSTS[id];
            if (meta.upgrades.includes(id) || meta.stars < cost) return;
            meta.stars -= cost;
            meta.upgrades.push(id);
            saveOgMeta(meta);
            paint();
          });
        });
      };

      paint();
    },
    unmount() {
      previewCleanup?.();
      previewCleanup = undefined;
    },
  };
}
