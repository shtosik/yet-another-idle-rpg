# Town reputation: Exalted town pets

**Scope:** S-M · **Status:** Proposed (draft by `lore-keeper`, 2026-11-01) · Step 4 of [Town reputation](town-reputation.md); steps 1–3 are in [tier rewards and titles](town-reputation-tier-rewards.md).

At **Exalted**, one NPC per town gives the town's pet, once, in dialogue. Each is an ordinary pet item (`EquipmentSlot.pet`, the single pet slot) with a utility stat no enemy pet has, so the player weighs it against a damage pet. Every ID below exists in `src/` unless it is listed under [New content](#new-content). Amounts are first guesses; tune them with `npm run sim`.

## Lore already in the game

| Fact | Source |
|---|---|
| The Bartender runs the tavern's kitchen and cooking is her trade: "You cook, I charm." She insults her idle patrons as "lazy rats". | `laHarparBartender.json` `questLastOrders`, `anyWorkForMe1` |
| She never gives anything away without a grumble ("Don't get used to it. ...Fine. Get a little used to it."). | `laHarparBartender.json` `onTheHouse` |
| Corwin is Mawood's elder. A failed ritual to become a Spire's "voice, its guardian" fused silverwood bark into him: "The Spire is patient. So am I." | `mawoodCorwin.json` `intro1`, `intro2` |
| The Spires "think... in slow pulses you feel in the soles of your feet". | `mawoodCorwin.json` `aboutForest` |
| At Revered he reports "one silver shoot in the outer Wilds", the first in two years; the forest takes "years, perhaps decades". | `mawoodCorwin.json` `reveredFirstShoot`, `postQuestLore` |
| "The deep roots carry it up": Mawood's magic is earthbound. | `mawoodElarion.json` `aboutMagic` |
| The Elder's Tree is lit by bioluminescent moss and fungi, a cool pale-green glow; Corwin's bark glows faintly where it meets skin. | `docs/character/mawood/corwin.md` (Avatar concept, Setting) |
| No animal companion exists in either town's text today. | grep of `src/assets/locales/en/` |

## The pets

| Town | Giver | Animal | Item key | Display name (`items.json`) | Stat |
|---|---|---|---|---|---|
| La Harpar | Bartender (`laHarparBartender`) | Tavern cat | `petLaHarparCat` | Pet Tavern Cat | `foodEffectMultiplier` +0.5 (food stats ×1.5) |
| Mawood | Corwin (`mawoodCorwin`) | Rootglow moth | `petMawoodMoth` | Pet Rootglow Moth | `increasedSpellDuration` +10 (seconds) |

Display names follow the existing "Pet <name>" pattern (`items.json`: "Pet Brute", "Pet Green Slime").

**Why these givers.**
- **The Bartender** is La Harpar's kitchen (*Meat Shortage*, *Last Orders*), so a pet that makes food go further belongs to her. A kitchen cat fits a tavern, and her handing it over with a complaint is the most she has ever given away.
- **Corwin** speaks for the town (owner decision): "Keeper of Mawood" is Mawood's thanks, and the elder gives it. The moth still fits him: it lives on the pale-green glow of the Elder's Tree and of the Spire bark in him, and a creature of that slow, patient magic making spells last longer suits a man who calls himself patient. The hook follows his Revered close (`default.recovery` → `reveredFirstShoot`).

**Icon briefs** (`/generate-2d-asset`, `enemy-pixel` family like other pet icons; target `src/assets/img/items/<item key>.png`, see For the main thread):
- `laHarparCat`: a scruffy ginger tabby cat sitting upright, one torn ear, white chest, smug half-closed eyes, a fish bone in its mouth.
- `mawoodMoth`: a large pale moth with soft silver-white wings veined with glowing pale-green lines like silverwood bark, fluffy white body, feathery antennae.

## Stats

### La Harpar: `foodEffectMultiplier` (new stat)

