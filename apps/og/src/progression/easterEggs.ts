export class EasterEggRegistry {
  konamiProgress: string[] = [];
  konamiUsedThisRun = false;
  konamiBuffTimer = 0;
  goldUfoPending = false;
  totalKills = 0;
  secretInitials = false;

  constructor(savedKills = 0, secretInitials = false) {
    this.totalKills = savedKills;
    this.secretInitials = secretInitials;
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

  onMenuKey(key: string): boolean {
    const expected = EasterEggRegistry.KONAMI[this.konamiProgress.length];
    if (key === expected) {
      this.konamiProgress.push(key);
      if (this.konamiProgress.length === EasterEggRegistry.KONAMI.length) {
        this.konamiProgress = [];
        return true;
      }
    } else {
      this.konamiProgress = key === EasterEggRegistry.KONAMI[0] ? [key] : [];
    }
    return false;
  }

  activateKonamiRun(): void {
    this.konamiUsedThisRun = true;
    this.konamiBuffTimer = 30;
  }

  onScore(score: number): void {
    if (score === 8008) this.goldUfoPending = true;
  }

  onKill(): void {
    this.totalKills++;
    if (this.totalKills >= 100) this.secretInitials = true;
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
