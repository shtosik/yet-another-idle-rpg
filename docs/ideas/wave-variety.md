# Wave variety, wave scaling & boss waves

**Scope:** M · **Status:** Wave scaling accepted (2026-10-22); variety proposed

Later waves in a zone scale enemy HP and rewards; waves can also get a mixed enemy pool, an elite every N waves, and a zone-boss wave with a guaranteed drop.

## Why
Waves inside a zone are identical (repo audit 3.3), and zone HP/XP isn't monotonic across zones. Makes weaknesses, bestiary and shinies more interesting.

## Wave scaling (accepted)
- Scale by position in the zone, so zones with 6 or 20 waves top out the same:
  ```
  t          = (wave - 1) / (maxWave - 1)   // 0 on wave 1, 1 on the last regular wave
  hpMult     = 1 + A_hp     * t
  rewardMult = 1 + A_reward * t             // XP and gold
  ```
- **`A_reward > A_hp`**, so reward per second rises with the wave and pushing pays. Starting point `A_hp = 1.0`, `A_reward = 1.2`; final values from the economy simulation (`progression-pacing.md`).
- **Zones chain:** each zone's base HP and rewards ≈ 2× the previous zone's, so wave 1 of a zone ≈ the last wave of the one before. Rescale `enemies-data.ts` to that (Plains is easier than Horseshoe Beach today; Elderwood Wilds easier than Mountain Pass).
- **Bosses get no wave multiplier**; they scale per zone only.
- **Not scaled:** drop chances, the shiny chance and shiny rewards (×5 XP, ×10 gold, ×10 drop rolls use the unscaled base). Low waves kill faster, so they give more drops and more shiny rolls per hour. High waves = XP and gold; low waves = materials and shinies.
- HP rounds at spawn (`Math.round`); gold rounds up.
- The battle UI shows the current wave's multipliers (e.g. "Wave 7 · HP ×1.67 · Rewards ×1.8").

## Variety (proposed)
Mixed wave pools, elites every N waves, a boss wave with a guaranteed drop.

## Touch-points
`zones-data.ts`, `enemies-data.ts`, `battle.store.ts` (`startBattle`: scaled HP and saved max HP), `player.store.ts` (`processBattleEnd` already gets `currentWave`), battle UI, bestiary tracking.
