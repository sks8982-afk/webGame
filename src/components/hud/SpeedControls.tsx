"use client";

import { useGameStore } from "@/stores/gameStore";
import type { GameSpeed } from "@/types/common";

const SPEEDS: GameSpeed[] = [1, 2, 3, 5];

export default function SpeedControls() {
  const gameSpeed = useGameStore((s) => s.gameSpeed);
  const gameState = useGameStore((s) => s.gameState);
  const setGameSpeed = useGameStore((s) => s.setGameSpeed);
  const setGameState = useGameStore((s) => s.setGameState);

  const togglePause = () => {
    if (gameState === "paused") {
      setGameState("playing");
    } else if (gameState === "playing") {
      setGameState("paused");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePause}
        className={`px-3 py-1 rounded text-sm font-bold ${
          gameState === "paused"
            ? "bg-yellow-600 text-white"
            : "bg-gray-700 hover:bg-gray-600 text-white"
        }`}
      >
        {gameState === "paused" ? "재개" : "일시정지"}
      </button>
      {SPEEDS.map((speed) => (
        <button
          key={speed}
          onClick={() => setGameSpeed(speed)}
          className={`px-3 py-1 rounded text-sm font-bold ${
            gameSpeed === speed
              ? "bg-blue-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
          }`}
        >
          {speed}배속
        </button>
      ))}
    </div>
  );
}
