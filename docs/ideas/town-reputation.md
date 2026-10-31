# Town reputation

**Scope:** M · **Status:** Proposed

Each town (La Harpar, Mawood) tracks reputation. This is the town type from [quest panel and reputation](quest-panel.md), which decided on several reputation types shown in the Reputation tab (current rank and progress only). Rep tiers unlock quests, shop stock, discounts and dialogue branches. Gives a reason to go back to older towns and zones.

## Earning rep
- Quest completion: main source, a `reputation` quest reward (`{ type: 'reputation', townId, amount }`).
- Turning in specific resources to a town NPC (e.g. Brenna takes hides, Sylvie takes herbs): a repeatable sink for zone drops.
- Not from dailies (owner: no daily content).

## Tiers
Neutral → Friendly → Honored → Revered → Exalted. Thresholds tuned with `npm run sim`.

## What rep unlocks
- **Quests**: new `startRequirements` type `{ type: 'reputation', townId, tier }`. Follow-up questlines per NPC.
- **Shop stock**: a `minReputation` field on `ShopItem`, beside `minRank`. Better gear, recipe scrolls, station gear.
- **Discounts**: small buy-price reduction per tier, and a better sell multiplier.
- **Dialogue**: a new `DialogueCondition` `reputation` (via `/add-dialogue-effect`) for lore branches and NPC reactions.
- **Gear upgrade cap**: town smiths allow higher upgrade levels at higher rep (see `gear-upgrading.md`).

## UI
Rank and progress per town in the quest panel's Reputation tab; tier-up toast. Locked shop items show the needed tier.

## Open
- Separate rep per NPC/faction (Hunter's Lodge, Apothecary) instead of per town? Per town is simpler; start there.
- Does the Exploration Guild rank stay separate? Yes — it's a guild, not a town.

## Touch-points
`player.store.ts` or a new slice (rep per `TownID`), `quests-data.ts` + quest reward/requirement types, `shop.type.ts` (`minReputation`), `shop.store.ts`, dialogue conditions/effects, town view header, i18n, `docs/systems/towns-shops-guild.md`.
