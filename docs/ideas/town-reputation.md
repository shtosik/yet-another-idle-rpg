# Town reputation

**Scope:** M · **Status:** Accepted (design settled with the owner, 2026-10-31; numbers to tune)

Each town keeps the player's **reputation**: points earned by helping it, never spent and never lost. Reaching a **reputation tier** unlocks stock, recipes, optional quests, dialogue, **titles** and, at the top, a town **pet**. It gives a reason to go back to older towns and zones without daily content. Terms are in `GLOSSARY.md`.

## Decisions

- **One reputation per town.** NPCs all add to their town's number. Per-NPC or faction reputation is not planned.
- **No daily content:** no resets, streaks, expiring orders or login rewards.
- **Guild rank stays separate.** Tasks earn explorer tokens and Guild rank, never reputation.
- **Reputation never gates the main path.** Existing quests, zone entrances and story progress have no tier requirement. Only new optional follow-ups do.
- **No price effects.** No buy discounts, no better sell prices.
- **Not in scope:** station gear rewards, gear upgrade caps (`gear-upgrading.md` stays independent), cosmetics beyond titles.
- **No save migration.** Pre-release: saves are reset after the state change, no backfill of earlier quest completions.

## Towns covered

**La Harpar** and **Mawood**, the towns with NPCs and quests today (`src/data/towns-data.ts`).

- **La Harpar** values provisions and safe trade: the Bartender, Josh, the Trader and Elara. Marvin stays a Guild NPC.
- **Mawood** values medicine and rebuilding after the blight: Corwin, Sylvie, Finn, Brenna, Elarion and Milo. Recovery takes years in canon (`src/assets/locales/en/dialogues/mawoodCorwin.json`); Exalted does not heal the forest.

### Lirold (ideas)

Lirold has only the Arena and Ludo Crane today. The owner wants the Exploration Guild to move there (`north-lirold-and-exploration-guild.md`). Once Lirold has more than the Arena, ideas to explore:
- Lirold reputation from Guild story quests such as *The Guild Trial* (never from tasks).
- A one-time reputation award for the first Arena clear, claimed from Ludo; later clears give none.

### Later towns

Slatefall and Brinewick get reputation when they ship; their own idea docs design givers, turn-ins and rewards to these rules.

## Tiers and pacing

Five tiers, the same names in every town. Thresholds are cumulative and first guesses; tune them with `npm run sim`.

| Tier | Reputation | Target |
|---|---|---|
| Neutral | 0 | — |
| Friendly | 50 | Around the first hour at La Harpar |
| Honored | 200 | |
| Revered | 600 | |
| Exalted | 1500 | Optional goal, roughly 15–25 h of play including offline progress |

## Earning reputation

### Quests

Every quest from a town NPC lists a reputation reward (`{ type: 'reputation', townId, amount }`) in its rewards, so the amount shows with the other rewards and a quest can credit another town when the story calls for it. First guesses:

| Town | Quests | Reputation |
|---|---|---|
| La Harpar | `meatShortage`, `clearingOutTheBeach`, `ratsWereRats` | 20 each, 60 total |
| Mawood | `signsOfRot` 25, `theSapThatBurns` 35, `theBlightedHeart` 100, `fetchesAndFangs` 20, `bigGame` 45, `proveYourAim` 45, `silkAndWater` 25, `theInfestation` 35, `rawMaterials` 45, `warTrophies` 50, `feathersForAKite` 25, `whatLurksAtTheTop` 75 | 525 total |

`aTaleOfACaptain` gives nothing until it can be completed. New quests set their own amount.

### Turn-ins

Two NPCs per town take one existing drop each, at a flat rate with no limit; reputation simply stops mattering at Exalted. Turn-ins pay reputation only, no gold, XP or explorer tokens. First guesses:

