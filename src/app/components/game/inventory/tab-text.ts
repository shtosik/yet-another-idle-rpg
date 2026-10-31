import i18next from 'i18next'
import type { InventoryTab, MissingSlots } from '../../../store/player/inventory'

export const tabName = (tab: InventoryTab): string => i18next.t(`app:inventory.tabs.${tab}`)

/** "2 Materials slots, 1 Gear slot": what each tab still has to free. */
export const missingSlotsText = (missing: MissingSlots): string =>
  (Object.entries(missing) as [InventoryTab, number][])
    .map(([tab, count]) => i18next.t('app:inventory.tabSlots', { count, tab: tabName(tab) }))
    .join(', ')
