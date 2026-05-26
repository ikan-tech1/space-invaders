import type { Difficulty, GameMode } from "../config";
import { OG_CHALLENGES } from "../progression/challenges";
import { EasterEggRegistry } from "../progression/easterEggs";
import { loadOgMeta } from "../progression/metaStore";
import type { LocalStorageRepo } from "../storage/LocalStorageRepo";
import type { Screen } from "./ScreenRouter";

export interface MenuScreenDeps {
  repo: LocalStorageRepo;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onPlay: (continueRun: boolean, mode: GameMode) => void;
  onNavigate: (screen: "settings" | "highScores" | "howToPlay" | "challenges" | "armory") => void;
}

const DIFF_LABELS: Record<Difficulty, string> = {
  casual: "Casual",
  classic: "Classic",
  insane: "Insane",
};

export class MenuScreen implements Screen {
  id = "menu" as const;
  private eggs = new EasterEggRegistry();

  constructor(private deps: MenuScreenDeps) {}

  mount(root: HTMLElement): void {
    const saved = this.deps.repo.getSavedRun();
    const diff = this.deps.difficulty;
    const meta = loadOgMeta();
    const badgeCount = meta.badges.length;
    const challengeTotal = OG_CHALLENGES.length;

    root.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-starfield" aria-hidden="true">
          <span class="menu-starfield-layer menu-starfield-far"></span>
          <span class="menu-starfield-layer menu-starfield-near"></span>
        </div>

        <header class="arcade-hero menu-cabinet-wrap">
          <div class="arcade-cabinet">
            <div class="arcade-frame" aria-hidden="true">
              <span class="arcade-corner arcade-corner-tl"></span>
              <span class="arcade-corner arcade-corner-tr"></span>
              <span class="arcade-corner arcade-corner-bl"></span>
              <span class="arcade-corner arcade-corner-br"></span>
              <span class="arcade-scanlines"></span>
              <span class="arcade-glow"></span>
            </div>
            <div class="arcade-status" aria-hidden="true">
              <span class="arcade-status-dot"></span>
              <span>ARCADE ONLINE</span>
            </div>
            <div class="arcade-invaders arcade-invaders--march" aria-hidden="true">
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
            <div class="arcade-marquee" aria-hidden="true">
              <span>1 CREDIT · INSERT COIN</span>
            </div>
            <div class="arcade-stats">
              <span class="arcade-stat">
                <span class="arcade-stat-label">Stars</span>
                <span class="arcade-stat-value arcade-stat-gold">★ ${meta.stars}</span>
              </span>
              <span class="arcade-stat-divider" aria-hidden="true"></span>
              <span class="arcade-stat">
                <span class="arcade-stat-label">Badges</span>
                <span class="arcade-stat-value">${badgeCount}/${challengeTotal}</span>
              </span>
              ${
                meta.campaignCleared
                  ? `<span class="arcade-stat-divider" aria-hidden="true"></span>
                     <span class="arcade-stat">
                       <span class="arcade-stat-label">Status</span>
                       <span class="arcade-stat-value arcade-stat-cyan">CLEARED</span>
                     </span>`
                  : ""
              }
            </div>
          </div>
          <div class="menu-cabinet-base" aria-hidden="true">
            <div class="menu-coin-slot">
              <span class="menu-coin-slot-dot"></span>
              <span>INSERT COIN TO PLAY</span>
            </div>
            <div class="menu-cabinet-legs">
              <span class="menu-cabinet-leg"></span>
              <span class="menu-cabinet-leg"></span>
            </div>
          </div>
        </header>

        <section class="menu-deploy" aria-label="Play modes">
          <button type="button" class="btn btn-primary btn-deploy" data-action="campaign">
            <span class="btn-deploy-label">Campaign</span>
            <span class="btn-deploy-sub">12 levels · bosses every 3</span>
          </button>
          ${
            saved || meta.endlessUnlocked
              ? `<div class="menu-secondary-actions">
                  ${
                    saved
                      ? `<button type="button" class="btn btn-resume" data-action="continue">
                          <span class="btn-deploy-label">Continue</span>
                          <span class="btn-deploy-sub">Level ${saved.wave} · ${saved.score.toLocaleString()} pts</span>
                        </button>`
                      : ""
                  }
                  ${
                    meta.endlessUnlocked
                      ? `<button type="button" class="btn btn-endless" data-action="endless">
                          <span class="btn-deploy-label">Endless</span>
                          <span class="btn-deploy-sub">Survival run</span>
                        </button>`
                      : ""
                  }
                </div>`
              : ""
          }
        </section>

        <section class="panel cabinet-panel menu-difficulty">
          <h2 class="panel-label">Difficulty</h2>
          <div class="difficulty-segments" role="radiogroup" aria-label="Difficulty">
            ${(["casual", "classic", "insane"] as Difficulty[])
              .map(
                (d) => `
              <label class="difficulty-segment ${d === diff ? "selected" : ""}" data-diff="${d}">
                <input type="radio" name="diff" value="${d}" ${d === diff ? "checked" : ""} />
                <span class="difficulty-segment-label">${DIFF_LABELS[d]}</span>
              </label>`
              )
              .join("")}
          </div>
        </section>

        <nav class="menu-nav-grid" aria-label="Arcade menu">
          <button type="button" class="nav-tile" data-action="armory">
            <span class="nav-tile-icon">⚔</span>
            <span class="nav-tile-label">Armory</span>
            <span class="nav-tile-meta">${meta.stars} ★</span>
          </button>
          <button type="button" class="nav-tile" data-action="challenges">
            <span class="nav-tile-icon">◎</span>
            <span class="nav-tile-label">Challenges</span>
            <span class="nav-tile-meta">${badgeCount}/${challengeTotal}</span>
          </button>
          <button type="button" class="nav-tile" data-action="highscores">
            <span class="nav-tile-icon">★</span>
            <span class="nav-tile-label">High Scores</span>
          </button>
          <button type="button" class="nav-tile" data-action="settings">
            <span class="nav-tile-icon">⚙</span>
            <span class="nav-tile-label">Settings</span>
          </button>
          <button type="button" class="nav-tile nav-tile-wide" data-action="howto">
            <span class="nav-tile-icon">▤</span>
            <span class="nav-tile-label">How to Play</span>
          </button>
        </nav>

        <footer class="menu-footer">
          <a class="link-neon" href="https://neon-ikan-tech1.vercel.app" target="_blank" rel="noopener">
            Play NEON Siege 2050 →
          </a>
          <span class="menu-version">v1.0 · OG Edition</span>
        </footer>
      </div>
    `;

    root.querySelector('[data-action="campaign"]')?.addEventListener("click", () => {
      this.deps.repo.clearSavedRun();
      this.deps.onPlay(false, "campaign");
    });
    root.querySelector('[data-action="endless"]')?.addEventListener("click", () => {
      this.deps.repo.clearSavedRun();
      this.deps.onPlay(false, "endless");
    });
    root.querySelector('[data-action="continue"]')?.addEventListener("click", () => {
      this.deps.onPlay(true, "campaign");
    });
    root.querySelector('[data-action="armory"]')?.addEventListener("click", () => {
      this.deps.onNavigate("armory");
    });
    root.querySelector('[data-action="challenges"]')?.addEventListener("click", () => {
      this.deps.onNavigate("challenges");
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
        root.querySelectorAll(".difficulty-segment").forEach((o) => o.classList.remove("selected"));
        el.classList.add("selected");
        (el.querySelector("input") as HTMLInputElement).checked = true;
      });
    });

    const onKey = (e: KeyboardEvent) => {
      if (this.eggs.onMenuKey(e.key)) {
        localStorage.setItem("og_konami_pending", "1");
      }
    };
    window.addEventListener("keydown", onKey);
    (root as HTMLElement & { _konamiCleanup?: () => void })._konamiCleanup = () =>
      window.removeEventListener("keydown", onKey);
  }

  unmount(): void {
    const el = document.getElementById("screen-root") as HTMLElement & {
      _konamiCleanup?: () => void;
    };
    el?._konamiCleanup?.();
  }
}
