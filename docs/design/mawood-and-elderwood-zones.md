# Mawood & The Elderwood — Zone & Town Design

## Setting

After crossing the Mountain Pass, the player descends into the **Elderwood** — an ancient forest of impossibly tall trees called **Silverwood Spires**. These trees grow hundreds of metres high, their bark pale silver-grey, trunks so wide that entire buildings are carved into them. The canopy is so dense that the forest floor is in perpetual twilight, lit by bioluminescent mosses and glowing fungi. Somewhere in the middle of this forest, built on massive wooden platforms bridging the giant trunks, sits the town of **Mawood**.

---

## Town: Mawood

> *"Built between the Spires, not on the ground. The roots belong to the forest."*

Mawood is a vertical town — rope bridges, wooden walkways, and platform districts suspended between the Silverwood Spire trunks at varying heights. The lowest platforms rest ~20m off the ground (safer from ground predators), the highest reach into the lower canopy. The town relies on the forest for everything: wood, food, and medicine.

### NPCs

| Name | Role | Notes |
|------|------|-------|
| **Elder Corwin** | Town Elder / Druid | Old man, half-blind, permanently has bark-like skin from a forest curse. Knows the Elderwood's history. Lore NPC, could give quests tied to forest restoration. |
| **Sylvie** | Herbalist | Young woman who runs an apothecary carved into a Spire trunk. Sells healing items and forest reagents. Shop NPC. |
| **Finn Ashwood** | Hunter & Trapper | Gruff middle-aged man. Has a peg-leg from a treant encounter. Gives hunting quests and sells arrows/traps. |
| **Brenna the Carver** | Woodcarver / Armorer | Crafts lightweight armor from Silverwood bark — surprisingly tough. Shop/upgrade NPC. |
| **Milo** | Street Kid / Pickpocket | Orphan who lives on the highest platforms. Hints at something lurking in the Upper Canopy. Quest-giver or dialogue flavor. |

---

## Zone 1 — Elderwood Wilds (ZoneID 6)

> *The outer rim of the Elderwood, where the Silverwood Spires begin to crowd out the sky.*

**Connects:** Mountain Pass → Elderwood Wilds → Mawood (town unlock)  
**Tone:** Transition from rocky mountain to dense, dark forest. Enemies are territorial forest creatures and goblin bands that have spilled over from the Long Path.

### Enemies

| EnemyID | Name | HP | Weakness | Drops | Notes |
|---------|------|----|----------|-------|-------|
| 18 | `forestSpider` | 20 | fire | spider silk (resource), vial of water | New type: `spider`, `arachnid` |
| 19 | `gnollScout` | 35 | physical | wolf fangs (reuse), stick | New type: `gnoll`, `humanoid` (reuse) |
| 20 | `corruptedSapling` | 15 | fire | stick, apple | New type: `plant`. Fragile but spawns in packs |
| 10 | `wolf` | 50 | fire | *(reuse)* | Wolves that crossed the pass |

**Boss (EnemyID 21): `gnollWarchief`**
- HP: 250
- Weakness: air
- Drops: gnoll trophy (new resource), wolf fangs ×1–3
- Types: `gnoll`, `humanoid`
- *A massive gnoll in crude Mountain Pass armour. Commands a pack of scouts. His roar stuns — flavour text only.*

**Zone stats:** maxWave 15, enemiesPerWave 10  
**Progression:** previous = mountainPass, next = *(Mawood town)*

---

## The Corruption Questline — "Roots of Rot"

> *Elder Corwin has watched the Elderwood darken for years. Now the bark on the oldest Spires is cracking, oozing black sap, and the forest creatures have gone feral. He knows what it means — something beneath the roots has woken up.*

This is the main storyline for the Mawood chapter, gated across all three zones. Each quest unlocks the next area and deepens the lore.

---

### Quest 1 — "Signs of Rot"
**Giver:** Elder Corwin (on entering Mawood for the first time)  
**Zone:** Elderwood Wilds

Corwin asks the player to investigate the corruption spreading through the outer forest. Corrupted saplings carry a concentrated resin in their heartwood — he needs samples to analyse.

**Objective:** Defeat 20 Corrupted Saplings  
**Quest-exclusive drop:** `corruptedResin` — black sap-filled seed pod. *Only drops from `corruptedSapling` while this quest is active.*  
**Deliver:** 3× `corruptedResin` to Elder Corwin

**Reward:** Deepwood zone unlocked. Corwin identifies the resin as carrying a blight originating deep underground — and suspects the gnoll war-bands are deliberately spreading infected cuttings as weapons.

---

### Quest 2 — "Fetishes and Fangs"
**Giver:** Finn Ashwood (unlocked after Quest 1)  
**Zone:** Elderwood Wilds

