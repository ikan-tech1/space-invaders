import type { Game } from "../game/Game";
import { OG_CHALLENGES, WEEKLY_CHALLENGES } from "../progression/challenges";
import {
  formatCountdown,
  getDailyDateKey,
  getDailyProgress,
  loadDailyCompletedDate,
  msUntilMidnight,
} from "../progression/dailyChallenges";
import { loadOgMeta } from "../progression/metaStore";
import { getWeeklyProgressLabel } from "../progression/weeklyChallenges";
import { ARCADE_FRAME } from "./cabinetShell";

export interface PauseMissionControlHandlers {
  onResume: () => void;
  onExitToMenu: () => void;
}

const BADGE_ICONS: Record<string, string> = {
  no_hit_l3: "🛡",
  combo_10: "⚡",
  speed_clear: "⏱",
  phantom_run: "👻",
  scatter_ace: "✦",
  gun_collector: "🔫",
  titan_siege: "⬡",
  vanguard_haul: "◎",
  mini_boss_slam: "☠",
  kill_streak_50: "✕",
  iron_will_l5: "⬢",
  token_spender: "◎",
  weekly_hunter: "🎯",
  weekly_push: "▲",
  weekly_slayer: "☠",
};

function badgeIcon(id: string): string {
  return BADGE_ICONS[id] ?? "★";
}

interface ActiveChallengeRow {
  id: string;
  title: string;
  description: string;
  scope: "campaign" | "weekly";
  current: number;
  target: number;
  pct: number;
  hasBar: boolean;
}

function campaignProgress(
  id: string,
  snap: ReturnType<Game["getPauseSnapshot"]>
): { current: number; target: number } | null {
  switch (id) {
    case "kill_streak_50":
      return { current: snap.runKills, target: 50 };
    case "vanguard_haul":
      return snap.equippedShip === "vanguard"
        ? { current: snap.runTokensEarned, target: 30 }
        : null;
    case "gun_collector":
      return { current: snap.unlockedGunCount, target: 5 };
    case "token_spender":
      return { current: snap.totalTokensSpent, target: 100 };
    case "combo_10":
      return { current: snap.maxComboThisLevel, target: 10 };
    default:
      return null;
  }
}

function weeklyProgressNumbers(id: string): { current: number; target: number } | null {
  const meta = loadOgMeta();
  const thresholds: Record<string, { key: string; need: number }> = {
    weekly_hunter: { key: "kills", need: 75 },
    weekly_push: { key: "levels", need: 4 },
    weekly_slayer: { key: "bosses", need: 2 },
  };
  const t = thresholds[id];
  if (!t) return null;
  return { current: meta.weeklyProgress[t.key] ?? 0, target: t.need };
}

function pickActiveChallenges(snap: ReturnType<Game["getPauseSnapshot"]>): ActiveChallengeRow[] {
  const rows: ActiveChallengeRow[] = [];
  const meta = loadOgMeta();

  for (const c of WEEKLY_CHALLENGES) {
    if (meta.weeklyClaimed.includes(c.id)) continue;
    const nums = weeklyProgressNumbers(c.id);
    if (!nums) continue;
    const pct = Math.min(100, Math.round((nums.current / nums.target) * 100));
    rows.push({
      id: c.id,
      title: c.title,
      description: c.description,
      scope: "weekly",
      current: nums.current,
      target: nums.target,
      pct,
      hasBar: true,
    });
  }

  for (const c of OG_CHALLENGES) {
    if (meta.badges.includes(c.id)) continue;
    const nums = campaignProgress(c.id, snap);
    rows.push({
      id: c.id,
      title: c.title,
      description: c.description,
      scope: "campaign",
      current: nums?.current ?? 0,
      target: nums?.target ?? 1,
      pct: nums ? Math.min(100, Math.round((nums.current / nums.target) * 100)) : 0,
      hasBar: nums !== null,
    });
  }

  return rows
    .sort((a, b) => {
      if (a.hasBar !== b.hasBar) return a.hasBar ? -1 : 1;
      return b.pct - a.pct;
    })
    .slice(0, 3);
}

