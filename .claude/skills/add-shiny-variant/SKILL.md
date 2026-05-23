---
name: add-shiny-variant
description: Use when giving an existing monster a shiny variant — registering a shiny pet drop, wiring the enemy's `shinyDrops` table, and naming the sprite/icon assets. Triggers on phrases like "add a shiny variant for X", "make the wolf droppable as a shiny", "give this enemy a shiny pet drop", "wire shiny drops for the troll", "add a new shiny pet".
---

# Add a Shiny Variant for a Monster

The shiny mechanic is already wired end-to-end (roll on spawn, sprite swap, 10× drops / 5× XP / 10× gold). What you usually need to add per monster is the **shiny-only drop**: a legendary pet that only appears when a shiny rolls. This skill walks the four touch-points that wiring takes.

## Prerequisites — read first

- `src/data/enemies-data.ts` — every entry takes optional `shinyDrops: EnemyDrop[]`. See the slimes for canonical examples.
- `src/data/items-data.ts` — block of `[ItemID.shinyPetX]` entries near line 493 (`// shiny pets…` comment).
- `src/enums/ids/item-id.enum.ts` — the `shinyPet…` block. **Append new IDs; never renumber.**
- `src/assets/locales/en/items.json` — `names.shinyPet…` entries.
- `docs/analysis/shiny-monster-feature-plan.md` — full design context if you need it.

Related skills:
- `update-shiny-enemy-visuals` — covers the battle-window sprite class and `onerror` fallback. Already applied; leave alone unless changing the visual style.

## How a shiny kill loots

`PlayerStore.processBattleEnd` calls `calculateEnemyDrops(enemy, rolls, isShiny)`:
- Regular drops are rolled **10 times** and accumulated by `(id, tier)`.
- If `isShiny && enemy.shinyDrops?.length`, the **`shinyDrops` list is rolled exactly once** on top.

So a shiny pet with `chance: 10` means **10% chance per shiny kill** — not per regular kill. Tune `chance` against that.

## Step 1 — Register the shiny pet ItemID

`src/enums/ids/item-id.enum.ts` — append to the `shinyPet…` block, using the next free number:

```ts
shinyPetWolf = 53,
shinyPetDeer = 54,
shinyPetBandit = 55,
shinyPetGoblinScout = 56,
shinyPetTroll = 57,
shinyPetBoar = 58,   // ← new
```

**Never renumber** existing values — saved inventories store these as numbers.

## Step 2 — Define the pet item

`src/data/items-data.ts` — add to the shiny-pets block. Mirror the existing entries:

```ts
[ItemID.shinyPetBoar]: {
  id: ItemID.shinyPetBoar,
  tier: ItemTier.legendary,
  url: './assets/img/items/pets/shinyPetBoar.png',
  value: -1,                     // unsellable
  type: ItemType.equipment,
  slot: EquipmentSlot.pet,
  stats: [{ id: 'damageVsMammal', amount: 0.4 }],
},
```

Authoring rules:
- **Tier:** `legendary` — shiny pets are uniformly legendary; do not deviate without reason.
- **`value: -1`** — shop/seller code treats `-1` as "cannot be sold". Required.
- **`slot: EquipmentSlot.pet`** — the pet-only slot. Non-negotiable.
- **`stats`:** one `damageVs<EnemyType>` entry, `amount: 0.4`. Pick the entry from `PlayerStat` (`damageVsSlime`, `damageVsCrab`, `damageVsBird`, `damageVsReptile`, `damageVsCrustacean`, `damageVsGoblin`, `damageVsHumanoid`, `damageVsTroll`, `damageVsRodent`, `damageVsRat`, `damageVsBandit`, `damageVsMammal`, `damageVsDog`, `damageVsHuman`) that matches one of the parent enemy's `enemyTypes`. If no matching `damageVs…` exists yet, add it via the rules in `src/types/player/player-stat.type.ts` first (extend the union *and* `multiplierStats`, then add `0` to `statsInitialState`).

## Step 3 — Wire `shinyDrops` on the enemy

`src/data/enemies-data.ts`:

