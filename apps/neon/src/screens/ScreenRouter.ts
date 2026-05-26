export type ScreenId =
  | "hangar"
  | "game"
  | "gameOver"
  | "settings"
  | "records"
  | "armory"
  | "howToPlay"
  | "modules"
  | "challenges"
  | "codex";

export interface Screen {
  id: ScreenId;
  mount(root: HTMLElement): void;
  unmount(): void;
}

export class ScreenRouter {
  private current: Screen | null = null;
  constructor(private root: HTMLElement) {}
  show(screen: Screen): void {
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
}
