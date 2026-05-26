import { Starfield, type StarfieldMode } from "./Starfield";

let starfield: Starfield | null = null;

export function initSpaceBackdrop(): Starfield {
  const canvas = document.getElementById("starfield-canvas") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Missing #starfield-canvas");
  starfield = new Starfield(canvas);
  starfield.setMode("menu");
  starfield.start();
  return starfield;
}

export function setSpaceBackdropMode(mode: Exclude<StarfieldMode, "static">): void {
  starfield?.setMode(mode);
}

export function getSpaceBackdrop(): Starfield | null {
  return starfield;
}
