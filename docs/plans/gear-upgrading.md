# Plan: gear upgrading

Implementation plan for `docs/ideas/gear-upgrading.md` (rules and owner decisions) and `docs/ideas/gear-upgrading-cold-forge.md` (Toric, *The Cold Forge*, dialogue scripts, Pathfinder's Seal). One PR into `staging` per step, each from its own worktree off `origin/staging`. Code references are from `staging` at `d90cb45` (2026-11-01); re-check line numbers when a step starts.

## Order

Step 1 doesn't depend on any other step. Step 2 opens the chain: 2 → 3 → 4 → 5. Step 6 needs 2 and can run beside 3–5. Step 7 comes last.

### 1. Quest-only drops stop at the needed amount (S, Sonnet)
Owner rule for every quest-only drop, so it ships on its own and fixes existing quests too (Signs of Rot, The Blighted Heart, …).
- `rollDropList` (`store/player/kill-rewards.ts:14`) skips a `requiredActiveQuestId` drop unless the quest's current step asks for that item and the player holds less than it needs, and caps the amount at the missing count (held plus already rolled in `accumulator`). The function needs the active quests' current-step needs and the held counts, not only `activeQuestIds`; build them once per kill and per offline claim (`battle-manager.service.ts`, `offline-progress.service.ts`).
- Specs: no drop before the step, none after the step is met, a multi-roll kill never overshoots.
- Docs: `docs/systems/quests.md`, `player-stats-inventory-equipment.md`. Changelog: `[bug] Quest items no longer drop once you have enough.`

### 2. Upgrade level in the item model (M-L, Opus, plan mode)
No way to upgrade yet; a dev cheat makes upgraded items for testing.
- `upgradeLevel` (optional, missing = 0) on `InventoryItem`, the add/remove item input (`inventory.ts:26`) and `EquipmentItem` (`interfaces/player/equipment.type.ts:7`). The stack key becomes `id + tier + upgradeLevel`: `findStackIndex` (`inventory.ts:131`), `stackAmount` (`player.store.ts:221`), the drop accumulator key (`kill-rewards.ts:30`), destroy (`:410`), sell (`:650`), equip/unequip and slot-change checks (`:528-732`), chest receipt (`:590`).
- Stats: `equipmentModifiers` (`stats.ts:78`) scales each stat by `1 + 0.1 × level`, plus 0.25 at +5. Constants in a new `src/data/upgrade-data.ts` (cap 5, per-level bonus, milestone bonus, later chances, cost factor `k`).
- Sell price × `2^upgradeLevel`.
- UI: `+N` on the inventory and equipment slot, item name and stats in the tooltip, a mark on the frame at +5.
- Save: no data rewrite is needed (missing = 0); bump the version only if the save check requires it (see `persistence.md` and the migration table at `player.store.ts:192`).
- Cheat: `dev.addItem` takes an upgrade level.
- Docs: `player-stats-inventory-equipment.md`; `GLOSSARY.md` *Upgrade level* (_Avoid_: tier, rank).

### 3. Merge logic and unique gear (M, Opus)
- `unique?: true` on equipment data: quest rewards, non-refreshable one-in-stock shop items (`shops-data.ts`, for example Magic Staff and Mystic Hood), chest-only gear (Patron's Gloves). `validate` warns about equipment that is a quest reward or chest-only and lacks the flag.
- `PlayerStore.mergeItem(base, sacrifice)`: same `id + tier + upgradeLevel`, not unique and not a pet, level below the cap, enough gold. The cost is `value × 2^N × k`. Base and sacrifice may each be in the inventory or equipped. When the base is equipped, the merged copy goes into its slot; when the sacrifice is equipped, its slot empties. The chance roll stays in code for later levels, but at a cap of 5 it is always 100%.
- Specs for every combination: two from one stack, stack + equipped, equipped as the sacrifice, not enough gold, unique, at the cap.
- `npm run sim`: print the gold cost to +5 per gear item, to tune `k`.
- Docs: `player-stats-inventory-equipment.md`.

### 4. Forge panel (M, Sonnet)
- New dialogue effect `forge` (`/add-dialogue-effect`) that opens the Forge panel in the town view, the same way `shop` opens `ShopComponent` (`towns-shops-guild.md` → Shops).
- Panel: upgradable stacks and equipped items grouped by `id + tier + level`; pick a pair, see the gold cost, the chance and stats before and after, then Merge. Disabled reasons on the button: gold, unique, cap, no second copy.
- i18n, keyboard access. Run `verify-yari`.
- Docs: `towns-shops-guild.md`.

### 5. Toric, the Forge and The Cold Forge (M, Sonnet; skills `/add-town-building`, `/add-npc-dialogue`, `/add-quest`)
- Forge Building in Lirold (`towns-data.ts:108`), NPC `liroldToric`, background and avatar (asset-generator agent).
- Toric's dialogue tree from the companion doc's scripts, with the **Upgrade gear** option (the `forge` effect) gated on `theColdForge` completed. Add the Ludo lines (`liroldArenaMaster`) and the Marvin lines.
- Quest `theColdForge`: 5 steps; rewards 2000 XP and 400 gold unless the owner changes them.
- Item `toricsForgeTongs` (`ItemType.quest`); Goblin Scavenger drop `{ chance: 50, requiredActiveQuestId: theColdForge }` (`enemies-data.ts:263`). Step 1's cap makes only one ever drop.
- Step 4 consumes 1 `fishApplePie`; no new content for the pie.
- Docs: `quests.md`, `towns-shops-guild.md`, `dialogue.md` if the effect list changes. Changelog: `[feature] Toric's Forge in Lirold: upgrade gear up to +5.`

### 6. Pathfinder's Seal (M, Sonnet)
- Item `pathfindersSeal` (`ItemType.quest`).
- Arena Chest: a separate 1-in-10 roll per chest, outside the 4 weighted picks (`rewards-items.data.ts:64`), only while the player neither holds a Seal nor has registered one. The chest shape (`rollChest`, `store/player/chest.ts`) needs an optional guarded bonus roll.
- Registration: Marvin's option and a one-time effect that takes the Seal and sets a saved flag (or a permanent stat `upgradedDropChance` 10). The kill drop path (step 1's `rollDropList`, online and offline) gives each gear drop a 10% chance to arrive at +1; never for unique items or pets.
- Specs: no Seal after registration, no second Seal while one is held, +1 drops online and offline.
- Docs: `arena.md`, `towns-shops-guild.md`, `player-stats-inventory-equipment.md`. Changelog: `[feature] Pathfinder's Seal from the Arena Chest: register it with Marvin for upgraded gear drops.`

### 7. Wrap-up (S)
- Set `docs/ideas/gear-upgrading.md` to Shipped, move what is now true into the system docs, and leave only the "Later" list in the idea doc.
- Lore bible: move the facts that shipped from (proposed) to shipped canon (`docs/lore/`, `docs/character/lirold/toric.md`).
