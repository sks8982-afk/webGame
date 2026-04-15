// BGM audio manager — handles looping background music

export const BGM_TRACKS = [
  { id: "AboveTheTreetops", name: "나무 위" },
  { id: "Aquarium", name: "수족관" },
  { id: "BadGuys", name: "악당" },
  { id: "DragonNest", name: "드래곤 둥지" },
  { id: "FantasticThinking", name: "환상" },
  { id: "FloralLife", name: "꽃의 생" },
  { id: "Leafre", name: "리프레" },
  { id: "LetsMarch", name: "행진" },
  { id: "MuruengHill", name: "무릉" },
  { id: "Nightmare", name: "악몽" },
  { id: "ShininHarbor", name: "항구" },
  { id: "SnowyVillage", name: "설원" },
  { id: "WhenTheMorningComes", name: "아침" },
] as const;

export type BgmTrackId = typeof BGM_TRACKS[number]["id"];

const STORAGE_KEY = "td-bgm-settings";

interface BgmSettings {
  volume: number;  // 0..1
  muted: boolean;
  currentTrack: BgmTrackId | null;
}

function loadSettings(): BgmSettings {
  if (typeof window === "undefined") return { volume: 0.4, muted: false, currentTrack: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { volume: 0.4, muted: false, currentTrack: null, ...JSON.parse(raw) };
  } catch {}
  return { volume: 0.4, muted: false, currentTrack: null };
}

function saveSettings(s: BgmSettings): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

class BgmManager {
  private audio: HTMLAudioElement | null = null;
  private settings: BgmSettings = loadSettings();
  private listeners: Set<() => void> = new Set();

  getSettings(): Readonly<BgmSettings> { return this.settings; }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  async play(trackId: BgmTrackId): Promise<void> {
    if (typeof window === "undefined") return;
    if (this.settings.currentTrack === trackId && this.audio && !this.audio.paused) return;

    this.stop();

    this.audio = new Audio(`/bgm/${trackId}.mp3`);
    this.audio.loop = true;
    this.audio.volume = this.settings.muted ? 0 : this.settings.volume;

    this.settings = { ...this.settings, currentTrack: trackId };
    saveSettings(this.settings);

    try {
      await this.audio.play();
    } catch {
      // Autoplay may be blocked — wait for user interaction
    }
    this.notify();
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    this.settings = { ...this.settings, currentTrack: null };
    this.notify();
  }

  pause(): void {
    this.audio?.pause();
    this.notify();
  }

  resume(): void {
    this.audio?.play().catch(() => {});
    this.notify();
  }

  setVolume(v: number): void {
    this.settings = { ...this.settings, volume: Math.max(0, Math.min(1, v)) };
    if (this.audio) this.audio.volume = this.settings.muted ? 0 : this.settings.volume;
    saveSettings(this.settings);
    this.notify();
  }

  toggleMute(): void {
    this.settings = { ...this.settings, muted: !this.settings.muted };
    if (this.audio) this.audio.volume = this.settings.muted ? 0 : this.settings.volume;
    saveSettings(this.settings);
    this.notify();
  }

  isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }
}

export const bgm = new BgmManager();

/** Pick a BGM track based on stage + type (menu, normal, boss) */
export function pickTrackForContext(ctx: {
  type: "menu" | "normal" | "boss";
  stageId?: number;
}): BgmTrackId {
  if (ctx.type === "menu") return "WhenTheMorningComes";
  if (ctx.type === "boss") {
    // Boss stages get darker tracks
    const bossTracks: BgmTrackId[] = ["Nightmare", "DragonNest", "BadGuys"];
    return bossTracks[(ctx.stageId ?? 0) % bossTracks.length];
  }
  // Normal stages — rotate through light tracks
  const normalTracks: BgmTrackId[] = [
    "AboveTheTreetops", "FloralLife", "Aquarium", "LetsMarch",
    "Leafre", "ShininHarbor", "MuruengHill", "SnowyVillage",
    "FantasticThinking",
  ];
  return normalTracks[(ctx.stageId ?? 0) % normalTracks.length];
}
