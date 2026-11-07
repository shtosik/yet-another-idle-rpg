import { EquipmentType } from 'interfaces/player/equipment.type'
import type { PlayerStatsType } from './stats'

export const statsInitialState: PlayerStatsType = {
    // exp
    experience: 0,
    xpMultiplier: 1,
    level: 1,
    unspentSkillPoints: 0,
    // gold
    goldCoins: 0,
    goldCoinsMultiplier: 1,
    foodEffectMultiplier: 1,
    // attack
    attackPower: 1,
    attackSpeed: 3,
    meleeDamageMultiplier: 1,
    // magic
    magicDamage: 0,
    magicDamageMultiplier: 1,
    mana: 5,
    maxMana: 5,
    manaRegenRate: 30 * 1000, // 30 seconds
    spellCooldownReduction: 0,
    increasedSpellDuration: 0,
    // crit
    critChance: 0,
    critMulti: 1.2,
    // damage type multipliers (applied when player hits an enemy's weakness)
    extraFireDamageMultiplier: 1.2,
    extraAirDamageMultiplier: 1.2,
    extraWaterDamageMultiplier: 1.2,
    extraDarkDamageMultiplier: 1.2,
    extraEarthDamageMultiplier: 1.2,
    extraLightDamageMultiplier: 1.2,
    extraPhysicalDamageMultiplier: 1.2,
    // shop?
    shopRefreshCooldown: 1000 * 60 * 60, // 1 hour (base, reducible by items/skills)
    currentShopRefreshCooldown: 0,
    // shiny
    shinyChance: 0,
    // inventory
    inventorySlots: 20, // per slot tab (Gear, Consumables, Materials)
    // Exploration Guild
    maxTaskSlots: 1,
    taskDoubleKillChance: 0, // percent: chance a kill counts twice toward tasks
    upgradedDropChance: 0, // percent: chance non-unique gear (excluding pets) drops at +1
    // Offline progress: fraction of the online kill rate earned while away
    offlineProgressRate: 0.5,
    // farming (additive fractions: 0.1 = 10%); sources are Farming expertise and the Exalted pet
    seedGrowthTimeReduction: 0,
    farmDoubleHarvestChance: 0,
    farmSeedSaveChance: 0,
    farmBonusCropChance: 0,
    turnInCooldownReduction: 0,
    farmXpMultiplier: 0,
    seedDropChance: 0,
    // damage vs enemy type (additive, fraction: 0.2 = +20% of total damage)
    damageVsCrab: 0,
    damageVsBird: 0,
    damageVsHuman: 0,
    damageVsDog: 0,
    damageVsMammal: 0,
    damageVsReptile: 0,
    damageVsCrustacean: 0,
    damageVsGoblin: 0,
    damageVsHumanoid: 0,
    damageVsTroll: 0,
    damageVsSlime: 0,
    damageVsRodent: 0,
    damageVsRat: 0,
    damageVsBandit: 0,
    damageVsSpider: 0,
    damageVsArachnid: 0,
    damageVsGnoll: 0,
    damageVsPlant: 0,
    damageVsTreant: 0,
    damageVsBear: 0,
    damageVsUndead: 0,
    damageVsHarpy: 0,
}

export const initialEquipmentState: EquipmentType = {
    weapon: null,
    cape: null,
    belt: null,
    gloves: null,
    helmet: null,
    chest: null,
    legs: null,
    boots: null,
    amulet: null,
    ring: null,
    pet: null,
}