- **Key:** `foodEffectMultiplier`, a `PlayerStat`. **Units:** multiplier, base 1 (`statsInitialState`), added to like `xpMultiplier` and `goldCoinsMultiplier`: the pet's +0.5 makes it 1.5. List it in `multiplierStats` so the stats panel shows it like the other multipliers.
- **What it scales:** each amount in `effect.stats` of the consumable in the **food** slot (`consumableModifiers`, `stats.ts`). Potions and mana restores are not food and are not scaled. The multiplier comes from equipment only (no food gives it), so read it from the non-consumable modifiers first; no circularity.
- **Amount: +0.5.** Today's food, ×1.5: Grilled Fish +2 → +3 attack power, Baked Apple +10% → +15% XP, Crab Stew +10% → +15% gold, Cheese Platter +3 → +4.5 crit chance, Venison Roast +0.2 → +0.3 crit multi, Fish & Apple Pie 0.1 → 0.15 attack speed (`consumables-items.data.ts`). Every enemy pet gives +0.2 damage against one family, the Arena pets +0.1 to melee or magic damage (`pet-items.data.ts`). Half again of one food's effect is smaller than either when the player fights that family, and better everywhere else, and only while food is running (auto-eat keeps it running). +0.25 would round to nothing on Grilled Fish (+0.5 attack power).

### Mawood: `increasedSpellDuration` (existing stat)

- **Key:** `increasedSpellDuration`, existing, base 0. **Units:** flat seconds added to a **buff** spell's duration (`battle-manager.service.ts`: `duration + increasedSpellDuration`). Nothing gives it today; the stats panel already lists it (`stat-rows.ts`, format `seconds`).
- **Amount: +10 s.** Buff spells today: Haste 60 s on a 300 s cooldown → 70 s (uptime 20% → 23%); War Cry 15 s on 60 s → 25 s (25% → 42%) (`spells-data.ts`). The most cooldown reduction a player can stack is 18 s (skill tree 10, two items 5 and 3), so War Cry's cooldown floors at 42 s: +10 gives 60% uptime, and permanent War Cry would need +27. Thunderstorm is damage over time and is not extended (see **Owner calls**).

### Item data

