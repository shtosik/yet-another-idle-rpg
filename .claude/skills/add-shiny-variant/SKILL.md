---
name: add-shiny-variant
description: Use when giving an enemy its pet and shiny variant — the normal and shiny pet items, the enemy's pet drop and shinyDrops, and the -shiny sprite. Triggers on "add a shiny variant for X", "give this enemy a pet", "make the wolf droppable as a shiny", "wire shiny drops for the troll", "add a new shiny pet".
---

# Add a pet and shiny variant

Background: `docs/systems/enemies-shiny-pets-bestiary.md`. The shiny mechanic itself (spawn roll, sprite swap, ×5 XP, ×10 gold, 10 drop rolls) needs no change; this skill adds one enemy's pets and shiny sprite.

## Steps

1. **ItemIDs** — append two values to `src/enums/ids/item-id.enum.ts:ItemID`: `pet<Enemy>` and `shinyPet<Enemy>`.

2. **PETS entry** — add to the `PETS` table in `src/data/items/pet-items.data.ts`:
   ```ts
   {
     enemyId: EnemyID.boar,
     petId: ItemID.petBoar,
     shinyId: ItemID.shinyPetBoar,
     asset: 'boar',                                     // sprite stem under assets/img/enemies/
     stats: [{ id: 'damageVsMammal', amount: 0.2 }],
     shinyStats: [{ id: 'damageVsMammal', amount: 0.4 }],
   },
   ```
   Use a `damageVs<Type>` matching one of the enemy's `enemyTypes`. The table builds both pet items (rare and legendary, unsellable, `EquipmentSlot.pet`, icon = the enemy sprite).

3. **Drops** — on the enemy in `src/data/enemies-data.ts`: add `petDrop(EnemyID.boar)` to `drops` and set `shinyDrops: shinyPetDrops(EnemyID.boar)`. Both roll at `PET_DROP_CHANCE` (1 in 2000).

4. **i18n** — `items:names.petBoar` ("Pet Boar") and `items:names.shinyPetBoar` ("Shiny Pet Boar") in `src/assets/locales/en/items.json`.

5. **Shiny sprite** — `src/assets/img/enemies/<asset>-shiny.png` beside the normal sprite. Generate it with `/generate-2d-asset` (the pipeline's `--shiny-of` hue-shifts the base sprite; see `docs/systems/asset-pipeline.md`).

Done when `npm run validate` and `npx ng build` pass (validate checks the `-shiny.png` exists and both names are translated).
