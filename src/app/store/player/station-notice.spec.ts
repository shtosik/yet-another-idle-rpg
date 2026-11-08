import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { PlayerStore } from './player.store'
import { emptyKillBatch } from './kill-rewards'
import { ModalService } from '../../services/modal.service'
import ITEM_DATA from '../../../data/items-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'

describe('Station installed notice', () => {
  let player: InstanceType<typeof PlayerStore>
  let modal: jasmine.SpyObj<ModalService>

  beforeEach(() => {
    localStorage.clear()
    modal = jasmine.createSpyObj<ModalService>('ModalService', ['openStationInstalled'])
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: ModalService, useValue: modal }] })
    player = TestBed.inject(PlayerStore)
  })

  afterEach(() => localStorage.clear())

  it('shows once per install, whoever gave the gear', () => {
    player.grant([{ id: ItemID.firePit, amount: 1 }], 'lossy')
    expect(modal.openStationInstalled).toHaveBeenCalledOnceWith(ItemID.firePit)

    player.grant([{ id: ItemID.firePit, amount: 1 }], 'lossy')
    expect(modal.openStationInstalled).toHaveBeenCalledTimes(1)
  })

  it('shows for station gear in a kill batch', () => {
    player.applyKillBatch({ ...emptyKillBatch(ZoneID.horseshoeBeach, 1), items: [{ id: ItemID.firePit, type: ITEM_DATA[ItemID.firePit].type, tier: ITEM_DATA[ItemID.firePit].tier, amount: 1 }] })
    expect(modal.openStationInstalled).toHaveBeenCalledOnceWith(ItemID.firePit)
  })
})
