import type { Difficulty } from "../config";

export interface HighScoreEntry {
  initials: string;
  score: number;
  wave: number;
  date: string;
}

export interface GameSettings {
  volume: number;
  touchScale: number;
  muted: boolean;
}

export interface SavedRun {
  score: number;
  wave: number;
  lives: number;
  difficulty: Difficulty;
}

const KEYS = {
  highScores: "si_high_scores",
  settings: "si_settings",
  savedRun: "si_saved_run",
} as const;

const DEFAULT_SETTINGS: GameSettings = {
  volume: 0.6,
  touchScale: 1,
  muted: false,
};

export class LocalStorageRepo {
  getSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(KEYS.settings);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(settings: GameSettings): void {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  }

  getHighScores(): HighScoreEntry[] {
    try {
      const raw = localStorage.getItem(KEYS.highScores);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as HighScoreEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  addHighScore(entry: HighScoreEntry): HighScoreEntry[] {
    const list = this.getHighScores();
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, 10);
    localStorage.setItem(KEYS.highScores, JSON.stringify(trimmed));
    return trimmed;
  }

  getSavedRun(): SavedRun | null {
    try {
      const raw = localStorage.getItem(KEYS.savedRun);
      if (!raw) return null;
      return JSON.parse(raw) as SavedRun;
    } catch {
      return null;
    }
  }

  saveRun(run: SavedRun): void {
    localStorage.setItem(KEYS.savedRun, JSON.stringify(run));
  }

  clearSavedRun(): void {
    localStorage.removeItem(KEYS.savedRun);
  }

  rankForScore(score: number): number {
    const scores = this.getHighScores().map((e) => e.score);
    const rank = scores.filter((s) => s > score).length + 1;
    return rank <= 10 ? rank : 0;
  }
}
