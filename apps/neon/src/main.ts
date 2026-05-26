import "./styles.css";
import type { Difficulty, GameMode } from "./config";
import { LocalStorageRepo } from "./storage/LocalStorageRepo";
import { GameScreen } from "./screens/GameScreen";
import { GameOverScreen } from "./screens/GameOverScreen";
import {
  HangarScreen,
  createArmoryScreen,
  createChallengesScreen,
  createCodexScreen,
  createModulesScreen,
} from "./screens/HangarScreen";
import { ScreenRouter } from "./screens/ScreenRouter";
import {
  createBriefingScreen,
  createRecordsScreen,
  createSettingsScreen,
} from "./screens/SubScreens";

const repo = new LocalStorageRepo();
let difficulty: Difficulty = "classic";
let gameScreen: GameScreen | null = null;

const root = document.getElementById("screen-root")!;
const router = new ScreenRouter(root);

function showHangar(): void {
  router.show(
    new HangarScreen({
      repo,
      get difficulty() {
        return difficulty;
      },
      onDifficultyChange: (d) => {
        difficulty = d;
      },
      onPlay: (cont, mode) => startGame(cont, mode),
      onNav: (s) => {
        if (s === "settings") router.show(createSettingsScreen(repo, showHangar));
        if (s === "records") router.show(createRecordsScreen(repo, showHangar));
        if (s === "armory") router.show(createArmoryScreen(showHangar));
        if (s === "codex") router.show(createCodexScreen(showHangar));
        if (s === "modules") router.show(createModulesScreen(showHangar));
        if (s === "challenges") router.show(createChallengesScreen(showHangar));
        if (s === "howToPlay") router.show(createBriefingScreen(showHangar));
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
    onGameOver: (score, wave, maxTier) => {
      gameScreen = null;
      router.show(
        new GameOverScreen({
          repo,
          score,
          wave,
          maxTier,
          onRetry: () => startGame(false, mode),
          onMenu: showHangar,
        })
      );
    },
  });
  gameScreen.start();
}

showHangar();
