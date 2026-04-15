"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { loadGame } from "@/features/save/saveManager";

type AchievementDef = {
  id: string;
  name: string;
  description: string;
  condition: { type: string; value: number };
  reward: { sp: number; gems: number };
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementDef[]>([]);
  const [loaded, setLoaded] = useState(false);
  const unlockedAchievements = usePlayerStore((s) => s.unlockedAchievements);
  const stats = usePlayerStore((s) => s.stats);
  const sp = usePlayerStore((s) => s.starPoints);
  const gems = usePlayerStore((s) => s.gems);
  const stageProgress = usePlayerStore((s) => s.stageProgress);
  const weapons = usePlayerStore((s) => s.weapons);

  useEffect(() => {
    loadGame();
    fetch("/data/achievements.json")
      .then((r) => r.json())
      .then((d) => { setAchievements(Object.values(d)); setLoaded(true); });
  }, []);

  if (!loaded) return null;

  const completedStages = stageProgress.filter((p) => p.cleared).length;
  const threeStarStages = stageProgress.filter((p) => (p.bestStars ?? 0) >= 3).length;
  const maxEnhance = Math.max(0, ...weapons.map((w) => w.enhanceLevel));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">업적 & 통계</h1>
          <Link href="/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">돌아가기</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="클리어 스테이지" value={`${completedStages}/25`} color="text-blue-400" />
          <StatCard label="3성 클리어" value={`${threeStarStages}`} color="text-yellow-400" />
          <StatCard label="총 처치" value={stats.totalKills.toLocaleString()} color="text-red-400" />
          <StatCard label="총 골드" value={stats.totalGold.toLocaleString()} color="text-yellow-300" />
          <StatCard label="획득 SP" value={stats.totalSpEarned.toLocaleString()} color="text-purple-400" />
          <StatCard label="최대 강화" value={`+${maxEnhance}`} color="text-orange-400" />
          <StatCard label="무한 최고" value={`W ${stats.highestEndlessWave}`} color="text-pink-400" />
          <StatCard label="현재 보유 SP" value={`${sp} / 보석 ${gems}`} color="text-green-400" />
        </div>

        {/* Achievements */}
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a) => {
            const isUnlocked = unlockedAchievements.includes(a.id);
            return (
              <div key={a.id} className={`p-4 rounded-lg border-2 ${
                isUnlocked ? "border-yellow-600 bg-yellow-900/20" : "border-gray-700 bg-gray-800/50 opacity-70"
              }`}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold ${isUnlocked ? "text-yellow-300" : "text-gray-400"}`}>
                    {isUnlocked ? "🏆" : "🔒"} {a.name}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {isUnlocked ? "달성" : "미달성"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{a.description}</p>
                <div className="flex gap-2 text-[10px]">
                  {a.reward.sp > 0 && <span className="text-yellow-300">+{a.reward.sp} SP</span>}
                  {a.reward.gems > 0 && <span className="text-cyan-300">+{a.reward.gems} 보석</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
