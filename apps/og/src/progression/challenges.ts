export type ChallengeScope = "campaign" | "weekly";

export interface ChallengeDef {
  id: string;
  scope: ChallengeScope;
  title: string;
  description: string;
  reward: string;
  /** Stars granted to armory wallet on first completion. */
  starReward: number;
  /** Optional token payout on completion. */
  tokenReward?: number;
}

export const CHALLENGE_STAR_REWARDS: Record<string, number> = {
  no_hit_l3: 2,
  combo_10: 1,
  speed_clear: 2,
  phantom_run: 1,
  scatter_ace: 1,
  gun_collector: 2,
  titan_siege: 1,
  vanguard_haul: 1,
  mini_boss_slam: 2,
  kill_streak_50: 1,
  iron_will_l5: 2,
  token_spender: 1,
  weekly_hunter: 0,
  weekly_push: 0,
  weekly_slayer: 0,
};

export const OG_CHALLENGES: ChallengeDef[] = [
  {
    id: "no_hit_l3",
    scope: "campaign",
    title: "Untouchable III",
    description: "Clear Level 3 without taking damage",
    reward: "Nova Plasma pickup unlocked · +2 ★",
    starReward: 2,
  },
  {
    id: "combo_10",
    scope: "campaign",
    title: "Chain Reaction",
    description: "Reach 10× combo in a single level",
    reward: "+500 bonus score · +1 ★",
    starReward: 1,
  },
  {
    id: "speed_clear",
    scope: "campaign",
    title: "Blitz IV",
    description: "Clear Level 4 in under 45 seconds",
    reward: "Speed badge · +2 ★",
    starReward: 2,
  },
  {
    id: "phantom_run",
    scope: "campaign",
    title: "Ghost Pilot",
    description: "Clear any level while flying the Phantom hull",
    reward: "Phantom badge · +1 ★",
    starReward: 1,
  },
  {
    id: "scatter_ace",
    scope: "campaign",
    title: "Scatter Ace",
    description: "Clear a level with Scatter Fan equipped",
    reward: "Scatter badge · +1 ★",
    starReward: 1,
  },
  {
    id: "gun_collector",
    scope: "campaign",
    title: "Arsenal",
    description: "Unlock 5 weapons in the Armory",
    reward: "Gun rack badge · +2 ★",
    starReward: 2,
  },
  {
    id: "titan_siege",
    scope: "campaign",
    title: "Siege Lord",
    description: "Clear any level while flying the Titan hull",
    reward: "Siege badge · +1 ★",
    starReward: 1,
  },
  {
    id: "vanguard_haul",
    scope: "campaign",
    title: "Escort Run",
    description: "Earn 30 run tokens in one run with Vanguard equipped",
    reward: "Escort badge · +1 ★",
    starReward: 1,
  },
  {
    id: "mini_boss_slam",
    scope: "campaign",
    title: "Mini Boss Breaker",
    description: "Defeat a mini boss in a single run",
    reward: "Boss breaker badge · +2 ★",
    starReward: 2,
  },
  {
    id: "kill_streak_50",
    scope: "campaign",
    title: "Exterminator",
    description: "Destroy 50 aliens in one run",
    reward: "Hunter badge · +1 ★",
    starReward: 1,
  },
  {
    id: "iron_will_l5",
    scope: "campaign",
    title: "Iron Will",
    description: "Clear Level 5 without taking damage",
    reward: "Iron badge · +2 ★",
    starReward: 2,
  },
  {
    id: "token_spender",
    scope: "campaign",
    title: "Big Spender",
    description: "Spend 100 tokens in the Armory (lifetime)",
    reward: "Patron badge · +1 ★",
    starReward: 1,
  },
];