| Town | NPC | Bundle | Reputation | Source |
|---|---|---|---|---|
| La Harpar | Bartender | 20 Crab Meat | 10 | Crab, Gangster Crab (Horseshoe Beach) |
| La Harpar | Josh | 20 Feather | 10 | Seagull (Horseshoe Beach) |
| Mawood | Sylvie | 15 Spider Silk | 15 | Forest Spider (Elderwood Wilds) |
| Mawood | Brenna | 10 Ancient Wood | 25 | Treant Sprout, Gnarled Treant (Deepwood) |

In the NPC's dialogue, two options: **hand over one bundle** and **hand over all full bundles**. Each shows what the player holds and what they get, e.g. "Hand over 20 Crab Meat (have 34) → +10 La Harpar reputation". Drops collected offline count the same. Ordinary kills give no reputation.

## Rewards

Every tier in every town unlocks at least one concrete thing. The `lore-keeper` agent picks the specific items, quests and lines per town; the kinds are:

| Tier | Rewards |
|---|---|
| Friendly | A **title** (e.g. "Friend of La Harpar"); dialogue: NPCs who charge for answers (the Bartender, Josh) answer for free |
| Honored | Extra shop stock (`minReputation` on shop items), a recipe scroll |
| Revered | An optional follow-up quest line, new dialogue branches |
| Exalted | A second **title** and the town **pet** |

### Titles

One shared **Title** system: reputation is its first source, achievements (`achievements.md`) and other content can add titles later. Titles give no stats. The player picks which earned title to show in the stats panel.

### Town pets

At Exalted, a town NPC gives the town's pet once, in dialogue. It is an ordinary pet item for the single pet slot, with **utility stats no enemy pet has**, so the player chooses between it and a damage pet:

- **La Harpar:** a new stat that strengthens food effects (+X% to the stats food gives).
- **Mawood:** `increasedSpellDuration`.

Amounts come from the sim. The giver, animal and dialogue are drafted by `lore-keeper` and checked against canon; sprites come from `/generate-2d-asset`.

## UI

- **Reputation tab** (`src/app/components/game/quests/reputation/`, today an empty label): one row per discovered town with tier and progress to the next threshold (Exalted shows a full bar). No reward lists, per `quest-panel.md`.
- **Tier-up toast**, one per town per transaction even when several tiers are crossed.
- **Locks** say what is needed: "Requires Mawood Honored — 140/200". Town tiers never read as "Rank", which is the Guild's.
- **Town header** shows the player's tier in that town.

## Touch-points

- Reputation per `TownID` in player state (`src/app/store/player/player.store.ts`), persisted; tier is derived from points, not stored.
- Quest reward type and `startRequirements` type `{ type: 'reputation', townId, tier }` (`src/data/quests-data.ts`, `src/app/store/quests/quests.store.ts`).
- Dialogue condition (minimum tier) and turn-in effect (`src/types/dialogues/`, `src/app/services/dialogue-manager.service.ts`, via `/add-dialogue-effect`).
- `minReputation` on shop items next to `minRank` (`src/types/shop/shop.type.ts`, `src/data/shops-data.ts`, shop store and component).
- Title state and picker in the stats panel; new food-effect stat in `src/types/player/player-stat.type.ts` and the derived `stats` (ADR 0002).
- i18n, `scripts/validate-data.mjs`, `scripts/sim-economy.mjs` (reputation pacing), and the system docs each step touches.

## Implementation order

1. **Reputation state, quest rewards, Reputation tab.** Quest amounts above, tier-up toast, town header.
2. **Turn-ins.** The four givers and dialogue options; sim the pacing.
3. **Tier unlocks and titles.** Shop stock, dialogue branches, follow-up quests from `lore-keeper`, the Title system and picker.
4. **Town pets.** `lore-keeper` drafts them; new food-effect stat; sprites.

## Later

- A shiny version of each town pet.
- Lirold reputation once the Exploration Guild moves there.
- Turn-ins from gathering skills (`gathering-skills.md`), if those ship.
