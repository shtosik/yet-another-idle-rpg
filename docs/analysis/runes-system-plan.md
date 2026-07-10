# Runes System — Implementation Plan

## Goal

Magic and buff spells must cost **runes** to cast, on top of their existing mana cost.
Introduce four basic runes — **Fire, Air, Earth, Water**. When the player can't pay a
spell's full cost (runes **and** mana), the spell slot is **greyed out and not castable**.

Melee spells (e.g. `doubleAttack`) do **not** require runes.

## Confirmed decisions

| Question | Decision |
|---|---|
| How runes are stored | **Inventory items** (`ItemType.resource`) — one `ItemID` per rune. Reuses drop / shop / crafting / inventory-display infrastructure. |
| How runes are obtained | **Enemy drops + Shop purchase + Crafting** (all three). |
| Relationship to mana | **Both** — casting requires enough runes **and** enough mana. Mana must finally be *enforced and deducted*, and mana regen must be wired up (neither exists today). |

### Important pre-existing facts this plan relies on

- `BattleManagerService.castSpell()` currently **never checks or deducts mana** — `baseManaCost`
  is shown in the tooltip but is purely cosmetic. This plan makes mana a real resource.
- There is currently **no mana regeneration** anywhere in the game loop, even though
  `stats.manaRegenRate` (30 s) and `stats.currentManaRegenTimer` exist and the player-stats
  panel already renders `mana / maxMana` + the regen timer. This plan adds the regen tick.
- `PlayerStore.removeItemsFromInventory(items: { id, amount }[])` already exists and decrements
  stacks (nulling the slot when it empties). Rune consumption reuses it directly.
- Runes are consumed **on cast** (depleting); "not enough" = the gate that greys the slot.

---

## Data model

### 1. New rune item IDs

`src/enums/ids/item-id.enum.ts` — append (next free values after `shinyPetHarpyMatriarch = 102`):

```ts
// runes
fireRune  = 103,
airRune   = 104,
earthRune = 105,
waterRune = 106,
```

### 2. Rune item definitions

`src/data/items/resources-items.data.ts` — add four `ItemType.resource` entries:

```ts
[ItemID.fireRune]:  { id: ItemID.fireRune,  tier: ItemTier.normal, url: './assets/img/items/fireRune.png',  value: 5, type: ItemType.resource },
[ItemID.airRune]:   { id: ItemID.airRune,   tier: ItemTier.normal, url: './assets/img/items/airRune.png',   value: 5, type: ItemType.resource },
[ItemID.earthRune]: { id: ItemID.earthRune, tier: ItemTier.normal, url: './assets/img/items/earthRune.png', value: 5, type: ItemType.resource },
[ItemID.waterRune]: { id: ItemID.waterRune, tier: ItemTier.normal, url: './assets/img/items/waterRune.png', value: 5, type: ItemType.resource },
```

A single shared `RUNE_ITEM_IDS` constant is useful for iteration (the rune indicator UI,
validation, etc.). Put it next to the data:

```ts
// src/data/items/resources-items.data.ts (or a small src/data/runes.ts)
export const RUNE_ITEM_IDS = [ItemID.fireRune, ItemID.airRune, ItemID.earthRune, ItemID.waterRune] as const
```

### 3. Assets

Add four 1:1 rune icons:

```
src/assets/img/items/fireRune.png
src/assets/img/items/airRune.png
src/assets/img/items/earthRune.png
src/assets/img/items/waterRune.png
```

### 4. i18n names

`src/assets/locales/en/items.json` → `names`:

```json
"fireRune":  "Fire Rune",
"airRune":   "Air Rune",
"earthRune": "Earth Rune",
"waterRune": "Water Rune"
```

---

## Spell cost — interface & data

Runes belong only to magic and buff spells, so the cost lives on those two effect variants
(the discriminated union makes it a compile error to give a melee spell a rune cost).

`src/interfaces/spell.interface.ts`:

