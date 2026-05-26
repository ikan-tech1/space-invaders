import { OG_PLAY_URL, WEAPON_NAMES, type Difficulty, type WeaponTier } from "../config";
import { CAMPAIGN_SECTORS } from "../narrative/campaignScript";
import { NEON_CHALLENGES } from "../progression/challenges";
import {
  HANGAR_CODES,
  isValidCodePrefix,
  lookupHangarCode,
  normalizeHangarInput,
  TRAIL_DISPLAY,
  type AccessReward,
} from "../progression/hangarCodes";
import {
  loadNeonMeta,
  saveNeonMeta,
  type HangarUpgrade,
  type NeonModule,
} from "../progression/metaStore";
import type { LocalStorageRepo } from "../storage/LocalStorageRepo";
import type { Screen } from "./ScreenRouter";

export interface HangarDeps {
  repo: LocalStorageRepo;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onPlay: (cont: boolean, mode: import("../config").GameMode) => void;
  onNav: (
    s: "settings" | "records" | "armory" | "howToPlay" | "challenges" | "modules" | "codex"
  ) => void;
}

const DIFF_LABELS: Record<Difficulty, string> = {
  casual: "Casual",
  classic: "Classic",
  insane: "Insane",
};

function renderTrailBadges(trails: AccessReward[]): string {
  if (trails.length === 0) {
    return `
      <div class="hangar-codes-empty" aria-label="No cosmetics unlocked yet">
        <span class="hangar-codes-empty-icon" aria-hidden="true">◈</span>
        <p class="hangar-codes-empty-text">No cosmetics yet — enter a code in step 2</p>
      </div>`;
  }
  return trails
    .map((t) => {
      const d = TRAIL_DISPLAY[t];
      return `<span class="code-badge code-badge-${d.cssClass}">
        <span class="code-badge-icon" aria-hidden="true">${d.icon}</span>
        <span class="code-badge-label">${d.shortLabel}</span>
      </span>`;
    })
    .join("");
}

function renderCodeClue(
  code: (typeof HANGAR_CODES)[number],
  meta: ReturnType<typeof loadNeonMeta>
): string {
  const trail = TRAIL_DISPLAY[code.reward];
  const redeemed = meta.redeemedAccessKeys.includes(code.id);
  const sectorGate =
    code.hintSector === 0 || meta.clearedSectors.includes(code.hintSector ?? 0);

  if (redeemed) {
    return `<li class="code-clue code-clue-unlocked">
      <span class="code-clue-icon" aria-hidden="true">✓</span>
      <span class="code-clue-body">
        <strong>${trail.shortLabel}</strong>
        <span class="code-clue-meta">Unlocked</span>
      </span>
    </li>`;
  }

  if (!sectorGate) {
    const sector = code.hintSector ?? 0;
    return `<li class="code-clue code-clue-locked">
      <span class="code-clue-icon" aria-hidden="true">▣</span>
      <span class="code-clue-body">
        <strong>${trail.shortLabel}</strong>
        <span class="code-clue-meta">Clear Sector ${sector} to reveal hint</span>
      </span>
    </li>`;
  }

  let hint = code.clue;
  if (code.hintSector === 0 && !meta.briefingVisited && code.briefingClue) {
    hint = code.briefingClue;
  } else if (code.hintSector === 0 && meta.briefingVisited) {
    hint = "Found in Briefing — tagline says 2050 → NEON2050";
  }

  return `<li class="code-clue code-clue-hint">
    <span class="code-clue-icon" aria-hidden="true">◇</span>
    <span class="code-clue-body">
      <strong>${trail.shortLabel}</strong>
      <span class="code-clue-meta">${hint}</span>
    </span>
  </li>`;
}

