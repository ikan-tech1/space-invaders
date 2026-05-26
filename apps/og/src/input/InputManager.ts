import { KeyboardControls } from "./KeyboardControls";
import { TouchControls } from "./TouchControls";

export class InputManager {
  keyboard = new KeyboardControls();
  touch: TouchControls | null = null;

  bindTouch(moveEl: HTMLElement, fireEl: HTMLElement, pauseEl: HTMLElement, scale: number): void {
    this.touch = new TouchControls(moveEl, fireEl, pauseEl, scale);
  }

  getMoveAxis(): number {
    const k = this.keyboard.getMoveAxis();
    if (k !== 0) return k;
    return this.touch?.moveAxis ?? 0;
  }

  isFirePressed(): boolean {
    return this.keyboard.isFirePressed() || (this.touch?.firePressed ?? false);
  }

  consumePause(): boolean {
    return this.keyboard.consumePause() || (this.touch?.consumePause() ?? false);
  }

  isMenuPressed(): boolean {
    return this.keyboard.isMenuPressed();
  }

  destroy(): void {
    this.keyboard.destroy();
  }
}
