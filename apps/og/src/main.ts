import "./styles.css";
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
  router.clear();
  gameScreen = new GameScreen({
    repo,
    difficulty,
    gameMode: mode,
    continueRun,
    onGameOver: (score, wave) => {
      gameScreen = null;
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
    onExitToMenu: showMenu,
  });
  gameScreen.start();
}

showMenu();
