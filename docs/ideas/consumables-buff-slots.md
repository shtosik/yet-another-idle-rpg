# Consumables & buff slots

**Scope:** M · **Status:** v1 implemented on `feat/consumables` (food + potion slots, 6 foods, Minor Mana Potion, auto-eat node, batch crafting)

> **Follow-up:** recipes move into Camp stations (Cooking, Alchemy). Potions/elixirs unlock in Mawood. See [Camp & crafting stations](crafting-stations.md).

v1 recipe sources: Grilled Fish, Baked Apple, Minor Mana Potion known from the start; Crab Stew scroll (Gangster Crab 1/10), Cheese Platter scroll (Giant Rat 1/10), Hunter's Feast scroll (Bandit 1/15), Fish & Apple Pie scroll (La Harpar shop, 300g, once), Venison Roast scroll (Goat 1/12; venison ×3 + apple ×1 at Cooking 2, critMulti +0.2; venison drops from Deer and Goat 1/3). Auto-eat = skill node "Hearty Appetite" (after Bookworm), re-eats the last food. Icons are placeholders.

Craftable food, potions and elixirs that apply timed stat buffs through **buff slots**. Gives crafting a recurring output instead of one-time gear.

## Constraints from the codebase
- The player has no HP and enemies don't attack — no healing food. Effects are stat buffs, mana restores, XP / gold / shiny boosters.
- `ItemType.food` / `ItemType.potion` and `FoodItem` / `PotionItem` exist but nothing uses them; `PlayerStore.useItem` only handles recipe scrolls and `rewardsStats`.
- Spell buffs (`ActiveBuff = { spellId, secondsRemaining }`) are keyed by SpellID and expire via `SPELLS_DATA` lookup — not directly reusable.
- Attack speed: positive amounts make you faster (`updatePlayerStats` subtracts). Same convention for consumables.

## Decisions (owner, 2026-10-20)

### Cooldown & duration
- Each consumable has its **own `duration` and `cooldown`**.
- Using an item **locks its slot for that item's cooldown**. No other item of that slot can be used until the lock ends — swapping items can't stack effects.
- **Duration ≤ cooldown, always.** Enforce in data and clamp at runtime after modifiers. The gap (cooldown − duration) is intentional; it closes as the player stacks cooldown reduction / duration bonuses, but the buff can never outlast the lock.
- When the lock ends the player re-uses manually, or auto-eat does it.

### Modifiers (skill tree first, other sources later)
- **Consumable cooldown reduction** — applies to the item's cooldown (there is no separate slot cooldown).
- **Buff duration bonus** — extends duration, still clamped to the (reduced) cooldown.
- **Chance to not consume** — starts low (~1% per rank).
- Implement as new `PlayerStat`s so gear / pets / elixirs can grant them later.

### Automation
- **Auto-eat** unlocked from the skill tree.
- **Auto-drink** (potions/elixirs) deferred — revisit together with spell auto-casting.

### Slots
| Slot | Items | Notes |
|---|---|---|
| Food | stat foods | 1 slot at start |
| Elixir | rarer, stronger boosters | |
| Potion | instant / short effects (mana) | |

- **Extra food slots** — yes, but hard to get; tie to a later quest (not a cheap skill node).

### Content
- **Better versions** of the same consumable (e.g. Grilled Fish → Seasoned Grilled Fish) with extra ingredients — depth without many new items.
- **Recipe sources:** wherever it fits the mechanics — quest rewards, one-time shop items, monster drops (recipe scrolls via the existing `RecipeItem` / `unlockedRecipes`).
- **Batch crafting** — see [batch crafting](batch-crafting.md).

### Other
- **No offline ticking.** Buff timers and slot locks only advance while the game runs (nothing progresses offline today). Revisit with [offline progress](offline-progress.md).
- **No "Well Fed" combo bonus.**
- Inventory full: crafting must be blocked when there's no space for the result (owner decision, see `docs/systems/player-stats-inventory-equipment.md`) — applies here.
- Skill-tree respec refunding auto-eat: disable cleanly, keep the selected item.

## First version scope
Food + potion slots, ~6 foods, Minor Mana Potion, auto-eat skill node, [batch crafting](batch-crafting.md). Later: elixir slot, cooldown/duration/save-chance nodes, better versions, extra food slots.