export const WEEKLY_CHALLENGES: ChallengeDef[] = [
  {
    id: "weekly_hunter",
    scope: "weekly",
    title: "Weekly Hunter",
    description: "Destroy 75 aliens this week (across runs)",
    reward: "+25 ◎",
    starReward: 0,
    tokenReward: 25,
  },
  {
    id: "weekly_push",
    scope: "weekly",
    title: "Sector Push",
    description: "Clear 4 campaign levels this week",
    reward: "+20 ◎ · +1 ★",
    starReward: 1,
    tokenReward: 20,
  },
  {
    id: "weekly_slayer",
    scope: "weekly",
    title: "Boss Slayer",
    description: "Defeat 2 bosses this week",
    reward: "+30 ◎",
    starReward: 0,
    tokenReward: 30,
  },
];

export interface RunChallengeStats {
  runKills: number;
  runTokensEarned: number;
  runBossDefeated: boolean;
  totalTokensSpent: number;
}

export class ChallengeTracker {
  completed = new Set<string>();
  levelDamageTaken = false;
  levelStartTime = 0;
  maxComboThisLevel = 1;
  equippedShip: string;
  equippedGun: string;
  unlockedGunCount: number;
  totalTokensSpent: number;

  constructor(
    completedIds: string[] = [],
    equippedShip = "striker",
    equippedGun = "single",
    unlockedGunCount = 1,
    totalTokensSpent = 0
  ) {
    completedIds.forEach((id) => this.completed.add(id));
    this.equippedShip = equippedShip;
    this.equippedGun = equippedGun;
    this.unlockedGunCount = unlockedGunCount;
    this.totalTokensSpent = totalTokensSpent;
  }

  setLoadout(ship: string, gun: string, unlockedGuns: number, tokensSpent: number): void {
    this.equippedShip = ship;
    this.equippedGun = gun;
    this.unlockedGunCount = unlockedGuns;
    this.totalTokensSpent = tokensSpent;
  }

  startLevel(): void {
    this.levelDamageTaken = false;
    this.levelStartTime = performance.now();
    this.maxComboThisLevel = 1;
  }

  onDamage(): void {
    this.levelDamageTaken = true;
  }

  onCombo(mult: number): void {
    this.maxComboThisLevel = Math.max(this.maxComboThisLevel, mult);
  }

  checkOnLevelComplete(level: number): { id: string; bonusScore: number }[] {
    const newly: { id: string; bonusScore: number }[] = [];
    const add = (id: string, bonus = 0) => {
      if (!this.completed.has(id)) {
        this.completed.add(id);
        newly.push({ id, bonusScore: bonus });
      }
    };

    if (level === 3 && !this.levelDamageTaken) add("no_hit_l3");
    if (level === 5 && !this.levelDamageTaken) add("iron_will_l5");
    if (this.maxComboThisLevel >= 10) add("combo_10", 500);
    const elapsed = (performance.now() - this.levelStartTime) / 1000;
    if (level === 4 && elapsed < 45) add("speed_clear");
    if (this.equippedShip === "phantom") add("phantom_run");
    if (this.equippedShip === "titan") add("titan_siege");
    if (this.equippedGun === "scatter") add("scatter_ace");
    if (this.unlockedGunCount >= 5) add("gun_collector");
    if (this.totalTokensSpent >= 100) add("token_spender");
    return newly;
  }

  checkOnRunEnd(stats: RunChallengeStats): { id: string; bonusScore: number }[] {
    const newly: { id: string; bonusScore: number }[] = [];
    const add = (id: string, bonus = 0) => {
      if (!this.completed.has(id)) {
        this.completed.add(id);
        newly.push({ id, bonusScore: bonus });
      }
    };

    if (stats.runKills >= 50) add("kill_streak_50");
    if (stats.runBossDefeated) add("mini_boss_slam");
    if (this.equippedShip === "vanguard" && stats.runTokensEarned >= 30) add("vanguard_haul");
    if (this.totalTokensSpent >= 100) add("token_spender");
    return newly;
  }

  getCompletedIds(): string[] {
    return [...this.completed];
  }
}
