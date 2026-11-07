# Achievements

**Scope:** M · **Status:** Proposed

A list of long-term goals (kill counts, bestiary, shinies, pets, quests, zones, crafting, guild, spells, offline) that unlock once, show a toast and give a small reward. Most of them read counters the game already keeps. This doc lists the achievements, the reward options, the architecture and the open questions. It uses only content that exists today: 31 enemies (8 of them bosses), 31 normal and 31 shiny pets, 8 zones, 3 towns, 16 quests, 18 recipes, 4 stations, 3 spells and 21 skill nodes.

## 1. Goals

- **Give targets past the main quest line.** The sim (`npm run sim`) reaches the end of the Upper Canopy in about 6 h at level 16 with about 123k gold earned. After that, shinies (0% chance until the `shinyHunter` node), 1/2000 pets and Guild ranks are the only open-ended goals, and nothing tracks them. Achievements give those grinds a checklist.
- **Teach systems the player might skip:** weakness hits, spells, consumables, Camp stations, the Exploration Guild.
- **Fit an idle game.** Monsters don't fight back, so there are no death, damage-taken, flawless or speed-run achievements. Achievements count **time invested and things collected**: kills, rare drops, completion. They must also count kills from an offline claim, so playing idle is never worse for achievements than playing online.
- **No new chores.** No achievement asks for clicks the auto-battle already makes, or for "do X within Y seconds". Offline kills count the same as online ones.
- **Cheap at runtime.** No per-tick work (the game ticks at 10 Hz). Checks run only when the state they read changes.

## 2. Achievements

Tiers are Bronze / Silver / Gold of one counter and share an id stem (`hunter1..3`). Rewards follow the recommendation in §3: **[S]** = small derived stat, **[T]** = title, `—` = points only. Stat values are a starting point; tune them with the sim.

**Counter column:** ✅ exists today · 🆕 needs new tracking.

### Combat and hunting

| # | Name | Condition | Tiers | Reward | Counter |
|---|---|---|---|---|---|
| 1 | Hunter | total kills (sum of `enemyKillCounts`) | 500 / 5,000 / 50,000 | [S] `attackPower` +1 / +2 / +3 | ✅ |
| 2 | Crab Cracker | crab + gangster crab kills | 250 / 1,000 / 5,000 | [S] `damageVsCrab` +0.05 / +0.1 / +0.15 | ✅ |
| 3 | Slime Time | blue + red + green + king slime kills | 250 / 1,000 / 5,000 | [S] `damageVsSlime` +0.05 / +0.1 / +0.15 | ✅ |
| 4 | Pest Control | rat + giant rat kills | 100 / 500 / 2,000 | [S] `damageVsRat` | ✅ |
| 5 | Greenskin Bane | goblin scout + goblin scavenger kills | 250 / 1,000 / 5,000 | [S] `damageVsGoblin` | ✅ |
| 6 | Rot Cutter | corrupted sapling + treant sprout + gnarled treant kills | 250 / 1,000 / 5,000 | [S] `damageVsPlant` | ✅ |
| 7 | Webs Torn | forest spider + elder spider kills | 250 / 1,000 / 5,000 | [S] `damageVsSpider` | ✅ |
| 8 | Skybreaker | seagull + giant eagle + harpy + harpy matriarch kills | 250 / 1,000 / 5,000 | [S] `damageVsBird` | ✅ |
| 9 | Exploit It | weakness hits | 100 / 1,000 / 10,000 | [S] `extraPhysicalDamageMultiplier`? (open question 3) | 🆕 (`resolveHit` returns `isWeaknessHit`, nobody counts it) |
| 10 | Lucky Strike | critical hits | 100 / 1,000 / 10,000 | [S] `critMulti` +0.02 / +0.03 / +0.05 | 🆕 (`isCrit`, not counted) |

Enemy groups use `EnemyType` where one fits (slime, crab, spider, plant, bird), so a future enemy of that type counts automatically. Define each group as "enemies with type X", not as a list of ids.

### Bosses

