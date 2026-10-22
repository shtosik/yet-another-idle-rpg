import { Zone } from 'interfaces/zone.interface'

/** HP added by the last regular wave of a zone (1.0 = double HP). */
export const WAVE_HP_SCALING = 1.0
/** XP and gold added by the last regular wave. Above `WAVE_HP_SCALING`, so pushing waves pays per second. */
export const WAVE_REWARD_SCALING = 1.2

export interface WaveMultipliers {
  hp: number
  reward: number
}

/**
 * Scales by position in the zone, so short and long zones top out the same: ×1 on wave 1,
 * full scaling on the last regular wave. The boss wave is not scaled.
 */
export function waveMultipliers(zone: Zone, wave: number): WaveMultipliers {
  const lastRegularWave = zone.maxWave - 1
  if (wave >= zone.maxWave || lastRegularWave <= 1) return { hp: 1, reward: 1 }

  const t = Math.min(1, Math.max(0, (wave - 1) / (lastRegularWave - 1)))
  return { hp: 1 + WAVE_HP_SCALING * t, reward: 1 + WAVE_REWARD_SCALING * t }
}
