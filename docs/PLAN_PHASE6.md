# Molecule Mayhem — Phase 6 Plan: Molecular Tree & Numpad Arsenal

> **Status: ✅ COMPLETE — shipped in v0.6.0 (2026-06-04).**
>
> Second plan document, focused on the combat/progression overhaul. See [PLAN.md](PLAN.md)
> for the overall roadmap and [tasks/PHASE6_TASKS.md](tasks/PHASE6_TASKS.md) for the work breakdown.
> Deferred follow-ups (atom persistence across sectors; choice-overlay progress hints) are tracked
> at the bottom of the task file.

## Goal

Turn the single-element progression into a **branching molecular tree** where the player
assembles a kit of **simultaneously usable attacks**, fires them from the **numpad**, and every
attack is **restyled to match its atom/compound color** with the same juice pass we did for
Proton Punch, Plasma Arc, and Tidal Force.

Three threads, in priority order:

1. **Progression redesign** — every atom pickup is a *choice* of 2+ atoms; choices accumulate into a tree.
2. **Arsenal + input redesign** — owning atoms unlocks multiple attacks at once, each bound to a numpad key (up to 9).
3. **Visual refinement pass** — every remaining special restyled to its atom color + juiced.

---

## 1. Progression: the Molecular Tree

### Current behavior (to replace)

- `ElementSystem` keeps counts of H/O/C/N and `_resolve()` collapses them to **one** dominant
  `type` + `level`. Only "mystery" atoms offer a choice; plain atoms auto-apply.
- The player has exactly **one** special (key `X`) = the resolved element's attack at the resolved level.

### New behavior

- The player accumulates a **multiset of base atoms**: H, O, C, N (counts, as today).
- **Every atom pickup is a choice node.** On collect, the game opens the choice overlay offering
  **2–3 base atoms**; the picked atom increments its count. (No more "auto-apply" plain atoms,
  no separate "mystery" type — every node is a fork in the tree.)
- The set of owned atoms unlocks a **set of available attacks simultaneously** (see §2), instead of
  collapsing to one. This is the "tree": each pick is a branch, and combinations light up compounds.

### Choice authoring

- Each atom spawn carries an explicit `choices: ElementType[]` (2–3 options), so stages can be
  *designed* to steer the tree (e.g., early forks between H/O, later forks introducing C/N).
- Fallback: if no choices authored, offer a sensible random pair from {H, O, C, N}.

---

## 2. Arsenal: attacks derived from owned atoms

### Derivation rule

From the current atom counts, compute the list of **available attacks**:

- **Real stoichiometry** — each molecule has a recipe of exact atom counts (`ATTACKS[id].recipe`).
- **Level = complete copies** of the recipe the atoms can assemble, capped at 3
  (`level = min over atoms of floor(count / required)`). Base atoms have a 1-atom recipe, so their
  level is just `min(count, 3)`. e.g. Water (2H+1O): 2H1O → Lv1, 4H2O → Lv2, 6H3O → Lv3.

Compound recipes:

| Compound | Recipe | Color |
|----------|--------|-------|
| Water (H₂O) | 2 H + 1 O | cyan `0x22ccff` |
| Ammonia (NH₃) | 1 N + 3 H | yellow-green `0xaadd44` |
| Carbon Dioxide (CO₂) | 1 C + 2 O | pale blue-grey `0x99bbcc` |
| Methane (CH₄) | 1 C + 4 H | combustion orange `0xff9922` |
| Nitric Oxide (NO) | 1 N + 1 O | reactive magenta `0xdd44aa` |
| Carbonic Acid (H₂CO₃) | 2 H + 1 C + 3 O | acid blue `0x33aadd` |

Because molecules cost several atoms, sectors ramp the atom supply: **Sector 1 seeds only 4 atoms**
(base attacks / a little Water), **Sector 2 = 6** (adds Nitrogen → CO₂/NO/Ammonia), **Sector 3 = 9**
(all four → Methane / Carbonic Acid).

Base colors: H `0x4499ff`, O `0xff5533`, C `0x888888`, N `0x44ddcc`.

> **Key difference from today:** base and compound attacks are available *at the same time*.
> If you own H and O you can fire Hydrogen, Oxygen, **and** Water — they no longer collapse.

### Slots & numpad binding

