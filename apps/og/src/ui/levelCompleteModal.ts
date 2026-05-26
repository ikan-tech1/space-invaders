import type { LevelCompleteReport } from "../progression/levelComplete";
import { RUN_CONSUMABLES, type RunConsumableId } from "../progression/runShop";
import { ENDLESS_CONSUMABLES, getEndlessConsumableTierLabel, type EndlessConsumableId } from "../progression/endlessShop";
import { isEndlessItemUnlocked } from "../progression/endlessProgression";

export interface LevelCompleteModalOptions {
  onContinue: () => void;
  onPurchase?: (id: RunConsumableId) => boolean;
  onEndlessPurchase?: (id: EndlessConsumableId) => boolean;
  purchasedIds?: RunConsumableId[];
  endlessPurchasedIds?: EndlessConsumableId[];
}

const ARCADE_FRAME = `
  <div class="arcade-frame" aria-hidden="true">
    <span class="arcade-corner arcade-corner-tl"></span>
    <span class="arcade-corner arcade-corner-tr"></span>
    <span class="arcade-corner arcade-corner-bl"></span>
    <span class="arcade-corner arcade-corner-br"></span>
    <span class="arcade-scanlines"></span>
    <span class="arcade-glow"></span>
  </div>`;

function starHero(stars: number): string {
  return Array.from({ length: 3 }, (_, i) => {
    const filled = i < stars;
    return `<span class="lc-star ${filled ? "lc-star--filled" : "lc-star--empty"}" aria-hidden="true">${filled ? "★" : "☆"}</span>`;
  }).join("");
}

function challengeIcon(passed: boolean): string {
  return passed
    ? `<span class="lc-challenge-icon lc-challenge-icon--pass" aria-hidden="true">✓</span>`
    : `<span class="lc-challenge-icon lc-challenge-icon--fail" aria-hidden="true">✗</span>`;
}

