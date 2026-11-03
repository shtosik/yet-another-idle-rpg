import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import i18next from 'i18next'
import { ForgeComponent } from './forge.component'
import { InventoryWindow } from '../../inventory/inventory.component'
import { EquipmentComponent } from '../../equipment/equipment.component'
import { ForgeInput, ForgeSelection } from '../../../../services/forge-selection'
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
  const select = (item = stack()) => selection.select({
    from: 'inventory', item: { id: item.id, tier: item.tier, upgradeLevel: item.upgradeLevel },
  })
  const selectPair = (item = stack()) => {
    select(item)
    select(item)
  }
  const mergeButton = (): HTMLButtonElement => fixture.nativeElement.querySelector('.forge__merge')
  const output = (): HTMLElement => fixture.nativeElement.querySelector('.forge__output')
  const inputButton = (slot: ForgeInput): HTMLButtonElement => fixture.nativeElement.querySelector(`[data-input="${slot}"]`)

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
    expect(button.textContent.trim()).toBe('Upgrade')
    expect(button.getAttribute('aria-label')).toContain(label)
    const merge = spyOn(player, 'mergeItem').and.callThrough()
    button.click()
    expect(merge).not.toHaveBeenCalled()
  }

  async function drag(source: HTMLElement, slot: ForgeInput): Promise<void> {
    const dataTransfer = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }))
    const input = inputButton(slot)
    const over = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer })
    input.dispatchEvent(over)
    expect(over.defaultPrevented).toBeTrue()
    input.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }))
    source.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer }))
    await fixture.whenStable()
  }

  it('starts empty and explains how to select gear', async () => {
    expect(forge.item()).toBeNull()
    expect(forge.sacrificeItem()).toBeNull()
    expect(forge.preview()).toBeNull()
    await expectBlocked('Select gear')
  })

  it('shows a gold refusal in the accessible label while retaining the compact Upgrade text', async () => {
    player.addItems([stack()])
    selectPair()
    expect(forge.evaluation()).toEqual({ status: 'refused', reason: 'notEnoughGold' })
    expect(forge.preview()?.upgradeLevel).toBe(1)
    await expectBlocked('Not enough gold')
    expect(fixture.nativeElement.querySelector('.forge__cost').classList).toContain('forge__cost--short')
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    await fixture.whenStable()
    expect(fixture.nativeElement.querySelector('.forge__cost').classList).not.toContain('forge__cost--short')
  })

  it('explains unique gear', async () => {
    player.addItems([stack(2, 0, ItemID.joshsHeirloom)])
    selectPair(stack(2, 0, ItemID.joshsHeirloom))
    expect(forge.preview()).toBeNull()
    await expectBlocked('Unique gear cannot be upgraded')
  })

  it('explains the cap without previewing an unavailable +6', async () => {
    player.addItems([stack(2, 5)])
    selectPair(stack(2, 5))
    expect(forge.preview()).toBeNull()
    await expectBlocked('Already at +5 cap')
  })

  it('ignores a second activation of the same equipped slot', async () => {
    player.addItems([stack(1)])
    player.equipItem(stack(1))
    selection.select({ from: 'equipped', slot: 'weapon' })
    selection.select({ from: 'equipped', slot: 'weapon' })
    expect(selection.base()).toEqual({ from: 'equipped', slot: 'weapon' })
    expect(selection.sacrifice()).toBeNull()
    expect(forge.preview()).toBeNull()
    await expectBlocked('Select gear')
  })

  for (const [difference, other] of [
    ['id', stack(1, 0, ItemID.makeshiftClub)],
    ['rarity', { ...stack(1), tier: ItemTier.legendary }],
    ['upgrade level', stack(1, 1)],
  ] as const) {
    it(`refuses a different ${difference} and marks both inputs`, async () => {
      player.addItems([stack(1), other])
      select(stack(1))
      select(other)
      expect(forge.evaluation()).toEqual({ status: 'refused', reason: 'mismatch' })
      expect(forge.preview()).toBeNull()
      await expectBlocked('Copies must match')
      expect(inputButton('base').classList).toContain('forge__slot--mismatch')
      expect(inputButton('sacrifice').classList).toContain('forge__slot--mismatch')
      inputButton('sacrifice').click()
      await fixture.whenStable()
      expect(inputButton('base').classList).not.toContain('forge__slot--mismatch')
    })
  }

  it('names the full inventory tab from evaluateMerge', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack(3)])
    player.addItems(Object.values(ITEM_DATA).filter(data => tabOf(data.id) === 'gear' && data.id !== id)
      .slice(0, player.inventoryCapacity().gear - 1).map(data => ({ id: data.id, amount: 1 })))
    selectPair(stack(3))
    expect(forge.evaluation()).toEqual({ status: 'refused', reason: 'inventoryFull', tab: 'gear' })
    expect(forge.preview()?.upgradeLevel).toBe(1)
    await expectBlocked('Inventory full: Gear tab')
  })

  it('drops into explicit inputs, previews milestone stats and upgrades an equipped base in place', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack(2, 4)])
    player.equipItem(stack(1, 4))
    const inventory = TestBed.createComponent(InventoryWindow)
    const equipment = TestBed.createComponent(EquipmentComponent)
    await inventory.whenStable()
    await equipment.whenStable()
    await fixture.whenStable()
    await drag(inventory.nativeElement.querySelector('.item__action'), 'sacrifice')
    expect(forge.base()).toBeNull()
    expect(forge.sacrifice()?.from).toBe('inventory')
    expect(forge.preview()).toBeNull()
    await drag(equipment.nativeElement.querySelector('[style*="weapon"] button'), 'base')
    expect(forge.base()).toEqual({ from: 'equipped', slot: 'weapon' })
    expect(forge.sacrifice()?.from).toBe('inventory')
    expect(forge.cost()).toBe(mergeCost(ITEM_DATA[id].value, 4))
    expect(forge.chance()).toBe(0.6)
    expect(forge.statPreview()).toContain({ stat: 'attackPower', amount: 4.2, after: 5.25 })
    expect(fixture.nativeElement.querySelector('.forge__output').getAttribute('aria-label')).toContain('Wooden Bow +5')
    expect(player.equipment().weapon?.upgradeLevel).toBe(4)
    expect(player.itemCount(id, tier, 4)).toBe(1)
    // +5 is no longer certain; pin the roll to a success.
    spyOn(Math, 'random').and.returnValue(0)
    mergeButton().click()
    await fixture.whenStable()
    expect(player.equipment().weapon?.upgradeLevel).toBe(5)
    expect(player.itemCount(id, tier, 4)).toBe(0)
    expect(player.resources.goldCoins()).toBe(100000 - mergeCost(ITEM_DATA[id].value, 4))
    expect(forge.item()?.upgradeLevel).toBe(5)
    expect(selection.base()).toEqual({ from: 'equipped', slot: 'weapon' })
    expect(selection.sacrifice()).toBeNull()
    expect(forge.preview()).toBeNull()
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Upgrade succeeded: Wooden Bow +5')
    expect(selection.dragged()).toBeNull()
  })

  it('consumes an equipped copy dropped into the second input and follows the inventory result', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack(3)])
    player.equipItem(stack(1))
    const equipment = TestBed.createComponent(EquipmentComponent)
    await equipment.whenStable()
    await fixture.whenStable()
    select(stack(2))
    await drag(equipment.nativeElement.querySelector('[style*="weapon"] button'), 'sacrifice')
    expect(forge.base()?.from).toBe('inventory')
    expect(forge.sacrifice()).toEqual({ from: 'equipped', slot: 'weapon' })
    mergeButton().click()
    expect(player.equipment().weapon).toBeNull()
    expect(player.itemCount(id, tier, 0)).toBe(1)
    expect(player.itemCount(id, tier, 1)).toBe(1)
    expect(selection.base()).toEqual({ from: 'inventory', item: { id, tier, upgradeLevel: 1 } })
    expect(selection.sacrifice()).toBeNull()
  })

  it('fills both inputs by clicking the same inventory stack twice and follows the upgraded result', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack()])
    const inventory = TestBed.createComponent(InventoryWindow)
    await inventory.whenStable()
    await fixture.whenStable()
    const button: HTMLButtonElement = inventory.nativeElement.querySelector('.item__action')
    button.click()
    expect(forge.base()?.from).toBe('inventory')
    expect(forge.sacrifice()).toBeNull()
    expect(forge.preview()).toBeNull()
    button.click()
    expect(forge.sacrifice()).toEqual(forge.base())
    expect(forge.evaluation()?.status).toBe('ready')
    forge.merge()
    expect(player.itemCount(id, tier)).toBe(0)
    expect(player.itemCount(id, tier, 1)).toBe(1)
    expect(forge.item()?.upgradeLevel).toBe(1)
    expect(selection.sacrifice()).toBeNull()
    await expectBlocked('Select gear')
  })

  it('does not put a single owned copy into both inputs', async () => {
    player.addItems([stack(1)])
    selectPair(stack(1))
    expect(forge.base()?.from).toBe('inventory')
    expect(forge.sacrifice()).toBeNull()
    expect(forge.preview()).toBeNull()
    await expectBlocked('Select gear')
  })

  it('does not reuse the only upgraded copy as the sacrifice after an upgrade', () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack()])
    selectPair()
    forge.merge()
    expect(player.itemCount(id, tier, 1)).toBe(1)
    select(stack(1, 1))
    expect(forge.base()?.from).toBe('inventory')
    expect(forge.sacrifice()).toBeNull()
  })

  it('fills an empty first input before replacing the second when both inputs are full', () => {
    selectPair()
    const original = selection.base()
    select(stack(1, 1))
    expect(selection.base()).toBe(original)
    expect(forge.sacrificeItem()?.upgradeLevel).toBe(1)
    selection.setSlot('base', null)
    select(stack(1, 2))
    expect(forge.item()?.upgradeLevel).toBe(2)
    expect(forge.sacrificeItem()?.upgradeLevel).toBe(1)
  })

  it('ignores a targeted drop of the same equipped slot into the other input', async () => {
    player.addItems([stack(1)])
    player.equipItem(stack(1))
    const equipment = TestBed.createComponent(EquipmentComponent)
    await equipment.whenStable()
    await fixture.whenStable()
    const source = equipment.nativeElement.querySelector('[style*="weapon"] button')
    await drag(source, 'sacrifice')
    await drag(source, 'base')
    expect(selection.base()).toBeNull()
    expect(selection.sacrifice()).toEqual({ from: 'equipped', slot: 'weapon' })
    expect(selection.dragged()).toBeNull()
  })

  it('ignores external drops without an in-game source', async () => {
    await fixture.whenStable()
    fixture.nativeElement.querySelector('.forge__input').dispatchEvent(new DragEvent('drop', { dataTransfer: new DataTransfer() }))
    expect(forge.item()).toBeNull()
    expect(forge.sacrificeItem()).toBeNull()
  })

  it('uses click and keyboard activation to select inventory gear instead of equipping it', async () => {
    player.addItems([stack()])
    const inventory = TestBed.createComponent(InventoryWindow)
    await inventory.whenStable()
    const button: HTMLButtonElement = inventory.nativeElement.querySelector('.item__action')
    for (const detail of [1, 0]) {
      selection.clear()
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))
      expect(forge.item()?.id).toBe(id)
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))
      expect(forge.sacrificeItem()?.id).toBe(id)
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
      selection.clear()
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))
      expect(selection.base()).toEqual({ from: 'equipped', slot: 'weapon' })
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))
      expect(selection.sacrifice()).toBeNull()
      expect(player.equipment().weapon?.id).toBe(id)
    }
  })

  it('empties each filled input on mouse or keyboard activation, and focuses Gear from an empty input', async () => {
    const focusGear = spyOn(forge, 'focusGear')
    player.addItems([stack()])
    await fixture.whenStable()
    for (const detail of [1, 0]) {
      selectPair()
      const sacrifice = selection.sacrifice()
      inputButton('base').dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))
      expect(selection.base()).toBeNull()
      expect(selection.sacrifice()).toBe(sacrifice)
      inputButton('sacrifice').dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))
      expect(selection.sacrifice()).toBeNull()
      expect(focusGear).not.toHaveBeenCalled()
      inputButton('base').dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))
      inputButton('sacrifice').dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))
      expect(focusGear).toHaveBeenCalledTimes(2)
      focusGear.calls.reset()
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

  it('shows the refusal in the output tooltip, keyboard-accessible, and dismisses it with Escape', async () => {
    player.addItems([stack()])
    selectPair()
    await fixture.whenStable()
    // A headless window never has focus, so `.focus()` fires no focus event; dispatch it directly.
    output().dispatchEvent(new FocusEvent('focus'))
    // The tooltip library shows and hides after a short transition.
    const tooltipText = () => [...document.querySelectorAll('.tooltip-override.show')].map(tip => tip.textContent).join()
    const settle = () => new Promise(resolve => setTimeout(resolve, 300))
    await settle()
    expect(tooltipText()).toContain('Not enough gold')
    output().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await settle()
    expect(tooltipText()).not.toContain('Not enough gold')
  })

  for (const source of ['inventory', 'equipped']) {
    it(`clears only the sacrifice after a failure with an ${source} base`, () => {
      player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
      player.addItems([stack(3)])
      if (source === 'equipped') {
        player.equipItem(stack(1))
        selection.select({ from: 'equipped', slot: 'weapon' })
      } else select()
      select()
      const base = selection.base()
      // Current levels always succeed; simulate the store's later-level failure response.
      spyOn(player, 'mergeItem').and.returnValue({ status: 'failure', cost: forge.cost() })
      forge.merge()
      expect(forge.toast()).toContain('Upgrade failed: Wooden Bow +0 kept its level')
      expect(forge.item()?.upgradeLevel ?? 0).toBe(0)
      expect(selection.base()).toBe(base)
      expect(selection.sacrifice()).toBeNull()
      expect(forge.preview()).toBeNull()
    })
  }

  it('keeps both inputs if the store refuses an attempt', () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack()])
    selectPair()
    const base = selection.base()
    const sacrifice = selection.sacrifice()
    spyOn(player, 'mergeItem').and.returnValue({ status: 'refused', reason: 'missingCopy' })
    forge.merge()
    expect(selection.base()).toBe(base)
    expect(selection.sacrifice()).toBe(sacrifice)
    expect(forge.toast()).toBeNull()
  })

  it('clears the selection and unfinished drag when destroyed', () => {
    selectPair()
    selection.dragged.set({ from: 'inventory', item: stack() })
    fixture.destroy()
    expect(selection.base()).toBeNull()
    expect(selection.sacrifice()).toBeNull()
    expect(selection.dragged()).toBeNull()
  })
})
