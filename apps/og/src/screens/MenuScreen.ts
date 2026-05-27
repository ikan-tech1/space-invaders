import type { Difficulty, GameMode } from "../config";
import { OG_CHALLENGES } from "../progression/challenges";
import {
  getDailyDateKey,
  loadDailyCompletedDate,
} from "../progression/dailyChallenges";
import { EasterEggRegistry } from "../progression/easterEggs";
import { loadOgMeta, saveOgMeta, unlockCosmeticColor } from "../progression/metaStore";
import { queuePendingToast } from "../progression/pendingToasts";
import { getCosmeticsForHull, resolveShipPaint } from "../progression/shipCosmetics";
import { mountMenuHeroPreview } from "../ui/armoryGunPreview";
import { getEndlessTier } from "../progression/endlessProgression";
import { drainPendingToasts } from "../progression/pendingToasts";
import { SHIP_PROFILES } from "../progression/ships";
import type { LocalStorageRepo } from "../storage/LocalStorageRepo";
import type { Screen } from "./ScreenRouter";

export interface MenuScreenDeps {
  repo: LocalStorageRepo;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onPlay: (continueRun: boolean, mode: GameMode) => void;
  onNavigate: (screen: "settings" | "highScores" | "howToPlay" | "challenges" | "dailyOps" | "gameModes" | "armory") => void;
  onCampaign: () => void;
}

const DIFF_LABELS: Record<Difficulty, string> = {
  casual: "Casual",
  classic: "Classic",
  insane: "Insane",
};

const DIFF_DESCS: Record<Difficulty, string> = {
  casual: "Relaxed pace · forgiving fire",
  classic: "Original arcade balance",
  insane: "Fast waves · lethal shots",
};

function renderMenuNavTile(opts: {
  action: string;
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  extraClass?: string;
  shortLabel?: string;
}): string {
  const badge = opts.badge
    ? `<span class="arcade-panel-btn-badge">${opts.badge}</span>`
    : "";
  const label = opts.shortLabel ?? opts.title;
  return `
    <button type="button" class="arcade-panel-btn menu-nav-tile ${opts.extraClass ?? ""}" data-action="${opts.action}">
      <span class="arcade-panel-btn-face">
        <span class="arcade-panel-btn-icon" aria-hidden="true">${opts.icon}</span>
        <span class="arcade-panel-btn-label">${label}</span>
        <span class="arcade-panel-btn-sub">${opts.subtitle}</span>
      </span>
      ${badge}
    </button>`;
}

export class MenuScreen implements Screen {
  id = "menu" as const;
  private eggs = new EasterEggRegistry();
  private heroPreviewCleanup: (() => void) | null = null;

  constructor(private deps: MenuScreenDeps) {}