export function showLevelCompleteModal(
  root: HTMLElement,
  report: LevelCompleteReport,
  options: LevelCompleteModalOptions | (() => void)
): void {
  const opts: LevelCompleteModalOptions =
    typeof options === "function" ? { onContinue: options } : options;
  const purchased = new Set(opts.purchasedIds ?? []);
  const endlessPurchased = new Set(opts.endlessPurchasedIds ?? []);

  const render = (): void => {
    const statusLabel = report.campaignCleared ? "CAMPAIGN CLEAR" : "LEVEL CLEAR";

    const challengeRows = report.levelChallenges
      .map(
        (c) => `
      <li class="lc-challenge ${c.passed ? "lc-challenge--pass" : "lc-challenge--fail"}">
        ${challengeIcon(c.passed)}
        <span class="lc-challenge-text">${c.label}</span>
        ${c.passed ? `<span class="lc-challenge-bonus">+${c.bonus}</span>` : `<span class="lc-challenge-status">—</span>`}
      </li>`
      )
      .join("");

    const supplyChips = RUN_CONSUMABLES.map((item) => {
      const count = [...purchased].filter((id) => id === item.id).length;
      const max = item.maxPerInterstitial ?? 99;
      const soldOut = count >= max;
      const canAfford = report.runTokenPool >= item.cost;
      return `
        <button type="button" class="lc-chip ${soldOut ? "lc-chip--sold" : ""} ${!soldOut && canAfford ? "lc-chip--affordable" : ""}"
          data-supply="${item.id}" ${soldOut || !canAfford ? "disabled" : ""}
          title="${item.description}">
          <span class="lc-chip-name">${item.name}</span>
          <span class="lc-chip-cost">${soldOut ? "✓" : `${item.cost} ◎`}</span>
        </button>`;
    }).join("");

    const endlessChips =
      report.gameMode === "endless"
        ? ENDLESS_CONSUMABLES.map((item) => {
            const count = [...endlessPurchased].filter((id) => id === item.id).length;
            const max = item.maxPerInterstitial ?? 99;
            const soldOut = count >= max;
            const unlockDepth = report.endlessDepth ?? 0;
            const locked = !isEndlessItemUnlocked(item.id, unlockDepth);
            const canAfford = report.runTokenPool >= item.cost;
            const tierLabel = getEndlessConsumableTierLabel(item.id);
            return `
        <button type="button" class="lc-chip lc-chip--endless ${soldOut ? "lc-chip--sold" : ""} ${locked ? "lc-chip--locked" : ""} ${!soldOut && !locked && canAfford ? "lc-chip--affordable" : ""}"
          data-endless="${item.id}" ${soldOut || !canAfford || locked ? "disabled" : ""}
          title="${locked && tierLabel ? `Unlock at ${tierLabel}` : item.description}">
          <span class="lc-chip-name">${item.name}</span>
          <span class="lc-chip-cost">${locked ? tierLabel ?? "🔒" : soldOut ? "✓" : `${item.cost} ◎`}</span>
        </button>`;
          }).join("")
        : "";

    const depotSection =
      report.campaignCleared
        ? ""
        : `
        <details class="lc-depot" open>
          <summary class="lc-depot-toggle">
            <span class="lc-depot-toggle-label">Supply Depot</span>
            <span class="lc-depot-toggle-pool" data-run-pool>◎ ${report.runTokenPool} run</span>
          </summary>
          <p class="lc-depot-hint">Spend run pool before continuing — scroll for more</p>
          <div class="lc-chip-track" role="list">${supplyChips}</div>
          ${
            report.gameMode === "endless"
              ? `
          <p class="lc-depot-subtitle">Endless modifiers</p>
          <div class="lc-chip-track lc-chip-track--endless" role="list">${endlessChips}</div>`
              : ""
          }
        </details>`;

    const endlessMultTile =
      report.endlessTokenMult > 1
        ? `
        <div class="lc-stat-tile lc-stat-tile--accent">
          <span class="lc-stat-icon" aria-hidden="true">×</span>
          <span class="lc-stat-label">Endless mult</span>
          <strong class="lc-stat-value lc-stat-value--gold">×${report.endlessTokenMult.toFixed(1)}</strong>
        </div>`
        : "";

    const endlessRankTile =
      report.gameMode === "endless" && report.endlessTier
        ? `
        <div class="lc-stat-tile lc-stat-tile--endless-rank">
          <span class="lc-stat-icon" aria-hidden="true">⬡</span>
          <span class="lc-stat-label">Endless rank</span>
          <strong class="lc-stat-value lc-stat-value--cyan">${report.endlessTier}</strong>
          ${
            report.endlessNextTierDepth
              ? `<span class="lc-stat-hint">Next tier L${report.endlessNextTierDepth}</span>`
              : `<span class="lc-stat-hint">Max rank</span>`
          }
        </div>`
        : "";

    root.innerHTML = `
    <div class="level-complete-panel arcade-cabinet arcade-cabinet--modal lc-shell">
      ${ARCADE_FRAME}

      <header class="lc-hero">
        <p class="lc-hero-status"><span class="arcade-status-dot"></span> ${statusLabel}</p>
        <div class="lc-stars-hero" aria-label="${report.stars} of 3 stars">${starHero(report.stars)}</div>
        <p class="lc-hero-sub">Level ${report.level} complete</p>
      </header>

      <div class="lc-scroll">
        ${
          report.narrativeBeat
            ? `
        <section class="lc-narrative-beat">
          <p class="lc-narrative-tag">${report.narrativeBeat.tag}</p>
          <h3 class="lc-narrative-headline">${report.narrativeBeat.headline}</h3>
          <p class="lc-narrative-body">${report.narrativeBeat.body}</p>
        </section>`
            : ""
        }

        <div class="lc-stat-grid">
          <div class="lc-stat-tile lc-stat-tile--hero">
            <span class="lc-stat-icon" aria-hidden="true">◆</span>
            <span class="lc-stat-label">Total score</span>
            <strong class="lc-stat-value">${report.totalScore.toLocaleString()}</strong>
          </div>
          <div class="lc-stat-tile">
            <span class="lc-stat-icon" aria-hidden="true">+</span>
            <span class="lc-stat-label">Level score</span>
            <strong class="lc-stat-value lc-stat-value--cyan">+${report.levelScore.toLocaleString()}</strong>
          </div>
          ${
            report.challengeBonus > 0
              ? `
          <div class="lc-stat-tile">
            <span class="lc-stat-icon" aria-hidden="true">★</span>
            <span class="lc-stat-label">Challenge bonus</span>
            <strong class="lc-stat-value lc-stat-value--gold">+${report.challengeBonus.toLocaleString()}</strong>
          </div>`
              : ""
          }
          <div class="lc-stat-tile">
            <span class="lc-stat-icon" aria-hidden="true">◎</span>
            <span class="lc-stat-label">Tokens earned</span>
            <strong class="lc-stat-value lc-stat-value--token">+${report.tokensEarnedThisLevel}</strong>
          </div>
          ${endlessMultTile}
          ${endlessRankTile}
          <div class="lc-stat-tile lc-stat-tile--run-pool">
            <span class="lc-stat-icon" aria-hidden="true">⬡</span>
            <span class="lc-stat-label">Run pool</span>
            <strong class="lc-stat-value lc-stat-value--cyan" data-run-pool-display>◎ ${report.runTokenPool}</strong>
            <span class="lc-stat-hint">Supply depot</span>
          </div>
          <div class="lc-stat-tile lc-stat-tile--wallet">
            <span class="lc-stat-icon" aria-hidden="true">◈</span>
            <span class="lc-stat-label">Wallet</span>
            <strong class="lc-stat-value lc-stat-value--token" data-wallet>◎ ${report.walletTokens}</strong>
            <span class="lc-stat-hint">Armory bank</span>
          </div>
          <div class="lc-stat-tile lc-stat-tile--lives">
            <span class="lc-stat-icon" aria-hidden="true">♥</span>
            <span class="lc-stat-label">Lives</span>
            <strong class="lc-stat-value lc-stat-value--danger">${"♥".repeat(Math.max(0, report.lives)) || "—"}</strong>
          </div>
        </div>

        <section class="lc-section">
          <h3 class="lc-section-title">Level challenges</h3>
          <ul class="lc-challenge-list">${challengeRows}</ul>
        </section>

        ${depotSection}
      </div>

      <footer class="lc-footer">
        <div class="screen-marquee lc-marquee" aria-hidden="true">
          <span>${report.campaignCleared ? "ENDLESS UNLOCKED" : `NEXT: LEVEL ${report.nextLevel}`}</span>
        </div>
        <button type="button" class="btn btn-primary lc-continue btn-deploy">
          <span class="btn-deploy-label">Continue</span>
          <span class="btn-deploy-sub">${report.campaignCleared ? "Return to menu" : `Proceed to level ${report.nextLevel}`}</span>
        </button>
      </footer>
    </div>
  `;

    root.querySelector(".lc-continue")?.addEventListener("click", () => opts.onContinue(), {
      once: true,
    });

    root.querySelectorAll<HTMLButtonElement>("[data-supply]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.supply as RunConsumableId;
        if (!opts.onPurchase?.(id)) return;
        purchased.add(id);
        render();
      });
    });

    root.querySelectorAll<HTMLButtonElement>("[data-endless]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.endless as EndlessConsumableId;
        if (!opts.onEndlessPurchase?.(id)) return;
        endlessPurchased.add(id);
        render();
      });
    });
  };

  render();
}