## Data shape (sketch)
```ts
interface ConsumableEffect {
  slot: 'food' | 'elixir' | 'potion'
  cooldownSec: number
  durationSec?: number            // omitted = instant; must be <= cooldownSec
  stats?: { stat: PlayerStat; amount: number }[]
  manaRestore?: number
}
// FoodItem / PotionItem gain `effect: ConsumableEffect`
```

Runtime state in `BattleStore`:
```ts
consumableSlots: Record<ConsumableSlot, {
  itemId: ItemID
  lockRemaining: number           // seconds until the slot can be used again
  buffRemaining: number           // seconds of active buff (0 = expired)
  stats: { stat: PlayerStat; amount: number }[]   // snapshot, reverted on expiry
} | null>
autoEat: Partial<Record<ConsumableSlot, ItemID>>
```

## Implementation notes
- `BattleManagerService.useConsumable(item)` (same layer as `castSpell`; PlayerStore can't inject BattleStore without a cycle): slot unlocked → apply stats via `updatePlayerStats` → snapshot → set lock + buff timers → remove 1 item (unless the no-consume roll hits).
- Tick on the existing 1 s tick next to `tickSpells`: decrement buff → revert snapshot at 0; decrement lock → when 0 and auto-eat is set and the item is in inventory, consume it.
- Persisted via `withGameStateSync`.
- UI: slot icons with buff + lock countdown in the battle footer next to active spells.

## Example consumables (no runes; vialOfWater as potion base)
| Item | Slot | Ingredients | Effect | Duration / Cooldown |
|---|---|---|---|---|
| Baked Apple | food | apple ×2, cheese ×1 | xp +5% | 10 / 15 min |
| Grilled Fish | food | fishMeat ×2 | AP +4 | 10 / 15 min |
| Seasoned Grilled Fish | food | fishMeat ×3, apple ×1, stone ×1 | AP +8 | 12 / 15 min |
| Crab Stew | food | crabMeat ×2, vialOfWater ×1 | gold +10% | 10 / 15 min |
| Cheese Platter | food | cheese ×3, apple ×1 | crit +3 | 10 / 15 min |
| Fish & Apple Pie | food | fishMeat ×2, apple ×2, cheese ×1 | attackSpeed +0.05 | 10 / 15 min |
| Hunter's Feast | food | crabMeat ×3, fishMeat ×3, cheese ×2 | AP +8, xp +5% | 15 / 20 min |
| Minor Mana Potion | potion | vialOfWater ×1, apple ×1 | +30 mana | instant / 2 min |
| Spider Venom Draught | potion | vialOfWater ×1, spiderFang ×2 | magicDamage +10 | 5 / 10 min |
| Harpy Swiftness Tonic | potion | vialOfWater ×1, harpyFeather ×2 | spellCooldownReduction | 5 / 10 min |
| Elixir of Fortune | elixir | vialOfWater ×2, slimeResidue ×3, eagleTalon ×1 | shinyChance | 30 / 45 min |
| Elixir of Ghostly Focus | elixir | vialOfWater ×2, boneFragment ×3, elderSilk ×1 | crit +3, critMulti +0.25 | 45 / 60 min |
| Matriarch's Elixir | elixir | vialOfWater ×2, matriarchPlume ×1, elderSilk ×2 | increasedSpellDuration, maxMana +20 | 60 / 90 min |

Numbers are placeholders.

## Touch-points
- `item.interface.ts` — `effect: ConsumableEffect` on FoodItem / PotionItem.
- `player-stat.type.ts` — `consumableCooldownReduction`, `consumableDuration`, `consumableSaveChance`.
- New `src/data/items/consumables-items.data.ts`, ItemIDs, RecipeIDs, i18n, icons.
- `battle.store.ts` — slot state, auto-eat selection, tick.
- `battle-manager.service.ts` — `useConsumable`, expiry, auto-eat.
- `inventory.component.ts` — route food/potion "use" to `useConsumable`.
- `skill-tree-data.ts` — auto-eat, cooldown reduction, duration, save-chance nodes.
- Battle footer — slot display.
