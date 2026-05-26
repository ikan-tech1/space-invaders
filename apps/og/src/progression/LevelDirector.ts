import type { Difficulty } from "../config";
import { buildFormation } from "../game/formations";
import type { Alien, Boss } from "../game/entities/types";
import { spawnBoss } from "./bosses";
import {
  getEncounterType,
  getLevelBanner,
  getLevelConfig,
  type EncounterType,
} from "./levelScript";

export class LevelDirector {
  level = 1;

  get encounter(): EncounterType {
    return getEncounterType(this.level);
  }

  getBanner(): string {
    return getLevelBanner(this.level);
  }

  getSectorIdentity(): string {
    return getLevelConfig(this.level).identity;
  }

  spawnAliens(_difficulty: Difficulty): Alien[] {
    const cfg = getLevelConfig(this.level);
    let aliens = buildFormation(cfg.formation, cfg.rows, cfg.cols, 40, 72);
    if (this.level === 1) aliens = aliens.filter((_, i) => i % 2 === 0);
    return aliens;
  }

  spawnMiniBoss(difficulty: Difficulty): Boss {
    return spawnBoss(this.level, "mini", difficulty);
  }

  spawnBigBoss(difficulty: Difficulty): Boss {
    return spawnBoss(this.level, "big", difficulty);
  }

  speedMult(difficulty: Difficulty): number {
    const cfg = getLevelConfig(this.level);
    const diff =
      difficulty === "casual" ? 0.75 : difficulty === "insane" ? 1.35 : 1;
    return cfg.speedMult * diff * (1 + (this.level - 1) * 0.025);
  }

  fireMult(difficulty: Difficulty): number {
    const cfg = getLevelConfig(this.level);
    const diff =
      difficulty === "casual" ? 0.7 : difficulty === "insane" ? 1.3 : 1;
    return cfg.fireMult * diff;
  }

  nextLevel(): void {
    this.level++;
  }
}
