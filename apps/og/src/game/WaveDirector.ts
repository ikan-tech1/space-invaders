import {
  getWaveConfig,
  isBossWave,
  type Difficulty,
} from "../config";
import { buildFormation } from "./formations";
import type { Alien, Boss } from "./entities/types";
import { spawnBoss as spawnLevelBoss } from "../progression/bosses";

export class WaveDirector {
  wave = 1;

  spawnAliens(_difficulty: Difficulty): Alien[] {
    const cfg = getWaveConfig(this.wave);
    const startX = 40;
    const startY = 72;
    return buildFormation(cfg.formation, cfg.rows, cfg.cols, startX, startY);
  }

  spawnBoss(difficulty: Difficulty = "classic"): Boss {
    return spawnLevelBoss(this.wave, "big", difficulty);
  }

  isBossWave(): boolean {
    return isBossWave(this.wave);
  }

  alienSpeedMult(difficulty: Difficulty): number {
    const cfg = getWaveConfig(this.wave);
    const diff = difficulty === "casual" ? 0.75 : difficulty === "insane" ? 1.35 : 1;
    return cfg.speedMult * diff * (1 + (this.wave - 1) * 0.04);
  }

  nextWave(): void {
    this.wave++;
  }
}
