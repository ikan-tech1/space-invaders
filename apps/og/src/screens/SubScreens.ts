import type { GameSettings } from "../storage/LocalStorageRepo";
import type { LocalStorageRepo } from "../storage/LocalStorageRepo";
import type { Screen } from "./ScreenRouter";
import {
  renderSubBackFooter,
  renderSubCabinetShell,
  renderSubHeader,
} from "../ui/cabinetShell";
import { OG_CHALLENGES, WEEKLY_CHALLENGES } from "../progression/challenges";
import { getPendingCelebrations } from "../progression/challengeState";
import {
  formatCountdown,
  getDailyDateKey,
  getDailyTasks,
  loadDailyCompletedDate,
  loadDailyStreak,
  msUntilMidnight,
} from "../progression/dailyChallenges";
import {
  loadOgMeta,
  recordTokenSpend,
  saveOgMeta,
  unlockCosmeticColor,
  UPGRADE_COSTS,
  UPGRADE_LABELS,
  type OgMetaUpgrade,
} from "../progression/metaStore";
import { EasterEggRegistry } from "../progression/easterEggs";
import { queuePendingToast } from "../progression/pendingToasts";
import {
  COLOR_PALETTE,
  COLOR_STAR_COST,
  COSMETIC_COLOR_LABELS,
  getCosmeticsForHull,
  normalizeCallsign,
  resolveShipPaint,
  type CosmeticColorId,
  type CockpitTintId,
} from "../progression/shipCosmetics";
import { getWeeklyProgressLabel } from "../progression/weeklyChallenges";
import { ARMORY_GUNS, type ArmoryGunId } from "../progression/armoryGuns";
import { SHIP_PROFILES, type ShipId } from "../progression/ships";
import { GUN_VOLLEY_LABELS, getGunCompareStats } from "../game/weaponVolley";
import { POWERUP_LABELS, type PowerUpType } from "../config";
import {
  mountArmoryGunPreviews,
  mountArmoryShipSprites,
  mountHangarHeroPreview,
} from "../ui/armoryGunPreview";
import { runChallengeCelebrations } from "../ui/challengeCelebration";