function renderHangarCodesCard(meta: ReturnType<typeof loadNeonMeta>): string {
  const clues = HANGAR_CODES.map((c) => renderCodeClue(c, meta)).join("");
  const badges = renderTrailBadges(meta.unlockedTrails);

  return `
    <section class="panel hangar-codes-card hangar-access-panel" aria-label="Hangar codes">
      <div class="hangar-codes-frame">
        <span class="hangar-bracket hangar-bracket-tl" aria-hidden="true"></span>
        <span class="hangar-bracket hangar-bracket-tr" aria-hidden="true"></span>
        <span class="hangar-bracket hangar-bracket-bl" aria-hidden="true"></span>
        <span class="hangar-bracket hangar-bracket-br" aria-hidden="true"></span>

        <header class="hangar-codes-header">
          <h2 class="panel-label hangar-codes-title">Hangar Codes</h2>
          <p class="hangar-codes-subtitle">Type a code below to unlock cosmetics</p>
        </header>

        <div class="hangar-codes-step hangar-codes-step-unlocks">
          <span class="hangar-codes-step-num" aria-hidden="true">1</span>
          <div class="hangar-codes-step-body">
            <span class="hangar-codes-step-label">Your unlocks</span>
            <div class="hangar-codes-badges" role="list">${badges}</div>
          </div>
        </div>

        <div class="hangar-codes-connector" aria-hidden="true">
          <span class="hangar-codes-connector-line"></span>
          <span class="hangar-codes-connector-arrow">↓</span>
        </div>

        <div class="hangar-codes-step hangar-codes-step-terminal">
          <span class="hangar-codes-step-num" aria-hidden="true">2</span>
          <div class="hangar-codes-step-body">
            <label class="hangar-codes-input-label" for="hangar-code-input">Enter code</label>
            <div class="hangar-codes-input-wrap">
              <input
                id="hangar-code-input"
                type="text"
                class="hangar-code terminal-input hangar-codes-input"
                placeholder="NEON2050"
                maxlength="8"
                data-code
                autocomplete="off"
                spellcheck="false"
                aria-describedby="hangar-code-format hangar-code-feedback"
              />
            </div>
            <p id="hangar-code-format" class="hangar-codes-format">8 characters · e.g. NEON2050</p>
            <p id="hangar-code-feedback" class="terminal-feedback hangar-codes-feedback" role="status" aria-live="polite"></p>
          </div>
        </div>

        <div class="hangar-codes-clues">
          <h3 class="hangar-codes-clues-label">Code hints</h3>
          <ul class="hangar-codes-clue-list" aria-label="Discoverable code hints">${clues}</ul>
        </div>
      </div>
    </section>`;
}

function redeemAccessKey(
  value: string,
  meta: ReturnType<typeof loadNeonMeta>
): { kind: "success"; label: string } | { kind: "owned"; label: string } | { kind: "invalid" } | null {
  const code = lookupHangarCode(value);
  if (!code) return value.length >= 8 && !isValidCodePrefix(value) ? { kind: "invalid" } : null;
  if (meta.redeemedAccessKeys.includes(code.id)) {
    return { kind: "owned", label: `${TRAIL_DISPLAY[code.reward].shortLabel} — already unlocked` };
  }
  meta.redeemedAccessKeys.push(code.id);
  if (!meta.unlockedTrails.includes(code.reward)) meta.unlockedTrails.push(code.reward);
  saveNeonMeta(meta);
  try {
    localStorage.removeItem("neon_cyan_trail");
  } catch {
    /* ignore */
  }
  return { kind: "success", label: `✓ ${code.unlockLabel}` };
}

export class HangarScreen implements Screen {
  id = "hangar" as const;

  constructor(private deps: HangarDeps) {}