function renderProgressBar(pct: number, label: string): string {
  return `
    <div class="pmc-progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${label}">
      <div class="pmc-progress-fill" style="width:${pct}%"></div>
    </div>`;
}

function renderDailyRow(
  task: ReturnType<typeof getDailyProgress>[number],
  bundleDone: boolean
): string {
  const done = bundleDone || task.done;
  const progressLabel = task.target > 1 ? `${task.current}/${task.target}` : done ? "Done" : "—";
  return `
    <li class="pmc-daily-row ${done ? "pmc-daily-row--done" : ""}">
      <span class="pmc-daily-icon" aria-hidden="true">${done ? "✓" : "◎"}</span>
      <div class="pmc-daily-body">
        <div class="pmc-row-head">
          <strong>${task.title}</strong>
          <span class="pmc-row-meta">${progressLabel}</span>
        </div>
        <p class="pmc-row-desc">${task.description}</p>
        ${done ? "" : renderProgressBar(task.pct, task.title)}
      </div>
    </li>`;
}

function renderChallengeRow(row: ActiveChallengeRow): string {
  const scopeTag =
    row.scope === "weekly"
      ? '<span class="challenge-scope-tag challenge-scope-tag--weekly">Weekly</span>'
      : '<span class="challenge-scope-tag challenge-scope-tag--campaign">Campaign</span>';
  const progressMeta = row.hasBar ? `${row.current}/${row.target}` : getWeeklyProgressLabel(row.id) || "In progress";
  return `
    <li class="pmc-challenge-row">
      <span class="pmc-challenge-icon" aria-hidden="true">${badgeIcon(row.id)}</span>
      <div class="pmc-challenge-body">
        <div class="pmc-row-head">
          <strong>${row.title}</strong>
          ${scopeTag}
          <span class="pmc-row-meta">${progressMeta}</span>
        </div>
        <p class="pmc-row-desc">${row.description}</p>
        ${row.hasBar ? renderProgressBar(row.pct, row.title) : ""}
      </div>
    </li>`;
}

function renderBadgeStrip(badgeIds: string[], total: number): string {
  const recent = badgeIds.slice(-3).reverse();
  const icons =
    recent.length > 0
      ? recent
          .map((id) => {
            const def = OG_CHALLENGES.find((c) => c.id === id);
            return `<span class="pmc-badge-chip" title="${def?.title ?? id}">${badgeIcon(id)}</span>`;
          })
          .join("")
      : '<span class="pmc-badge-empty">No badges yet</span>';

  return `
    <div class="pmc-badge-strip">
      <div class="pmc-badge-count">
        <span class="pmc-badge-count-value">${badgeIds.length}/${total}</span>
        <span class="pmc-badge-count-label">Campaign badges</span>
      </div>
      <div class="pmc-badge-icons" aria-label="Recent badges">${icons}</div>
    </div>`;
}

