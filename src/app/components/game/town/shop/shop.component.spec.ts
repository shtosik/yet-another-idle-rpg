import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ShopComponent } from './shop.component'
import { ShopID } from '../../../../../enums/ids/shop-id.enum'

describe('ShopComponent', () => {
  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
  })

  afterEach(() => localStorage.clear())

  it('renders a slot per stocked item', async () => {
    const fixture = TestBed.createComponent(ShopComponent)
    fixture.componentRef.setInput('shopId', ShopID.laHarparShop)
    await fixture.whenStable()
    expect(fixture.nativeElement.querySelectorAll('.shop__item').length).toBeGreaterThan(0)
  })
})
