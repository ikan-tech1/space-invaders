import { setUiStage } from "../render/spaceBackdrop";

export type ScreenId =
  | "menu"
  | "sectorMap"
  | "game"
  | "gameOver"
  | "settings"
  | "highScores"
  | "howToPlay"
  | "challenges"
  | "dailyOps"
  | "gameModes"
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
    setUiStage("menu");
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