export function renderPauseMissionControl(
  overlay: HTMLElement,
  game: Game,
  handlers: PauseMissionControlHandlers
): void {
  const snap = game.getPauseSnapshot();
  const dailyBundleDone = loadDailyCompletedDate() === getDailyDateKey();
  const dailyTasks = getDailyProgress(snap.dailyStats);
  const activeChallenges = pickActiveChallenges(snap);
  const countdown = formatCountdown(msUntilMidnight());
  const livesDisplay = "♥".repeat(Math.max(0, snap.lives)) || "—";
  const comboLine =
    snap.comboMult > 1 ? `COMBO ×${snap.comboMult} (${snap.comboCount})` : `Best ×${snap.runMaxCombo}`;

  overlay.innerHTML = `
    <div class="pause-mission-control pause-cabinet arcade-cabinet arcade-cabinet--modal pause-shell">
      ${ARCADE_FRAME}
      <header class="pmc-header">
        <p class="cabinet-mini-status pause-status">
          <span class="arcade-status-dot"></span> MISSION CONTROL · PAUSED
        </p>
        <h2 class="pause-title" id="pause-title">MISSION CONTROL</h2>
        <div class="pmc-stats" aria-label="Current run stats">
          <span class="pmc-stat"><em>LV</em> ${snap.level}</span>
          <span class="pmc-stat"><em>SCORE</em> ${snap.score.toLocaleString()}</span>
          <span class="pmc-stat pmc-stat--lives"><em>LIVES</em> ${livesDisplay}</span>
        </div>
        <div class="screen-marquee pause-marquee pmc-marquee" aria-hidden="true">
          <span>— OPS HOLD — RESUMES AT YOUR COMMAND —</span>
        </div>
      </header>

      <div class="pmc-scroll pause-body">
        <section class="panel cabinet-panel pmc-section">
          <h3 class="panel-label">Run telemetry</h3>
          <div class="pmc-run-grid">
            <div class="pmc-run-stat"><span>Run tokens</span><strong>${snap.runTokensEarned}</strong></div>
            <div class="pmc-run-stat"><span>Pool</span><strong>${snap.runTokenPool}</strong></div>
            <div class="pmc-run-stat"><span>Combo</span><strong>${comboLine}</strong></div>
            <div class="pmc-run-stat"><span>Loadout</span><strong>${snap.shipLabel} · ${snap.gunLabel}</strong></div>
          </div>
        </section>

        <section class="panel cabinet-panel pmc-section">
          <h3 class="panel-label">Today's ops <span class="panel-label-sub">Resets ${countdown}</span></h3>
          ${dailyBundleDone ? '<p class="pmc-banner pmc-banner--done">Daily bundle complete — resets at midnight</p>' : ""}
          <ul class="pmc-daily-list">${dailyTasks.map((t) => renderDailyRow(t, dailyBundleDone)).join("")}</ul>
        </section>

        <section class="panel cabinet-panel pmc-section">
          <h3 class="panel-label">Active challenges</h3>
          <ul class="pmc-challenge-list">${activeChallenges.map(renderChallengeRow).join("")}</ul>
        </section>

        <section class="panel cabinet-panel pmc-section pmc-section--badges">
          <h3 class="panel-label">Badges &amp; achievements</h3>
          ${renderBadgeStrip(snap.badges, OG_CHALLENGES.length)}
        </section>

        <div class="pmc-secondary-actions">
          <button type="button" class="btn btn-secondary pmc-menu-btn" id="pause-main-menu">
            Main menu
          </button>
          <p class="pmc-menu-note">Abandon run — you lose continue state for this session.</p>
        </div>

        <div class="pmc-confirm hidden" id="pause-abandon-confirm" role="alertdialog" aria-labelledby="pause-abandon-title">
          <p class="pmc-confirm-title" id="pause-abandon-title">Abandon run?</p>
          <p class="pmc-confirm-copy">Returning to main menu ends this mission. Your saved continue slot will be cleared — you'll start fresh next launch.</p>
          <div class="pmc-confirm-actions">
            <button type="button" class="btn btn-secondary" id="pause-abandon-cancel">Keep playing</button>
            <button type="button" class="btn btn-danger" id="pause-abandon-ok">Abandon run</button>
          </div>
        </div>
      </div>

      <footer class="pause-footer cabinet-footer pmc-footer">
        <button type="button" class="btn btn-primary btn-deploy" id="pause-resume">
          <span class="btn-deploy-label">Resume</span>
          <span class="btn-deploy-sub">Space · P · continue mission</span>
        </button>
        <p class="pause-hint"><kbd>P</kbd> or <kbd>Esc</kbd> resume · pause button</p>
      </footer>
    </div>`;

  overlay.querySelector("#pause-resume")?.addEventListener("click", handlers.onResume);

  const menuBtn = overlay.querySelector<HTMLButtonElement>("#pause-main-menu");
  const confirmPanel = overlay.querySelector<HTMLElement>("#pause-abandon-confirm");
  const confirmOk = overlay.querySelector<HTMLButtonElement>("#pause-abandon-ok");
  const confirmCancel = overlay.querySelector<HTMLButtonElement>("#pause-abandon-cancel");

  menuBtn?.addEventListener("click", () => {
    confirmPanel?.classList.remove("hidden");
    confirmCancel?.focus();
  });

  confirmCancel?.addEventListener("click", () => {
    confirmPanel?.classList.add("hidden");
    menuBtn?.focus();
  });

  confirmOk?.addEventListener("click", handlers.onExitToMenu);
}
