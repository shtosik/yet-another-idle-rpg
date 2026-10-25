# Automation & loot rules

**Scope:** S · **Status:** Proposed

Toggles: auto-advance zone/wave, auto-sell below rarity X (needs [selling](gold-drops-and-selling.md)), auto-cast spell on cooldown (now its own idea: [auto-cast](auto-cast.md), one level per spell slot). Each unlockable via skill tree or the unlock system — same family as auto-eat in [consumables](consumables-buff-slots.md).

## Touch-points
`battle.store.ts`, inventory logic, game-menu settings UI, `unlock-conditions.ts`.
