# Lirold Arena Master (Ludo Crane)

**Scope:** S · **Status:** Proposed (2026-10-27). Dialogue and lore for the Combat Arena ([`combat-arena.md`](combat-arena.md)).

The Arena Master of Lirold is **Ludo Crane**, the Arena's old champion, now its master and announcer. Character file: [`docs/character/lirold/ludo-crane.md`](../character/lirold/ludo-crane.md). He replaces the placeholder "Varek" everywhere.

## 1. Lore already in the game

| Fact | Source |
|---|---|
| Lirold is the capital of Port Stocksmar. | `laHarparJosh.json` `beachName` |
| Lirold unlocks on the Harpy Matriarch kill (Upper Canopy wave 15), so every player who meets Ludo has killed her. | `src/data/unlock-conditions.ts`, `north-lirold-and-exploration-guild.md` §3 |
| The Arena is a Building in Lirold (`map.json` `buildings.liroldArena` "Arena"). | `towns-data.ts`, `map.json` |
| Champion names: The Brute, The Arcanist, The Burrower, Yad, the Arena Champion. The Brute and the Arcanist are human; the Burrower a mammal; Yad humanoid. | `enemies.json`, `enemies-data.ts` `enemyTypes` |
| Regular arena Waves are Elderwood and Deepwood creatures: Forest Spiders, Corrupted Saplings, Gnoll Scouts, Treant Sprouts, Bog Skeletons. | `src/data/arena-data.ts` |
| Clear text: "Yad falls and the stands roar your name." Timeout: "The sand ran out before the last champion fell." | `app.json` `arena.result` |
| Spells by element: Fire Strike (fire), a seawater lash (water), a wind blade and Thunderstorm (air). | `spells.json` |

## 2. The Arena (story)

The Arena is Lirold's oldest show: a sand floor ringed by stone stands, under a charter held by the castle (who rules from the castle stays open, T-24). Ludo Crane keeps the gate and the crowd. Trappers sell him what the Elderwood throws out, which is why the player knows half the beasts on the sand. Champions fight for the purse, all but Yad.

- **The Brute** (wave 5): a pit fighter in patched iron over old scars. His old wounds open in the fight; hit where it shows.
- **The Arcanist** (wave 10): a mage whose ward drinks from the challenger's sandglass whenever a spell hits her. Steel and staff don't touch it.
- **The Burrower** (wave 15): a digging beast trappers pulled out of a turnip field south of the walls. It goes under; of the mounds that go up, the one that shakes has it.
- **Yad, the Arena Champion** (wave 20): a hulking crimson beast on huge fists with dark spikes. It came in a crate last spring from trappers who took their pay and wouldn't say where they found it. "Yad" was the one word chalked on the crate. Its guard shifts like the weather (fire, air, water), and the air in the stands turns like a storm is coming. Nobody had beaten it before the player. Where it came from is open (thread T-28).

## 3. Unlock popup (`unlocks.json` `towns.lirold`)

Replaces the current text (which names Varek and says the road comes "past the troll's pass", against the lore: the mine road is barred, and the player arrives by the coast road).

- **title:** "Lirold Discovered!" (unchanged)
- **body (now, Arena only):** "From the Matriarch's nest you can see past the mountains: a road winding south off the Pass, and at its end stone walls and a castle by the sea. Lirold, the capital of Port Stocksmar. Travel there from the Map; its Arena takes any challenger who can pay the gate."
- **body (once the Guild hall ships, `north-lirold-and-exploration-guild.md`):** "From the Matriarch's nest you can see past the mountains: a road winding south off the Pass, and at its end stone walls and a castle by the sea. Lirold, the capital of Port Stocksmar. Travel there from the Map: the Exploration Guild's hall is there, and an Arena for anyone who can pay the gate."

## 4. Other text that names the placeholder

| Key | Now | Proposed |
|---|---|---|
| `npc.json` `names.liroldArenaMaster` | "Varek" | "Ludo Crane" |
| `app.json` `arena.result.inventoryFull` | "…claim your rewards here or from Varek in Lirold." | "…claim your rewards here or from Ludo Crane in Lirold." |

## 5. Dialogue script (`liroldArenaMaster`, namespace `dialogues/liroldArenaMaster`)

`firstMeetNodeId` = `intro1`, default = `default`. Both first-meet options set the met flag the placeholder already sets (`met_${NpcID.liroldArenaMaster}`), so a returning player never sees the greeting again. Voice: booming showman, calls the player "challenger", says "sand" for both the floor and the clock. Every node key below is new (the tree is new); `intro1`, `default`, `rules`, `running` reuse the placeholder's keys.