  mount(root: HTMLElement): void {
    const saved = this.deps.repo.getSavedRun();
    const diff = this.deps.difficulty;
    const meta = loadOgMeta();
    const badgeCount = meta.badges.length;
    const challengeTotal = OG_CHALLENGES.length;
    const dailyDone = loadDailyCompletedDate() === getDailyDateKey();
    const endlessTier = getEndlessTier(meta.endlessBestDepth ?? 0);
    const endlessSub =
      meta.endlessBestDepth > 0
        ? `${endlessTier.name} · best L${meta.endlessBestDepth}`
        : "Survival run · rank up by depth";
    const shipProfile = SHIP_PROFILES[meta.equippedShip];
    const shipCosmetics = getCosmeticsForHull(meta.shipCosmetics, meta.equippedShip);
    const shipCallsign = shipCosmetics.callsign;
    const shipCaption = shipCallsign
      ? `${shipProfile.name} · ${shipCallsign}`
      : shipProfile.name;

    root.innerHTML = `
      <div class="screen menu-screen">
        <div class="arcade-machine">
          <div class="arcade-machine-bezel">
            <span class="cabinet-bolt cabinet-bolt-tl" aria-hidden="true"></span>
            <span class="cabinet-bolt cabinet-bolt-tr" aria-hidden="true"></span>
            <span class="cabinet-bolt cabinet-bolt-bl" aria-hidden="true"></span>
            <span class="cabinet-bolt cabinet-bolt-br" aria-hidden="true"></span>
            <div class="cabinet-side-art cabinet-side-art--left" aria-hidden="true">
              <span class="cabinet-side-art-glyph">▲</span>
              <span class="cabinet-side-art-glyph">◆</span>
              <span class="cabinet-side-art-glyph">▼</span>
            </div>
            <div class="cabinet-side-art cabinet-side-art--right" aria-hidden="true">
              <span class="cabinet-side-art-glyph">★</span>
              <span class="cabinet-side-art-glyph">◎</span>
              <span class="cabinet-side-art-glyph">☠</span>
            </div>

            <header class="cabinet-marquee" aria-label="Arcade marquee">
              <div class="cabinet-marquee-top">
                <div class="cabinet-coin-insert" aria-label="Coin slot">
                  <span class="cabinet-coin-slot-rect" aria-hidden="true"></span>
                  <span class="cabinet-coin-label">1 CREDIT</span>
                </div>
                <div class="arcade-status cabinet-marquee-status">
                  <span class="arcade-status-dot"></span>
                  <span>ONLINE</span>
                </div>
                <div class="menu-stat-ring menu-stat-ring--marquee menu-stat-ring--intro" aria-label="Challenge progress ${badgeCount} of ${challengeTotal}">
                  <svg viewBox="0 0 64 64" class="menu-stat-ring-svg" aria-hidden="true">
                    <circle class="menu-stat-ring-track" cx="32" cy="32" r="26" fill="none" stroke-width="4"/>
                    <circle class="menu-stat-ring-fill" cx="32" cy="32" r="26" fill="none" stroke-width="4"
                      stroke-dasharray="${(2 * Math.PI * 26).toFixed(1)}"
                      stroke-dashoffset="${(2 * Math.PI * 26 * (1 - badgeCount / Math.max(challengeTotal, 1))).toFixed(1)}"
                      style="--ring-offset: ${(2 * Math.PI * 26 * (1 - badgeCount / Math.max(challengeTotal, 1))).toFixed(1)}"/>
                  </svg>
                  <div class="menu-stat-ring-center">
                    <span class="menu-stat-ring-value">${Math.round((badgeCount / Math.max(challengeTotal, 1)) * 100)}%</span>
                    <span class="menu-stat-ring-label">Badges</span>
                  </div>
                </div>
              </div>
              <div class="arcade-invaders arcade-invaders--march" data-invader-row aria-hidden="true" title="???">
                <svg viewBox="0 0 88 12" width="88" height="12" focusable="false">
                  <g fill="currentColor">
                    <rect x="2" y="2" width="2" height="2"/><rect x="6" y="0" width="2" height="2"/>
                    <rect x="8" y="0" width="2" height="2"/><rect x="10" y="2" width="2" height="2"/>
                    <rect x="0" y="4" width="14" height="2"/><rect x="2" y="6" width="2" height="2"/>
                    <rect x="10" y="6" width="2" height="2"/><rect x="4" y="8" width="2" height="2"/>
                    <rect x="8" y="8" width="2" height="2"/>
                  </g>
                  <g fill="currentColor" transform="translate(22 0)">
                    <rect x="2" y="0" width="2" height="2"/><rect x="6" y="0" width="2" height="2"/>
                    <rect x="10" y="0" width="2" height="2"/><rect x="0" y="2" width="2" height="2"/>
                    <rect x="12" y="2" width="2" height="2"/><rect x="2" y="4" width="10" height="2"/>
                    <rect x="0" y="6" width="4" height="2"/><rect x="10" y="6" width="4" height="2"/>
                    <rect x="2" y="8" width="2" height="2"/><rect x="10" y="8" width="2" height="2"/>
                  </g>
                  <g fill="currentColor" transform="translate(44 0)">
                    <rect x="4" y="0" width="6" height="2"/><rect x="2" y="2" width="2" height="2"/>
                    <rect x="10" y="2" width="2" height="2"/><rect x="0" y="4" width="14" height="2"/>
                    <rect x="2" y="6" width="2" height="2"/><rect x="10" y="6" width="2" height="2"/>
                    <rect x="4" y="8" width="2" height="2"/><rect x="8" y="8" width="2" height="2"/>
                  </g>
                  <g fill="currentColor" transform="translate(66 0)">
                    <rect x="2" y="0" width="10" height="2"/><rect x="0" y="2" width="2" height="2"/>
                    <rect x="12" y="2" width="2" height="2"/><rect x="2" y="4" width="2" height="2"/>
                    <rect x="6" y="4" width="2" height="2"/><rect x="10" y="4" width="2" height="2"/>
                    <rect x="0" y="6" width="14" height="2"/><rect x="2" y="8" width="2" height="2"/>
                    <rect x="10" y="8" width="2" height="2"/>
                  </g>
                </svg>
              </div>
              <h1 class="arcade-title" id="menu-wordmark">
                <span class="arcade-title-og">OG</span>
                <span class="arcade-title-line">SPACE</span>
                <span class="arcade-title-line arcade-title-line--glow">INVADERS</span>
              </h1>
              <p class="arcade-tagline">Classic Arcade Edition</p>
              <div class="cabinet-marquee-ticker arcade-marquee menu-arcade-marquee" aria-hidden="true">
                <span>1 CREDIT · <em class="menu-marquee-insert">INSERT COIN</em> · TO PLAY</span>
              </div>
            </header>

            <div class="cabinet-crt-well">
              <div class="cabinet-crt-bezel">
                <div class="arcade-frame" aria-hidden="true">
                  <span class="arcade-corner arcade-corner-tl"></span>
                  <span class="arcade-corner arcade-corner-tr"></span>
                  <span class="arcade-corner arcade-corner-bl"></span>
                  <span class="arcade-corner arcade-corner-br"></span>
                  <span class="arcade-scanlines"></span>
                  <span class="arcade-glow"></span>
                </div>
                <div class="menu-hero-stage">
                  <button type="button" class="menu-hero-ship-btn" data-action="armory" aria-label="Open Armory to change ${shipProfile.name}">
                    <canvas class="menu-hero-ship" data-ship-hero width="140" height="84" aria-hidden="true"></canvas>
                    <span class="menu-hero-scanline" aria-hidden="true"></span>
                  </button>
                  <div class="menu-ship-caption">
                    <span class="menu-ship-name">${shipCaption}</span>
                    <span class="menu-ship-change">Change in Armory →</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="menu-stat-chips" aria-label="Player stats">
              <span class="menu-stat-chip">
                <span class="menu-stat-chip-label">Tokens</span>
                <span class="menu-stat-chip-value">◎ ${meta.tokens}</span>
              </span>
              <span class="menu-stat-chip">
                <span class="menu-stat-chip-label">Stars</span>
                <span class="menu-stat-chip-value menu-stat-chip-value--gold">★ ${meta.stars}</span>
              </span>
              <span class="menu-stat-chip menu-stat-chip--ship">
                <span class="menu-stat-chip-label">Ship</span>
                <span class="menu-stat-chip-value">${shipProfile.name}</span>
              </span>
              <span class="menu-stat-chip">
                <span class="menu-stat-chip-label">Badges</span>
                <span class="menu-stat-chip-value">${badgeCount}/${challengeTotal}</span>
              </span>
              ${
                meta.campaignCleared
                  ? `<span class="menu-stat-chip menu-stat-chip--highlight">
                       <span class="menu-stat-chip-label">Status</span>
                       <span class="menu-stat-chip-value">Cleared</span>
                     </span>`
                  : ""
              }
            </div>

            <div class="cabinet-control-panel">
              <p class="cabinet-panel-label">Deploy</p>
              <section class="cabinet-deploy-bank" aria-label="Play modes">
                <button type="button" class="arcade-push-btn arcade-push-btn--gold btn btn-primary btn-deploy" data-action="campaign">
                  <span class="arcade-push-btn-cap" aria-hidden="true"></span>
                  <span class="btn-deploy-icon" aria-hidden="true">▶</span>
                  <span class="btn-deploy-copy">
                    <span class="btn-deploy-label">Campaign</span>
                    <span class="btn-deploy-sub">12 levels · bosses every 3</span>
                  </span>
                </button>
                ${
                  saved || meta.endlessUnlocked
                    ? `<div class="cabinet-deploy-secondary">
                        ${
                          saved
                            ? `<button type="button" class="arcade-push-btn arcade-push-btn--pulse btn btn-resume btn-deploy" data-action="continue">
                                <span class="arcade-push-btn-cap" aria-hidden="true"></span>
                                <span class="btn-deploy-copy">
                                  <span class="btn-deploy-label">Continue</span>
                                  <span class="btn-deploy-sub">Level ${saved.wave} · ${saved.score.toLocaleString()} pts</span>
                                </span>
                              </button>`
                            : ""
                        }
                        ${
                          meta.endlessUnlocked
                            ? `<button type="button" class="arcade-push-btn arcade-push-btn--cyan btn btn-endless btn-deploy" data-action="endless">
                                <span class="arcade-push-btn-cap" aria-hidden="true"></span>
                                <span class="btn-deploy-copy">
                                  <span class="btn-deploy-label">Endless</span>
                                  <span class="btn-deploy-sub">${endlessSub}</span>
                                </span>
                              </button>`
                            : ""
                        }
                      </div>`
                    : ""
                }
              </section>

              <p class="cabinet-panel-label">Difficulty</p>
              <div class="cabinet-dip-bank difficulty-toggle-group" role="radiogroup" aria-label="Difficulty">
                ${(["casual", "classic", "insane"] as Difficulty[])
                  .map(
                    (d) => `
                  <label class="dip-switch difficulty-toggle ${d === diff ? "selected" : ""}" data-diff="${d}">
                    <input type="radio" name="diff" value="${d}" ${d === diff ? "checked" : ""} />
                    <span class="dip-switch-housing">
                      <span class="dip-switch-led" aria-hidden="true"></span>
                      <span class="dip-switch-toggle" aria-hidden="true"></span>
                    </span>
                    <span class="dip-switch-label">${DIFF_LABELS[d].slice(0, 3).toUpperCase()}</span>
                    <span class="dip-switch-desc">${DIFF_DESCS[d]}</span>
                  </label>`
                  )
                  .join("")}
              </div>

              <nav class="cabinet-nav-bank menu-nav-grid" aria-label="Arcade menu">
                ${renderMenuNavTile({
                  action: "daily",
                  icon: "☀",
                  title: "Daily Ops",
                  shortLabel: "Daily",
                  subtitle: dailyDone ? "Complete" : "Live ops",
                  badge: dailyDone ? "Done" : "Live",
                  extraClass: `menu-nav-tile--daily ${dailyDone ? "menu-nav-tile--daily-done" : ""}`,
                })}
                ${renderMenuNavTile({
                  action: "armory",
                  icon: "⊕",
                  title: "Armory",
                  shortLabel: "Armory",
                  subtitle: shipProfile.name,
                  extraClass: "menu-nav-tile--armory",
                })}
                ${renderMenuNavTile({
                  action: "challenges",
                  icon: "◎",
                  title: "Challenges",
                  shortLabel: "Chall.",
                  subtitle: "Trophies",
                  badge: `${badgeCount}/${challengeTotal}`,
                })}
                ${renderMenuNavTile({
                  action: "highscores",
                  icon: "★",
                  title: "High Scores",
                  shortLabel: "Scores",
                  subtitle: "Hall of fame",
                })}
                ${renderMenuNavTile({
                  action: "modes",
                  icon: "▦",
                  title: "Game Modes",
                  shortLabel: "Modes",
                  subtitle: "Alt rules",
                  badge: "Soon",
                  extraClass: "menu-nav-tile--modes",
                })}
                ${renderMenuNavTile({
                  action: "settings",
                  icon: "⚙",
                  title: "Settings",
                  shortLabel: "Set",
                  subtitle: "Audio · controls",
                })}
              </nav>

              <footer class="cabinet-placard">
                <a class="link-neon cabinet-placard-link" href="https://neon-ikan-tech1.vercel.app" target="_blank" rel="noopener">
                  Play NEON Siege 2050 →
                </a>
                <button type="button" class="cabinet-placard-howto" data-action="howto">How to Play</button>
                <span class="cabinet-placard-serial">OG EDITION · v1.0 · SERIAL № OG-1978</span>
              </footer>
            </div>
          </div>

          <div class="cabinet-base" aria-hidden="true">
            <div class="cabinet-base-rail"></div>
            <div class="cabinet-legs">
              <span class="cabinet-leg"></span>
              <span class="cabinet-leg"></span>
            </div>
          </div>
        </div>
      </div>
    `;

    root.querySelector('[data-action="campaign"]')?.addEventListener("click", () => {
      this.deps.onCampaign();
    });
    root.querySelector('[data-action="endless"]')?.addEventListener("click", () => {
      this.deps.repo.clearSavedRun();
      this.deps.onPlay(false, "endless");
    });
    root.querySelector('[data-action="continue"]')?.addEventListener("click", () => {
      this.deps.onPlay(true, "campaign");
    });
    root.querySelector('[data-action="daily"]')?.addEventListener("click", () => {
      this.deps.onNavigate("dailyOps");
    });
    root.querySelectorAll('[data-action="armory"]').forEach((el) => {
      el.addEventListener("click", () => {
        this.deps.onNavigate("armory");
      });
    });
    root.querySelector('[data-action="challenges"]')?.addEventListener("click", () => {
      this.deps.onNavigate("challenges");
    });
    root.querySelector('[data-action="modes"]')?.addEventListener("click", () => {
      this.deps.onNavigate("gameModes");
    });
    root.querySelector('[data-action="highscores"]')?.addEventListener("click", () => {
      this.deps.onNavigate("highScores");
    });
    root.querySelector('[data-action="settings"]')?.addEventListener("click", () => {
      this.deps.onNavigate("settings");
    });
    root.querySelector('[data-action="howto"]')?.addEventListener("click", () => {
      this.deps.onNavigate("howToPlay");
    });

    root.querySelectorAll("[data-diff]").forEach((el) => {
      el.addEventListener("click", () => {
        const d = (el as HTMLElement).dataset.diff as Difficulty;
        this.deps.onDifficultyChange(d);
        root.querySelectorAll(".dip-switch, .difficulty-toggle").forEach((o) => o.classList.remove("selected"));
        el.classList.add("selected");
        (el.querySelector("input") as HTMLInputElement).checked = true;
      });
    });

    let toastTimer: ReturnType<typeof setTimeout> | null = null;
    const showMenuToast = (text: string, achievement = false): void => {
      let el = root.querySelector(".menu-secret-toast") as HTMLElement | null;
      if (!el) {
        el = document.createElement("p");
        el.className = "menu-secret-toast";
        root.querySelector(".menu-screen")?.appendChild(el);
      }
      el.textContent = text;
      el.classList.toggle("menu-secret-toast--achievement", achievement);
      el.classList.add("menu-secret-toast--visible");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        el?.classList.remove("menu-secret-toast--visible");
        el?.classList.remove("menu-secret-toast--achievement");
      }, achievement ? 4200 : 3200);
    };

    const pending = drainPendingToasts();
    if (pending.length) {
      pending.forEach((msg: string, i: number) => {
        window.setTimeout(() => showMenuToast(msg, true), 400 + i * 900);
      });
    }

    const menuPaint = resolveShipPaint(
      shipCosmetics,
      shipProfile.color,
      shipProfile.accent
    );
    this.heroPreviewCleanup = mountMenuHeroPreview(root, shipProfile.spriteKey, menuPaint.primary);

    let invaderClicks = 0;
    let invaderClickTimer: ReturnType<typeof setTimeout> | null = null;
    root.querySelector("[data-invader-row]")?.addEventListener("click", () => {
      invaderClicks++;
      if (invaderClickTimer) clearTimeout(invaderClickTimer);
      invaderClickTimer = setTimeout(() => {
        invaderClicks = 0;
      }, 2500);
      if (invaderClicks >= 5) {
        invaderClicks = 0;
        const reward = this.eggs.onInvaderRowClick();
        if (reward) applyMenuEggReward(reward, showMenuToast);
      }
    });

    const applyMenuEggReward = (
      reward: NonNullable<ReturnType<EasterEggRegistry["onMenuKey"]>>,
      toast: (text: string, achievement?: boolean) => void
    ): void => {
      const m = loadOgMeta();
      if (reward.tokens) m.tokens += reward.tokens;
      if (reward.stars) m.stars += reward.stars;
      if (reward.badge && !m.badges.includes(reward.badge)) m.badges.push(reward.badge);
      if (reward.unlockColor) unlockCosmeticColor(m, reward.unlockColor);
      if (reward.fleetTrialSec) {
        localStorage.setItem("og_fleet_trial_pending", String(reward.fleetTrialSec));
      }
      saveOgMeta(m);
      toast(reward.message, reward.achievement);
      if (reward.achievement) queuePendingToast(reward.message);
    };

    const onKey = (e: KeyboardEvent) => {
      const reward = this.eggs.onMenuKey(e.key);
      if (!reward) return;
      if (reward.message.startsWith("KONAMI")) {
        localStorage.setItem("og_konami_pending", "1");
      }
      applyMenuEggReward(reward, showMenuToast);
    };
    window.addEventListener("keydown", onKey);
    (root as HTMLElement & { _konamiCleanup?: () => void })._konamiCleanup = () =>
      window.removeEventListener("keydown", onKey);

    requestAnimationFrame(() => {
      root.querySelector(".menu-stat-ring--intro")?.classList.remove("menu-stat-ring--intro");
      root.querySelector(".menu-stat-ring")?.classList.add("menu-stat-ring--ready");
    });
  }

  unmount(): void {
    this.heroPreviewCleanup?.();
    this.heroPreviewCleanup = null;
    const el = document.getElementById("screen-root") as HTMLElement & {
      _konamiCleanup?: () => void;
    };
    el?._konamiCleanup?.();
  }
}
