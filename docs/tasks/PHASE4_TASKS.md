# Phase 4 — Progression & Meta: Task Breakdown

**Status: complete** (shipped in v0.10.0 — 2026-06-06).

Goal: wrap the 9-stage campaign in a meta layer — pick where to play, score it, and reflect on it.
Source items: PLAN.md "Phase 4 — Progression & Meta" plus the Phase 6 deferred follow-up.

> PLAN.md's Phase 4 predated the 9-stage restructure (it assumed *sector == stage*). Wording was
> updated to the **9 stages / 3 sectors** model: "sector select" → a **stage select** grouped by
> sector; "per sector" persistence/score → **per stage** and **per run**.

---

## 0. Design decisions (resolved)

- [x] **Atom persistence model → ARCADE.** Atoms reset every stage (§2 is a documented no-op). The
      molecular tree is run-scoped per stage, not carried.
- [x] **Unlock granularity → PER STAGE.** Clearing stage N unlocks stage N+1; displayed grouped by sector.
- [x] **Persistence backend → `localStorage`** under one namespaced key `mm.save.v1`.
- [x] **Records → PER DIFFICULTY.** Unlocks, best scores, and the leaderboard are tracked separately
      for Easy/Normal/Hard.

---

## 1. Stage select screen ✓

- [x] New `StageSelectScene` ([src/scenes/StageSelectScene.ts](../../src/scenes/StageSelectScene.ts)),
      registered in [src/main.ts](../../src/main.ts)
- [x] 3×3 grid of the 9 stages, one column per sector (PETRI DISH / BLOOD AGAR / MACCONKEY), using
      `SECTORS` names + `stages.ts` flavor names; boss-finale stages marked `☣ BOSS`
- [x] Locked vs unlocked per `SaveSystem.getUnlockedStage(difficulty)`; locked cards show 🔒 and
      reject selection (red flash + shake)
- [x] Best score per stage shown on each card
- [x] Flow: Boot → tutorial → **DifficultyScene → StageSelectScene → `GameScene { stage }`**; EXPERIMENT
      COMPLETE returns to StageSelect; cursor starts on the furthest unlocked stage
- [x] Keyboard nav consistent with `DifficultyScene` (←→ between sectors, ↑↓ within, Z/Enter, ESC back)

## 2. Atom persistence across a run — N/A (arcade) ✓

- [x] Decision is **arcade**, so no carry logic. Documented here and in PLAN.md; nothing to build.

## 3. Score system — bonuses ✓

- [x] Base scoring + combo multiplier already existed (Phase 1)
- [x] Score is now the **cumulative run total**, carried between stages via the `runScore` registry
      key (seeded in `GameScene.init`, reset to 0 on a fresh run / death)
- [x] **Time bonus** — par scales with stage length; clearing under par awards a decaying bonus
- [x] **No-hit bonus** — flat bonus when the player finishes a stage at full HP
- [x] Bonus breakdown shown on the STAGE/SECTOR clear banner (`_finalizeStageScore` + `_showClearBanner`)

## 4. Local leaderboard ✓

- [x] `SaveSystem` ([src/systems/SaveSystem.ts](../../src/systems/SaveSystem.ts)) — single source for
      all meta persistence behind `mm.save.v1`, robust to missing/corrupt storage
- [x] Top-5 runs per difficulty: score, stage reached, difficulty, atom path, assembled molecules, date
- [x] `submitRun()` inserts + sorts + trims and returns placement; called on death and on completion
- [x] Placement shown on the death screen and the EXPERIMENT COMPLETE banner

## 5. Run summary ✓

- [x] Death screen and EXPERIMENT COMPLETE show a summary: stage reached, atom path (H/O/C/N), the
      molecules built (from `Player.elementSystem`), total score, and leaderboard placement
- [x] Best score per stage + unlock persisted on every clear (`_finalizeStageScore`)

## 6. Docs & verification ✓

- [x] Version bump 0.9.0 → **0.10.0**; PATCH_NOTES entry
- [x] PLAN.md — Phase 4 checked off, Current State refreshed
- [x] CLAUDE.md — new `StageSelectScene` + `SaveSystem`, updated scene flow
- [x] `npm run typecheck`, `npm run lint`, `npm run build` green (only the pre-existing static-class
      lint warnings on `SoundSystem` / `SaveSystem`)

---

## Touchpoints (as built)

| Area | Files |
|------|-------|
| Stage select / scene flow | [StageSelectScene.ts](../../src/scenes/StageSelectScene.ts), [main.ts](../../src/main.ts), [DifficultyScene.ts](../../src/scenes/DifficultyScene.ts) |
| Meta persistence | [SaveSystem.ts](../../src/systems/SaveSystem.ts) (`localStorage` `mm.save.v1`) |
| Scoring / run summary | [GameScene.ts](../../src/scenes/GameScene.ts) (`_finalizeStageScore`, `_submitRun`, `_runSummaryLines`, `_showClearBanner`, `_showDeathScreen`) |
| Run-score carry | `GameScene.init` + `registry` key `runScore` |
| Stage metadata | [stages.ts](../../src/stages.ts), [constants.ts](../../src/constants.ts) (`SECTORS`, `STAGE_COUNT`, `sectorOf`) |
