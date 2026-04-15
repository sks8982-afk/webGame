// Game page with Canvas + HUD + TowerPanel + result screen + all combat UI
"use client";

import dynamic from "next/dynamic";
import GameHUD from "@/components/hud/GameHUD";
import TowerPanel from "@/components/hud/TowerPanel";
import TowerInfoPanel from "@/components/hud/TowerInfoPanel";
import SkillBar from "@/components/hud/SkillBar";
import NextWaveButton from "@/components/hud/NextWaveButton";
import HotkeyHelp from "@/components/hud/HotkeyHelp";
import InGameSettings from "@/components/hud/InGameSettings";
import { bgm, pickTrackForContext } from "@/features/audio/bgmManager";
import { sfx } from "@/features/audio/sfxManager";
import { useGameStore } from "@/stores/gameStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useUIStore } from "@/stores/uiStore";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { saveGame, loadGame } from "@/features/save/saveManager";
import type { StarRating, TowerId } from "@/types/common";
import type { Game } from "@/game/core/Game";
import { checkAchievements } from "@/features/achievements/check";

const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), { ssr: false });

function GameContent() {
  const searchParams = useSearchParams();
  const stageId = Number(searchParams.get("stage") || "1");
  const endless = searchParams.get("endless") === "1";
  const gameState = useGameStore((s) => s.gameState);
  const livesLost = useGameStore((s) => s.livesLost);
  const enemiesKilled = useGameStore((s) => s.enemiesKilled);
  const endlessWave = useGameStore((s) => s.endlessWave);
  const currentWave = useGameStore((s) => s.currentWave);
  const rewardGiven = useRef(false);

  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    loadGame();
    useGameStore.getState().setEndless(endless);

    // Pick stage BGM based on boss/normal
    const bossStages = [5, 10, 15, 20, 25];
    const isBoss = bossStages.includes(stageId);
    bgm.play(pickTrackForContext({
      type: isBoss ? "boss" : "normal",
      stageId,
    }));
  }, [endless, stageId]);

  // Give rewards on stage clear (not endless)
  useEffect(() => {
    if (gameState !== "stage_clear" || rewardGiven.current) return;
    rewardGiven.current = true;
    sfx.play("stage_clear");

    const stars: StarRating = livesLost === 0 ? 3 : livesLost <= 5 ? 2 : 1;
    const baseReward = 20 + stageId * 10;
    const spReward = baseReward * stars;
    const gemReward = stageId % 5 === 0 ? 100 : stageId >= 3 ? 15 : 5;

    const ps = usePlayerStore.getState();
    ps.addStarPoints(spReward);
    ps.incrementStat("totalSpEarned", spReward);
    ps.addGems(gemReward);
    ps.updateStageProgress(stageId, stars);
    checkAchievements();
    saveGame();
  }, [gameState, livesLost, stageId]);

  // Game over sound
  useEffect(() => {
    if (gameState === "game_over") sfx.play("game_over");
  }, [gameState]);

  // Game over in endless: record highest wave
  useEffect(() => {
    if (gameState === "game_over" && endless) {
      const wave = endlessWave + currentWave;
      usePlayerStore.getState().updateHighestEndlessWave(wave);
      checkAchievements();
      saveGame();
    }
  }, [gameState, endless, endlessWave, currentWave]);

  // Keyboard shortcuts for tower selection (1-8)
  useEffect(() => {
    const towerKeys: Record<string, TowerId> = {
      "1": "archer", "2": "mage", "3": "cannon", "4": "frost",
      "5": "poison", "6": "tesla", "7": "bomb", "8": "support",
    };
    const handler = (e: KeyboardEvent) => {
      const tid = towerKeys[e.key];
      if (tid) {
        const ui = useUIStore.getState();
        ui.selectTowerToBuild(ui.selectedTowerId === tid ? null : tid);
      } else if (e.key === "Escape") {
        useUIStore.getState().clearSelection();
      } else if (e.key === " ") {
        // Space = pause/resume
        e.preventDefault();
        const gs = useGameStore.getState().gameState;
        if (gs === "playing") useGameStore.getState().setGameState("paused");
        else if (gs === "paused") useGameStore.getState().setGameState("playing");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const stars: StarRating = livesLost === 0 ? 3 : livesLost <= 5 ? 2 : 1;
  const spReward = (10 + stageId * 5) * stars;

  return (
    <div className="flex items-center justify-center min-h-screen bg-black overflow-hidden">
      <div
        className="relative origin-center"
        style={{
          width: 1280, height: 720,
          transform: "scale(min(100vw / 1280, 100vh / 720))",
        }}
      >
        <GameCanvas stageId={stageId} gameRef={gameRef} />
        <GameHUD />
        <TowerPanel />
        <TowerInfoPanel gameRef={gameRef} />
        <SkillBar gameRef={gameRef} />
        <NextWaveButton gameRef={gameRef} />
        <HotkeyHelp />
        <InGameSettings />

        {endless && (
          <div className="absolute top-16 left-4 px-3 py-1 bg-purple-700/80 rounded text-xs font-bold z-10">
            무한 모드 | 누적 웨이브 {endlessWave + currentWave}
          </div>
        )}

        {gameState === "game_over" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
            <div className="text-center bg-gray-900 p-8 rounded-xl border-2 border-red-600">
              <h2 className="text-4xl font-bold text-red-500 mb-2">패배!</h2>
              <p className="text-gray-400 mb-4">처치한 적: {enemiesKilled}</p>
              {endless && <p className="text-purple-300 mb-2">도달 웨이브: {endlessWave + currentWave}</p>}
              <div className="flex gap-3 justify-center">
                <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">재도전</button>
                <button onClick={() => (window.location.href = "/")} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold">메뉴</button>
              </div>
            </div>
          </div>
        )}

        {gameState === "stage_clear" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
            <div className="text-center bg-gray-900 p-8 rounded-xl border-2 border-yellow-500">
              <h2 className="text-4xl font-bold text-yellow-400 mb-2">스테이지 클리어!</h2>
              <div className="text-3xl mb-3">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</div>
              <div className="space-y-1 text-sm text-gray-300 mb-4">
                <p>처치한 적: {enemiesKilled}</p>
                <p className="text-yellow-400">+{spReward} 스타 포인트</p>
                {stageId % 5 === 0 && <p className="text-cyan-400">+100 보석 (보스 보상)</p>}
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => (window.location.href = "/")} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold">메뉴</button>
                <button onClick={() => (window.location.href = `/game?stage=${stageId + 1}`)} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">다음 스테이지</button>
                <button onClick={() => (window.location.href = "/shop")} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold">상점</button>
                <button onClick={() => (window.location.href = `/game?stage=${stageId}&endless=1`)} className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-bold">무한모드</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black text-white">로딩중...</div>}>
      <GameContent />
    </Suspense>
  );
}
