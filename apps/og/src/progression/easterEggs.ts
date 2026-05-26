export interface EasterEggToast {
  message: string;
  tokens?: number;
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
  miniBoss3Done = false;
  miniBoss9Done = false;
  bigBoss6Done = false;
  bigBoss12Done = false;
  score1337Done = false;
  score50000Done = false;
  kills50Done = false;
  kills250Done = false;
  wave7ToastDone = false;
  diamondFlawlessDone = false;
  pincerFlawlessDone = false;
  miniBossFlawlessDone = false;
  bigBossPhase2Done = false;
  vFormationDone = false;

  constructor(savedKills = 0, secretInitials = false) {
    this.totalKills = savedKills;
    this.secretInitials = secretInitials;
    this.coinCodeUsed = localStorage.getItem("og_coin_code") === "1";
    this.arcCodeUsed = localStorage.getItem("og_arc_code") === "1";
    this.miniBoss3Done = localStorage.getItem("og_miniboss_3") === "1";
    this.miniBoss9Done = localStorage.getItem("og_miniboss_9") === "1";
    this.bigBoss6Done = localStorage.getItem("og_bigboss_6") === "1";
    this.bigBoss12Done = localStorage.getItem("og_bigboss_12") === "1";
    this.score1337Done = localStorage.getItem("og_score_1337") === "1";
    this.score50000Done = localStorage.getItem("og_score_50000") === "1";
    this.kills50Done = localStorage.getItem("og_kills_50") === "1";
    this.kills250Done = localStorage.getItem("og_kills_250") === "1";
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

  onMenuKey(key: string): EasterEggToast | null {
    const expected = EasterEggRegistry.KONAMI[this.konamiProgress.length];
    if (key === expected) {
      this.konamiProgress.push(key);
      if (this.konamiProgress.length === EasterEggRegistry.KONAMI.length) {
        this.konamiProgress = [];
        return { message: "KONAMI — buff armed for next run!" };
      }
    } else {
      this.konamiProgress = key === EasterEggRegistry.KONAMI[0] ? [key] : [];
    }

    const lower = key.length === 1 ? key.toLowerCase() : "";
    if (lower && !this.coinCodeUsed) {
      const want = EasterEggRegistry.COIN_CODE[this.coinCodeProgress.length];
      if (lower === want) {
        this.coinCodeProgress += lower;
        if (this.coinCodeProgress === EasterEggRegistry.COIN_CODE) {
          this.coinCodeProgress = "";
          localStorage.setItem("og_coin_code", "1");
          this.coinCodeUsed = true;
          return { message: "COIN — +25 tokens!", tokens: 25 };
        }
      } else {
        this.coinCodeProgress = lower === "c" ? "c" : "";
      }
    }

    const arcLower = key.length === 1 ? key.toLowerCase() : "";
    if (arcLower && !this.arcCodeUsed) {
      const wantArc = EasterEggRegistry.ARC_CODE[this.arcCodeProgress.length];
      if (arcLower === wantArc) {
        this.arcCodeProgress += arcLower;
        if (this.arcCodeProgress === EasterEggRegistry.ARC_CODE) {
          this.arcCodeProgress = "";
          localStorage.setItem("og_arc_code", "1");
          this.arcCodeUsed = true;
          return { message: "ARC — V-formation bonus +12 tokens!", tokens: 12 };
        }
      } else {
        this.arcCodeProgress = arcLower === "a" ? "a" : "";
      }
    }
    return null;
  }

  activateKonamiRun(): void {
    this.konamiUsedThisRun = true;
    this.konamiBuffTimer = 30;
  }

  onScore(score: number): EasterEggToast | null {
    if (score === 8008) this.goldUfoPending = true;
    if (!this.score1337Done && score === 1337) {
      this.score1337Done = true;
      localStorage.setItem("og_score_1337", "1");
      return { message: "LEET SCORE — +15 tokens!", tokens: 15 };
    }
    if (!this.score50000Done && score >= 50000) {
      this.score50000Done = true;
      localStorage.setItem("og_score_50000", "1");
      return { message: "HIGH ROLLER — +50 tokens!", tokens: 50 };
    }
    return null;
  }

  onKill(): EasterEggToast | null {
    this.totalKills++;
    if (this.totalKills >= 100) this.secretInitials = true;

    if (!this.kills50Done && this.totalKills >= 50) {
      this.kills50Done = true;
      localStorage.setItem("og_kills_50", "1");
      return { message: "50 KILLS — +10 tokens!", tokens: 10 };
    }
    if (!this.kills250Done && this.totalKills >= 250) {
      this.kills250Done = true;
      localStorage.setItem("og_kills_250", "1");
      return { message: "250 KILLS — Phantom hull schematic!", tokens: 30 };
    }
    return null;
  }

  onFormationClear(
    formation: string,
    flawless: boolean,
    arcCodeActive: boolean
  ): EasterEggToast | null {
    if (flawless && formation === "diamond" && !this.diamondFlawlessDone) {
      this.diamondFlawlessDone = true;
      localStorage.setItem("og_secret_diamond", "1");
      return { message: "Diamond doctrine — flawless clear! +8 ◎", tokens: 8 };
    }
    if (flawless && formation === "pincer" && !this.pincerFlawlessDone) {
      this.pincerFlawlessDone = true;
      localStorage.setItem("og_secret_pincer", "1");
      return { message: "Pincer broken — no hits! +10 ◎", tokens: 10 };
    }
    if (
      flawless &&
      arcCodeActive &&
      formation === "classic" &&
      !this.vFormationDone
    ) {
      this.vFormationDone = true;
      localStorage.setItem("og_secret_vformation", "1");
      return { message: "V-formation unlocked — ARC synergy! +15 ◎", tokens: 15 };
    }
    return null;
  }

  onBossFlawless(kind: "mini" | "big", phase2Reached: boolean): EasterEggToast | null {
    if (kind === "mini" && !this.miniBossFlawlessDone) {
      this.miniBossFlawlessDone = true;
      localStorage.setItem("og_secret_miniboss_nd", "1");
      return { message: "Mini boss — untouched! +6 ◎", tokens: 6 };
    }
    if (kind === "big" && phase2Reached && !this.bigBossPhase2Done) {
      this.bigBossPhase2Done = true;
      localStorage.setItem("og_secret_bigboss_p2", "1");
      return { message: "Phase II takedown! +12 ◎", tokens: 12 };
    }
    return null;
  }

  isArcCodeActive(): boolean {
    return this.arcCodeUsed;
  }

  onLevelComplete(level: number): EasterEggToast | null {
    if (!this.wave7ToastDone && level === 7) {
      this.wave7ToastDone = true;
      return { message: "Lucky 7 — bonus tokens!", tokens: 7 };
    }
    return null;
  }

  onBossDefeat(level: number, isBigBoss: boolean): EasterEggToast | null {
    if (isBigBoss) {
      if (!this.bigBoss6Done && level === 6) {
        this.bigBoss6Done = true;
        localStorage.setItem("og_bigboss_6", "1");
        return { message: "Boss milestone L6 — +20 tokens!", tokens: 20 };
      }
      if (!this.bigBoss12Done && level === 12) {
        this.bigBoss12Done = true;
        localStorage.setItem("og_bigboss_12", "1");
        return { message: "Final boss fallen — +40 tokens!", tokens: 40 };
      }
    } else {
      if (!this.miniBoss3Done && level === 3) {
        this.miniBoss3Done = true;
        localStorage.setItem("og_miniboss_3", "1");
        return { message: "Mini boss L3 — +8 tokens!", tokens: 8 };
      }
      if (!this.miniBoss9Done && level === 9) {
        this.miniBoss9Done = true;
        localStorage.setItem("og_miniboss_9", "1");
        return { message: "Mini boss L9 — +12 tokens!", tokens: 12 };
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
  }

  isInvulnBuff(): boolean {
    return this.konamiBuffTimer > 0;
  }
}