Finn confirms Corwin's theory: gnoll scouts have been spotted planting small root-bundles wrapped in bone and fur — crude fetishes that accelerate the blight. The Warchief is orchestrating it.

**Objective:** Defeat the Gnoll Warchief  
**Quest-exclusive drop:** `blightedFetish` — a gnoll war-fetish dripping black ichor. *Only drops from `gnollWarchief` while this quest is active.*  
**Deliver:** `blightedFetish` to Elder Corwin

**Reward:** Corwin decodes the fetish — the blight's source is the Deepwood, not the gnolls. They were just using it. He gives the player a **ward-torch** (flavour item, no mechanics) to light the way. The Deepwood zone becomes accessible, but the **Gnarled Treant is not yet attackable** *(see boss-lock note below)*.

---

### Quest 3 — "The Sap That Burns"
**Giver:** Elder Corwin  
**Zone:** The Deepwood

Corwin needs cursed sap harvested directly from infected treant sprouts to brew a purifying fire — the only thing that can weaken the Gnarled Treant enough to kill it permanently rather than just topple it.

**Objective:** Defeat 15 Treant Sprouts  
**Quest-exclusive drop:** `cursedSap` — a vial of luminous black liquid harvested from a felled sprout. *Only drops from `treantSprout` while this quest is active.*  
**Deliver:** 5× `cursedSap` to Elder Corwin

**Reward:** Corwin brews the sap into a **Purifying Flame** consumable (flavour — no current mechanic). More importantly, the **Gnarled Treant becomes attackable**. Corwin reveals the lore: a long-dead druid tried to merge with a Silverwood Spire centuries ago. The ritual failed. The tree absorbed his corrupted soul and has been growing more twisted ever since — slowly poisoning the whole forest from one root.

---

### Quest 4 — "The Blighted Heart"
**Giver:** Elder Corwin (auto-advances after Quest 3)  
**Zone:** The Deepwood

The culmination. The Gnarled Treant must be destroyed.

**Objective:** Defeat the Gnarled Treant  
**Quest-exclusive drop:** `blightedHeartwood` — the rotted core of the Treant, still pulsing faintly. *Only drops from `gnarledTreant` during this quest, in addition to its normal drops.*  
**Deliver:** `blightedHeartwood` to Elder Corwin

**Reward:**
- Corwin uses the heartwood to purify his own bark-curse — he looks younger, shaken, grateful
- Upper Canopy zone unlocked (Milo sees smoke clear from the canopy and finally shows the player the rope-lift)
- 1× `skillPointBook` reward
- Corwin's shop/dialogue expands with post-quest lore nodes

---

### Boss Lock — Gnarled Treant ⚠️ Future Feature

> **The Gnarled Treant should not be attackable until Quest 3 ("The Sap That Burns") is completed.**
>
> The game does not currently support gating a boss behind quest state. When this is implemented, the Zone or Enemy interface should gain a `requiredQuestId` (or similar) field. Until then, document this as a design intent — the zone exists and can be entered, but the boss fight is inaccessible without the quest.
>
> Suggested interface addition:
> ```ts
> interface Zone {
>   // ... existing fields
>   bossRequiresQuestId?: QuestID  // boss wave is skipped / enemy is passive until quest complete
> }
> ```

---

## Zone 2 — The Deepwood (ZoneID 7)

> *Past Mawood's outer platforms, deeper into the Elderwood where light doesn't reach the floor.*

**Unlocked from:** Mawood (via Elder Corwin quest or building unlock)  
**Tone:** Dark, oppressive, ancient. The trees here are the oldest — gnarled roots the size of houses, fungi the size of carts. Something is corrupting the forest from within.

### Enemies

| EnemyID | Name | HP | Weakness | Drops | Notes |
|---------|------|----|----------|-------|-------|
| 22 | `elderSpider` | 55 | fire | elder silk (resource), spider fang (resource) | Larger variant; new type `spider`, `arachnid` |
| 23 | `forestBear` | 80 | physical | bear pelt (resource) | New type: `bear`, `mammal` (reuse). Rare |
| 24 | `bogSkeleton` | 40 | fire | bone fragment (resource) | New type: `undead`. Ancient warriors, partially absorbed by roots |
| 25 | `treantSprout` | 30 | fire | ancient wood (resource) | New type: `plant`, `treant`. Younger version of the boss |

**Boss (EnemyID 26): `gnarledTreant`**
- HP: 500
- Weakness: fire
- Drops: ancient wood ×1–5 (uncommon), heartwood amulet (rare equipment drop)
- Types: `plant`, `treant`
- *An ancient Silverwood Spire that became sentient and turned hostile when the forest's corruption spread. Its roots crack the platform walkways of the Deepwood district.*

