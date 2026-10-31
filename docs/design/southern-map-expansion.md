# Southern map expansion

Design for growing the world map south. Everything here is **(proposed)** unless it is marked *owner decision* or cites shipped text. The map art is built (2026-10-31); the Towns and Zones in it are not.

**Art landed (owner decision 2026-10-31):** the whole map was redrawn in one style (ChatGPT, from the old map and this doc, upscaled 2× with the NMKD model) at **3072×2048**, north and south together, so every old position moved. `src/data/world-map-data.ts` holds the new marker positions; §4 lists the points of interest on the new art. The art draws the Towns already, which replaces decision 10. The bottom-edge table (§1) and the routes' coordinates (§3) are the 2794-wide plan the art was briefed from.

Owner decisions this doc is built on (2026-10-30):
1. The map grows south, below the current 752 px, to **2794×1504** (superseded: the art is 3072×2048, above).
2. The west of the new southern band holds a mountain range, **the Ironspine**, and the capital **Lirold** sits there, **inland** (not on the water), with the range rising behind it.
3. Lirold is connected to **the mine**, which lies under the Ironspine, by an ordinary road (the mine road). No tunnel.
4. Only **one new Town** in the south besides Lirold and Slatefall: **Brinewick**. Other Town ideas are parked in §5.
5. The south-east is the Region **Saint Nestroud**.
6. The Hollow Door is only a hint at the far end of the mine's stairs (T-25).
7. The Blackwater Fens are where the black sap drains (T-08/T-27), as a hint that never confirms a cause.
8. Zone tiers continue 10–14 through the south (§4).
9. The delta river is drawn on the map but links no Zones yet.
10. Terrain is painted first; each Town is painted in once it is built (superseded 2026-10-31: the redrawn art shows the Towns).

Companion docs: `docs/ideas/north-lirold-and-exploration-guild.md` §3a (first placement brief, canvas ~1100), `docs/ideas/slatefall-and-the-deeper-mines.md`, `docs/ideas/lirold-arena-master.md`, `docs/lore/world.md`.

## 1. Summary and canvas

- **Canvas: 3072×2048** (see Art landed above). The plan was 2794×1504 with every existing marker kept; the redraw moved them.
- Done: `WORLD_MAP_DATA.manifest` is 3072×2048, tiles regenerated, markers moved, Lirold has a marker.
- **Shape of the south:** the Mountain Pass range sends a southern arm, the Ironspine, down and west toward the sea. Lirold stands inland at its western foot, on the small river, with the coast a day's ride west. The mine runs under the arm. East of the arm, a wide gulf (the Saltmere) opens to a southern sea. East of the gulf, the Elderreach delta spreads into fens, and a forested rise stands in the far south-east.

### The current bottom edge (y = 752), west → east

Read off `src/assets/img/world/source.png`; the x ranges are approximate, so check them against the source before painting. The new art must continue each of these across the seam.

| x (px) | What touches the bottom edge | Continues south as |
|---|---|---|
| 0–250 | Open sea | Sea along the west coast |
| 250–400 | Grass coast; the shore road and a small river both reach the edge around x ~370–390 | Coast road and river running south-east inland to Lirold |
| 400–780 | Green plains with a dark pine forest band | Pine woods and fields around Lirold |
| 780–1370 | The mountain range (grey peaks, a few snow caps) | The Ironspine |
| 1370–1450 | Pale sand and scree at the range's foot | The gulf's west shore |
| 1450–1620 | A water inlet reaching the edge | The Saltmere gulf |
| 1620–2100 | Sandy flats and beige beaches with thin channels | Gulf beaches and the reed shore |
| 2100–2480 | River delta: blue channels, rocky islets | The delta braids on south into the Blackwater Fens |
| 2480–2794 | Dark forest and brown ground | Forest thinning to the Nestroud rise |

## 2. Regions of the south (west → east)

### 2a. Lirold and the Ironspine (x 0–1400)

