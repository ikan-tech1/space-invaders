import type { LevelCompleteReport } from "../progression/levelComplete";
import { RUN_CONSUMABLES, type RunConsumableId } from "../progression/runShop";

export interface LevelCompleteModalOptions {
  onContinue: () => void;
  onPurchase?: (id: RunConsumableId) => boolean;
  purchasedIds?: RunConsumableId[];
}

export function showLevelCompleteModal(
  root: HTMLElement,
  report: LevelCompleteReport,
  options: LevelCompleteModalOptions | (() => void)
): void {
  const opts: LevelCompleteModalOptions =
    typeof options === "function" ? { onContinue: options } : options;
  const purchased = new Set(opts.purchasedIds ?? []);

  const render = (): void => {
    const challengeRows = report.levelChallenges
      .map(
        (c) => `
      <li class="lc-challenge ${c.passed ? "passed" : "failed"}">
        <span class="lc-challenge-icon">${c.passed ? "✓" : "○"}</span>
        <span class="lc-challenge-text">${c.label}</span>
        ${c.passed ? `<span class="lc-challenge-bonus">+${c.bonus}</span>` : ""}
      </li>`
      )
      .join("");

    const endlessNote =
      report.endlessTokenMult > 1
        ? `<div class="lc-score-row"><span>Endless multiplier</span><strong class="lc-endless-mult">×${report.endlessTokenMult.toFixed(1)}</strong></div>`
        : "";

    const supplyRows = RUN_CONSUMABLES.map((item) => {
      const count = [...purchased].filter((id) => id === item.id).length;
      const max = item.maxPerInterstitial ?? 99;
      const soldOut = count >= max;
      const canAfford = report.runTokenPool >= item.cost;
      return `
        <button type="button" class="supply-item ${soldOut ? "supply-item--sold" : ""}"
          data-supply="${item.id}" ${soldOut || !canAfford ? "disabled" : ""}>
          <span class="supply-item-name">${item.name}</span>
          <span class="supply-item-desc">${item.description}</span>
          <span class="supply-item-cost">${soldOut ? "Purchased" : `${item.cost} ◎ run`}</span>
        </button>`;
    }).join("");

    root.innerHTML = `
    <div class="level-complete-panel arcade-cabinet arcade-cabinet--modal">
      <div class="arcade-frame" aria-hidden="true">
        <span class="arcade-corner arcade-corner-tl"></span>
        <span class="arcade-corner arcade-corner-tr"></span>
        <span class="arcade-corner arcade-corner-bl"></span>
        <span class="arcade-corner arcade-corner-br"></span>
        <span class="arcade-scanlines"></span>
        <span class="arcade-glow"></span>
      </div>
      <div class="level-complete-header">
        <p class="cabinet-mini-status lc-status"><span class="arcade-status-dot"></span> LEVEL CLEAR</p>
        <h2 class="lc-title">${report.campaignCleared ? "Campaign Cleared" : "Level Clear"}</h2>
        <p class="lc-level">Level ${report.level} complete</p>
        <div class="lc-stars">${"★".repeat(report.stars)}${"☆".repeat(3 - report.stars)}</div>
      </div>
      <div class="level-complete-body">
        <div class="lc-scores">
          <div class="lc-score-row">
            <span>Level score</span>
            <strong class="lc-level-score">+${report.levelScore.toLocaleString()}</strong>
          </div>
          ${
            report.challengeBonus > 0
              ? `<div class="lc-score-row"><span>Challenge bonus</span><strong class="lc-bonus">+${report.challengeBonus.toLocaleString()}</strong></div>`
              : ""
          }
          <div class="lc-score-row lc-total">
            <span>Total score</span>
            <strong>${report.totalScore.toLocaleString()}</strong>
          </div>
          <div class="lc-score-row lc-token-row">
            <span>Tokens this level</span>
            <strong class="lc-tokens-earned">+${report.tokensEarnedThisLevel} ◎</strong>
          </div>
          ${endlessNote}
          <div class="lc-score-row">
            <span>Run pool <span class="lc-pool-hint">(supply depot)</span></span>
            <strong class="lc-run-pool" data-run-pool>◎ ${report.runTokenPool}</strong>
          </div>
          <div class="lc-score-row">
            <span>Wallet <span class="lc-pool-hint">(armory)</span></span>
            <strong class="lc-wallet" data-wallet>◎ ${report.walletTokens}</strong>
          </div>
          <div class="lc-score-row">
            <span>Lives remaining</span>
            <strong class="lc-lives">${"♥".repeat(Math.max(0, report.lives)) || "—"}</strong>
          </div>
        </div>
        <h3 class="lc-challenges-title">Level challenges</h3>
        <ul class="lc-challenge-list">${challengeRows}</ul>
        ${
          report.campaignCleared
            ? ""
            : `
        <h3 class="lc-supply-title">Supply depot <span class="lc-supply-hint">Spend run pool mid-campaign</span></h3>
        <div class="supply-depot">${supplyRows}</div>`
        }
        <div class="screen-marquee lc-marquee" aria-hidden="true">
          <span>${report.campaignCleared ? "ENDLESS UNLOCKED" : `NEXT: LEVEL ${report.nextLevel}`}</span>
        </div>
        <button type="button" class="btn btn-primary lc-continue btn-deploy">
          <span class="btn-deploy-label">Continue</span>
          <span class="btn-deploy-sub">${report.campaignCleared ? "Return to menu" : `Proceed to level ${report.nextLevel}`}</span>
        </button>
      </div>
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
  };

  render();
}
