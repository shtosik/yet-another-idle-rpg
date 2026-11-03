import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { InventoryItemComponent } from '../../inventory/inventory-slot/inventory-slot.component'
import i18next from 'i18next'
import { ForgeComponent } from './forge.component'
import { PlayerStore } from '../../../../store/player/player.store'
import { tabOf } from '../../../../store/player/inventory'
import { mergeCost } from '../../../../store/player/merge'
import ITEM_DATA from '../../../../../data/items-data'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../../../enums/items/item-tier.enum'
import { InventoryItem } from '../../../../../interfaces/item.interface'
import forgeText from '../../../../../assets/locales/en/forge.json'
import appText from '../../../../../assets/locales/en/app.json'
import itemText from '../../../../../assets/locales/en/items.json'

describe('ForgeComponent', () => {
  let fixture: ComponentFixture<ForgeComponent>
  let forge: ForgeComponent
  let player: InstanceType<typeof PlayerStore>
  const id = ItemID.woodenBow
  const tier = ITEM_DATA[id].tier
  const stack = (amount = 2, upgradeLevel = 0, itemId = id): InventoryItem => ({
    id: itemId, tier: ITEM_DATA[itemId].tier, type: ITEM_DATA[itemId].type, amount, upgradeLevel,
  })

  beforeEach(async () => {
    localStorage.clear()
    await i18next.init({ lng: 'en', resources: { en: { forge: forgeText, app: appText, items: itemText } } })
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
    fixture = TestBed.createComponent(ForgeComponent)
    forge = fixture.componentInstance
  })
  afterEach(() => localStorage.clear())

  async function expectBlocked(label: string): Promise<void> {
    await fixture.whenStable()
    const button: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('button.forge__merge')
    expect(button.disabled).toBeTrue()
    expect(button.textContent.trim()).toBe(label)
    expect(button.getAttribute('aria-label')).toBe(label)
    const merge = spyOn(player, 'mergeItem').and.callThrough()
    forge.merge()
    expect(merge).not.toHaveBeenCalled()
  }

  it('shows a gold refusal on the button and its accessible label', async () => {
    player.addItems([stack()])
    expect(forge.evaluation()).toEqual({ status: 'refused', reason: 'notEnoughGold' })
    await expectBlocked('Not enough gold')
  })

  it('shows the unique gear refusal', async () => {
    player.addItems([stack(2, 0, ItemID.joshsHeirloom)])
    await expectBlocked('Unique gear cannot be upgraded')
  })

  it('shows the upgrade cap refusal', async () => {
    player.addItems([stack(2, 5)])
    await expectBlocked('Already at +5 cap')
  })

  it('requires a second matching copy even when the sole copy is equipped', async () => {
    player.addItems([stack(1)])
    player.equipItem(stack(1))
    expect(forge.groups()[0].amount).toBe(1)
    expect(forge.sacrificeChoices()).toEqual([])
    await expectBlocked('No second matching copy')
  })

  it('does not count different rarities or levels as the second copy', async () => {
    player.addItems([stack(1), stack(1, 1), { ...stack(1), tier: ItemTier.legendary }])
    expect(forge.groups().length).toBe(3)
    expect(forge.groups().map(g => g.amount)).toEqual([1, 1, 1])
    await expectBlocked('No second matching copy')
  })

  it('names the full inventory tab from evaluateMerge', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack(3)])
    player.addItems(Object.values(ITEM_DATA).filter(data => tabOf(data.id) === 'gear' && data.id !== id)
      .slice(0, player.inventoryCapacity().gear - 1).map(data => ({ id: data.id, amount: 1 })))
    expect(forge.evaluation()).toEqual({ status: 'refused', reason: 'inventoryFull', tab: 'gear' })
    await expectBlocked('Inventory full: Gear tab')
  })

  it('excludes pets and non-equipment', () => {
    player.addItems([stack(2, 0, ItemID.petCrab), { id: ItemID.stick, amount: 2 }])
    expect(forge.groups()).toEqual([])
  })

  it('defaults to an equipped base and merges it in place with milestone stats and a toast', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack(2, 4)])
    player.equipItem(stack(1, 4))
    expect(forge.groups()[0].amount).toBe(2)
    expect(forge.base()?.source).toEqual({ from: 'equipped', slot: 'weapon' })
    expect(forge.sacrifice()?.source.from).toBe('inventory')
    await fixture.whenStable()
    expect(fixture.debugElement.nativeElement.querySelector('select').value).toBe('weapon')
    expect(forge.cost()).toBe(mergeCost(ITEM_DATA[id].value, 4))
    expect(forge.chance()).toBe(1)
    expect(forge.statPreview()).toContain({ stat: 'attackPower', amount: 4.2, after: 5.25 })
    await fixture.whenStable()
    fixture.debugElement.nativeElement.querySelector('button.forge__merge').click()
    await fixture.whenStable()
    expect(player.equipment().weapon?.upgradeLevel).toBe(5)
    expect(player.itemCount(id, tier, 4)).toBe(0)
    expect(player.resources.goldCoins()).toBe(100000 - mergeCost(ITEM_DATA[id].value, 4))
    expect(forge.selectedGroup()?.item.upgradeLevel).toBe(5)
    expect(fixture.debugElement.nativeElement.querySelector('[role="status"]').textContent).toContain('Merge succeeded: Wooden Bow +5')
  })

  it('allows the equipped copy to be sacrificed when the base is in inventory', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack(2)])
    player.equipItem(stack(1))
    await fixture.whenStable()
    const select: HTMLSelectElement = fixture.debugElement.nativeElement.querySelector('select')
    select.value = 'inventory'
    select.dispatchEvent(new Event('change'))
    await fixture.whenStable()
    expect(forge.sacrifice()?.source).toEqual({ from: 'equipped', slot: 'weapon' })
    fixture.debugElement.nativeElement.querySelector('button.forge__merge').click()
    await fixture.whenStable()
    expect(player.equipment().weapon).toBeNull()
    expect(player.itemCount(id, tier, 1)).toBe(1)
  })

  it('merges two inventory copies and retains a single copy with the missing-copy refusal', async () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack()])
    forge.merge()
    expect(player.itemCount(id, tier)).toBe(0)
    expect(player.itemCount(id, tier, 1)).toBe(1)
    await expectBlocked('No second matching copy')
  })

  it('opens and dismisses the reused tooltip from the group keyboard focus', async () => {
    player.addItems([stack()])
    await fixture.whenStable()
    const slot: InventoryItemComponent = fixture.debugElement.query(By.directive(InventoryItemComponent)).componentInstance
    const show = spyOn(slot, 'showTooltip').and.callThrough()
    const hide = spyOn(slot, 'hideTooltip').and.callThrough()
    const button: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('button.forge__item')
    button.focus()
    expect(show).toHaveBeenCalled()
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(hide).toHaveBeenCalled()
    hide.calls.reset()
    button.blur()
    expect(hide).toHaveBeenCalled()
  })

  it('reports a later-level failure without treating it as success', () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack()])
    // The shipped +5 cap has no failure roll; exercise feedback for the future store result.
    spyOn(player, 'mergeItem').and.returnValue({ status: 'failure', cost: forge.cost() })
    forge.merge()
    expect(forge.toast()).toContain('Merge failed: Wooden Bow kept its level')
    expect(forge.selectedGroup()?.item.upgradeLevel).toBe(0)
  })

  it('keeps the chosen base when a failed merge rebuilds the groups', () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
    player.addItems([stack(4)])
    player.equipItem(stack(1))
    forge.chooseBase('inventory')
    spyOn(player, 'mergeItem').and.callFake(() => {
      player.removeItems([stack(1)])
      return { status: 'failure', cost: forge.cost() }
    })
    forge.merge()
    expect(forge.base()?.key).toBe('inventory')
  })
})
