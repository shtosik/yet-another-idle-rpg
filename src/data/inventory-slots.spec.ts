import ITEM_DATA from 'data/items-data'
import { ALL_SKILLS } from 'data/skill-tree-data'
import { SLOT_TABS } from '../app/store/player/inventory'
import { statsInitialState } from '../app/store/player/player'

/**
 * Pins the most slots each tab can reach: the base, every item with an `inventorySlots` stat and every skill node
 * at max level. Lowering a source shrinks tabs in existing saves, so it needs a save migration (AGENTS.md,
 * player-stats-inventory-equipment.md). Adding a source raises the pin; update it here on purpose.
 */
const MAX_SLOTS_PER_TAB = 31 // 20 base + 2 Guild Satchel + 1 Pack Rat + 2 Bottomless Pack + 6 tab pouches

describe('inventory slot sources', () => {
  const itemSlots = Object.values(ITEM_DATA).reduce((sum, item) => {
    const stats = 'stats' in item ? item.stats : []
    return sum + stats.filter(s => s.id === 'inventorySlots').reduce((n, s) => n + s.amount, 0)
  }, 0)
  const nodes = Object.values(ALL_SKILLS).filter(n => n !== undefined && 'stat' in n && n.stat === 'inventorySlots')

  it('keeps every tab at its pinned maximum', () => {
    for (const tab of SLOT_TABS) {
      const nodeSlots = nodes
        .filter(n => !('tab' in n && n.tab) || n.tab === tab)
        .reduce((sum, n) => sum + ('statAmount' in n ? n.statAmount ?? 0 : 0) * n.maxLevel, 0)
      expect(statsInitialState.inventorySlots + itemSlots + nodeSlots).toBe(MAX_SLOTS_PER_TAB)
    }
  })
})
