import { EquipmentSlotKey } from 'enums/equipment-slot.enum'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'
import { PlayerStatsType } from './player.store'

export const statsInitialState: PlayerStatsType = {
    // exp
    experience: 0,
    xpMultiplier: 1,
    level: 1,
    unspentSkillPoints: 0,
    // gold
    goldCoins: 0,
    goldCoinsMultiplier: 1,
    // attack
    attackPower: 1,
    attackSpeed: 3,
    // magic
    magicDamage: 0,
    mana: 5,
    maxMana: 5,
    currentManaRegenTimer: 0,
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

export const initialEquipmentState: Record<EquipmentSlotKey, { id: ItemID, tier: ItemTier } | null> = {
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
