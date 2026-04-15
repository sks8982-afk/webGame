"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { loadGame, saveGame } from "@/features/save/saveManager";
import { bgm, pickTrackForContext } from "@/features/audio/bgmManager";
import BgmControl from "@/components/ui/BgmControl";
import SplashScreen, { hasSeenSplash } from "@/components/ui/SplashScreen";

const STAGES = [
  { id: 1, name: "녹색 골짜기", boss: false }, { id: 2, name: "어둠의 숲", boss: false },
  { id: 3, name: "산길", boss: false }, { id: 4, name: "저주받은 늪", boss: false },
  { id: 5, name: "오크 요새", boss: true }, { id: 6, name: "얼어붙은 호수", boss: false },
  { id: 7, name: "유령의 묘지", boss: false }, { id: 8, name: "수정 동굴", boss: false },
  { id: 9, name: "드래곤 고갯길", boss: false }, { id: 10, name: "드래곤의 둥지", boss: true },
  { id: 11, name: "그림자 숲", boss: false }, { id: 12, name: "언데드 늪지", boss: false },
  { id: 13, name: "화산 분화구", boss: false }, { id: 14, name: "얼음 왕좌", boss: false },
  { id: 15, name: "리치왕의 영지", boss: true }, { id: 16, name: "사막 관문", boss: false },
  { id: 17, name: "황금 사원", boss: false }, { id: 18, name: "수정 숲", boss: false },
  { id: 19, name: "천공의 다리", boss: false }, { id: 20, name: "드래곤 로드의 둥지", boss: true },
  { id: 21, name: "어둠의 탑", boss: false }, { id: 22, name: "폐허의 성", boss: false },
  { id: 23, name: "망자의 계곡", boss: false }, { id: 24, name: "차원의 틈", boss: false },
  { id: 25, name: "혼돈 황제의 영역", boss: true },
];

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const sp = usePlayerStore((s) => s.starPoints);
  const gems = usePlayerStore((s) => s.gems);
  const difficulty = usePlayerStore((s) => s.difficulty);
  const setDifficulty = usePlayerStore((s) => s.setDifficulty);
  const getStageStars = usePlayerStore((s) => s.getStageStars);
  const stageProgress = usePlayerStore((s) => s.stageProgress);

  useEffect(() => {
    loadGame();
    setLoaded(true);
    // Only show splash once per session
    setShowSplash(!hasSeenSplash());
    // Start menu BGM
    bgm.play(pickTrackForContext({ type: "menu" }));
  }, []);

  const isUnlocked = (id: number): boolean =>
    id === 1 || stageProgress.some((p) => p.stageId === id - 1 && p.cleared);

  if (!loaded) return null;

  const changeDifficulty = (d: "easy" | "normal" | "hard") => {
    setDifficulty(d);
    saveGame();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showSplash && <SplashScreen onFinished={() => setShowSplash(false)} />}
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="text-center mb-4">
          <h1 className="text-5xl font-bold mb-1 text-yellow-400">타워 디펜스</h1>
          <p className="text-gray-500 text-sm">픽셀 아트 에디션</p>
        </div>

        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          <div className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm"><span className="text-gray-400">SP </span><span className="text-yellow-300 font-bold">{sp}</span></div>
          <div className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm"><span className="text-gray-400">보석 </span><span className="text-cyan-300 font-bold">{gems}</span></div>
          <Link href="/shop" className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-bold">상점</Link>
          <Link href="/skills" className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm font-bold">스킬</Link>
          <Link href="/upgrades" className="px-3 py-1.5 bg-pink-700 hover:bg-pink-600 rounded-lg text-sm font-bold">영구 강화</Link>
          <Link href="/achievements" className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm font-bold">업적 & 통계</Link>
          <BgmControl />
        </div>

        {/* Difficulty selector */}
        <div className="flex justify-center gap-2 mb-5">
          {(["easy", "normal", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => changeDifficulty(d)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold border-2 ${
                difficulty === d
                  ? d === "easy" ? "border-green-400 bg-green-900/40 text-green-300"
                  : d === "normal" ? "border-blue-400 bg-blue-900/40 text-blue-300"
                  : "border-red-400 bg-red-900/40 text-red-300"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >{d === "easy" ? "쉽게" : d === "normal" ? "보통" : "어렵게"}</button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2 mb-6">
          {STAGES.map((stage) => {
            const stars = getStageStars(stage.id);
            const unlocked = isUnlocked(stage.id);
            return (
              <div key={stage.id}>
                {unlocked ? (
                  <Link
                    href={`/game?stage=${stage.id}`}
                    className={`block p-2 rounded-lg text-center transition-all hover:scale-105 ${
                      stage.boss ? "bg-red-900/80 border-2 border-red-600 hover:bg-red-800" :
                      "bg-gray-800 border-2 border-gray-700 hover:border-gray-500"
                    }`}
                  >
                    <div className="text-xl font-bold">{stage.id}</div>
                    <div className="text-[9px] text-gray-400 truncate">{stage.name}</div>
                    {stage.boss && <div className="text-[9px] text-red-400 font-bold">보스</div>}
                    <div className="text-yellow-400 text-[10px] mt-0.5">
                      {stars > 0 ? "★".repeat(stars) + "☆".repeat(3 - stars) : "—"}
                    </div>
                  </Link>
                ) : (
                  <div className="p-2 rounded-lg text-center bg-gray-900 border-2 border-gray-800 opacity-40">
                    <div className="text-xl font-bold text-gray-600">{stage.id}</div>
                    <div className="text-[9px] text-gray-600">잠김</div>
                    <div className="text-gray-700 text-xs">🔒</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 text-xs">
          <h3 className="text-sm font-bold text-gray-400 mb-2">게임 조작</h3>
          <div className="grid grid-cols-3 gap-1 text-gray-400">
            <div><kbd className="text-yellow-300">1-8</kbd> 타워 선택</div>
            <div><kbd className="text-yellow-300">Q W E R A S D</kbd> 액티브 스킬</div>
            <div><kbd className="text-yellow-300">Space</kbd> 일시정지</div>
            <div><kbd className="text-yellow-300">Esc</kbd> 선택 해제</div>
            <div>경로 클릭: 선택한 타워 배치</div>
            <div>설치된 타워 클릭: 업그레이드/판매</div>
          </div>
        </div>
      </div>
    </div>
  );
}