```ts
export type RuneCost = { id: ItemID; amount: number };

export type SpellMagicEffectProps = {
    type: SpellType.magic;
    baseDamage: number;
    damageType: DamageElement;
    runeCost: RuneCost[];          // ← new
};

export type SpellSupportStatBuffEffectProps = {
    type: SpellType.buff;
    duration: number;
    stat: PlayerStat;
    amount: number;
    runeCost: RuneCost[];          // ← new
};
```

Add a small accessor so the affordability check and the cast logic don't each repeat the
type-narrowing (melee → no cost):

```ts
export const getSpellRuneCost = (spell: SpellProps): RuneCost[] =>
    spell.effect.type === SpellType.magic || spell.effect.type === SpellType.buff
        ? spell.effect.runeCost
        : [];
```

### Proposed cost mapping (`src/data/spells-data.ts`)

| Spell | Type | Rune cost | Mana (existing) |
|---|---|---|---|
| `fireStrike` | magic / fire | 1 × Fire Rune | 2 |
| `haste` | buff / attackSpeed | 1 × Air Rune | 5 |
| `doubleAttack` | melee | — (none) | 2 |

> Earth and Water runes have no spell that uses them yet — they exist as content for future
> spells. This is intentional; flag if you'd rather only ship runes that are currently spent.

```ts
[SpellID.fireStrike]: {
  ...,
  effect: { type: SpellType.magic, baseDamage: 15, damageType: DamageElement.fire,
            runeCost: [{ id: ItemID.fireRune, amount: 1 }] },
},
[SpellID.haste]: {
  ...,
  effect: { type: SpellType.buff, duration: 60, stat: 'attackSpeed', amount: 0.3,
            runeCost: [{ id: ItemID.airRune, amount: 1 }] },
},
```

---

## Casting flow (`BattleManagerService`)

### Affordability check (single source of truth)

```ts
canAffordSpell(spellId: SpellID): boolean {
  const spellData = SPELLS_DATA[spellId]
  if (this.playerStore.stats().mana < spellData.baseManaCost) return false

  const inventory = this.playerStore.inventory()
  return getSpellRuneCost(spellData).every(cost =>
    (inventory.find(i => i?.id === cost.id)?.amount ?? 0) >= cost.amount)
}
```

### `castSpell` — guard + deduct

```ts
castSpell(spellId: SpellID) {
  const spellData = SPELLS_DATA[spellId]
  if (!this.canAffordSpell(spellId)) return            // safety net (UI also blocks)

  // pay costs
  this.playerStore.updatePlayerStats([{ stat: 'mana', amount: -spellData.baseManaCost }])
  const runeCost = getSpellRuneCost(spellData)
  if (runeCost.length) this.playerStore.removeItemsFromInventory(runeCost)

  // ...existing cooldown + effect switch unchanged...
}
```

`updatePlayerStats` adds the (negative) mana amount via its default branch, so no store change
is needed for deduction. `removeItemsFromInventory` already handles stack decrement/empty.

> Note: because mana is now enforced for *every* spell that has a `baseManaCost`,
> `doubleAttack` (melee, cost 2) will also consume mana. That's consistent with the existing
> data and the "both runes and mana" decision; runes simply don't apply to it.

---

## Mana enforcement & regeneration (new)

Mana deduction is covered above. Regen needs a new tick.

### `PlayerStore` — `regenMana(deltaMs)`

```ts
regenMana(deltaMs: number) {
  patchState(store, (state) => {
    const s = state.stats
    if (s.mana >= s.maxMana) {
      return s.currentManaRegenTimer === 0 ? {} : { stats: { ...s, currentManaRegenTimer: 0 } }
    }
    let timer = s.currentManaRegenTimer + deltaMs
    let mana = s.mana
    while (timer >= s.manaRegenRate && mana < s.maxMana) {
      timer -= s.manaRegenRate
      mana++
    }
    if (mana >= s.maxMana) timer = 0
    return { stats: { ...s, mana, currentManaRegenTimer: timer } }
  })
}
```

### `GameIntervalService.tick()` — drive regen each 100 ms tick

```ts
// inside tick(), every 100ms:
this.playerStore.regenMana(TICK_DURATION_IN_MS)
```

