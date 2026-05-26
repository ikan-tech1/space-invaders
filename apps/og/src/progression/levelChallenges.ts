import type { LevelChallengeResult } from "./levelComplete";

export class LevelChallengeTracker {
  levelStartScore = 0;
  shotsFired = 0;
  shotsHit = 0;
  damageTaken = false;

  startLevel(score: number): void {
    this.levelStartScore = score;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.damageTaken = false;
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

  evaluate(): LevelChallengeResult[] {
    const accuracy =
      this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
    const noHit = !this.damageTaken;
    const marksman = this.shotsFired >= 3 && this.shotsHit / this.shotsFired >= 0.75;
    const deadeye =
      this.shotsFired >= 2 && this.shotsHit === this.shotsFired && this.shotsFired > 0;

    return [
      {
        id: "no_hit",
        label: "Untouchable — take no damage",
        passed: noHit,
        bonus: noHit ? 100 : 0,
      },
      {
        id: "marksman",
        label: `Marksman — 75%+ accuracy (${accuracy}%)`,
        passed: marksman,
        bonus: marksman ? 150 : 0,
      },
      {
        id: "deadeye",
        label: "Deadeye — every shot hits",
        passed: deadeye,
        bonus: deadeye ? 250 : 0,
      },
    ];
  }

  levelScore(totalScore: number): number {
    return Math.max(0, totalScore - this.levelStartScore);
  }
}
