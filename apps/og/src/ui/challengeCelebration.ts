import type { PendingCelebration } from "../progression/challengeState";
import {
  getCurrentSeenState,
  loadCelebratedCompletions,
  markCelebrated,
  saveLastSeenChallengeState,
} from "../progression/challengeState";

const CELEBRATION_GAP_MS = 720;

function spawnFloatReward(container: HTMLElement, label: string, kind: PendingCelebration["kind"]): void {
  const el = document.createElement("span");
  el.className = `challenge-float-reward challenge-float-reward--${kind}`;
  el.textContent = label;
  container.appendChild(el);
  window.setTimeout(() => el.remove(), 1400);
}

function animateRow(row: HTMLElement): void {
  row.classList.add("challenge-item--celebrating");
  const icon = row.querySelector(".challenge-item-icon");
  icon?.classList.add("challenge-icon-sweep");
  window.setTimeout(() => {
    row.classList.remove("challenge-item--celebrating");
    row.classList.add("challenge-item--done");
    icon?.classList.remove("challenge-icon-sweep");
  }, 900);
}

/** Run queued completion celebrations once per completion, then reveal next NEW item. */
export function runChallengeCelebrations(
  root: HTMLElement,
  pending: PendingCelebration[],
  nextHighlightSelector?: string
): void {
  if (!pending.length) {
    saveLastSeenChallengeState(getCurrentSeenState());
    return;
  }

  const celebrated = loadCelebratedCompletions();
  let index = 0;

  const finish = (): void => {
    markCelebrated([...celebrated]);
    saveLastSeenChallengeState(getCurrentSeenState());
    if (nextHighlightSelector) {
      const next = root.querySelector(nextHighlightSelector);
      next?.classList.add("challenge-item--new");
      window.setTimeout(() => next?.classList.remove("challenge-item--new"), 2400);
    }
  };

  const step = (): void => {
    if (index >= pending.length) {
      finish();
      return;
    }
    const item = pending[index]!;
    celebrated.add(item.key);

    const row = item.rowSelector ? root.querySelector<HTMLElement>(item.rowSelector) : null;
    if (row) {
      animateRow(row);
      spawnFloatReward(row, item.rewardLabel, item.kind);
    } else {
      const shell = root.querySelector(".sub-cabinet-scroll") ?? root;
      spawnFloatReward(shell as HTMLElement, `${item.title} ${item.rewardLabel}`, item.kind);
    }

    index += 1;
    window.setTimeout(step, CELEBRATION_GAP_MS);
  };

  window.setTimeout(step, 180);
}
