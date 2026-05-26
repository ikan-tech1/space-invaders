import type { GameSettings } from "../storage/LocalStorageRepo";
import type { LocalStorageRepo } from "../storage/LocalStorageRepo";
import type { Screen } from "./ScreenRouter";
import { OG_CHALLENGES } from "../progression/challenges";
import {
  loadOgMeta,
  saveOgMeta,
  UPGRADE_COSTS,
  type OgMetaUpgrade,
} from "../progression/metaStore";
import { POWERUP_LABELS, type PowerUpType } from "../config";

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
            <p><strong>Secrets:</strong> Konami code on title, score 8008, 100 total kills.</p>
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
            ${meta.badges.includes(c.id) ? '<span class="challenge-badge">Complete</span>' : ""}
          </div>
          <p class="challenge-desc">${c.description}</p>
          <span class="challenge-reward">${c.reward}</span>
        </li>`
      ).join("");
      root.innerHTML = `
        <div class="screen sub-screen">
          ${renderSubHeader("Challenges", `${meta.badges.length} / ${OG_CHALLENGES.length} cleared`, "— ACHIEVEMENTS —")}
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
  return {
    id: "armory",
    mount(root) {
      const meta = loadOgMeta();
      const upgrades: { id: OgMetaUpgrade; label: string }[] = [
        { id: "extraLife", label: "Extra life (+1)" },
        { id: "fastShot", label: "Faster first shot" },
        { id: "shieldRepair", label: "Shield repair between levels" },
      ];
      const rows = upgrades
        .map((u) => {
          const owned = meta.upgrades.includes(u.id);
          const cost = UPGRADE_COSTS[u.id];
          return `<button type="button" class="btn btn-upgrade" data-up="${u.id}" ${owned ? "disabled" : ""}>
            <span>${u.label}</span>
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
      root.innerHTML = `
        <div class="screen sub-screen">
          ${renderSubHeader("Armory", `★ ${meta.stars} available`, "— UPGRADES —")}
          <section class="panel cabinet-panel">
            <h2 class="panel-label">Upgrades</h2>
            <div class="upgrade-list">${rows}</div>
          </section>
          <section class="panel cabinet-panel panel-flush">
            <h2 class="panel-label">Unlocked pickups</h2>
            <ul class="armory-pickup-list">${pickupRows}</ul>
            <p class="armory-hint">Clear challenges to unlock more power-ups in runs.</p>
          </section>
          <button type="button" class="btn btn-primary" data-back>Main Menu</button>
        </div>`;
      root.querySelectorAll("[data-up]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = (btn as HTMLElement).dataset.up as OgMetaUpgrade;
          const m = loadOgMeta();
          const cost = UPGRADE_COSTS[id];
          if (m.upgrades.includes(id) || m.stars < cost) return;
          m.stars -= cost;
          m.upgrades.push(id);
          saveOgMeta(m);
          createArmoryScreen(onBack).mount(root);
        });
      });
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}