- **Landscape:** a strip of coast and sea cliffs runs down the west edge. Inland, the small river already drawn at the bottom edge (x ~380) winds south-east through fields to Lirold, which stands on it, away from the water, its castle on a rocky spur of the range so the mountains rise behind the city to the east and south. South of the walls lie farm fields. The Ironspine comes down from the existing peaks (x 780–1370) and sweeps south-west to end in sea cliffs at the bottom-left corner. One high pass crosses it.
- **Mood:** stone, slate and order. The capital's hinterland is busy, walled and taxed; the range is grey, cold and mined.
- **Who lives there:** Lirold's citizens, the castle (ruler unknown, T-24), the Arena, the Exploration Guild hall (proposed), Slatefall's miners, farmers in the South Fields.
- **Ties to threads:**
  - **The mine:** the Ironspine is the range under which the castle's mine runs. Slatefall stays where §3a puts it, on the Pass's southern slope, now read as the Ironspine's north-eastern shoulder. The Deeper Mines and the Lower Shafts lie under the range; the mine road links Lirold to them along its northern foothills.
  - **The stairs (T-25) and the singing stone (T-27):** the cut-stone stairs under the Lower Shafts go down and *south-west*, deeper under the Ironspine. The **Hollow Door** on the range's south face is a cut-stone doorway carrying the same marks (T-26). It *might* be the other end of the stairs; this doc does not say.
  - **The Burrower:** "a turnip field south of the walls" (`liroldArenaMaster.json`) becomes the South Fields.
  - **Port Stocksmar:** the Region's name, not Lirold's harbour. Its sea trade runs through La Harpar on the coast; salt comes up from Brinewick.

### 2b. The southern foothills (x 600–1400, y 1250–1504)

- **Landscape:** the Ironspine's south face drops into green foothills and a river that runs east to the gulf.
- **Mood:** warm, open, quiet after the pass.
- **Who lives there:** charcoal burners and ore haulers; no Town.

### 2c. The Saltmere (x 1350–2050)

- **Landscape:** the inlet on the current bottom edge widens into the **Saltmere**, a broad, shallow, calm gulf that opens to a southern sea at the bottom edge (x ~1400–1950). Its west shore has salt pans and pale beaches. A rocky island in its middle carries stone steps going down into the water. Long sandbars littered with wrecks lie near its mouth.
- **Mood:** bright, flat and salt-white on the surface, with something old under the water.
- **Who lives there:** salt-workers, fishers and ferrymen at **Brinewick**, the south's one new Town.
- **Brinewick's role:** the hub of the south. Ferries to the Drowned Steps and Trappers' Landing leave from here, the salt road climbs to the Lantern Pass, and the shore track goes up to Slatefall. It also takes the forge role parked with Anvilford (§5): a smith working the range's iron, a candidate for Brenna's "smith in the south" (T-21, left open).
- **Ties:** Lirold's salt trade, so fish from La Harpar and salt from Brinewick both feed the capital. The **Drowned Steps** echo the stairs under the mine and carry marks like the Stone Warden's (T-26); Messatan (T-04) is the obvious guess and must stay a guess. The wrecks give Theron's thread (T-01) and his jewels (T-02) a place a later quest could reach; Theron's own *Saltwind* still wrecked on Horseshoe Beach (`la-harpar-quests.md`).

### 2d. The Blackwater Fens (x 2050–2500)

- **Landscape:** the Elderreach delta on the current east edge keeps braiding south. Its channels slow into dark, still fen pools, dead reeds and grey mud islands. Low grassy barrows sink into the bog.
- **Mood:** the blight's downstream end; quiet, rotten, lamp-lit at night.
- **Who lives there:** trappers at a river landing; bog dead in the barrows.
- **Ties:**
  - **Black sap (T-08), owner decision 7:** the river carries what the Deepwood bleeds and it settles here. The fens' eels came up black two winters ago, the same winter the sap appeared and the stone sang (T-27). Hint only, never confirmed.
  - **The Arena's trappers (T-28):** Elderwood beasts come downriver to **Trappers' Landing**, cross the Saltmere by ferry to Brinewick and go overland to Lirold. Yad's crate may have passed through; who brought it stays open.
  - **Bog Skeletons:** the design-only "ancient warriors, partially absorbed by roots" (`docs/design/mawood-and-elderwood-zones.md`) get a home in the Sunken Barrows.

### 2e. The Nestroud rise (x 2450–2794)