  mount(root: HTMLElement): void {
    const saved = this.deps.repo.getSavedRun();
    const diff = this.deps.difficulty;
    const meta = loadNeonMeta();

    root.innerHTML = `
      <div class="screen hangar-screen">
        <header class="hangar-hero">
          <div class="hangar-logo" aria-labelledby="hangar-wordmark">
            <div class="hangar-logo-frame" aria-hidden="true">
              <span class="hangar-bracket hangar-bracket-tl"></span>
              <span class="hangar-bracket hangar-bracket-tr"></span>
              <span class="hangar-bracket hangar-bracket-bl"></span>
              <span class="hangar-bracket hangar-bracket-br"></span>
              <span class="hangar-logo-scanlines"></span>
              <span class="hangar-logo-grid"></span>
            </div>
            <div class="logo-status" aria-hidden="true">
              <span class="logo-status-dot"></span>
              <span class="logo-status-text">HANGAR BAY 7 · SYS ONLINE</span>
            </div>
            <h1 class="hangar-logo-wordmark" id="hangar-wordmark">
              <span class="logo-line logo-line-neon" aria-hidden="true">NEON</span>
              <span class="logo-line logo-line-neon">NEON</span>
              <span class="logo-line logo-line-siege" aria-hidden="true">SIEGE</span>
              <span class="logo-line logo-line-siege">SIEGE</span>
            </h1>
            <div class="hangar-logo-rail">
              <span class="hangar-tagline">Space Invaders 2050</span>
              <span class="hangar-rail-divider" aria-hidden="true"></span>
              <span class="hangar-stars">
                <span class="hangar-stars-label">CMD</span>
                <span class="hangar-stars-value">★ ${meta.stars}</span>
              </span>
            </div>
          </div>
        </header>

        <section class="hangar-deploy" aria-label="Deploy options">
          <button type="button" class="btn btn-primary btn-deploy" data-campaign>
            <span class="btn-deploy-label">Campaign</span>
            <span class="btn-deploy-sub">12 sectors · story mode</span>
          </button>
          ${
            saved || meta.endlessUnlocked
              ? `<div class="hangar-secondary-actions">
                  ${
                    saved
                      ? `<button type="button" class="btn btn-resume" data-cont>
                          <span class="btn-deploy-label">Resume</span>
                          <span class="btn-deploy-sub">Level ${saved.wave}</span>
                        </button>`
                      : ""
                  }
                  ${
                    meta.endlessUnlocked
                      ? `<button type="button" class="btn btn-endless" data-endless>
                          <span class="btn-deploy-label">Endless</span>
                          <span class="btn-deploy-sub">Survival run</span>
                        </button>`
                      : ""
                  }
                </div>`
              : ""
          }
        </section>

        <section class="panel hangar-threat">
          <h2 class="panel-label">Threat Level</h2>
          <div class="threat-segments" role="radiogroup" aria-label="Threat level">
            ${(["casual", "classic", "insane"] as Difficulty[])
              .map(
                (d) => `
              <label class="threat-segment ${d === diff ? "selected" : ""}" data-diff="${d}">
                <input type="radio" name="diff" value="${d}" ${d === diff ? "checked" : ""} />
                <span class="threat-segment-label">${DIFF_LABELS[d]}</span>
              </label>`
              )
              .join("")}
          </div>
        </section>

        ${renderHangarCodesCard(meta)}

        <nav class="hangar-nav-grid" aria-label="Hangar systems">
          <button type="button" class="nav-tile" data-modules>
            <span class="nav-tile-icon">◈</span>
            <span class="nav-tile-label">Modules</span>
          </button>
          <button type="button" class="nav-tile" data-challenges>
            <span class="nav-tile-icon">◎</span>
            <span class="nav-tile-label">Challenges</span>
          </button>
          <button type="button" class="nav-tile" data-armory>
            <span class="nav-tile-icon">▸</span>
            <span class="nav-tile-label">Weapon Intel</span>
          </button>
          <button type="button" class="nav-tile" data-codex>
            <span class="nav-tile-icon">▣</span>
            <span class="nav-tile-label">Sector Intel</span>
          </button>
          <button type="button" class="nav-tile" data-records>
            <span class="nav-tile-icon">★</span>
            <span class="nav-tile-label">Records</span>
          </button>
          <button type="button" class="nav-tile" data-settings>
            <span class="nav-tile-icon">⚙</span>
            <span class="nav-tile-label">Settings</span>
          </button>
          <button type="button" class="nav-tile nav-tile-wide" data-how>
            <span class="nav-tile-icon">▤</span>
            <span class="nav-tile-label">Briefing</span>
          </button>
        </nav>

        <footer class="hangar-footer">
          <a
            class="link-og"
            href="${OG_PLAY_URL}"
            target="_blank"
            rel="noopener"
            aria-label="Play original Space Invaders classic edition, opens in new tab"
          >
            <span class="link-og-chip">
              <span class="link-og-bracket link-og-bracket-tl" aria-hidden="true"></span>
              <span class="link-og-bracket link-og-bracket-tr" aria-hidden="true"></span>
              <span class="link-og-bracket link-og-bracket-bl" aria-hidden="true"></span>
              <span class="link-og-bracket link-og-bracket-br" aria-hidden="true"></span>
              <span class="link-og-badge">Classic Edition</span>
              <span class="link-og-body">
                <span class="link-og-title">OG Space Invaders</span>
                <span class="link-og-external" aria-hidden="true">↗</span>
              </span>
            </span>
          </a>
          <span class="hangar-version">v1.0 · 2050 Command Deck</span>
        </footer>
      </div>
    `;
    root.querySelector("[data-campaign]")?.addEventListener("click", () => {
      this.deps.repo.clearSavedRun();
      this.deps.onPlay(false, "campaign");
    });
    root.querySelector("[data-endless]")?.addEventListener("click", () => {
      this.deps.repo.clearSavedRun();
      this.deps.onPlay(false, "endless");
    });
    root.querySelector("[data-cont]")?.addEventListener("click", () => this.deps.onPlay(true, "campaign"));
    root.querySelector("[data-modules]")?.addEventListener("click", () => this.deps.onNav("modules"));
    root.querySelector("[data-challenges]")?.addEventListener("click", () => this.deps.onNav("challenges"));
    root.querySelector("[data-armory]")?.addEventListener("click", () => this.deps.onNav("armory"));
    root.querySelector("[data-codex]")?.addEventListener("click", () => this.deps.onNav("codex"));
    root.querySelector("[data-records]")?.addEventListener("click", () => this.deps.onNav("records"));
    root.querySelector("[data-settings]")?.addEventListener("click", () => this.deps.onNav("settings"));
    root.querySelector("[data-how]")?.addEventListener("click", () => this.deps.onNav("howToPlay"));

    let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

    const getCodeInput = () => root.querySelector("[data-code]") as HTMLInputElement | null;
    const getFeedback = () => root.querySelector("#hangar-code-feedback") as HTMLElement | null;

    const showFeedback = (text: string, tone: "success" | "error" | "neutral") => {
      const feedback = getFeedback();
      if (!feedback) return;
      feedback.textContent = text;
      feedback.className = `terminal-feedback hangar-codes-feedback terminal-feedback-${tone}`;
      if (feedbackTimer) clearTimeout(feedbackTimer);
      if (text) {
        feedbackTimer = setTimeout(() => {
          const el = getFeedback();
          if (!el) return;
          el.textContent = "";
          el.className = "terminal-feedback hangar-codes-feedback";
        }, 3200);
      }
    };

    const refreshCodesCard = (animate = false) => {
      const panel = root.querySelector(".hangar-codes-card");
      if (!panel) return;
      const wrap = document.createElement("div");
      wrap.innerHTML = renderHangarCodesCard(loadNeonMeta());
      const next = wrap.firstElementChild as HTMLElement;
      panel.replaceWith(next);
      if (animate) {
        next.classList.add("hangar-codes-success");
        window.setTimeout(() => next.classList.remove("hangar-codes-success"), 1400);
      }
    };

    const tryRedeem = () => {
      const codeInput = getCodeInput();
      if (!codeInput) return;
      const value = normalizeHangarInput(codeInput.value);
      if (codeInput.value !== value) codeInput.value = value;
      if (!value) return;

      const result = redeemAccessKey(value, loadNeonMeta());
      if (!result) return;

      if (result.kind === "success") {
        refreshCodesCard(true);
        showFeedback(result.label, "success");
        getCodeInput()?.focus();
      } else if (result.kind === "owned") {
        showFeedback(result.label, "neutral");
      } else {
        showFeedback("Unknown code — check hints below", "error");
      }
    };

    root.addEventListener("input", (e) => {
      const target = e.target as HTMLElement;
      if (!target.matches("[data-code]")) return;
      const codeInput = target as HTMLInputElement;
      const value = normalizeHangarInput(codeInput.value);
      if (codeInput.value !== value) codeInput.value = value;
      const feedback = getFeedback();
      if (feedback?.classList.contains("terminal-feedback-error")) {
        feedback.textContent = "";
        feedback.className = "terminal-feedback hangar-codes-feedback";
      }
      if (lookupHangarCode(value)) tryRedeem();
    });
    root.addEventListener("keydown", (e) => {
      const target = e.target as HTMLElement;
      if (!target.matches("[data-code]") || e.key !== "Enter") return;
      e.preventDefault();
      tryRedeem();
    });
    root.addEventListener(
      "blur",
      (e) => {
        const target = e.target as HTMLElement;
        if (!target.matches("[data-code]")) return;
        const value = normalizeHangarInput((target as HTMLInputElement).value);
        if (value.length >= 8 && !lookupHangarCode(value) && !isValidCodePrefix(value)) {
          showFeedback("Unknown code — check hints below", "error");
        }
      },
      true
    );
    root.querySelectorAll("[data-diff]").forEach((el) => {
      el.addEventListener("click", () => {
        const d = (el as HTMLElement).dataset.diff as Difficulty;
        this.deps.onDifficultyChange(d);
        root.querySelectorAll(".threat-segment").forEach((o) => o.classList.remove("selected"));
        el.classList.add("selected");
        const input = el.querySelector("input") as HTMLInputElement;
        if (input) input.checked = true;
      });
    });
  }
  unmount(): void {}
}

