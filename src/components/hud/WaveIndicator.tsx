"use client";

import { useGameStore } from "@/stores/gameStore";

export default function WaveIndicator() {
  const currentWave = useGameStore((s) => s.currentWave);
  const totalWaves = useGameStore((s) => s.totalWaves);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-blue-400 text-sm">웨이브</span>
      <span className="font-bold">{currentWave} / {totalWaves}</span>
    </div>
  );
}
