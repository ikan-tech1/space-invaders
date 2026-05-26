export class EasterEggRegistry {
  sector42Pending = false;
  gravityKing = false;

  onSectorBanner(level: number): void {
    if (level === 42) this.sector42Pending = true;
  }

  onEliteSingularityKill(): void {
    this.gravityKing = true;
  }

  consumeWeaponCoreDrop(): boolean {
    if (!this.sector42Pending) return false;
    this.sector42Pending = false;
    return true;
  }
}
