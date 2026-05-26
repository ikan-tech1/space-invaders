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
];

function dateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getDailyChallenge(forDate = new Date()): DailyChallengeDef {
  const key = dateKey(forDate);
  const idx = hashStr(key) % DAILY_POOL.length;
  return DAILY_POOL[idx]!;
}

export function getDailyDateKey(): string {
  return dateKey();
}

export function loadDailyCompletedDate(): string | null {
  return localStorage.getItem("og_daily_completed");
}

export function saveDailyCompleted(date: string): void {
  localStorage.setItem("og_daily_completed", date);
}
