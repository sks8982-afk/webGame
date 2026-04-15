// Design Ref: §2.1 — PixiJS Canvas mount, system registration, game wiring
"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useUIStore } from "@/stores/uiStore";
import { GAME_WIDTH, GAME_HEIGHT } from "@/lib/constants";

interface GameCanvasProps {
  readonly stageId: number;
  readonly gameRef?: React.MutableRefObject<import("@/game/core/Game").Game | null>;
}

export default function GameCanvas({ stageId, gameRef: externalGameRef }: GameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const internalGameRef = useRef<import("@/game/core/Game").Game | null>(null);
  const gameRef = externalGameRef ?? internalGameRef;
  const gameSpeed = useGameStore((s) => s.gameSpeed);
  const gameState = useGameStore((s) => s.gameState);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("게임 엔진 로딩 중...");

  useEffect(() => {
    let aborted = false;
    let gameInstance: import("@/game/core/Game").Game | null = null;
    let unsubscribe: (() => void) | null = null;

    async function init() {
      if (!canvasRef.current) return;

      setLoadingText("게임 엔진 로딩 중...");
      const { Game } = await import("@/game/core/Game");
      const { AssetLoader } = await import("@/game/core/AssetLoader");
      const { MapRenderer } = await import("@/game/rendering/MapRenderer");
      const { EnemySystem } = await import("@/game/systems/EnemySystem");
      const { TowerSystem } = await import("@/game/systems/TowerSystem");
      const { ProjectileSystem } = await import("@/game/systems/ProjectileSystem");
      const { CombatSystem } = await import("@/game/systems/CombatSystem");
      const { WaveSystem } = await import("@/game/systems/WaveSystem");
      const { EconomySystem } = await import("@/game/systems/EconomySystem");
      const { RenderSystem } = await import("@/game/systems/RenderSystem");
      const { SkillSystem } = await import("@/game/systems/SkillSystem");

      if (aborted) return;

      setLoadingText("이미지 로딩 중...");
      await AssetLoader.loadAll();
      if (aborted) return;

      setLoadingText("스테이지 준비 중...");

      const game = new Game();
      await game.init(canvasRef.current!, GAME_WIDTH, GAME_HEIGHT);
      if (aborted) { game.destroy(); return; }

      const stageData = AssetLoader.getStageData(stageId);
      if (!stageData) { game.destroy(); return; }

      // Reset game state
      // Import player store for difficulty
      const { usePlayerStore } = await import("@/stores/playerStore");
      const difficulty = usePlayerStore.getState().difficulty;
      (globalThis as unknown as { __TD_DIFFICULTY: string }).__TD_DIFFICULTY = difficulty;

      // Apply permanent upgrade: starting gold
      const startGoldUpgrade = usePlayerStore.getState().permanentUpgrades["starting_gold"] ?? 0;
      const startGoldBonus = [0, 50, 100, 200, 350, 500][startGoldUpgrade] ?? 0;

      // Base health upgrade
      const baseHealthUpgrade = usePlayerStore.getState().permanentUpgrades["base_health"] ?? 0;
      const baseHealthBonus = [0, 5, 10, 15, 20, 25][baseHealthUpgrade] ?? 0;

      useGameStore.getState().resetGame(
        stageData.startingGold + startGoldBonus,
        stageData.baseHealth + baseHealthBonus
      );
      game.loadStage(stageData);

      // Register systems
      const economySystem = new EconomySystem();
      const enemySystem = new EnemySystem();
      const towerSystem = new TowerSystem();
      const projectileSystem = new ProjectileSystem();
      const combatSystem = new CombatSystem();
      const waveSystem = new WaveSystem();
      const skillSystem = new SkillSystem();
      const renderSystem = new RenderSystem();

      game.addSystem(economySystem);
      game.addSystem(waveSystem);
      game.addSystem(skillSystem);
      game.addSystem(enemySystem);
      game.addSystem(towerSystem);
      game.addSystem(projectileSystem);
      game.addSystem(combatSystem);
      game.addSystem(renderSystem);

      economySystem.setInitialGold(stageData.startingGold + startGoldBonus);
      enemySystem.setMapManager(game.mapManager);

      // Draw map (grid-based free placement)
      const mapRenderer = new MapRenderer();
      game.getStage().addChildAt(mapRenderer.container, 0);

      mapRenderer.drawMap(stageData.path, game.mapManager, (col, row) => {
        const selectedTowerId = useUIStore.getState().selectedTowerId;
        if (!selectedTowerId) return;
        if (!game.mapManager.canPlaceTower(col, row)) return;

        const worldPos = game.mapManager.cellToWorld(col, row);
        const result = towerSystem.placeTower(selectedTowerId, worldPos);
        if (result) {
          game.mapManager.placeTower(col, row);
          useUIStore.getState().selectTowerToBuild(null);
        }
      });

      // Wave management
      waveSystem.startStage(stageData);
      setTimeout(() => {
        if (!aborted) waveSystem.startNextWave();
      }, 2000);

      unsubscribe = useGameStore.subscribe((state, prev) => {
        if (state.gameState === "wave_complete" && prev.gameState !== "wave_complete") {
          setTimeout(() => {
            if (!aborted && !waveSystem.isStageComplete()) {
              waveSystem.startNextWave();
              useGameStore.getState().setGameState("playing");
            }
          }, 3000);
        }
      });

      // Store cleanup in destroy
      const origDestroy = game.destroy.bind(game);
      game.destroy = () => {
        unsubscribe?.();
        mapRenderer.destroy();
        origDestroy();
      };

      game.start();
      gameInstance = game;
      gameRef.current = game;
      setLoading(false);
    }

    init().catch((err) => {
      console.error("Game init failed:", err);
      setLoadingText("로딩 실패. 새로고침해주세요.");
    });

    return () => {
      aborted = true;
      if (gameInstance) {
        gameInstance.destroy();
        gameInstance = null;
        gameRef.current = null;
      }
      // Clear leftover canvas elements
      if (canvasRef.current) {
        canvasRef.current.innerHTML = "";
      }
    };
  }, [stageId]);

  // Sync game speed
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.setSpeed(gameSpeed);
    }
  }, [gameSpeed]);

  // Sync pause state
  useEffect(() => {
    if (!gameRef.current) return;
    if (gameState === "paused") {
      gameRef.current.gameLoop.pause();
    } else if (gameState === "playing") {
      gameRef.current.gameLoop.resume();
    }
  }, [gameState]);

  return (
    <div className="relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
      <div
        ref={canvasRef}
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        className="border-2 border-gray-700 bg-gray-900 overflow-hidden"
      />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 z-30">
          {/* Animated spinner */}
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
            <div className="absolute inset-0 rounded-full border-4 border-t-yellow-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <div className="text-yellow-400 text-lg font-bold mb-1">로딩 중</div>
          <div className="text-gray-400 text-sm animate-pulse">{loadingText}</div>
          <div className="mt-6 text-gray-600 text-xs max-w-md text-center px-4">
            처음 로딩 시 이미지와 BGM 등 에셋을 모두 받아오는 데 시간이 걸릴 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}
