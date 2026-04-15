// Programmatic SFX using Web Audio API — no audio files needed

type SfxId =
  | "tower_archer"    // pluck/twang
  | "tower_mage"      // magical swoosh
  | "tower_cannon"    // boom
  | "tower_frost"     // shimmer
  | "tower_poison"    // bubble
  | "tower_tesla"     // zap
  | "tower_bomb"      // explosion
  | "enemy_hit"       // thud
  | "enemy_death"     // pop
  | "base_damage"     // alarm
  | "game_over"       // lose jingle
  | "stage_clear"     // win jingle
  | "skill_cast"      // whoosh
  | "tower_place"     // thunk
  | "tower_sell"      // coin
  | "wave_start";     // horn

const STORAGE_KEY = "td-sfx-settings";

interface SfxSettings {
  volume: number;
  muted: boolean;
}

function loadSettings(): SfxSettings {
  if (typeof window === "undefined") return { volume: 0.3, muted: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { volume: 0.3, muted: false, ...JSON.parse(raw) };
  } catch {}
  return { volume: 0.3, muted: false };
}

function saveSettings(s: SfxSettings): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

class SfxManager {
  private ctx: AudioContext | null = null;
  private settings: SfxSettings = loadSettings();
  private masterGain: GainNode | null = null;
  private listeners: Set<() => void> = new Set();
  // Throttle to avoid audio spam
  private lastPlayTime: Map<SfxId, number> = new Map();
  private readonly minInterval = 30; // ms

  private getCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (this.ctx) return this.ctx;
    try {
      type AudioContextCtor = { new (): AudioContext };
      const globalWindow = window as unknown as {
        AudioContext?: AudioContextCtor;
        webkitAudioContext?: AudioContextCtor;
      };
      const AC = globalWindow.AudioContext ?? globalWindow.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.volume;
      this.masterGain.connect(this.ctx.destination);
      return this.ctx;
    } catch {
      return null;
    }
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }
  private notify(): void { for (const f of this.listeners) f(); }

  getSettings(): Readonly<SfxSettings> { return this.settings; }

  setVolume(v: number): void {
    this.settings = { ...this.settings, volume: Math.max(0, Math.min(1, v)) };
    if (this.masterGain) this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.volume;
    saveSettings(this.settings);
    this.notify();
  }
  toggleMute(): void {
    this.settings = { ...this.settings, muted: !this.settings.muted };
    if (this.masterGain) this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.volume;
    saveSettings(this.settings);
    this.notify();
  }

  play(id: SfxId): void {
    const ctx = this.getCtx();
    if (!ctx || !this.masterGain || this.settings.muted) return;

    // Throttle
    const now = performance.now();
    const last = this.lastPlayTime.get(id) ?? 0;
    if (now - last < this.minInterval) return;
    this.lastPlayTime.set(id, now);

    // Resume if suspended (browser autoplay)
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    switch (id) {
      case "tower_archer": this.playArcher(ctx); break;
      case "tower_mage": this.playMage(ctx); break;
      case "tower_cannon": this.playCannon(ctx); break;
      case "tower_frost": this.playFrost(ctx); break;
      case "tower_poison": this.playPoison(ctx); break;
      case "tower_tesla": this.playTesla(ctx); break;
      case "tower_bomb": this.playBomb(ctx); break;
      case "enemy_hit": this.playHit(ctx); break;
      case "enemy_death": this.playDeath(ctx); break;
      case "base_damage": this.playBaseDamage(ctx); break;
      case "game_over": this.playGameOver(ctx); break;
      case "stage_clear": this.playStageClear(ctx); break;
      case "skill_cast": this.playSkillCast(ctx); break;
      case "tower_place": this.playTowerPlace(ctx); break;
      case "tower_sell": this.playSell(ctx); break;
      case "wave_start": this.playWaveStart(ctx); break;
    }
  }

  // ============ Tower Attack Sounds ============

  private playArcher(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.1);
  }

  private playMage(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.15);
    osc.frequency.linearRampToValueAtTime(200, t + 0.3);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.3);
  }

  private playCannon(ctx: AudioContext): void {
    const t = ctx.currentTime;
    // Low boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.2);

    // Noise burst for "boom"
    this.playNoise(ctx, 0.2, 0.15);
  }

  private playFrost(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.linearRampToValueAtTime(2400, t + 0.1);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.2);

    // Secondary shimmer
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(2400, t + 0.05);
    g2.gain.setValueAtTime(0.12, t + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc2.connect(g2).connect(this.masterGain!);
    osc2.start(t + 0.05); osc2.stop(t + 0.2);
  }

  private playPoison(ctx: AudioContext): void {
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(200 + i * 100, t + i * 0.03);
      osc.frequency.exponentialRampToValueAtTime(500 + i * 200, t + 0.1 + i * 0.03);
      gain.gain.setValueAtTime(0.15, t + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15 + i * 0.03);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(t + i * 0.03); osc.stop(t + 0.2 + i * 0.03);
    }
  }

  private playTesla(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.linearRampToValueAtTime(3000, t + 0.02);
    osc.frequency.linearRampToValueAtTime(500, t + 0.15);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.15);
    this.playNoise(ctx, 0.15, 0.08);
  }

  private playBomb(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.4);
    this.playNoise(ctx, 0.35, 0.3);
  }

  private playHit(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.05);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.08);
  }

  private playDeath(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.15);
  }

  private playBaseDamage(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.linearRampToValueAtTime(150, t + 0.2);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.3);
  }

  private playSkillCast(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.3);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.35);
  }

  private playTowerPlace(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.15);
  }

  private playSell(ctx: AudioContext): void {
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800 + i * 200, t + i * 0.06);
      gain.gain.setValueAtTime(0.15, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15 + i * 0.06);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(t + i * 0.06); osc.stop(t + 0.2 + i * 0.06);
    }
  }

  private playWaveStart(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const notes = [400, 600, 800];
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(notes[i], t + i * 0.15);
      gain.gain.setValueAtTime(0.2, t + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2 + i * 0.15);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(t + i * 0.15); osc.stop(t + 0.25 + i * 0.15);
    }
  }

  private playGameOver(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const notes = [500, 400, 300, 200];
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(notes[i], t + i * 0.15);
      gain.gain.setValueAtTime(0.25, t + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2 + i * 0.15);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(t + i * 0.15); osc.stop(t + 0.25 + i * 0.15);
    }
  }

  private playStageClear(ctx: AudioContext): void {
    const t = ctx.currentTime;
    const notes = [523, 659, 784, 1047]; // C E G C
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(notes[i], t + i * 0.12);
      gain.gain.setValueAtTime(0.25, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3 + i * 0.12);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(t + i * 0.12); osc.stop(t + 0.35 + i * 0.12);
    }
  }

  private playNoise(ctx: AudioContext, volume: number, duration: number): void {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(this.masterGain!);
    src.start();
  }
}

export const sfx = new SfxManager();
export type { SfxId };