const PICKUP_INTEL: { name: string; desc: string }[] = [
  { name: "Overdrive", desc: "Zero fire cooldown for 8 seconds." },
  { name: "Prism Core", desc: "Hits split into twin pulse bolts." },
  { name: "Ion Lance", desc: "Temporary piercing ion bolts (unlock: flawless L3)." },
  { name: "Nova Shell", desc: "Heavy AoE slug — pickup only." },
  { name: "Gauss Burst", desc: "Rapid Kinetic Gauss slugs for 6s (unlock: marksman)." },
  { name: "Beam Overcharge", desc: "Beam laser regardless of tier (unlock: no overheat)." },
  { name: "Clone Wing", desc: "Triplicate fire for 5s (unlock: 6× combo)." },
  { name: "Deploy Bunker", desc: "Spawns a mid-field shield block." },
  { name: "Temporal Slow", desc: "Slows enemy march for 3 seconds." },
];

const SUB_HEADER_FRAME = `
  <div class="sub-header-frame" aria-hidden="true">
    <span class="hangar-bracket hangar-bracket-tl"></span>
    <span class="hangar-bracket hangar-bracket-tr"></span>
    <span class="hangar-bracket hangar-bracket-bl"></span>
    <span class="hangar-bracket hangar-bracket-br"></span>
  </div>`;