- **Landscape:** the dark forest on the current east edge thins southward to a low hill above the fens.
- **Mood:** still, old and watchful; the first place in the south that is not Port Stocksmar's.
- **Ties:** **Saint Nestroud** is a shipped Region name with nothing else said (`laHarparJosh.json` `regionsInfo`). Owner decision 5 makes the south-east Saint Nestroud; its seat is not placed yet (the abbey idea is parked in §5). Greefic Hill and its uncrossable mountain (T-05) stay off this map.

## 3. Routes

| Route | Path (px, 2794×1504) | Notes |
|---|---|---|
| Coast road | Horseshoe Beach (200, 430) → the road already drawn at the bottom edge (~380, 752) → inland along the river → Lirold's north gate (~430, 840) | §3a; the way the player first reaches Lirold. |
| Mine road | Lirold's east gate (~650, 930) → foothills (~850, 900) → (~1050, 860) → Slatefall (~1180, 840) → north up a valley to the Mountain Pass (1250, 550); barrier at ~(1245, 610) | Owner decision 3: Lirold's link to the mine. §3a, unchanged. The "road winding south off the Pass" of the shipped unlock text (`unlocks.json` `towns.lirold`). |
| South road and Lantern Pass | Lirold's south gate (~480, 1020) → South Fields (~560, 1090) → switchbacks up to the Lantern Pass (~900, 1180) → down into the southern foothills (~1150, 1400) | The one crossing of the Ironspine. |
| Cliff path | Lirold → west to the coast → south along the cliffs → Stormwatch Light (~260, 1340) | Footpath; side trip. |
| Salt road | Southern foothills (~1150, 1400) → north-east → Brinewick (~1460, 1090) | Overland link from the pass to the gulf. |
| Shore track | Slatefall (~1180, 840) → down the Ironspine's east flank → Brinewick (~1460, 1090) | Mule track used by salt and slate traders. Optional. |
| Saltmere ferries | Brinewick ↔ Drowned Steps (~1720, 1160) ↔ Trappers' Landing (~2150, 880) | Boat routes, drawn as dotted lines. |
| The delta river | From Elderreach (the existing delta, x ~2100–2480, y < 752) south to Trappers' Landing and the fens | Drawn only; links no Zones yet (owner decision 9). |
| Fen causeway | Trappers' Landing → across the fens (~2330, 1060) → Sunken Barrows (~2520, 1180) | Raised plank and stone causeway over the bog. |

## 4. Points of interest

Positions are on the drawn 3072×2048 map (x right, y down). All are **(proposed)** except where noted.

| # | Name | Position | Hook | Possible game use | Status |
|---|---|---|---|---|---|
| 1 | Lirold | (600, 1180) | The inland capital on its river, castle on a spur of the Ironspine. | Town (exists in data; map marker added) | Town shipped (Arena); inland owner decision; position on the art |
| 2 | South Fields | (560, 1380) | The turnip fields where trappers dug up the Burrower, and something still digs. | Guild contract area or event, outside the tier ladder | proposed (field is shipped: `liroldArenaMaster.json`) |
| 3 | Slatefall | (1280, 1130) | Miners' village on the mine road; the mine has been shut two winters. | Town | proposed (`slatefall-and-the-deeper-mines.md`) |
| 4 | Deeper Mines / Lower Shafts | (1330, 1050) | The castle's mine under the Ironspine; the stairs lie below. | Zones, tiers 8–9 | proposed (same doc) |
| 5 | Stormwatch Light | (170, 1670) | A lighthouse on the range's last cliff whose keeper logs storms that come from nowhere. | Event or small Building (weather hook for T-03, T-28) | proposed |
| 6 | Lantern Pass | (980, 1480) | The only road over the Ironspine, lamp-posted against fog, goats and trolls. | Zone (tier 10) | proposed |
| 7 | The Hollow Door | (1050, 1700) | A half-buried cut-stone doorway on the range's south face, marked like the Warden. | Sealed dungeon; hint at the stairs' far end (T-25) | proposed |
| 8 | Brinewick | (1640, 1450) | Salt pans and ferries on the Saltmere's west shore; the south's hub. | Town (ferries, smith, salt trade) | proposed |
| 9 | Wreck Bar | (2000, 1870) | Sandbars at the gulf mouth where ships break; scavengers and crabs fight over them. | Zone (tier 11) | proposed |
| 10 | The Drowned Steps | (1920, 1540) | An island whose stone stairs go straight down into the water. | Dungeon Zone (tier 12), water-themed | proposed |
| 11 | Trappers' Landing | (2220, 1160) | The jetty where Elderwood beasts are crated for the Arena. | Building or event (Arena stock, T-28) | proposed |
| 12 | Blackwater Fens | (2520, 1540) | Where the river's black sap settles and the reeds die. | Zone (tier 13) | proposed |
| 13 | Sunken Barrows | (2860, 1640) | Grassy mounds sinking into the bog, and the dead who climb out of them. | Dungeon Zone (tier 14) | proposed |