**Zone stats:** maxWave 20, enemiesPerWave 8  
**Progression:** no previousZoneId (unlocked from town), nextZoneId = upperCanopy

---

## Zone 3 — The Upper Canopy (ZoneID 8)

> *Hundreds of metres above the forest floor, where the Silverwood Spires thin to silver needles and the sky finally opens.*

**Unlocked from:** Mawood (Milo's quest, or a rope-lift building)  
**Tone:** Bright, dangerous, almost serene — until the harpies dive. The highest point in the game so far. Wind-swept wooden platforms, broken rope bridges, and nesting harpies that have claimed the treetops.

### Enemies

| EnemyID | Name | HP | Weakness | Drops | Notes |
|---------|------|----|----------|-------|-------|
| 27 | `harpy` | 45 | physical | harpy feather (resource, high value) | New type: `harpy`, `bird` (reuse) |
| 28 | `giantEagle` | 60 | physical | eagle talon (resource) | New type: `bird` (reuse). Rare; territorial |
| 29 | `canopyBandit` | 70 | air | vial of water, machete (low chance) | Reuse `bandit`, `human`. Outlaws who fled up here |
| 1 | `seagull` | 3 | physical | *(reuse)* | Lost stragglers, weak filler |

**Boss (EnemyID 30): `harpyMatriarch`**
- HP: 600
- Weakness: physical
- Drops: matriarch plume (legendary resource), stoneArrow ×2–5, harpy crown (rare equipment — helmet)
- Types: `harpy`, `bird`
- *The oldest harpy; her wingspan casts a shadow over three platforms. She built her nest in the crown of the tallest Spire. The canopy bandits pay her tribute to avoid being eaten.*

**Zone stats:** maxWave 15, enemiesPerWave 8  
**Progression:** previousZoneId = deepwood, no next (end of current content)

---

## New EnemyTypes to add

```ts
// enemy-type.enum.ts additions
spider,
arachnid,
gnoll,
plant,
treant,
bear,
undead,
harpy,
```

---

## New ItemIDs (resources / equipment)

| Item | Type | Source |
|------|------|--------|
| `spiderSilk` | resource | forestSpider |
| `gnollTrophy` | resource | gnollWarchief |
| `elderSilk` | resource | elderSpider |
| `spiderFang` | resource | elderSpider |
| `bearPelt` | resource | forestBear |
| `boneFragment` | resource | bogSkeleton |
| `ancientWood` | resource | treantSprout, gnarledTreant |
| `heartwoodAmulet` | equipment (neck) | gnarledTreant drop |
| `harpyFeather` | resource | harpy |
| `eagleTalon` | resource | giantEagle |
| `matriarchPlume` | resource (legendary) | harpyMatriarch |
| `harpyCrown` | equipment (helmet) | harpyMatriarch drop |

---

## Mawood NPC Quests

Next available QuestID: **4** (continue from `aTaleOfACaptain = 3`)

Quest requirement types available: `item`, `enemy`, `wave`, `stat`, `quest`  
Reward types available: `stat` (xp, gold, skillPoints), `item`

---

### Sylvie — Herbalist

**Quest 4 — "Silk and Water"** *(fetch quest, single step)*  
> *"I'm running low on spider silk — it's the best binding agent for wound wraps. And I need water, clean water, not this swamp runoff."*

- **Start req:** Quest 3 of Roots of Rot completed (Deepwood accessible)
- **Step 1:** Bring 15× `spiderSilk` + 10× `vialOfWater`
- **Rewards:** 800 XP, 150 gold, 1× `skillPointBook`

---

**Quest 5 — "The Infestation"** *(enemy kill + wave, two steps)*  
> *"The spiders have gotten into the lower platforms. I need them pushed back — not just a few, the whole nesting ground."*

- **Start req:** Quest 4 completed
- **Step 1:** Kill 40 `forestSpider` (enemy req)
- **Step 2:** Kill 60 enemies on wave 10 of Elderwood Wilds (wave req — push to the spider-dense late waves)
- **Rewards:** 2000 XP, 400 gold

---

### Finn Ashwood — Hunter & Trapper

**Quest 6 — "Prove Your Aim"** *(enemy kill, single step)*  
> *"I don't take hunting partners I haven't seen fight. Bring me gnoll ears — ten ought to do it. Warchief's count double."*

- **Start req:** Mawood reached (no prior quest dependency)
- **Step 1:** Kill 10 `gnollScout` (enemy req)
- **Rewards:** 1200 XP, 300 gold

---

**Quest 7 — "Big Game"** *(multi-step, enemy kills + item fetch)*  
> *"The bear that took my leg is still out there. Somewhere in the Deepwood. I need its pelt — for closure, not warmth."*

- **Start req:** Quest 6 completed + Deepwood accessible
- **Step 1:** Kill 5 `forestBear` (enemy req — prove you can handle bears)
- **Step 2:** Bring 3× `bearPelt` (item req — one of them has to be the right one)
- **Rewards:** 3500 XP, 700 gold, 1× `skillPointBook`, 1× equipment item TBD (Finn's old hunting knife? New item: `ashwoodBow`)

> **New item suggestion:** `ashwoodBow` — uncommon weapon, weapon slot, +6 attackPower, +5 critChance. Finn carved it himself, lighter than a wooden bow.

---

### Brenna the Carver — Woodcarver / Armorer

**Quest 8 — "Raw Materials"** *(fetch quest, two steps)*  
> *"I can make you something that'll hold up in the Deepwood — but I need the right wood. Ancient wood, not this fresh-cut green stuff."*

- **Start req:** Deepwood accessible
- **Step 1:** Bring 20× `ancientWood` (item req)
- **Step 2:** Bring 5× `bearPelt` (item req — for padding and lining)
- **Rewards:** 2500 XP, 500 gold, 1× crafted equipment item: `silverwoodChestplate`

> **New item suggestion:** `silverwoodChestplate` — rare chest armor, +4 attackPower, +0.3 goldCoinsMultiplier. Carved from Silverwood bark reinforced with bear hide.

---

**Quest 9 — "War Trophies"** *(enemy kill, single step)*  
> *"The gnolls have been raiding my lumber stock. I want their weapons as scrap — bring me proof you drove them back."*

- **Start req:** Quest 8 completed
- **Step 1:** Kill `gnollWarchief` 3 times (enemy req, amount: 3)
- **Rewards:** 4000 XP, 800 gold, 1× `skillPointBook`

---

### Milo — Street Kid

**Quest 10 — "Feathers for a Kite"** *(fetch quest, single step)*  
> *"I'm building the biggest kite in Mawood. I just need five harpy feathers. Easy, right? ...You go get them."*

- **Start req:** Upper Canopy accessible
- **Step 1:** Bring 5× `harpyFeather` (item req)
- **Rewards:** 1000 XP, 200 gold, 1× `eagleTalon` (Milo found one while exploring — he gives it as thanks)

---

**Quest 11 — "What Lurks at the Top"** *(wave kill + enemy kill, two steps)*  
> *"I've been hearing something bigger than the harpies up there at night. Something that makes even them go quiet."*

- **Start req:** Quest 10 completed
- **Step 1:** Kill 50 enemies on wave 8 of Upper Canopy (wave req — establish presence up there)
- **Step 2:** Kill the `harpyMatriarch` (enemy req, amount: 1)
- **Rewards:** 5000 XP, 1000 gold, 1× `skillPointBook`, 1× `harpyCrown` (guaranteed — Milo was right, it's worth it)

---

### Summary Table

| QuestID | Name | Giver | Type | Key mechanic |
|---------|------|-------|------|--------------|
| 4 | Silk and Water | Sylvie | fetch | item ×2 |
| 5 | The Infestation | Sylvie | kill + wave | enemy kill → wave push |
| 6 | Prove Your Aim | Finn | kill | enemy count |
| 7 | Big Game | Finn | kill + fetch | multi-step, new item reward |
| 8 | Raw Materials | Brenna | fetch ×2 | multi-step, equipment reward |
| 9 | War Trophies | Brenna | boss kill | enemy req ×3 |
| 10 | Feathers for a Kite | Milo | fetch | item req |
| 11 | What Lurks at the Top | Milo | wave + boss | two-step finale |

---

## New ItemIDs — Quest-Exclusive Drops

| Item | Type | Source | Condition |
|------|------|--------|-----------|
| `corruptedResin` | quest item | `corruptedSapling` | Quest 1 active |
| `blightedFetish` | quest item | `gnollWarchief` | Quest 2 active |
| `cursedSap` | quest item | `treantSprout` | Quest 3 active |
| `blightedHeartwood` | quest item | `gnarledTreant` | Quest 4 active |

---

## Open Questions

1. ~~Should the Deepwood corruption have a questline?~~ **Resolved** — "Roots of Rot" questline added above.
2. Should Mawood have a **lumber mill** building that converts `ancientWood` into a crafting currency?
3. The `bogSkeleton` (undead) feels slightly out of theme — swap for a **forest wraith** or **lost hunter** ghost instead?
4. Should `forestBear` be a rare/mini-boss encounter rather than a regular mob (HP 80 feels high for a regular)?
