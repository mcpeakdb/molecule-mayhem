# Phase 6 — Molecular Tree & Numpad Arsenal: Task Breakdown

**Status: ✅ COMPLETE (v0.6.0 — 2026-06-04).**

Design doc: [../PLAN_PHASE6.md](../PLAN_PHASE6.md). Built in the order below — each section
depends on the ones above it.

---

## 1. Data model — attack registry (`src/constants.ts`, `src/types.ts`) ✓

- [x] `ATTACKS` registry keyed by `AttackId`, each with `constituents`, `slot`, `color`, `tierNames`, `cooldownMs`
- [x] Base entries: `hydrogen`, `oxygen`, `carbon`, `nitrogen`
- [x] Compound entries: `water`, `ammonia`, `carbon_dioxide`, `methane`, `nitric_oxide`, `carbonic_acid`
- [x] Fixed slot priority order via `ATTACK_ORDER`: H, O, C, N, Water, Ammonia, CO₂, Methane, NO, Carbonic Acid
- [x] `src/types.ts`: `AttackId` (in constants), `AttackSlot`, `ArsenalEntry`, `ArsenalUpdate`

---

## 2. ElementSystem rewrite (`src/systems/ElementSystem.ts`) ✓

- [x] Keep H/O/C/N counts; dropped the single `type`/`level` collapse
- [x] `collectAtom(atom)` increments the count, returns whether an attack unlocked/leveled
- [x] `getAvailableAttacks(): AttackSlot[]` — base + compound, leveled, sorted, numbered 1..9 then 0
- [x] `getAttackLevel(id)` / `isUnlocked(id)` / `getCounts()` / `getPrimary()` helpers
- [x] `getSpecialName(id, level)` retained for labels; `type`/`level` getters kept for player tint

---

## 3. Input + dispatch + cooldowns (`src/entities/Player.ts`, `src/scenes/GameScene.ts`, `src/types.ts`) ✓

- [x] Bind Numpad/number-row `1–9`,`0` slots in `GameScene._setupInput()`
- [x] `InputKeys` carries `slotKeys[][]` (numpad + number-row mirror per slot)
- [x] `_fireSlot(i)` → resolve i-th available attack → `_dispatchAttack(id, level, dir)`
- [x] Per-attack cooldown `Map`; ticked each frame; press ignored while on cooldown
- [x] `X` retired; slot `1` is the basic Punch until an attack unlocks, then becomes the first attack (O2)
- [x] `arsenal-update` emitted each frame + on atom pickup

---

## 4. Atom = choice node (`src/entities/Atom.ts`, `src/scenes/GameScene.ts`, `src/scenes/ElementChoiceScene.ts`, `src/scenes/BootScene.ts`) ✓

- [x] `Atom` carries `choices: BaseAtom[]`; `mystery` path removed
- [x] `BootScene`: `atom_node` texture (crossed-orbital choice node)
- [x] `GameScene._onAtomCollect()`: always opens the choice overlay
- [x] `GameScene._spawnStage()`: authored `choices` per spawn across the three sectors
- [x] `ElementChoiceScene`: presents 2–3 base atoms ("ADD AN ATOM")
- [x] Tree-growth feedback in the choice overlay — each card previews the exact attacks a pick would
      ★ unlock or ▲ level (computed from current atom counts via `ElementSystem.levelFor`/`attacksFor`)

---

## 5. Visual refinement pass (`src/entities/Player.ts`, `src/scenes/GameScene.ts`) ✓

Restyled each to its atom color + juice. Added reusable color-parameterized helpers in
`GameScene`: `spawnBurst`, `spawnNova`, `spawnSlashArc`, `spawnCloud`.

- [x] **Hydrogen** — H3 Fusion Burst (white-hot core + blue nova rings + sparks) *(H1/H2 prior)*
- [x] **Oxygen** (red/orange `0xff5533`) — O1 corrosive slash, O2 reactive cloud, O3 oxidation nova
      (fixed: was mistakenly green)
- [x] **Water** (cyan `0x22ccff`) — W1 Water Jet w/ droplet spray, W2 Hydro Wave surge *(W3 prior)*
- [x] **Carbon** (grey `0x888888`, diamond `0xaaddff`) — C1 triple claw+blood, C2 sparkling shard, C3 shockwave+debris
- [x] **Nitrogen** (frost `0x88eeff`) — N1 frost slash, N2 cryo nova, N3 Absolute Zero screen-freeze
- [x] **Ammonia** (yellow-green `0xaadd44`) — Lv1–3 caustic clouds + screen haze
- [x] **Carbon Dioxide** (`0x99bbcc`) — Lv1–3 smog clouds/nova + blackout
- [x] **Methane** (orange `0xff9922`) — Lv1–3 flame-trailed bolt, fiery nova + flame burst on detonate
- [x] **Nitric Oxide** (magenta `0xdd44aa`) — Lv1–3 activation flare + nova
- [x] **Carbonic Acid** (acid blue `0x33aadd`) — Lv1–3 drops w/ splash + corrosive puddle
- [x] Atom-collect burst uses the choice-node purple (per-atom color resolved on pick instead)

---

## 6. HUD arsenal (`src/scenes/HUDScene.ts`) ✓

- [x] **Attack bar** of up to 10 chips, numpad-numbered, colored per attack, dimmed with a downward
      cooldown wipe while recharging
- [x] Listens to `arsenal-update`; shows level pips + the attack's tier name per chip
- [x] Molecular tree panel — owned-atom badges (H/O/C/N with live counts); compounds light up as
      chips in the attack bar
- [x] Controls hint updated (`. : Punch   Numpad/Row 1-9,0: Attacks`)

---

## 7. Balance, docs, polish ✓

- [x] First cooldown pass: bases stay snappy (700–900ms); strong AOE/screen-wide compounds slowed
      (Ammonia/CO₂ 1300, Methane 1100, Carbonic Acid 1800). Stoichiometry also self-gates power
      (compounds rarely exceed Lv1 early). Fine-tuning pending real playtest
- [x] Updated `docs/PLAN.md` current-state; checked off items here
- [x] `docs/PATCH_NOTES.md` entry; bumped `package.json` to 0.6.0
- [x] Updated `CLAUDE.md` "Adding a new element" steps to the registry/tree flow
- [x] **Manual playtest**: tree forks, all numpad/number-row slots, cooldowns, boss flow — signed off

---

## Open / follow-ups

- **Atom persistence across sectors?** Atoms currently reset each sector (fresh `Player`). Making them
  carry over a run (reset on death) would let the tree grow and complex molecules gate on progression.
- **Choice-overlay progress hints** — show partial progress toward locked compounds (e.g. "CH₄ 2/4 H"),
  not just the attacks a pick completes.
</content>
