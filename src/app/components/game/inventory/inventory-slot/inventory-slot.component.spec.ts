import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { InventoryItemComponent } from './inventory-slot.component'
import ITEM_DATA from 'data/items-data'
import { ItemID } from 'enums/ids/item-id.enum'
import i18next from 'i18next'
import itemText from '../../../../../assets/locales/en/items.json'

describe('InventoryItemComponent', () => {
  let fixture: ComponentFixture<InventoryItemComponent>
  let equip: jasmine.Spy

  const action = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.item__action')
  const click = (detail: number) => action().dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))

  beforeAll(async () => {
    await i18next.init({ lng: 'en', resources: { en: { items: itemText } } })
  })

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    fixture = TestBed.createComponent(InventoryItemComponent)
    const item = ITEM_DATA[ItemID.knife]
    fixture.componentRef.setInput('item', item)
    fixture.componentRef.setInput('tier', item.tier)
    fixture.componentRef.setInput('amount', 1)
    equip = spyOn(fixture.componentInstance.equipItem, 'emit')
    await fixture.whenStable()
  })

  it('shows the item description in the tooltip when its key exists', async () => {
    i18next.addResource('en', 'items', 'descriptions.knife', 'A test blade.')
    try {
      fixture.componentInstance.showTooltip()
      await new Promise(resolve => setTimeout(resolve, 300)) // the tooltip library shows after a short transition
      expect([...document.querySelectorAll('.tooltip-override.show')].map(tip => tip.textContent).join()).toContain('A test blade.')
    } finally {
      fixture.componentInstance.hideTooltip()
      i18next.removeResourceBundle('en', 'items')
      i18next.addResourceBundle('en', 'items', itemText)
    }
  })

  it('ignores a mouse left-click', () => {
    click(1)
    expect(equip).not.toHaveBeenCalled()
  })

  it('equips on keyboard or assistive-technology activation (click with detail 0)', () => {
    click(0)
    expect(equip).toHaveBeenCalled()
  })

  it('renders no action button when not clickable', async () => {
    fixture.componentRef.setInput('clickable', false)
    await fixture.whenStable()
    expect(action()).toBeNull()
  })

  it('includes +N in the slot and accessible name, marking only the milestone', async () => {
    fixture.componentRef.setInput('upgradeLevel', 4)
    await fixture.whenStable()
    const element: HTMLElement = fixture.nativeElement
    expect(action().getAttribute('aria-label')).toContain('Knife +4')
    expect(element.querySelector('.upgrade-level')?.textContent).toBe('+4')
    expect(element.querySelector('.milestone-mark')).toBeNull()
    fixture.componentRef.setInput('upgradeLevel', 5)
    await fixture.whenStable()
    expect(element.querySelector('.item--milestone')).not.toBeNull()
    expect(element.querySelector('.milestone-mark')?.getAttribute('aria-label')).toBe('Upgrade level +5 milestone')
    fixture.componentRef.setInput('upgradeLevel', 0)
    await fixture.whenStable()
    expect(element.querySelector('.upgrade-level')).toBeNull()
    expect(element.querySelector('.milestone-mark')).toBeNull()
  })
})
