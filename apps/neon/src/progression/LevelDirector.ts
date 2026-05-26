import type { Difficulty } from "../config";
import { buildFormation } from "../game/formations";
import type { Boss, Drone } from "../game/entities/types";
import { spawnBoss } from "./bosses";
import {
  getBossInboundFlash,
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

  getInboundFlash(): string | null {
    return getBossInboundFlash(this.level);
  }

  spawnDrones(_difficulty: Difficulty): Drone[] {
    const cfg = getLevelConfig(this.level);
    let drones = buildFormation(cfg.formation, cfg.rows, cfg.cols, 36, 70);
    if (this.level === 1) drones = drones.filter((_, i) => i % 2 === 0);
    return drones;
  }

  spawnMiniBoss(): Boss {
    return spawnBoss(this.level, "mini");
  }

  spawnBigBoss(): Boss {
    return spawnBoss(this.level, "big");
  }

  speedMult(difficulty: Difficulty): number {
    const cfg = getLevelConfig(this.level);
    const diff =
      difficulty === "casual" ? 0.75 : difficulty === "insane" ? 1.35 : 1;
    return cfg.speedMult * diff * (1 + (this.level - 1) * 0.03);
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