### intro1
**Shown when:** first meeting (met flag not set)
> Ha, a new challenger, and the whole city's heard about the harpy queen! Ludo Crane, Master of the Arena, eleven seasons champion of this sand. Want to hear how it works?

1. "Tell me." → rules · effect: set met flag
2. "Maybe later." → close · effect: set met flag

### default
**Shown when:** returning player
> The sand's raked and the stands are filling. Fight, talk or gawk, challenger?

Options, in hub order (claim first, as a turn-in):
1. "I've come for my winnings." → claimed · effect: arena `claim` (only if arena `rewardsWaiting`; hidden otherwise)
2. "I'll fight." (the fee shows in the effect label) → one option, two results:
   - close · effects: deduct 10,000 gold (`ARENA.entryFee`), arena `enter` (only if arena `idle`; the UI disables it when the player can't afford it)
   - → running (fallback: a run is already going on)
3. "Remind me of the rules." → rules
4. "Tell me about your champions." → champions
5. "Who runs this place?" → aboutArena
6. "Another time." → close

### rules
> Ten thousand gold opens the gate, and the fee stays with me whatever happens. Twenty waves, one sandglass, ten minutes; every fifth wave is a champion, and the last is Yad. Beat the sand and you walk out in a Molten Cape, with something extra the first time; walk out early or run dry and you keep only what your kills paid.

1. "Tell me about your champions." → champions
2. "Understood." → default

### champions
> Four of them, and none just stands there and bleeds. Each has a trick, and each trick wants a different answer. Who do you want to hear about?

1. "The Brute." → aboutBrute
2. "The Arcanist." → aboutArcanist
3. "The Burrower." → aboutBurrower
4. "Yad." → aboutYad
5. "That's enough." → default

### aboutBrute
> Wave five. The Brute's all iron and old scars, and his old wounds open up when he's working hard. Watch him, not your blade, and hit where it shows.

1. "Who else?" → champions
2. "Thanks, Ludo." → default

### aboutArcanist
> Wave ten. The Arcanist wears a ward that drinks from your sandglass every time a spell hits her. Steel and staff don't bother it, so save your spells; you'll want them for Yad.

1. "Who else?" → champions
2. "Thanks, Ludo." → default

### aboutBurrower
> Wave fifteen. Trappers dug it out of a turnip field south of the walls, and it still won't stay above ground. When it goes under, watch the mounds: the one that shakes has teeth in it, and a wrong guess sends it up fresher.

1. "Who else?" → champions
2. "Thanks, Ludo." → default

### aboutYad
> Wave twenty, and the reason the stands fill. Yad's guard shifts like the weather: fire one minute, wind or water the next. A fighter with one trick won't last.

1. "Where did Yad come from?" → yadOrigin
2. "Who else?" → champions
3. "Thanks, Ludo." → default

### yadOrigin
> Came in a crate last spring, from trappers who took their pay and wouldn't say where they'd been. "Yad" was the one word chalked on the lid. When its guard goes up, the air in the stands turns like a storm's coming.

1. "Who else?" → champions
2. "Thanks, Ludo." → default

### aboutArena
> The castle holds the Arena's charter; I keep the sand and the crowd happy. Trappers sell me whatever the Elderwood coughs up, so you'll know half the beasts out there. Champions sign on for the purse, all but Yad.

1. "And you?" → aboutLudo
2. "Got it." → default

### aboutLudo
> Eleven seasons champion, never once beaten on this sand. Then a cart wheel took my knee on market day, and the castle gave me the gate. Now I shout louder than I swing!

1. "Fair enough." → default

### claimed
**Shown when:** after the arena `claim` effect
> Your winnings, challenger, every last stitch. The stands are still shouting your name.

1. "Thanks, Ludo." → default

### running
**Shown when:** fight chosen while a run is going on
> You've got a fight going and the sand's still falling! Get back out there, challenger.

1. "On my way." → close

### Needs a new effect or condition
None. Uses the `arena` condition (`idle`, `rewardsWaiting`), the `arena` effect (`enter`, `claim`), `stat` deduct and `flag`, all built.

## 6. New content

| Kind | ID | One line |
|---|---|---|
| NPC (rename) | `liroldArenaMaster` → "Ludo Crane" | Arena's old champion, now its master and announcer. |
| Thread | T-28 | Where Yad came from (`docs/lore/threads.md`). |
| Art | Ludo Crane portrait | Brief in `docs/character/lirold/ludo-crane.md` (`/generate-2d-asset`). |
