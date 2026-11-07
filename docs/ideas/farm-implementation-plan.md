# Farm implementation plan

**Scope:** L · **Status:** In progress (branch `feat/farm`, one PR into `staging`; C1 to C11 committed bar the final `verify-yari` run and its evidence path in the PR body)

Plan for building [the Farm & Farming Guild](farm-and-husbandry.md) (owns player behaviour; no open owner calls) with [seed storage](seed-storage.md) (owns the implementation of the seed store). Steps are commits on one branch. The feature stays unreachable until C10, because only the `seedsFromTheTerrace` quest start unlocks the Site. Seeds count silently from C5 on.

The touch-points below come from the design docs, not from a code read: grep each one when its commit starts. Every commit passes `npm run check` and updates the matching `docs/systems` doc.

## Commits

**C1. Rename town reputation keys to `ReputationID` (no behaviour change).** Farm doc §9.
- New `src/enums/reputation-id.enum.ts` (laHarpar 1, lirold 2, mawood 3, farmingGuild 4: the existing numeric values). Update `store/player/reputation.ts`, `reputation.service.ts`, `data/reputation-turn-ins.ts`, `data/shops-data.ts`, `shop.type.ts`, `titles-data.ts`, `quests-data.ts` (about 20 rewards), `quest-list`, `quest-completed`, `reputation.component.*`, `towns.component`, dialogue condition and effect types, `scripts/validate-data.mjs`, `scripts/sim-economy.mjs`, specs, and the `map.json` label `towns.X` → `reputations.X`.
- Tests: existing specs adjusted; a spec that an old save's `reputation` keys load unchanged.
- Docs: `town-reputation.md`, `towns-shops-guild.md`, `quests.md`, `dialogue.md`, `GLOSSARY.md` (Reputation).
- Done when: numeric values and the save key are unchanged, and the data diff shows renames only.

**C2. Profession core and expertise stats.**
- `ProfessionID.farming = 4`; `data/professions-data.ts`; new `store/player/professions.ts` (`levelFromXp`, `xpForLevel`, `20×L²`, cap 30); `player.store.ts` (`professions` state, `applyProfessionXp`, load reconcile, `pointsPaidLevel`); `types/player/player-stat.type.ts`, `store/player/player.ts`, `stats.ts` (seven new stats, `'expertise'` source, `expertiseModifiers`); stats panel and label keys; `quest-completed` and `toast` level-up line; `dev-cheats` (`dev.setExpertise`). Quest reward `professionXp` and requirement `professionLevel`.
- Skill: `/add-dialogue-effect` for `unlockProfession` and the `professionLevel` condition (C10 needs both).
- Tests: `professions.spec.ts` (curve, milestones, the 50% growth cap); skill-point-paid-once spec for reload and a raised cap; a `stats.spec` addition.
- Docs: `player-stats-inventory-equipment.md`, `skill-tree.md`, `quests.md`; `GLOSSARY.md` (Expertise, Profession).
- Done when: `dev.setExpertise` pays skill points exactly once across reloads.

**C3. Turn-in cooldown and the one-bundle rule (shipped nerf).**
- `TurnInKey`, `TURN_IN_COOLDOWN_MS`, `lastTurnInAt`, the `turnInCooldownReduction` use, the `turnInCooldown` dialogue condition, and the four bundle trees (Bartender, Josh, Sylvie, Brenna) losing "all". Files: `quests.store.ts`, `reputation-turn-ins.ts`, `dialogue-effect.type.ts` (`reputationTurnIn` without `bundles`), `dialogue-condition.type.ts`, `dialogue-manager.service.ts`, the four NPC trees and locales, `dialogue.component` cooling tag, `npc-frame` badge with one shared 1 s signal, `reputation-turn-in.spec.ts`, `sim-economy.mjs` `repPerHour`.
- Skill: `/add-dialogue-effect` for the condition.
- Tests: ready-time maths (negative elapsed time, stat shortens a running cooldown, 75% cap); the bundle spec.
- Docs: `dialogue.md`, `quests.md`, `town-reputation.md` (pacing note). Changelog: `[nerf] Reputation turn-ins hand over one bundle per 2 hours.`
- Done when: the 4 NPCs hand over one bundle and then show "Ready in …".

