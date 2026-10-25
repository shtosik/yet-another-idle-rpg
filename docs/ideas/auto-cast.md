# Auto-cast

**Scope:** S-M · **Status:** Proposed (owner direction 2026-10-25)

Spells cast themselves when off cooldown and affordable, unlocked one spell slot at a time.

## Rules
- **5 levels**, one per spell slot (the spell bar has 5). Level N auto-casts slot N. A spell sits in at most one slot (`BattleManagerService.equipSpell` refuses a spell already on the bar), so cooldowns and casts can stay keyed by spell id.
- Each level comes from a **different source** (examples: a skill tree node, a quest reward, the Guild store, a zone mastery or bestiary milestone, a rare drop). Exact sources to decide.
- Auto-cast fires the same as a click (`BattleManagerService.castSpell`): only when `canCast` passes, so damage spells need a living enemy and buffs don't recast while active.
- Per-slot toggle so the player can keep a slot manual.
- Online only. Casting offline is a further upgrade on top (`offline-progress.md`).

## Ties
- Replaces the "auto-cast spell on cooldown" line in [automation & loot rules](automation-loot-rules.md).
- [Consumables](consumables-buff-slots.md): auto-drink potions was deferred to come with auto-cast.
- More strike spells ([elemental spells & gear](elemental-spells-gear.md)) make this matter more.

## Touch-points
`battle-manager.service.ts` (cast loop), `battle.store.ts` (equipped spells, toggles), spell bar UI, unlock sources (skill tree, quests, shops), `docs/systems/spells-and-buffs.md`.
