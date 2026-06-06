// ── Global game settings ──────────────────────────────────────────────────────
// Small, synchronously-readable settings cached in memory and mirrored to
// localStorage. Unlike SaveSystem (progression, per-difficulty), these are global
// preferences read on hot paths (every sound, every screen shake), so access must
// be cheap and never throw.

export interface GameSettings {
  volume: number; // 0..1 master volume
  muted: boolean;
  sfx: boolean; // sound effects enabled
  screenShake: boolean;
  tutorialDone: boolean; // set once the M.E.G. tutorial has been completed/skipped
  compoundIntroSeen: boolean; // set once M.E.G. has explained the Compound Selection menu
}

const KEY = 'mm.settings.v1';

const DEFAULTS: GameSettings = {
  volume: 0.8,
  muted: false,
  sfx: true,
  screenShake: true,
  tutorialDone: false,
  compoundIntroSeen: false,
};

let cache: GameSettings | null = null;

export default class Settings {
  static get(): GameSettings {
    if (!cache) cache = Settings._load();
    return cache;
  }

  /** Merge a partial update, persist, and keep the in-memory cache hot. */
  static set(patch: Partial<GameSettings>): void {
    cache = { ...Settings.get(), ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      // Storage blocked/full — settings just won't persist this session.
    }
  }

  /** Volume actually applied to audio: 0 when muted or SFX are off. */
  static effectiveVolume(): number {
    const s = Settings.get();
    if (s.muted || !s.sfx) return 0;
    return Math.max(0, Math.min(1, s.volume));
  }

  private static _load(): GameSettings {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      return {
        volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : DEFAULTS.volume,
        muted: parsed.muted ?? DEFAULTS.muted,
        sfx: parsed.sfx ?? DEFAULTS.sfx,
        screenShake: parsed.screenShake ?? DEFAULTS.screenShake,
        tutorialDone: parsed.tutorialDone ?? DEFAULTS.tutorialDone,
        compoundIntroSeen: parsed.compoundIntroSeen ?? DEFAULTS.compoundIntroSeen,
      };
    } catch {
      return { ...DEFAULTS };
    }
  }
}