**C4. Repeatable orders in the quest system.**
- Quest `repeat` field, `pickedItems` requirement, `orders`, `questCompletions`, and `QuestsStore.completeOrder` as the single completion path. Files: `quests-data.ts` types, `quests.store.ts`, `quest-status.ts`, `quest-list.component.ts`, `quest-completed`, `dialogue-manager.service.ts` (`advanceQuest` and `endQuest` both call `completeOrder`; turn-in reservations include `orders[..].requirements`). Start rolls and saves with `saveGameStateNow`.
- Tests: `orders.spec.ts`: a rejected completion changes nothing, reload does not re-roll, atomic completion, a bundle does not eat a reserved item, both routes behave the same.
- Docs: `quests.md`.
- Done when: a test-only fixture order runs start, turn-in, cooldown, restart (the fixture is not shipped data).

**C5. Seed storage and `farm.ts` rules.**
- `ItemType.seed`, `SeedItem`, `FarmState` (`plots` of length 9 with null, `seeds`), `takeSeeds`, and the pure rules `plotCount`, `syncPlots`, `isReady`, `plant`, `harvest` (with `rolledYield`), `plantAll`, `harvestAll`.
- Wiring: `tabOf` and `missingSlotsByTab` skip seeds; `addItems`, `processBattleEnd` and `applyKillBatch` split seeds out, reporting gated on `unlockedContent.sites`; shop, quest and chest fit checks ignore seeds. Data: `data/farming-data.ts` (`FARM_SEEDS`); `scripts/validate-data.mjs` checks (seed maps to a crop, no seed in an `item` step or recipe, plot count at most the array length).
- Tests: `farm.spec.ts` (growth at a changing rate, offline, a clock set backwards, a blocked harvest keeping its roll); `seed-routing.spec.ts` (never in the inventory, never in `lostDrops`, silent before the unlock).
- Docs: `seed-storage.md` (status), `persistence.md`, `player-stats-inventory-equipment.md`; `GLOSSARY.md` (Seed, Plot); new `docs/systems/farming.md` skeleton.
- Done when: no data uses seeds yet, but the specs prove the routing.

**C6. Site, map marker and Sites list.**
- `SiteID`, `sites-data.ts`, `unlockedContent.sites` with `applyUnlockTarget` and `isSiteUnlocked`, the `unlockSite` effect, a `site` marker kind at (1400, 400) and `sites__list` in `world-map.component.*`, and `dev.unlockSite`.
- Skill: `/add-dialogue-effect` for `unlockSite`. The `unlocks.json` `sites.farm` popup text goes here.
- Docs: `world-map.md`, `zones-waves-unlocks.md`, `towns-shops-guild.md`.
- Done when: a cheat unlock shows the marker and the list entry.

**C7. NPC places and the farm home screen.**
- `NpcPlace` union and `talkTo(place)` in `data/helpers/npc-places.ts` and `game-navigation.service.ts`; the quest-list reachability fix; `GameTab.farm`; a `SiteComponent` (or `selectedSiteId` in `towns.store.ts`); the `town-building` input loosened; the Gate button; `.farm-home` in `game.component.sass`.
- First check (farm doc §16 check 1): an NPC frame works with no selected Town. The result decides `selectedSiteId` versus a `SiteComponent` host.
- Tests: `npc-places.spec` for both kinds; a quest-list reachability spec. Placeholder plain-colour background until art lands.
- Done when: a cheat-unlocked farm opens with temporary test NPCs (not shipped).

**C8. Plots panel.**
- `farm-plots` component on the map footprint (`.farm` joins `.map`): header with Guild reputation bar and expertise bar, seed list (click to activate), 3×3 grid with a 1 s display tick, Plant all (Honored) and Harvest all (Friendly) with `reputationLockText`. Also the level-up toast, the found-seed toast in `BattleManagerService`, a welcome-back seed list once unlocked, `dev.plantAll` and `dev.growAll`.
- Tests: component spec for the lock text and the missing-slot tag.
- Docs: `farming.md`, `offline-progress.md`.
- Done when: plant, wait, harvest works under the cheat.