| # | Name | Condition | Tiers | Reward | Counter |
|---|---|---|---|---|---|
| 11 | Boss of the Beach … Matriarch's Fall | first kill of each zone's boss (8 achievements, one per `bossEnemyId`) | — | — (the zone unlock is the reward) | ✅ `enemyKillCounts[bossEnemyId]` |
| 12 | Regicide | King Slime killed 100 times | — | [S] `damageVsSlime` +0.1 | ✅ |
| 13 | Boss Rush | every boss killed at least 25 times | — | [T] "Bossbreaker" | ✅ |

Bosses come from the zone (`Zone.bossEnemyId`) and no boss appears in a regular pool, so the count of the boss enemy is the count of boss kills.

### Bestiary, shinies and pets

| # | Name | Condition | Tiers | Reward | Counter |
|---|---|---|---|---|---|
| 14 | Naturalist | distinct enemies revealed in the bestiary | 10 / 20 / all 31 | [S] +1 / +2 / +3 `inventorySlots`; Gold also [T] "Naturalist" | ✅ keys of `enemyKillCounts` |
| 15 | Something Sparkles | first shiny kill | — | — | 🆕 shiny kill counter |
| 16 | Shiny Hunter | shiny kills | 10 / 50 / 250 | [S] `shinyChance` +0.1 / +0.2 / +0.3 (percent points) | 🆕 |
| 17 | Shiny Collector | distinct enemies killed as shiny | 10 / 20 / all 31 | Gold: [T] "Glimmerseeker" | 🆕 per-enemy shiny kills |
| 18 | First Friend | own any pet | — | — | 🆕 "ever obtained" set (see below) |
| 19 | Menagerie | distinct normal pets ever obtained | 5 / 15 / all 31 | [S] +2% `xpMultiplier` per tier | 🆕 |
| 20 | Gleaming Companion | own any shiny pet | — | [T] "Beastfriend" | 🆕 |

"Owned" can't be read from the inventory: pets can sit in the inventory, be equipped, or (later) be sold or released. Track a `obtainedItems` set (item ids ever received). Item collections (§5, item sets) will need the same set.

### Progression

| # | Name | Condition | Tiers | Reward | Counter |
|---|---|---|---|---|---|
| 21 | Seasoned | reach level | 5 / 10 / 15 | — / [S] +1 skill point? (open question 4) / [T] "Veteran" | ✅ `resources.level` |
| 22 | Cartographer | zones unlocked | 4 / 6 / all 8 | — | ✅ `unlockedContent.zones` |
| 23 | Wanderer | towns unlocked | all 3 (La Harpar, North Lirold, Mawood) | — | ✅ `unlockedContent.towns` |
| 24 | Full Clear | every wave of a zone has at least `enemiesPerWave` kills and the boss is dead, one per zone (8) | — | [S] +1% `goldCoinsMultiplier` each | ✅ `zonesProgression` |
| 25 | Gold Hoarder | lifetime gold earned | 10k / 100k / 1M | [S] `goldCoinsMultiplier` +2% / +3% / +5% | 🆕 (only the balance is saved) |
| 26 | Big Spender | lifetime gold spent (shops, fees, respec) | 5k / 50k / 500k | [S] `shopRefreshCooldown` (faster refresh) | 🆕 |

### Quests and towns

| # | Name | Condition | Tiers | Reward | Counter |
|---|---|---|---|---|---|
| 27 | Helping Hand | quests completed (step `QUEST_STEP_AFTER_COMPLETED`) | 1 / 8 / all 16 | Gold: [T] "Hero of Mawood" | ✅ `questStepProgression` |
| 28 | The Blighted Heart | finish the Mawood corruption line (`theBlightedHeart` completed) | — | [T] "Rotbane" | ✅ |
| 29 | Captain's Tale | complete `aTaleOfACaptain` | — | — | ✅ |
| 30 | Contractor | Exploration Guild tasks completed | 5 / 25 / 100 | [S] `taskDoubleKillChance` +2% / +3% / +5% | ✅ `totalTasksCompleted` |
| 31 | Guild Veteran | reach Guild rank 5 | — | [T] "Pathfinder" | ✅ `guildRank` |