The existing player-stats panel (`playerStats.mana / maxMana` + timer) will reflect this with
no template change. `manaRegenRate` is already in ms (30 000) and is treated as a "lower =
faster" stat by `updatePlayerStats`, so buffs/items that reduce it speed up regen for free.

---

## Greying out the spell slot

`SpellSlotComponent` already centralizes the click (`handleCastSpell`) and cooldown rendering.

### Component (`spell-slot.component.ts`)

```ts
inventory = this.playerStore.inventory     // signal

canAfford = computed(() => this.battleManagerService.canAffordSpell(this.spellId()))
// re-runs when inventory() or stats() change, because canAffordSpell reads both signals
```

`handleCastSpell` gains one guard:

```ts
handleCastSpell(spellId: SpellID, equippedSpell: EquippedSpell) {
  if (equippedSpell.cooldownRemaining > 0 || !this.isInCombat() || !this.canAfford()) return
  this.battleManagerService.castSpell(spellId)
}
```

### Template (`spell-slot.component.html`)

- Add `[class.spell--disabled]="!canAfford()"` to the `.spell` element.
- Add a **rune cost** line to the tooltip, mirroring the existing mana line, e.g. iterate
  `getSpellRuneCost(spellData)` and show each rune icon + amount.

```html
<span class="rune-cost">
  @for (cost of getSpellRuneCost(spellData); track cost.id) {
    <img [src]="ITEM_DATA[cost.id].url | url" alt=""> {{ cost.amount }}
  }
</span>
```

### Style (`spell-slot.component.sass`)

```sass
.spell--disabled
  filter: grayscale(1)
  opacity: 0.45
  cursor: not-allowed
```

### i18n (`spells.json`)

```json
"runeCost": "Runes:"
```

---

## (Optional but recommended) Rune indicator near the spellbar

So "greyed out because I'm out of Fire Runes" is legible, show the four rune counts above the
spell bar. `BattleFooterComponent` already renders the spell bar; add a small strip that reads
counts from `playerStore.inventory()` over `RUNE_ITEM_IDS`:

```ts
runeCounts = computed(() => {
  const inv = this.playerStore.inventory()
  return RUNE_ITEM_IDS.map(id => ({ id, amount: inv.find(i => i?.id === id)?.amount ?? 0 }))
})
```

Render icon + count per rune in `battle-footer.component.html`, styled in its `.sass`.

---

## Acquisition wiring

### A. Enemy drops (`src/data/enemies-data.ts`)

Add rune entries to existing enemies' `drops[]` (`EnemyDrop`: `{ id, minAmount, maxAmount, chance }`,
where `chance` is a 1-in-N roll). Suggested thematic mapping (tune freely):

| Rune | Example sources |
|---|---|
| Fire | fire/aggressive enemies (e.g. bandits, gnolls) |
| Air | flying enemies (seagull, harpy, giant eagle) |
| Water | aquatic/slime enemies (slimes, crab, turtle) |
| Earth | earthy/plant enemies (treants, bears, skeletons) |

Example entry: `{ id: ItemID.waterRune, minAmount: 1, maxAmount: 2, chance: 4 }` (≈25% per kill).

> Decision needed: exact enemy→rune assignments and drop rates. Listed as a tuning task, not a blocker.

### B. Shop (`src/data/shops-data.ts`)

Simplest path: add the four runes to the existing `laHarparShop.items`:

```ts
{ itemId: ItemID.fireRune,  tier: ItemTier.normal, price: 20, maxStock: 99, refreshable: true },
{ itemId: ItemID.airRune,   tier: ItemTier.normal, price: 20, maxStock: 99, refreshable: true },
{ itemId: ItemID.earthRune, tier: ItemTier.normal, price: 20, maxStock: 99, refreshable: true },
{ itemId: ItemID.waterRune, tier: ItemTier.normal, price: 20, maxStock: 99, refreshable: true },
```

> Alternative: a dedicated "Rune Vendor" shop (new `ShopID` + NPC). More work; only if you want
> runes gated behind a specific town/NPC. Default plan reuses the existing shop.

### C. Crafting (`src/data/recipes-data.ts` + `src/enums/ids/recipe-id.enum.ts`)

