export interface ChallengeDef {
  id: string;
  title: string;
  description: string;
  reward: string;
}

export const OG_CHALLENGES: ChallengeDef[] = [
  {
    id: "no_hit_l3",
    title: "Untouchable III",
    description: "Clear Level 3 without taking damage",
    reward: "Nova Plasma pickup unlocked",
  },
  {
    id: "combo_10",
    title: "Chain Reaction",
    description: "Reach 10x combo in a single level",
    reward: "+500 bonus score",
  },
  {
    id: "speed_clear",
    title: "Blitz IV",
    description: "Clear Level 4 in under 45 seconds",
    reward: "Speed badge",
  },
];

export class ChallengeTracker {
  completed = new Set<string>();
  levelDamageTaken = false;
  levelStartTime = 0;
  maxComboThisLevel = 1;

  constructor(completedIds: string[] = []) {
    completedIds.forEach((id) => this.completed.add(id));
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

  checkOnLevelComplete(level: number, score: number): { id: string; bonusScore: number }[] {
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

    void score;
    return newly;
  }

  getCompletedIds(): string[] {
    return [...this.completed];
  }
}
