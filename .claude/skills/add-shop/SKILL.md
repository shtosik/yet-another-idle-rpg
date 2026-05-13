---
name: add-shop
description: Use when adding a new shop to the game — a new shopkeeper NPC with their own inventory, prices, and refresh cycle. Covers data definition, store wiring, modal opening via dialogue, and i18n. Triggers on phrases like "add a new shop", "give the blacksmith a shop", "create shop items for X", "add purchasable items to NPC".
---

# Add a Shop

A shop has two layers: **static data** (items, prices, stock caps) and **runtime state**
(current stock, cooldown). These are kept separate so save files stay small and static
data can change without migrations.

## Prerequisites — read first
- `src/types/shop/shop.type.ts` — `Shop`, `ShopItem` (static shapes)
- `src/types/shop/shop-state.type.ts` — `ShopInstanceState`, `ShopRuntimeItem` (runtime shapes)
- `src/app/store/shop/shop.store.ts` — how cooldowns, refresh, and buying work
- `src/data/shops-data.ts` — existing shop as reference

## Step 1 — Register a ShopID

`src/enums/ids/shop-id.enum.ts` — add an entry. Never renumber existing values.

```ts
export enum ShopID {
  laHarparShop = 0,
  blacksmithShop,   // ← new
}
```

## Step 2 — Define the shop data

`src/data/shops-data.ts` — add an entry to `SHOPS_DATA`:

```ts
[ShopID.blacksmithShop]: {
  id: ShopID.blacksmithShop,
  nameKey: 'shop:names.blacksmithShop',
  items: [
    { itemId: ItemID.knife,       tier: ItemTier.uncommon, price: 150,  maxStock: 1,  refreshable: true  },
    { itemId: ItemID.makeshiftClub, tier: ItemTier.normal, price: 50,   maxStock: 3,  refreshable: true  },
    { itemId: ItemID.stone,       tier: ItemTier.normal,   price: 5,    maxStock: 99, refreshable: true  },
  ],
},
```

### Authoring rules
- **`refreshable: false`** — item stays at whatever stock remains after purchase, forever.
  Use for rare/unique items (e.g. `skillPointBook`). The slot renders as "Sold Out" when
  stock hits 0 instead of showing a countdown.
- **`refreshable: true`** — stock resets to `maxStock` when the per-shop cooldown expires.
  Base cooldown is `playerStore.stats().shopRefreshCooldown` (default 1 hour). Equipment
  items that reduce this stat shorten all shop timers globally.
- **`maxStock: 1`** with `refreshable: true` — a weekly-style rare item. Good for
  equipment.
- **`price`** is in gold coins (`goldCoins` player stat). It is independent of
  `item.value` (the drop/sell value).

## Step 3 — Wire a dialogue option to open the shop

In the NPC's dialogue file, add a result with a `ShopEffect`:

```ts
{
  responseKey: `${NS}:default.showWares`,
  results: [
    {
      next: SomeConversationID.default,
      closeDialogue: true,
      effects: [{ type: 'shop', shopId: ShopID.blacksmithShop }],
    },
  ],
},
```

`closeDialogue: true` is important — the shop opens as a modal and the dialogue panel
stays visible underneath otherwise.

`DialogueManagerService.applyEffects` handles `type: 'shop'` by calling
`ModalService.openShop(shopId)`, which opens `ShopComponent` with the shop ID injected
via `MAT_DIALOG_DATA`. The store's `ensureShop` is called on modal init, so the first
open lazy-initialises runtime state at full stock.

## Step 4 — Add the i18n key

`src/assets/locales/en/shop.json` — add under `names`:

```json
{
  "names": {
    "laHarparShop": "Trader's Wares",
    "blacksmithShop": "Blacksmith's Forge"
  }
}
```

Also add the dialogue option key for the NPC's i18n file:
```json
"default": {
  "showWares": "Let me see what you have for sale."
}
```

## Step 5 — (Optional) Restrict access behind a quest or condition

Use `visibilityConditions` on the dialogue result to gate the shop option:

```ts
{
  responseKey: `${NS}:default.showWares`,
  results: [
    {
      visibilityConditions: [
        { type: 'quest', questId: QuestID.someQuest, questState: QuestState.completed },
      ],
      closeDialogue: true,
      effects: [{ type: 'shop', shopId: ShopID.blacksmithShop }],
    },
  ],
},
```

The option is completely hidden from the player until the condition is met. Use
`requirementsNeeded` instead if you want it visible but disabled.

## Step 6 — Smoke test

1. Open the NPC's dialogue → confirm the shop option appears (or is gated correctly).
2. Select it → dialogue closes, shop modal opens with the correct title.
3. Buy one refreshable item → gold decreases by `price`, item appears in inventory,
   stock decrements by 1.
4. Buy to stock 0 → slot shows "Restocking…" with countdown.
5. Buy a non-refreshable item to stock 0 → slot shows "Sold Out" permanently.
6. With not enough gold → price tag turns red, slot is disabled.
7. With a full inventory → amber "Inventory Full" badge appears on the slot.
8. Reload the page → stock and cooldown resume from where they left off.
9. `npx tsc --noEmit` passes.

## How the runtime works (for debugging)

- **`ShopStore.shops`** — persisted to `localStorage` key `shopStore`. Contains per-shop
  cooldown remaining (ms) and per-item current stock. Inspect in devtools.
- **Cooldown ticks** — `GameIntervalService.tick()` calls `shopStore.tickCooldowns(1000)`
  every second. The cooldown counts down while the game tab is open; closing the tab
  pauses it (session-only).
- **Refresh** — when `cooldownRemainingMs ≤ 0`, all `refreshable` items reset to
  `maxStock`. Non-refreshable items are skipped. Cooldown resets to
  `playerStore.stats().shopRefreshCooldown` (picks up any buffs the player has equipped).
- **`ensureShop`** is idempotent — safe to call multiple times. Only initialises if
  the shop has no runtime state yet (e.g. first ever visit, or after a state reset).

## Common mistakes

- Forgetting `closeDialogue: true` on the shop-opening result — dialogue stays open
  behind the modal.
- Adding a shop entry to `SHOPS_DATA` but forgetting to add the `ShopID` enum value —
  TypeScript will complain that the `Record<ShopID, Shop>` is incomplete.
- Using `item.value` as the price — the shop price is **always** defined in `SHOPS_DATA`,
  not derived from the item definition.
- Setting `refreshable: false` on an item that the player is expected to be able to buy
  again — it will be "Sold Out" forever after the first purchase.
