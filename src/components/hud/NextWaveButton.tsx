// Button to skip wave delay or start next wave early for bonus gold
"use client";

import { useEffect, useState } from "react";

interface Props {
  readonly gameRef: React.MutableRefObject<import("@/game/core/Game").Game | null>;
}

export default function NextWaveButton({ gameRef }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(i);
  }, []);

  const game = gameRef.current;
  if (!game) return null;
  const ws = game.getSystem<import("@/game/systems/WaveSystem").WaveSystem>("WaveSystem");
  if (!ws) return null;

  const waiting = ws.isWaitingForWave();
  const timer = ws.getWaveDelayTimer();
  const active = ws.isWaveActive();
  const done = ws.isStageComplete();

  if (done) return null;

  const onClick = () => {
    if (waiting) ws.skipWaveDelay();
    else if (!active) ws.forceStartNextWave();
  };

  const label = waiting ? `웨이브 스킵 (+${Math.max(10, Math.floor(timer * 10))}G)` :
                !active ? `즉시 다음 웨이브 (+${50 + ws.getCurrentWave() * 5}G)` : null;

  if (!label) return null;

  return (
    <button
      onClick={onClick}
      className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-bold z-10 border-2 border-green-400 shadow-lg animate-pulse"
    >
      ⏭ {label}
    </button>
  );
}
