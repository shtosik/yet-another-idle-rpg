# Plan: codebase deepening

Four refactors from the 2026-11-08 architecture review. Each one turns rules spread over several places into one module with a small interface, and each one is tested through that interface. One branch, `refactor/codebase-deepening`, and one PR into `staging`, with each step a commit (`/run-plan`). Code references are from `staging` at `8967fcd` (2026-11-08); re-check line numbers when a step starts.

None of these steps should change game behavior, except the online lost-drop count in Step 3 (see there).

## Order

Step 1 comes first. Step 2 comes before Step 3, because Kill resolution calls the unlocks module's `grant`. Step 4 can follow either of them. Step 5 comes after Step 4, because dialogue fees move to `spend`. Step 6 comes last.

### 1. Glossary and ADR (S, Sonnet) ✅
- `GLOSSARY.md`: add **Kill resolution** (turning kills into XP, gold, drops, kill counts, task progress and zone progress; the same rules online and in an offline claim; arena kills are separate) and **Unlocks** (the module that decides what is unlocked and shows each notice once).
- `docs/adr/0003-arena-kills-outside-kill-resolution.md`: arena kills keep their own XP/gold formula (`arena.service.ts:57`: no wave scaling, drops, tasks or zone progress). They stay outside Kill resolution, because an "arena mode" flag would widen its interface for one caller. Revisit if a second kind of kill appears.

### 2. Unlocks module (M, Opus) ✅
`UnlockService` (`services/unlock.service.ts`) becomes the only owner of what is unlocked and of its notices. Its interface is `grant(target)` and `replayOnLoad()`, with no `notify` option.
- Move in: the `UNLOCK_RULES` check (`PlayerStore.isUnlockConditionMet`, `player.store.ts:1042-1085`, including the `questCompleted` case it skips today); the load replay in `PlayerStore.onInit` (`:1133`); `QuestsStore.unlockEntranceZones` (`quests.store.ts:103`, caller `:266`) and its replay in `onInit` (`:338`); the zone chain in `BattleManagerService.unlockNextZone` (`battle-manager.service.ts:323`); and the dialogue `unlockSite` case (`dialogue-manager.service.ts:366`).
- `grant(target)` does nothing when the target is already unlocked. Otherwise it sets the flag and shows the target's notice, if it has one. The module finds the notice itself, from `ZONE_UNLOCK_NOTIFICATIONS`, `rule.notification` or the `unlocks:sites.<Site>` key pattern. Callers stop building notice keys. The data files don't change.
- `replayOnLoad()` is one silent pass, replacing both store replays.
- `PlayerStore` keeps only the unlocked flags and their readers (`isZoneUnlocked`, `isSiteUnlocked`, `applyUnlockTarget` as the writer `grant` uses).
- Specs (new, there are none today): a live grant shows one notice; a second grant of the same target shows nothing; the load replay shows nothing; a rule met by kills or by quest completion is granted; entrance zones are granted on quest completion and on load. Use a mock `ModalService`.
- Docs: `zones-waves-unlocks.md`, `world-map.md` if it describes unlock notices.

