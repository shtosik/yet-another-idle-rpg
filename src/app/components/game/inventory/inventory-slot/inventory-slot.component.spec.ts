import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { InventoryItemComponent } from './inventory-slot.component'
import ITEM_DATA from 'data/items-data'
import { ItemID } from 'enums/ids/item-id.enum'

describe('InventoryItemComponent', () => {
  let fixture: ComponentFixture<InventoryItemComponent>
  let equip: jasmine.Spy

  const action = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.item__action')
  const click = (detail: number) => action().dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))

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
})
