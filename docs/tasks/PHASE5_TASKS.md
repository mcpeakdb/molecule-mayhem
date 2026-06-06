# Phase 5 — Content & QOL: Task Breakdown

**Status: complete** (shipped in v0.11.0 — 2026-06-06). Mobile/gamepad support deferred.

Decisions for this pass: the two original art/terrain items (Tiled tilemaps, external sprite sheets)
conflicted with the project's **all-procedural, no-external-assets** rule, so they were kept
procedural — terrain variety + an art/juice polish pass generated in code. All four QOL features were
built.

> The original Phase 5 plan also listed **Pause Menu** and **Difficulty Modes** — both shipped earlier
> in **v0.4.0** — and **Gamepad/Mobile**, **Tilemap stages**, and **External sprite assets**, whose
> disposition is recorded under §8 below.

---

## 1. Settings system + sound/shake wiring ✓

- [x] `src/systems/Settings.ts` — cached, synchronously-readable global prefs in `localStorage`
      (`mm.settings.v1`): volume, muted, sfx, screenShake, tutorialDone. Never throws.
- [x] `SoundSystem` routes every note through a per-`AudioContext` master gain set to the effective
      volume (0 when muted / SFX off); `play()` early-returns when inaudible.
- [x] `GameScene.shake()` helper honors the screen-shake setting; the ~20 `cameras.main.shake` call
      sites in `Player`/`Boss`/`GameScene` were rerouted through it.

## 2. Settings scene ✓

- [x] `SettingsScene` — volume (10% steps with a bar), mute, SFX, screen-shake toggles; persists via
      `Settings`; plays a preview blip on audible changes. Reachable from the title.

## 3. Leaderboard viewer ✓

- [x] `LeaderboardScene` — top-5 runs per difficulty (tabbed with ←→), showing rank, score, stage
      reached, atom path, and date from `SaveSystem.getLeaderboard`. Reachable from the title and
      from stage select (`L`).

## 4. Help / controls screen ✓

- [x] `HelpScene` — movement, jump/double-jump, numpad attacks, collect, pause, and the gap hazard.
      Reachable from the title.

## 5. Title scene + boot flow ✓

- [x] `TitleScene` main menu (Start, Stage Select, Leaderboard, Controls, Settings) with a decorative
      orbiting atom; boot now goes to the title instead of straight into the tutorial.
- [x] `Start` runs the tutorial only if `!tutorialDone` (set on tutorial completion/skip in
      `_exitToDifficulty`), otherwise goes to difficulty select.
- [x] All new scenes registered in `main.ts`.

## 6. Procedural terrain / art polish pass ✓

- [x] Per-sector decorative **biome props** scattered along each stage (petri colonies / blood cells /
      crystal shards) on a slow-parallax background layer, plus a **horizon prop row** behind the
      characters — all generated in code in `GameScene._buildBiomeProps` (no external assets).
- [x] A **vignette** overlay for mood — a radial-gradient canvas texture built in `BootScene`, added
      screen-fixed in `GameScene`.

## 7. Renamed the game ✓

- [x] **Molecule Mayhem → Molecular Meltdown** across the title screen, `index.html`, `package.json`,
      and docs (done alongside this phase).

## 8. Original items: disposition

- [x] **Pause Menu** — shipped in v0.4.0 (`PauseScene`).
- [x] **Difficulty Modes** — shipped in v0.4.0 (`DifficultyScene`, `DIFFICULTY_SCALE`).
- [ ] **Gamepad / Mobile controls** — **deferred**. Skipped this pass.
- [~] **Tilemap stages** / **External sprite assets** — the external-asset items. Reinterpreted as the
      procedural terrain + art pass above to respect the no-external-assets rule; the literal
      external-asset versions are intentionally **not** pursued.

---

## Docs & verification ✓

- [x] Version bump 0.10.0 → **0.11.0**; PATCH_NOTES entry
- [x] PLAN.md Phase 5 checked off (mobile/gamepad deferred); Current State refreshed
- [x] CLAUDE.md — new scenes (`TitleScene`/`SettingsScene`/`LeaderboardScene`/`HelpScene`) + `Settings`
- [x] `npm run typecheck`, `npm run lint`, `npm run build` green (only the static-class lint warnings
      on `SoundSystem` / `SaveSystem` / `Settings`)
