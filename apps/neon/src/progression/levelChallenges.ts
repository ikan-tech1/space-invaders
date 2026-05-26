import type { LevelChallengeResult } from "./levelComplete";

export class LevelChallengeTracker {
  levelStartScore = 0;
  shotsFired = 0;
  shotsHit = 0;
  damageTaken = false;
  overheated = false;
  maxCombo = 1;

  startLevel(score: number): void {
    this.levelStartScore = score;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.damageTaken = false;
    this.overheated = false;
    this.maxCombo = 1;
  }

  onShotFired(): void {
    this.shotsFired++;
  }

  onShotHit(): void {
    this.shotsHit++;
  }

  onDamage(): void {
    this.damageTaken = true;
  }

  onOverheat(): void {
    this.overheated = true;
  }

  onCombo(mult: number): void {
    this.maxCombo = Math.max(this.maxCombo, mult);
  }

  evaluate(): LevelChallengeResult[] {
    const accuracy =
      this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
    const noHit = !this.damageTaken;
    const marksman = this.shotsFired >= 5 && this.shotsHit / this.shotsFired >= 0.8;
    const cool = !this.overheated;
    const comboMaster = this.maxCombo >= 6;

    return [
      {
        id: "no_hit",
        label: "Shield Intact — no hull damage",
        passed: noHit,
        bonus: noHit ? 120 : 0,
      },
      {
        id: "marksman",
        label: `Targeting — 80%+ hit rate (${accuracy}%)`,
        passed: marksman,
        bonus: marksman ? 180 : 0,
      },
      {
        id: "cool",
        label: "Coolant Stable — never overheat",
        passed: cool,
        bonus: cool ? 100 : 0,
      },
      {
        id: "combo_master",
        label: `Chain Master — 6× combo (${this.maxCombo}× peak)`,
        passed: comboMaster,
        bonus: comboMaster ? 150 : 0,
      },
    ];
  }

  levelScore(totalScore: number): number {
    return Math.max(0, totalScore - this.levelStartScore);
  }
}