**C9. Content data.**
- `/add-recipe-or-consumable`: six recipes (Turnip Stew, Farmer's Bread, Harvest Pie, Mushroom Stew, Silverleaf Tonic, Glowcap Elixir) and scrolls. `/add-shop`: Marta's shop (Turnip always, Wheat from Friendly, Harvest Pie and Mushroom Stew recipes at Honored and Revered) and Sylvie's Glowcap Elixir. Also 7 seed items, 6 crops, the Guild Letter; seed drops in `enemies-data.ts`; Arena Chest seeds plus gold 8,000-14,000; the title `farmingGuildExalted`; the Terrace Hare pet (`/add-equipment-item`).
- Docs: `arena.md`, `combat-arena.md`, `enemies-shiny-pets-bestiary.md`, `consumables-camp-crafting.md`, `town-reputation-tier-rewards.md`.
- Done when: `validate` passes and seed drops count silently.

**C10. NPCs, dialogue and the quest chain.**
- `/add-npc-dialogue` for `farmWarden` (with the farm doc §6a intro nodes `introSeeds` and `introNoSeeds`, the `farmSeeds` condition, the pet and the order hub), `farmDrover`, and Sylvie's letter node. `/add-quest` for the six chain quests plus `marthasOrder` and `wicksOrder`. `/add-dialogue-effect` for the `farmSeeds` condition. The start result of `seedsFromTheTerrace` unlocks the Site and the profession: the first reachable path.
- Docs: `quests.md`, `dialogue.md`, `towns-shops-guild.md`, `docs/lore/`.
- Done when: playing from `silkAndWater` reaches the farm.

**C11. Art, finish, verify.**
- `/generate-2d-asset`: home background, plots panel, Gate button, 2 portraits, 7 seed icons, 6 crop icons (files can land earlier; this commit wires them in). `CHANGELOG.md` `[Unreleased]` feature note; idea docs' `**Status:**` and `docs/ideas/README.md` row; `GLOSSARY.md` (Site, Farming Guild, Order); `gathering-skills.md` edits; `sim-economy.mjs` farm model versus the farm doc §7a pacing table.
- Then run `.claude/skills/verify-yari` once for the farm files (subagent on a cheaper model) and put the evidence path in the PR body.
- Done when: `npm run check` passes and the evidence path is recorded.

## Order and parallel work

C1, C2, C3, C4 run in order (shared `player.store.ts`, `quests.store.ts`, `dialogue-manager.service.ts`). C5 needs C2 and C4. C6, C7, C8 follow C5; C6 and C8 touch different components and can overlap once C7's `GameTab` addition lands. C9 and C10 need C3 to C8. Art starts any time, writing only to `src/assets/` and `docs/character/farm/`. Conflict hotspots: `player.store.ts`, `quests.store.ts`, `dialogue-manager.service.ts`, `validate-data.mjs`, `game.component.*`, the locales.

## Risks

- A bad `ReputationID` rename is a silent save break; the C1 spec guards it.
- The completion contract has many routes (`advanceQuest`, `endQuest`, cheats): every caller must go through `completeOrder`.
- Seed routing in `takeSeeds` must cover the three item-add paths exactly and keep seeds out of `lostDrops`.
- The Arena Chest dilution (-12.9% on every other entry) needs a doc and sim check.
- Cheats must keep `window.dev` working (`dev.unlockSite`, `dev.growAll`) so `verify-yari` can drive the feature.
- C2, C3, C4 and C10 are heavy and may need splitting.

## Out of v1

Husbandry and animals (farm doc §11), pens; the deferred recipes (Feast of the Wood, Heartroot Elixir, Blossom Draught) and any station upgrades; any profession other than Farming and the gathering spots, tools and offline claims; saving the active tab or farm stage across reloads; pests and weeds; the Sites list for anything but the farm; a sale price for seeds and any seed destroy UI; prestige hooks and a Lirold reputation.
