"use client";

import { useEffect, useState } from "react";
import { bgm, BGM_TRACKS, type BgmTrackId } from "./bgmManager";

export function useBgmSettings() {
  const [, setTick] = useState(0);

  useEffect(() => {
    return bgm.subscribe(() => setTick((t) => t + 1));
  }, []);

  return {
    settings: bgm.getSettings(),
    play: (id: BgmTrackId) => bgm.play(id),
    stop: () => bgm.stop(),
    toggleMute: () => bgm.toggleMute(),
    setVolume: (v: number) => bgm.setVolume(v),
    isPlaying: bgm.isPlaying(),
    tracks: BGM_TRACKS,
  };
}
