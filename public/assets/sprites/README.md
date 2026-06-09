# Hand-drawn sprite assets

These PNGs are the game's sprite art. `BootScene.preload()` loads every one by key from the
`ASSET_SPECS` manifest in [`src/scenes/BootScene.ts`](../../../src/scenes/BootScene.ts); game code
references textures only by key, so the art lives entirely here. See
[`docs/GRAPHIC_MIGRATION_PLAN.md`](../../../docs/GRAPHIC_MIGRATION_PLAN.md) for the history.

## Folder → key map

| Folder | Keys | Canonical size |
|--------|------|----------------|
| `player/`  | `player_0` `player_1` `player_2` `player_jump` | 40×74 |
| `npc/`     | `meg` | 50×54 |
| `enemies/` | `bacterium` (40×82) `virus` (44×54) `dustbunny` (48×62) `pollen` (44×58) `amoeba` (56×64) `spore` (36×36) `mite` (48×46) | per-key |
| `bosses/`  | `boss_bacterium` `boss_amoeba` `boss_phage` | 96×160 |
| `atoms/`   | `atom_hydrogen` `atom_oxygen` `atom_carbon` `atom_nitrogen` `atom_mystery` `atom_node` `atom_gold` | 40×40 |
| `fx/`      | `fx_hit` (40×40) `projectile` (16×16) `particle` (6×6) | per-key |

## Replacing a sprite

Export a new PNG at the key's **canonical size** above and overwrite the file in the matching folder.
Phaser sizes arcade bodies from texture dimensions, so keeping the same size is a pure drop-in — no
code changes. `projectile` and `particle` are tinted at runtime, so keep their art near-neutral.

> Not loaded here (procedural by design): stage maps (`bg_tile_1..3` / `ground_tile_1..3`), the
> `vignette` screen effect, and the live vector FX in `Player.ts` / `GameScene.ts`.
