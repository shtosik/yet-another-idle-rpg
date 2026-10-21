# Crafting recipes (gear)

**Scope:** M · **Status:** Proposed

> Every recipe needs a `stationId` + `stationLevel`. See [Camp & crafting stations](crafting-stations.md).

New gear recipes that give every dead-end loot item a use. **No runes** in any recipe. Stats are placeholders calibrated against existing gear (early items +1 AP; rare Mawood gear AP 4 + one 0.25–0.3 modifier).

Dead-end items covered: ratTail, apple, fishMeat, cheese, deerPelt, gnollTrophy, elderSilk, spiderFang, boneFragment, eagleTalon, matriarchPlume.

## Early — La Harpar zones (no scroll)
| Item | Slot | Ingredients | Stats |
|---|---|---|---|
| Ratcatcher's Band | ring | ratTail ×8, cheese ×4, stick ×5 | AP 1, crit 2, gold 0.1 |
| Fisher's Charm | amulet | fishMeat ×6, crabMeat ×6, feather ×4 | xp 0.15, gold 0.1 |
| Slimeguard Belt | belt | slimeResidue ×10, stick ×5, deerPelt ×2 | AP 1, inventorySlots 2 |
| Hunter's Cap | helmet | deerPelt ×4, apple ×6, feather ×6 | AP 1, crit 2, small shinyChance |
| Stone Club | weapon | stone ×15, stick ×10 (+ makeshiftClub, see flag A) | AP 3 |
| stoneArrow (existing) | cape | stone, stick, feather | repeatable source for the cape slot |

Mountain Pass only drops vialOfWater, deerPelt, stick, stone — it can't host its own tier yet.

## Mawood (scroll-gated: drops from Mawood enemies / magic shop)
| Item | Slot | Ingredients | Stats |
|---|---|---|---|
| Wolfhide Gloves | gloves | wolfFangs ×6, deerPelt ×6, bearPelt ×1 | AP 2, attackSpeed 0.1 |
| Bearhide Legs | legs | bearPelt ×5, deerPelt ×5, boneFragment ×10 | AP 3, damageVsMammal 0.15 |
| Gnoll Warbelt | belt | gnollTrophy ×3, boneFragment ×8, wolfFangs ×4 | AP 3, critMulti 0.2, damageVsHumanoid 0.15 |
| Fang Dagger | weapon | spiderFang ×8, wolfFangs ×6 (+ knife, flag A) | AP 5, crit 6, attackSpeed 0.1 |
| Silk Bandolier | cape | spiderSilk ×12, elderSilk ×2, boneFragment ×6 | maxMana 10, spellCooldownReduction 0.05 |
| Eagle-Eye Ring | ring | eagleTalon ×6, harpyFeather ×8, spiderFang ×4 | AP 2, crit 5, critMulti 0.25 |
| Elderwood Boots | boots | ancientWood ×8, deerPelt ×6, elderSilk ×2 | AP 3, xp 0.2 |
| Ancientwood Staff | weapon | ancientWood ×10, elderSilk ×4, vialOfWater ×3 (+ magicStaff, flag A) | magicDamage 8, magicDamageMultiplier 0.25 |
| Gnoll Chieftain Collar | amulet | gnollTrophy ×8, spiderFang ×6, boneFragment ×15 | AP 4, gold 0.4, shinyChance |
| Matriarch's Mantle | cape | matriarchPlume ×1, harpyFeather ×10, elderSilk ×5, bearPelt ×3 | AP 3, maxMana 25, xp 0.15 |

## Upgrade chain — turtle set
Reinforced Turtle pieces: old piece + 10–20 turtleShell + bearPelt/deerPelt → ~AP 3 + one modifier each. Needs flag A, or make it a parallel set.

## Endgame
- Heartwood / Silverwood upgrade: ancientWood ×20, matriarchPlume ×2 (+ heartwoodAmulet or silverwoodChestplate) → AP 7, stronger modifier.
- Apex Hunter's Ring: eagleTalon ×15, wolfFangs ×20, bearPelt ×8, spiderFang ×15 → AP 4, crit 8, damageVsMammal 0.3, attackSpeed 0.2. Scroll from a boss.
- Boneforged Chest: boneFragment ×40, bearPelt ×10, turtleShell ×30 → AP 6, inventorySlots 3. Large common-drop sink.

## Flags
- **A — equipment as ingredient.** `itemsNeeded` accepts any ItemID, but an equipped copy must not count/be consumed. Ship the non-chain recipes first.
- **Gold stats are inert** until [gold drops](gold-drops-and-selling.md) applies `goldCoinsMultiplier`.
- **manaRegenRate** is stored as ms per point; confirm how `updatePlayerStats` handles positive gear amounts before putting it on items.
- Crafting must be blocked when there's no inventory space for the result (owner decision, repo audit).
- Each item needs ItemID, RecipeID, i18n, icon; scroll-gated ones need a recipe-scroll item and a drop/shop source.
