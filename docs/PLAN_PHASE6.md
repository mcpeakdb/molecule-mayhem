# Molecule Mayhem — Phase 6 Plan: Molecular Tree & Numpad Arsenal

> Second plan document, focused on the combat/progression overhaul. See [PLAN.md](PLAN.md)
> for the overall roadmap and [tasks/PHASE6_TASKS.md](tasks/PHASE6_TASKS.md) for the work breakdown.

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

- **Base element attack** for each atom with count ≥ 1. Level = `min(count, 3)`.
- **Compound attack** for each compound whose constituents are *all* present (count ≥ 1 each).
  Level = `min(sum of constituent counts, 3)`.

Compounds and their constituents:

| Compound | Atoms | Color (proposed) |
|----------|-------|------------------|
| Water (H₂O) | H + O | cyan `0x22ccff` |
| Ammonia (NH₃) | N + H | yellow-green `0xaadd44` |
| Carbon Dioxide (CO₂) | C + O | pale blue-grey `0x99bbcc` |
| Methane (CH₄) | C + H | combustion orange `0xff9922` |
| Nitric Oxide (NO) | N + O | reactive magenta `0xdd44aa` |
| Carbonic Acid (H₂CO₃) | C + H + O | acid blue `0x33aadd` |

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

- Retain: WASD/Arrows move, Space jump (+ double jump), Z punch.
- Retire the single `X` special. (Optional: alias `X` → "fire slot 1" for muscle memory — Open question O2.)

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

## Decisions to confirm

- **O1 — Attack/slot model.** Proposed: one slot per owned base element *and* per unlocked compound,
  available simultaneously, leveled by atom counts (above). Alternative: each level is its own slot
  (rejected — blows past 9 instantly).
- **O2 — Keep `X`?** Proposed: retire it; optionally alias to slot 1. Confirm preference.
- **O3 — 10th slot.** Max possible is 10 (all 4 bases + all 6 compounds). Proposed: bind Numpad 0 to
  the 10th (Carbonic Acid) and still call 9 the "design ceiling." Or hard-cap at 9 and hide the 10th.
- **O4 — Tree HUD depth.** Proposed: a compact molecular-diagram panel (owned atoms + lit compounds).
  Could be deferred to a follow-up if we want the mechanic working first.
- **O5 — Versioning.** Proposed **0.6.0** (large gameplay feature, pre-1.0 minor).

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
