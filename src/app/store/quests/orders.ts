import { ItemID } from '../../../enums/ids/item-id.enum'
import { OrderEntry, RepeatProps } from '../../../data/quests-data'

/** The rewards of one order, base values: multiplier stats are applied when it is completed. */
export interface OrderRewards {
  reputation: number
  gold: number
  farmingXp: number
}

/** A started repeatable order: what it asks for and what it pays, both rolled once at start and saved. */
export interface OrderState {
  requirements: { itemId: ItemID, amount: number }[]
  rewards: OrderRewards
}

export type Orders = Partial<Record<number, OrderState>>

export const ORDER_MIN_AMOUNT = 10
export const ORDER_MAX_AMOUNT = 20

/** Base rewards of `amount` of one pool entry (docs/ideas/farm-and-husbandry.md §4a). */
const entryRewards = (entry: OrderEntry, amount: number): OrderRewards => ({
  reputation: Math.ceil(amount / 10 * entry.reputationPer10),
  gold: amount * entry.goldPerItem,
  farmingXp: Math.round(amount * entry.xpPerItem),
})

/**
 * Rolls `picks` distinct entries of `eligible`, each in an amount of 10 to 20. Null when fewer are eligible than
 * `picks`, so the order cannot start. `random` is injectable for tests.
 */
export function rollOrder(repeat: RepeatProps, eligible: OrderEntry[], random = Math.random): OrderState | null {
  if (eligible.length < repeat.picks) return null

  const left = [...eligible]
  const state: OrderState = { requirements: [], rewards: { reputation: 0, gold: 0, farmingXp: 0 } }
  for (let i = 0; i < repeat.picks; i++) {
    const entry = left.splice(Math.floor(random() * left.length), 1)[0]
    const amount = ORDER_MIN_AMOUNT + Math.floor(random() * (ORDER_MAX_AMOUNT - ORDER_MIN_AMOUNT + 1))
    const rewards = entryRewards(entry, amount)
    state.requirements.push({ itemId: entry.itemId, amount })
    state.rewards.reputation += rewards.reputation
    state.rewards.gold += rewards.gold
    state.rewards.farmingXp += rewards.farmingXp
  }
  return state
}
