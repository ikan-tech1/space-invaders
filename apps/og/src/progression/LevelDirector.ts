import type { Difficulty } from "../config";
import { buildFormation } from "../game/formations";
import type { Alien, Boss } from "../game/entities/types";
import { spawnBoss } from "./bosses";
import {
  getEncounterType,
  getLevelBanner,
  getLevelConfig,
  getMovementConfig,
  type EncounterType,
  type MovementRuntimeConfig,
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

  getMovementConfig(difficulty: Difficulty): MovementRuntimeConfig {
    return getMovementConfig(this.level, difficulty);
  }

  spawnAliens(_difficulty: Difficulty): Alien[] {
    const cfg = getLevelConfig(this.level);
    let aliens = buildFormation(cfg.formation, cfg.rows, cfg.cols, 40, 72);
    if (this.level === 1) aliens = aliens.filter((_, i) => i % 2 === 0);

    if (this.level >= 8 && cfg.encounter === "standard") {
      aliens = this.promoteEliteAliens(aliens, this.level >= 10 ? 0.38 : 0.22);
    }

    return aliens;
  }

  /** Upgrade bottom-row grunts to elite (type 0) on high levels. */
  private promoteEliteAliens(aliens: Alien[], ratio: number): Alien[] {
    const maxRow = Math.max(...aliens.map((a) => a.row));
    for (const a of aliens) {
      if (a.row >= maxRow - 1 && a.type >= 2 && Math.random() < ratio) {
        a.type = 0;
      }
    }
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
    let mult = cfg.speedMult * diff * (1 + (this.level - 1) * 0.025);
    if (this.level >= 5) mult *= 1 + Math.min(0.18, (this.level - 4) * 0.035);
    return mult;
  }

  fireMult(difficulty: Difficulty): number {
    const cfg = getLevelConfig(this.level);
    const diff =
      difficulty === "casual" ? 0.7 : difficulty === "insane" ? 1.3 : 1;
    let mult = cfg.fireMult * diff;
    if (this.level >= 5) mult *= 1 + Math.min(0.35, (this.level - 4) * 0.06);
    if (this.level >= 8) mult *= 1.12;
    return mult;
  }

  nextLevel(): void {
    this.level++;
  }
}
