import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import i18next from 'i18next'
import { ForgeComponent } from './forge.component'
import { InventoryWindow } from '../../inventory/inventory.component'
import { EquipmentComponent } from '../../equipment/equipment.component'
import { ForgeSelection } from '../../../../services/forge-selection'
import { TownsStore } from '../../../../store/towns/towns.store'
import { PlayerStore } from '../../../../store/player/player.store'
import { tabOf } from '../../../../store/player/inventory'
import { mergeCost } from '../../../../store/player/merge'
import ITEM_DATA from '../../../../../data/items-data'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../../../enums/items/item-tier.enum'
import { ShopID } from '../../../../../enums/ids/shop-id.enum'
import { InventoryItem } from '../../../../../interfaces/item.interface'
import forgeText from '../../../../../assets/locales/en/forge.json'
import appText from '../../../../../assets/locales/en/app.json'
import itemText from '../../../../../assets/locales/en/items.json'

describe('Forge panel and gear sources', () => {
  let fixture: ComponentFixture<ForgeComponent>
  let forge: ForgeComponent
  let player: InstanceType<typeof PlayerStore>
  let towns: InstanceType<typeof TownsStore>
  let selection: ForgeSelection
  const id = ItemID.woodenBow
  const tier = ITEM_DATA[id].tier
  const stack = (amount = 2, upgradeLevel = 0, itemId = id): InventoryItem => ({
    id: itemId, tier: ITEM_DATA[itemId].tier, type: ITEM_DATA[itemId].type, amount, upgradeLevel,
  })
  const select = (item = stack()) => selection.select({ from: 'inventory', item })
  const mergeButton = (): HTMLButtonElement => fixture.nativeElement.querySelector('.forge__merge')

  beforeEach(async () => {
    localStorage.clear()
    await i18next.init({ lng: 'en', resources: { en: { forge: forgeText, app: appText, items: itemText } } })
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
    towns = TestBed.inject(TownsStore)
    selection = TestBed.inject(ForgeSelection)
    towns.openForge()
    fixture = TestBed.createComponent(ForgeComponent)
    forge = fixture.componentInstance
  })
  afterEach(() => localStorage.clear())

  async function expectBlocked(label: string): Promise<void> {
    await fixture.whenStable()
    const button = mergeButton()
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.textContent.trim()).toBe('Merge')
    expect(button.getAttribute('aria-label')).toContain(label)
    const merge = spyOn(player, 'mergeItem').and.callThrough()
    button.click()
    expect(merge).not.toHaveBeenCalled()
  }

  async function drag(source: HTMLElement): Promise<void> {
    const dataTransfer = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }))
    const input: HTMLElement = fixture.nativeElement.querySelector('.forge__input')
    const over = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer })
    input.dispatchEvent(over)
    expect(over.defaultPrevented).toBeTrue()
    input.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }))
    source.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer }))
    await fixture.whenStable()
  }

  it('starts empty and explains how to select gear', async () => {
    expect(forge.item()).toBeNull()
    expect(forge.preview()).toBeNull()
    await expectBlocked('Select gear')
  })

  it('shows a gold refusal in the accessible label while retaining the compact Merge text', async () => {
    player.addItems([stack()])
    select()
    expect(forge.evaluation()).toEqual({ status: 'refused', reason: 'notEnoughGold' })
    await expectBlocked('Not enough gold')
  })

  it('explains unique gear', async () => {
    player.addItems([stack(2, 0, ItemID.joshsHeirloom)])
    select(stack(2, 0, ItemID.joshsHeirloom))
    await expectBlocked('Unique gear cannot be upgraded')
  })

  it('explains the cap without previewing an unavailable +6', async () => {
    player.addItems([stack(2, 5)])
    select(stack(2, 5))
    expect(forge.preview()).toBeNull()
    await expectBlocked('Already at +5 cap')
  })

  it('requires an inventory sacrifice when the sole copy is equipped', async () => {
    player.addItems([stack(1)])
    player.equipItem(stack(1))
    selection.select({ from: 'equipped', slot: 'weapon' })
    await expectBlocked('No second matching copy')
  })

  it('does not count another rarity or upgrade level as the matching copy', async () => {
    player.addItems([stack(1), stack(1, 1), { ...stack(1), tier: ItemTier.legendary }])
    select(stack(1))
    await expectBlocked('No second matching copy')
  })

  it('names the full inventory tab from evaluateMerge', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack(3)])
    player.addItems(Object.values(ITEM_DATA).filter(data => tabOf(data.id) === 'gear' && data.id !== id)
      .slice(0, player.inventoryCapacity().gear - 1).map(data => ({ id: data.id, amount: 1 })))
    select(stack(3))
    expect(forge.evaluation()).toEqual({ status: 'refused', reason: 'inventoryFull', tab: 'gear' })
    await expectBlocked('Inventory full: Gear tab')
  })

  it('drops inventory gear, automatically uses a matching equipped base, previews milestone stats and merges in place', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack(2, 4)])
    player.equipItem(stack(1, 4))
    const inventory = TestBed.createComponent(InventoryWindow)
    await inventory.whenStable()
    await fixture.whenStable()
    await drag(inventory.nativeElement.querySelector('.item__action'))
    expect(forge.base()).toEqual({ from: 'equipped', slot: 'weapon' })
    expect(forge.sacrifice()?.from).toBe('inventory')
    expect(forge.cost()).toBe(mergeCost(ITEM_DATA[id].value, 4))
    expect(forge.chance()).toBe(1)
    expect(forge.statPreview()).toContain({ stat: 'attackPower', amount: 4.2, after: 5.25 })
    expect(fixture.nativeElement.querySelector('.forge__output').getAttribute('aria-label')).toContain('Wooden Bow +5')
    expect(player.equipment().weapon?.upgradeLevel).toBe(4)
    expect(player.itemCount(id, tier, 4)).toBe(1)
    mergeButton().click()
    await fixture.whenStable()
    expect(player.equipment().weapon?.upgradeLevel).toBe(5)
    expect(player.itemCount(id, tier, 4)).toBe(0)
    expect(player.resources.goldCoins()).toBe(100000 - mergeCost(ITEM_DATA[id].value, 4))
    expect(forge.item()?.upgradeLevel).toBe(5)
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Merge succeeded: Wooden Bow +5')
    expect(selection.dragged()).toBeNull()
  })

  it('drops an equipped copy as the base and consumes one matching inventory copy', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack(3)])
    player.equipItem(stack(1))
    const equipment = TestBed.createComponent(EquipmentComponent)
    await equipment.whenStable()
    await fixture.whenStable()
    await drag(equipment.nativeElement.querySelector('[style*="weapon"] button'))
    expect(forge.base()).toEqual({ from: 'equipped', slot: 'weapon' })
    mergeButton().click()
    expect(player.equipment().weapon?.upgradeLevel).toBe(1)
    expect(player.itemCount(id, tier, 0)).toBe(1)
  })

  it('merges two copies from one inventory stack and follows the result', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack()])
    const inventory = TestBed.createComponent(InventoryWindow)
    await inventory.whenStable()
    await fixture.whenStable()
    await drag(inventory.nativeElement.querySelector('.item__action'))
    expect(forge.base()?.from).toBe('inventory')
    forge.merge()
    expect(player.itemCount(id, tier)).toBe(0)
    expect(player.itemCount(id, tier, 1)).toBe(1)
    await expectBlocked('No second matching copy')
  })

  it('ignores external drops without an in-game source', async () => {
    await fixture.whenStable()
    fixture.nativeElement.querySelector('.forge__input').dispatchEvent(new DragEvent('drop', { dataTransfer: new DataTransfer() }))
    expect(forge.item()).toBeNull()
  })

  it('uses click and keyboard activation to select inventory gear instead of equipping it', async () => {
    player.addItems([stack()])
    const inventory = TestBed.createComponent(InventoryWindow)
    await inventory.whenStable()
    const button: HTMLButtonElement = inventory.nativeElement.querySelector('.item__action')
    for (const detail of [1, 0]) {
      selection.selected.set(null)
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))
      expect(forge.item()?.id).toBe(id)
      expect(player.equipment().weapon).toBeNull()
    }
  })

  it('uses click and keyboard activation to select equipment instead of unequipping it', async () => {
    player.addItems([stack()])
    player.equipItem(stack(1))
    const equipment = TestBed.createComponent(EquipmentComponent)
    await equipment.whenStable()
    const button: HTMLButtonElement = equipment.nativeElement.querySelector('[style*="weapon"] button')
    for (const detail of [1, 0]) {
      selection.selected.set(null)
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))
      expect(selection.selected()).toEqual({ from: 'equipped', slot: 'weapon' })
      expect(player.equipment().weapon?.id).toBe(id)
    }
  })

  it('switches to Gear, visibly locks the other tabs with explanations, blocks keyboard navigation, and unlocks on close', async () => {
    towns.closeForge()
    const inventory = TestBed.createComponent(InventoryWindow)
    inventory.componentInstance.selectTab('materials')
    await inventory.whenStable()
    towns.openForge()
    await inventory.whenStable()
    expect(inventory.componentInstance.tab()).toBe('gear')
    const materials: HTMLButtonElement = inventory.nativeElement.querySelector('#inventory-tab-materials')
    expect(materials.getAttribute('aria-disabled')).toBe('true')
    expect(materials.title).toContain('Close the Forge')
    materials.click()
    inventory.componentInstance.onTabKeydown(new KeyboardEvent('keydown', { key: 'End' }))
    expect(inventory.componentInstance.tab()).toBe('gear')
    towns.closeForge()
    await inventory.whenStable()
    expect(materials.getAttribute('aria-disabled')).toBe('false')
    materials.click()
    expect(inventory.componentInstance.tab()).toBe('materials')
  })

  it('unlocks inventory tabs when another shop replaces the Forge', async () => {
    const inventory = TestBed.createComponent(InventoryWindow)
    await inventory.whenStable()
    towns.openShop(ShopID.laHarparShop)
    await inventory.whenStable()
    inventory.componentInstance.selectTab('consumables')
    expect(inventory.componentInstance.tab()).toBe('consumables')
  })

  it('keeps the refusal tooltip keyboard-accessible and dismisses it with Escape', async () => {
    player.addItems([stack()])
    select()
    await fixture.whenStable()
    // A headless window never has focus, so `.focus()` fires no focus event; dispatch it directly.
    mergeButton().dispatchEvent(new FocusEvent('focus'))
    // The tooltip library shows and hides after a short transition.
    const tooltipText = () => [...document.querySelectorAll('.tooltip-override.show')].map(tip => tip.textContent).join()
    const settle = () => new Promise(resolve => setTimeout(resolve, 300))
    await settle()
    expect(tooltipText()).toContain('A second copy is chosen automatically')
    mergeButton().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await settle()
    expect(tooltipText()).not.toContain('A second copy is chosen automatically')
  })

  it('reports a later-level failure without advancing the selected upgrade level', () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack()])
    select()
    spyOn(player, 'mergeItem').and.returnValue({ status: 'failure', cost: forge.cost() })
    forge.merge()
    expect(forge.toast()).toContain('Merge failed: Wooden Bow +0 kept its level')
    expect(forge.item()?.upgradeLevel).toBe(0)
  })

  it('clears the selection and unfinished drag when destroyed', () => {
    select()
    selection.dragged.set({ from: 'inventory', item: stack() })
    fixture.destroy()
    expect(selection.selected()).toBeNull()
    expect(selection.dragged()).toBeNull()
  })
})
