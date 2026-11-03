import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, linkedSignal, output, signal } from '@angular/core'
import i18next from 'i18next'
import ITEM_DATA from '../../../../../data/items-data'
import { UPGRADE_CHANCES, UPGRADE_LEVEL_CAP } from '../../../../../data/upgrade-data'
import { EquipmentSlot, EquipmentSlotKey } from '../../../../../enums/equipment-slot.enum'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../../../enums/items/item-tier.enum'
import { ItemType } from '../../../../../enums/items/item-type.enum'
import { EquipmentItem } from '../../../../../interfaces/player/equipment.type'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { StatToPercentagePipe } from '../../../../pipes/stat-to-percentage.pipe'
import { stackKey } from '../../../../store/player/inventory'
import { evaluateMerge, mergeCost, MergeSource } from '../../../../store/player/merge'
import { PlayerStore } from '../../../../store/player/player.store'
import { gearModifiers } from '../../../../store/player/stats'
import { NgOptimizedImage } from '@angular/common'
import { SlotComponent } from '../../../shared/slot/slot.component'
import { InventoryItemComponent } from '../../inventory/inventory-slot/inventory-slot.component'
import { tabName } from '../../inventory/tab-text'

interface ForgeChoice {
  key: string
  source: MergeSource
  amount: number
}

interface ForgeGroup {
  key: string
  item: EquipmentItem
  amount: number
  choices: ForgeChoice[]
}

const EQUIPMENT_SLOTS = [
  'helmet', 'amulet', 'chest', 'cape', 'weapon', 'belt', 'gloves', 'ring', 'legs', 'pet', 'boots',
] satisfies EquipmentSlotKey[]
const TOAST_MS = 3000

@Component({
  selector: 'app-forge',
  templateUrl: './forge.component.html',
  styleUrl: './forge.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe, StatToPercentagePipe, SlotComponent, InventoryItemComponent, NgOptimizedImage],
})
export class ForgeComponent {
  private playerStore = inject(PlayerStore)
  closed = output<void>()
  protected readonly ITEM_DATA = ITEM_DATA
  readonly levelCap = UPGRADE_LEVEL_CAP
  gold = this.playerStore.resources.goldCoins

  /** Keep blocked gear visible so its refusal can be explained; pets never enter the Forge. */
  groups = computed(() => {
    const groups = new Map<string, ForgeGroup>()
    const add = (item: EquipmentItem, choice: ForgeChoice): void => {
      const data = ITEM_DATA[item.id]
      if (data.type !== ItemType.equipment || data.slot === EquipmentSlot.pet) return
      const key = stackKey(item)
      const group = groups.get(key) ?? { key, item, amount: 0, choices: [] }
      group.amount += choice.amount
      const existing = group.choices.find(c => c.key === choice.key)
      if (existing) existing.amount += choice.amount
      else group.choices.push(choice)
      groups.set(key, group)
    }
    for (const stack of Object.values(this.playerStore.inventory()).flat()) {
      if (stack) add(stack, { key: 'inventory', source: { from: 'inventory', item: stack }, amount: stack.amount })
    }
    const equipment = this.playerStore.equipment()
    for (const slot of EQUIPMENT_SLOTS) {
      const item = equipment[slot]
      if (item) add(item, { key: slot, source: { from: 'equipped', slot }, amount: 1 })
    }
    return [...groups.values()]
  })

  private selectedKey = signal<string | null>(null)
  selectedGroup = computed(() => this.groups().find(g => g.key === this.selectedKey()) ?? this.groups()[0] ?? null)
  base = linkedSignal(() => {
    const choices = this.selectedGroup()?.choices ?? []
    return choices.find(c => c.source.from === 'equipped') ?? choices[0] ?? null
  })
  sacrificeChoices = computed(() => {
    const base = this.base()
    return (this.selectedGroup()?.choices ?? []).filter(choice => {
      if (choice.key !== base?.key) return true
      return choice.source.from === 'inventory' && choice.amount >= 2
    })
  })
  sacrifice = linkedSignal(() => this.sacrificeChoices()[0] ?? null)

