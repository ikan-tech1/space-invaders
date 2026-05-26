import type { CosmeticColorId } from "./shipCosmetics";

export interface EasterEggToast {
  message: string;
  tokens?: number;
  stars?: number;
  badge?: string;
  unlockColor?: CosmeticColorId;
  extraUnlockColors?: CosmeticColorId[];
  unlockPickup?: string;
  /** Seconds of phantom-fleet style multi-ship on next run. */
  fleetTrialSec?: number;
  achievement?: boolean;
}

export class EasterEggRegistry {
  konamiProgress: string[] = [];
  konamiUsedThisRun = false;
  konamiBuffTimer = 0;
  goldUfoPending = false;
  totalKills = 0;
  secretInitials = false;

  coinCodeProgress = "";
  coinCodeUsed = false;
  arcCodeProgress = "";
  arcCodeUsed = false;
  fleetCodeProgress = "";
  fleetCodeUsed = false;
  miniBoss3Done = false;
  miniBoss9Done = false;
  bigBoss6Done = false;
  bigBoss12Done = false;
  score1337Done = false;
  score50000Done = false;
  score42069Done = false;
  kills50Done = false;
  kills250Done = false;
  kills100StreakDone = false;
  wave7ToastDone = false;
  level12SpeedDone = false;
  invaderClickDone = false;
  titanCallsignDone = false;
  diamondFlawlessDone = false;
  pincerFlawlessDone = false;
  miniBossFlawlessDone = false;
  bigBossPhase2Done = false;
  vFormationDone = false;

  /** Kills since last player damage this run (for 100-kill badge). */
  runKillStreak = 0;

  constructor(savedKills = 0, secretInitials = false) {
    this.totalKills = savedKills;
    this.secretInitials = secretInitials;
    this.coinCodeUsed = localStorage.getItem("og_coin_code") === "1";
    this.arcCodeUsed = localStorage.getItem("og_arc_code") === "1";
    this.fleetCodeUsed = localStorage.getItem("og_fleet_code") === "1";
    this.miniBoss3Done = localStorage.getItem("og_miniboss_3") === "1";
    this.miniBoss9Done = localStorage.getItem("og_miniboss_9") === "1";
    this.bigBoss6Done = localStorage.getItem("og_bigboss_6") === "1";
    this.bigBoss12Done = localStorage.getItem("og_bigboss_12") === "1";
    this.score1337Done = localStorage.getItem("og_score_1337") === "1";
    this.score50000Done = localStorage.getItem("og_score_50000") === "1";
    this.score42069Done = localStorage.getItem("og_score_42069") === "1";
    this.kills50Done = localStorage.getItem("og_kills_50") === "1";
    this.kills250Done = localStorage.getItem("og_kills_250") === "1";
    this.kills100StreakDone = localStorage.getItem("og_kills_100_streak") === "1";
    this.level12SpeedDone = localStorage.getItem("og_level12_speed") === "1";
    this.invaderClickDone = localStorage.getItem("og_invader_skin") === "1";
    this.titanCallsignDone = localStorage.getItem("og_titan_callsign") === "1";
    this.diamondFlawlessDone = localStorage.getItem("og_secret_diamond") === "1";
    this.pincerFlawlessDone = localStorage.getItem("og_secret_pincer") === "1";
    this.miniBossFlawlessDone = localStorage.getItem("og_secret_miniboss_nd") === "1";
    this.bigBossPhase2Done = localStorage.getItem("og_secret_bigboss_p2") === "1";
    this.vFormationDone = localStorage.getItem("og_secret_vformation") === "1";
  }

