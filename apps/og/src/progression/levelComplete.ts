export interface LevelChallengeResult {
  id: string;
  label: string;
  passed: boolean;
  bonus: number;
}

export interface LevelCompleteReport {
  level: number;
  levelScore: number;
  totalScore: number;
  lives: number;
  stars: number;
  nextLevel: number;
  levelChallenges: LevelChallengeResult[];
  challengeBonus: number;
  campaignCleared: boolean;
}
