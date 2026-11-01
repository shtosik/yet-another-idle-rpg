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
    | 'foodEffectMultiplier'
    | 'manaRegenRate'
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
    | 'damageVsCrab'
    | 'damageVsBird'
    | 'damageVsHuman'
    | 'damageVsDog'
    | 'damageVsMammal'
    | 'damageVsReptile'
    | 'damageVsCrustacean'
    | 'damageVsGoblin'
    | 'damageVsHumanoid'
    | 'damageVsTroll'
    | 'damageVsSlime'
    | 'damageVsRodent'
    | 'damageVsRat'
    | 'damageVsBandit'
    | 'damageVsSpider'
    | 'damageVsArachnid'
    | 'damageVsGnoll'
    | 'damageVsPlant'
    | 'damageVsTreant'
    | 'damageVsBear'
    | 'damageVsUndead'
    | 'damageVsHarpy'
    | 'magicDamageMultiplier'
    | 'meleeDamageMultiplier'
    | 'inventorySlots'
    | 'maxTaskSlots'
    | 'taskDoubleKillChance'
    | 'offlineProgressRate'

export const multiplierStats: PlayerStat[] = [
    'critMulti',
    'xpMultiplier',
    'goldCoinsMultiplier',
    'foodEffectMultiplier',
    'extraFireDamageMultiplier',
    'extraAirDamageMultiplier',
    'extraWaterDamageMultiplier',
    'extraEarthDamageMultiplier',
    'extraLightDamageMultiplier',
    'extraDarkDamageMultiplier',
    'extraPhysicalDamageMultiplier',
    'magicDamageMultiplier',
    'meleeDamageMultiplier',
]

export const percentageStats: PlayerStat[] = [
    'critChance',
]

export const additivePercentStats: PlayerStat[] = [
    'damageVsCrab',
    'damageVsBird',
    'damageVsHuman',
    'damageVsDog',
    'damageVsMammal',
    'damageVsReptile',
    'damageVsCrustacean',
    'damageVsGoblin',
    'damageVsHumanoid',
    'damageVsTroll',
    'damageVsSlime',
    'damageVsRodent',
    'damageVsRat',
    'damageVsBandit',
    'damageVsSpider',
    'damageVsArachnid',
    'damageVsGnoll',
    'damageVsPlant',
    'damageVsTreant',
    'damageVsBear',
    'damageVsUndead',
    'damageVsHarpy',
]
