// Design Ref: §5.2 — 상점 page with weapons, items, and enhance
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePlayerStore } from "@/stores/playerStore";
import { saveGame } from "@/features/save/saveManager";
import { ENHANCE_SUCCESS_RATES, ENHANCE_COSTS } from "@/types/weapon";
import { chance } from "@/game/utils/random";
import { getWeaponPowerMultiplier } from "@/stores/playerStore";

type WeaponDef = {
  id: string;
  name: string;
  description: string;
  rarity: string;
  attackBonus: number;
  speedBonus: number;
  specialEffect: string;
  cost: number;
  maxEnhanceLevel: number;
};

const RARITY_COLORS: Record<string, string> = {
  common: "border-gray-500 text-gray-300",
  uncommon: "border-green-500 text-green-400",
  rare: "border-blue-500 text-blue-400",
  epic: "border-purple-500 text-purple-400",
  legendary: "border-orange-500 text-orange-400",
};

export default function ShopPage() {
  const [weapons, setWeapons] = useState<WeaponDef[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponDef | null>(null);
  const [enhanceResult, setEnhanceResult] = useState<string | null>(null);

  const sp = usePlayerStore((s) => s.starPoints);
  const gems = usePlayerStore((s) => s.gems);
  const ownedWeapons = usePlayerStore((s) => s.weapons);
  const addWeapon = usePlayerStore((s) => s.addWeapon);
  const removeStarPoints = usePlayerStore((s) => s.removeStarPoints);
  const removeGems = usePlayerStore((s) => s.removeGems);
  const enhanceWeapon = usePlayerStore((s) => s.enhanceWeapon);
  const hasWeapon = usePlayerStore((s) => s.hasWeapon);
  const removeWeapon = usePlayerStore((s) => s.removeWeapon);

  useEffect(() => {
    fetch("/data/weapons.json")
      .then((r) => r.json())
      .then((data) => setWeapons(Object.values(data)));
  }, []);

  const buyWeapon = (w: WeaponDef) => {
    if (hasWeapon(w.id)) return;
    if (!removeStarPoints(w.cost)) return;
    addWeapon(w.id);
    saveGame();
  };

  const tryEnhance = (weaponId: string) => {
    const owned = ownedWeapons.find((w) => w.weaponId === weaponId);
    if (!owned) return;

    const level = owned.enhanceLevel;
    if (level >= 9) return; // max +10

    const cost = ENHANCE_COSTS[level];
    if (!removeGems(cost)) {
      setEnhanceResult("보석이 부족합니다!");
      return;
    }

    const rate = ENHANCE_SUCCESS_RATES[level];
    if (chance(rate)) {
      enhanceWeapon(weaponId, level + 1);
      setEnhanceResult(`+${level + 1} 성공!`);
    } else {
      // Failure logic
      if (level >= 7 && chance(level >= 8 ? 0.2 : 0.1)) {
        removeWeapon(weaponId);
        setEnhanceResult("파괴됨!");
      } else if (level >= 3) {
        const drop = level >= 5 ? 2 : 1;
        enhanceWeapon(weaponId, Math.max(0, level - drop));
        setEnhanceResult(`실패! 단계 하락: +${Math.max(0, level - drop)}`);
      } else {
        setEnhanceResult("실패! 단계 유지");
      }
    }
    saveGame();
    setTimeout(() => setEnhanceResult(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">상점</h1>
          <div className="flex gap-6 items-center">
            <span className="text-yellow-300">SP: {sp}</span>
            <span className="text-cyan-300">보석: {gems}</span>
            <Link href="/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
              돌아가기
            </Link>
          </div>
        </div>

        {/* Combat Power Display */}
        {weapons.length > 0 && (
          <CombatPowerBanner weapons={weapons} ownedWeapons={ownedWeapons} />
        )}


        <div className="grid grid-cols-2 gap-6">
          {/* Weapon List */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold mb-3">무기</h2>
            {weapons.map((w) => {
              const owned = hasWeapon(w.id);
              const ownedData = ownedWeapons.find((o) => o.weaponId === w.id);
              const colors = RARITY_COLORS[w.rarity] ?? RARITY_COLORS.common;

              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWeapon(w)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${colors} ${
                    selectedWeapon?.id === w.id ? "bg-gray-700" : "bg-gray-800/50 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold">{w.name}</span>
                      {ownedData && (
                        <span className="ml-2 text-yellow-400 text-sm">
                          +{ownedData.enhanceLevel}
                        </span>
                      )}
                    </div>
                    {owned ? (
                      <span className="text-green-400 text-sm">보유중</span>
                    ) : (
                      <span className="text-yellow-400 text-sm">SP {w.cost}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    ATK +{w.attackBonus} | {w.rarity}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            {selectedWeapon ? (
              <>
                <h3 className="text-2xl font-bold mb-2">{selectedWeapon.name}</h3>
                <p className="text-gray-400 mb-4">{selectedWeapon.description}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400">등급</span>
                    <span className={RARITY_COLORS[selectedWeapon.rarity]}>{selectedWeapon.rarity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">공격력 보너스</span>
                    <span>+{selectedWeapon.attackBonus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">효과</span>
                    <span className="text-cyan-300">{selectedWeapon.specialEffect}</span>
                  </div>
                </div>

                {!hasWeapon(selectedWeapon.id) ? (
                  <button
                    onClick={() => buyWeapon(selectedWeapon)}
                    disabled={sp < selectedWeapon.cost}
                    className="w-full py-3 rounded-lg font-bold bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:opacity-50"
                  >
                    구매 (SP {selectedWeapon.cost})
                  </button>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const owned = ownedWeapons.find((o) => o.weaponId === selectedWeapon.id);
                      const level = owned?.enhanceLevel ?? 0;
                      const canEnhance = level < 9;
                      const cost = canEnhance ? ENHANCE_COSTS[level] : 0;
                      const rate = canEnhance ? Math.round(ENHANCE_SUCCESS_RATES[level] * 100) : 0;
                      return (
                        <>
                          <div className="text-center text-lg font-bold text-yellow-400">
                            +{level}
                          </div>
                          {canEnhance && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span>성공률: {rate}%</span>
                                <span>비용: {cost} Gems</span>
                              </div>
                              <button
                                onClick={() => tryEnhance(selectedWeapon.id)}
                                disabled={gems < cost}
                                className="w-full py-3 rounded-lg font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:opacity-50"
                              >
                                강화 +{level} → +{level + 1}
                              </button>
                            </>
                          )}
                          {enhanceResult && (
                            <div className={`text-center font-bold text-lg ${
                              enhanceResult.includes("Success") ? "text-green-400" :
                              enhanceResult.includes("DESTROYED") ? "text-red-500" : "text-yellow-400"
                            }`}>
                              {enhanceResult}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center mt-20">무기를 선택하면 상세 정보를 볼 수 있습니다</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CombatPowerBanner({
  weapons,
  ownedWeapons,
}: {
  weapons: WeaponDef[];
  ownedWeapons: readonly { weaponId: string; enhanceLevel: number }[];
}) {
  // Calculate total combat power across all tower types
  const towerTypes = ["archer", "mage", "cannon", "frost", "poison", "tesla", "bomb", "support"];

  const getBestForTower = (towerId: string): { weapon: WeaponDef | null; bonus: number } => {
    let best: { weapon: WeaponDef | null; bonus: number } = { weapon: null, bonus: 0 };
    for (const owned of ownedWeapons) {
      const w = weapons.find((x) => x.id === owned.weaponId);
      if (!w) continue;
      // Check compatibility from JSON (equipableOn field)
      const equipable = (w as unknown as { equipableOn: string[] | "all" }).equipableOn;
      const compatible = equipable === "all" || (Array.isArray(equipable) && equipable.includes(towerId));
      if (!compatible) continue;
      const effective = w.attackBonus * getWeaponPowerMultiplier(owned.enhanceLevel);
      if (effective > best.bonus) best = { weapon: w, bonus: effective };
    }
    return best;
  };

  const totalPower = towerTypes.reduce((sum, t) => sum + getBestForTower(t).bonus, 0);

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-lg border border-purple-600">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-purple-300">전투력</h3>
        <span className="text-2xl font-bold text-yellow-400">{Math.round(totalPower)}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {towerTypes.map((t) => {
          const { weapon, bonus } = getBestForTower(t);
          return (
            <div key={t} className="flex justify-between bg-gray-900/50 px-2 py-1 rounded">
              <span className="text-gray-400">{t}</span>
              <span className={bonus > 0 ? "text-green-400" : "text-gray-600"}>
                +{Math.round(bonus)}
                {weapon && ownedWeapons.find((o) => o.weaponId === weapon.id)!.enhanceLevel > 0 && (
                  <span className="text-yellow-400 ml-1">
                    +{ownedWeapons.find((o) => o.weaponId === weapon.id)!.enhanceLevel}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-500 mt-2">
        * 각 타워 타입별로 가장 높은 호환 무기가 자동 장착됩니다. 강화 단계마다 +15% 보너스.
      </p>
    </div>
  );
}
