import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import i18next from 'i18next'
import { EquipmentComponent } from './equipment.component'
import { PlayerStore } from '../../../store/player/player.store'
import ITEM_DATA from 'data/items-data'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemType } from 'enums/items/item-type.enum'
import { EquipmentSlot } from 'enums/equipment-slot.enum'
import appText from '../../../../assets/locales/en/app.json'
import itemText from '../../../../assets/locales/en/items.json'

describe('EquipmentComponent', () => {
    let fixture: ComponentFixture<EquipmentComponent>
    let store: InstanceType<typeof PlayerStore>
    let element: HTMLElement

    beforeAll(async () => {
        await i18next.init({ lng: 'en', resources: { en: { app: appText, items: itemText } } })
    })

    beforeEach(async () => {
        localStorage.clear()
        TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
        store = TestBed.inject(PlayerStore)
        fixture = TestBed.createComponent(EquipmentComponent)
        element = fixture.nativeElement
        await fixture.whenStable()
    })

    afterEach(() => localStorage.clear())

    const weaponButton = () => element.querySelector<HTMLButtonElement>('[style*="weapon"] button')
    const rightClick = (button: HTMLElement) => button.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    const equip = (id: ItemID) => {
        const item = ITEM_DATA[id]
        store.addItems([{ id, tier: item.tier, amount: 1 }])
        store.equipItem({ id, type: item.type, tier: item.tier, amount: 1 })
    }

    it('renders every saved slot once, with a readable empty state and no unequip action', () => {
        const slots = fixture.componentInstance.slots
        expect(Object.keys(store.equipment()).sort()).toEqual([...slots].sort())
        expect(element.querySelectorAll('app-slot').length).toBe(11)
        expect(fixture.componentInstance.equippedCount()).toBe(0)
        expect(weaponButton().getAttribute('aria-label')).toBe('Weapon: Empty')
        expect(weaponButton().getAttribute('aria-disabled')).toBe('true')
        expect(weaponButton().getAttribute('aria-description')).toContain('matching gear')
        const unequip = spyOn(store, 'unequipItem')
        rightClick(weaponButton())
        expect(unequip).not.toHaveBeenCalled()
    })

    it('updates the art, rarity, accessible name and count when gear is equipped or swapped', async () => {
        equip(ItemID.knife)
        await fixture.whenStable()
        expect(weaponButton().getAttribute('aria-label')).toBe('Weapon: Knife')
        expect(weaponButton().getAttribute('aria-disabled')).toBe('false')
        expect(fixture.componentInstance.equippedCount()).toBe(1)

        equip(ItemID.stormcaller)
        await fixture.whenStable()
        expect(weaponButton().querySelector('img').getAttribute('src')).toContain('stormcaller')
        expect(weaponButton().getAttribute('data-tier')).toBe('legendary')
        expect(weaponButton().getAttribute('aria-label')).toBe('Weapon: Stormcaller')
        expect(fixture.componentInstance.equippedCount()).toBe(1)
        expect(store.inventory().gear.some(item => item?.id === ItemID.knife)).toBeTrue()
    })

    it('ignores left-click so a stray click cannot unequip', async () => {
        equip(ItemID.knife)
        await fixture.whenStable()
        weaponButton().click()
        expect(store.equipment().weapon?.id).toBe(ItemID.knife)
    })

    it('unequips with Enter from the keyboard', async () => {
        equip(ItemID.knife)
        await fixture.whenStable()
        weaponButton().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
        expect(store.equipment().weapon).toBeNull()
    })

    it('unequips on right-click and returns the item to inventory', async () => {
        equip(ItemID.knife)
        await fixture.whenStable()
        rightClick(weaponButton())
        await fixture.whenStable()
        expect(store.equipment().weapon).toBeNull()
        expect(store.inventory().gear.some(item => item?.id === ItemID.knife)).toBeTrue()
        expect(fixture.componentInstance.equippedCount()).toBe(0)
        expect(weaponButton().getAttribute('aria-label')).toBe('Weapon: Empty')
    })

    it('keeps blocked gear inspectable and prevents unequipping into a full inventory', async () => {
        equip(ItemID.knife)
        const gear = Object.values(ITEM_DATA)
            .filter(item => item.type === ItemType.equipment && item.slot !== EquipmentSlot.pet && item.id !== ItemID.knife)
            .slice(0, store.inventoryCapacity().gear)
        store.addItems(gear.map(item => ({ id: item.id, tier: item.tier, amount: 1 })))
        await fixture.whenStable()
        expect(store.canUnequip('weapon')).toBeFalse()
        expect(weaponButton().disabled).toBeFalse()
        expect(weaponButton().getAttribute('aria-disabled')).toBe('true')
        expect(weaponButton().getAttribute('aria-description')).toContain('free up space')
        rightClick(weaponButton())
        expect(store.equipment().weapon?.id).toBe(ItemID.knife)
    })
})

