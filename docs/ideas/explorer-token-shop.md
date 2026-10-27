# Explorer Token shop & guild ranks

**Scope:** S-M · **Status:** Done 2026-10-22 (`feat/gold-selling`); Ambush done 2026-10-26 (`feat/spell-scrolls`); the extra consumable slot is still open

Spend `explorerTokens` at the Exploration Guild. Completing tasks raises a Guild rank that widens the task pool and opens shop tiers.

## Why
`explorerTokens` and `totalTasksCompleted` are only incremented and never read. Marvin promises new territory every 5 completions (repo audit 3.4).

## Decisions
**Guild rank** = `floor(totalTasksCompleted / 5)`, no cap. Each rank:
- adds the next zone (progression order) to the task pool. The pool is the regular enemies of zones that are both unlocked and within rank — this is Marvin's "new territory". Rank 0 = Horseshoe Beach.
- opens the next token shop tier.

**Task targets** stay a uniform random pick across the pool. Old zones staying in the pool is intended: they keep being useful, and their tasks finish faster. (Weighting toward the newest zone was considered and dropped for now.)

**Token reward** = length reward (short 1, medium 2, long 3) × the zone tier of the task's target zone — the zone the player fights in to finish the task, not how many zones are unlocked. Zone tier (`Zone.tier`) follows progression order: Horseshoe Beach and the Trader's Basement 1, Plains 2, The Long Path 3, Mountain Pass 4, Elderwood Wilds 5, Deepwood 6, Upper Canopy 7. A side zone takes the tier of where it sits in the quest line, not its town's: Deepwood and Upper Canopy come after Elderwood Wilds. Shop prices scale with tier so new upgrades stay something to work towards.

**Shop tiers**
- Rank 0 — basics: consumables, skill point books, recipe scrolls.
- Rank 1+ — spell scrolls (e.g. Ambush), more recipes, extra inventory slots.
- Rank 2+ — combat-changers, bought once:
  - **Second contract** — `maxTaskSlots` becomes a stat (+1).
  - **Bounty Mark** — 10% chance a kill counts twice toward a task (could level 10/20/30%).
  - **Extra consumable slot.**
  - **Ambush** (spell scroll, rank 1, 25 tokens) — owner direction 2026-10-26: the next 5 melee hits, melee spells included, are guaranteed crits; 2 mana, 30 s cooldown.

**Dropped:** Quick Recovery (shorter respawn) — duplicates the Overkill node (`overkill-spell-mastery.md`). Revisit only as a cooldown spell.

## Open
- Exact tier contents and prices — tune with the economy simulation (`progression-pacing.md`). Shipped contents: `docs/systems/towns-shops-guild.md`.
- **Extra consumable slot** needs a third consumable slot in the battle UI. Not built yet.

## Touch-points
`player.store.ts` (`spendTokens`, `maxTaskSlots` stat), `shops-data.ts` (token currency), `exploration-guild.service.ts` (rank-gated pool, tier multiplier), Marvin's dialogue, `spells-data.ts` (Ambush).