- Available attacks fill **slots in a fixed priority order**: H, O, C, N, then Water, Ammonia,
  CO₂, Methane, NO, Carbonic Acid. Only *available* attacks occupy slots, numbered `1..N`.
- Bound to **Numpad 1–9** (`NUMPAD_ONE..NUMPAD_NINE`). Number-row `1–9` mirrored as a
  laptop-friendly fallback. Max simultaneous is 10 (4 base + 6 compounds); Carbonic Acid (needs all
  three atoms) naturally lands last — practically you reach ≤ 9 in a normal run, and the doc treats
  9 as the design ceiling. (Open question O3 covers the 10th-slot edge case.)
- **Per-attack cooldowns** replace the single shared `specialCooldown`. Each slot tracks its own
  cooldown so the kit feels like an arsenal, not one button.

### Retired/retained keys

- Retain: WASD/Arrows move, Space jump (+ double jump).
- Retire the single `X` special **and** `Z` punch. Slot `1` doubles as the basic Punch until an
  attack is unlocked, then becomes the first attack (final O2 decision — see below).

---

## 3. Visual refinement pass

Restyle every remaining special to its atom/compound color and give it juice (layered glow,
trails, particles, impact rings, screen feedback) consistent with the three already done.

Already done: **Proton Punch (H1)**, **Plasma Arc (H2)**, **Tidal Force (Water3)**.

To do (27 variants): H3; O1–3; Water1–2; C1–3; N1–3; Ammonia1–3; CO₂1–3; Methane1–3; NO1–3; Carbonic Acid1–3.

Guidance per element is in [tasks/PHASE6_TASKS.md](tasks/PHASE6_TASKS.md) §5.

---

## Affected files

| File | Change |
|------|--------|
| `src/constants.ts` | Attack registry: id, element, name, color, constituent atoms, slot order, cooldown |
| `src/types.ts` | `AttackId`, `AttackSlot`, arsenal types |
| `src/systems/ElementSystem.ts` | Rewrite: multiset → `getAvailableAttacks()`; drop single-type collapse |
| `src/entities/Player.ts` | Dispatch by attack id; per-attack cooldowns; restyle each `_specialXxx` |
| `src/entities/Atom.ts` | Every atom is a choice node (drop the special-cased `mystery` type) |
| `src/scenes/GameScene.ts` | Always open choice on collect; numpad input; new juiced spawn helpers |
| `src/scenes/ElementChoiceScene.ts` | Per-pickup base-atom choice + tree-growth feedback |
| `src/scenes/HUDScene.ts` | Numpad attack bar (up to 9, colored, cooldown state) + molecular tree panel |
| `src/scenes/BootScene.ts` | Generic atom-node texture; any new effect textures |
| `docs/*` | This plan, task list, PATCH_NOTES, PLAN.md current-state |

---

## Confirmed decisions

- **O1 — Attack/slot model.** ✅ One slot per owned base element *and* per unlocked compound,
  available simultaneously, leveled by completed recipe copies (real stoichiometry — see §2).
- **O2 — Controls.** ✅ **All offense on the numpad.** No dedicated punch key: slot `1` is the basic
  Punch until an attack unlocks, then becomes the first attack. `Z`/`X` retired. `1–9` + `0` = slots.
- **O3 — 10th slot.** ✅ Numpad `0` binds the 10th slot (Carbonic Acid, needs all three atoms).
- **O4 — Tree HUD.** ✅ Build the molecular-tree HUD panel now (owned atoms + lit compounds),
  alongside the numpad attack bar.
- **O5 — Versioning.** ✅ **0.6.0**.

### Final control scheme

```
WASD / Arrows = move      Space = jump (+ double jump)
Numpad/Row 1  = first attack slot — basic Punch until you unlock an attack
Numpad/Row 2-9 = attack slots (in priority order)
Numpad/Row 0  = 10th slot (Carbonic Acid)
```

---

## Sequencing

1. Data model (registry + `ElementSystem` rewrite) — nothing visible yet, but everything builds on it.
2. Input + dispatch + per-attack cooldowns — kit becomes playable on numpad.
3. Atom choice / tree — every pickup forks; stages author choices.
4. HUD arsenal bar (+ tree panel).
5. Visual refinement pass, element by element.
6. Balance, docs, patch notes, version bump.
</content>
</invoke>
