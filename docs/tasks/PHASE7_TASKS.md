# Phase 7 — Difficulty Rework, Gold Wildcard & Element Facts: Task Breakdown

**Status: ✅ COMPLETE (v0.12.0 — 2026-06-06).**

Design summary: [../PLAN.md](../PLAN.md) → "Phase 7". The four features are independent and can be
built in any order; within each feature, work top-to-bottom.

---

## 1. Element facts on the choice screen

- [x] Author an `ELEMENT_FACTS: Partial<Record<ElementType, string[]>>` pool (in `src/constants.ts`
      or a new `src/facts.ts`) — several short facts for each base atom (H/O/C/N), each compound
      (water, ammonia, CO₂, methane, NO, carbonic acid), and Gold.
- [x] `ElementChoiceScene._buildCard()`: pick one fact at random for the card's element and render it
      in a footer zone — small font, dim color, `wordWrap` to card width, origin top.
- [x] Adjust card height / internal Y offsets so the fact footer never overlaps the title, symbol,
      or the "UNLOCKS / LEVELS" change list (test the 3-change Carbonic-Acid case).
- [x] Confirm facts re-roll each time the overlay opens, not per frame.

## 2. Easy-mode simplification — single strongest weapon

- [x] Add `simplifiedArsenal: boolean` to each `DIFFICULTY_SCALE` entry (true on the easiest tier
      only) in `src/constants.ts`.
- [x] `ElementSystem`: expose the simplified view — when simplified, return only `[getPrimary()]`
      numbered as key `1` (new `getSimplifiedArsenal()` or a flag on `getAvailableAttacks()`).
- [x] Thread the difficulty's `simplifiedArsenal` flag from `GameScene` into the player/element
      system so the arsenal + HUD render a single slot.
- [x] Verify `Player._fireSlot`, the punch-until-armed fallback on key `1`, and the HUD numpad bar
      all behave with a one-entry arsenal.
- [x] Confirm atom counts still accumulate underneath (tree grows; only the bound/shown attack is
      reduced to the strongest).

## 3. Difficulty rename — Normal / Hard / Extreme

- [x] `src/constants.ts`: rename `Difficulty` to `'normal' | 'hard' | 'extreme'`; re-key
      `DIFFICULTY_SCALE` carrying numbers forward (normal = old easy + `simplifiedArsenal:true`,
      hard = old normal, extreme = old hard).
- [x] `DifficultyScene`: update `OPTIONS` labels (NORMAL / HARD / EXTREME), colors, descriptions,
      stat strings, and default cursor.
- [x] `SaveSystem`: update `DIFFICULTIES`, `emptyDifficulty`/`emptySave`, and the `SaveData` keys.
- [x] **Save migration:** bump `SAVE_KEY` to `mm.save.v2`; on load, migrate old `easy→normal`,
      `normal→hard`, `hard→extreme` slots from `mm.save.v1` (best effort, tolerate missing/corrupt).
- [x] `LeaderboardScene`: update `DIFFS` and `DIFF_COLOR`.
- [x] Update remaining consumers: `StageSelectScene`, `TitleScene` default registry value,
      `GameScene` tutorial default (`'easy'` → `'normal'`), and any `.toUpperCase()` display sites.
- [x] `npm run typecheck` clean after the union change (compiler flags every missed consumer).

## 4. Gold — the 1% wildcard atom

- [x] `src/constants.ts`: add `GOLD` to `ELEMENTS`, `ELEMENT_COLORS` (`0xffd700`), `ELEMENT_NAMES`.
      Keep it out of `ATTACKS`, `BaseAtom`, `BASE_ATOMS`, `ATTACK_ORDER`.
- [x] `BootScene`: add a distinct shimmering `atom_gold` texture.
- [x] `Atom`: add a `gold` flag; use the gold texture/tween when set.
- [x] `GameScene._spawnStage()`: 1% roll per atom node → spawn a Gold node instead of a normal
      choice node.
- [x] `GameScene` atom-collect path: on a gold node, open the Gold choice overlay; on confirm apply
      `ElementSystem.collectAtom(chosen)` **twice** (+2). Play a distinct fanfare + gold burst.
- [x] `ElementChoiceScene`: support a `gold: true` / `grant: 2` mode — title/framing shows "+2",
      offers the four base atoms, previews the level changes for a +2 pick, shows facts. (Reuse the
      scene; no second scene.)
- [x] Gold scope is **four base atoms only**, granting **+2** to the chosen atom (locked decision).

## 5. Wrap-up

- [x] Bump `package.json` to `0.12.0`.
- [x] Add a `v0.12.0` entry to [../PATCH_NOTES.md](../PATCH_NOTES.md).
- [x] Mark Phase 7 ✅ COMPLETE in [../PLAN.md](../PLAN.md) and check off this file.
- [x] `npm run lint` + `npm run typecheck` clean; manual smoke test of all four features.
