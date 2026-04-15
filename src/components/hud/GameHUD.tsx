// Design Ref: §5.1 — 게임 HUD (골드, 체력, 웨이브) + 나가기 버튼
"use client";

import { useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import SpeedControls from "./SpeedControls";
import WaveIndicator from "./WaveIndicator";

export default function GameHUD() {
  const gold = useGameStore((s) => s.gold);
  const baseHealth = useGameStore((s) => s.baseHealth);
  const maxBaseHealth = useGameStore((s) => s.maxBaseHealth);
  const enemiesKilled = useGameStore((s) => s.enemiesKilled);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const healthPercent = (baseHealth / maxBaseHealth) * 100;
  const healthColor =
    healthPercent > 50 ? "bg-green-500" : healthPercent > 25 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-gray-900/80 text-white z-10">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-400 text-sm">골드</span>
          <span className="font-bold text-lg">{gold}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-red-400 text-sm">체력</span>
          <div className="w-28 h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${healthColor} transition-all duration-300`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <span className="text-xs">{baseHealth}/{maxBaseHealth}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 text-sm">처치</span>
          <span className="text-sm">{enemiesKilled}</span>
        </div>
      </div>

      <WaveIndicator />
      <div className="flex items-center gap-2">
        <SpeedControls />
        <button
          onClick={() => setShowQuitConfirm(true)}
          className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs font-bold"
          title="스테이지 포기하고 메뉴로"
        >나가기</button>
      </div>

      {showQuitConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-2 text-red-400">스테이지를 포기하시겠습니까?</h2>
            <p className="text-sm text-gray-400 mb-4">진행 중인 골드/타워는 사라지며 보상을 받지 못합니다.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded font-bold"
              >계속 플레이</button>
              <Link
                href="/"
                className="px-5 py-2 bg-red-700 hover:bg-red-600 rounded font-bold"
              >메뉴로 나가기</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
