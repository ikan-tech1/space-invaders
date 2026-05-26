import { CANVAS_WIDTH, getWaveConfig, isBossWave, type Difficulty } from "../config";
import { buildFormation } from "./formations";
import type { Boss, Drone } from "./entities/types";

export class WaveDirector {
  wave = 1;

  spawnDrones(_difficulty: Difficulty): Drone[] {
    const cfg = getWaveConfig(this.wave);
    return buildFormation(cfg.formation, cfg.rows, cfg.cols, 36, 70);
  }

  spawnBoss(): Boss {
    return {
      x: CANVAS_WIDTH / 2,
      y: 90,
      hp: 40 + this.wave * 3,
      maxHp: 40 + this.wave * 3,
      direction: 1,
      phase: 1,
      active: true,
      patternTimer: 0,
      kind: "big",
    };
  }

  isBossWave(): boolean {
    return isBossWave(this.wave);
  }

  speedMult(difficulty: Difficulty): number {
    const cfg = getWaveConfig(this.wave);
    const d =
      difficulty === "casual" ? 0.8 : difficulty === "insane" ? 1.3 : 1;
    return cfg.speedMult * d * (1 + (this.wave - 1) * 0.05);
  }

  nextWave(): void {
    this.wave++;
  }
}
