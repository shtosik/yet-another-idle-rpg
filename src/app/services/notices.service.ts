import { inject, Injectable, Signal, signal } from '@angular/core'
import i18next from 'i18next'
import { QuestProps } from '../../data/quests-data'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ProfessionID } from '../../enums/ids/profession-id.enum'
import { ReputationID } from '../../enums/reputation-id.enum'
import { ReputationTier } from '../../enums/reputation-tier.enum'
import { EquipmentItem } from '../../interfaces/player/equipment.type'
import { formatStat } from '../components/game/player-stats/stat-rows'
import { InventoryTab, ItemStack, tabOf } from '../store/player/inventory'
import type { ProfessionGain } from '../store/player/player.store'
import { TierUp } from '../store/player/reputation'
import { ResourceGain } from '../store/player/resources'
import { expertiseGain } from '../store/player/stats'
import { CurrencyFeedService } from './currency-feed.service'
import { ModalService } from './modal.service'

/** Something that happened, reported by the store or service that did it. Notices decides how it is shown. */
export type Notice =
  | { type: 'tierUp', tierUps: TierUp[] }
  | { type: 'expertiseUp', gain: ProfessionGain }
  | { type: 'dropsLost', lost: ItemStack[] }
  | { type: 'seedsFound', seeds: ItemStack[] }
  | { type: 'crafted', itemId: ItemID, count: number }
  | { type: 'merged', status: 'success' | 'failure', item: EquipmentItem }
  | { type: 'stationInstalled', itemId: ItemID }
  | { type: 'questCompleted', quest: QuestProps }
  | { type: 'currency', gain: ResourceGain }

/** Where a toast shows; each lane holds one message at a time. */
export type ToastLane = 'hud' | 'hudBelow' | 'battle' | 'battleBelow' | 'camp' | 'forge'

const LANE_MS: Record<ToastLane, number> = { hud: 4000, hudBelow: 4000, battle: 3000, battleBelow: 3000, camp: 1800, forge: 3000 }

const itemName = (id: ItemID): string => i18next.t(`items:names.${ItemID[id]}`)

/**
 * The one place that shows what happened: toasts (one timer per lane, a new toast replaces the old one), modals and
 * currency feed lines. Stores and services push notices; they never run a toast timer or open these modals themselves.
 */
@Injectable({ providedIn: 'root' })
export class NoticesService {
  private modal = inject(ModalService)
  private feed = inject(CurrencyFeedService)
  private lanes = new Map<ToastLane, { text: ReturnType<typeof signal<string | null>>, timer?: ReturnType<typeof setTimeout> }>()

  /** The lane's current message, null when nothing shows. */
  toast(lane: ToastLane): Signal<string | null> {
    return this.lane(lane).text.asReadonly()
  }

  push(notice: Notice): void {
    switch (notice.type) {
      case 'tierUp':
        if (notice.tierUps.length) this.show('hud', notice.tierUps.map(tierUpLine).join('\n'))
        return
      case 'expertiseUp':
        if (notice.gain.to > notice.gain.from) this.show('hudBelow', expertiseLine(notice.gain))
        return
      case 'dropsLost':
        if (notice.lost.length) this.show('battle', dropsLostText(notice.lost))
        return
      case 'seedsFound':
        if (notice.seeds.length) this.show('battleBelow', i18next.t('map:farm.seedFound', {
          seeds: notice.seeds.map(({ id, amount }) => `${itemName(id)} x${amount}`).join(', '),
        }))
        return
      case 'crafted':
        this.show('camp', i18next.t('camp:crafted', { count: notice.count, item: itemName(notice.itemId) }))
        return
      case 'merged':
        this.show('forge', i18next.t(`forge:${notice.status}`, { item: upgradedItemName(notice.item) }))
        return
      case 'stationInstalled':
        this.modal.openStationInstalled(notice.itemId)
        return
      case 'questCompleted':
        this.modal.openQuestCompleted(notice.quest)
        return
      case 'currency':
        this.feed.show('gold', notice.gain.gold)
        this.feed.show('explorerTokens', notice.gain.tokens)
        return
    }
  }

  private show(lane: ToastLane, text: string): void {
    const entry = this.lane(lane)
    clearTimeout(entry.timer)
    entry.text.set(text)
    entry.timer = setTimeout(() => entry.text.set(null), LANE_MS[lane])
  }

  private lane(lane: ToastLane) {
    let entry = this.lanes.get(lane)
    if (!entry) this.lanes.set(lane, entry = { text: signal<string | null>(null) })
    return entry
  }
}

function tierUpLine({ reputationId, tier }: TierUp): string {
  return i18next.t('quests:reputation.tierUp', {
    town: i18next.t(`map:reputations.${ReputationID[reputationId]}`),
    tier: i18next.t(`quests:reputation.tiers.${ReputationTier[tier]}`),
  })
}

/** "Farming expertise 10: +5% ..., +1 skill point". */
function expertiseLine({ professionId, from, to, skillPoints }: ProfessionGain): string {
  const rewards = expertiseGain(professionId, from, to).map(({ stat, amount }) =>
    `+${formatStat('bonus', amount)} ${i18next.t(`app:playerStats.${stat}`)}`)
  if (skillPoints > 0) rewards.push(i18next.t('app:expertise.skillPoints', { count: skillPoints }))
  return i18next.t('app:expertise.levelUp', {
    expertise: i18next.t('app:expertise.label', { profession: i18next.t(`app:professions.${ProfessionID[professionId]}`), level: to }),
    rewards: rewards.join(', '),
  })
}

/** One line per inventory tab that was full. */
function dropsLostText(lost: ItemStack[]): string {
  const byTab = new Map<InventoryTab, string[]>()
  for (const { id, amount } of lost) {
    const tab = tabOf(id)
    const name = itemName(id)
    byTab.set(tab, [...(byTab.get(tab) ?? []), amount > 1 ? `${name} x${amount}` : name])
  }
  return [...byTab].map(([tab, names]) =>
    i18next.t('app:inventory.dropsLost', { tab: i18next.t(`app:inventory.tabs.${tab}`), items: names.join(', ') })).join('\n')
}

function upgradedItemName(item: EquipmentItem): string {
  const name = itemName(item.id)
  const level = item.upgradeLevel ?? 0
  return level > 0 ? i18next.t('items:upgradedName', { name, level }) : name
}
