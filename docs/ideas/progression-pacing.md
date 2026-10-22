# Progression pacing & economy simulation

**Scope:** S-M · **Status:** Accepted (2026-10-22)

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
- **Haste:** a percentage of the current attack interval instead of the flat −0.3 s (flat gets extreme as gear lowers the interval; a percentage stays the same strength). Size −15% to −30%, picked from the simulation.
- **Spells and builds:** magic gear will carry `magicDamage`, `magicDamageMultiplier`, `spellCooldownReduction` (already used by `hit-resolution.ts`); melee gear `attackPower`, `attackSpeed`, `critChance`. Two equipment sets, mage vs attack build. Spell numbers wait for magic gear.

## Economy simulation
`scripts/sim-economy.mjs` prints XP/h, gold/h, kills/h and drops/h per zone and wave for a few player builds (levels 1, 5, 10), from enemy, zone, wave-scaling and respawn data. Flags any wave whose reward per second drops below the previous wave's, and checks the first-hour ladder.

## Touch-points
`scripts/`, `enemies-data.ts`, `zones-data.ts`, `spells-data.ts`, shop prices in `shops-data.ts`.
