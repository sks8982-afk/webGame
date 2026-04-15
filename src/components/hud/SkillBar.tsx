// Active skill cast bar — shown at bottom during combat
"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { usePlayerStore } from "@/stores/playerStore";

interface SkillBarProps {
  readonly gameRef: React.MutableRefObject<import("@/game/core/Game").Game | null>;
}

type ActiveSkillDef = {
  id: string;
  name: string;
  cooldown: number;
  iconPath: string;
  hotkey: string;
};

const ACTIVE_SKILLS: readonly ActiveSkillDef[] = [
  { id: "meteor_strike", name: "메테오", cooldown: 60, iconPath: "/sprites/effects/skill_meteor.png", hotkey: "Q" },
  { id: "thunder_storm", name: "천둥폭풍", cooldown: 90, iconPath: "/sprites/effects/skill_thunder.png", hotkey: "W" },
  { id: "berserk_mode", name: "광폭화", cooldown: 120, iconPath: "/sprites/effects/skill_berserk.png", hotkey: "E" },
  { id: "guardian_angel", name: "수호천사", cooldown: 180, iconPath: "/sprites/effects/skill_guardian.png", hotkey: "R" },
  { id: "earthquake", name: "지진", cooldown: 120, iconPath: "/sprites/effects/skill_earthquake.png", hotkey: "A" },
  { id: "time_warp", name: "시간왜곡", cooldown: 90, iconPath: "/sprites/effects/skill_timewarp.png", hotkey: "S" },
  { id: "armageddon", name: "아마게돈", cooldown: 300, iconPath: "/sprites/effects/skill_armageddon.png", hotkey: "D" },
];

export default function SkillBar({ gameRef }: SkillBarProps) {
  const cooldowns = useGameStore((s) => s.skillCooldowns);
  const playerSkills = usePlayerStore((s) => s.skills);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  const learnedSkills = ACTIVE_SKILLS.filter((s) =>
    playerSkills.some((ps) => ps.skillId === s.id && ps.level > 0)
  );

  const cast = (skill: ActiveSkillDef) => {
    const game = gameRef.current;
    if (!game) return;
    const skillSystem = game.getSystem<import("@/game/systems/SkillSystem").SkillSystem>("SkillSystem");
    skillSystem?.cast(skill.id, skill.cooldown);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const skill = learnedSkills.find((s) => s.hotkey === key);
      if (skill) {
        cast(skill);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [learnedSkills]);

  if (learnedSkills.length === 0) return null;

  return (
    <div className="absolute left-4 bottom-28 flex flex-col gap-1.5 z-10">
      <div className="text-[10px] text-gray-400 mb-0.5">액티브 스킬</div>
      {learnedSkills.map((skill) => {
        const cd = cooldowns[skill.id] ?? 0;
        const ready = cd <= 0;
        const cdPercent = ready ? 0 : (cd / skill.cooldown) * 100;
        void tick;
        return (
          <button
            key={skill.id}
            onClick={() => cast(skill)}
            disabled={!ready}
            title={skill.name}
            className={`relative w-14 h-14 rounded-lg border-2 overflow-hidden ${
              ready ? "border-yellow-400 bg-yellow-900/60 hover:bg-yellow-800" : "border-gray-600 bg-gray-800 cursor-not-allowed"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={skill.iconPath}
              alt={skill.name}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: ready ? "none" : "grayscale(80%) brightness(0.6)" }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center py-0.5">
              <span className="text-[8px] text-white font-bold">{skill.name}</span>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 bg-black/70 transition-all pointer-events-none"
              style={{ height: `${cdPercent}%` }}
            />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white drop-shadow-lg">{Math.ceil(cd)}s</span>
              </div>
            )}
            <span className="absolute top-0 right-0.5 text-[10px] text-yellow-300 font-bold bg-black/70 px-1 rounded">{skill.hotkey}</span>
          </button>
        );
      })}
    </div>
  );
}
