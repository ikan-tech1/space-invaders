import { Starfield, type StarfieldMode } from "./Starfield";

let starfield: Starfield | null = null;

export type UiStage = "menu" | "game";

export function initSpaceBackdrop(): Starfield {
  const canvas = document.getElementById("starfield-canvas") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Missing #starfield-canvas");
  starfield = new Starfield(canvas);
  setUiStage("menu");
  starfield.start();
  return starfield;
}

export function setUiStage(stage: UiStage): void {
  document.body.dataset.uiStage = stage;
  starfield?.setMode(stage === "game" ? "game" : "menu");
}

/** @deprecated Use setUiStage */
export function setSpaceBackdropMode(mode: Exclude<StarfieldMode, "static">): void {
  setUiStage(mode === "game" ? "game" : "menu");
}

export function getSpaceBackdrop(): Starfield | null {
  return starfield;
}
