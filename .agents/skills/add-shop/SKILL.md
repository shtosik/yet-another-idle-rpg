---
name: add-shop
description: Use when adding a shop — a shopkeeper NPC's stock, prices and refresh rules, opened from dialogue — or changing an existing shop's stock. Triggers on "add a new shop", "give the blacksmith a shop", "create shop items for X", "add purchasable items to NPC".
---

# Add a shop

Background: `docs/systems/towns-shops-guild.md` (static vs runtime stock, refresh, buy checks).

## Steps

1. **ShopID** — append the next value to `src/enums/ids/shop-id.enum.ts:ShopID`.

2. **Stock** — add an entry to `src/data/shops-data.ts:SHOPS_DATA`:
   ```ts
   [ShopID.mawoodBlacksmith]: {
     id: ShopID.mawoodBlacksmith,
     nameKey: 'shop:names.mawoodBlacksmith',
     items: [
       { itemId: ItemID.knife, tier: ItemTier.uncommon, price: 150, maxStock: 1,  refreshable: true },
       { itemId: ItemID.stone, tier: ItemTier.normal,   price: 5,   maxStock: 99, refreshable: true },
     ],
   },
   ```
   - `price` is in the shop's `currency`: optional, gold by default, `explorerTokens` for a token shop (`ShopCurrency` in `src/types/shop/shop.type.ts`). It is independent of the item's `value`.
   - `refreshable: true` restocks to `maxStock` every `shopRefreshCooldown` (1 hour base); `false` sells out for good (uniques, station gear, recipe scrolls).
   - Station gear installs on purchase and is blocked until the previous station level is installed.
   - Reordering or inserting items re-syncs saved stock by item id on the next visit.

3. **Open it from dialogue** — in the shopkeeper's dialogue file, add an option with one `results` entry `{ next: <Name>Dialogue.default, effects: [{ type: 'shop', shopId: ShopID.mawoodBlacksmith }] }`, as in `src/data/dialogues/mawoodTown/mawoodElarion.ts` (`browseWares`). The town view swaps to the inline `ShopComponent`. Gate it with `visibilityConditions` (hidden) or `requirementsNeeded` (shown but disabled) if needed. New shopkeeper: use `add-npc-dialogue` first.

4. **i18n** — `shop:names.<shopKey>` in `src/assets/locales/en/shop.json`, and the option's `responseKey` in the NPC's dialogue JSON.

Done when `npm run check` passes, and in the dev server the option opens the shop and buying an item takes the gold and adds it to the inventory.
