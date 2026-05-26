import type { LevelCompleteReport } from "../progression/levelComplete";

export function showLevelCompleteModal(
  root: HTMLElement,
  report: LevelCompleteReport,
  onContinue: () => void
): void {
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

  root.innerHTML = `
    <div class="level-complete-panel deploy-card">
      <div class="deploy-card-header">
        <div class="deploy-card-rail" aria-hidden="true">
          <span class="status-dot"></span>
          <span>${report.campaignCleared ? "CAMPAIGN COMPLETE" : "SECTOR SECURED"}</span>
        </div>
        <h2 class="lc-title">${report.campaignCleared ? "CAMPAIGN CLEARED" : "SECTOR CLEAR"}</h2>
        <p class="lc-level">Level ${report.level} secured</p>
        <div class="lc-stars">${"★".repeat(report.stars)}${"☆".repeat(3 - report.stars)}</div>
      </div>
      <div class="lc-scores">
        <div class="lc-score-row">
          <span>Sector score</span>
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
        <div class="lc-score-row">
          <span>Lives remaining</span>
          <strong class="lc-lives">${"♥".repeat(Math.max(0, report.lives)) || "—"}</strong>
        </div>
      </div>
      <h3 class="lc-challenges-title">Level challenges</h3>
      <ul class="lc-challenge-list">${challengeRows}</ul>
      <p class="lc-next">${report.campaignCleared ? "Endless deployment unlocked!" : `Next: Level ${report.nextLevel}`}</p>
      <button type="button" class="btn btn-primary lc-continue btn-deploy">
        <span class="btn-deploy-label">Deploy</span>
        <span class="btn-deploy-sub">${report.campaignCleared ? "Return to hangar" : `Proceed to level ${report.nextLevel}`}</span>
      </button>
    </div>
  `;

  root.querySelector(".lc-continue")?.addEventListener("click", () => onContinue(), { once: true });
}
