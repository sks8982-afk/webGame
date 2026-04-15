"use client";

import { useState } from "react";
import { useBgmSettings } from "@/features/audio/useBgm";

export default function BgmControl() {
  const [open, setOpen] = useState(false);
  const { settings, toggleMute, setVolume, play, tracks, isPlaying } = useBgmSettings();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm border border-gray-700"
        title="BGM"
      >
        {settings.muted ? "🔇" : "🎵"} BGM
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-64 bg-gray-900 border-2 border-gray-600 rounded-lg p-3 z-50 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold">배경음악</span>
            <button
              onClick={toggleMute}
              className={`px-2 py-0.5 rounded text-xs ${settings.muted ? "bg-red-700" : "bg-green-700"}`}
            >
              {settings.muted ? "음소거 ON" : "음소거 OFF"}
            </button>
          </div>

          <div className="mb-3">
            <div className="text-[10px] text-gray-400 mb-1">볼륨: {Math.round(settings.volume * 100)}%</div>
            <input
              type="range" min="0" max="100"
              value={settings.volume * 100}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-full"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {tracks.map((t) => (
              <button
                key={t.id}
                onClick={() => play(t.id)}
                className={`w-full text-left px-2 py-1 rounded text-xs ${
                  settings.currentTrack === t.id && isPlaying
                    ? "bg-blue-700 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                }`}
              >
                {settings.currentTrack === t.id && isPlaying ? "▶ " : ""}{t.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
