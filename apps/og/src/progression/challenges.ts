export interface ChallengeDef {
  id: string;
  title: string;
  description: string;
  reward: string;
  /** Stars granted to armory wallet on first completion. */
  starReward: number;
}

export const CHALLENGE_STAR_REWARDS: Record<string, number> = {
  no_hit_l3: 2,
  combo_10: 1,
  speed_clear: 2,
  phantom_run: 1,
  scatter_ace: 1,
  gun_collector: 2,
};

export const OG_CHALLENGES: ChallengeDef[] = [
  {
    id: "no_hit_l3",
    title: "Untouchable III",
    description: "Clear Level 3 without taking damage",
    reward: "Nova Plasma pickup unlocked · +2 ★",
    starReward: 2,
  },
  {
    id: "combo_10",
    title: "Chain Reaction",
    description: "Reach 10x combo in a single level",
    reward: "+500 bonus score · +1 ★",
    starReward: 1,
  },
  {
    id: "speed_clear",
    title: "Blitz IV",
    description: "Clear Level 4 in under 45 seconds",
    reward: "Speed badge · +2 ★",
    starReward: 2,
  },
  {
    id: "phantom_run",
    title: "Ghost Pilot",
    description: "Clear any level while flying the Phantom hull",
    reward: "Phantom badge · +1 ★",
    starReward: 1,
  },
  {
    id: "scatter_ace",
    title: "Scatter Ace",
    description: "Clear a level with Scatter Fan equipped",
    reward: "Scatter badge · +1 ★",
    starReward: 1,
  },
  {
    id: "gun_collector",
    title: "Arsenal",
    description: "Unlock 5 weapons in the Armory",
    reward: "Gun rack badge · +2 ★",
    starReward: 2,
  },
];

export class ChallengeTracker {
  completed = new Set<string>();
  levelDamageTaken = false;
  levelStartTime = 0;
  maxComboThisLevel = 1;
  equippedShip: string;
  equippedGun: string;
  unlockedGunCount: number;

  constructor(completedIds: string[] = [], equippedShip = "striker", equippedGun = "single", unlockedGunCount = 1) {
    completedIds.forEach((id) => this.completed.add(id));
    this.equippedShip = equippedShip;
    this.equippedGun = equippedGun;
    this.unlockedGunCount = unlockedGunCount;
  }

  setLoadout(ship: string, gun: string, unlockedGuns: number): void {
    this.equippedShip = ship;
    this.equippedGun = gun;
    this.unlockedGunCount = unlockedGuns;
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
    if (this.maxComboThisLevel >= 10) add("combo_10", 500);
    const elapsed = (performance.now() - this.levelStartTime) / 1000;
    if (level === 4 && elapsed < 45) add("speed_clear");
    if (this.equippedShip === "phantom") add("phantom_run");
    if (this.equippedGun === "scatter") add("scatter_ace");
    if (this.unlockedGunCount >= 5) add("gun_collector");
    return newly;
  }

  getCompletedIds(): string[] {
    return [...this.completed];
  }
}