**Progression (owner decision 8):** Lower Shafts (9) → Lantern Pass (10) → Brinewick → Wreck Bar (11) → Drowned Steps (12) → Trappers' Landing → Blackwater Fens (13) → Sunken Barrows (14). The South Fields and Stormwatch Light are side content off the main line.

## 5. Parked Town ideas (later)

Dropped from the map for now (owner decision 4). Their positions stay free in the art so any of them can be added later.

- **Anvilford** (~1150, 1400): forge town at a river ford in the southern foothills; the range's iron becomes the capital's steel. Its smith role moved to Brinewick.
- **Reedholt** (~2210, 1230): stilt village of eel-fishers in the fens whose catch came up black two winters ago.
- **Abbey of Saint Nestroud** (~2620, 1380): an abbey on the rise above the fens whose records are older than the castle's; a candidate seat for the Region.
- **Lirold Harbour**: dropped, not parked; Lirold is inland.

## 6. Changes to existing docs

- `north-lirold-and-exploration-guild.md` §3a: the canvas becomes **2794×1504**, not ~1100. Every §3a position (Lirold, the coast road, the mine road, Slatefall, the mine mouth, the barrier) stays the same. The range in §3a's strip is the Ironspine and keeps going south and west.
- `slatefall-and-the-deeper-mines.md`: no position change. "Under the Pass" still holds; the mine is now also "under the Ironspine". T-25 gains a hinted far end (the Hollow Door).
- `unlocks.json` `towns.lirold`: "a castle by the sea" rewritten to "a castle under the mountains" to match the inland decision. `docs/character/lirold/lirold-coastal-concept.png` shows a harbour and is superseded.

## 7. Art brief (map-painterly subjects)

Done differently: the art was redrawn whole (see Art landed at the top). This brief stays as the reference for extending the map later with `map-window.mjs`.

The new band is y 752–1504. It is painted in 672×376 windows (`docs/systems/asset-pipeline.md` § World-map pieces), row by row from the existing edge down, each overlapping the drawn map by 100+ px; mountain ranges get a peaks-scribble region. The three areas below are the subjects for the windows inside them: **West** x 0–1344, **Centre** x 725–2069, **East** x 1450–2794. Match §1's bottom-edge table. Terrain only: settlements are left as clear ground and placed later.

- **West (x 0–1344):** Seen from above, a narrow strip of sea and rocky coast along the left edge; a small river flowing down from the top edge and winding right, away from the coast, through green fields, with a dirt road beside it; a flat rocky spur left clear on the river's right bank in the upper centre, with patchwork farm fields south of it; a large grey mountain range coming down from the top edge across the centre and right and sweeping toward the lower left, ending in tall sea cliffs in the bottom-left corner; a winding pass crossing the range in the lower centre; a terraced mountainside with spoil heaps and a quarry cut near the top right; green foothills along the bottom right with a river running toward the right edge.
- **Centre (x 725–2069):** Seen from above, the eastern slopes of a grey mountain range on the left coming down from the top edge; a narrow water inlet at the top centre widening into a broad calm gulf that fills the centre and right and opens to the sea along the bottom; white salt pans and pale beaches along the gulf's left shore; a small rocky island in the middle of the gulf with stone steps going down into the water; long sandbars with broken ship hulls near the bottom; reed marsh along the right shore.
- **East (x 1450–2794):** Seen from above, the eastern half of a broad calm gulf on the left; a braided river delta flowing down from the top edge through the centre, its channels darkening into black still fen pools with dead reeds and grey mud islands; low grassy mounds half sunk in the bog right of centre; a dark forest coming down from the top edge along the right side and thinning toward the bottom into a low hill with a cleared top; along the bottom, the fens meeting the sea in a muddy shore.
