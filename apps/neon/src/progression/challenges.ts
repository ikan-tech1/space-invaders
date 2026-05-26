export interface ChallengeDef {
  id: string;
  title: string;
  description: string;
  reward: string;
}

export const NEON_CHALLENGES: ChallengeDef[] = [
  {
    id: "tier3_by_l5",
    title: "Rapid Ascent",
    description: "Reach weapon Tier 3 before Level 5",
    reward: "Overcharger module",
  },
  {
    id: "boss_no_overheat",
    title: "Cool Under Fire",
    description: "Beat a big boss without overheating",
    reward: "Stabilizer module",
  },
  {
    id: "chrono_master",
    title: "Time Dilation",
    description: "Use Chrono 3 times in one run",
    reward: "Extended Chrono",
  },
];

export class ChallengeTracker {
  completed = new Set<string>();
  tierAtLevelStart = 1;
  chronoUsesThisRun = 0;
  overheatedOnBoss = false;
  maxTierReached = 1;

  constructor(completedIds: string[] = []) {
    completedIds.forEach((id) => this.completed.add(id));
  }

  startLevel(tier: number): void {
    this.tierAtLevelStart = tier;
    this.overheatedOnBoss = false;
  }

  onTier(tier: number): void {
    this.maxTierReached = Math.max(this.maxTierReached, tier);
  }

  onChrono(): void {
    this.chronoUsesThisRun++;
  }

  onCombo(mult: number): void {
    if (mult >= 6) this.comboPeak = Math.max(this.comboPeak, mult);
  }

  comboPeak = 1;

  onOverheatDuringBoss(isBoss: boolean): void {
    if (isBoss) this.overheatedOnBoss = true;
  }

  checkOnLevelComplete(
    level: number,
    tier: number,
    wasBigBoss: boolean
  ): { id: string; bonusScore: number }[] {
    const newly: { id: string; bonusScore: number }[] = [];
    const add = (id: string, bonus = 0) => {
      if (!this.completed.has(id)) {
        this.completed.add(id);
        newly.push({ id, bonusScore: bonus });
      }
    };
    if (level <= 5 && tier >= 3) add("tier3_by_l5");
    if (wasBigBoss && !this.overheatedOnBoss) add("boss_no_overheat");
    if (this.chronoUsesThisRun >= 3) add("chrono_master", 300);
    return newly;
  }

  getCompletedIds(): string[] {
    return [...this.completed];
  }
}
