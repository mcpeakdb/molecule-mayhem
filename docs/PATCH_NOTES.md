# Patch Notes

## v0.16.0 — 2026-06-07

### Stage passcodes

- **Unlock stages with a passcode.** Each stage past the first has a 6-digit code; entering it on
  the Stage Select screen unlocks every stage up to and including that one. Lets you resume progress
  on a fresh device (or after clearing browser data) without replaying everything.
- **Per-difficulty codes.** Codes are distinct for Normal / Hard / Extreme and only unlock on the
  difficulty that's currently selected — a Normal code won't open Hard.
- **Codes are shown as you earn them.** Every unlocked stage card now displays its `Code ######`, so
  you can jot it down for later. The codes are derived (hashed from the stage + difficulty), not
  stored in a table.
- **Entry UI.** Press **P** or tap **⌨ ENTER CODE** on the Stage Select screen to open a numpad
  modal (works by tap or physical keyboard: digits, Backspace, Enter to submit, Esc to cancel).
  Invalid codes flash an error; valid ones unlock immediately and the stage grid refreshes.

## v0.15.0 — 2026-06-06

### Mobile / touch support

- **Attacks are now Z / X / C** (slots 1-3) instead of the number row / numpad — easier to reach
  and a natural fit for the on-screen buttons. Z is still the basic punch until you arm a compound.
- **On-screen controls.** A floating thumbstick (touch the left half of the screen) drives movement;
  the right thumb gets dedicated **Z / X / C attack buttons** (coloured to their compound, dimming on
  cooldown), a **jump button (⤒)**, and a **pause button (❚❚)**. Tapping a HUD weapon chip also fires
  that slot. No keyboard required — the jump button covers the missing Space key.
- **Tap to advance dialogue.** M.E.G.'s tutorial/story boxes now advance on a tap as well as
  Space/Z, so the intro is no longer a dead end on phones (the hint reads "▸ Tap / Space"). Tutorial
  prompts reference the on-screen stick/buttons too.
- **Auto-detection + toggle.** Touch controls appear automatically on touch-capable devices. A new
  **Touch Controls** row in Settings (AUTO / ON / OFF) lets you force them on or off.
- **Every menu is now tappable.** Title, Difficulty, Stage Select (with ‹ BACK / LEADERBOARD ›
  buttons), Leaderboard, Settings, Controls, Pause + Compound Selection, and the level-up element
  picker all respond to taps as well as the keyboard. Card menus use tap-to-select then
  tap-again-to-confirm.
