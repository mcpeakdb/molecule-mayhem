# Phase 6 — Molecular Tree & Numpad Arsenal: Task Breakdown

Design doc: [../PLAN_PHASE6.md](../PLAN_PHASE6.md). Build in the order below — each section
depends on the ones above it.

---

## 1. Data model — attack registry (`src/constants.ts`, `src/types.ts`)

- [ ] Define an `ATTACKS` registry keyed by `AttackId`, each with: `element` (`ElementType`),
      `name`, `color`, `constituents` (atoms required), `slotOrder`, `cooldownMs`
- [ ] Base entries: `hydrogen`, `oxygen`, `carbon`, `nitrogen`
- [ ] Compound entries: `water`, `ammonia`, `carbon_dioxide`, `methane`, `nitric_oxide`, `carbonic_acid`
- [ ] Fixed slot priority order: H, O, C, N, Water, Ammonia, CO₂, Methane, NO, Carbonic Acid
- [ ] `src/types.ts`: add `AttackId`, `AttackSlot { id, level, slot, cooldownRemaining }`

---

## 2. ElementSystem rewrite (`src/systems/ElementSystem.ts`)

- [ ] Keep H/O/C/N counts; drop the single `type`/`level` collapse in `_resolve()`
- [ ] `collectAtom(element)` just increments the count (return whether any new attack unlocked)
- [ ] `getAvailableAttacks(): AttackSlot[]` — base attack per owned atom + compound attack when all
      constituents present; level = `min(count,3)` (base) / `min(sum,3)` (compound); sorted by slot order
- [ ] `getAttackLevel(id)` / `isUnlocked(id)` helpers
- [ ] Preserve `getSpecialName()`-style lookups for HUD labels (per attack id + level)

---

## 3. Input + dispatch + cooldowns (`src/entities/Player.ts`, `src/scenes/GameScene.ts`, `src/types.ts`)

- [ ] Bind Numpad 1–9 (`NUMPAD_ONE..NINE`) + number-row 1–9 fallback in `GameScene._setupInput()`
- [ ] Pass numpad presses into `Player.update()` (extend `InputKeys`)
- [ ] Replace single `_doSpecialAttack()` with `fireSlot(n)` → resolve slot → attack id + level → dispatch
- [ ] Per-attack cooldown map (replace shared `specialCooldown`); tick down each frame; ignore press if on cooldown
- [ ] Decide `X` key fate (Open question O2) — retire or alias to slot 1
- [ ] Emit `arsenal-update` event for the HUD when the kit or cooldowns change

---

## 4. Atom = choice node (`src/entities/Atom.ts`, `src/scenes/GameScene.ts`, `src/scenes/ElementChoiceScene.ts`, `src/scenes/BootScene.ts`)

- [ ] `Atom`: every node carries `choices: ElementType[]` (2–3); remove special-cased `mystery` path
- [ ] `BootScene`: generic "atom node" texture (or reuse mystery visual) for unresolved choices
- [ ] `GameScene._onAtomCollect()`: always open the choice overlay; on confirm, `collectAtom(chosen)`
- [ ] `GameScene._spawnStage()`: author `choices` per atom spawn to shape the tree across sectors
- [ ] `ElementChoiceScene`: present 2–3 base atoms; show what each pick unlocks/levels (tree-growth feedback)

---

## 5. Visual refinement pass (`src/entities/Player.ts`, `src/scenes/GameScene.ts`)

Restyle each to its atom color + juice (glow layers, trail, particles, impact ring/flash, shake).
Pattern reference: Proton Punch, Plasma Arc, Tidal Force (already done).

- [ ] **Hydrogen** — H3 Fusion Burst (blue `0x4499ff` → white-hot core, expanding nova ring)
- [ ] **Oxygen** (red/orange `0xff5533`) — O1 Oxidize slash, O2 Reactive Cloud, O3 Oxidation Nova
- [ ] **Water** (cyan `0x22ccff`) — W1 Water Jet bolt, W2 Hydro Wave surge *(W3 done)*
- [ ] **Carbon** (grey `0x888888`, diamond `0xaaddff`) — C1 Claw, C2 Diamond Shard, C3 Graphene Shockwave
- [ ] **Nitrogen** (teal `0x44ddcc`, frost `0x88eeff`) — N1 Frost, N2 Cryo Burst, N3 Absolute Zero
- [ ] **Ammonia** (yellow-green `0xaadd44`) — Lv1–3 caustic spray/cloud/deluge
- [ ] **Carbon Dioxide** (`0x99bbcc`) — Lv1–3 smog/suffocation/blackout
- [ ] **Methane** (orange `0xff9922`) — Lv1–3 ignite/chain/fireball
- [ ] **Nitric Oxide** (magenta `0xdd44aa`) — Lv1–3 rush/aura/overclock
- [ ] **Carbonic Acid** (acid blue `0x33aadd`) — Lv1–3 drop/spray/rain
- [ ] Recolor atom-collect burst map in `GameScene._onAtomCollect()` to per-atom colors

---

## 6. HUD arsenal (`src/scenes/HUDScene.ts`)

- [ ] Replace single ELEMENT/SPECIAL panel with an **attack bar**: up to 9 slots, numpad-numbered,
      colored per attack, dimmed while on cooldown (radial/linear wipe)
- [ ] Listen to `arsenal-update`; show level pips per slot
- [ ] Molecular tree panel (Open question O4) — owned atoms + lit compounds; may defer
- [ ] Update controls hint: `Numpad 1-9: Attacks` (drop `X: Special`)

---

## 7. Balance, docs, polish

- [ ] Retune per-attack cooldowns/damage now that attacks are usable in parallel
- [ ] Update `docs/PLAN.md` current-state; check off items here
- [ ] `docs/PATCH_NOTES.md` entry; bump `package.json` version (proposed 0.6.0)
- [ ] Update `CLAUDE.md` "Adding a new element" steps to the registry/tree flow
- [ ] Manual playtest: tree forks, all numpad slots, cooldowns, boss flow intact
</content>
