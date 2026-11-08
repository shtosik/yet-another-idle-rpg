import ITEM_DATA from '../../../data/items-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { calculateXp } from './experience'
import { addItems, createInventories, inventoryCapacity } from './inventory'
import { evaluateMerge, MergeContext, mergeCost } from './merge'
import { initialEquipmentState } from './player'
import { addResources, Held, manaRegen, spendResource } from './resources'
import { initialResources } from './stats'

const held = (over: Partial<Held> = {}): Held => ({ ...initialResources(), explorerTokens: 0, ...over })

describe('resources', () => {
  it('levels up several times from one XP change and keeps the leftover', () => {
    const xp = calculateXp(2) + calculateXp(3) + calculateXp(4) + 7
    const { held: after, gain } = addResources(held({ level: 1 }), { experience: xp }, 5)
    expect(after.level).toBe(4)
    expect(after.experience).toBe(7)
    expect(gain.levelsGained).toBe(3)
  })

  it('grants one skill point per level gained', () => {
    const { held: after, gain } = addResources(held({ level: 1, unspentSkillPoints: 2 }), { experience: calculateXp(2) + calculateXp(3) }, 5)
    expect(after.unspentSkillPoints).toBe(4)
    expect(gain.skillPointsGained).toBe(2)
  })

  it('counts stored mana above maxMana as maxMana', () => {
    expect(addResources(held({ mana: 50 }), { mana: 10 }, 30).held.mana).toBe(30)
    const spent = addResources(held({ mana: 50 }), { mana: -5 }, 30)
    expect(spent.held.mana).toBe(25)
    expect(spent.gain.mana).toBe(-5)
    expect(addResources(held({ mana: 3 }), { mana: -10 }, 30).held.mana).toBe(0)
  })

  it('regenerates mana up to maxMana and restarts the timer when full', () => {
    const { held: after, timer, gain } = manaRegen(held({ mana: 3 }), 0, 2500, { maxMana: 5, manaRegenRate: 1000 })
    expect([after.mana, timer, gain.mana]).toEqual([5, 0, 2])
    expect(manaRegen(held({ mana: 8 }), 400, 1000, { maxMana: 5, manaRegenRate: 1000 }).timer).toBe(0)
  })

  it('refuses a spend that would go below zero and changes nothing', () => {
    const before = held({ goldCoins: 10, explorerTokens: 2 })
    expect(spendResource(before, 'gold', 11)).toBeNull()
    expect(spendResource(before, 'explorerTokens', 3)).toBeNull()
    expect(spendResource(before, 'gold', -1)).toBeNull()
    expect(before).toEqual(held({ goldCoins: 10, explorerTokens: 2 }))
    const spent = spendResource(before, 'gold', 10)
    expect(spent?.held.goldCoins).toBe(0)
    expect(spent?.gain.gold).toBe(-10)
  })

  it('refuses a merge exactly when spending its cost would be refused', () => {
    const id = ItemID.woodenBow
    const bow = { id, tier: ITEM_DATA[id].tier, type: ITEM_DATA[id].type, amount: 1 }
    const capacity = inventoryCapacity([])
    const cost = mergeCost(ITEM_DATA[id].value)
    const context = (goldCoins: number): MergeContext => ({
      base: { from: 'inventory', item: bow }, sacrifice: { from: 'inventory', item: bow },
      inventory: addItems(createInventories(), capacity, [{ ...bow, amount: 2 }]),
      equipment: { ...initialEquipmentState }, capacity, goldCoins,
    })
    for (const gold of [cost - 1, cost]) {
      const refused = evaluateMerge(context(gold)).status === 'refused'
      expect(refused).toBe(spendResource(held({ goldCoins: gold }), 'gold', cost) === null)
    }
  })
})