Add `RecipeID` entries and recipes. The open question is *crafted from what*. Proposed
placeholder (a cheap common resource → rune), to be confirmed:

```ts
// recipe-id.enum.ts
fireRune  = 7,
airRune   = 8,
earthRune = 9,
waterRune = 10,

// recipes-data.ts (example — input resource TBD)
[RecipeID.airRune]: { id: RecipeID.airRune, itemId: ItemID.airRune,
  unlockRequirement: null, itemsNeeded: [{ id: ItemID.feather, amount: 5 }], createsAmount: 1 },
```

> Decision needed: the resource(s) each rune is crafted from and the ratios.

---

## Files touched

**New**
- `src/assets/img/items/{fire,air,earth,water}Rune.png` (art)

**Modified — core mechanic**
- `src/enums/ids/item-id.enum.ts` — 4 rune IDs
- `src/data/items/resources-items.data.ts` — 4 rune defs + `RUNE_ITEM_IDS`
- `src/assets/locales/en/items.json` — rune names
- `src/interfaces/spell.interface.ts` — `RuneCost`, `runeCost` on magic+buff effects, `getSpellRuneCost`
- `src/data/spells-data.ts` — rune costs on `fireStrike`, `haste`
- `src/app/services/battle-manager.service.ts` — `canAffordSpell`, cost deduction in `castSpell`
- `src/app/store/player/player.store.ts` — `regenMana`
- `src/app/services/game-interval.service.ts` — call `regenMana` per tick
- `src/app/components/game/battle/battle-footer/spell-slot/spell-slot.component.{ts,html,sass}` — `canAfford`, disabled state, tooltip rune line
- `src/assets/locales/en/spells.json` — `runeCost` label

**Modified — acquisition**
- `src/data/enemies-data.ts` — rune drops
- `src/data/shops-data.ts` — rune shop stock
- `src/data/recipes-data.ts`, `src/enums/ids/recipe-id.enum.ts` — rune recipes

**Optional — UX**
- `battle-footer.component.{ts,html,sass}` — rune count indicator strip

---

## Suggested implementation order

1. **Runes as items**: IDs → data → assets → i18n. (Runes now exist, droppable/buyable/craftable plumbing-ready.)
2. **Spell cost data**: `RuneCost` + `getSpellRuneCost` + `spells-data` costs.
3. **Mana lifecycle**: `regenMana` + game-loop call (mana now regenerates & is enforced).
4. **Cast gate**: `canAffordSpell` + `castSpell` deduction.
5. **UI**: spell-slot disabled state + tooltip; (optional) rune indicator strip.
6. **Acquisition**: shop stock → enemy drops → crafting recipes.
7. Manual verification (see below).

---

## Edge cases & notes

- **`removeItemsFromInventory` matches by `id` only** (ignores tier). Runes are single-tier
  (`normal`), so this is fine.
- **Re-cast guard on buffs** is unchanged: `haste` still no-ops if already active — but make
  sure costs are only paid when the cast actually proceeds. (In the proposed `castSpell`, the
  cost is deducted before the effect switch; if you want "no charge when buff already active",
  move the `alreadyActive` check above the deduction. **Recommended: don't charge a no-op
  re-cast** — decision flagged.)
- **OnPush reactivity**: `canAfford` is a `computed` over `inventory()` + `stats()` signals, so
  the slot greys/ungreys automatically as runes/mana change. Cooldown reactivity is already
  handled by the parent re-passing `equippedSpell`.
- **Balance**: starting `maxMana` is 5 and `haste` costs 5 mana — it needs full mana to cast.
  Confirm that's intended once runes are layered on, or bump `maxMana`/lower the cost.

## Open questions (tuning, not blockers)

1. Should we ship Earth/Water runes now even though no current spell uses them? (Plan: yes.)
2. Exact enemy→rune drop assignments and rates.
3. Crafting inputs/ratios per rune.
4. Charge cost on a no-op buff re-cast? (Plan recommends **no**.)
5. Dedicated rune vendor vs. selling runes in the existing `laHarparShop`? (Plan: existing shop.)