- **Fullscreen (hides the mobile URL bar).** Touch devices auto-enter fullscreen on the first tap
  (best-effort via the Fullscreen API); a new **Fullscreen** row in Settings toggles it on any
  device, and `apple-mobile-web-app-capable` meta tags let iPhone users run chromeless from the
  home screen (where in-page fullscreen isn't supported).
- **Cleaner stage-clear screen.** On clearing a stage the weapon chips and on-screen controls hide,
  and you can **tap (not just press Z)** to continue to the next stage.
- **Mobile viewport.** Pinch/double-tap zoom is disabled and the canvas swallows pan gestures, so
  dragging the stick won't scroll the page. The game still scales to fit any screen.
- **Properly centered & maximized on every screen.** Fixed a bug where a letterboxed canvas was
  pushed off-center (the page's flexbox and Phaser's centering were fighting each other) — it now
  sits dead-centre and fills as much of the viewport as the 16:9 ratio allows, on any aspect ratio.
  Uses dynamic viewport height (`100dvh`) so a phone's address bar no longer shrinks the game, and
  shows a **"rotate to landscape"** prompt on phones held in portrait (where a landscape game would
  otherwise be tiny).

### Fixed

- **Restarting a boss stage stranded you near the exit.** The boss-arena camera/movement lock
  (v0.14.0) wasn't reset when the reused scene restarted, so after dying you spawned clamped to the
  old arena with no way to walk back. The lock and its activation listener are now cleared on every
  stage `init`.

## v0.14.0 — 2026-06-06

### Boss fights are now dodge-and-whittle duels

- **Bosses no longer chase you.** Every boss now makes a dramatic entrance — sweeping in from the
  edge of the arena — then holds station near its anchor, hovering and bobbing instead of charging
  the player. You whittle its health bar down while reading and dodging its attacks.
- **Telegraphed attack patterns.** Each attack winds up with a readable tint-pulse flash, then
  fires one of four patterns: an **aimed spread** (sidestep it), a **radial ring** (slip through a
  gap), a re-aiming **barrage** (keep moving to break its lead), or a **raking sweep** (run with it
  to stay in a safe lane). Variety, projectile speed, and aggression ramp up as the boss loses HP.
- **Arena lock.** When a boss activates, the camera pins to a single screen-wide arena and you're
  confined to it for the fight — no running away mid-duel.
- Touching the boss still hurts (a light, cooldown-gated contact tap), so melee builds trade a bit
  of HP for damage rather than standing inside it with impunity.

## v0.13.0 — 2026-06-06

### Phase 8 — Weapon Loadouts & Compound Selection

- **Bindable weapon slots.** Instead of "wield your N strongest," every difficulty now gives you a
  fixed set of weapon keys you assign yourself: **3 slots (keys 1-2-3) on Normal and Hard, 2 slots
  (keys 1-2) on Extreme.**
- **Compound Selection menu.** Pause the game and pick **COMPOUND SELECTION** to bind any compound
  you've synthesized to keys 1–3. Use ←/→ to change a key's compound, ↑/↓ to pick the key, Esc to
  go back. A compound can only sit on one key at a time. Changes apply instantly and persist for the
  run.
- **Auto-assign + M.E.G. coaching.** Your first unlocked compounds fill the empty slots
  automatically. The first time you synthesize more compounds than you have slots, **M.E.G. pops in
  to explain the Compound Selection menu** (once, ever).
- HUD weapon bar now shows your bound loadout (with empty-slot placeholders), centered to your slot
  count; the controls screen and difficulty cards were updated to match.

### Fixed

- **Soft-lock when M.E.G.'s Compound Selection coaching first fired.** The GameScene instance is
  reused across restarts, so the dialogue UI references survived from the tutorial as destroyed
  objects; `_say` then skipped rebuilding them and showed nothing while leaving the game paused.
  The dialogue refs are now cleared on every scene `init`, so the box always rebuilds.

## v0.12.1 — 2026-06-06

### Changed

- **Normal now arms your two strongest weapons.** Instead of a single button, Normal binds your two
  most-advanced attacks to keys `1` and `2` — still a simplified arsenal, but with a primary and a
  backup. Hard and Extreme keep the full numpad.
- **Radical Rush (Nitric Oxide) has a point now.** For the buff's full duration the player is
  **immune to all damage** and **rams enemies for contact damage** — a fast, invulnerable battering
  charge rather than just a speed boost. Reactive Aura (Lv2) and Overclock (Lv3) scale the same way.
  Its cooldown is now **twice the buff duration** (so higher tiers, which last longer, also wait
  longer before recasting).

### Fixed

- **Enemies could wander off-screen and seal the exit.** A patrolling germ could drift to an
  unreachable corner, leaving the area "clear" of visible enemies but the exit still sealed and the
  player stuck. Enemies that have joined the fight are now confined to the visible arena.

## v0.12.0 — 2026-06-06

### Phase 7 — Difficulty Rework, Gold Wildcard & Element Facts

- **Difficulties renamed → Normal / Hard / Extreme.** The old Easy/Normal/Hard tiers shift up one
  notch: the gentle tuning is now the baseline **Normal**, with **Hard** and **Extreme** above it.
  Existing saves migrate automatically (`mm.save.v1` → `mm.save.v2`), carrying unlocks, best scores,
  and leaderboards one tier up.
- **Normal is now one-button.** On Normal you wield only your single strongest attack, bound to key
  `1`, instead of the full numpad arsenal — a simpler on-ramp. The molecular tree still grows
  underneath; Hard and Extreme keep the full arsenal.
- **Gold — the 1% wildcard atom.** Atom nodes have a rare 1% chance to spawn as a shimmering **Gold**
  atom. Collecting one lets you pick any base element and grants it **+2** (worth two level-ups),
  with its own gold flourish and fanfare.
- **Element facts on the choice screen.** Each atom card now shows a random real-world fact about its
  element at the bottom, so the choice overlay teaches a little chemistry as you build.

## v0.11.1 — 2026-06-06

### Fixed

- **Game froze when collecting an atom / on any screen shake.** The Phase 5 screen-shake helper
  (`GameScene.shake`) was accidentally calling itself instead of the camera, causing infinite
  recursion (stack overflow) the first time anything shook the screen — which made the element-choice
  flow appear to lock up. It now calls `this.cameras.main.shake` as intended.

## v0.11.0 — 2026-06-06

### Renamed: Molecule Mayhem → **Molecular Meltdown**

The game has a new name, reflected on the title screen, the browser tab, `package.json`, and the docs.

### Phase 5 — Content & QOL

Mobile/gamepad support was skipped this pass; the art/terrain items were kept **procedural** (no
external assets), in keeping with the project's identity.

- **Title screen** (`TitleScene`) — boot now opens to a main menu (Start, Stage Select, Leaderboard,
  Controls, Settings) with a decorative orbiting atom, instead of dropping straight into the tutorial.
  The tutorial only auto-runs once (until you complete or skip it).
- **Settings** (`SettingsScene` + new `Settings` system) — master **volume**, **mute**, **SFX** toggle,
  and **screen-shake** toggle, persisted to `localStorage`. All sound now routes through a master gain
  that honors these; every camera shake honors the screen-shake setting.
- **Leaderboard viewer** (`LeaderboardScene`) — browse the top-5 runs per difficulty (we already
  stored them); reachable from the title and from stage select (`L`).
- **Controls screen** (`HelpScene`) — a quick reference for movement, jumping, the numpad attacks,
  collecting, and the gap hazard.
- **Procedural art pass** — each sector now has distinct decorative scenery (colonies / blood cells /
  crystal shards) on a parallax background plus a horizon prop row, and a **vignette** darkens the
  screen edges for mood. All generated in code — still no external asset files.

## v0.10.0 — 2026-06-06

### Phase 4 — Progression & Meta

A meta layer around the 9-stage campaign: choose where to play, score your run, and reflect on it.
Decisions for this pass: **arcade** atom model (the molecular tree resets each stage), **per-stage**
unlocks, and records tracked **per difficulty**.

- **Stage select screen** (`StageSelectScene`) — a 3×3 grid of the nine stages, one column per
  sector, with boss-finale stages marked. Stages unlock sequentially (clear N → N+1 opens); locked
  stages show a lock and can't be entered. Each card shows your **best score** for that stage. The
  flow is now Difficulty → **Stage Select** → play.
- **Local save** (`SaveSystem`, `localStorage` key `mm.save.v1`) — persists unlocks, per-stage best
  scores, and a **top-5 leaderboard**, all kept separately per difficulty. Robust to missing/corrupt
  data (falls back to a fresh save).
- **Run scoring** — score is now a **cumulative run total** carried across stages (reset on a fresh
  run or death). Stage clears award a **time bonus** (decays with how long you took, scaled to stage
  length) and a **flawless/no-hit bonus** (finish a stage at full HP). The clear banner shows the
  breakdown.
- **Run summary** — the death screen and the EXPERIMENT COMPLETE screen now show the stage reached,
  your atom path (H/O/C/N), the molecules you assembled, total score, and your leaderboard placement.
- Pause menu's restart wording stays "RESTART STAGE"; difficulty persists across the new flow.

## v0.9.0 — 2026-06-06

### Phase 3 — Nine stages across three sectors

The campaign is now **9 stages** (plus the tutorial), grouped into **3 sectors of 3 stages** each.
A *sector* is the biome/theme; a *stage* is one level within it. `currentStage` (1–9) drives
everything; the sector is derived as `ceil(stage/3)`.

- **Data-driven stages** — all level content (atoms, enemy mix, gaps, width, finale/exit) now lives
  in [src/stages.ts](../src/stages.ts) as `STAGES[9]`, replacing the old `currentStage` branching in
  `GameScene`. Each stage has its own length and a flavor name (e.g. *Inoculation Zone*, *Plasma
  Currents*, *Crystal Violet Throne*).
- **Sector finales** — the 3rd stage of each sector (stages 3/6/9) ends in a boss fight. The other
  six stages clear by reaching an **exit portal** that stays sealed until every germ is defeated,
  then opens and warps you onward.
- **Clear flow** — STAGE CLEAR (1/2 of a sector) · SECTOR CLEAR (boss finales) · EXPERIMENT
  COMPLETE (stage 9). Difficulty persists across all transitions.
- **New enemies** — **amoeba** (slow gelatinous tank), **spore** (fast hovering swarm), and **mite**
  (erratic armored crawler), introduced through Sectors 2 and 3.
- **New bosses** — each sector has its own finale boss with distinct art, stats, and ranged volley:
  **Super Bacterium** (S1), **Amoeba Titan** (S2), and the **Phage Lord** (S3, final boss).
- Stage intro now reads `SECTOR · Stage N of 9` + the stage's flavor name; the in-world banner and
  the pause menu's restart option ("RESTART STAGE") were updated for the multi-stage structure.

## v0.8.0 — 2026-06-05

### Gaps now hurt

- Chasms are a **damage hazard**, not an invisible wall. Step into one on the ground — by walking
  in *or* landing short on a jump — and you take fall damage (`GAP_FALL_DAMAGE = 15`), a thud +
  camera shake fire, and you're hauled back out to the nearer lip. Jumping clear still costs nothing.
- Repeats are throttled by the post-hit invincibility window (new `Player.isInvincible` getter), so
  holding into a gap pulses damage rather than draining you instantly. Replaces the old edge-block
  behavior in `GameScene._updateGaps()`.

### Death screen polish

- The bawling scientist now **buries his face in his hands** — a gloved hand pressed over each eye
  with lab-coat sleeves angling out to the elbows, grouped with the sprite so they rock and heave
  with every sob. (The in-world player draws arms as a separate overlay, so the close-up needed its
  own.) (`GameScene._spawnCryingScientist()`)
- **Smaller goggles** on the scientist sprite for a slightly less bug-eyed look (shared `player_*`
  texture, so it reads everywhere). (`BootScene._makePlayerFrame()`)

## v0.7.0 — 2026-06-04

### Tutorial level with M.E.G., the Main Element Guide

- New **M.E.G. (Main Element Guide)** — a friendly floating atom-bot that narrates a short training
  sector, now the first thing you play on boot (`BootScene → tutorial → DifficultyScene → game`).
- **Story setup:** M.E.G. explains you've been shrunk to the molecular scale by a misfired shrink-ray
  and must gather elements and fight your way out to grow back to normal size.
- **One of each core mechanic**, each with a context tip as you approach it:
  - one **element** atom — M.E.G. explains collecting + arming an attack (then a follow-up "press 1" tip)
  - one **bad guy** (weakened bacterium) — M.E.G. explains attacking
  - one **gap** in the floor — M.E.G. explains jumping / double-jumping; you can't walk across it
- Dialogue system: blocking story lines (advance with Space/Z) + non-blocking proximity tips, with a
  M.E.G. portrait box. **ESC skips** the tutorial. Reaching the end hands off to difficulty select.
- M.E.G. hovers and bobs alongside the player throughout. (`GameScene` tutorial mode; `meg` texture)

### Gaps in every sector

- Each sector now has **two gaps** in the floor you must jump (or double-jump) across — a chasm is
  drawn into the ground and blocks you at its near edge while grounded. Enemies that would have
  spawned on a gap are skipped. Shared `_addGap()` / `_updateGaps()` (also powers the tutorial gap).

### Pause menu

- Added **RESTART GAME** — restarts the whole game from the M.E.G. tutorial.
- Renamed "QUIT TO SECTOR 1" → **DIFFICULTY SELECT**.
- **Fixed:** choosing difficulty select from the pause menu showed nothing — GameScene renders above
  DifficultyScene in the scene list, so it was drawing over the menu. The pause menu now stops
  GameScene before opening difficulty select.

## v0.6.1 — 2026-06-04

### Player death — crying close-up

- The death screen now stars a **close-up of the scientist bawling**: the "YOU DIED" / score / retry
  text shifts to the left, and a big, red-faced, trembling scientist appears on the right, sobbing
  (rock + heave) with blue tears streaming from both eyes. The in-world player sprite just freezes
  (no tantrum in the play area). (`GameScene._spawnCryingScientist()`)

## v0.6.0 — 2026-06-04

### Phase 6 — Molecular Tree & Numpad Arsenal (complete)

System overhaul (design: [PLAN_PHASE6.md](PLAN_PHASE6.md), tasks: [tasks/PHASE6_TASKS.md](tasks/PHASE6_TASKS.md)).

- **Branching atom tree** — every atom pickup is now a 2–3 way choice of base atoms (H/O/C/N).
  Picks accumulate into a multiset instead of collapsing to a single element.
- **Simultaneous arsenal** — owning atoms unlocks base *and* compound attacks at the same time
  (own H+O → Hydrogen, Oxygen, **and** Water are all usable). Up to 10 attacks at once.
- **Numpad controls** — all offense on the numpad: `1–9` = attack slots in priority order,
  `0` = the 10th slot (Carbonic Acid). Slot `1` is your basic Punch until you unlock an attack,
  then becomes your first attack. Each attack has its own cooldown.
- **New HUD** — molecular-tree atom badges (owned H/O/C/N with counts) + a numpad attack bar
  showing each available attack, its key, level pips, and a cooldown wipe.
- New attack registry in `constants.ts` (`ATTACKS`/`ATTACK_ORDER`); `ElementSystem` rewritten to
  derive available attacks from atom counts; `Atom` is now a generic choice node (`atom_node` texture).

### Per-element visual refinement pass

Every special restyled to its atom/compound color with juice, matching Proton Punch / Plasma Arc /
Tidal Force. New reusable color-parameterized effect helpers in `GameScene`: `spawnBurst` (particle
burst), `spawnNova` (expanding ring shockwave), `spawnSlashArc` (crescent melee slash), `spawnCloud`
(drifting gas/acid haze).

- **Oxygen** corrected from green to its proper red-orange — corrosive slash, lingering reactive
  cloud, oxidation nova
- **Hydrogen** Fusion Burst — white-hot core, triple blue shockwave rings, spark burst
- **Carbon** — triple grey claw with blood spray, sparkling diamond shard, graphene shockwave + debris
- **Nitrogen** — frost slash and cryo nova throwing ice crystals; Absolute Zero flash-freezes the screen
- **Water** Lv1–2 — pressurized jet with droplet spray, forward hydro-wave surge
- **Ammonia / CO₂** — caustic & smog clouds (localized + screen-wide hazes)
- **Methane** — flame-trailed gas bolt with a fiery nova + flame burst on detonation
- **Nitric Oxide** — magenta activation flare + nova on the speed buff
- **Carbonic Acid** — acid drops now splash and leave a brief corrosive puddle
- **Controls:** number-row `1–9,0` mirror the numpad slots (laptop fallback)

### Numpad arsenal — number-row mirror

- Number-row digits mirror the numpad attack slots, so the game is fully playable without a numpad.
  Slot `1` punches until you unlock an attack (the dedicated `.` punch key was removed).

### Real stoichiometry

- Compounds now require their **actual atomic recipe**, not just one of each constituent: Water = 2H+1O,
  Ammonia = 1N+3H, CO₂ = 1C+2O, Methane = 1C+4H, NO = 1N+1O, Carbonic Acid = 2H+1C+3O.
- An attack's level is now **how many complete copies of the molecule you can assemble** (capped at 3) —
  `min` over its atoms of `floor(owned / required)`.
- Sectors ramp the atom supply to match: **Sector 1 = 4 atoms** (base attacks / a little Water),
  **Sector 2 = 6** (adds Nitrogen), **Sector 3 = 9** (all four; enough for Methane / Carbonic Acid).

### Choice overlay — tree-growth feedback

- "ADD AN ATOM" cards now preview the exact effect of each pick given your current molecule: every
  attack it would **★ unlock** or **▲ level** is listed, colored by that attack, with its tier name
  (e.g. picking O when you hold H shows "★ NEW H₂O Water Jet"). Powered by pure
  `ElementSystem.levelFor`/`attacksFor` helpers so the preview always matches what you'll get.

## v0.5.0 — 2026-06-03

### Fixes

- **Stuck level after killing the boss offscreen** — screen-wide specials (Absolute Zero, Ammonia/CO₂ Lv3, Acid Rain, etc.) iterate the whole enemy group, so they could damage and kill the Super Bacterium while it was still offscreen and unactivated, leaving the stage in a broken state. Damage is now gated at the source: the boss is immune until it activates (comes on screen), and regular enemies are immune until they've scrolled into the camera view. This covers every attack path (melee, AOE, projectiles, splash, bleed)

### Jump Overhaul & Double Jump

- Jump reworked from a fixed tween to a velocity-based arc (gravity-integrated each frame)
- **Double jump** — press Space again while airborne for a second mid-air leap
- **First jump** plays a dedicated tucked `player_jump` pose with a takeoff stretch and landing squash
- **Second jump** sends the player into a **front roll** — the sprite spins a full rotation in the direction it faces (arms hidden during the spin so they don't detach)
- **Leap over enemies** — a jump that clears an enemy's body (airborne above a clearance height) dodges its contact attack and the boss charge; projectiles and other hits still connect, so it's a timing dodge rather than blanket airborne immunity
- Ground shadow scaling fixed for the taller double-jump apex

### Hydrogen Refinements

- **Proton Punch** (Hydrogen Lv1) reworked to read as a stronger basic punch: reuses the punch animation but with a bigger fist colored hydrogen-blue (`0x3366ee`) with a glow halo and specular, longer reach, harder knockback, a hydrogen-blue impact flash, and the punch SFX (was an orange flash with no fist)
- `_spawnPunchArm()` now takes color/size options so element-charged punches can restyle the fist while sharing the same animation
- **Plasma Arc** (Hydrogen Lv2) rebuilt as a proper energy bolt: a glowing hydrogen-blue core with a white-hot center, randomized crackling electric arcs, and a fading motion trail; faster and harder-hitting (×3 damage, knockback 5) with an impact flash, expanding shock ring, and splash damage to nearby enemies (was a plain orange projectile). New `GameScene.spawnPlasmaBolt()`

### Water Refinements

- **Tidal Force** (Water Lv3) rebuilt as a towering, curling wave instead of a flat translucent rectangle: three parallax depth layers (dark back → bright front), a curling crest with churning foam, spray droplets that arc up and fall under gravity, a bright specular down the front face, a wet floor trail, and a brief blue screen wash + camera shake on cast. Sweeps the full screen width and shoves enemies along with stronger knockback

## v0.4.0 — 2026-05-31

### Phase 5 — Content & QOL (begun)

**Pause Menu**

- Press ESC or Enter during gameplay to pause
- New `PauseScene`: RESUME / RESTART SECTOR / QUIT TO SECTOR 1, clinical monospace styling
- Arrow keys navigate, Z or Enter confirms, ESC resumes
- Quit returns to the difficulty selector

**Difficulty Modes**

- New `DifficultyScene` shown before Stage 1 — EASY / NORMAL / HARD cards with stat breakdowns
- Scales enemy HP, enemy speed, and player invincibility window per difficulty
  - Easy ×0.70 HP / ×0.75 speed / 1.4s i-frames
  - Normal ×1.00 / ×1.00 / 0.8s
  - Hard ×1.40 / ×1.25 / 0.5s
- Choice persists across sectors and retries via the scene registry
- Boot flow now `BootScene → DifficultyScene → GameScene`; completing Sector 3 returns to difficulty select

### Enemy Animation

- Bacterium: cytoplasm pulse (vertical scale, per-instance phase offset)
- Virus: continuous spin
- Pollen: slow tumble
- Dust bunny: squash/stretch breathing while resting between hops
- Boss: slow inhale/exhale breathing pulse
- Virus & pollen shadows removed from textures (were rotating with the sprite)

### UI Readability

- Bumped font sizes across every scene (HUD, pause, difficulty, element choice, intro, death/clear screens, boss label)
- Brightened hard-to-read text colors throughout
- Controls hint given a black stroke so it reads over the game world
- Element panel enlarged to fit larger labels

### Combat Feel

- Hit feedback changed from a full-screen red flash to a brief red tint on the player sprite

## v0.3.0 — 2026-05-31

### Art Direction — Clinical/Microscope Overhaul

**Enemies**

- Bacterium redrawn as Gram-stain positive: deep violet body (`0x5533aa`), translucent capsule halo, dark nucleoid oval, ribosome granules, two wispy flagella, wet-glass specular
- Virus redrawn as fluorescent antibody stain: teal-cyan (`0x00ccbb`), 12 thin sharp spikes (was 8 fat), no cartoon eyes, protein coat dots between spikes, dark inner core
- Dust bunny redrawn as unstained cellular debris: blue-gray aggregate (`0x8899a8`), semi-transparent blobs, trapped organelle blobs replacing cute eyes, faint membrane boundary
- Pollen redrawn with autofluorescence amber: 6 surface aperture pits instead of outer bumps, exine radial lines, bright inner glow
- Boss redrawn as pathogenic strain: dark purple (`0x3a2266`), three distinct nucleoid ovals, double membrane/capsule ring, five flagella of varying weight

**Player**

- White lab coat replacing navy uniform, with lapel folds and collar V
- Wide clinical goggles covering the eye area — pale teal lenses neutral for element tinting
- Dark clinical trousers and white lab shoes
- Pen clipped to breast pocket
- Arms are now live graphics objects (not baked into texture) — correct position tracked via `postupdate` event
- Melee punch spawns an extending sleeve+gloved fist graphic; the punching arm disappears during the animation; no hit flash on melee

**HUD**

- HP bar redesigned as graduated pipette: dark track with tick marks at 25/50/75%, fill shifts green → yellow → red, label centered inside bar
- All text in monospace — lab readout aesthetic
- Element panel: `ELEMENT  {name}` / `SPECIAL  {name}` format, thin clinical-green border
- Score: `SCORE` label above monospace digits in clinical green
- Combo display: muted green monospace, less saturated
- Boss warning: `! PATHOGEN DETECTED !` fades out after 2s instead of persisting

**Background & Environment**

- Ground tiles darkened and desaturated across all sectors; wet-glass sheen (two-layer lighter band at top edge)
- Background tiles near-black with faint `strokeCircle` cell membrane debris rings replacing block texture
- World background particles: 1 in 3 are now hollow cell-debris rings, rest are smaller granules

---

## v0.2.1 — 2026-05-30

### Stages

- Added **Sector 2** (blood agar — red/pink) and **Sector 3** (MacConkey agar — blue/purple)
- Stage progression: defeating the boss advances to the next sector; Sector 3 ends with "Experiment Complete" and loops back to Sector 1
- Dying retries the current sector (no longer resets to Sector 1)
- Boss scales per sector — S2: 750 HP / speed 160; S3: 1100 HP / speed 180 / damage 30
- Atom counts reduced (7 → 4 per sector); S3 atoms are all mystery boxes
- Enemy Y positions are now randomized within the walkable band each run

### Enemies

- **Viruses** now hover up and down continuously (sine-wave Y movement, random start phase)
- **Dust bunnies** now hop — takeoff squish, airborne arc, landing squish, random pause between hops
- Enemies no longer drop atoms on death

### Visuals

- Each sector has unique tile textures: nutrient agar (S1), blood agar (S2), MacConkey agar (S3)
- Background tiles include faint petri dish grid lines
- Sector-themed floor line, shadow band, and floating particle colors
- Measurement tick marks along the agar surface boundary

### Fixed

- HP fractional values — `Math.round()` applied at every damage site across `Enemy`, `Boss`, and `Player`

---

## v0.2.0 — Phase 2 Complete

### New Elements

- **Carbon (C)** — Carbon Claw (bleed DOT), Diamond Shard (piercing bolt), Graphene Shockwave (AOE ground crack)
- **Nitrogen (N)** — Nitrogen Frost (freeze melee), Cryo Burst (freeze AOE), Absolute Zero (freeze all on screen)

### New Combos

- **Ammonia (NH₃)** — Caustic Spray / Acid Cloud / Toxic Deluge (DOT + slow)
- **Carbon Dioxide (CO₂)** — Smog Pulse / Suffocation Field / Blackout (camera fog + AOE)
- **Methane (CH₄)** — Gas Ignite / Chain Blast / Fireball (detonating projectile with chain explosions at lv2)
- **Nitric Oxide (NO)** — Radical Rush / Reactive Aura / Overclock (speed boost ×1.5–2.0 with pulsing aura damage)
- **Carbonic Acid (H₂CO₃)** — Acid Drop / Corrosive Spray / Acid Rain (targeted falling drops + bleed)

### Systems

- Bleed DOT system on `Enemy` — ticks every 400 ms, red flash, extends duration on reapply
- Piercing projectile support — `piercing` flag on `ProjectileSprite`, passes through all enemies
- `ElementChoiceScene` updated with descriptions and symbol lookup for all 10 elements
- Carbon and Nitrogen atom textures (procedural)

---

## v0.1.0 — Phase 1 Complete

### Core Game

- Stage 1: Petri Dish Sector — bacterium, virus, dustbunny, pollen enemies
- Boss: Super Bacterium (3-phase, flagella projectiles)
- 5 base elements: H, O, Water, C, N — 5 initial combos

### Features Added

- Procedural sound effects (Web Audio API) — punch, atom collect, element upgrade fanfare, boss roar, player death
- Particle bursts on atom collection (element-colored, 22 particles)
- Player walk animation (3-frame procedural cycle, idle/walk states)
- Enemy hit stagger — scale squish tween + velocity freeze + delayed knockback
- Boss hit stagger — proportional squish targets for larger sprite
- Combo counter with damage multiplier — every 5 hits adds ×0.5; shown in HUD
- Stage intro letterbox sequence (bars + title card, 2-second hold)
- Death screen — "YOU DIED" overlay with final score and retry prompt
- Score tracker — per-enemy kill values (bacterium 100, virus 80, dustbunny 150, pollen 60, boss 1000)
- Player jumping — Space key, arc physics with ground shadow, invulnerable while airborne
