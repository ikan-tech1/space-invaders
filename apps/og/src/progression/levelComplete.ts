export interface LevelChallengeResult {
  id: string;
  label: string;
  passed: boolean;
  bonus: number;
}

import type { CampaignBeat } from "./campaignNarrative";

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
  /** Tokens earned during this level (kills + clear + secrets). */
  tokensEarnedThisLevel: number;
  /** Persistent wallet after level grants. */
  walletTokens: number;
  /** Spendable run pool (supply depot only; not armory wallet). */
  runTokenPool: number;
  /** Endless mode payout multiplier applied this level (1 = none). */
  endlessTokenMult: number;
  endlessTier?: string;
  endlessDepth?: number;
  endlessNextTierDepth?: number | null;
  gameMode: "campaign" | "endless";
  /** Shown after boss milestone clears in campaign mode. */
  narrativeBeat?: CampaignBeat | null;
}
