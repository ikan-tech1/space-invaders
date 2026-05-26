import { OG_CHALLENGES, WEEKLY_CHALLENGES, type ChallengeScope } from "./challenges";
import { getDailyDateKey, getDailyTasks, loadDailyCompletedDate } from "./dailyChallenges";
import { getWeeklyWeekKey, loadOgMeta, saveOgMeta } from "./metaStore";

export type CelebrationKind = "campaign" | "weekly" | "daily";

export interface PendingCelebration {
  key: string;
  kind: CelebrationKind;
  title: string;
  rewardLabel: string;
  rowSelector?: string;
}

export interface ChallengeSeenState {
  badges: string[];
  weeklyClaimed: string[];
  dailyDate: string;
  dailyDone: boolean;
}

const CELEBRATED_KEY = "og_celebrated_completions";

function celebrationKey(kind: CelebrationKind, id: string): string {
  return `${kind}:${id}`;
}

export function loadCelebratedCompletions(): Set<string> {
  try {
    const raw = localStorage.getItem(CELEBRATED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

export function markCelebrated(keys: string[]): void {
  const set = loadCelebratedCompletions();
  keys.forEach((k) => set.add(k));
  localStorage.setItem(CELEBRATED_KEY, JSON.stringify([...set].slice(-48)));
}

export function getCurrentSeenState(): ChallengeSeenState {
  const meta = loadOgMeta();
  const today = getDailyDateKey();
  return {
    badges: [...meta.badges],
    weeklyClaimed: [...meta.weeklyClaimed],
    dailyDate: today,
    dailyDone: loadDailyCompletedDate() === today,
  };
}

export function loadLastSeenChallengeState(): ChallengeSeenState | null {
  const meta = loadOgMeta();
  return meta.lastSeenChallengeState ?? null;
}

export function saveLastSeenChallengeState(state: ChallengeSeenState): void {
  const meta = loadOgMeta();
  meta.lastSeenChallengeState = state;
  saveOgMeta(meta);
}

function rewardForCampaign(id: string): string {
  const def = OG_CHALLENGES.find((c) => c.id === id);
  if (!def) return "+★";
  const parts: string[] = [];
  if (def.starReward) parts.push(`+${def.starReward} ★`);
  if (def.tokenReward) parts.push(`+${def.tokenReward} ◎`);
  return parts.join(" · ") || def.reward;
}

function rewardForWeekly(id: string): string {
  const def = WEEKLY_CHALLENGES.find((c) => c.id === id);
  if (!def) return "+◎";
  const parts: string[] = [];
  if (def.tokenReward) parts.push(`+${def.tokenReward} ◎`);
  if (def.starReward) parts.push(`+${def.starReward} ★`);
  return parts.join(" · ") || def.reward;
}

/** Completions since last visit that have not been celebrated yet. */
export function getPendingCelebrations(
  view: "daily" | "challenges"
): PendingCelebration[] {
  const meta = loadOgMeta();
  const celebrated = loadCelebratedCompletions();
  const lastSeen = loadLastSeenChallengeState();
  const today = getDailyDateKey();
  const dailyDone = loadDailyCompletedDate() === today;
  const pending: PendingCelebration[] = [];

  if (view === "challenges") {
    for (const id of meta.badges) {
      const key = celebrationKey("campaign", id);
      if (celebrated.has(key)) continue;
      if (lastSeen?.badges.includes(id)) continue;
      const def = OG_CHALLENGES.find((c) => c.id === id);
      pending.push({
        key,
        kind: "campaign",
        title: def?.title ?? id,
        rewardLabel: rewardForCampaign(id),
        rowSelector: `[data-challenge-id="${id}"]`,
      });
    }

    const weekKey = getWeeklyWeekKey();
    for (const id of meta.weeklyClaimed) {
      if (meta.weeklyWeekKey !== weekKey) continue;
      const key = celebrationKey("weekly", id);
      if (celebrated.has(key)) continue;
      if (lastSeen?.weeklyClaimed.includes(id)) continue;
      const def = WEEKLY_CHALLENGES.find((c) => c.id === id);
      pending.push({
        key,
        kind: "weekly",
        title: def?.title ?? id,
        rewardLabel: rewardForWeekly(id),
        rowSelector: `[data-challenge-id="${id}"]`,
      });
    }
  }

  if (view === "daily" && dailyDone) {
    const tasks = getDailyTasks();
    for (const task of tasks) {
      const key = celebrationKey("daily", `${today}:${task.id}`);
      if (celebrated.has(key)) continue;
      if (lastSeen?.dailyDate === today && lastSeen.dailyDone) continue;
      pending.push({
        key,
        kind: "daily",
        title: task.title,
        rewardLabel: `+${task.tokenReward} ◎`,
        rowSelector: `[data-daily-id="${task.id}"]`,
      });
    }
  }

  return pending;
}

export function scopeLabel(scope: ChallengeScope): string {
  if (scope === "campaign") return "Campaign";
  return "Weekly";
}
