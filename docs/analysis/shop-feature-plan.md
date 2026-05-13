# Shop Feature — Implementation Plan

> **Trigger:** Trader's `default.opt2` dialogue option ("Show me your wares") already fires
> `{ type: 'shop', shopId: 0 }` with `closeDialogue: true` — but the manager's `openShop` is
> a `console.log` stub. This plan wires it up end-to-end.
> **Date:** 2026-05-13

## Design decisions (locked)

| Decision | Choice |
|---|---|
| Cooldown clock | **Session-only** — ticks while the game is open, paused when closed. Persisted so it resumes where it left off. |
| Price source | **Per-shop override** — shop entry defines its own price. `item.value` stays untouched (used elsewhere for drop/sell value). |
| Cooldown stat | **`shopRefreshCooldown` player stat is the base**. Default bumped from 10 min → 1 h. Items/skills can still reduce it via the existing "amount is subtracted" pattern. |
| Sold-out non-refreshable | **Stays as a "Sold Out" slot** — disabled, still visible. Communicates rarity. |
| Failure modes | Insufficient gold OR inventory full OR stock 0 → slot is disabled, with a hover tooltip explaining why. No error popup. |
| Refresh scope | Per-shop independent cooldown. Each shop has its own timer. |
| Cooldown start | Begins as soon as the shop's runtime state exists (first time the game loads, or first time the shop is interacted with — see §3.2). |

## Architecture overview

```
laHarparTrader.ts                    src/data/shops-data.ts
        │                                       │
        │ { type:'shop', shopId:0 }             │
        ▼                                       │
DialogueManagerService.applyEffects             │  ◄── static data: items, prices, stock caps, refresh flag
        │                                       │
        ▼                                       │
ModalService.openShop(shopId) ──────────────────┘
        │
        ▼
ShopComponent (modal)
        │
        │ buy(item)
        ▼
ShopStore.buyItem(shopId, item) ◄──── GameIntervalService 1s branch
        │                                       │
        ▼                                       ▼
PlayerStore.{updatePlayerStats, updatePlayerInventory}    shopStore.tickCooldowns(1000)
                                                         → refreshShop when cooldown hits 0
```

## File inventory

### New files
1. `src/types/shop/shop.type.ts` — `Shop`, `ShopItem` (static data shapes)
2. `src/types/shop/shop-state.type.ts` — `ShopInstanceState`, `ShopRuntimeItem` (persisted runtime shapes)
3. `src/app/store/shop/shop.store.ts` — NgRx signal store. State, methods, computed selectors.
4. `src/app/components/modals/shop/shop.component.ts/html/sass` — modal UI.
5. `src/assets/locales/en/shop.json` — i18n.