```ts
[EnemyID.boar]: {
  id: EnemyID.boar,
  maxHp: 14,
  experience: 12,
  drops: [
    generateItem(ItemID.boarTusk, 1, 1, 3),
    generateItem(ItemID.petBoar, 1, 1, 2000),
  ],
  shinyDrops: [generateItem(ItemID.shinyPetBoar, 1, 1, 10)],   // ← new
  url: './assets/img/enemies/boar.png',
  zones: [ZoneID.deepForest],
  enemyTypes: [EnemyType.mammal],
},
```

`chance: 10` = 1-in-10 roll **on a shiny kill** = effectively ~0.1% of all kills at the default `shinyChance` of 1%. That's the established cadence — keep it unless tuning a specific encounter.

The `shinyDrops` list is just `EnemyDrop[]`; you can put multiple entries in it (e.g. a guaranteed token + a rare pet). Each entry rolls independently.

## Step 4 — i18n for the pet name

`src/assets/locales/en/items.json` under `names`:

```json
"shinyPetBoar": "Shiny Pet Boar",
```

Convention: `Shiny Pet <Capitalized Animal>`. No tooltip key needed — pets read their tooltip from `stats[].id`.

## Step 5 — Drop the assets

Two PNGs to ship alongside the data:

| Path | Used by |
|---|---|
| `src/assets/img/enemies/<enemyName>-shiny.png` | Battle sprite + bestiary toggle |
| `src/assets/img/items/pets/shinyPet<Name>.png` | Inventory / equipment slot |

The battle sprite filename is derived at runtime: `BattleStore.startBattle` does `url.replace(/\.png$/i, '-shiny.png')`. So the file **must** sit next to the regular sprite with that exact suffix. If the asset is missing, the battle component's `onImgError` falls back to the regular sprite — gameplay still works, but you'll see a flash of broken image first. **Ship both PNGs in the same commit as the data wiring.**

## Step 6 — Smoke test

1. `npx tsc --noEmit` passes (catches missing `ItemID` / `EnemyType` typos).
2. In devtools, force `playerStore.stats().shinyChance = 100` and fight the target enemy.
3. Confirm the shiny sprite renders in the battle window with the gold drop-shadow (set on `.enemy__sprite--shiny`).
4. Kill it — inventory should receive 10× the regular drops and (with luck) the shiny pet.
5. Equip the shiny pet — `damageVs<Type>` stat increases by `0.4`.
6. Open the bestiary, select the monster, click **Show Shiny**:
   - Sprite swaps to `-shiny.png` with the gold glow.
   - A second "Shiny Drop Table" appears below the regular drops, listing the new pet at `(100 / chance)%`.
7. Reset `shinyChance` to the player's actual stat.

## Common mistakes

- **Forgetting the asset** — TypeScript can't catch this; the player sees a broken image. Always commit `-shiny.png` + `shinyPet<Name>.png` next to the data.
- **Renumbering `ItemID`** — corrupts every save file. Always append.
- **Picking `damageVs…` that doesn't match the enemy's `enemyTypes`** — the pet works but feels random. Cross-check `enemyTypes` on the parent enemy.
- **Setting `value` to a positive number** — players can sell the legendary pet for gold. Always `-1`.
- **Putting `chance: 1` (= 100%) on the shiny pet** — a guaranteed legendary on every shiny kill trivialises the gear chase. Established value is `chance: 10`.
- **Adding `shinyDrops` on an enemy without a `-shiny.png` asset** — see first bullet. The `onError` handler hides it, but it's a code smell.

## When you DON'T need this skill

- Changing the **visual** of the shiny glow → edit `.enemy__sprite--shiny` in `src/app/components/game/battle/enemy/enemy.component.sass` and `.bestiary__detail-sprite--shiny` in the bestiary SASS.
- Changing **drop / XP / gold multipliers** → those live in `PlayerStore.processBattleEnd`. The 10×/5×/10× constants are intentional — don't move them per-enemy.
- Adding a **new `damageVs<EnemyType>` stat** → that's a player-stat change (`src/types/player/player-stat.type.ts` + `statsInitialState`), independent of this skill.
- Adding a **non-pet shiny-only drop** (e.g. a unique cosmetic) → the data shape (`EnemyDrop`) already supports any `ItemID`. Skip Step 2's "pet" convention and define the item however the design calls for.
