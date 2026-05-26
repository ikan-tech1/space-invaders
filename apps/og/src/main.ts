import "./styles.css";
import { initSpaceBackdrop, setSpaceBackdropMode } from "./render/spaceBackdrop";
import type { Difficulty, GameMode } from "./config";
import { LocalStorageRepo } from "./storage/LocalStorageRepo";
import { GameScreen } from "./screens/GameScreen";
import { GameOverScreen } from "./screens/GameOverScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { ScreenRouter } from "./screens/ScreenRouter";
import {
  createArmoryScreen,
  createChallengesScreen,
  createHighScoresScreen,
  createHowToPlayScreen,
  createSettingsScreen,
} from "./screens/SubScreens";
import { showSplashIfNeeded } from "./ui/splashScreen";

initSpaceBackdrop();

const repo = new LocalStorageRepo();
let difficulty: Difficulty = "classic";
let gameScreen: GameScreen | null = null;

const root = document.getElementById("screen-root")!;
const router = new ScreenRouter(root);

function showMenu(): void {
  router.show(
    new MenuScreen({
      repo,
      get difficulty() {
        return difficulty;
      },
      onDifficultyChange: (d) => {
        difficulty = d;
      },
      onPlay: (continueRun, mode) => startGame(continueRun, mode),
      onNavigate: (screen) => {
        if (screen === "settings") router.show(createSettingsScreen(repo, showMenu));
        if (screen === "highScores") router.show(createHighScoresScreen(repo, showMenu));
        if (screen === "howToPlay") router.show(createHowToPlayScreen(showMenu));
        if (screen === "challenges") router.show(createChallengesScreen(showMenu));
        if (screen === "armory") router.show(createArmoryScreen(showMenu));
      },
    })
  );
}

function startGame(continueRun: boolean, mode: GameMode): void {
  setSpaceBackdropMode("game");
  router.clear();
  gameScreen = new GameScreen({
    repo,
    difficulty,
    gameMode: mode,
    continueRun,
    onGameOver: (score, wave) => {
      gameScreen = null;
      setSpaceBackdropMode("menu");
      router.show(
        new GameOverScreen({
          repo,
          score,
          wave,
          onRetry: () => startGame(false, mode),
          onMenu: showMenu,
        })
      );
    },
    onExitToMenu: () => {
      setSpaceBackdropMode("menu");
      showMenu();
    },
  });
  gameScreen.start();
}

showSplashIfNeeded(showMenu);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
