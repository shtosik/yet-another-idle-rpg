# Progression pacing & economy simulation

**Scope:** S-M · **Status:** Simulation and first rescale done 2026-10-22 (`feat/gold-selling`); tuning ongoing

Targets for how fast the game opens up, and a script to tune numbers against them.

## Why
Balance today is hand-picked: shop prices far above income, zone difficulty out of order, Haste and Fire Strike weak (known issues #19). An idle game is meant to take long, but the start should open up quickly.

## Decisions
**First hour** — something new every few minutes:

| Time | Unlock |
|---|---|
| ~1–2 min | Camp (first Turtle Shell) |
| ~3 min | skill tree (level 2) |
| ~10–15 min | La Harpar + world map (Horseshoe Beach wave 5) |
| ~20–30 min | first quests done, first shop purchase |
| ~45–60 min | Horseshoe Beach boss → Plains |

After that each zone takes ≈ 1.5–2× the previous one.

- **XP curve:** keep `calculateXp` as it is for now; tune around it.
- **Haste:** a percentage of the current attack interval instead of the flat −0.3 s (flat gets extreme as gear lowers the interval; a percentage stays the same strength). Set to −20% (the simulation does not model spells yet).
- **Spells and builds:** magic gear will carry `magicDamage`, `magicDamageMultiplier`, `spellCooldownReduction` (already used by `hit-resolution.ts`); melee gear `attackPower`, `attackSpeed`, `critChance`. Two equipment sets, mage vs attack build. Spell numbers wait for magic gear.

## Economy simulation
`npm run sim` (`scripts/sim-economy.mjs`) plays the main zone chain once, wave 1 to boss, with a simple build: every level's skill point into attack power (then attack speed), plus assumed gear power per tier (`GEAR_POWER_BY_TIER`). Prints per-zone time, ratio to the previous zone, level and gold; checks the first-hour ladder; flags waves whose reward per second drops more than 5% and zones outside 1.3–2.3× the previous. `--waves` prints HP, s/kill, XP/h and gold/h per wave. Expected values only: no shinies, spells, consumables, drops or side content.

**First run (2026-10-22, after the rescale):** level 2 at 3.9 min, wave 5 at 9.6 min (both on target); zones take 17–110 min, about 1.2–1.8× each, ~6 h to the end of the Upper Canopy. Open:
- **Horseshoe Beach boss at ~17 min, target 45–60.** A straight clear is quicker than the target; La Harpar quests and the Traders' Basement fill the gap for a real player. Either accept that, or slow waves 6–9.
- **Plains ≈ 1.05× Horseshoe Beach**: early levels raise power fastest.
- **Bosses** have 25× mean HP: the Upper Canopy boss takes ~15 min with the assumed build.
- Gold shop prices weren't re-tuned (late income makes 5000-gold items cheap).

## Touch-points
`scripts/`, `enemies-data.ts`, `zones-data.ts`, `spells-data.ts`, shop prices in `shops-data.ts`.
