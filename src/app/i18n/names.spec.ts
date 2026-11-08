import i18next from 'i18next'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ProfessionID } from '../../enums/ids/profession-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { ReputationID } from '../../enums/reputation-id.enum'
import { displayName, enemyName, itemName, professionName, questName, reputationName, upgradedItemName, upgradedName, zoneName } from './names'

describe('display names', () => {
  beforeEach(() => {
    spyOn(i18next, 't').and.callFake(((key: string, options?: { name?: string; level?: number }) =>
      key === 'items:upgradedName' ? `${options?.name} +${options?.level}` : key) as never)
  })

  it('looks each family up under its own key', () => {
    expect(itemName(ItemID.crabMeat)).toBe('items:names.crabMeat')
    expect(zoneName(ZoneID.plains)).toBe('zones:names.plains')
    expect(questName(QuestID.meatShortage)).toBe('quests:names.meatShortage')
    expect(enemyName(EnemyID.crab)).toBe('enemies:names.crab')
    expect(professionName(ProfessionID.farming)).toBe('app:professions.farming')
    expect(reputationName(ReputationID.laHarpar)).toBe('map:reputations.laHarpar')
  })

  it('adds the upgrade suffix only above level 0', () => {
    expect(upgradedName('Knife', 0)).toBe('Knife')
    expect(upgradedName('Knife', 3)).toBe('Knife +3')
    expect(upgradedItemName(ItemID.crabMeat)).toBe('items:names.crabMeat')
    expect(upgradedItemName(ItemID.crabMeat, 2)).toBe('items:names.crabMeat +2')
    expect(displayName('item', ItemID.crabMeat, 1)).toBe('items:names.crabMeat +1')
    expect(displayName('zone', ZoneID.plains, 5)).toBe('zones:names.plains')
  })
})
