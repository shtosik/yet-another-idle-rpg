# Arena kills stay outside Kill resolution

Kill resolution (`KillResolutionService.resolveKills`) pays zone kills: XP and gold with wave scaling, drops, kill counts, task progress, zone progress and the next-zone unlock, the same online and in an offline claim. Arena kills (`ArenaService.onKill`) pay only XP and gold, from the enemy's base values times the player's multipliers: no wave scaling, no drops, no tasks, no zone progress. The arena's rewards come from its clear chest instead.

We keep arena kills out of Kill resolution. Folding them in would need an "arena mode" flag that switches off most of what `resolveKills` does, widening its interface for one caller and making every zone rule ask "unless arena?".

## Consequences

- `ArenaService.onKill` keeps its own few lines of XP and gold math. A change to how zone kills pay XP or gold does not reach the arena unless made there too.
- Kill resolution's interface stays one call with no mode.

## Revisit

When a second kind of kill appears that shares some but not all of the zone rules, look again at a shared core with two thin callers.