export function createArmoryScreen(onBack: () => void): Screen {
  return {
    id: "armory",
    mount(root) {
      const tierCards = ([1, 2, 3, 4, 5] as WeaponTier[])
        .map(
          (t) => `
        <article class="armory-card armory-card--tier">
          <div class="armory-card-visual" aria-hidden="true">
            <div class="weapon-silhouette weapon-silhouette--t${t}"></div>
          </div>
          <div class="armory-card-content">
            <span class="armory-tier">Tier ${t}</span>
            <strong class="armory-name">${WEAPON_NAMES[t]}</strong>
            <p class="armory-desc">${armoryDesc(t)}</p>
          </div>
        </article>`
        )
        .join("");
      const pickupCards = PICKUP_INTEL.map(
        (p) => `
        <article class="armory-card pickup-card">
          <div class="armory-card-content">
            <strong class="armory-name">${p.name}</strong>
            <p class="armory-desc">${p.desc}</p>
          </div>
        </article>`
      ).join("");
      root.innerHTML = `
        <div class="screen sub-screen">
          <header class="sub-header sub-header--framed">
            ${SUB_HEADER_FRAME}
            <h1 class="screen-title">Weapon Intel</h1>
            <p class="screen-subtitle">Armament database</p>
          </header>
          <div class="sub-screen-body">
            <section class="panel">
              <h2 class="panel-label">Tier Progression</h2>
              <div class="armory-grid">${tierCards}</div>
            </section>
            <section class="panel">
              <h2 class="panel-label">Pickup Cores</h2>
              <div class="armory-grid">${pickupCards}</div>
            </section>
          </div>
          <footer class="sub-screen-footer">
            <button type="button" class="btn btn-primary" data-back>Hangar</button>
          </footer>
        </div>`;
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

export function createCodexScreen(onBack: () => void): Screen {
  return {
    id: "codex",
    mount(root) {
      const meta = loadNeonMeta();
      const rows = CAMPAIGN_SECTORS.map((s) => {
        const unlocked = meta.clearedSectors.includes(s.level);
        const keyHint = HANGAR_CODES.find((c) => c.hintSector === s.level);
        const accessLine =
          unlocked && keyHint
            ? `<p class="codex-access-hint">Hangar code hint: ${keyHint.clue}</p>`
            : "";
        return `
        <article class="codex-card ${unlocked ? "" : "locked"}">
          <div class="codex-card-header">
            <p class="codex-sector-label">${unlocked ? `Sector ${s.level}` : "Classified"}</p>
            ${unlocked ? "" : '<span class="codex-lock-badge">Locked</span>'}
          </div>
          <strong class="codex-title">${unlocked ? s.title : "???"}</strong>
          <p class="codex-lore">${unlocked ? s.lore : "Clear this sector to decrypt intel."}</p>
          ${accessLine}
        </article>`;
      }).join("");
      root.innerHTML = `
        <div class="screen sub-screen">
          <header class="sub-header sub-header--framed">
            ${SUB_HEADER_FRAME}
            <h1 class="screen-title">Sector Intel</h1>
            <p class="screen-subtitle">${meta.clearedSectors.length} / ${CAMPAIGN_SECTORS.length} decrypted</p>
            <div class="sub-header-rail">Progress <strong>${meta.clearedSectors.length}/${CAMPAIGN_SECTORS.length}</strong></div>
          </header>
          <div class="sub-screen-body">
            <div class="codex-list">${rows}</div>
          </div>
          <footer class="sub-screen-footer">
            <button type="button" class="btn btn-primary" data-back>Hangar</button>
          </footer>
        </div>`;
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

export function createModulesScreen(onBack: () => void): Screen {
  return {
    id: "modules",
    mount(root) {
      const meta = loadNeonMeta();
      const all: { id: NeonModule; label: string; desc: string }[] = [
        { id: "overcharger", label: "Overcharger", desc: "-20% heat cap" },
        { id: "stabilizer", label: "Stabilizer", desc: "Beam width +2, Gauss pierce +2" },
        { id: "salvager", label: "Salvager", desc: "Nanite 2× repair" },
      ];
      const upgrades: { id: HangarUpgrade; label: string; cost: number }[] = [
        { id: "xpBoost", label: "+10% XP from kills", cost: 4 },
        { id: "aegisStart", label: "Aegis 50% at deploy", cost: 5 },
        { id: "chronoPlus", label: "Chrono +1s", cost: 3 },
      ];
      const modRows = all
        .map((m) => {
          const unlocked = meta.modules.includes(m.id);
          const active = meta.activeModules.includes(m.id);
          return `<label class="module-row ${!unlocked ? "locked" : ""}">
            <input type="checkbox" data-mod="${m.id}" ${!unlocked ? "disabled" : ""} ${active ? "checked" : ""} />
            <span class="module-info"><strong>${m.label}</strong><span class="module-desc">${m.desc}${!unlocked ? " · Locked" : ""}</span></span>
          </label>`;
        })
        .join("");
      const upRows = upgrades
        .map((u) => {
          const owned = meta.hangarUpgrades.includes(u.id);
          return `<button type="button" class="btn btn-upgrade" data-up="${u.id}" ${owned ? "disabled" : ""}>
            <span>${u.label}</span>
            <span class="btn-upgrade-cost">${owned ? "Owned" : `${u.cost} ★`}</span>
          </button>`;
        })
        .join("");
      root.innerHTML = `
        <div class="screen sub-screen">
          <header class="sub-header sub-header--framed">
            ${SUB_HEADER_FRAME}
            <h1 class="screen-title">Hangar Modules</h1>
            <p class="screen-subtitle">Loadout configuration</p>
            <div class="sub-header-rail">Stars <strong>${meta.stars}</strong> available</div>
          </header>
          <div class="sub-screen-body">
            <section class="panel">
              <h2 class="panel-label">Active Modules</h2>
              <div class="module-list">${modRows}</div>
            </section>
            <section class="panel">
              <h2 class="panel-label">Upgrades</h2>
              <div class="upgrade-list">${upRows}</div>
            </section>
          </div>
          <footer class="sub-screen-footer">
            <button type="button" class="btn btn-primary" data-back>Hangar</button>
          </footer>
        </div>`;
      root.querySelectorAll("[data-mod]").forEach((inp) => {
        inp.addEventListener("change", () => {
          const id = (inp as HTMLInputElement).dataset.mod as NeonModule;
          const m = loadNeonMeta();
          if (!(inp as HTMLInputElement).checked) {
            m.activeModules = m.activeModules.filter((x) => x !== id);
          } else if (m.modules.includes(id) && m.activeModules.length < 2) {
            m.activeModules.push(id);
          } else {
            (inp as HTMLInputElement).checked = false;
          }
          saveNeonMeta(m);
        });
      });
      root.querySelectorAll("[data-up]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = (btn as HTMLElement).dataset.up as HangarUpgrade;
          const m = loadNeonMeta();
          const cost = upgrades.find((u) => u.id === id)!.cost;
          if (m.hangarUpgrades.includes(id) || m.stars < cost) return;
          m.stars -= cost;
          m.hangarUpgrades.push(id);
          saveNeonMeta(m);
          createModulesScreen(onBack).mount(root);
        });
      });
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

export function createChallengesScreen(onBack: () => void): Screen {
  return {
    id: "challenges",
    mount(root) {
      const meta = loadNeonMeta();
      const rows = NEON_CHALLENGES.map(
        (c) => {
          const done = meta.badges.includes(c.id);
          return `
        <li class="challenge-card ${done ? "done" : ""}">
          <div class="challenge-card-header">
            <strong class="challenge-title">${c.title}</strong>
            ${done ? '<span class="challenge-badge">Complete</span>' : ""}
          </div>
          <p class="challenge-desc">${c.description}</p>
          <div class="challenge-reward-row">
            <span class="challenge-reward-label">Reward</span>
            <span class="challenge-reward">${c.reward}</span>
          </div>
        </li>`;
        }
      ).join("");
      root.innerHTML = `
        <div class="screen sub-screen">
          <header class="sub-header sub-header--framed">
            ${SUB_HEADER_FRAME}
            <h1 class="screen-title">Challenges</h1>
            <p class="screen-subtitle">Meta objectives</p>
            <div class="sub-header-rail">Cleared <strong>${meta.badges.length} / ${NEON_CHALLENGES.length}</strong></div>
          </header>
          <div class="sub-screen-body">
            <ul class="challenge-list">${rows}</ul>
          </div>
          <footer class="sub-screen-footer">
            <button type="button" class="btn btn-primary" data-back>Hangar</button>
          </footer>
        </div>`;
      root.querySelector("[data-back]")?.addEventListener("click", onBack);
    },
    unmount() {},
  };
}

function armoryDesc(t: WeaponTier): string {
  const d: Record<WeaponTier, string> = {
    1: "Rapid pulse bolts — reliable entry weapon.",
    2: "Plasma scatter — five-way close burst.",
    3: "Kinetic Gauss — tap-fire heavy slug with shockwave impact and pierce.",
    4: "Beam laser — hold to fire, heat builds while active.",
    5: "Singularity — gravity shell, maximum devastation.",
  };
  return d[t];
}
