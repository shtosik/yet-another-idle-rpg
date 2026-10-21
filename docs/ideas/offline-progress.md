# Offline progress

**Scope:** M · **Status:** Proposed

On load, simulate elapsed time at a fraction (e.g. 50%) of the current zone's average kill rate, capped (~8 h). Show a "welcome back" modal with an XP / gold / loot summary.

## Why
Biggest gap for an idle game (repo audit 2.8: no wall-clock delta).

## Open questions
- Do consumable buffs and slot cooldowns tick offline? See [consumables](consumables-buff-slots.md).
- Do shinies / pets roll offline?

## Touch-points
Save a `lastSeen` timestamp via `with-game-state-sync.hook.ts`; expected-loot calculator from the zone enemy pool + drop tables; modal via `ModalService`.
