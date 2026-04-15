"use client";

import { useEffect, useState } from "react";
import { bgm } from "@/features/audio/bgmManager";
import { sfx } from "@/features/audio/sfxManager";

export default function InGameSettings() {
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubBgm = bgm.subscribe(() => setTick((t) => t + 1));
    const unsubSfx = sfx.subscribe(() => setTick((t) => t + 1));
    return () => { unsubBgm(); unsubSfx(); };
  }, []);

  const bgmSettings = bgm.getSettings();
  const sfxSettings = sfx.getSettings();

  return (
    <div className="absolute top-2 right-28 z-10">
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 bg-gray-800/90 hover:bg-gray-700 rounded border border-gray-600 text-xs font-bold"
      >
        {open ? "✕" : "⚙ 설정"}
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-56 bg-gray-900/95 border-2 border-gray-600 rounded-lg p-3 text-xs shadow-xl">
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">배경음악</span>
              <button onClick={() => bgm.toggleMute()} className={`text-[10px] px-2 py-0.5 rounded ${bgmSettings.muted ? "bg-red-700" : "bg-green-700"}`}>
                {bgmSettings.muted ? "음소거" : "ON"}
              </button>
            </div>
            <input
              type="range" min="0" max="100"
              value={bgmSettings.volume * 100}
              onChange={(e) => bgm.setVolume(Number(e.target.value) / 100)}
              className="w-full"
            />
            <div className="text-[9px] text-gray-400">{Math.round(bgmSettings.volume * 100)}%</div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">효과음</span>
              <button onClick={() => sfx.toggleMute()} className={`text-[10px] px-2 py-0.5 rounded ${sfxSettings.muted ? "bg-red-700" : "bg-green-700"}`}>
                {sfxSettings.muted ? "음소거" : "ON"}
              </button>
            </div>
            <input
              type="range" min="0" max="100"
              value={sfxSettings.volume * 100}
              onChange={(e) => sfx.setVolume(Number(e.target.value) / 100)}
              className="w-full"
            />
            <div className="text-[9px] text-gray-400">{Math.round(sfxSettings.volume * 100)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