export function createSettingsScreen(
  repo: LocalStorageRepo,
  onBack: () => void
): Screen {
  return {
    id: "settings",
    mount(root) {
      const s = repo.getSettings();
      root.innerHTML = renderSubCabinetShell({
        headerHtml: renderSubHeader("Settings", "Cabinet configuration", "— CONFIG —"),
        bodyHtml: `
          <section class="panel cabinet-panel">
            <h2 class="panel-label">Audio &amp; Controls</h2>
            <div class="settings-row">
              <label for="vol">Master volume</label>
              <input type="range" id="vol" min="0" max="1" step="0.05" value="${s.volume}" />
            </div>
            <div class="settings-row">
              <label for="sfx">SFX volume</label>
              <input type="range" id="sfx" min="0" max="1" step="0.05" value="${s.sfxVolume}" />
            </div>
            <div class="settings-row">
              <label for="ui">UI / slot volume</label>
              <input type="range" id="ui" min="0" max="1" step="0.05" value="${s.uiVolume}" />
            </div>
            <div class="settings-row">
              <label for="touch">Touch control size</label>
              <input type="range" id="touch" min="0.8" max="1.4" step="0.1" value="${s.touchScale}" />
            </div>
            <div class="settings-row">
              <label for="mute">Mute</label>
              <input type="checkbox" id="mute" ${s.muted ? "checked" : ""} />
            </div>
          </section>`,
        footerHtml: renderSubBackFooter(),
      });
      const save = (): void => {
        const settings: GameSettings = {
          volume: parseFloat((root.querySelector("#vol") as HTMLInputElement).value),
          sfxVolume: parseFloat((root.querySelector("#sfx") as HTMLInputElement).value),
          uiVolume: parseFloat((root.querySelector("#ui") as HTMLInputElement).value),
          touchScale: parseFloat((root.querySelector("#touch") as HTMLInputElement).value),
          muted: (root.querySelector("#mute") as HTMLInputElement).checked,
        };
        repo.saveSettings(settings);
      };
      root.querySelector("#vol")?.addEventListener("input", save);
      root.querySelector("#sfx")?.addEventListener("input", save);
      root.querySelector("#ui")?.addEventListener("input", save);
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
      root.innerHTML = renderSubCabinetShell({
        headerHtml: renderSubHeader("High Scores", "Hall of fame", "— TOP PLAYERS —"),
        bodyHtml: `
          <section class="panel cabinet-panel panel-flush">
            <ul class="high-score-list">${rows}</ul>
          </section>`,
        footerHtml: renderSubBackFooter(),
      });
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

export function createHowToPlayScreen(onBack: () => void): Screen {
  return {
    id: "howToPlay",
    mount(root) {
      root.innerHTML = renderSubCabinetShell({
        headerHtml: renderSubHeader("How to Play", "Operator manual", "— READ ME —"),
        bodyHtml: `
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
          </section>`,
        footerHtml: renderSubBackFooter(),
      });
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

function renderChallengeRow(
  c: (typeof OG_CHALLENGES)[number] | (typeof WEEKLY_CHALLENGES)[number],
  done: boolean,
  extra = ""
): string {
  const scope = c.scope === "weekly" ? "Weekly" : "Campaign";
  const rewardBits: string[] = [];
  if (!done && c.starReward) rewardBits.push(`+${c.starReward} ★`);
  if (!done && c.tokenReward) rewardBits.push(`+${c.tokenReward} ◎`);
  const rewardTag = done
    ? '<span class="challenge-badge">Complete</span>'
    : rewardBits.length
      ? `<span class="challenge-stars">${rewardBits.join(" · ")}</span>`
      : "";
  return `
    <li class="challenge-item ${done ? "challenge-item--done" : "challenge-item--pending"}" data-challenge-id="${c.id}">
      <span class="challenge-item-icon" aria-hidden="true">${done ? "✓" : "○"}</span>
      <div class="challenge-item-body">
        <div class="challenge-header">
          <strong>${c.title}</strong>
          <span class="challenge-scope-tag challenge-scope-tag--${c.scope}">${scope}</span>
          ${rewardTag}
        </div>
        <p class="challenge-desc">${c.description}</p>
        <span class="challenge-reward">${c.reward}${extra ? ` · ${extra}` : ""}</span>
      </div>
    </li>`;
}

export function createDailyOpsScreen(onBack: () => void): Screen {
  return {
    id: "dailyOps",
    mount(root) {
      const meta = loadOgMeta();
      const tasks = getDailyTasks();
      const dailyDone = loadDailyCompletedDate() === getDailyDateKey();
      const streak = loadDailyStreak() || meta.dailyStreak;
      const countdown = formatCountdown(msUntilMidnight());
      const taskRows = tasks
        .map(
          (t) => `
        <li class="daily-ops-task ${dailyDone ? "daily-ops-task--done" : ""}" data-daily-id="${t.id}">
          <span class="daily-ops-task-icon" aria-hidden="true">${dailyDone ? "✓" : "◎"}</span>
          <div class="daily-ops-task-body">
            <strong>${t.title}</strong>
            <p>${t.description}</p>
            <span class="daily-ops-task-reward">+${t.tokenReward} ◎</span>
          </div>
        </li>`
        )
        .join("");

      root.innerHTML = renderSubCabinetShell({
        screenClass: "daily-ops-screen",
        shellClass: "sub-cabinet-shell--daily",
        headerHtml: renderSubHeader(
          "Daily Ops",
          dailyDone ? "Today's bundle complete" : "Complete any task in one run",
          "— DAILY BRIEF —"
        ),
        bodyHtml: `
          <section class="panel cabinet-panel daily-ops-hero">
            <div class="daily-ops-stats">
              <div class="daily-ops-stat">
                <span class="daily-ops-stat-label">Streak</span>
                <strong class="daily-ops-stat-value">${streak} day${streak === 1 ? "" : "s"}</strong>
              </div>
              <div class="daily-ops-stat">
                <span class="daily-ops-stat-label">Resets in</span>
                <strong class="daily-ops-stat-value daily-ops-countdown" data-countdown>${countdown}</strong>
              </div>
              <div class="daily-ops-stat">
                <span class="daily-ops-stat-label">Reward</span>
                <strong class="daily-ops-stat-value">+${tasks.reduce((s, t) => s + t.tokenReward, 0)} ◎</strong>
              </div>
            </div>
            ${dailyDone ? '<p class="daily-ops-complete-banner">All ops complete — see you at midnight</p>' : ""}
          </section>
          <section class="panel cabinet-panel">
            <h2 class="panel-label">Today's objectives</h2>
            <ul class="daily-ops-list">${taskRows}</ul>
            <p class="daily-challenge-hint">Finish any objective during a run · Resets at local midnight</p>
          </section>
          <section class="panel cabinet-panel daily-ops-tip">
            <p class="challenge-star-note">Daily Ops is separate from the trophy board. Campaign &amp; weekly badges live under Challenges.</p>
          </section>`,
        footerHtml: renderSubBackFooter(),
      });

      root.querySelector("[data-back]")?.addEventListener("click", onBack);

      const countdownEl = root.querySelector<HTMLElement>("[data-countdown]");
      const tick = (): void => {
        if (!countdownEl?.isConnected) return;
        countdownEl.textContent = formatCountdown(msUntilMidnight());
        window.setTimeout(tick, 1000);
      };
      tick();

      const pending = getPendingCelebrations("daily");
      const nextPending = dailyDone ? undefined : tasks[0];
      runChallengeCelebrations(
        root,
        pending,
        nextPending ? `[data-daily-id="${nextPending.id}"]` : undefined
      );
    },
    unmount() {},
  };
}

export function createChallengesScreen(onBack: () => void): Screen {
  return {
    id: "challenges",
    mount(root) {
      const meta = loadOgMeta();
      const campaignRows = OG_CHALLENGES.map((c) => {
        const done = meta.badges.includes(c.id);
        return renderChallengeRow(c, done);
      }).join("");
      const weeklyRows = WEEKLY_CHALLENGES.map((c) => {
        const done = meta.weeklyClaimed.includes(c.id);
        const progress = done ? "" : getWeeklyProgressLabel(c.id);
        return renderChallengeRow(c, done, progress);
      }).join("");
      const doneCampaign = meta.badges.length;
      const doneWeekly = meta.weeklyClaimed.length;

      root.innerHTML = renderSubCabinetShell({
        screenClass: "challenges-screen",
        headerHtml: renderSubHeader(
          "Challenges",
          `${doneCampaign} campaign · ${doneWeekly} weekly · ★ ${meta.stars} banked`,
          "— TROPHY BOARD —"
        ),
        bodyHtml: `
          <section class="panel cabinet-panel">
            <h2 class="panel-label">Weekly ops <span class="panel-label-sub">Resets Monday</span></h2>
            <ul class="challenge-list">${weeklyRows}</ul>
          </section>
          <p class="challenge-star-note">Weekly progress accumulates across runs this week.</p>
          <section class="panel cabinet-panel panel-flush">
            <h2 class="panel-label">Campaign badges <span class="panel-label-sub">${doneCampaign}/${OG_CHALLENGES.length}</span></h2>
            <ul class="challenge-list">${campaignRows}</ul>
          </section>
          <p class="challenge-star-note">Complete badges to earn ★ for Armory upgrades and unlock pickups.</p>`,
        footerHtml: renderSubBackFooter(),
      });
      root.querySelector("[data-back]")?.addEventListener("click", onBack);

      const pending = getPendingCelebrations("challenges");
      const nextCampaign = OG_CHALLENGES.find((c) => !meta.badges.includes(c.id));
      runChallengeCelebrations(
        root,
        pending,
        nextCampaign ? `[data-challenge-id="${nextCampaign.id}"]` : undefined
      );
    },
    unmount() {},
  };
}

const GAME_MODE_TILES = [
  { id: "survival", name: "Survival+", icon: "∞" },
  { id: "boss_rush", name: "Boss Rush", icon: "☠" },
  { id: "pacifist", name: "Pacifist", icon: "◎" },
  { id: "token_rush", name: "Token Rush", icon: "◎◎" },
  { id: "coop", name: "Co-op", icon: "👥" },
  { id: "mirror", name: "Mirror", icon: "⇄" },
  { id: "nightmare", name: "Nightmare", icon: "☽" },
  { id: "time_attack", name: "Time Attack", icon: "⏱" },
  { id: "gauntlet", name: "Gauntlet", icon: "⚔" },
  { id: "daily_gauntlet", name: "Daily Gauntlet", icon: "☀" },
];

export function createGameModesScreen(onBack: () => void): Screen {
  return {
    id: "gameModes",
    mount(root) {
      const tiles = GAME_MODE_TILES.map(
        (m) => `
        <button type="button" class="modes-tile modes-tile--locked" data-mode="${m.id}" disabled>
          <span class="modes-tile-lock" aria-hidden="true">🔒</span>
          <span class="modes-tile-icon">${m.icon}</span>
          <span class="modes-tile-label">${m.name}</span>
          <span class="modes-tile-meta">Coming soon</span>
        </button>`
      ).join("");

      root.innerHTML = renderSubCabinetShell({
        screenClass: "game-modes-screen",
        headerHtml: renderSubHeader("Game Modes", "Alternate rulesets · build one by one", "— COMING SOON —"),
        bodyHtml: `
          <section class="panel cabinet-panel">
            <p class="modes-intro">Locked modes are planned in <code>docs/GAME_MODES.md</code>. Campaign &amp; Endless remain the live ways to play.</p>
            <div class="modes-grid">${tiles}</div>
          </section>`,
        footerHtml: renderSubBackFooter(),
      });
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

export function createArmoryScreen(onBack: () => void): Screen {
  let previewCleanup: (() => void) | undefined;
  const armoryEggs = new EasterEggRegistry();

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
          if (d === 0) return "";
          const good = inv ? d < 0 : d > 0;
          const pct = Math.round(Math.abs(d) * 100);
          return `<span class="compare-chip compare-chip--${good ? "good" : "bad"}">${d > 0 ? "+" : "−"}${pct}%</span>`;
        };
        const statChip = (label: string, eq: string, pv: string, delta = "", improved = false) =>
          `<span class="armory-stat-chip ${improved ? "armory-stat-chip--improved" : ""} ${delta.includes("compare-chip--good") ? "armory-stat-chip--buff" : delta.includes("compare-chip--bad") ? "armory-stat-chip--nerf" : ""}">
            <span class="armory-stat-chip-label">${label}</span>
            <span class="armory-stat-chip-eq">${eq}</span>
            <span class="armory-stat-chip-arrow">→</span>
            <span class="armory-stat-chip-pv">${pv}</span>${delta}
          </span>`;
        const hasPreviewDelta = previewShip !== equippedShip || previewGun !== equippedGun;
        return `
          <section class="panel cabinet-panel armory-compare ${hasPreviewDelta ? "armory-compare--active" : ""}" data-compare-panel>
            <h2 class="panel-label">Loadout compare</h2>
            <div class="armory-compare-chips">
              <div class="armory-compare-chip armory-compare-chip--equipped">
                <span class="armory-compare-tag">Equipped</span>
                <strong>${eqShip.name}</strong>
                <span class="armory-compare-gun">${GUN_VOLLEY_LABELS[equippedGun]}</span>
              </div>
              <span class="armory-compare-vs" aria-hidden="true">⇄</span>
              <div class="armory-compare-chip armory-compare-chip--preview ${hasPreviewDelta ? "armory-compare-chip--highlight" : ""}">
                <span class="armory-compare-tag">Preview</span>
                <strong>${pvShip.name}</strong>
                <span class="armory-compare-gun">${GUN_VOLLEY_LABELS[previewGun]}</span>
              </div>
            </div>
            <div class="armory-stat-chips">
              ${statChip("Speed", `${Math.round(eqShip.speedMult * 100)}%`, `${Math.round(pvShip.speedMult * 100)}%`, previewShip !== equippedShip ? shipDiff(eqShip.speedMult, pvShip.speedMult) : "")}
              ${statChip("Fire", `${Math.round(eqShip.fireCooldownMult * 100)}%`, `${Math.round(pvShip.fireCooldownMult * 100)}%`, previewShip !== equippedShip ? shipDiff(eqShip.fireCooldownMult, pvShip.fireCooldownMult, true) : "")}
              ${statChip("Hull", `${Math.round(eqShip.hitboxScale * 100)}%`, `${Math.round(pvShip.hitboxScale * 100)}%`, previewShip !== equippedShip ? shipDiff(eqShip.hitboxScale, pvShip.hitboxScale, true) : "")}
              ${statChip("Volley", `${eqGunStats.volleySize}`, `${pvGunStats.volleySize}`, previewGun !== equippedGun && pvGunStats.volleySize !== eqGunStats.volleySize ? `<span class="compare-chip compare-chip--good">+${pvGunStats.volleySize - eqGunStats.volleySize}</span>` : "")}
              ${statChip("Tier", eqGunStats.cooldownTier, pvGunStats.cooldownTier)}
            </div>
            <p class="armory-compare-hint">Tap a ship or gun card to preview stats before equipping.</p>
          </section>`;
      };

      const getPreviewCosmetics = () => getCosmeticsForHull(meta.shipCosmetics, previewShip);

      const renderColorSwatches = (
        field: "primary" | "accent" | "cockpit",
        current: CosmeticColorId | CockpitTintId
      ): string => {
        const colors = Object.keys(COLOR_PALETTE) as CosmeticColorId[];
        const noneOn = current === "none" ? "cosmetic-swatch--on cosmetic-swatch--selected" : "";
        const noneBtn =
          field === "cockpit"
            ? `<button type="button" class="cosmetic-swatch cosmetic-swatch--none ${noneOn}" data-cosmetic-field="${field}" data-cosmetic-color="none" aria-label="No cockpit tint" aria-selected="${current === "none" ? "true" : "false"}">—</button>`
            : "";
        return `${noneBtn}${colors
          .map((id) => {
            const unlocked = meta.unlockedCosmeticColors.includes(id);
            const on = current === id;
            const lockHint = unlocked ? "" : " (locked)";
            const hex = COLOR_PALETTE[id];
            const label = COSMETIC_COLOR_LABELS[id];
            const swatchStyle = "background:" + hex;
            const unlockedFlag = unlocked ? "1" : "0";
            const onCls = on ? "cosmetic-swatch--on cosmetic-swatch--selected" : "";
            const lockCls = !unlocked ? "cosmetic-swatch--locked" : "";
            return `<button type="button" class="cosmetic-swatch ${onCls} ${lockCls}"
              data-cosmetic-field="${field}" data-cosmetic-color="${id}" data-unlocked="${unlockedFlag}"
              style="${swatchStyle}" aria-label="${label}${lockHint}" aria-selected="${on ? "true" : "false"}"></button>`;
          })
          .join("")}`;
      };

      const renderCosmeticsPanel = (): string => {
        const c = getPreviewCosmetics();
        const callsign = c.callsign;
        return `
          <section class="panel cabinet-panel armory-cosmetics-panel">
            <h2 class="panel-label">Hull cosmetics <span class="panel-label-sub">◎ palette · ★ unlock colors</span></h2>
            <label class="armory-callsign-label" for="armory-callsign">Name plate (12 chars)</label>
            <input id="armory-callsign" class="armory-callsign-input" type="text" maxlength="12" placeholder="CALLSIGN" value="${callsign.replace(/"/g, "&quot;")}" autocomplete="off" />
            <div class="cosmetic-row">
              <span class="cosmetic-row-label">Primary</span>
              <div class="cosmetic-swatches">${renderColorSwatches("primary", c.primary)}</div>
            </div>
            <div class="cosmetic-row">
              <span class="cosmetic-row-label">Engine / accent</span>
              <div class="cosmetic-swatches">${renderColorSwatches("accent", c.accent)}</div>
            </div>
            <div class="cosmetic-row">
              <span class="cosmetic-row-label">Cockpit tint</span>
              <div class="cosmetic-swatches">${renderColorSwatches("cockpit", c.cockpitTint)}</div>
            </div>
            <p class="armory-hint">Locked colors: ${COLOR_STAR_COST} ★ each in armory, or clear secrets / L12 blitz.</p>
          </section>`;
      };

      const renderHangarHero = (): string => {
        const s = SHIP_PROFILES[previewShip];
        const owned = meta.unlockedShips.includes(previewShip);
        const equipped = equippedShip === previewShip;
        const cs = getPreviewCosmetics().callsign;
        const csHtml = cs ? ` · <span class="hangar-callsign">${cs}</span>` : "";
        return `
          <section class="panel cabinet-panel hangar-hero-panel">
            <h2 class="panel-label">Fighter hangar</h2>
            <div class="hangar-hero">
              <canvas class="hangar-hero-canvas" data-ship-hero width="200" height="120" aria-hidden="true"></canvas>
              <div class="hangar-hero-info">
                <h3 class="hangar-hero-name">${s.name}${csHtml}</h3>
                <p class="hangar-hero-tagline">${s.tagline}</p>
                <p class="hangar-hero-flavor">${s.flavor}</p>
                <div class="hangar-hero-stats">
                  <span>Speed ${Math.round(s.speedMult * 100)}%</span>
                  <span>Fire ${Math.round(s.fireCooldownMult * 100)}%</span>
                  <span>Hull ${Math.round(s.hitboxScale * 100)}%</span>
                </div>
                <div class="hangar-hero-passive">
                  <span class="hangar-hero-passive-label">${s.passiveLabel}</span>
                  <span class="hangar-hero-passive-desc">${s.passiveDesc}</span>
                </div>
                <div class="hangar-hero-actions">
                  ${
                    equipped
                      ? '<span class="armory-equipped-badge hangar-equipped-badge">Selected for next run</span>'
                      : owned
                        ? `<button type="button" class="btn btn-primary hangar-select-btn" data-equip-ship="${previewShip}">Select ship</button>`
                        : `<button type="button" class="btn btn-primary btn-token hangar-select-btn" data-buy-ship="${previewShip}" ${meta.tokens < s.tokenCost ? "disabled" : ""}>
                            Unlock &amp; select · ${s.tokenCost === 0 ? "Free" : `${s.tokenCost} ◎`}
                          </button>`
                  }
                </div>
              </div>
            </div>
          </section>`;
      };

      const renderShipCards = (): string => {
        const shipIds = Object.keys(SHIP_PROFILES) as ShipId[];
        const cards = shipIds
          .map((id) => {
            const s = SHIP_PROFILES[id];
            const owned = meta.unlockedShips.includes(id);
            const equipped = equippedShip === id;
            const selected = previewShip === id;
            const speedPct = Math.round(s.speedMult * 100);
            const firePct = Math.round(s.fireCooldownMult * 100);
            const paint = resolveShipPaint(getCosmeticsForHull(meta.shipCosmetics, id), s.color, s.accent);
            return `
          <article class="armory-ship-card ${equipped ? "armory-ship-card--equipped" : ""} ${selected ? "armory-ship-card--selected" : ""} ${!owned ? "armory-ship-card--locked" : ""}" data-ship="${id}" data-preview-ship="${id}" role="button" tabindex="0" aria-selected="${selected ? "true" : "false"}">
            <canvas class="armory-ship-preview" width="56" height="40"
              data-ship-preview="${s.spriteKey}" data-ship-color="${paint.primary}" aria-hidden="true"></canvas>
            <div class="armory-ship-info">
              <h3 class="armory-ship-name">${s.name}</h3>
              <p class="armory-ship-tag">${s.tagline}</p>
              <p class="armory-ship-stats">Speed ${speedPct}% · Fire ${firePct}% · Hull ${Math.round(s.hitboxScale * 100)}%</p>
            </div>
            <div class="armory-ship-actions">
              ${
                equipped
                  ? '<span class="armory-equipped-badge">Selected</span>'
                  : owned
                    ? `<button type="button" class="btn btn-sm" data-equip-ship="${id}">Select</button>`
                    : `<span class="armory-lock-label">${s.tokenCost} ◎</span>`
              }
            </div>
          </article>`;
          })
          .join("");
        const futureSlots = [1, 2]
          .map(
            (n) => `
          <article class="armory-ship-card armory-ship-card--future" aria-disabled="true">
            <div class="armory-ship-preview armory-ship-preview--ghost" aria-hidden="true">?</div>
            <div class="armory-ship-info">
              <h3 class="armory-ship-name">Classified ${n}</h3>
              <p class="armory-ship-tag">Future hull · coming soon</p>
            </div>
            <span class="armory-lock-label">🔒</span>
          </article>`
          )
          .join("");
        return cards + futureSlots;
      };

      const renderGunCards = (): string =>
        ARMORY_GUNS.map((g) => {
          const owned = meta.unlockedGuns.includes(g.id);
          const equipped = equippedGun === g.id;
          const selected = previewGun === g.id;
          const label = GUN_VOLLEY_LABELS[g.id];
          const stats = getGunCompareStats(g.id);
          return `
        <article class="armory-gun-card ${equipped ? "armory-gun-card--equipped" : ""} ${selected ? "armory-gun-card--selected" : ""}" data-gun="${g.id}" data-preview-gun="${g.id}" role="button" tabindex="0" aria-selected="${selected ? "true" : "false"}">
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

      const restoreScroll = (scrollTop: number): void => {
        requestAnimationFrame(() => {
          const scrollEl = root.querySelector<HTMLElement>(".sub-cabinet-scroll");
          if (scrollEl) scrollEl.scrollTop = scrollTop;
        });
      };

      const paint = (): void => {
        const scrollEl = root.querySelector<HTMLElement>(".sub-cabinet-scroll");
        const savedScrollTop = scrollEl?.scrollTop ?? 0;
        root.innerHTML = renderSubCabinetShell({
          screenClass: "armory-screen",
          headerHtml: renderSubHeader("Armory", "Hangar · loadout · upgrades", "— INSERT COIN —"),
          bodyHtml: `
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
          ${renderHangarHero()}
          ${renderCosmeticsPanel()}
          <section class="panel cabinet-panel">
            <h2 class="panel-label">All hulls</h2>
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
          </section>`,
          footerHtml: renderSubBackFooter(),
        });
        bindEvents();
        mountArmoryShipSprites(root);
        const pvShip = SHIP_PROFILES[previewShip];
        const pvPaint = resolveShipPaint(getPreviewCosmetics(), pvShip.color, pvShip.accent);
        mountHangarHeroPreview(root, pvShip.spriteKey, pvPaint.primary);
        previewCleanup = mountArmoryGunPreviews(root, {
          selectedGun: previewGun,
          shipSprite: pvShip.spriteKey,
          shipColor: pvPaint.primary,
        });
        restoreScroll(savedScrollTop);
      };

      const saveCosmetics = (patch: Partial<ReturnType<typeof getPreviewCosmetics>>): void => {
        const cur = getPreviewCosmetics();
        meta.shipCosmetics[previewShip] = { ...cur, ...patch, hullId: previewShip };
        saveOgMeta(meta);
        paint();
      };

      const bindEvents = (): void => {
        root.querySelector("[data-back]")?.addEventListener("click", onBack);

        const callsignEl = root.querySelector<HTMLInputElement>("#armory-callsign");
        const applyCallsign = (): void => {
          const raw = normalizeCallsign(callsignEl?.value ?? "");
          if (callsignEl) callsignEl.value = raw;
          saveCosmetics({ callsign: raw });
          const s = SHIP_PROFILES[previewShip];
          const reward = armoryEggs.onTitanCallsign(raw, s.name);
          if (reward) {
            queuePendingToast(reward.message);
            const toast = document.createElement("p");
            toast.className = "menu-secret-toast menu-secret-toast--visible menu-secret-toast--achievement";
            toast.textContent = reward.message;
            root.appendChild(toast);
            setTimeout(() => toast.remove(), 3600);
            const hero = root.querySelector<HTMLCanvasElement>("canvas[data-ship-hero]");
            if (hero) {
              const ctx = hero.getContext("2d");
              if (ctx) {
                const cx = hero.width / 2;
                const cy = hero.height * 0.4;
                for (let i = 0; i < 14; i++) {
                  ctx.fillStyle = "#ffd24a";
                  ctx.globalAlpha = 0.35;
                  ctx.fillRect(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 30, 2, 2);
                }
                ctx.globalAlpha = 1;
              }
            }
          }
        };
        callsignEl?.addEventListener("change", applyCallsign);
        callsignEl?.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            applyCallsign();
          }
        });

        root.querySelectorAll("[data-cosmetic-field]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const field = (btn as HTMLElement).dataset.cosmeticField as
              | "primary"
              | "accent"
              | "cockpit";
            const color = (btn as HTMLElement).dataset.cosmeticColor as CosmeticColorId | "none";
            const unlocked = (btn as HTMLElement).dataset.unlocked === "1";
            if (color !== "none" && !unlocked) {
              if (meta.stars < COLOR_STAR_COST) return;
              meta.stars -= COLOR_STAR_COST;
              unlockCosmeticColor(meta, color);
              saveOgMeta(meta);
            }
            if (field === "cockpit") {
              saveCosmetics({ cockpitTint: color as CockpitTintId });
            } else {
              saveCosmetics({ [field]: color as CosmeticColorId });
            }
          });
        });

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
            recordTokenSpend(meta, cost);
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
            recordTokenSpend(meta, def.tokenCost);
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