### 3. Kill resolution (M-L, Opus, plan mode) ✅
A new `services/kill-resolution.service.ts` with one interface, `resolveKills(kills, rng)`. Online play, the offline claim and dev-cheats all call it. Arena does not (ADR 0003).
- **Tests come first, in their own commit.** One seeded, table-driven spec: the same kills with the same seed, resolved one by one (online) and as one batch (offline claim), give identical state: XP and level, gold, kill counts, zone progress, shiny kills, task progress (including the Bounty Mark double kill), seeds, installed stations, inventory and lost drops. This spec fails on the current code; it shows the divergences being removed.
- Add a pure `rollKill(enemy, zone, wave, isShiny, stats, ctx, rng)` that returns a `KillBatch` for one kill, built from `killReward`, `rankBonus` and `rollEnemyDrops` (`store/player/kill-rewards.ts`). The offline simulation loop (`offline-simulation.ts:150-162`) builds its batch with it.
- `PlayerStore.applyKillBatch` (`player.store.ts:639`) is the only writer. It applies task progress with the batch's rolled double kills, not with `Math.random` (`updateTaskProgress`, `:530`). Delete `processBattleEnd` (`:604`); online play becomes a batch of one kill.
- Inside `resolveKills`: the quest drop limits (`getQuestDropLimits`, now called at `battle-manager.service.ts:279` and `offline-progress.service.ts:157`) and the next-zone unlock on a boss kill, through `UnlockService.grant` (replaces `battle-manager.service.ts:284` and `offline-progress.service.ts:166`). A boss kill during an offline claim still shows the zone notice.
- `offlineProgressRate` stays in `offline-simulation.ts:135`. It slows the offline kill time and never changes what one kill pays.
- Callers: `BattleManagerService.handleEnemyDeath` (`:264`) keeps only the battle side (popups, toasts for `lost` and `foundSeeds`); `OfflineProgressService.applyOffline` (`:146`); `dev.addShinyKills` (`dev-cheats.component.ts:151`).
- Update `seed-routing.spec.ts` and `quest-drop-cap.spec.ts`, which call `processBattleEnd`.
- Online lost drops follow `applyKillBatch`'s rules: a dropped stack lands whole or not at all. If that changes what a player with a full inventory sees, add to the changelog: `[bug] Drops that don't fit a full inventory are now counted the same way online and offline.`
- Docs: `game-loop-and-combat.md`, `offline-progress.md`, `enemies-shiny-pets-bestiary.md` if it describes drops.

### 4. Dialogue handler tables (M-L, Opus)
Each dialogue effect and condition is known in one place.
- `services/dialogue-effect-handlers.ts`: `EFFECT_HANDLERS: { [T in DialogueEffect['type']]: EffectHandler<Extract<DialogueEffect, { type: T }>> }`, so a missing variant fails to compile. An entry holds `apply`, an optional `cost` (gold and slots it needs), an optional `canApply`, and `label` (an i18n key plus params).
- `services/dialogue-condition-handlers.ts`: `CONDITION_HANDLERS`, built the same way, with `evaluate` and `label`. This replaces `default: return false` (`dialogue-manager.service.ts:289`), which silently hides options.
- `DialogueManagerService` loops over the handlers in place of `applyEffects` (`:300`), `evaluateCondition` (`:214`), `canApplyResult` (`:85`), `missingGold` (`:118`) and `missingSlots` (`:127`).
- `DialogueComponent` reads labels from the tables. Delete `getConditionLabel` (`dialogue.component.ts:86`) and `getEffectLabel` (`:154`).
- What a quest pays comes from one function in the quests module, used by both `QuestsStore.handleQuestCompleted` (`quests.store.ts:71`) and the dialogue slot check (`questCompletionRewards`, `dialogue-manager.service.ts:152`).
- Specs: one handler-level spec per effect with `cost`/`canApply`, using fake store state; the 7 existing `selectOption` specs (`farm-warden-dialogue`, `pathfinders-seal-dialogue`, `reputation-turn-in`, `revered-quests`, `cold-forge`, `forge-effect`, `npc-places`) must pass unchanged.
- Update `.claude/skills/add-dialogue-effect` to point at the handler tables, then run `npm run sync-skills`.
- Docs: `dialogue.md`.

### 5. Shop purchase and guarded spend (M, Sonnet)
- `PlayerStore.spend(currency, amount): boolean` refuses when the balance is too low and changes nothing in that case. Gold, explorer tokens and the other shop currencies go through it. It replaces the bare `updatePlayerStats([{ goldCoins, -amount }])` in `shop.component.ts:200` and the gold `cost` of the dialogue handlers from Step 4.
- `ShopStore.purchase(shopId, index, count)` returns `{ bought, spent, installed }` or a `BlockReason`, and `ShopStore.blockReason(shopId, index)`. They move the checks from `buyBlockReason` (`shop.component.ts:100-124`), in the same order (stock, rank, reputation, currency, station, inventory), and the buying from `buyOne` (`:208-223`), including the spellbook case, out of the component.
- `ShopComponent` keeps the labels, the currency feed and the station-installed modal (shown when `installed` is set). Delete `balanceOf` / `spend` (`:187-205`).
- Specs: store-level purchase tests without the DOM (each block reason, the spellbook, an installed station, a refused `spend`); `shop.component.spec.ts` keeps only rendering.
- Docs: `towns-shops-guild.md`.

### 6. Wrap-up (S)
- Re-read the system doc each step touched against the final code.
- Run `/blast-radius` on the whole branch (stores, save shape and derived stats are touched).
- No `verify-yari` unless Step 3 changed what a player sees.
