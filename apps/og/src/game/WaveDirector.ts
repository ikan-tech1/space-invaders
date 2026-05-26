import {
  CANVAS_WIDTH,
  getWaveConfig,
  isBossWave,
  type Difficulty,
} from "../config";
import { buildFormation } from "./formations";
import type { Alien, Boss } from "./entities/types";

export class WaveDirector {
  wave = 1;

  spawnAliens(_difficulty: Difficulty): Alien[] {
    const cfg = getWaveConfig(this.wave);
    const startX = 40;
    const startY = 72;
    return buildFormation(cfg.formation, cfg.rows, cfg.cols, startX, startY);
  }

  spawnBoss(): Boss {
    return {
      x: CANVAS_WIDTH / 2,
      y: 100,
      hp: 30 + this.wave * 2,
      maxHp: 30 + this.wave * 2,
      direction: 1,
      weakPoint: 1,
      active: true,
      kind: "big",
      phase: 1,
      fireTimer: 0,
      telegraphTimer: 0,
      attackCooldown: 1.8,
    };
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
