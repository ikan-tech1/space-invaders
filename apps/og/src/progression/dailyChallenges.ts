export interface DailyChallengeDef {
  id: string;
  title: string;
  description: string;
  tokenReward: number;
  /** Evaluate from run stats at end of run or on level clear. */
  check: (stats: DailyRunStats) => boolean;
}

export interface DailyRunStats {
  killsThisRun: number;
  runTokensEarned: number;
  maxCombo: number;
  bossDefeated: boolean;
  flawlessLevel: boolean;
  levelsCleared: number;
}

const DAILY_POOL: DailyChallengeDef[] = [
  {
    id: "daily_kills_30",
    title: "Alien Hunter",
    description: "Destroy 30 aliens in one run",
    tokenReward: 15,
    check: (s) => s.killsThisRun >= 30,
  },
  {
    id: "daily_tokens_20",
    title: "Token Runner",
    description: "Earn 20 run tokens in one run",
    tokenReward: 12,
    check: (s) => s.runTokensEarned >= 20,
  },
  {
    id: "daily_combo_6",
    title: "Combo King",
    description: "Reach 6× combo multiplier in one run",
    tokenReward: 10,
    check: (s) => s.maxCombo >= 6,
  },
  {
    id: "daily_boss",
    title: "Boss Slayer",
    description: "Defeat a mini or big boss in one run",
    tokenReward: 18,
    check: (s) => s.bossDefeated,
  },
  {
    id: "daily_flawless",
    title: "Untouchable",
    description: "Clear any level without taking damage",
    tokenReward: 14,
    check: (s) => s.flawlessLevel,
  },
  {
    id: "daily_levels_3",
    title: "Sector Push",
    description: "Clear 3 levels in one run",
    tokenReward: 20,
    check: (s) => s.levelsCleared >= 3,
  },
  {
    id: "daily_kills_15",
    title: "Skirmish",
    description: "Destroy 15 aliens in one run",
    tokenReward: 8,
    check: (s) => s.killsThisRun >= 15,
  },
  {
    id: "daily_combo_4",
    title: "Chain Starter",
    description: "Reach 4× combo multiplier in one run",
    tokenReward: 6,
    check: (s) => s.maxCombo >= 4,
  },
];

function dateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Primary daily task (legacy single challenge). */
export function getDailyChallenge(forDate = new Date()): DailyChallengeDef {
  return getDailyTasks(forDate)[0]!;
}

/** Today's 1–3 daily ops tasks (deterministic per local date). */
export function getDailyTasks(forDate = new Date(), count = 3): DailyChallengeDef[] {
  const key = dateKey(forDate);
  const start = hashStr(key) % DAILY_POOL.length;
  const tasks: DailyChallengeDef[] = [];
  for (let i = 0; i < Math.min(count, DAILY_POOL.length); i++) {
    tasks.push(DAILY_POOL[(start + i) % DAILY_POOL.length]!);
  }
  return tasks;
}

export function getDailyDateKey(): string {
  return dateKey();
}

const DAILY_TARGETS: Record<string, number> = {
  daily_kills_30: 30,
  daily_kills_15: 15,
  daily_tokens_20: 20,
  daily_combo_6: 6,
  daily_combo_4: 4,
  daily_boss: 1,
  daily_flawless: 1,
  daily_levels_3: 3,
};

function dailyCurrentForTask(id: string, stats: DailyRunStats): number {
  switch (id) {
    case "daily_kills_30":
    case "daily_kills_15":
      return stats.killsThisRun;
    case "daily_tokens_20":
      return stats.runTokensEarned;
    case "daily_combo_6":
    case "daily_combo_4":
      return stats.maxCombo;
    case "daily_boss":
      return stats.bossDefeated ? 1 : 0;
    case "daily_flawless":
      return stats.flawlessLevel ? 1 : 0;
    case "daily_levels_3":
      return stats.levelsCleared;
    default:
      return 0;
  }
}

export interface DailyTaskProgress {
  current: number;
  target: number;
  done: boolean;
  pct: number;
}

/** Live progress toward a daily task from current run stats. */
export function getDailyTaskProgress(task: DailyChallengeDef, stats: DailyRunStats): DailyTaskProgress {
  const target = DAILY_TARGETS[task.id] ?? 1;
  const current = Math.min(dailyCurrentForTask(task.id, stats), target);
  const done = task.check(stats);
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : done ? 100 : 0;
  return { current, target, done, pct };
}

/** Progress for all of today's daily ops tasks. */
export function getDailyProgress(stats: DailyRunStats, forDate = new Date()): Array<DailyChallengeDef & DailyTaskProgress> {
  return getDailyTasks(forDate).map((task) => ({
    ...task,
    ...getDailyTaskProgress(task, stats),
  }));
}

export function loadDailyCompletedDate(): string | null {
  return localStorage.getItem("og_daily_completed");
}

export function saveDailyCompleted(date: string): void {
  localStorage.setItem("og_daily_completed", date);
}

/** Milliseconds until local midnight. */
export function msUntilMidnight(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const STREAK_KEY = "og_daily_streak";
const LAST_STREAK_DATE_KEY = "og_daily_streak_date";

export function loadDailyStreak(): number {
  try {
    return parseInt(localStorage.getItem(STREAK_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

/** Call when daily ops bundle is completed for today. */
export function bumpDailyStreak(completedDate = getDailyDateKey()): number {
  const last = localStorage.getItem(LAST_STREAK_DATE_KEY);
  let streak = loadDailyStreak();
  if (last === completedDate) return streak;

  const yesterday = new Date(completedDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dateKey(yesterday);

  if (last === yesterdayKey) streak += 1;
  else streak = 1;

  localStorage.setItem(STREAK_KEY, String(streak));
  localStorage.setItem(LAST_STREAK_DATE_KEY, completedDate);
  return streak;
}
