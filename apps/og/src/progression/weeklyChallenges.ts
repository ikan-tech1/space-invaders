import { WEEKLY_CHALLENGES } from "./challenges";
import { ensureWeeklyFresh, loadOgMeta, saveOgMeta } from "./metaStore";

export interface WeeklyRunDelta {
  kills: number;
  levelsCleared: number;
  bossesDefeated: number;
}

/** Increment weekly counters and auto-claim completed weekly challenges. */
export function applyWeeklyProgress(delta: WeeklyRunDelta): string[] {
  const meta = ensureWeeklyFresh(loadOgMeta());
  const toasts: string[] = [];

  meta.weeklyProgress.kills = (meta.weeklyProgress.kills ?? 0) + delta.kills;
  meta.weeklyProgress.levels = (meta.weeklyProgress.levels ?? 0) + delta.levelsCleared;
  meta.weeklyProgress.bosses = (meta.weeklyProgress.bosses ?? 0) + delta.bossesDefeated;

  const thresholds: Record<string, number> = {
    weekly_hunter: 75,
    weekly_push: 4,
    weekly_slayer: 2,
  };

  for (const def of WEEKLY_CHALLENGES) {
    if (meta.weeklyClaimed.includes(def.id)) continue;
    const progressKey =
      def.id === "weekly_hunter" ? "kills" : def.id === "weekly_push" ? "levels" : "bosses";
    const current = meta.weeklyProgress[progressKey] ?? 0;
    const need = thresholds[def.id] ?? 999;
    if (current < need) continue;

    meta.weeklyClaimed.push(def.id);
    if (def.tokenReward) meta.tokens += def.tokenReward;
    if (def.starReward) meta.stars += def.starReward;
    const parts: string[] = [`Weekly: ${def.title}`];
    if (def.tokenReward) parts.push(`+${def.tokenReward} ◎`);
    if (def.starReward) parts.push(`+${def.starReward} ★`);
    toasts.push(parts.join(" — "));
  }

  saveOgMeta(meta);
  return toasts;
}

export function getWeeklyProgressLabel(id: string): string {
  const meta = loadOgMeta();
  const thresholds: Record<string, { key: string; need: number }> = {
    weekly_hunter: { key: "kills", need: 75 },
    weekly_push: { key: "levels", need: 4 },
    weekly_slayer: { key: "bosses", need: 2 },
  };
  const t = thresholds[id];
  if (!t) return "";
  const current = meta.weeklyProgress[t.key] ?? 0;
  return `${current}/${t.need}`;
}