### Camp and crafting

| # | Name | Condition | Tiers | Reward | Counter |
|---|---|---|---|---|---|
| 32 | Handy | items crafted (sum of `crafted` from `craftItem`) | 10 / 100 / 1,000 | [S] +1 / +2 / +3 `inventorySlots` | 🆕 |
| 33 | Recipe Book | recipes learned | 5 / 10 / all 18 | — | ✅ `unlockedRecipes` |
| 34 | Fully Equipped Camp | every station at its max level (workbench 3, cooking 3, alchemy 2, rune altar 1) | — | [T] "Quartermaster" | ✅ `stations` |
| 35 | Well Fed | food and potions consumed (including auto-eat) | 25 / 250 / 2,500 | [S] `increasedSpellDuration`? or none | 🆕 |
| 36 | Shell Shock | turtle shell helmet, chest, legs, gloves and boots equipped at once | — | — (seeds item sets, §5) | ✅ `equipment` |

### Skill tree and magic

| # | Name | Condition | Tiers | Reward | Counter |
|---|---|---|---|---|---|
| 37 | Specialist | any one skill tree branch fully unlocked (every node at `maxLevel`) | — | — | ✅ `unlockedNodes` |
| 38 | Arcanist | spells cast | 50 / 500 / 5,000 | [S] `maxMana` +5 / +10 / +15 | 🆕 |
| 39 | Spellbook | all 3 spells unlocked (fire strike, haste, double attack) | — | — | ✅ `unlockedSpells` |

### Idle and offline

| # | Name | Condition | Tiers | Reward | Counter |
|---|---|---|---|---|---|
| 40 | Welcome Back | first offline claim | — | — | 🆕 |
| 41 | Dreaming of Battle | total offline time claimed | 1 h / 24 h / 7 days | [S] `offlineProgressRate` +2% / +3% / +5% | 🆕 (`OfflineSummary.elapsedMs` is shown, then dropped) |

**Count:** 41 rows, about 70 unlockable entries counting tiers and the 8 boss and 8 full-clear entries. Trim to fit the first release (open question 1).

**Left out on purpose:** respec count (rewards changing your mind), "die / take no damage" (no enemy attacks), clicks or manual casts only (auto-play must count), "own N gold at once" (punishes spending), and anything tied to the harpy matriarch's plume (it has no use yet).

## 3. Reward model