Same shape as the Arena pets (`ARENA_PETS`, no shiny): `tier: ItemTier.legendary` (the top reward; enemy pets are rare, shiny pets legendary), `type: ItemType.equipment`, `slot: EquipmentSlot.pet`, one stat each, `value: 0` (unsellable: a one-time gift can't be sold by accident). `buildPetItem` hard-codes rare and 500, so build these two items directly.

## Giving it once, and inventory space

- **Once: a dialogue flag**, `bartender_gave_pet` and `corwin_gave_pet` (named like `bartender_paid_for_*`, `josh_paid_beer`). Set by the same option that gives the pet. Not an item check: `itemCount` counts the inventory only (`player.store.ts` → `countItem`), so an equipped pet reads as 0 and an item check would hand out a second one.
- **Full inventory:** the gift is an `item` `give` effect, so `DialogueManagerService.missingSlots` already counts it and `canApplyResult` disables the option with the "[free N slots]" tag (`dialogue.component.html`) if it can't fit. In practice it always fits: the Pets tab has one slot per pet item ID (`PET_SPECIES`, `inventory.ts`) and never fills, and adding the two items grows it by two. The flag is set in the same result, so a blocked option sets nothing.
- **Hidden until Exalted:** the option's only result has `{ type: 'reputation', townId, tier: ReputationTier.exalted, hidden: true }` and `{ type: 'flag', name, isSet: false, hidden: true }`. With no matching result the option is hidden (`dialogue.md`), so it disappears after the gift.

## Dialogue scripts

### La Harpar: Bartender (`laHarparBartender.json`)

New `default` option `default.tavernCat` **(new)**, after `default.onTheHouse` (the turn-in options below it are already hidden at Exalted): "Your cat hasn't taken its eyes off me." **Shown when:** La Harpar Exalted and flag `bartender_gave_pet` not set (both hidden) → tavernCat.

#### tavernCat (new)
> That's the kitchen cat. Useless against the two-legged rats I serve, but it sniffs out the best bite of every dish, and lately it only sniffs after you. Take it, before it eats my profits.

1. "Come here, puss." → tavernCatGiven · effect: give 1 `petLaHarparCat`, set flag `bartender_gave_pet`
2. "Maybe another time." → default

#### tavernCatGiven (new)
> Scraps, not my good fish. And don't come crying when it sleeps on your face.

1. "Cheers." → default

### Mawood: Corwin (`mawoodCorwin.json`)

New `default` option `default.rootglowMoth` **(new)**, after `default.recovery` and before `default.goodbye` (`mawoodCorwin.ts`): "There's a moth on your shoulder, Elder." **Shown when:** Mawood Exalted and flag `corwin_gave_pet` not set (both hidden) → rootglowMoth. No quest gate: the text doesn't mention the Treant or the forest's recovery, so it holds whether or not *The Blighted Heart* is done.

#### rootglowMoth (new)
> A rootglow moth. They feed on the light where Spire bark meets living things, and a spell cast near one is slow to fade. This one has been waiting for you, and I would not argue with it.

1. "I'll keep it close." → rootglowMothGiven · effect: give 1 `petMawoodMoth`, set flag `corwin_gave_pet`
2. "Not yet, Elder." → default

#### rootglowMothGiven (new)
> Mawood keeps its friends, traveler. Now a little of it goes with you. Keep it away from Elarion's shop; he sets things on fire.

1. "Thank you, Elder." → default

Both lines say what the stat does in the world (the best bite of every dish; spells that linger) without numbers; the item tooltip shows the stat.

## New content

| Kind | ID | Description |
|---|---|---|
| Item (pet) | `petLaHarparCat` | Pet Tavern Cat. Legendary, value -1 (unsellable), `foodEffectMultiplier` +0.5. Next free `ItemID` (179). |
| Item (pet) | `petMawoodMoth` | Pet Rootglow Moth. Legendary, value -1 (unsellable), `increasedSpellDuration` +10. `ItemID` 180. |
| Stat | `foodEffectMultiplier` | Multiplier on the stats of the food in the food slot; base 1. |
| Flags | `bartender_gave_pet`, `corwin_gave_pet` | Set when the pet is given. |
| Dialogue nodes | `tavernCat`, `tavernCatGiven`; `rootglowMoth`, `rootglowMothGiven` | Plus one `default` option each, in the existing namespaces. |
| Icons | `items/petLaHarparCat.png`, `items/petMawoodMoth.png` | Briefs above. |

No new NPC, quest, enemy, zone, effect or condition: `item` give, `flag` and `reputation` exist.

## For the main thread

- Pets: add both to `pet-items.data.ts` beside `ARENA_PETS` (no enemy, no shiny). `buildPetItem` builds the icon path from `assets/img/enemies/`; either give town pets their own `url` under `assets/img/pets/` or put the icons in `enemies/`, your call.
- New stat `foodEffectMultiplier`: `player-stat.type.ts`, `statsInitialState` (1), `multiplierStats`, `consumableModifiers` (food slot only), stats panel row and `playerStats` i18n key; update `player-stats-inventory-equipment.md` and `consumables-camp-crafting.md`.
- Dialogue: `/add-npc-dialogue` (expanding the Bartender and Corwin); docs `dialogue.md`, `enemies-shiny-pets-bestiary.md` (pets not from enemies), `towns-shops-guild.md` (Exalted rewards).
- Icons: `/generate-2d-asset` with the briefs above. Changelog: `[feature]`.

## Owner calls

1. **`increasedSpellDuration` covers buffs only.** Thunderstorm (damage over time) keeps its 10 s. Extending it too (more hits) would make the moth a damage pet for spell builds.
2. **Destroying a town pet** (`inventory-tabs.md`) loses it for good, like selling would have. A re-gift needs an "is equipped" dialogue condition, which doesn't exist; not planned.

### Settled (owner, 2026-11-01)

- **Not sellable:** `value: -1` for both (the unsellable convention), an exception to "pets sell" (`player-stats-inventory-equipment.md`), since a town pet can't be duplicated or regained.
- **Mawood's giver is Corwin**, not Elarion. The rootglow moth stays.
- **Tier legendary** for both pets.
- **Stats as drafted:** `foodEffectMultiplier` +0.5, `increasedSpellDuration` +10 s. The sim still checks the best food at ×1.5, including Hunter's Feast once cooking level 3 exists.
