export class KeyboardControls {
  private keys = new Set<string>();

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Space"].includes(e.key)) {
      e.preventDefault();
    }
    this.keys.add(e.key.toLowerCase());
    if (e.key === " ") this.keys.add("space");
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
    if (e.key === " ") this.keys.delete("space");
  };

  getMoveAxis(): number {
    let axis = 0;
    if (this.keys.has("arrowleft") || this.keys.has("a")) axis -= 1;
    if (this.keys.has("arrowright") || this.keys.has("d")) axis += 1;
    return axis;
  }

  isFirePressed(): boolean {
    return this.keys.has(" ") || this.keys.has("space");
  }

  isPausePressed(): boolean {
    return this.keys.has("p");
  }

  isMenuPressed(): boolean {
    return this.keys.has("escape");
  }

  consumePause(): boolean {
    if (this.isPausePressed()) {
      this.keys.delete("p");
      return true;
    }
    return false;
  }
}
