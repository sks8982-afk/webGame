// Design Ref: §5.3 — Skill tree page with 3 categories + hidden skills
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePlayerStore } from "@/stores/playerStore";
import { saveGame } from "@/features/save/saveManager";

type SkillDef = {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  maxLevel: number;
  costPerLevel: number[];
  cooldown: number | null;
  unlockCondition: { type: string; value: string | number } | null;
  icon: string;
};

function formatUnlockCondition(
  condition: { type: string; value: string | number } | null
): string {
  if (!condition) return "";
  switch (condition.type) {
    case "boss_clear":
      return `보스 스테이지 ${condition.value} 클리어 필요`;
    case "gold_threshold":
      return `보석 ${condition.value}개 보유 필요`;
    case "stage_clear": {
      const val = String(condition.value);
      const match = val.match(/^(\d+)(?:_(\d)star)?$/);
      if (!match) return `스테이지 ${val} 클리어 필요`;
      const stageId = match[1];
      const stars = match[2];
      return stars
        ? `스테이지 ${stageId} 를 ${stars}성으로 클리어 필요`
        : `스테이지 ${stageId} 클리어 필요`;
    }
    default:
      return `${condition.type} — ${condition.value}`;
  }
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  attack: { label: "공격", color: "text-red-400 border-red-500", icon: "A" },
  economy: { label: "경제", color: "text-yellow-400 border-yellow-500", icon: "G" },
  defense: { label: "방어", color: "text-blue-400 border-blue-500", icon: "D" },
  hidden: { label: "히든", color: "text-purple-400 border-purple-500", icon: "?" },
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillDef[]>([]);
  const [activeTab, setActiveTab] = useState("attack");

  const sp = usePlayerStore((s) => s.starPoints);
  const playerSkills = usePlayerStore((s) => s.skills);
  const learnSkill = usePlayerStore((s) => s.learnSkill);
  const upgradeSkill = usePlayerStore((s) => s.upgradeSkill);
  const removeStarPoints = usePlayerStore((s) => s.removeStarPoints);
  const getSkillLevel = usePlayerStore((s) => s.getSkillLevel);
  const stageProgress = usePlayerStore((s) => s.stageProgress);
  const gems = usePlayerStore((s) => s.gems);

  // Check if an unlock condition is met
  const isUnlockConditionMet = (condition: { type: string; value: string | number } | null): boolean => {
    if (!condition) return true;

    switch (condition.type) {
      case "boss_clear": {
        // value is the stage number (e.g., 10) — check if that boss stage is cleared
        const stageId = Number(condition.value);
        return stageProgress.some((p) => p.stageId === stageId && p.cleared);
      }
      case "gold_threshold": {
        // Check if player has ever accumulated this much gems (approximation)
        return gems >= Number(condition.value);
      }
      case "stage_clear": {
        // value can be "15_3star" or just "15"
        const val = String(condition.value);
        const match = val.match(/^(\d+)(?:_(\d)star)?$/);
        if (!match) return false;
        const stageId = Number(match[1]);
        const starsRequired = match[2] ? Number(match[2]) : 1;
        const prog = stageProgress.find((p) => p.stageId === stageId);
        return !!prog && prog.cleared && (prog.bestStars ?? 0) >= starsRequired;
      }
      default:
        return false;
    }
  };

  useEffect(() => {
    fetch("/data/skills.json")
      .then((r) => r.json())
      .then((data) => setSkills(Object.values(data)));
  }, []);

  const filteredSkills = skills.filter((s) => s.category === activeTab);

  const handleLearnOrUpgrade = (skill: SkillDef) => {
    const currentLevel = getSkillLevel(skill.id);
    if (currentLevel >= skill.maxLevel) return;

    const cost = skill.costPerLevel[currentLevel] ?? skill.costPerLevel[skill.costPerLevel.length - 1];
    if (!removeStarPoints(cost)) return;

    if (currentLevel === 0) {
      learnSkill(skill.id);
    } else {
      upgradeSkill(skill.id);
    }
    saveGame();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">스킬 트리</h1>
          <div className="flex gap-4 items-center">
            <span className="text-yellow-300">SP: {sp}</span>
            <Link href="/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
              돌아가기
            </Link>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6">
          {Object.entries(CATEGORY_LABELS).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-lg font-bold border-2 transition-all ${
                activeTab === key
                  ? `${color} bg-gray-800`
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {label} ({skills.filter((s) => s.category === key).length})
            </button>
          ))}
        </div>

        {/* Skill grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredSkills.map((skill) => {
            const currentLevel = getSkillLevel(skill.id);
            const isMaxed = currentLevel >= skill.maxLevel;
            const cost = !isMaxed
              ? skill.costPerLevel[currentLevel] ?? skill.costPerLevel[skill.costPerLevel.length - 1]
              : 0;
            const canAfford = sp >= cost;
            const conditionMet = isUnlockConditionMet(skill.unlockCondition);
            const isLocked =
              skill.unlockCondition !== null && currentLevel === 0 && !conditionMet;
            const catStyle = CATEGORY_LABELS[skill.category] ?? CATEGORY_LABELS.attack;

            return (
              <div
                key={skill.id}
                className={`p-4 rounded-lg border-2 ${
                  isLocked
                    ? "border-gray-800 bg-gray-900/50 opacity-60"
                    : isMaxed
                      ? "border-green-700 bg-gray-800/50"
                      : `${catStyle.color} bg-gray-800/50`
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{skill.name}</h3>
                    <span className="text-xs text-gray-400">
                      {skill.type === "active" ? `액티브 (쿨: ${skill.cooldown}s)` : "패시브"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">
                      레벨 {currentLevel}/{skill.maxLevel}
                    </div>
                    {!isMaxed && !isLocked && (
                      <div className="text-xs text-yellow-400">SP {cost}</div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-3">{skill.description}</p>

                {/* Level indicators */}
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: skill.maxLevel }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded ${
                        i < currentLevel ? "bg-green-500" : "bg-gray-700"
                      }`}
                    />
                  ))}
                </div>

                {isLocked ? (
                  <div className="text-xs text-gray-500 text-center">
                    🔒 {formatUnlockCondition(skill.unlockCondition)}
                  </div>
                ) : !isMaxed ? (
                  <button
                    onClick={() => handleLearnOrUpgrade(skill)}
                    disabled={!canAfford}
                    className="w-full py-2 rounded font-bold text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:opacity-50"
                  >
                    {currentLevel === 0 ? "습득" : "강화"}
                  </button>
                ) : (
                  <div className="text-center text-green-400 text-sm font-bold">최대</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