  evaluation = computed(() => {
    const group = this.selectedGroup()
    const base = this.base()
    if (!group || !base) return null
    // A missing second copy still goes through the shared evaluator, so the button uses its refusal.
    const sacrifice: MergeSource = this.sacrifice()?.source ?? { from: 'inventory', item: group.item }
    return evaluateMerge({
      base: base.source, sacrifice, inventory: this.playerStore.inventory(), equipment: this.playerStore.equipment(),
      capacity: this.playerStore.inventoryCapacity(), goldCoins: this.gold(),
    })
  })
  cost = computed(() => {
    const item = this.selectedGroup()?.item
    if (!item) return 0
    return mergeCost(ITEM_DATA[item.id].value, item.upgradeLevel)
  })
  chance = computed(() => UPGRADE_CHANCES[(this.selectedGroup()?.item.upgradeLevel ?? 0) + 1] ?? 0)
  statPreview = computed(() => {
    const item = this.selectedGroup()?.item
    if (!item) return []
    const after = gearModifiers({ ...item, upgradeLevel: (item.upgradeLevel ?? 0) + 1 })
    return gearModifiers(item).map((modifier, index) => ({ ...modifier, after: after[index].amount }))
  })

  toast = signal<string | null>(null)
  private toastTimer?: ReturnType<typeof setTimeout>

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.toastTimer))
  }

  selectGroup(group: ForgeGroup): void {
    this.selectedKey.set(group.key)
  }

  chooseBase(key: string): void {
    this.base.set(this.selectedGroup()?.choices.find(c => c.key === key) ?? null)
  }

  chooseSacrifice(key: string): void {
    this.sacrifice.set(this.sacrificeChoices().find(c => c.key === key) ?? null)
  }

  itemName(item: EquipmentItem): string {
    const name = i18next.t(`items:names.${ItemID[item.id]}`)
    const level = item.upgradeLevel ?? 0
    return level > 0 ? i18next.t('items:upgradedName', { name, level }) : name
  }

  groupLabel(group: ForgeGroup): string {
    return i18next.t('forge:group', {
      item: this.itemName(group.item), tier: i18next.t(`items:tiers.${ItemTier[group.item.tier]}`), count: group.amount,
    })
  }

  choiceLabel(choice: ForgeChoice): string {
    switch (choice.source.from) {
      case 'inventory': return i18next.t('forge:inventoryCopy', { count: choice.amount })
      case 'equipped': return i18next.t('forge:equippedCopy', {
        slot: i18next.t(`app:equipment.slots.${choice.source.slot}`),
      })
    }
  }

  mergeLabel(): string {
    const evaluation = this.evaluation()
    if (!evaluation) return i18next.t('forge:selectGear')
    if (evaluation.status === 'ready') return i18next.t('forge:merge')
    switch (evaluation.reason) {
      case 'missingCopy': return i18next.t('forge:missingCopy')
      case 'mismatch': return i18next.t('forge:mismatch')
      case 'notEquipment':
      case 'pet': return i18next.t('forge:notUpgradable')
      case 'unique': return i18next.t('forge:unique')
      case 'atCap': return i18next.t('forge:atCap', { level: this.levelCap })
      case 'notEnoughGold': return i18next.t('forge:notEnoughGold')
      case 'inventoryFull': return i18next.t('forge:inventoryFull', { tab: tabName(evaluation.tab) })
    }
  }

  merge(): void {
    const group = this.selectedGroup()
    const base = this.base()
    const sacrifice = this.sacrifice()
    if (!group || !base || !sacrifice || this.evaluation()?.status !== 'ready') return
    const result = this.playerStore.mergeItem(base.source, sacrifice.source)
    if (result.status === 'refused') return
    const item = { ...group.item, upgradeLevel: (group.item.upgradeLevel ?? 0) + 1 }
    if (result.status === 'success') this.selectedKey.set(stackKey(item))
    const name = this.itemName(result.status === 'success' ? item : group.item)
    clearTimeout(this.toastTimer)
    this.toast.set(i18next.t(`forge:${result.status}`, { item: name }))
    this.toastTimer = setTimeout(() => this.toast.set(null), TOAST_MS)
  }
}
