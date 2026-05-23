export type PlayerStat =
    'mana'
    | 'maxMana'
    | 'attackPower'
    | 'attackSpeed'
    | 'critChance'
    | 'critMulti'
    | 'experience'
    | 'goldCoins'
    | 'level'
    | 'unspentSkillPoints'
    | 'goldCoinsMultiplier'
    | 'manaRegenRate'
    | 'currentManaRegenTimer'
    | 'magicDamage'
    | 'spellCooldownReduction'
    | 'xpMultiplier'
    | 'shopRefreshCooldown'
    | 'currentShopRefreshCooldown'
    | 'extraFireDamageMultiplier'
    | 'extraAirDamageMultiplier'
    | 'extraWaterDamageMultiplier'
    | 'extraEarthDamageMultiplier'
    | 'extraLightDamageMultiplier'
    | 'extraDarkDamageMultiplier'
    | 'extraPhysicalDamageMultiplier'
    | 'increasedSpellDuration'
    | 'shinyChance'

export const multiplierStats: PlayerStat[] = [
    'critMulti',
    'xpMultiplier',
    'goldCoinsMultiplier',
    'extraFireDamageMultiplier',
    'extraAirDamageMultiplier',
    'extraWaterDamageMultiplier',
    'extraEarthDamageMultiplier',
    'extraLightDamageMultiplier',
    'extraDarkDamageMultiplier',
    'extraPhysicalDamageMultiplier',
]

export const percentageState: PlayerStat[] = [
    'critChance',
]
