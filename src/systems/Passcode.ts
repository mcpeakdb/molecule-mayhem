import { type Difficulty, STAGE_COUNT } from '../constants';

// ── Stage passcodes ────────────────────────────────────────────────────────────
// Classic arcade-style unlock codes. Codes are *derived*, not stored: each one is a
// deterministic hash of (difficulty, stage, salt), so they aren't sitting in a lookup
// table to be eyeballed. Codes are per-difficulty — a Normal code won't unlock Hard —
// and entering one unlocks every stage up to and including its stage.
//
// Codes are 6-digit numeric so the on-screen entry pad stays a small numpad (the game
// has no DOM <input>) and matches the numpad/slot theme. Stage 1 is always unlocked, so
// it has no code; stages 2..STAGE_COUNT each get one (≈24 codes total).

// Bump this to invalidate all previously-shared codes.
const PASSCODE_SALT = 'meltdown-2026';

/** FNV-1a 32-bit hash → unsigned. Tiny, dependency-free, plenty of spread for our needs. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    // h *= 16777619, kept in 32-bit space via Math.imul.
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The 6-digit passcode for a given stage on a given difficulty. */
export function passcodeFor(stage: number, difficulty: Difficulty): string {
  const hash = fnv1a(`${difficulty}|${stage}|${PASSCODE_SALT}`);
  return (hash % 1_000_000).toString().padStart(6, '0');
}

/**
 * Match an entered code against the stages of `difficulty`. Returns the stage the code
 * unlocks (2..STAGE_COUNT), or null if it matches none. Whitespace is trimmed.
 */
export function resolvePasscode(code: string, difficulty: Difficulty): number | null {
  const trimmed = code.trim();
  if (trimmed.length !== 6) return null;
  for (let stage = 2; stage <= STAGE_COUNT; stage++) {
    if (passcodeFor(stage, difficulty) === trimmed) return stage;
  }
  return null;
}
