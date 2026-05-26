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
  score1337Done = false;
  score50000Done = false;
  kills50Done = false;
  kills250Done = false;
  wave7ToastDone = false;

  constructor(savedKills = 0, secretInitials = false) {
    this.totalKills = savedKills;
    this.secretInitials = secretInitials;
    this.coinCodeUsed = localStorage.getItem("og_coin_code") === "1";
    this.score1337Done = localStorage.getItem("og_score_1337") === "1";
    this.score50000Done = localStorage.getItem("og_score_50000") === "1";
    this.kills50Done = localStorage.getItem("og_kills_50") === "1";
    this.kills250Done = localStorage.getItem("og_kills_250") === "1";
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

  onLevelComplete(level: number): EasterEggToast | null {
    if (!this.wave7ToastDone && level === 7) {
      this.wave7ToastDone = true;
      return { message: "Lucky 7 — bonus tokens!", tokens: 7 };
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
