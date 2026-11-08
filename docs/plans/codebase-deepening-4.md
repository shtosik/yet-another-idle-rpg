# Plan: codebase deepening 4

Refactors from the fourth 2026-11-08 architecture review, after `codebase-deepening-3` (PR #128). Each step gathers rules spread over several places into one module with a small interface, tested through that interface. One branch, `refactor/codebase-deepening-4`, one PR into `staging`, each step a commit (`/run-plan`). Code references are from `staging` at `a580c50`; re-check line numbers when a step starts.

Owner decisions (2026-11-08):
- Every gold and explorer token change floats in the HUD currency feed, except kill gold (`zones-waves-unlocks.md` keeps "Kill gold doesn't float").
- An Order whose rewards don't fit is refused whole: nothing taken, no cooldown, nothing paid, the same as a quest after Item grant.

## Order

Step 1 before Step 2, which shows the changes Step 1 reports. Step 3 after Step 2, so the quest-completed modal leaves `QuestsStore` through Notices. Steps 4–7 are independent and can follow in any order. Step 8 last.

### 1. Resources (M, Opus) ✅
One pure module owns how saved **resources** (`experience`, `level`, `unspentSkillPoints`, `goldCoins`, `mana`, explorer tokens) change. Derived stats stay as ADR 0002 has them.
- Pure `store/player/resources.ts`, in the style of `tasks.ts` and `farm.ts`: given resources, the derived caps it needs (`maxMana`, XP table) and a change, it returns the new resources and what changed: `{ levelsGained, skillPointsGained, gold, tokens, mana }`.
- Move in: the XP-to-level loop (`handleExperience`, `player.store.ts:238`, recursive and mutating) and its copy in `applyKillBatch` (`:605-612`); the mana clamp in `updatePlayerStats` (`:391-410`), `regenMana` (`:752`) and `battle-manager.service.ts` `useConsumable` (`min(manaRestore, maxMana - mana)`).
- Every gold and token writer goes through it: `updatePlayerStats`, `applyKillBatch`, `mergeItem` (patches `goldCoins` directly, `:661-668`), `spend`, `sellItem` (`:654`), chest gold (`:754`), zone star (`:638`), `claimTasks`.
- `PlayerStore` actions that change resources return the change record, so Step 2 can show it. Callers that ignore it keep working.
- Specs (`resources.spec.ts`, no TestBed): XP across several levels in one change, skill points per level, mana clamped when stored mana is above `maxMana`, a spend that would go below zero refused and unchanged, merge spending gold by the same rule as `spend`.
- Docs: `player-stats-inventory-equipment.md`.

### 2. Notices (L, Opus, plan mode)
Store actions return what happened; one **Notices** module turns events into toasts, modals and currency feed lines. Stores stop injecting `ModalService`.
- Event union in `services/notices.ts`: station installed, reputation tier up, expertise up, currency change (gold, tokens), quest completed, drops lost, seed found, harvest, camp and forge results. A `NoticesService` with `push(event)` holds one queue and one timer policy per channel (toast, modal, feed) and builds the text and i18n keys now spread over the senders.
- Replace the eight timer copies: `camp.component.ts:81-118`, `forge.component.ts:63-131`, `battle-manager.service.ts:29-48,274,288` (`seedFoundToast`, `dropsLostToast`), `profession.service.ts:17-26`, `reputation.service.ts:17-29`, `farm.service.ts:42,115`, and `CurrencyFeedService.show` (`currency-feed.service.ts:37`). One toast outlet replaces the hand-rendered ones in `game.component.html:75-76` and `battle.component.html:18,21`.
- `PlayerStore.grant` (`:384,440`) returns `report.installed` and stops calling `openStationInstalled`; `QuestsStore` (`:91,110`) returns a quest-completed event and stops opening the modal. The caller that ran the action pushes the events.
- Delete `ProfessionService` and `ReputationService` if they keep nothing but the toast; callers call the store and push its event. This removes the store → service → store loop from `QuestsStore`.
- Currency feed from Step 1's change records, not caller snapshots: delete `goldBefore` (`shop.component.ts:153-155`) and `tokensBefore` (`dialogue-effect-handlers.ts:185-187`). New floats: mastery chests, zone stars, quest gold and tokens, merge cost, arena claim. Kill gold stays silent.
- Specs: `notices.service.spec.ts` with fake timers (an event shows for its time, the next replaces it, modals queue, feed lines merge per currency); `PlayerStore.grant` and quest completion specs without `ModalService` mocks; one spec per new float source.
- Changelog: `[feature] Gold and explorer tokens from chests, zone stars, quests, merging and the arena now show next to your purse.`
- Docs: `player-stats-inventory-equipment.md`, `quests.md`, `towns-shops-guild.md`, `farming.md`, `consumables-camp-crafting.md`, `zones-waves-unlocks.md`.

### 3. Quest transition (M, Opus)
One rule moves a quest forward and pays it.
- Pure `store/quests/quest-transition.ts`: given the progression, the Order rolls, the step, whether the clock is settled and whether the rewards fit, it returns the new quest slice and a payout, or a refusal. `advanceQuest` and `endQuest` (`quests.store.ts:290-332`) stop repeating the repeat guard, `canPayQuest`, `takeStepItems`, the progression patch and `setStepKillBaseline`.
- `completeOrder` (`:201-224`) stops building a synthetic `QuestProps`. It checks the payout before taking items or starting the cooldown; a refusal changes nothing (owner decision).
- `handleQuestCompleted` (`:105`) becomes the one payer and returns the quest-completed event for Step 2.
- The profession XP multiplier moves next to the profession rules (`professions` data or a `profession-xp.ts`), shared by `completeOrder` (`:223`) and harvest (`player.store.ts:894` `ctx.xpMultiplier`).
- Specs (`quest-transition.spec.ts`): last step with a full inventory changes nothing; an Order with a cooldown running is refused; an Order whose rewards don't fit is refused with items kept and no cooldown; the multiplier is the same for an Order and a harvest. `quest-drop-cap.spec.ts` and the dialogue specs pass unchanged.
- Docs: `quests.md`, `farming.md`.

### 4. Gear plan and unlocked content (M, Sonnet)
- Pure `store/player/equipment.ts`: a **Gear plan** for equip or unequip (stacks removed, stacks returned, slot change). `canEquip`/`equipItem` (`player.store.ts:553-583`) and `canUnequip`/`unequipItem` (`:667-692`) read the same plan, so a check and its write can't disagree. One helper builds the `{ id, tier, upgradeLevel, amount: 1 }` stack.
- `unlockZone`, `unlockTown`, `unlockSite` (`:807-830`) share one include-or-append; the default zone list (`[horseshoeBeach]`, `:810` and `:827`) lives once. `UnlockService` keeps the interface from deepening 1.
- Never lower an inventory slot bonus: the plan only moves slot bonuses that gear already gives; the slot-bonus spec from deepening 3 must pass.
- Specs (`equipment.spec.ts`): swap into a full tab, unequip blocked when the slot bonus would leave items without a slot, two-handed and off-hand swaps if they exist; unlock defaults.
- Docs: `player-stats-inventory-equipment.md`, `zones-waves-unlocks.md`.

### 5. Claim plan (S, Sonnet)
- Pure `planClaim({ lastSeen, claimEnd, arenaRemaining, cap })` in `services/offline-claim-plan.ts` returning `{ advanceMs, arenaMs, paidMs }`: `gapMs = max(0, claimEnd − lastSeen)`, `advanceMs = min(cap, gapMs)`, `arenaMs` only when `advanceMs ≥ arenaRemaining`, `paidMs = advanceMs − arenaMs`. `OfflineProgressService.claim` (`offline-progress.service.ts:85-145`) applies it.
- Specs (`offline-claim-plan.spec.ts`): clock moved back (gap 0), gap over the cap, arena run that ended during the absence, arena run still going, gap under `MIN_OFFLINE_CLAIM_IN_MS`.
- Docs: `offline-progress.md`.

### 6. Display names (M, Sonnet)
- One names module (`i18n/names.ts` plus a pipe if templates need it) with one lookup per key family: items, zones, quests, enemies, professions, reputations. It owns the **Upgrade level** name rule (`level > 0 ? upgradedName(name, level) : name`).
- Replace the ~16 `` `items:names.${ItemID[x]}` `` builders and the local `itemName` helpers (`recipe-detail.component.ts:26`, `requirement-handlers.ts:73`, `forge.component.ts:104`), and the seven copies of the upgraded-name rule (`equipment-slot.component.html:3,55`, `inventory-slot.component.html:2,67`, `destroy-confirm.component.html:4`, `forge.component.ts:107`, `shop.component.ts:141`).
- Validate: a check in `scripts/validate-data.mjs` that every enum member of each family has its key, so dynamic keys are covered.
- Specs: the upgraded-name rule; one lookup per family.
- Docs: `localization.md`.

### 7. Spell rules (S-M, Sonnet)
- Pure `store/battle/spell-rules.ts` beside `spell-bar.ts`: `manaCost`, `spellCooldown`, `canCast` (per `SpellType`) and a consumable-use plan (mana gained, effect, lock), moved from `BattleManagerService`. The service routes; `handleEnemyDeath` keeps only Kill resolution and events.
- Specs (`spell-rules.spec.ts`): perk cost floor at 1, cooldown floor at 1 s, empower already active, pure mana potion at full mana does nothing.
- Docs: `spells-and-buffs.md`, `consumables-camp-crafting.md`.

### 8. Wrap-up (S)
- Re-read the system doc each step touched against the final code.
- Run `/blast-radius` on the whole branch (stores, notices, quest payouts and offline claims are touched).
- Run `verify-yari` for Steps 2, 3 and 4 (toasts and modals, the new currency floats, an Order with a full inventory, equip swap into a full tab) and put the evidence path in the PR body.