### Modified files
1. `src/data/shops-data.ts` — replace commented stub with real data (Trader's wares).
2. `src/app/store/player/player.ts` — change `shopRefreshCooldown` default from `1000*60*10` → `1000*60*60`.
3. `src/app/services/game-interval.service.ts` — hook into the existing 1-second tick branch to decrement shop cooldowns.
4. `src/app/services/dialogue-manager.service.ts` — replace `openShop` stub with `modalService.openShop(shopId)` call.
5. `src/app/services/modal.service.ts` — add `openShop(shopId: ShopID)` method.
6. `src/app/app.config.ts` — register `'shop'` i18n namespace.

---

## Phase 1 — Static data and types

### 1.1 `src/types/shop/shop.type.ts`
```ts
import { ShopID } from '../../enums/ids/shop-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ItemTier } from '../../enums/items/item-tier.enum'

export interface Shop {
  id: ShopID
  nameKey: string                // i18n key, e.g. 'shop:names.laHarparShop'
  items: ShopItem[]
}

export interface ShopItem {
  itemId: ItemID
  tier: ItemTier
  price: number                  // gold cost per unit
  maxStock: number               // capacity per refresh cycle
  refreshable: boolean           // true → restocks to maxStock on cooldown
}
```

### 1.2 `src/data/shops-data.ts` (rewrite)
```ts
import { ShopID } from '../enums/ids/shop-id.enum'
import { ItemID } from '../enums/ids/item-id.enum'
import { ItemTier } from '../enums/items/item-tier.enum'
import { Shop } from '../types/shop/shop.type'

const SHOPS_DATA: Record<ShopID, Shop> = {
  [ShopID.laHarparShop]: {
    id: ShopID.laHarparShop,
    nameKey: 'shop:names.laHarparShop',
    items: [
      { itemId: ItemID.skillPointBook, tier: ItemTier.legendary, price: 5000, maxStock: 1, refreshable: false },
      { itemId: ItemID.fishMeat,       tier: ItemTier.normal,    price: 10,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.apple,          tier: ItemTier.normal,    price: 25,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.woodenBow,      tier: ItemTier.uncommon,  price: 2500, maxStock: 1,  refreshable: true  },
    ],
  },
}

export default SHOPS_DATA
```

### 1.3 `src/types/shop/shop-state.type.ts`
```ts
import { ItemID } from '../../enums/ids/item-id.enum'
import { ItemTier } from '../../enums/items/item-tier.enum'

export interface ShopRuntimeItem {
  itemId: ItemID
  tier: ItemTier
  currentStock: number
}

export interface ShopInstanceState {
  cooldownRemainingMs: number     // ticks down each second while game is open
  items: ShopRuntimeItem[]        // parallel to the static items array; tracks current stock
}
```

---

## Phase 2 — The shop store

### 2.1 `src/app/store/shop/shop.store.ts`

State shape: `Partial<Record<ShopID, ShopInstanceState>>`. Only stores runtime data
(cooldown + per-item stock). Static data (price, maxStock, refreshable flag) lives in
`SHOPS_DATA` and is referenced by id at read-time.

Persisted via `withStorageSync`, so cooldowns and stock survive reloads.

**Methods to expose:**

- `ensureShop(shopId)` — lazy-initialises the runtime state for a shop on first access.
  Seeds it from `SHOPS_DATA[shopId]` with all items at `maxStock` and `cooldownRemainingMs = playerStore.stats().shopRefreshCooldown`.
- `tickCooldowns(deltaMs)` — called by `ShopCooldownService`. For each shop, decrement
  `cooldownRemainingMs` by `deltaMs`. When it hits ≤ 0, call `refreshShop(shopId)` and
  reset cooldown to current base.
- `refreshShop(shopId)` — for each item in the shop where `refreshable === true`, reset
  its `currentStock` to `maxStock`. Non-refreshable items are skipped.
- `buyItem(shopId, itemIndex)` — decrement that item's `currentStock` by 1. **Does not**
  touch gold or inventory directly — that's the caller's responsibility (see §4.4).
- `resetState()` — for the dev "reset state" button.

**Computed selectors:**

- `getShopState(shopId)` — returns the runtime state for a shop (creating it if needed).
- `getCooldownRemainingMs(shopId)` — convenience for the modal countdown display.

### 2.2 Storage key + initial state

```ts
const STORE_KEY = 'shopStore'

export interface ShopState {
  shops: Partial<Record<ShopID, ShopInstanceState>>
}

const initialState: ShopState = { shops: {} }
```

Follows the same pattern as `playerStore` / `questsStore`: `withState` + `withGameStateSync` + `withDevtools` + `withStorageSync` + `withMethods`.

---

## Phase 3 — Hook into existing game loop

No new service. `GameIntervalService` already runs at 100ms and has a 1-second branch
guarded by `tickCounter >= 1000`. We piggyback on it.

### 3.1 Patch `src/app/services/game-interval.service.ts`

Inject `ShopStore` at the top:
```ts
shopStore = inject(ShopStore)
```

In the 1-second branch of `tick()`, after `battleStore.updateTick()`:
```ts
this.tickCounter += TICK_DURATION_IN_MS
if (this.tickCounter >= 1000) {
  this.tickCounter = 0
  this.battleStore.updateTick()
  this.shopStore.tickCooldowns(1000)    // ← add this line
}
```

That's the entire integration. The constant `1000` matches the branch's actual cadence —
no need to track a `lastTickAt` delta because the ticker itself enforces 1-second
granularity (and `worker-timers` keeps the timer running even when the tab is
backgrounded).

### 3.2 Refresh semantics
- **Session-only:** the loop is `setInterval`-backed and dies when the tab closes, so
  the cooldown stops decrementing while the game isn't loaded — matches the locked
  decision.
- **Persistence:** the remaining cooldown lives in `shopStore` which is persisted via
  `withStorageSync`, so reload resumes exactly where the player left off.
- **Backgrounded tab:** `worker-timers` keeps `setInterval` accurate across browser
  throttling, so the player won't lose ticks just because they switched tabs.
- **Initialization order:** `GameIntervalService.initGameLoop()` is presumably called
  during app startup. Verify that `shopStore` is ready before the first tick — since
  it's `providedIn: 'root'` and injected in the constructor, Angular DI guarantees it.

---

## Phase 4 — The shop modal

### 4.1 ModalService extension
`src/app/services/modal.service.ts` — add:
```ts
openShop(shopId: ShopID) {
  return this.dialog.open(ShopComponent, {
    panelClass: 'modal',
    minWidth: '600px',
    position: { top: '150px' },
    data: { shopId },
    disableClose: false,
  })
}
```

### 4.2 Wire dialogue effect
`dialogue-manager.service.ts` — replace stub:
```ts
private openShop(shopId: number) {
  this.modalService.openShop(shopId)
}
```
Inject `ModalService` in the constructor.

### 4.3 `shop.component.ts`
Reads `shopId` from injected `MAT_DIALOG_DATA`. On init, calls `shopStore.ensureShop(shopId)`.
Then exposes computed signals:
- `shopName` — i18n from `SHOPS_DATA[shopId].nameKey`
- `cooldownRemainingMs` — from store; formatted as `mm:ss` countdown
- `items` — array of `{ static: ShopItem, runtime: ShopRuntimeItem }` zipped together

Renders a grid of `<app-slot>` containers (reusing `slot.component`), each containing:
- Item icon (`<img [ngSrc]="ITEM_DATA[item.itemId].url">`)
- Item name overlay or tooltip (i18n from `items:names.<ItemID name>`)
- Price tag (e.g. `5000g`)
- Stock pill (e.g. `12 / 99`) or "Sold Out"
- Buy button (or click slot to buy)

### 4.4 Buy flow
Component method `buyItem(index)`:
1. Look up the static `ShopItem` and runtime `ShopRuntimeItem`.
2. Check **all three** preconditions:
   - `runtime.currentStock > 0`
   - `playerStore.stats().goldCoins >= staticItem.price`
   - Inventory has either a matching stack or an empty slot
3. If any fail → no-op (UI should already have the slot disabled, but defence-in-depth).
4. Sequence the mutations:
   - `playerStore.updatePlayerStats([{ stat: 'goldCoins', amount: -staticItem.price }])`
   - `playerStore.updatePlayerInventory([{ id: staticItem.itemId, tier: staticItem.tier, type: ITEM_DATA[staticItem.itemId].type, amount: 1 }])`
   - `shopStore.buyItem(shopId, index)`

This logic could move to a `ShopService.buyItem(shopId, index)` if we want it reusable —
recommended, but small enough to live in the component initially.

### 4.5 Slot disabled state
The slot should visually communicate why it's unbuyable. Three failure modes:
| Reason | Visual treatment |
|---|---|
| Stock 0, refreshable | Greyed out, "Restocking…" + countdown sliver |
| Stock 0, non-refreshable | Greyed out, "Sold Out" badge |
| Not enough gold | Slot active, price tag red |
| Inventory full | Slot active, "Inventory Full" tooltip on hover |

Combine via SASS modifier classes (`.slot--unavailable`, `.slot--no-gold`, `.slot--full`).

### 4.6 Reusing `slot.component`
The existing `slot.component` is a `<ng-content/>` wrapper with the styled 4rem×4rem box.
**Do not modify it** — instead, project the item content into it:
```html
<app-slot
  *ngFor="let entry of items(); let i = index; trackBy: trackByItemId"
  [class.slot--disabled]="!canBuy(entry, i)"
  (click)="buyItem(i)"
>
  <!-- item icon, badges, price -->
</app-slot>
```
The styling additions (disabled state, badges) live in `shop.component.sass`, not in `slot.component.sass`.

### 4.7 Countdown display
Header of the modal: `Next refresh in {{ cooldownLabel() }}`.
Format `cooldownRemainingMs` as `H:MM:SS` for hour-scale, `MM:SS` under an hour, `0:0X` under a minute. Pure helper, can live in a pipe or component method.

---

## Phase 5 — Player store tweak

`src/app/store/player/player.ts`:
```ts
// before
shopRefreshCooldown: 1000 * 60 * 10,   // 10 minutes
// after
shopRefreshCooldown: 1000 * 60 * 60,   // 1 hour (base)
```

This is the only player-store change. The "subtract on update" branch in
`player.store.ts:124` stays as-is — items can still reduce the cooldown via positive
stat updates.

⚠️ **Save compatibility note:** existing players have `10*60*1000` persisted in their
store. Because `withStorageSync` writes the whole state, the default change only takes
effect for fresh saves. For existing saves, the player keeps 10 min until something
re-initialises their stats. If that's a concern, add a one-time migration in
`with-game-state-sync.hook` to bump it. (Probably not worth it pre-launch.)

---

## Phase 6 — i18n

### 6.1 `src/assets/locales/en/shop.json`
```json
{
  "names": {
    "laHarparShop": "Trader's Wares"
  },
  "ui": {
    "nextRefresh": "Next refresh in {{time}}",
    "soldOut": "Sold Out",
    "restocking": "Restocking…",
    "inventoryFull": "Inventory Full",
    "notEnoughGold": "Need {{amount}} gold",
    "price": "{{amount}}g",
    "stock": "{{current}} / {{max}}",
    "buy": "Buy"
  }
}
```

### 6.2 Register namespace
`src/app/app.config.ts` — add `'shop'` to the `translations` array.

---

## Phase 7 — Wiring + test pass

### 7.1 No initializer changes
The game loop is already running. Phase 3's one-liner in `game-interval.service.ts`
is the whole wiring. No `APP_INITIALIZER` work needed for cooldowns.

### 7.2 Smoke test
1. Load game, kill enough enemies for 5000 gold.
2. Talk to Trader → "Show me your wares" → shop modal opens, dialogue closes.
3. Apple slot shows `99 / 99` at `25g`. Buy one → gold drops by 25, apple stack appears in inventory, stock shows `98 / 99`.
4. Buy `woodenBow` → stock `0 / 1`, slot shows "Restocking…" with countdown.
5. Buy `skillPointBook` → stock `0 / 1`, slot shows "Sold Out" (non-refreshable).
6. Empty out inventory full slot test → try to buy any item → slot disabled, tooltip "Inventory Full".
7. Close modal, wait full cooldown, re-open shop → refreshable items at max, `skillPointBook` still "Sold Out".
8. Close/reopen browser tab → cooldown resumed from where it left off, not reset.
9. `npx tsc --noEmit` passes.

### 7.3 Audit hooks
After this lands, the dialogue audit skill no longer needs to flag `{ type: 'shop' }` as
a stub. Update `.claude/skills/audit-dialogue/SKILL.md` §14 to mark item 14 resolved.

---

## Phase 8 — Out of scope (for now)

These come up but should NOT be in this PR:
- Selling items back to the shop.
- A "force refresh" gold cost button.
- Multiple shopkeeper UI variants (different layouts per NPC).
- Quantity selectors (buy 10 apples at once).
- Shop browse without dialogue trigger.

These are good follow-ups but each adds enough scope to warrant its own plan.

---

## Estimated effort

| Phase | Effort |
|---|---|
| 1 — types + data | XS — 20 min |
| 2 — shop store | S — 1 h |
| 3 — game-loop hook | XS — 5 min |
| 4 — modal component | M — 2-3 h (most of the UI work) |
| 5 — player default bump | XS — 2 min |
| 6 — i18n | XS — 10 min |
| 7 — wiring | S — 20 min |

**Total:** ~half a day of focused work.

## Suggested commit sequence

```
1. feat(shop): add Shop types and Trader shop data
2. feat(shop): add shop signal store with cooldown + buy
3. feat(shop): hook shop cooldown into GameIntervalService
4. feat(shop): add shop modal component reusing app-slot
5. feat(dialogue): wire shop effect to ModalService
6. chore(player): bump shopRefreshCooldown default to 1h
```

Each commit is independently reviewable. Combine 5 & 6 if you prefer.
