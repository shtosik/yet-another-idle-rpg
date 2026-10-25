# UI overhaul: navbar, HUD, shop, Camp, town, map

**Scope:** M · **Status:** Accepted 2026-10-24; navbar + HUD done (`feat/navbar-hud`); Camp grid done (`feat/camp-icon-grid`); Map and Skill tree done (`feat/map-skill-tree-zoom`); Shop grid done (`feat/shop-grid`); Town and NPCs done (`feat/town-ui`)

A pass over every tab found the same problems in several places: no feedback on where you are, resources only visible on the main view, and lists that stop working once they hold more than a handful of items.

## Navbar
- Tabs are buttons with a persistent active state (`aria-current`), not hover-only highlight on `<li>`.
- Locked features stay in the bar in a fixed slot, greyed with a lock, and are **not clickable**. The bar no longer reflows as features unlock.
- Badges only on **Bestiary** (new entry not yet viewed) and **Spellbook** (spell learned but not yet viewed). The existing skill point count stays.
- No Town tab: the Map tab owns towns (see Map).

## HUD
- Level, XP bar and gold live in the navbar on every tab.
- Gold changes from buying or selling show floating text next to the gold value: green `+N` on gain, red `−N` on loss.
- The shop does **not** show the player's gold; the HUD covers it.
- The empty `.resources` panel on the main view goes away or takes the stats it used to sit next to. Done (`feat/stats-panel`): removed; the stats panel spans both columns, grouped, with a per-source breakdown tooltip.

## Shop
- Dense grid of inventory-sized slots: icon, stock in the slot's corner badge, price under the icon. The "99 / 99" stock line goes.
- Name and details in a hover tooltip.
- Block reasons shown on the slot: red border = not enough gold, lock = rank or station level missing, faded = sold out.
- Price uses a coin icon instead of the `G` suffix (in Silkscreen `5000G` reads as `50006`).
- Shift-click buys 5.

## Camp
- Recipe list becomes a grid of icon-only slots. No name, no ingredients, no "×N craftable" badge, no quick-craft button, no double-click craft.
- Slot states: lock and level number when the station level is too low, dimmed when ingredients are missing.
- The detail panel on the right keeps name, ingredients and craft ×1 / ×5 / ×10 / max.
- One filter above the grid: craftable only. No category filter (it wouldn't scale with more recipes).

## Town and NPCs
- Dialogue opens in the town panel (or as an overlay), so the inventory stays visible during turn-ins.
- NPC frame gets a direct **Shop** button, shown only after the player has opened that NPC's shop through dialogue once (per NPC, persisted).
- Town view: town name header, hover feedback on building labels, preload the background so it doesn't pop in.

## Map
- Quick buttons for unlocked towns on the map component, so a town is one click away without hunting for its marker.
- Opens zoomed in (fit to the map image, not the furthest zoom-out), and larger click areas on markers.

## Skill tree
- Opens zoomed in further. Node design stays as is.

## Open questions
- Bestiary and Spellbook only use the top half of the middle columns, with the inventory below. Should they span both rows (hiding the inventory on those tabs), or stay as is? The Spellbook needs the inventory less than the Bestiary does.

## Out of scope
Keybinds ([keybinds](keybinds.md)) and window-size scaling ([responsive layout](responsive-layout.md)) are separate ideas. Debug buttons stay as they are.

## Touch-points
`game-menu` component, `game.component` grid, new HUD component and floating gold text, `shop` component, `camp` component and `recipe-detail`, `towns` / `npc-frame` / `dialogue` components, `world-map` component, `skill-tree` component, a per-NPC "shop seen" flag and "viewed" sets for bestiary entries and spells in persisted state.
