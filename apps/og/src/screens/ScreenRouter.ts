export type ScreenId =
  | "menu"
  | "game"
  | "gameOver"
  | "settings"
  | "highScores"
  | "howToPlay"
  | "challenges"
  | "armory";

export interface Screen {
  id: ScreenId;
  mount(root: HTMLElement): void;
  unmount(): void;
}

export class ScreenRouter {
  private current: Screen | null = null;

  constructor(private root: HTMLElement) {}

  show(screen: Screen): void {
    if (this.current?.id === screen.id) return;
    this.current?.unmount();
    this.current = screen;
    this.root.innerHTML = "";
    screen.mount(this.root);
  }

  clear(): void {
    this.current?.unmount();
    this.current = null;
    this.root.innerHTML = "";
  }

  getCurrentId(): ScreenId | null {
    return this.current?.id ?? null;
  }
}
