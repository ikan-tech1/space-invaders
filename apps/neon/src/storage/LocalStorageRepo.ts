import type { Difficulty } from "../config";

export interface HighScoreEntry {
  initials: string;
  score: number;
  wave: number;
  maxTier: number;
  date: string;
}

export interface GameSettings {
  volume: number;
  touchScale: number;
  muted: boolean;
  reducedFx: boolean;
}

export interface SavedRun {
  score: number;
  wave: number;
  lives: number;
  difficulty: Difficulty;
}

const DEFAULT: GameSettings = {
  volume: 0.65,
  touchScale: 1,
  muted: false,
  reducedFx: false,
};

export class LocalStorageRepo {
  getSettings(): GameSettings {
    try {
      const r = localStorage.getItem("neon_settings");
      return r ? { ...DEFAULT, ...JSON.parse(r) } : { ...DEFAULT };
    } catch {
      return { ...DEFAULT };
    }
  }

  saveSettings(s: GameSettings): void {
    localStorage.setItem("neon_settings", JSON.stringify(s));
  }

  getHighScores(): HighScoreEntry[] {
    try {
      const r = localStorage.getItem("neon_high_scores");
      return r ? (JSON.parse(r) as HighScoreEntry[]) : [];
    } catch {
      return [];
    }
  }

  addHighScore(e: HighScoreEntry): HighScoreEntry[] {
    const list = [...this.getHighScores(), e].sort((a, b) => b.score - a.score).slice(0, 10);
    localStorage.setItem("neon_high_scores", JSON.stringify(list));
    return list;
  }

  getSavedRun(): SavedRun | null {
    try {
      const r = localStorage.getItem("neon_saved_run");
      return r ? JSON.parse(r) : null;
    } catch {
      return null;
    }
  }

  saveRun(run: SavedRun): void {
    localStorage.setItem("neon_saved_run", JSON.stringify(run));
  }

  clearSavedRun(): void {
    localStorage.removeItem("neon_saved_run");
  }

  rankForScore(score: number): number {
    const scores = this.getHighScores().map((e) => e.score);
    const rank = scores.filter((s) => s > score).length + 1;
    return rank <= 10 ? rank : 0;
  }
}