  private static KONAMI = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
  ];

  private static COIN_CODE = "coin";
  private static ARC_CODE = "arc";
  private static FLEET_CODE = "fleet";

  private matchCode(
    key: string,
    code: string,
    progress: string,
    used: boolean
  ): { progress: string; matched: boolean } {
    const lower = key.length === 1 ? key.toLowerCase() : "";
    if (!lower || used) return { progress, matched: false };
    const want = code[progress.length];
    if (lower === want) {
      const next = progress + lower;
      if (next === code) return { progress: "", matched: true };
      return { progress: next, matched: false };
    }
    return { progress: lower === code[0] ? lower : "", matched: false };
  }

  onMenuKey(key: string): EasterEggToast | null {
    const expected = EasterEggRegistry.KONAMI[this.konamiProgress.length];
    if (key === expected) {
      this.konamiProgress.push(key);
      if (this.konamiProgress.length === EasterEggRegistry.KONAMI.length) {
        this.konamiProgress = [];
        return { message: "KONAMI — buff armed for next run!", achievement: true };
      }
    } else {
      this.konamiProgress = key === EasterEggRegistry.KONAMI[0] ? [key] : [];
    }

    const coin = this.matchCode(key, EasterEggRegistry.COIN_CODE, this.coinCodeProgress, this.coinCodeUsed);
    this.coinCodeProgress = coin.progress;
    if (coin.matched) {
      localStorage.setItem("og_coin_code", "1");
      this.coinCodeUsed = true;
      return { message: "COIN — +25 tokens!", tokens: 25, achievement: true };
    }

    const arc = this.matchCode(key, EasterEggRegistry.ARC_CODE, this.arcCodeProgress, this.arcCodeUsed);
    this.arcCodeProgress = arc.progress;
    if (arc.matched) {
      localStorage.setItem("og_arc_code", "1");
      this.arcCodeUsed = true;
      return { message: "ARC — V-formation bonus +12 tokens!", tokens: 12, achievement: true };
    }

    const fleet = this.matchCode(
      key,
      EasterEggRegistry.FLEET_CODE,
      this.fleetCodeProgress,
      this.fleetCodeUsed
    );
    this.fleetCodeProgress = fleet.progress;
    if (fleet.matched) {
      localStorage.setItem("og_fleet_code", "1");
      this.fleetCodeUsed = true;
      localStorage.setItem("og_fleet_trial_pending", "10");
      return {
        message: "FLEET — Phantom Fleet trial armed for next run (10s)!",
        fleetTrialSec: 10,
        achievement: true,
      };
    }

    return null;
  }

  /** Hidden arcade invader row — 5 rapid clicks. */
  onInvaderRowClick(): EasterEggToast | null {
    if (this.invaderClickDone) return null;
    this.invaderClickDone = true;
    localStorage.setItem("og_invader_skin", "1");
    return {
      message: "Invader pigment cracked — Magenta hull tint unlocked!",
      unlockColor: "magenta",
      achievement: true,
    };
  }

  /** Armory callsign typed as TITAN on Titan hull. */
  onTitanCallsign(callsign: string, hullName: string): EasterEggToast | null {
    if (this.titanCallsignDone || hullName.toLowerCase() !== "titan") return null;
    if (callsign !== "TITAN") return null;
    this.titanCallsignDone = true;
    localStorage.setItem("og_titan_callsign", "1");
    return {
      message: "TITAN — All systems nominal. Siege breakers online.",
      achievement: true,
    };
  }

  activateKonamiRun(): void {
    this.konamiUsedThisRun = true;
    this.konamiBuffTimer = 30;
  }

  activateFleetTrial(seconds: number): void {
    this.fleetTrialTimer = seconds;
  }

  fleetTrialTimer = 0;

  onScore(score: number): EasterEggToast | null {
    if (score === 8008) this.goldUfoPending = true;
    if (!this.score1337Done && score === 1337) {
      this.score1337Done = true;
      localStorage.setItem("og_score_1337", "1");
      return { message: "LEET SCORE — +15 tokens!", tokens: 15, achievement: true };
    }
    if (!this.score42069Done && score === 42069) {
      this.score42069Done = true;
      localStorage.setItem("og_score_42069", "1");
      return {
        message: "42069 — Nice. +42 tokens for the culture.",
        tokens: 42,
        achievement: true,
      };
    }
    if (!this.score50000Done && score >= 50000) {
      this.score50000Done = true;
      localStorage.setItem("og_score_50000", "1");
      return { message: "HIGH ROLLER — +50 tokens!", tokens: 50, achievement: true };
    }
    return null;
  }

  onKill(): EasterEggToast | null {
    this.totalKills++;
    this.runKillStreak++;
    if (this.totalKills >= 100) this.secretInitials = true;

    if (!this.kills50Done && this.totalKills >= 50) {
      this.kills50Done = true;
      localStorage.setItem("og_kills_50", "1");
      return { message: "50 KILLS — +10 tokens!", tokens: 10, achievement: true };
    }
    if (!this.kills250Done && this.totalKills >= 250) {
      this.kills250Done = true;
      localStorage.setItem("og_kills_250", "1");
      return { message: "250 KILLS — Phantom hull schematic!", tokens: 30, achievement: true };
    }
    if (!this.kills100StreakDone && this.runKillStreak >= 100) {
      this.kills100StreakDone = true;
      localStorage.setItem("og_kills_100_streak", "1");
      return {
        message: "100 KILLS — No damage! Ace badge + Violet tint.",
        badge: "ace_100",
        unlockColor: "violet",
        stars: 2,
        achievement: true,
      };
    }
    return null;
  }

  onPlayerDamage(): void {
    this.runKillStreak = 0;
  }

  onFormationClear(
    formation: string,
    flawless: boolean,
    arcCodeActive: boolean
  ): EasterEggToast | null {
    if (flawless && formation === "diamond" && !this.diamondFlawlessDone) {
      this.diamondFlawlessDone = true;
      localStorage.setItem("og_secret_diamond", "1");
      return { message: "Diamond doctrine — flawless clear! +8 ◎", tokens: 8, achievement: true };
    }
    if (flawless && formation === "pincer" && !this.pincerFlawlessDone) {
      this.pincerFlawlessDone = true;
      localStorage.setItem("og_secret_pincer", "1");
      return { message: "Pincer broken — no hits! +10 ◎", tokens: 10, achievement: true };
    }
    if (
      flawless &&
      arcCodeActive &&
      formation === "classic" &&
      !this.vFormationDone
    ) {
      this.vFormationDone = true;
      localStorage.setItem("og_secret_vformation", "1");
      return { message: "V-formation unlocked — ARC synergy! +15 ◎", tokens: 15, achievement: true };
    }
    return null;
  }

  onBossFlawless(kind: "mini" | "big", phase2Reached: boolean): EasterEggToast | null {
    if (kind === "mini" && !this.miniBossFlawlessDone) {
      this.miniBossFlawlessDone = true;
      localStorage.setItem("og_secret_miniboss_nd", "1");
      return { message: "Mini boss — untouched! +6 ◎", tokens: 6, achievement: true };
    }
    if (kind === "big" && phase2Reached && !this.bigBossPhase2Done) {
      this.bigBossPhase2Done = true;
      localStorage.setItem("og_secret_bigboss_p2", "1");
      return { message: "Phase II takedown! +12 ◎", tokens: 12, achievement: true };
    }
    return null;
  }

  isArcCodeActive(): boolean {
    return this.arcCodeUsed;
  }

  onLevelComplete(level: number, elapsedSec?: number): EasterEggToast | null {
    if (!this.wave7ToastDone && level === 7) {
      this.wave7ToastDone = true;
      return { message: "Lucky 7 — bonus tokens!", tokens: 7 };
    }
    if (
      !this.level12SpeedDone &&
      level === 12 &&
      typeof elapsedSec === "number" &&
      elapsedSec < 90
    ) {
      this.level12SpeedDone = true;
      localStorage.setItem("og_level12_speed", "1");
      return {
        message: "L12 blitz — under 90s! Gold + Orange palette unlocked.",
        unlockColor: "orange",
        stars: 3,
        achievement: true,
        extraUnlockColors: ["gold"] as CosmeticColorId[],
      };
    }
    return null;
  }

  onBossDefeat(level: number, isBigBoss: boolean): EasterEggToast | null {
    if (isBigBoss) {
      if (!this.bigBoss6Done && level === 6) {
        this.bigBoss6Done = true;
        localStorage.setItem("og_bigboss_6", "1");
        return { message: "Boss milestone L6 — +20 tokens!", tokens: 20, achievement: true };
      }
      if (!this.bigBoss12Done && level === 12) {
        this.bigBoss12Done = true;
        localStorage.setItem("og_bigboss_12", "1");
        return { message: "Final boss fallen — +40 tokens!", tokens: 40, achievement: true };
      }
    } else {
      if (!this.miniBoss3Done && level === 3) {
        this.miniBoss3Done = true;
        localStorage.setItem("og_miniboss_3", "1");
        return { message: "Mini boss L3 — +8 tokens!", tokens: 8, achievement: true };
      }
      if (!this.miniBoss9Done && level === 9) {
        this.miniBoss9Done = true;
        localStorage.setItem("og_miniboss_9", "1");
        return { message: "Mini boss L9 — +12 tokens!", tokens: 12, achievement: true };
      }
    }
    return null;
  }

  consumeGoldUfo(): boolean {
    if (!this.goldUfoPending) return false;
    this.goldUfoPending = false;
    return true;
  }

  update(dt: number): void {
    if (this.konamiBuffTimer > 0) this.konamiBuffTimer -= dt;
    if (this.fleetTrialTimer > 0) this.fleetTrialTimer -= dt;
  }

  isInvulnBuff(): boolean {
    return this.konamiBuffTimer > 0;
  }

  isFleetTrialActive(): boolean {
    return this.fleetTrialTimer > 0;
  }
}
