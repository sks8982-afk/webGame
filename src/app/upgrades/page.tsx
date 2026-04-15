// Permanent upgrade page — SP sink for late game
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { loadGame, saveGame } from "@/features/save/saveManager";
import {
  GLOBAL_UPGRADES,
  TOWER_UPGRADES,
  type PermanentUpgrade,
} from "@/features/permanent/upgrades";

export default function UpgradesPage() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"global" | "tower">("global");
  const sp = usePlayerStore((s) => s.starPoints);
  const getLevel = usePlayerStore((s) => s.getPermanentLevel);
  const upgrade = usePlayerStore((s) => s.upgradePermanent);
  const removeSP = usePlayerStore((s) => s.removeStarPoints);

  useEffect(() => { loadGame(); setLoaded(true); }, []);
  if (!loaded) return null;

  const upgrades = tab === "global" ? GLOBAL_UPGRADES : TOWER_UPGRADES;

  const tryUpgrade = (u: PermanentUpgrade) => {
    const lv = getLevel(u.id);
    if (lv >= u.maxLevel) return;
    const cost = u.costPerLevel[lv];
    if (!removeSP(cost)) return;
    upgrade(u.id);
    saveGame();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-300">영구 강화</h1>
          <div className="flex gap-4 items-center">
            <span className="text-yellow-300 text-sm">SP: {sp}</span>
            <Link href="/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">돌아가기</Link>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("global")}
            className={`px-5 py-2 rounded-lg font-bold border-2 ${
              tab === "global" ? "border-purple-400 text-purple-400 bg-gray-800" : "border-gray-700 text-gray-400"
            }`}
          >전역 강화</button>
          <button
            onClick={() => setTab("tower")}
            className={`px-5 py-2 rounded-lg font-bold border-2 ${
              tab === "tower" ? "border-cyan-400 text-cyan-400 bg-gray-800" : "border-gray-700 text-gray-400"
            }`}
          >타워별 강화</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {upgrades.map((u) => {
            const lv = getLevel(u.id);
            const isMaxed = lv >= u.maxLevel;
            const cost = !isMaxed ? u.costPerLevel[lv] : 0;
            const currentValue = lv > 0 ? u.valuePerLevel[lv - 1] : 0;
            const nextValue = !isMaxed ? u.valuePerLevel[lv] : 0;
            const canAfford = sp >= cost;
            return (
              <div key={u.id} className={`p-4 rounded-lg border-2 ${
                isMaxed ? "border-green-700 bg-green-900/20" : "border-gray-700 bg-gray-800/50"
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{u.name}</h3>
                    <p className="text-xs text-gray-400">{u.description}</p>
                  </div>
                  <span className="text-xs text-gray-400">Lv.{lv}/{u.maxLevel}</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: u.maxLevel }).map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded ${i < lv ? "bg-purple-500" : "bg-gray-700"}`} />
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-green-400">현재: +{currentValue}{u.unit}</span>
                  {!isMaxed && <span className="text-cyan-400">다음: +{nextValue}{u.unit}</span>}
                </div>
                {isMaxed ? (
                  <div className="text-center text-green-400 text-sm font-bold">최대 강화 완료</div>
                ) : (
                  <button
                    onClick={() => tryUpgrade(u)}
                    disabled={!canAfford}
                    className="w-full py-1.5 rounded font-bold text-sm bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:opacity-50"
                  >강화 ({cost} SP)</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
