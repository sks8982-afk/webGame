// Design Ref: §5.6 — 타워 선택 패널 (8종, 한글)
"use client";

import { useGameStore } from "@/stores/gameStore";
import { useUIStore } from "@/stores/uiStore";
import type { TowerId } from "@/types/tower";

interface TowerOption {
  readonly id: TowerId;
  readonly name: string;
  readonly cost: number;
  readonly color: string;
  readonly range: number;
  readonly atk: number;
  readonly ability: string;
  readonly hotkey: string;
}

const TOWER_OPTIONS: readonly TowerOption[] = [
  { id: "archer", name: "궁수", cost: 100, color: "bg-green-600", range: 150, atk: 15, ability: "단일", hotkey: "1" },
  { id: "mage", name: "마법사", cost: 150, color: "bg-blue-600", range: 130, atk: 25, ability: "화상", hotkey: "2" },
  { id: "cannon", name: "대포", cost: 200, color: "bg-red-600", range: 120, atk: 40, ability: "범위", hotkey: "3" },
  { id: "frost", name: "냉기", cost: 175, color: "bg-cyan-500", range: 140, atk: 10, ability: "감속", hotkey: "4" },
  { id: "poison", name: "독", cost: 150, color: "bg-lime-600", range: 130, atk: 8, ability: "중독", hotkey: "5" },
  { id: "tesla", name: "테슬라", cost: 225, color: "bg-yellow-500", range: 140, atk: 20, ability: "연쇄", hotkey: "6" },
  { id: "bomb", name: "폭탄", cost: 175, color: "bg-orange-600", range: 110, atk: 50, ability: "광역", hotkey: "7" },
  { id: "support", name: "지원", cost: 125, color: "bg-pink-400", range: 160, atk: 0, ability: "공속+30%", hotkey: "8" },
];

export default function TowerPanel() {
  const gold = useGameStore((s) => s.gold);
  const selectedTowerId = useUIStore((s) => s.selectedTowerId);
  const selectTowerToBuild = useUIStore((s) => s.selectTowerToBuild);

  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 px-3 py-2 bg-gray-900/90 z-10">
      {TOWER_OPTIONS.map((tower) => {
        const canAfford = gold >= tower.cost;
        const isSelected = selectedTowerId === tower.id;

        return (
          <button
            key={tower.id}
            onClick={() => selectTowerToBuild(isSelected ? null : tower.id)}
            disabled={!canAfford}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border-2 transition-all min-w-[68px] ${
              isSelected
                ? "border-yellow-400 bg-gray-700 scale-105"
                : canAfford
                  ? "border-gray-600 bg-gray-800 hover:border-gray-400"
                  : "border-gray-800 bg-gray-900 opacity-40 cursor-not-allowed"
            }`}
          >
            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded bg-yellow-500 text-gray-900 text-[10px] font-bold flex items-center justify-center shadow">
              {tower.hotkey}
            </span>
            <div className={`w-6 h-6 rounded-full ${tower.color}`} />
            <span className="text-white text-[10px] font-bold">{tower.name}</span>
            <div className="flex gap-1 text-[9px] text-gray-400">
              <span>공{tower.atk}</span>
              <span>거{tower.range}</span>
            </div>
            <span className="text-[9px] text-cyan-400">{tower.ability}</span>
            <span className="text-yellow-400 text-[10px]">{tower.cost}G</span>
          </button>
        );
      })}
    </div>
  );
}
