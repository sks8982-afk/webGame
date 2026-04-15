// Design Ref: §5.6 — Selected tower info + upgrade/sell + targeting
"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";

interface TowerInfoPanelProps {
  readonly gameRef: React.MutableRefObject<import("@/game/core/Game").Game | null>;
}

type TowerView = {
  id: string;
  towerId: string;
  upgradePath: string | null;
  upgradeLevel: number;
  attack: number;
  range: number;
  speed: number;
  cost: number;
  targetingMode: string;
};

export default function TowerInfoPanel({ gameRef }: TowerInfoPanelProps) {
  const selectedId = useUIStore((s) => s.selectedPlacedTowerId);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const [tower, setTower] = useState<TowerView | null>(null);
  const [upgradeDefs, setUpgradeDefs] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  // Refresh tower info every 500ms (in case game state changed)
  useEffect(() => {
    if (!selectedId) { setTower(null); return; }
    const interval = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(interval);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !gameRef.current) { setTower(null); return; }
    const game = gameRef.current;
    const ts = game.getSystem<import("@/game/systems/TowerSystem").TowerSystem>("TowerSystem");
    if (!ts) { setTower(null); return; }

    const t = ts.findTower(selectedId);
    if (!t) { setTower(null); return; }

    // Load tower data
    import("@/game/core/AssetLoader").then(({ AssetLoader }) => {
      const def = AssetLoader.getTowerData(t.towerId);
      if (!def) return;

      let atk = def.baseAttack;
      let rng = def.baseRange;
      let spd = def.baseAttackSpeed;
      if (t.upgradePath) {
        const path = def.upgrades[t.upgradePath];
        for (let i = 0; i < t.upgradeLevel; i++) {
          atk += path[i].attackBonus;
          rng += path[i].rangeBonus;
          spd += path[i].speedBonus;
        }
      }
      setTower({
        id: t.id,
        towerId: t.towerId,
        upgradePath: t.upgradePath,
        upgradeLevel: t.upgradeLevel,
        attack: atk,
        range: rng,
        speed: Math.round(spd * 10) / 10,
        cost: def.baseCost,
        targetingMode: (t as unknown as { targetingMode?: string }).targetingMode ?? "first",
      });
      setUpgradeDefs(def);
    });
  }, [selectedId, tick, gameRef]);

  if (!tower || !upgradeDefs) return null;

  const def = upgradeDefs as { upgrades: Record<string, Array<{ name: string; cost: number }>> };
  const gold = useGameStore.getState().gold;

  const upgrade = (path: "path1" | "path2" | "path3") => {
    const ts = gameRef.current?.getSystem<import("@/game/systems/TowerSystem").TowerSystem>("TowerSystem");
    if (!ts) return;
    ts.upgradeTower(tower.id, path);
    setTick((t) => t + 1);
  };

  const sell = () => {
    const ts = gameRef.current?.getSystem<import("@/game/systems/TowerSystem").TowerSystem>("TowerSystem");
    if (!ts) return;
    ts.sellTower(tower.id);
    // Free grid cell
    if (gameRef.current) {
      const { col, row } = gameRef.current.mapManager.worldToCell(
        (ts.findTower(tower.id)?.position.x ?? 0), (ts.findTower(tower.id)?.position.y ?? 0)
      );
      gameRef.current.mapManager.removeTower(col, row);
    }
    clearSelection();
  };

  const cycleTargeting = () => {
    const modes = ["first", "last", "strongest", "weakest"];
    const idx = modes.indexOf(tower.targetingMode);
    const next = modes[(idx + 1) % modes.length];
    const ts = gameRef.current?.getSystem<import("@/game/systems/TowerSystem").TowerSystem>("TowerSystem");
    ts?.setTargetingMode(tower.id, next as "first" | "last" | "strongest" | "weakest");
    setTick((t) => t + 1);
  };

  const TARGETING_LABELS: Record<string, string> = {
    first: "맨앞", last: "맨뒤", strongest: "강한", weakest: "약한",
  };

  const currentPath = tower.upgradePath;
  const canUpgrade = (pathKey: "path1" | "path2" | "path3") => {
    // Can only upgrade same path OR pick new if no path yet
    if (currentPath && currentPath !== pathKey) return false;
    if (tower.upgradeLevel >= 3) return false;
    return true;
  };

  const getPathUpgrade = (pathKey: "path1" | "path2" | "path3") => {
    return def.upgrades[pathKey][tower.upgradeLevel];
  };

  const refund = Math.floor(tower.cost * 0.5 + (tower.upgradeLevel * 50));

  return (
    <div className="absolute top-16 right-4 w-72 bg-gray-900/95 border-2 border-blue-500 rounded-lg p-3 z-10">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-blue-300">
          {tower.towerId} {tower.upgradeLevel > 0 ? `+${tower.upgradeLevel}` : ""}
        </h3>
        <button onClick={clearSelection} className="text-gray-400 hover:text-white text-sm">✕</button>
      </div>
      <div className="space-y-1 text-xs mb-3 bg-gray-800/50 p-2 rounded">
        <div className="flex justify-between"><span className="text-gray-400">공격력</span><span>{tower.attack}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">사거리</span><span>{tower.range}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">공격속도</span><span>{tower.speed}/초</span></div>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">타겟팅</div>
        <button
          onClick={cycleTargeting}
          className="w-full py-1.5 bg-cyan-700 hover:bg-cyan-600 rounded text-sm font-bold"
        >{TARGETING_LABELS[tower.targetingMode]}</button>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="text-xs text-gray-400">업그레이드</div>
        {(["path1", "path2", "path3"] as const).map((pk) => {
          const u = getPathUpgrade(pk);
          if (!u) return null;
          const can = canUpgrade(pk);
          const afford = gold >= u.cost;
          return (
            <button
              key={pk}
              onClick={() => upgrade(pk)}
              disabled={!can || !afford}
              className={`w-full py-1.5 px-2 rounded text-xs text-left ${
                !can ? "bg-gray-800 opacity-40 cursor-not-allowed" :
                !afford ? "bg-gray-700 opacity-70" :
                currentPath === pk ? "bg-yellow-700 hover:bg-yellow-600" :
                "bg-blue-700 hover:bg-blue-600"
              }`}
            >
              <div className="flex justify-between">
                <span>{pk === "path1" ? "▲" : pk === "path2" ? "◆" : "●"} {u.name}</span>
                <span className="text-yellow-300">{u.cost}G</span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={sell}
        className="w-full py-1.5 bg-red-700 hover:bg-red-600 rounded text-sm font-bold"
      >판매 (+{refund}G)</button>
    </div>
  );
}
