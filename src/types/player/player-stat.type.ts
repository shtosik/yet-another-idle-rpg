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
    | 'extraFireDamage'
    | 'extraAirDamage'
    | 'extraWaterDamage'
    | 'extraEarthDamage'
    | 'extraLightDamage'
    | 'extraDarkDamage'
    | 'extraPhysicalDamage'
    | 'increasedSpellDuration'
    | 'shinyChance'

export const multiplierStats: PlayerStat[] = [
    'critMulti',
    'xpMultiplier',
    'goldCoinsMultiplier',
]

export const percentageState: PlayerStat[] = [
    'critChance',
]