| Option | Pros | Cons |
|---|---|---|
| **A. Small derived stats** per achievement | Felt in play, fits the "numbers go up" loop; computed from the unlocked set, so rebalancing applies to old saves (ADR 0002) | Adds power to tune; too many sources hide what is driving a build |
| **B. Permanent bonuses** (`updatePlayerStats` → `permanentBonuses`) | No new stat source | **Rejected.** ADR 0002 keeps `permanentBonuses` for things with no source to derive from. Achievements are a source: a retuned reward would leave the old amount baked into saves |
| **C. Titles** (cosmetic, shown under the player's name or in the stats panel) | No balance risk, a long-term flex | Pure cosmetics, so weak motivation on their own |
| **D. Explorer tokens / gold** | Uses existing currencies | Tokens belong to the Guild loop (rank = tasks, prices = zone tier); one-off bursts break shop pacing. Gold is irrelevant late |
| **E. Cosmetics** (frames, shiny sprite toggles, menu backgrounds) | Nice | Needs art per reward (`/generate-2d-asset`) and a cosmetic slot system that doesn't exist |
| **F. Achievement points** with milestone perks (every 100 points → a perk) | Rewards breadth, one simple curve | Perk is far from the action; another number to explain |

**Recommendation: A + C.**
- **Every tiered counter's tier gives a small stat themed on what was done** (killing slimes → `damageVsSlime`, crafting → `inventorySlots`, gold → `goldCoinsMultiplier`). Players see the reward next to the progress bar. Total power from achievements stays under ~10% of a mid-game build at most. Check it in the sim by adding an "all Bronze" column.
- **Capstones give a title** (the Gold tier, and "complete X" one-offs).
- **One-off milestones** (first shiny, first boss) give **nothing but the toast**, because the event is its own reward and keeps the list honest.
- **Not** tokens or gold (D). Revisit **E** once a cosmetic slot exists (prestige or the town building upgrades might add one).
- Show **points** (Bronze 5, Silver 10, Gold 25, one-off 10) as a total score for bragging, with no milestone perks for now (F is easy to add later on the same data).

Stats are derived: add `achievementModifiers(unlocked)` to `deriveStatsWith` next to `bonusModifiers`. Revoking an achievement (debug, or a rule change) then also removes its stat.

## 4. Architecture

### State

| What | Where | Why |
|---|---|---|
| **Lifetime counters** (🆕 above): `shinyKills`, `shinyKillsByEnemy`, `weaknessHits`, `crits`, `goldEarned`, `goldSpent`, `itemsCrafted`, `consumablesUsed`, `spellsCast`, `offlineClaims`, `offlineMsClaimed`, `obtainedItems` | **`PlayerStore`**, a new `lifetime: LifetimeCounters` object | They are written where `enemyKillCounts` and `totalTasksCompleted` are already written (`processBattleEnd`, `applyKillBatch`, `craftItem`, `addItems`, `updatePlayerStats` when it spends gold). Keeping them here makes an offline claim one `patchState` with no extra store call, and adds no DI edges |
| **Unlocked achievements**: `unlocked` (unlock time of each tier reached, per id; §6), `seen: AchievementID[]` (for the "new" badge) | **New `AchievementsStore`**, key `achievementsStore` | It's its own feature with its own reset. It holds state only and injects nothing, so `PlayerStore` can inject it to derive stats (the same pattern as `BattleStore`: `PlayerStore` → `BattleStore`, never the other way) |
| **Checks, toasts, unlocking** | **New `AchievementService`** (root), modeled on `UnlockService` | It reads both stores, plus `QuestsStore` for quests, without creating cycles |

`enemyKillCounts`, `zonesProgression`, `unlockedContent`, `unlockedRecipes`, `stations`, `unlockedNodes`, `unlockedSpells`, `equipment`, `totalTasksCompleted`, `resources.level` and `questStepProgression` are read as they are, with nothing copied.

Two notes:
- **Kill counts under prestige.** If prestige (`prestige.md`) resets `enemyKillCounts`, kill achievements must read a counter that survives the reset. Decide before prestige ships: either prestige keeps `enemyKillCounts`, or move lifetime kills into `lifetime`.
- **`goldSpent`:** there are three gold sinks (shop buys, dialogue fees, respec/refund) that all go through `updatePlayerStats([{ stat: 'goldCoins', amount: -x }])`. Count negative `goldCoins` amounts there, in one place. Positive amounts are `goldEarned`, but quest gold rewards also land there. Decide whether quest gold counts (open question 6).

### Checks: computed from state, not event-driven

Two ways to check:
- **Event-driven:** every call site calls `achievements.notify('kill', …)`. Precise, but it spreads across 10+ call sites, the offline batch path has to repeat each one, and an achievement added later can't see past progress.
- **Computed from state (recommended):** every achievement is a pure function `progress(ctx) → number` over store signals; the service compares it against the target. Retroactive by design: a new achievement or a fixed counter unlocks on next load. It is the same model as `UnlockService` with `UNLOCK_RULES`.

Counters still have to be **recorded** at event sites (that is §State), but achievements never hook those sites. They only read the result.

```ts
// AchievementService (sketch)
constructor() {
  effect(() => {
    const ctx = this.context()           // computed: the slices below, nothing from BattleStore
    const newly = this.locked().filter(a => a.progress(ctx) >= a.target)   // locked(): computed, shrinks over time
    if (!newly.length) return
    untracked(() => {
      this.store.unlock(newly.map(a => a.id), Date.now())
      if (this.ready) this.toasts.push(...newly)   // silent on the load pass
    })
  })
}
```

### Performance

- **No `BattleStore` reads** in `context`. Enemy HP, spell timers and consumable timers change every 100 ms tick; the player store changes only on kills, loot, XP, gold, crafting and mana-point gains.
- `context` is a `computed` of the specific slices (`enemyKillCounts`, `zonesProgression`, `lifetime`, `resources.level`, …), so the effect runs about once per kill (≤ ~5 per second late game).
- Each run checks **locked achievements only** (≤ ~70, shrinking). Every `progress` is O(1) or a small sum (at most 31 enemies, 8 zones or 16 quests). Precompute the per-group enemy lists from `EnemyType` once at module load. That is well under 0.1 ms per kill.
- **Progress bars** in the UI are a separate `computed` that only runs while the Achievements tab is open.
- If profiling ever shows a cost, fall back to evaluating on the existing 1 Hz consumable/offline tick instead of the effect. The data model stays the same.

### Offline claim and load

- `applyKillBatch` updates kill counts and lifetime counters in one patch, so the effect runs once after a claim. Achievements unlocked by the claim **join the welcome-back modal** as a "New achievements" row (add `achievements: AchievementID[]` to `OfflineSummary`, or let the service hold toasts while the modal is open and show them after it closes; open question 7).
- **Load pass:** like `PlayerStore` re-applying unlock rules on load, the first effect run unlocks silently. It still flags them as unseen, so the tab badge shows "new", but there is no toast storm for a save that predates the feature.

### Persistence

New store `achievementsStore` with the usual `signalStore(withState, withGameStateSync(KEY, initialState), withDevtools(KEY), …)` and a `resetState()` called from `GameComponent.resetState`. `lifetime` is a new key in `playerStore`; old saves get zeros through the merge (persistence.md "New keys pick up defaults"). Keep `obtainedItems` and `seen` as **arrays that start empty** (arrays merge by index). `AchievementID` is a numeric enum: never renumber it after release (saved values are enum numbers).

### Notification

The unlock modal (`UnlockNotificationComponent`, 800 px, backdrop) is too heavy for something that can fire several times a minute early on. Add a **toast**: a small non-blocking card at the bottom right with icon, name, tier and reward, auto-dismissed after 4 s and stacked (at most 3 visible, then "+N more"). Options: `MatSnackBar` (already in Angular Material, but one at a time and awkward to stack) or a ~60-line `ToastComponent` driven by a signal queue in a `ToastService`. **Recommend the custom toast.** Quest-complete and station-installed popups could move to it later.

### UI placement

**New Achievements tab** in the game menu (`GameTab.achievements`), next to the bestiary:
- Header: points total, unlocked / total, current title (a picker to choose which title to show).
- Category filter chips (the §2 headings); grid of cards with progress bars `1,234 / 5,000`, tier pips, reward text; locked one-offs show their condition, but **hidden** ones (open question 2) show "???".
- A "new" dot on the menu button while `unlocked − seen` is non-empty; opening a category marks it seen.
- Show the tab from the start, or open it with the first achievement through an `UnlockTarget` feature `'achievements'` (fits the existing unlock rules: `UnlockableFeature` gains a member).

Alternative: a "Journal" tab that merges the bestiary and achievements, since both are collection logs. That is a bigger UI change, so it is listed as open question 8.

## 5. Interplay with planned features

| Planned feature | Interplay |
|---|---|
| **Bestiary kill ranks** (shipped, `docs/systems/enemies-shiny-pets-bestiary.md`: ★ 100 / ★★ 1,000 / ★★★ 10,000 kills, bosses 10 / 100 / 500; per-enemy drop bonus only) | Ranks own per-enemy bonuses, achievements count ranks: rows 2–8 become "Stargazer: 31 / 62 / 93 stars" and "Completionist: N entries at ★★★". Keep rows 2–8 points-only so one milestone does not pay twice |
| **Town reputation** ([town-reputation.md](town-reputation.md): Neutral → Exalted per town) | One `progress` function per town ("Friend of Mawood: Honored"; "Exalted in every town" as a capstone). Reputation is its own counter in its store; the service reads it like any other slice. Its tier-up toast should reuse the achievement toast. Quest achievements (rows 27–29) stay: quests are also the main source of reputation, so both fill up together |
| **Zone mastery stars** (shipped, `docs/systems/zones-waves-unlocks.md`: Conqueror = boss 10 times, Hunter = every zone enemy at ★, Shiny Hunter = 10 shinies in the zone; all 3 stars add gold multiplier through the derived `mastery` source) | "Full Clear" (row 24) and "Regicide" / "Boss Rush" (rows 12–13) overlap Conqueror: replace them with "3-star N zones" tiers and let mastery own per-zone rewards. `shinyKillsByZone` already exists for shiny achievements |
| **Item sets** ([item-sets.md](item-sets.md): Turtle Shell 2/4/5 pieces) | Row 36 (all five turtle shell pieces equipped) is the prototype. Set bonuses are a derived stat source; achievements add "completed set X once" or "collected every piece" (needs `obtainedItems`, so a set can count without being worn) |
| **Gear upgrading** ([gear-upgrading.md](gear-upgrading.md): +1 to +5, no failure) | New counters in `lifetime`: `itemsUpgraded`, `highestUpgradeLevel`. "Reforged: upgrade any item to +5" (named in the upgrading doc) and "Fully forged: a full turtle shell set at +5" tie item sets to upgrading. Equipment instances (`upgradeLevel`) will make `equipment` checks such as row 36 read `itemId`, not the whole item |
| **Pet leveling & collection** (`pet-leveling-collection.md`) | Rows 18–20 overlap the collection log. Same rule: the collection log owns stat bonuses for sets of pets, achievements count milestones. Shares `obtainedItems` |
| **Prestige** | Achievements and `lifetime` **survive** prestige (they are account-level). Add prestige count achievements later. Check that achievement stats don't trivialize the early game after a reset |
| **Overkill & spell mastery** | Spell ranks become another progress source ("Master any spell"). Overkill kills could be a counter |

General rule: **a system owns its per-entity rewards, achievements own cross-cutting milestones.** That keeps one stat source per idea and avoids stacking the same bonus twice.

## 6. Data shape and touch-points

```ts
// src/enums/ids/achievement-id.enum.ts
export enum AchievementID { hunter = 0, crabCracker = 1, /* … */ }

// src/interfaces/achievement.interface.ts
export type AchievementCategory = 'combat' | 'bosses' | 'collection' | 'progression' | 'quests' | 'camp' | 'magic' | 'idle'

export interface AchievementContext {
  enemyKillCounts: Partial<Record<EnemyID, number>>
  zonesProgression: ZonesProgression
  unlockedContent: UnlockedContent
  level: number
  lifetime: LifetimeCounters
  totalTasksCompleted: number
  unlockedRecipes: RecipeID[]
  stations: Stations
  unlockedNodes: UnlockedNodes
  unlockedSpells: UnlockedSpellsType
  equipment: EquipmentType
  questStepProgression: QuestProgression
}

export type AchievementReward =
  | { type: 'stat'; stat: PlayerStat; amount: number }   // derived via achievementModifiers, never permanentBonuses
  | { type: 'title'; titleKey: string }

export interface AchievementTier {
  target: number
  points: number
  rewards: AchievementReward[]
}

export interface Achievement {
  id: AchievementID
  category: AchievementCategory
  icon: string                     // assets/img/achievements/<stem>.png, or reuse an enemy/item icon
  hidden?: boolean                 // show "???" until unlocked
  progress: (ctx: AchievementContext) => number
  tiers: AchievementTier[]         // one entry for a one-off; ascending targets
}
// AchievementsStore: `unlocked: Partial<Record<AchievementID, number[]>>`, the unlock time (host ms) of each tier
// reached, in tier order. Length = tiers reached, so the highest tier and every unlock time are both kept.

// src/app/store/player/player.ts
export interface LifetimeCounters {
  shinyKills: number
  shinyKillsByEnemy: Partial<Record<EnemyID, number>>
  weaknessHits: number
  crits: number
  goldEarned: number
  goldSpent: number
  itemsCrafted: number
  consumablesUsed: number
  spellsCast: number
  offlineClaims: number
  offlineMsClaimed: number
  obtainedItems: ItemID[]
}
```

Names and descriptions: a new i18n namespace `achievements` (`achievements:<id>.name`, `.description`, `titles.<key>`), registered in `app.config.ts`. `npm run validate` gains checks: every `AchievementID` has data and i18n, tier targets ascend, stat rewards name a real `PlayerStat`, icons exist.

### Touch-points

| File | Change |
|---|---|
| `src/enums/ids/achievement-id.enum.ts` | new |
| `src/interfaces/achievement.interface.ts` | new |
| `src/data/achievements-data.ts` | new: the list, group helpers by `EnemyType` |
| `src/app/store/achievements/achievements.store.ts` | new store, `unlocked`, `seen`, `selectedTitle` |
| `src/app/services/achievement.service.ts` | new checker effect, toast queue, load pass |
| `src/app/store/player/player.store.ts` | `lifetime` state; record shiny kills and gold earned in `processBattleEnd`/`applyKillBatch`, gold spent in `updatePlayerStats`, crafts in `craftItem`, `obtainedItems` in `addItems`; inject `AchievementsStore` for stats |
| `src/app/store/player/stats.ts` | `achievementModifiers(unlocked)` |
| `src/app/store/player/player.ts` | `LifetimeCounters`, initial value |
| `src/app/services/battle-manager.service.ts` | record crits and weakness hits in `doDamage`, spells in `castSpell`, consumables in `useConsumable` (through `PlayerStore` methods) |
| `src/app/services/offline-simulation.ts`, `offline-progress.service.ts` | add shinies per enemy, crits/weakness hits (or skip them offline; open question 5) to `KillBatch`; record offline claims and ms; achievements in `OfflineSummary` |
| `src/app/components/game/achievements/` | new tab component |
| `src/app/components/shared/toast/` + `src/app/services/toast.service.ts` | new toast |
| `src/app/components/game/game-menu/*`, `game.component.html`, `GameTab` enum | tab and "new" dot |
| `src/app/components/game/game.component.ts` | `resetState` calls `AchievementsStore.resetState` |
| `src/data/unlock-conditions.ts` | optional `'achievements'` feature unlock |
| `src/assets/locales/en/achievements.json`, `src/app/app.config.ts` | i18n namespace |
| `scripts/validate-data.mjs` | achievement checks |
| `scripts/sim-economy.mjs` | optional: achievement stat column |
| `docs/systems/achievements.md` (new), `persistence.md` (new key), `player-stats-inventory-equipment.md` (new stat source), `GLOSSARY.md` (Achievement, Title) | docs |

## 7. Open questions for the owner

1. **Size of v1:** ship all ~70 entries or a first cut of ~25 (only ✅ counters plus shiny kills and gold earned)?
2. **Hidden achievements:** any secret ones (e.g. first shiny pet), or is everything visible with its condition?
3. **Stat rewards or not:** is A + C (themed small stats plus titles) right, or titles and points only, so achievements add no power? If stats, what is the ceiling for all of them together (proposal: ~10% of a mid-game build)?
4. **Skill point rewards:** may a level achievement give a skill point? It is a strong reward and interacts with respec.
5. **Offline crits and weakness hits:** the offline simulation computes expected kills, not individual hits. Count them offline from expected rates, or make those two achievements online-only (which breaks "idle is never worse")? Proposal: drop rows 9–10, or estimate them from expected rates.
6. **Gold earned:** count only kill gold and selling, or quest gold rewards too?
7. **Offline unlock display:** in the welcome-back modal, or as toasts after it closes?
8. **UI:** a separate Achievements tab, or a "Journal" tab that merges it with the bestiary? Visible from the start or unlocked by the first achievement?
9. **Titles:** where are they shown (player stats panel, top bar)? Is one selected title enough?
10. **Bestiary stars and zone mastery:** confirm the rule "the system owns per-entity rewards, achievements count milestones", so kill groups (rows 2–8) and Full Clear (row 24) are expected to turn into star-count achievements later.
11. **Prestige:** confirm achievements and lifetime counters are account-level and never reset.
